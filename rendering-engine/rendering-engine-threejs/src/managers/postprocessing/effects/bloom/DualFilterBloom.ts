import {type BloomEffect, MipmapBlurPass} from "postprocessing";
import {
	NoBlending,
	ShaderMaterial,
	SRGBColorSpace,
	type Texture,
	type TextureDataType,
	Uniform,
	UnsignedByteType,
	Vector2,
	type WebGLRenderer,
	WebGLRenderTarget,
} from "three";

/**
 * The resolution of each blur level of the dual-filter bloom, relative to the
 * frame: the thresholded frame itself, then 1/4, 1/8 and 1/16.
 */
export const DUAL_FILTER_LEVEL_SCALES: readonly number[] = [
	1,
	1 / 4,
	1 / 8,
	1 / 16,
];

/**
 * The weight of each blur level, from the full-resolution level to the
 * coarsest. They rise linearly from 0.5 to 0.7 and sum to 2.4: at the same
 * intensity the bloom adds 2.4 times the light it lets through the threshold.
 */
export const DUAL_FILTER_LEVEL_WEIGHTS: readonly number[] = [
	0.5,
	0.5 + 0.2 / 3,
	0.5 + 0.4 / 3,
	0.7,
];

/** Each input channel is clamped at this value before the threshold. */
export const DUAL_FILTER_INPUT_LIMIT = 16;

const FULLSCREEN_VERTEX_SHADER =
	"varying vec2 vUv;void main(){vUv=position.xy*0.5+0.5;gl_Position=vec4(position.xy,1.0,1.0);}";

const PRECISION = [
	"#ifdef FRAMEBUFFER_PRECISION_HIGH",
	"uniform mediump sampler2D inputBuffer;",
	"#else",
	"uniform lowp sampler2D inputBuffer;",
	"#endif",
].join("\n");

/**
 * The threshold stage. Averages four diagonal neighbours (taps at +-1 texel,
 * each channel clamped at `DUAL_FILTER_INPUT_LIMIT`), takes the brightest
 * channel as the brightness and keeps the part above `threshold`, with a soft
 * knee of `threshold * smoothing` on each side. With a depth buffer, pixels
 * where no geometry was drawn are masked.
 */
const PREFILTER_FRAGMENT_SHADER = [
	"#include <common>",
	"#include <packing>",
	PRECISION,
	"#ifdef SD_DEPTH_MASK",
	"uniform highp sampler2D depthBuffer;",
	"#endif",
	"uniform float threshold;uniform float smoothing;varying vec2 vUv;",
	`vec4 sdSample(const in vec2 uv){return min(texture2D(inputBuffer,uv),vec4(${DUAL_FILTER_INPUT_LIMIT.toFixed(1)}));}`,
	"void main(){",
	"vec2 texel=1.0/vec2(textureSize(inputBuffer,0));",
	"vec4 c=0.25*(sdSample(vUv+texel*vec2(-1.0,-1.0))+sdSample(vUv+texel*vec2(1.0,-1.0))+sdSample(vUv+texel*vec2(-1.0,1.0))+sdSample(vUv+texel*vec2(1.0,1.0)));",
	"float b=max(c.r,max(c.g,c.b));",
	"#ifdef FRAMEBUFFER_PRECISION_HIGH",
	"float t=threshold;",
	"#else",
	// nothing exceeds 1 in 8-bit buffers
	"float t=min(threshold,0.8);",
	"#endif",
	"float knee=max(t*smoothing,1e-4);",
	"float soft=clamp(b-t+knee,0.0,2.0*knee);",
	"soft=soft*soft/(16.0*knee);",
	"float mask=max(soft,b-t)/max(b,1e-3);",
	"#ifdef SD_DEPTH_MASK",
	"#ifdef DEPTH_PACKING_RGBA",
	"float backgroundDepth=unpackRGBAToDepth(texture2D(depthBuffer,vUv));",
	"#else",
	"float backgroundDepth=texture2D(depthBuffer,vUv).r;",
	"#endif",
	"mask*=1.0-step(1.0,backgroundDepth);",
	"#endif",
	// alpha as the stock luminance shader: a transparent background stays transparent
	"gl_FragColor=c*mask;",
	"}",
].join("\n");

/** Downsampling: four bilinear taps at +-1 texel of the finer level. */
const DOWNSAMPLING_FRAGMENT_SHADER = [
	PRECISION,
	"uniform vec2 texelSize;varying vec2 vUv;",
	"void main(){",
	"gl_FragColor=0.25*(texture2D(inputBuffer,vUv+texelSize*vec2(-1.0,-1.0))+texture2D(inputBuffer,vUv+texelSize*vec2(1.0,-1.0))+texture2D(inputBuffer,vUv+texelSize*vec2(-1.0,1.0))+texture2D(inputBuffer,vUv+texelSize*vec2(1.0,1.0)));",
	"#include <colorspace_fragment>",
	"}",
].join("\n");

