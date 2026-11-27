import {
	type IBloomEffectDefinition as IBloomEffectDefinitionV4,
	type IChromaticAberrationEffectDefinition,
	type IDepthOfFieldEffectDefinition,
	type IDotScreenEffectDefinition,
	type IGridEffectDefinition,
	type IHBAOEffectDefinition as IHBAOEffectDefinitionV4,
	type IHueSaturationEffectDefinition,
	type INoiseEffectDefinition,
	type IPixelationEffectDefinition,
	type IScanlineEffectDefinition,
	type ISepiaEffectDefinition,
	type ISSAOEffectDefinition as ISSAOEffectDefinitionV4,
	type ITiltShiftEffectDefinition,
	type IVignetteEffectDefinition,
} from "../v4/IPostProcessingEffectSettings";

/**
 * The mode of an ambient occlusion effect (HBAO, SSAO).
 * "composite" darkens the final image, "shading" darkens only the indirect light inside the materials.
 * The default is "composite".
 */
export type IAmbientOcclusionMode = "composite" | "shading";

/**
 * How an ambient occlusion effect in the "shading" mode darkens the environment reflections.
 * "physical" uses the specular occlusion of three.js (polished metal seen head-on is barely darkened),
 * "uniform" darkens the reflections by the ambient occlusion itself.
 * The default is "physical".
 */
export type IAmbientOcclusionSpecularOcclusion = "physical" | "uniform";

/**
 * The algorithm of the SSAO effect.
 * "hemisphere" samples a hemisphere in world space,
 * "sao" is Scalable Ambient Obscurance (the algorithm of three.js's SAOShader).
 * The default is "hemisphere".
 */
export type IAmbientOcclusionAlgorithm = "hemisphere" | "sao";

export interface IBloomEffectDefinition extends Omit<
	IBloomEffectDefinitionV4,
	"properties"
> {
	properties?: NonNullable<IBloomEffectDefinitionV4["properties"]> & {
		/**
		 * Whether the background contributes to the bloom.
		 * Settings converted from before 7.2 use true.
		 */
		backgroundBloom: boolean;
		/**
		 * Whether only highlights (bright spots) produce bloom.
		 * Settings converted from before 7.2 use false.
		 */
		highlightsOnly: boolean;
		/**
		 * Only with `highlightsOnly` and HDR post-processing: the most bloom
		 * light a single pixel can add, in multiples of white.
		 * Default: 8
		 */
		highlightLimit?: number;
		/**
		 * How the light above the threshold is found and blurred: "mipmap"
		 * (luminance per pixel, the mipmap or kernel blur) or "dualFilter"
		 * (brightest channel of a slightly blurred frame, weighted levels at
		 * full, 1/4, 1/8 and 1/16 resolution, about 2.4 times the glow).
		 * Default: "mipmap"
		 */
		filter?: "mipmap" | "dualFilter";
	};
}

export interface IHBAOEffectDefinition extends Omit<
	IHBAOEffectDefinitionV4,
	"properties"
> {
	properties?: NonNullable<IHBAOEffectDefinitionV4["properties"]> & {
		/**
		 * "composite" darkens the final image, "shading" darkens only the indirect light inside the materials.
		 * Default: "composite"
		 */
		mode?: IAmbientOcclusionMode;
		/**
		 * Only in the "shading" mode: how the ambient occlusion darkens the environment reflections.
		 * Default: "physical"
		 */
		specularOcclusion?: IAmbientOcclusionSpecularOcclusion;
		/**
		 * Whether gems are left out of the ambient occlusion in the composite mode.
		 * Settings converted from before 7.2 use false.
		 */
		excludeGems: boolean;
	};
}

export interface ISSAOEffectDefinition extends Omit<
	ISSAOEffectDefinitionV4,
	"properties"
> {
	properties?: NonNullable<ISSAOEffectDefinitionV4["properties"]> & {
		/**
		 * "composite" darkens the final image, "shading" darkens only the indirect light inside the materials.
		 * Default: "composite"
		 */
		mode?: IAmbientOcclusionMode;
		/**
		 * Only in the "shading" mode: how the ambient occlusion darkens the environment reflections.
		 * Default: "physical"
		 */
		specularOcclusion?: IAmbientOcclusionSpecularOcclusion;
		/**
		 * The AO algorithm.
		 * Default: "hemisphere"
		 */
		algorithm?: IAmbientOcclusionAlgorithm;
		/**
		 * Whether gems are left out of the ambient occlusion in the composite mode.
		 * Settings converted from before 7.2 use false.
		 */
		excludeGems: boolean;
	};
}

/**
 * Screen space reflections on opaque metallic materials, new in 7.2.
 * Every property is optional, an unset one uses its default.
 */
export interface ISSREffectDefinition {
	properties?: {
		/** How much the reflected geometry replaces the environment reflection, from 0 to 1. Default: 1 */
		intensity?: number;
		/** Materials up to this roughness receive reflections. Default: 0.3 */
		maxRoughness?: number;
		/** Ray march steps per pixel, at most 64. Default: 16 */
		steps?: number;
		/** The longest reflected ray, relative to the scene size. Default: 2 */
		distance?: number;
		/** How thick a surface is assumed behind its depth, relative to the scene size. Default: 0.2 */
		thickness?: number;
		/** "radiance": the reflection replaces the environment reflection; "specular": it replaces the whole indirect specular light, with no reflections on surfaces that face the camera (used by the jewelry preset). Default: "radiance" */
		compositing?: "radiance" | "specular";
		/** Whether the reflections are rendered on mobile devices. Default: false */
		enableOnMobile?: boolean;
	};
	type: "ssr";
}

export type IPostProcessingEffectsArray = (
	| IBloomEffectDefinition
	| IChromaticAberrationEffectDefinition
	| IDepthOfFieldEffectDefinition
	| IDotScreenEffectDefinition
	| IGridEffectDefinition
	| IHBAOEffectDefinition
	| IHueSaturationEffectDefinition
	| INoiseEffectDefinition
	| IPixelationEffectDefinition
	| ISSAOEffectDefinition
	| ISSREffectDefinition
	| IScanlineEffectDefinition
	| ISepiaEffectDefinition
	| ITiltShiftEffectDefinition
	| IVignetteEffectDefinition
)[];
