interface IPostProcessingEffectSettings {
	type: string;
}

export interface IBloomEffectDefinition extends IPostProcessingEffectSettings {
	properties?: {
		blendFunction?: number;
		intensity?: number;
		kernelSize?: number;
		luminanceSmoothing?: number;
		luminanceThreshold?: number;
		mipmapBlur?: boolean;
	};
	type: string;
}

export interface IChromaticAberrationEffectDefinition
	extends IPostProcessingEffectSettings {
	properties?: {
		blendFunction?: number;
		modulationOffset?: number;
		offset?: {x: number; y: number};
		radialModulation?: boolean;
	};
	type: string;
}

export interface IDepthOfFieldEffectDefinition
	extends IPostProcessingEffectSettings {
	properties?: {
		blendFunction?: number;
		bokehScale?: number;
		focusDistance?: number;
		focusRange?: number;
	};
	type: string;
}

export interface IDotScreenEffectDefinition
	extends IPostProcessingEffectSettings {
	properties?: {
		angle?: number;
		blendFunction?: number;
		scale?: number;
	};
	type: string;
}

export interface IGridEffectDefinition extends IPostProcessingEffectSettings {
	properties?: {
		blendFunction?: number;
		scale?: number;
	};
	type: string;
}

export interface IHBAOEffectDefinition extends IPostProcessingEffectSettings {
	properties?: {
		resolutionScale?: number;
		spp?: number;
		distance?: number;
		distanceIntensity?: number;
		intensity?: number;
		color?: string;
		bias?: number;
		thickness?: number;
		iterations?: number;
		radius?: number;
		rings?: number;
		lumaPhi?: number;
		depthPhi?: number;
		normalPhi?: number;
		samples?: number;
	};
	type: string;
}

export interface IHueSaturationEffectDefinition
	extends IPostProcessingEffectSettings {
	properties?: {
		blendFunction?: number;
		hue?: number;
		saturation?: number;
	};
	type: string;
}

export interface INoiseEffectDefinition extends IPostProcessingEffectSettings {
	properties?: {
		blendFunction?: number;
		premultiply?: boolean;
	};
	type: string;
}

export interface IPixelationEffectDefinition
	extends IPostProcessingEffectSettings {
	properties?: {
		blendFunction?: number;
		granularity?: number;
	};
	type: string;
}

export interface ISSAOEffectDefinition extends IPostProcessingEffectSettings {
	properties?: {
		resolutionScale?: number;
		spp?: number;
		distance?: number;
		distanceIntensity?: number;
		intensity?: number;
		color?: string;
		iterations?: number;
		radius?: number;
		rings?: number;
		lumaPhi?: number;
		depthPhi?: number;
		normalPhi?: number;
		samples?: number;
	};
	type: string;
}

export interface IScanlineEffectDefinition
	extends IPostProcessingEffectSettings {
	properties?: {
		blendFunction?: number;
		density?: number;
	};
	type: string;
}

export interface ISepiaEffectDefinition extends IPostProcessingEffectSettings {
	properties?: {
		blendFunction?: number;
	};
	type: string;
}

export interface ITiltShiftEffectDefinition
	extends IPostProcessingEffectSettings {
	properties?: {
		blendFunction?: number;
		feather?: number;
		focusArea?: number;
		kernelSize?: number;
		offset?: number;
		rotation?: number;
	};
	type: string;
}

export interface IVignetteEffectDefinition
	extends IPostProcessingEffectSettings {
	properties?: {
		blendFunction?: number;
		darkness?: number;
		offset?: number;
		technique?: number;
	};
	type: string;
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
