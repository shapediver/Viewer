import {
	type IBloomEffectDefinition,
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
