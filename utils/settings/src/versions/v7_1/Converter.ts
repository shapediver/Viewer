import {versions} from "../..";
import {IGlobalSettings} from "../../interfaces/IGlobalSettings";
import {ISettings as ISettingsV7} from "../v7/ISettings";
import {ISettings as ISettingsV7_1} from "./ISettings";

export const convertFromPrevious = (
	s: IGlobalSettings,
	v: versions,
): IGlobalSettings => {
	const oldSettings = <ISettingsV7>s;
	const settings: ISettingsV7_1 = {
		settings_version: "7.1",
		ar: oldSettings.ar,
		build_date: oldSettings.build_date,
		build_version: oldSettings.build_version,
		camera: oldSettings.camera,
		general: oldSettings.general,
		light: oldSettings.light,
		session: oldSettings.session,
		environment: oldSettings.environment,
		environmentGeometry: oldSettings.environmentGeometry,
		rendering: oldSettings.rendering,
		postprocessing: oldSettings.postprocessing,
		material: oldSettings.material,
		configuration: oldSettings.configuration,
	};

	return <ISettingsV7_1>settings;
};

export const convertToPrevious = (
	s: IGlobalSettings,
	v: versions,
): IGlobalSettings => {
	const newSettings = <ISettingsV7_1>s;
	const settings: ISettingsV7 = {
		settings_version: "7.0",
		ar: newSettings.ar,
		build_date: newSettings.build_date,
		build_version: newSettings.build_version,
		camera: newSettings.camera,
		general: newSettings.general,
		light: newSettings.light,
		session: newSettings.session,
		environment: newSettings.environment,
		environmentGeometry: newSettings.environmentGeometry,
		rendering: newSettings.rendering,
		postprocessing: newSettings.postprocessing,
		material: newSettings.material,
	};

	return <ISettingsV7>settings;
};
