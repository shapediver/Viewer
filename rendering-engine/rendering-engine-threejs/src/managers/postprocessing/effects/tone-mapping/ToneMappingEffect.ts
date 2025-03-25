/* eslint-disable @typescript-eslint/no-explicit-any */
import {
	AdaptiveLuminancePass,
	BlendFunction,
	Effect,
	EffectAttribute,
	LuminancePass,
	ToneMappingMode,
} from "postprocessing";
import {
	LinearMipmapLinearFilter,
	REVISION,
	Uniform,
	WebGLRenderer,
	WebGLRenderTarget,
} from "three";
import {tone_mapping} from "./tone-mapping";

/**
 * A tone mapping effect.
 *
 * Note: `ToneMappingMode.REINHARD2_ADAPTIVE` requires support for `EXT_shader_texture_lod`.
 *
 * Reference:
 * GDC2007 - Wolfgang Engel, Post-Processing Pipeline
 * http://perso.univ-lyon1.fr/jean-claude.iehl/Public/educ/GAMA/2007/gdc07/Post-Processing_Pipeline.pdf
 */

export class ToneMappingEffect extends Effect {
	adaptiveLuminancePass: AdaptiveLuminancePass;
	public luminancePass: LuminancePass;
	public renderTargetLuminance: WebGLRenderTarget;

	/**
	 * Constructs a new tone mapping effect.
	 *
	 * The additional parameters only affect the Reinhard2 operator.
	 *
	 * @param {Object} [options] - The options.
	 * @param {BlendFunction} [options.blendFunction=BlendFunction.SRC] - The blend function of this effect.
	 * @param {boolean} [options.adaptive=false] - Deprecated. Use mode instead.
	 * @param {ToneMappingMode} [options.mode=ToneMappingMode.AGX] - The tone mapping mode.
	 * @param {number} [options.resolution=256] - The resolution of the luminance texture. Must be a power of two.
	 * @param {number} [options.maxLuminance=4.0] - Deprecated. Same as whitePoint.
	 * @param {number} [options.whitePoint=4.0] - The white point.
	 * @param {number} [options.middleGrey=0.6] - The middle grey factor.
	 * @param {number} [options.minLuminance=0.01] - The minimum luminance. Prevents very high exposure in dark scenes.
	 * @param {number} [options.averageLuminance=1.0] - The average luminance. Used for the non-adaptive Reinhard operator.
	 * @param {number} [options.adaptationRate=1.0] - The luminance adaptation rate.
	 */
	constructor({
		blendFunction = BlendFunction.SRC,
		adaptive = false,
		mode = adaptive
			? ToneMappingMode.REINHARD2_ADAPTIVE
			: ToneMappingMode.AGX,
		resolution = 256,
		maxLuminance = 4.0,
		whitePoint = maxLuminance,
		middleGrey = 0.6,
		minLuminance = 0.01,
		averageLuminance = 1.0,
		adaptationRate = 1.0,
	}: {
		blendFunction?: BlendFunction;
		adaptive?: boolean;
		mode?: ToneMappingMode;
		resolution?: number;
		maxLuminance?: number;
		whitePoint?: number;
		middleGrey?: number;
		minLuminance?: number;
		averageLuminance?: number;
		adaptationRate?: number;
	} = {}) {
		super("ToneMappingEffect", tone_mapping, {
			attributes: EffectAttribute.DEPTH,
			blendFunction,
			uniforms: new Map([
				["luminanceBuffer", new Uniform(null)],
				["maxLuminance", new Uniform(maxLuminance)], // Unused
				["whitePoint", new Uniform(whitePoint)],
				["middleGrey", new Uniform(middleGrey)],
				["averageLuminance", new Uniform(averageLuminance)],
			] as any),
		});
		/**
		 * The render target for the current luminance.
		 *
		 * @type {WebGLRenderTarget}
		 * @private
		 */

		this.renderTargetLuminance = new WebGLRenderTarget(1, 1, {
			minFilter: LinearMipmapLinearFilter,
			depthBuffer: false,
		});

		this.renderTargetLuminance.texture.generateMipmaps = true;
		this.renderTargetLuminance.texture.name = "Luminance";

		/**
		 * A luminance pass.
		 *
		 * @type {ShaderPass}
		 * @private
		 */

		this.luminancePass = new LuminancePass({
			renderTarget: this.renderTargetLuminance,
		});

		/**
		 * An adaptive luminance pass.
		 *
		 * @type {AdaptiveLuminancePass}
		 * @private
		 */

		this.adaptiveLuminancePass = new AdaptiveLuminancePass(
			this.luminancePass.texture,
			{
				minLuminance,
				adaptationRate,
			},
		);

		this.uniforms.get("luminanceBuffer")!.value =
			this.adaptiveLuminancePass.texture;

		this.resolution = resolution;
		this.mode = mode;
	}