/**
 * Upsampling: the weighted level plus four bilinear taps at +-0.5 texel of the
 * coarser level.
 */
const UPSAMPLING_FRAGMENT_SHADER = [
	PRECISION,
	"#ifdef FRAMEBUFFER_PRECISION_HIGH",
	"uniform mediump sampler2D supportBuffer;",
	"#else",
	"uniform lowp sampler2D supportBuffer;",
	"#endif",
	"uniform vec2 texelSize;uniform float baseWeight;uniform float inputWeight;varying vec2 vUv;",
	"void main(){",
	"vec4 c=0.25*(texture2D(inputBuffer,vUv+texelSize*vec2(-0.5,-0.5))+texture2D(inputBuffer,vUv+texelSize*vec2(0.5,-0.5))+texture2D(inputBuffer,vUv+texelSize*vec2(-0.5,0.5))+texture2D(inputBuffer,vUv+texelSize*vec2(0.5,0.5)));",
	"gl_FragColor=baseWeight*texture2D(supportBuffer,vUv)+inputWeight*c;",
	"#include <colorspace_fragment>",
	"}",
].join("\n");

const createMaterial = (
	fragmentShader: string,
	uniforms: {[name: string]: Uniform},
): ShaderMaterial =>
	new ShaderMaterial({
		name: "DualFilterBloomMaterial",
		uniforms,
		vertexShader: FULLSCREEN_VERTEX_SHADER,
		fragmentShader,
		blending: NoBlending,
		depthWrite: false,
		depthTest: false,
	});

/**
 * The blur of the dual-filter bloom. It replaces the mipmap blur of a bloom
 * effect and reads the output of the threshold stage at full resolution.
 *
 * The thresholded frame is downsampled to 1/4, 1/8 and 1/16 of the frame (four
 * bilinear taps at +-1 texel of the finer level), then each level is weighted
 * with `DUAL_FILTER_LEVEL_WEIGHTS` and the coarser levels are added back up
 * (four taps at +-0.5 texel) into a full-resolution target.
 */
export class DualFilterBlurPass extends MipmapBlurPass {
	// #region Properties (5)

	private readonly _downsampled: WebGLRenderTarget[];
	private readonly _downsamplingMaterial: ShaderMaterial;
	/** Level 0 after the upsampling, at full resolution: what the bloom composite reads. */
	private readonly _output = new WebGLRenderTarget(1, 1, {
		depthBuffer: false,
	});
	private readonly _upsampled: WebGLRenderTarget[];
	private readonly _upsamplingMaterial: ShaderMaterial;

	// #endregion Properties (5)

	// #region Constructors (1)

