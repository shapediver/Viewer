import {ISettingsV6_2} from "../..";
import {IGlobalSettings} from "../../interfaces/IGlobalSettings";

export interface ISettings extends IGlobalSettings {
	ar: ISettingsV6_2["ar"];
	camera: ISettingsV6_2["camera"];
	environment: ISettingsV6_2["environment"];
	environmentGeometry: ISettingsV6_2["environmentGeometry"];
	general: {
		transformation: {
			scale: {x: number; y: number; z: number};
			translation: {x: number; y: number; z: number};
			rotation: {x: number; y: number; z: number};
		};
		blurWhenBusy: boolean;
		pointSize: number;
		showMessages: boolean;
		defaultMaterialColor?: string;
	};
	light: ISettingsV6_2["light"];
	postprocessing: ISettingsV6_2["postprocessing"];
	rendering: ISettingsV6_2["rendering"];
	session: ISettingsV6_2["session"];
	material: ISettingsV6_2["material"];
	configuration?: {
		parametersCommit: boolean;
		parametersDisable: boolean;
		hideDataOutputs: boolean;
		hideDataOutputsIframe: boolean;
		hideDesktopClients: boolean;
		hideExports: boolean;
		hideExportsIframe: boolean;
		hideSavedStates: boolean;
		hideSavedStatesIframe: boolean;
		hideAttributeVisualization: boolean;
		hideAttributeVisualizationIframe: boolean;
		hideJsonMenu: boolean;
		hideJsonMenuIframe: boolean;
	};
}
