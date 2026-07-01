import {type IGlobalSettings} from "../../interfaces/IGlobalSettings";
import {type ILightSceneSettings} from "../v3/ILightSceneSettings";
import {type IPostProcessingEffectsArray} from "../v4/IPostProcessingEffectSettings";
import {type ICameraSettings} from "./ICameraSettings";

export interface ISettings extends IGlobalSettings {
	ar: {
		enable: boolean;
		autoScaling: boolean;
	};
	camera: {
		cameraId: string;
		cameras: ICameraSettings;
	};
	environment: {
		clearAlpha: number;
		clearColor: string;
		map: string | string[];
		mapAsBackground: boolean;
		mapResolution: string;
		rotation: {x: number; y: number; z: number; w: number};
		intensity: number;
		blurriness: number;
	};
	environmentGeometry: {
		gridColor: string;
		gridVisibility: boolean;
		groundPlaneColor: string;
		groundPlaneVisibility: boolean;
		groundPlaneShadowColor: string;
		groundPlaneShadowVisibility: boolean;
	};
	general: {
		transformation: {
			scale: {x: number; y: number; z: number};
			translation: {x: number; y: number; z: number};
			rotation: {x: number; y: number; z: number};
		};
		blurWhenBusy: boolean;
		commitSettings: boolean;
		commitParameters: boolean;
		pointSize: number;
		showMessages: boolean;
		defaultMaterialColor: string;
	};

	light: {
		lightSceneId?: string;
		lightScenes: ILightSceneSettings;
	};
	postprocessing: {
		antiAliasingTechnique: string;
		antiAliasingTechniqueMobile: string;
		enablePostProcessingOnMobile: boolean;
		ssaaSampleLevel: number;
		effects: IPostProcessingEffectsArray;
	};
	rendering: {
		automaticColorAdjustment: boolean;
		beautyRenderDelay: number;
		beautyRenderBlendingDuration: number;
		lights: boolean;
		outputEncoding: string;
		physicallyCorrectLights: boolean;
		shadows: boolean;
		softShadows: boolean;
		textureEncoding: string;
		toneMapping: string;
		toneMappingExposure: number;
	};
	session: {
		[key: string]: {
			order?: number;
			displayname?: string;
			hidden?: boolean;
		};
	};
}