	constructor() {
		super();
		this.name = "DualFilterBlurPass";

		const levels = DUAL_FILTER_LEVEL_SCALES.length;
		const target = () => new WebGLRenderTarget(1, 1, {depthBuffer: false});
		// levels 1 .. n-1, level 0 is the input
		this._downsampled = Array.from({length: levels - 1}, target);
		// levels 1 .. n-2, level 0 is _output and the coarsest level enters with its weight
		this._upsampled = Array.from({length: levels - 2}, target);

		this._downsamplingMaterial = createMaterial(
			DOWNSAMPLING_FRAGMENT_SHADER,
			{
				inputBuffer: new Uniform(null),
				texelSize: new Uniform(new Vector2()),
			},
		);
		this._upsamplingMaterial = createMaterial(UPSAMPLING_FRAGMENT_SHADER, {
			inputBuffer: new Uniform(null),
			supportBuffer: new Uniform(null),
			texelSize: new Uniform(new Vector2()),
			baseWeight: new Uniform(1),
			inputWeight: new Uniform(1),
		});
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (1)

	public override get texture(): Texture {
		return this._output.texture;
	}

	// #endregion Public Getters And Setters (1)

	// #region Public Methods (4)

	public override dispose(): void {
		super.dispose();
		for (const target of [
			this._output,
			...this._downsampled,
			...this._upsampled,
		])
			target.dispose();
		this._downsamplingMaterial.dispose();
		this._upsamplingMaterial.dispose();
	}

	public override initialize(
		renderer: WebGLRenderer,
		alpha: boolean,
		frameBufferType: number,
	): void {
		if (frameBufferType === undefined) return;
		const targets = [
			this._output,
			...this._downsampled,
			...this._upsampled,
		];
		for (const target of targets)
			target.texture.type = frameBufferType as TextureDataType;
		if (frameBufferType !== UnsignedByteType) {
			this._downsamplingMaterial.defines.FRAMEBUFFER_PRECISION_HIGH = "1";
			this._upsamplingMaterial.defines.FRAMEBUFFER_PRECISION_HIGH = "1";
		} else if (
			renderer !== null &&
			renderer.outputColorSpace === SRGBColorSpace
		) {
			for (const target of targets)
				target.texture.colorSpace = SRGBColorSpace;
		}
	}

	public override render(
		renderer: WebGLRenderer,
		inputBuffer: WebGLRenderTarget,
	): void {
		const weights = DUAL_FILTER_LEVEL_WEIGHTS;
		const down = this._downsamplingMaterial;
		const up = this._upsamplingMaterial;

		this.fullscreenMaterial = down;
		let previous = inputBuffer;
		for (const target of this._downsampled) {
			down.uniforms.inputBuffer.value = previous.texture;
			(down.uniforms.texelSize.value as Vector2).set(
				1 / previous.width,
				1 / previous.height,
			);
			renderer.setRenderTarget(target);
			renderer.render(this.scene, this.camera);
			previous = target;
		}

		// level i = weight i * downsampled level i + upsampled level i + 1
		this.fullscreenMaterial = up;
		const last = weights.length - 1;
		for (let level = last - 1; level >= 0; level--) {
			const support: Texture =
				level === 0
					? inputBuffer.texture
					: this._downsampled[level - 1].texture;
			const target =
				level === 0 ? this._output : this._upsampled[level - 1];
			up.uniforms.inputBuffer.value = previous.texture;
			up.uniforms.supportBuffer.value = support;
			(up.uniforms.texelSize.value as Vector2).set(
				1 / previous.width,
				1 / previous.height,
			);
			up.uniforms.baseWeight.value = weights[level];
			up.uniforms.inputWeight.value =
				level === last - 1 ? weights[last] : 1;
			renderer.setRenderTarget(target);
			renderer.render(this.scene, this.camera);
			previous = target;
		}
	}

	public override setSize(width: number, height: number): void {
		this._output.setSize(width, height);
		DUAL_FILTER_LEVEL_SCALES.slice(1).forEach((scale, i) => {
			const w = Math.max(1, Math.floor(width * scale));
			const h = Math.max(1, Math.floor(height * scale));
			this._downsampled[i].setSize(w, h);
			if (i < this._upsampled.length) this._upsampled[i].setSize(w, h);
		});
	}

	// #endregion Public Methods (4)
}

/**
 * Turns a bloom effect into the dual-filter bloom: a threshold on the
 * brightest channel of a slightly blurred, clamped frame, and a blur that adds
 * weighted levels at full, 1/4, 1/8 and 1/16 resolution. At the same
 * intensity it adds about 2.4 times the light let through the threshold; the
 * glow is wider and softer than the mipmap blur's.
 *
 * `luminanceSmoothing` is the soft knee relative to `luminanceThreshold` (0.5:
 * the knee reaches half the threshold below and above it). `highlightLimit`
 * and the mipmap blur radius have no effect; each channel is clamped at
 * `DUAL_FILTER_INPUT_LIMIT` instead. Pixels where no geometry was drawn are
 * masked when the effect reads the depth buffer (`backgroundBloom: false`).
 *
 * If the stock bloom shader changes and the composite anchor is missing, the
 * effect stays unchanged.
 *
 * @param effect The bloom effect to change.
 */
export function applyDualFilterBloom(effect: BloomEffect): void {
	const compositeAnchor = "outputColor=texture2D(map,uv)*intensity;";
	const fragmentShader = effect.getFragmentShader();
	if (!fragmentShader.includes(compositeAnchor)) return;

	// replace the mipmap blur, which BloomEffect sizes, initializes and renders
	const blurPass = new DualFilterBlurPass();
	const writable = effect as unknown as {mipmapBlurPass: MipmapBlurPass};
	writable.mipmapBlurPass.dispose();
	writable.mipmapBlurPass = blurPass;
	blurPass.enabled = true;
	effect.uniforms.get("map")!.value = blurPass.texture;

	// the threshold stage, in the luminance pass at full resolution
	const material = effect.luminanceMaterial;
	if (material.uniforms.depthBuffer) material.defines.SD_DEPTH_MASK = "1";
	material.fragmentShader = PREFILTER_FRAGMENT_SHADER;
	material.needsUpdate = true;

	// the composite reads the full-resolution level with four taps at +-0.5 texel
	(
		effect as unknown as {setFragmentShader(shader: string): void}
	).setFragmentShader(
		fragmentShader.replace(
			compositeAnchor,
			"vec2 sdTexel=0.5/vec2(textureSize(map,0));outputColor=0.25*(texture2D(map,uv+sdTexel*vec2(-1.0,-1.0))+texture2D(map,uv+sdTexel*vec2(1.0,-1.0))+texture2D(map,uv+sdTexel*vec2(-1.0,1.0))+texture2D(map,uv+sdTexel*vec2(1.0,1.0)))*intensity;",
		),
	);
}
