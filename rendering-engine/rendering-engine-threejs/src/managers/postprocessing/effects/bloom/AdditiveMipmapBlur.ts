import {BloomEffect} from "postprocessing";
import {ShaderMaterial, Texture, Uniform, WebGLRenderTarget} from "three";

/** The members of `MipmapBlurPass` that the type declarations leave out. */
interface IMipmapBlurPassInternals {
	downsamplingMipmaps: WebGLRenderTarget[];
	levels: number;
	upsamplingMaterial: ShaderMaterial;
}

/**
 * The weight of each octave of the additive blur, from the finest (half
 * resolution) to the coarsest. The weight rises linearly from 0.5 on the
 * full-resolution octave to 0.7 on the 1/8-resolution octave; the mipmap blur
 * starts at half resolution, so the first level carries the two finest
 * octaves. The weights sum to 2.4: at the same intensity the bloom adds 2.4
 * times the light above the threshold, where the blended blur adds it once.
 */
export const ADDITIVE_BLUR_LEVEL_WEIGHTS: readonly number[] = [
	0.5 + 0.5667,
	0.6333,
	0.7,
];

/**
 * Makes the mipmap blur of a bloom effect add its levels instead of blending
 * them.
 *
 * The stock upsampling blends each level with the next coarser one
 * (`mix(level, coarser, radius)`), so the blur weights sum to 1 and the bloom
 * adds `intensity` times the light above the threshold. Here every level is
 * added with its weight from `ADDITIVE_BLUR_LEVEL_WEIGHTS`, so the same
 * intensity gives about 2.4 times the glow, spread over a few octaves only.
 * The `radius` of the blur has no effect then.
 *
 * If the stock shader changes and the anchor is missing, the blur stays
 * unpatched and behaves like the stock blur.
 *
 * @param effect The bloom effect to patch. Only applies with `mipmapBlur`.
 */
export function applyAdditiveMipmapBlur(effect: BloomEffect): void {
	const pass = effect.mipmapBlurPass as unknown as IMipmapBlurPassInternals;
	const material = pass.upsamplingMaterial;
	const fragmentShader = material.fragmentShader;
	const blendAnchor = "gl_FragColor=mix(baseColor,c,radius);";
	if (!fragmentShader.includes(blendAnchor)) return;

	const weights = ADDITIVE_BLUR_LEVEL_WEIGHTS;
	pass.levels = weights.length;

	material.uniforms.baseWeight = new Uniform(1);
	material.uniforms.inputWeight = new Uniform(1);
	material.fragmentShader = fragmentShader
		.replace(
			"uniform float radius;",
			"uniform float radius;uniform float baseWeight;uniform float inputWeight;",
		)
		.replace(
			blendAnchor,
			"gl_FragColor=baseWeight*baseColor+inputWeight*c;",
		);
	material.needsUpdate = true;

	// The pass renders every level with the same material and sets the level
	// as `supportBuffer` before each draw. Pick the weights of that level:
	// level i = weight i * level i + the upsampled coarser level, and the
	// coarsest level enters the first upsampling with its own weight.
	material.onBeforeRender = () => {
		const supportBuffer = material.uniforms.supportBuffer
			.value as Texture | null;
		const level = pass.downsamplingMipmaps.findIndex(
			(mipmap) => mipmap.texture === supportBuffer,
		);
		if (level < 0) return;
		material.uniforms.baseWeight.value = weights[level] ?? 1;
		material.uniforms.inputWeight.value =
			level === weights.length - 2 ? weights[weights.length - 1] : 1;
	};
}
