import {type ISettingsV7_1} from "../..";
import {type IGlobalSettings} from "../../interfaces/IGlobalSettings";
import {type IPostProcessingEffectsArray} from "./IPostProcessingEffectSettings";

export interface ISettings extends IGlobalSettings {
	ar: ISettingsV7_1["ar"];
	camera: ISettingsV7_1["camera"];
	environment: ISettingsV7_1["environment"];
	environmentGeometry: ISettingsV7_1["environmentGeometry"];
	general: ISettingsV7_1["general"];
	light: ISettingsV7_1["light"];
	postprocessing: Omit<ISettingsV7_1["postprocessing"], "effects"> & {
		effects: IPostProcessingEffectsArray;
	};
	rendering: ISettingsV7_1["rendering"];
	session: ISettingsV7_1["session"];
	material: ISettingsV7_1["material"];
	configuration: ISettingsV7_1["configuration"];
}