	/**
	 * The luminance adaptation rate.
	 *
	 * @type {number}
	 * @deprecated Use adaptiveLuminanceMaterial.adaptationRate instead.
	 */

	public get adaptationRate() {
		return (this.adaptiveLuminanceMaterial as any).adaptationRate;
	}

	public set adaptationRate(value) {
		(this.adaptiveLuminanceMaterial as any).adaptationRate = value;
	}

	/**
	 * Indicates whether this pass uses adaptive luminance.
	 *
	 * @type {boolean}
	 * @deprecated Use mode instead.
	 */

	public get adaptive() {
		return this.mode === ToneMappingMode.REINHARD2_ADAPTIVE;
	}

	public set adaptive(value) {
		this.mode = value
			? ToneMappingMode.REINHARD2_ADAPTIVE
			: ToneMappingMode.REINHARD2;
	}

	/**
	 * The adaptive luminance material.
	 *
	 * @type {AdaptiveLuminanceMaterial}
	 */

	public get adaptiveLuminanceMaterial() {
		return this.adaptiveLuminancePass.fullscreenMaterial;
	}

	/**
	 * The average luminance.
	 *
	 * Only applies to Reinhard2 (Modified).
	 *
	 * @type {number}
	 */

	public get averageLuminance() {
		return this.uniforms.get("averageLuminance")!.value;
	}

	public set averageLuminance(value) {
		this.uniforms.get("averageLuminance")!.value = value;
	}

	/**
	 * @type {number}
	 * @deprecated
	 */

	public get distinction() {
		console.warn(this.name, "distinction was removed.");
		return 1.0;
	}

	public set distinction(value) {
		console.warn(this.name, "distinction was removed.");
	}

	/**
	 * The middle grey factor. Default is `0.6`.
	 *
	 * Only applies to Reinhard2 (Modified & Adaptive).
	 *
	 * @type {number}
	 */

	public get middleGrey() {
		return this.uniforms.get("middleGrey")!.value;
	}

	public set middleGrey(value) {
		this.uniforms.get("middleGrey")!.value = value;
	}

	/**
	 * The tone mapping mode.
	 *
	 * @type {ToneMappingMode}
	 */

	public get mode() {
		return Number(this.defines.get("TONE_MAPPING_MODE"));
	}

	public set mode(value) {
		if (this.mode === value) {
			return;
		}

		const revision = +REVISION.replace(/\D+/g, "");
		const cineonToneMapping =
			revision >= 168
				? "CineonToneMapping(texel)"
				: "OptimizedCineonToneMapping(texel)";

		this.defines.clear();
		this.defines.set("TONE_MAPPING_MODE", value.toFixed(0));

		// Use one of the built-in tone mapping operators.
		switch (value) {
			case ToneMappingMode.LINEAR:
				this.defines.set(
					"toneMapping(texel)",
					"LinearToneMapping(texel)",
				);
				break;

			case ToneMappingMode.REINHARD:
				this.defines.set(
					"toneMapping(texel)",
					"ReinhardToneMapping(texel)",
				);
				break;

			case ToneMappingMode.OPTIMIZED_CINEON:
				this.defines.set("toneMapping(texel)", cineonToneMapping);
				break;

			case ToneMappingMode.ACES_FILMIC:
				this.defines.set(
					"toneMapping(texel)",
					"ACESFilmicToneMapping(texel)",
				);
				break;

			case ToneMappingMode.AGX:
				this.defines.set("toneMapping(texel)", "AgXToneMapping(texel)");
				break;

			case ToneMappingMode.NEUTRAL:
				this.defines.set(
					"toneMapping(texel)",
					"NeutralToneMapping(texel)",
				);
				break;

			default:
				this.defines.set("toneMapping(texel)", "texel");
				break;
		}

		this.adaptiveLuminancePass.enabled =
			value === ToneMappingMode.REINHARD2_ADAPTIVE;
		this.setChanged();
	}

