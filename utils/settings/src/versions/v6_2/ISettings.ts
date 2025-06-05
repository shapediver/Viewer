import {IGlobalSettings} from "../../interfaces/IGlobalSettings";
import {ICameraSettings} from "../v5/ICameraSettings";
import {ISettings as ISettingsV6_1} from "../v6_1/ISettings";

export interface ISettings extends IGlobalSettings {
	ar: ISettingsV6_1["ar"];
	camera: {
		cameraId: string;
		cameras: ICameraSettings;
		loadDefaultCameras: boolean;
	};
	environment: ISettingsV6_1["environment"];
	environmentGeometry: ISettingsV6_1["environmentGeometry"];
	general: ISettingsV6_1["general"];
	light: ISettingsV6_1["light"];
	postprocessing: ISettingsV6_1["postprocessing"];
	rendering: ISettingsV6_1["rendering"];
	session: ISettingsV6_1["session"];
	material: ISettingsV6_1["material"];
}
