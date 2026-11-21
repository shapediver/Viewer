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
		 * Whether gems are left out of the ambient occlusion in the composite mode.
		 * Settings converted from before 7.2 use false.
		 */
		excludeGems: boolean;
	};
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
	| IScanlineEffectDefinition
	| ISepiaEffectDefinition
	| ITiltShiftEffectDefinition
	| IVignetteEffectDefinition
)[];
