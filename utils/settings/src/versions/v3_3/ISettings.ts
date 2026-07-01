import {type ISettings as ISettingsV3_2} from "../v3_2/ISettings";

export interface ISettings extends ISettingsV3_2 {
	rendering: {
		ambientOcclusion: boolean;
		ambientOcclusionIntensity: number;
		automaticColorAdjustment: boolean;
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
