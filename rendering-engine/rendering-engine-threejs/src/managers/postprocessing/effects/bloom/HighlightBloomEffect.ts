import {BloomEffect} from "postprocessing";

/** The radius of the mipmap blur (stock: 0.85). A wide radius spreads glints over the whole model. */
const MIPMAP_BLUR_RADIUS = 0.5;
/** The default maximum bloom energy per pixel (HDR buffers), so single very bright gem facets don't flood the frame. */
export const DEFAULT_HIGHLIGHT_LIMIT = 8.0;
/** The maximum luminance threshold with 8-bit buffers, where nothing can exceed 1. */
const MAX_LDR_THRESHOLD = 0.8;

/**
 * Turns a bloom effect into a highlight bloom: tightens the mipmap blur radius
 * and patches the luminance shader. If the stock shader changes and the anchor
 * is missing, the shader stays unpatched and the bloom behaves like the stock
 * effect.
 *
 * @param effect The bloom effect to patch.
 * @param highlightLimit The maximum bloom energy per pixel (HDR buffers). Invalid values use the default.
 */
export function applyHighlightBloom(
	effect: BloomEffect,
	highlightLimit: number = DEFAULT_HIGHLIGHT_LIMIT,
): void {
	effect.mipmapBlurPass.radius = MIPMAP_BLUR_RADIUS;

	const limit =
		Number.isFinite(highlightLimit) && highlightLimit >= 0
			? highlightLimit
			: DEFAULT_HIGHLIGHT_LIMIT;
	// a GLSL float literal needs a decimal point or an exponent
	const limitLiteral = Number.isInteger(limit)
		? limit.toFixed(1)
		: limit.toString();

	const material = effect.luminanceMaterial;
	const fragmentShader = material.fragmentShader;
	const maskAnchor = "mask=smoothstep(threshold,threshold+smoothing,l);";

	if (fragmentShader.includes(maskAnchor)) {
		material.fragmentShader = fragmentShader.replace(
			maskAnchor,
			[
				"#ifdef FRAMEBUFFER_PRECISION_HIGH",
				"float knee=max(smoothing,1e-4);",
				"float soft=clamp(l-threshold+knee,0.0,2.0*knee);",
				"soft=soft*soft/(4.0*knee);",
				`mask=min(max(soft,l-threshold),${limitLiteral})/max(l,1e-4);`,
				"#else",
				`float ldrThreshold=min(threshold,${MAX_LDR_THRESHOLD.toFixed(1)});`,
				"mask=smoothstep(ldrThreshold,min(ldrThreshold+smoothing,1.0),l);",
				"#endif",
			].join("\n"),
		);
		material.needsUpdate = true;
	}
}

/**
 * A bloom effect that only lights up real highlights.
 *
 * With HDR (half-float) buffers, only the part of the luminance above
 * `luminanceThreshold` blooms; `luminanceSmoothing` is the width of the soft
 * knee around the threshold. The excess per pixel is capped at
 * `highlightLimit`, so single very bright gem facets don't flood the frame,
 * and the mipmap blur radius is tighter than the stock one. This keeps bright
 * metal from getting a haze.
 *
 * With 8-bit buffers nothing exceeds 1, so the threshold is capped at 0.8.
 */
export class HighlightBloomEffect extends BloomEffect {
	// #region Constructors (1)

	constructor(
		options?: ConstructorParameters<typeof BloomEffect>[0],
		highlightLimit?: number,
	) {
		super(options);

		applyHighlightBloom(this, highlightLimit);
	}

	// #endregion Constructors (1)
}
