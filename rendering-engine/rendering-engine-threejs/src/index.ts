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

export {
	RenderingEngine,
	IThreejsData,
	ThreejsData,
	ENVIRONMENT_MAP,
	ENVIRONMENT_MAP_CUBE,
	ENVIRONMENT_MAP_EMPTY,
};
export {MultiPointsMaterial};
export {PostProcessingManager};
export {CSS2DObject, CSS2DRenderer};

const textureUnifierInjector = new TextureUnifierInjector();
GlobalAccessObjects.instance.combineTextures =
	textureUnifierInjector.combineTextures.bind(textureUnifierInjector);
