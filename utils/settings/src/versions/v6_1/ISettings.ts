import {type IGlobalSettings} from "../../interfaces/IGlobalSettings";
import {type ISettings as ISettingsV6} from "../v6/ISettings";

export interface ISettings extends IGlobalSettings {
	ar: ISettingsV6["ar"];
	camera: ISettingsV6["camera"];
	environment: ISettingsV6["environment"];
	environmentGeometry: {
		gridColor: string;
		gridVisibility: boolean;
		groundPlaneColor: string;
		groundPlaneVisibility: boolean;
		groundPlaneShadowColor: string;
		groundPlaneShadowVisibility: boolean;
		contactShadowVisibility: boolean;
		contactShadowOpacity: number;
		contactShadowBlur: number;
		contactShadowHeight: number;
		contactShadowDarkness: number;
	};
	general: ISettingsV6["general"];
	light: ISettingsV6["light"];
	postprocessing: ISettingsV6["postprocessing"];
	rendering: ISettingsV6["rendering"];
	session: ISettingsV6["session"];
	material: {
		defaultMaterialColor: string;
		materialOverrideType?: string;
	};
}
