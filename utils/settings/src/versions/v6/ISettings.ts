import {IGlobalSettings} from "../../interfaces/IGlobalSettings";
import {ISettings as ISettingsV5} from "../v5/ISettings";

export interface ISettings extends IGlobalSettings {
	ar: ISettingsV5["ar"];
	camera: ISettingsV5["camera"];
	environment: ISettingsV5["environment"];
	environmentGeometry: {
		gridColor: string;
		gridVisibility: boolean;
		groundPlaneColor: string;
		groundPlaneVisibility: boolean;
		groundPlaneShadowColor: string;
		groundPlaneShadowVisibility: boolean;
		contactShadowVisibility?: boolean;
		contactShadowOpacity?: number;
		contactShadowBlur?: number;
		contactShadowHeight?: number;
		contactShadowDarkness?: number;
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
		defaultMaterialColor?: string;
	};
	light: ISettingsV5["light"];
	postprocessing: ISettingsV5["postprocessing"];
	rendering: ISettingsV5["rendering"];
	session: ISettingsV5["session"];
	material?: {
		defaultMaterialColor: string;
		materialOverrideType?: string;
	};
}
