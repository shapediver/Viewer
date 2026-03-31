import {ISettingsV7} from "../..";
import {IGlobalSettings} from "../../interfaces/IGlobalSettings";
import {ICameraSettings} from "./ICameraSettings";

export interface ISettings extends IGlobalSettings {
	ar: ISettingsV7["ar"];
	camera: {
		cameraId: string;
		cameras: ICameraSettings;
		loadDefaultCameras: boolean;
	};
	environment: ISettingsV7["environment"];
	environmentGeometry: ISettingsV7["environmentGeometry"];
	general: ISettingsV7["general"];
	light: ISettingsV7["light"];
	postprocessing: ISettingsV7["postprocessing"];
	rendering: ISettingsV7["rendering"];
	session: ISettingsV7["session"];
	material: ISettingsV7["material"];
	configuration: ISettingsV7["configuration"];
}
