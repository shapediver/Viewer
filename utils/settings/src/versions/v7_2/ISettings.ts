import {type ISettingsV7_1} from "../..";
import {type IGlobalSettings} from "../../interfaces/IGlobalSettings";
import {type IPostProcessingEffectsArray} from "./IPostProcessingEffectSettings";

/**
 * How the environment map is used by physically based materials.
 * Settings converted from before 7.2 use "legacy".
 */
export type IEnvironmentMapPbrMode = "legacy" | "modern";

/**
 * Orientation convention of the environment map.
 * Settings converted from before 7.2 use "legacy".
 */
export type IEnvironmentMapOrientation = "legacy" | "threejs";

export interface ISettings extends IGlobalSettings {
	ar: ISettingsV7_1["ar"];
	camera: ISettingsV7_1["camera"];
	environment: ISettingsV7_1["environment"] & {
		mapPbrMode: IEnvironmentMapPbrMode;
		mapOrientation: IEnvironmentMapOrientation;
	};
	environmentGeometry: ISettingsV7_1["environmentGeometry"];
	general: ISettingsV7_1["general"];
	light: ISettingsV7_1["light"];
	postprocessing: Omit<ISettingsV7_1["postprocessing"], "effects"> & {
		effects: IPostProcessingEffectsArray;
		/**
		 * Whether the post processing renders in high dynamic range.
		 * Settings converted from before 7.2 use false.
		 */
		hdr: boolean;
	};
	rendering: ISettingsV7_1["rendering"];
	session: ISettingsV7_1["session"];
	material: ISettingsV7_1["material"];
	configuration: ISettingsV7_1["configuration"];
}