	/**
	 * The resolution of the luminance texture. Must be a power of two.
	 *
	 * @type {number}
	 */

	public get resolution() {
		return this.luminancePass.resolution.width;
	}

	public set resolution(value) {
		// Round the given value to the next power of two.
		const exponent = Math.max(0, Math.ceil(Math.log2(value)));
		const size = Math.pow(2, exponent);

		this.luminancePass.resolution.setPreferredSize(size, size);
		(this.adaptiveLuminanceMaterial as any).mipLevel1x1 = exponent;
	}

	/**
	 * The white point. Default is `4.0`.
	 *
	 * Only applies to Reinhard2 (Modified & Adaptive).
	 *
	 * @type {number}
	 */

	public get whitePoint() {
		return this.uniforms.get("whitePoint")!.value;
	}

	public set whitePoint(value) {
		this.uniforms.get("whitePoint")!.value = value;
	}

	/**
	 * Returns the adaptive luminance material.
	 *
	 * @deprecated Use adaptiveLuminanceMaterial instead.
	 * @return {AdaptiveLuminanceMaterial} The material.
	 */

	public getAdaptiveLuminanceMaterial() {
		return this.adaptiveLuminanceMaterial;
	}

	/**
	 * Returns the current tone mapping mode.
	 *
	 * @deprecated Use mode instead.
	 * @return {ToneMappingMode} The tone mapping mode.
	 */

	public getMode() {
		return this.mode;
	}

	/**
	 * Returns the resolution of the luminance texture.
	 *
	 * @deprecated Use resolution instead.
	 * @return {number} The resolution.
	 */

	public getResolution() {
		return this.resolution;
	}

	/**
	 * Performs initialization tasks.
	 *
	 * @param {WebGLRenderer} renderer - The renderer.
	 * @param {boolean} alpha - Whether the renderer uses the alpha channel or not.
	 * @param {number} frameBufferType - The type of the main frame buffers.
	 */

	public initialize(
		renderer: WebGLRenderer,
		alpha: boolean,
		frameBufferType: number,
	) {
		this.adaptiveLuminancePass.initialize(renderer, alpha, frameBufferType);
	}

	/**
	 * Sets the tone mapping mode.
	 *
	 * @deprecated Use mode instead.
	 * @param {ToneMappingMode} value - The tone mapping mode.
	 */

	public setMode(value: ToneMappingMode) {
		this.mode = value;
	}

	/**
	 * Sets the resolution of the luminance texture. Must be a power of two.
	 *
	 * @deprecated Use resolution instead.
	 * @param {number} value - The resolution.
	 */

	public setResolution(value: number) {
		this.resolution = value;
	}

	/**
	 * Updates this effect.
	 *
	 * @param {WebGLRenderer} renderer - The renderer.
	 * @param {WebGLRenderTarget} inputBuffer - A frame buffer that contains the result of the previous pass.
	 * @param {number} [deltaTime] - The time between the last frame and the current one in seconds.
	 */

	public update(
		renderer: WebGLRenderer,
		inputBuffer: WebGLRenderTarget,
		deltaTime: number,
	) {
		if (this.adaptiveLuminancePass.enabled) {
			(this.luminancePass as any).render(renderer, inputBuffer);
			this.adaptiveLuminancePass.render(renderer, null, null, deltaTime);
		}
	}
}
