import {type IGlobalSettings} from "../../interfaces/IGlobalSettings";
import {type ICameraSettings} from "./ICameraSettings";
import {type ILightSceneSettings} from "./ILightSceneSettings";

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
	};
	environmentGeometry: {
		gridVisibility: boolean;
		groundPlaneVisibility: boolean;
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
	};
	light: {
		lightSceneId?: string;
		lightScenes: ILightSceneSettings;
	};
	rendering: {
		ambientOcclusion: boolean;
		ambientOcclusionIntensity: number;
		beautyRenderDelay: number;
		beautyRenderBlendingDuration: number;
		shadows: boolean;
	};
	session: {
		[key: string]: {
			order?: number;
			displayname?: string;
			hidden?: boolean;
		};
	};
}
