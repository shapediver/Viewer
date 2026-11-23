import {BloomEffect, EffectAttribute} from "postprocessing";
import {
	BasicDepthPacking,
	type DepthPackingStrategies,
	RGBADepthPacking,
	type Texture,
	Uniform,
} from "three";
import {applyHighlightBloom} from "./HighlightBloomEffect";

/**
 * A bloom effect that ignores the background. With `highlightsOnly` it is also
 * the highlight bloom (see `HighlightBloomEffect`).
 *
 * The stock bloom effect thresholds the luminance of every pixel, including the
 * clear color. A bright (e.g. white) clear color exceeds the threshold and
 * washes out the model. This effect reads the depth buffer in the luminance
 * pass and masks all pixels at background depth (nothing was drawn there), so
 * only the geometry contributes to the bloom.
 */
export class BackgroundMaskedBloomEffect extends BloomEffect {
	// #region Constructors (1)

	constructor(
		options?: ConstructorParameters<typeof BloomEffect>[0],
		highlightsOnly = false,
		highlightLimit?: number,
	) {
		super(options);

		// patch the highlight bloom first, the depth patch below reads the
		// resulting shader
		if (highlightsOnly) applyHighlightBloom(this, highlightLimit);

		// request a depth texture from the EffectPass / EffectComposer
		this.setAttributes(this.getAttributes() | EffectAttribute.DEPTH);

		const material = this.luminanceMaterial;
		const fragmentShader = material.fragmentShader;
		const commonAnchor = "#include <common>";
		const colorAnchor = "#ifdef COLOR";

		// if the stock shader changes and an anchor is missing, keep it
		// unpatched, the bloom then behaves like the stock effect
		if (
			fragmentShader.includes(commonAnchor) &&
			fragmentShader.includes(colorAnchor)
		) {
			material.uniforms.depthBuffer = new Uniform(null);
			material.fragmentShader = fragmentShader
				.replace(
					commonAnchor,
					`${commonAnchor}\n#include <packing>\nuniform highp sampler2D depthBuffer;`,
				)
				.replace(
					colorAnchor,
					[
						"#ifdef DEPTH_PACKING_RGBA",
						"float backgroundDepth=unpackRGBAToDepth(texture2D(depthBuffer,vUv));",
						"#else",
						"float backgroundDepth=texture2D(depthBuffer,vUv).r;",
						"#endif",
						"mask*=1.0-step(1.0,backgroundDepth);",
						colorAnchor,
					].join("\n"),
				);
			material.needsUpdate = true;
		}
	}

	// #endregion Constructors (1)

	// #region Public Methods (1)

	public override setDepthTexture(
		depthTexture: Texture,
		depthPacking: DepthPackingStrategies = BasicDepthPacking,
	): void {
		const material = this.luminanceMaterial;
		if (!material.uniforms.depthBuffer) return;

		material.uniforms.depthBuffer.value = depthTexture;

		const rgba = depthPacking === RGBADepthPacking;
		if (rgba !== (material.defines.DEPTH_PACKING_RGBA !== undefined)) {
			if (rgba) material.defines.DEPTH_PACKING_RGBA = "1";
			else delete material.defines.DEPTH_PACKING_RGBA;
			material.needsUpdate = true;
		}
	}

	// #endregion Public Methods (1)
}
