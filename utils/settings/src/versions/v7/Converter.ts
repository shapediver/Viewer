import {versions} from "../..";
import {IGlobalSettings} from "../../interfaces/IGlobalSettings";
import {ISettings as ISettingsV6_2} from "../v6_2/ISettings";
import {ISettings as ISettingsV7} from "./ISettings";

export const convertFromPrevious = (
	s: IGlobalSettings,
	v: versions,
): IGlobalSettings => {
	const oldSettings = <ISettingsV6_2>s;
	const settings: ISettingsV7 = {
		settings_version: "7.0",
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
	};

	/**
	 * SETTINGS OBJECTS THAT DID CHANGE
	 */

	return <ISettingsV7>settings;
};

export const convertToPrevious = (
	s: IGlobalSettings,
	v: versions,
): IGlobalSettings => {
	const newSettings = <ISettingsV7>s;
	const settings = {
		settings_version: "6.2",
		ar: newSettings.ar,
		build_date: newSettings.build_date,
		build_version: newSettings.build_version,
		camera: newSettings.camera,
		general: {
			transformation: newSettings.general.transformation,
			blurWhenBusy: newSettings.general.blurWhenBusy,
			commitSettings: newSettings.configuration?.parametersCommit,
			commitParameters: newSettings.configuration?.parametersCommit,
			pointSize: newSettings.general.pointSize,
			showMessages: newSettings.general.showMessages,
			defaultMaterialColor: newSettings.general.defaultMaterialColor,
		},
		light: newSettings.light,
		session: newSettings.session,
		environment: newSettings.environment,
		environmentGeometry: newSettings.environmentGeometry,
		rendering: newSettings.rendering,
		postprocessing: newSettings.postprocessing,
		material: newSettings.material,
	};

	/**
	 * SETTINGS OBJECTS THAT DID CHANGE
	 */

	return <ISettingsV6_2>settings;
};
