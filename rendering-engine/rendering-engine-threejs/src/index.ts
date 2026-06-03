import {GlobalAccessObjects} from "@shapediver/viewer.shared.global-access-objects";
import {TextureUnifierInjector} from "./injectors/TextureUnifierInjector";
import {
	ENVIRONMENT_MAP,
	ENVIRONMENT_MAP_CUBE,
	ENVIRONMENT_MAP_EMPTY,
} from "./loaders/EnvironmentMapLoader";
import {PostProcessingManager} from "./managers/PostProcessingManager";
import {MultiPointsMaterial} from "./materials/MultiPointsMaterial";
import {RenderingEngine} from "./RenderingEngine";
import {CSS2DObject, CSS2DRenderer} from "./three/CSS2DRenderer";
import {IThreejsData} from "./types/IThreejsData";
import {ThreejsData} from "./types/ThreejsData";

import {
	BlendFunction,
	BloomEffect,
	ChromaticAberrationEffect,
	DepthOfFieldEffect,
	DotScreenEffect,
	EdgeDetectionMode,
	Effect,
	EffectComposer,
	FXAAEffect,
	GodRaysEffect,
	GridEffect,
	HueSaturationEffect,
	KernelSize,
	NoiseEffect,
	OutlineEffect,
	PixelationEffect,
	PredicationMode,
	Resolution,
	ScanlineEffect,
	SelectiveBloomEffect,
	SepiaEffect,
	SMAAEffect,
	SMAAPreset,
	SSAOEffect,
	TiltShiftEffect,
	VignetteEffect,
	VignetteTechnique,
} from "postprocessing";
import {GodRaysManager} from "./managers/postprocessing/GodRaysManager";
import {OutlineManager} from "./managers/postprocessing/OutlineManager";
import {SelectiveBloomManager} from "./managers/postprocessing/SelectiveBloomManager";

export {
	BlendFunction,
	BloomEffect,
	ChromaticAberrationEffect,
	CSS2DObject,
	CSS2DRenderer,
	DepthOfFieldEffect,
	DotScreenEffect,
	EdgeDetectionMode,
	Effect,
	EffectComposer,
	ENVIRONMENT_MAP,
	ENVIRONMENT_MAP_CUBE,
	ENVIRONMENT_MAP_EMPTY,
	FXAAEffect,
	GodRaysEffect,
	GodRaysManager,
	GridEffect,
	HueSaturationEffect,
	KernelSize,
	MultiPointsMaterial,
	NoiseEffect,
	OutlineEffect,
	OutlineManager,
	PixelationEffect,
	PostProcessingManager,
	PredicationMode,
	RenderingEngine,
	Resolution,
	ScanlineEffect,
	SelectiveBloomEffect,
	SelectiveBloomManager,
	SepiaEffect,
	SMAAEffect,
	SMAAPreset,
	SSAOEffect,
	ThreejsData,
	TiltShiftEffect,
	VignetteEffect,
	VignetteTechnique,
	type IThreejsData,
};

const textureUnifierInjector = new TextureUnifierInjector();
GlobalAccessObjects.instance.combineTextures =
	textureUnifierInjector.combineTextures.bind(textureUnifierInjector);
