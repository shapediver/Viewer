import {CopyMaterial, Pass} from "postprocessing";
import * as THREE from "three";

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
	vUv = position.xy * 0.5 + 0.5;
	gl_Position = vec4(position.xy, 1.0, 1.0);
}
`;

const blendFragmentShader = /* glsl */ `
uniform sampler2D tFrame;
uniform sampler2D tAccumulation;
uniform float weight;
varying vec2 vUv;

void main() {
	vec4 frame = texture2D(tFrame, vUv);
	if (weight >= 1.0) {
		gl_FragColor = frame;
	} else {
		gl_FragColor = mix(texture2D(tAccumulation, vUv), frame, weight);
	}
}
`;

/**
 * Averages the jittered frames of a still view in the HDR buffer of the
 * composer, right after the scene is rendered. The passes after it (bloom,
 * tone mapping, ...) see the mean instead of the single frame, so a small
 * highlight keeps its HDR value in the mean instead of being clipped to 1 in
 * every frame before it is averaged.
 *
 * Inactive, the pass leaves the buffers alone. Each active frame is added to
 * the mean; {@link begin} with `restart` starts a new mean. The first frame of
 * a mean passes through unchanged.
 */
export class HdrAccumulationPass extends Pass {
	// #region Properties (5)

	private readonly _blendMaterial: THREE.ShaderMaterial;
	private readonly _copyMaterial: CopyMaterial;

	private _active = false;
	private _count = 0;
	private _targets?: [THREE.WebGLRenderTarget, THREE.WebGLRenderTarget];

	// #endregion Properties (5)

	// #region Constructors (1)

	constructor() {
		super("HdrAccumulationPass");
		this._blendMaterial = new THREE.ShaderMaterial({
			name: "HdrAccumulationPass.Blend",
			uniforms: {
				tFrame: {value: null},
				tAccumulation: {value: null},
				weight: {value: 1},
			},
			vertexShader,
			fragmentShader: blendFragmentShader,
			blending: THREE.NoBlending,
			depthTest: false,
			depthWrite: false,
			toneMapped: false,
		});
		this._copyMaterial = new CopyMaterial();
		this.fullscreenMaterial = this._blendMaterial;
	}

	// #endregion Constructors (1)

	// #region Public Accessors (1)

	/** The number of frames in the current mean. */
	public get count(): number {
		return this._count;
	}

	// #endregion Public Accessors (1)

	// #region Public Methods (5)

	/**
	 * Adds the frames rendered from now on to the mean, until {@link end}.
	 * With `restart`, the next frame starts a new mean.
	 */
	public begin(restart: boolean): void {
		this._active = true;
		if (restart) this._count = 0;
	}

	public dispose(): void {
		this.releaseTargets();
		// also disposes both materials
		super.dispose();
	}

	/**
	 * Takes the last added frame out of the mean again, for a frame that is
	 * drawn a second time (the reflections had no previous frame).
	 */
	public discardLastFrame(): void {
		if (!this._active || !this._targets || this._count === 0) return;
		// the other target still holds the mean without that frame
		this._targets = [this._targets[1], this._targets[0]];
		this._count--;
	}

	/** Stops adding frames; the following frames pass through unchanged. */
	public end(): void {
		this._active = false;
	}

	public render(
		renderer: THREE.WebGLRenderer,
		inputBuffer: THREE.WebGLRenderTarget,
		outputBuffer: THREE.WebGLRenderTarget,
	): void {
		if (!this._active) {
			// keep the buffers, unless this is the pass that shows the image
			this.needsSwap = false;
			if (this.renderToScreen) this.copy(renderer, inputBuffer.texture);
			return;
		}

		this.ensureTargets(inputBuffer);
		const [read, write] = this._targets!;
		this._count++;
		const uniforms = this._blendMaterial.uniforms;
		uniforms.tFrame.value = inputBuffer.texture;
		uniforms.tAccumulation.value = read.texture;
		uniforms.weight.value = 1 / this._count;
		this.fullscreenMaterial = this._blendMaterial;
		renderer.setRenderTarget(write);
		renderer.render(this.scene, this.camera);
		this._targets = [write, read];

		this.needsSwap = true;
		this.copy(renderer, write.texture, outputBuffer);
	}

	public setSize(): void {
		// the targets follow the input buffer, a new size starts a new mean
	}

	// #endregion Public Methods (5)

	// #region Private Methods (3)

	private copy(
		renderer: THREE.WebGLRenderer,
		texture: THREE.Texture,
		outputBuffer?: THREE.WebGLRenderTarget,
	): void {
		this._copyMaterial.inputBuffer = texture;
		this.fullscreenMaterial = this._copyMaterial;
		renderer.setRenderTarget(
			this.renderToScreen ? null : (outputBuffer ?? null),
		);
		renderer.render(this.scene, this.camera);
		this.fullscreenMaterial = this._blendMaterial;
	}

	private ensureTargets(inputBuffer: THREE.WebGLRenderTarget): void {
		const {width, height} = inputBuffer;
		const type = inputBuffer.texture.type;
		if (
			this._targets &&
			this._targets[0].width === width &&
			this._targets[0].height === height &&
			this._targets[0].texture.type === type
		)
			return;

		this.releaseTargets();
		const options = {
			type,
			depthBuffer: false,
			stencilBuffer: false,
			minFilter: THREE.NearestFilter,
			magFilter: THREE.NearestFilter,
			generateMipmaps: false,
		};
		this._targets = [
			new THREE.WebGLRenderTarget(width, height, options),
			new THREE.WebGLRenderTarget(width, height, options),
		];
		this._targets.forEach(
			(t, i) => (t.texture.name = `HdrAccumulationPass.Mean${i}`),
		);
		// a new target holds no mean yet
		this._count = 0;
	}

	private releaseTargets(): void {
		this._targets?.forEach((t) => t.dispose());
		this._targets = undefined;
		this._count = 0;
	}

	// #endregion Private Methods (3)
}
