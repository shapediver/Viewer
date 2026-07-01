import {AbstractLight} from "./implementation/AbstractLight";
import {LightEngine} from "./implementation/LightEngine";
import {LightScene} from "./implementation/LightScene";
import {AmbientLight} from "./implementation/types/AmbientLight";
import {DirectionalLight} from "./implementation/types/DirectionalLight";
import {HemisphereLight} from "./implementation/types/HemisphereLight";
import {PointLight} from "./implementation/types/PointLight";
import {SpotLight} from "./implementation/types/SpotLight";
import {type ILight, LIGHT_TYPE} from "./interface/ILight";
import {type ILightEngine} from "./interface/ILightEngine";
import {type ILightScene} from "./interface/ILightScene";
import {type IAmbientLight} from "./interface/types/IAmbientLight";
import {type IDirectionalLight} from "./interface/types/IDirectionalLight";
import {type IHemisphereLight} from "./interface/types/IHemisphereLight";
import {type IPointLight} from "./interface/types/IPointLight";
import {type ISpotLight} from "./interface/types/ISpotLight";

export {AbstractLight,
	AmbientLight,
	DirectionalLight,
	HemisphereLight,
	LIGHT_TYPE,
	LightEngine,
	LightScene,
	PointLight,
	SpotLight};
export type {IAmbientLight,
	IDirectionalLight,
	IHemisphereLight,
	ILight,
	ILightEngine,
	ILightScene,
	IPointLight,
	ISpotLight};
