import {type ISettings as ISettingsV3_1} from "../v3_1/ISettings";

export interface ISettings extends ISettingsV3_1 {
	environmentGeometry: {
		gridColor: string;
		gridVisibility: boolean;
		groundPlaneColor: string;
		groundPlaneVisibility: boolean;
		groundPlaneShadowColor: string;
		groundPlaneShadowVisibility: boolean;
	};
	environment: {
		clearAlpha: number;
		clearColor: string;
		map: string | string[];
		mapAsBackground: boolean;
		mapResolution: string;
	};
	rendering: {
		ambientOcclusion: boolean;
		ambientOcclusionIntensity: number;
		beautyRenderDelay: number;
		beautyRenderBlendingDuration: number;
		lights: boolean;
		outputEncoding: string;
		physicallyCorrectLights: boolean;
		shadows: boolean;
		textureEncoding: string;
		toneMapping: string;
		toneMappingExposure: number;
	};
}
