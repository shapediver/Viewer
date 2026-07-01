import {type versions} from "../..";
import {type IGlobalSettings} from "../../interfaces/IGlobalSettings";
import {type ISettings as ISettingsV6_2} from "../v6_2/ISettings";
import {type ISettings as ISettingsV7} from "./ISettings";

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
		general: {
			transformation: oldSettings.general.transformation,
			blurWhenBusy: oldSettings.general.blurWhenBusy,
			pointSize: oldSettings.general.pointSize,
			showMessages: oldSettings.general.showMessages,
			defaultMaterialColor: oldSettings.general.defaultMaterialColor,
		},
		light: oldSettings.light,
		session: oldSettings.session,
		environment: oldSettings.environment,
		environmentGeometry: oldSettings.environmentGeometry,
		rendering: oldSettings.rendering,
		postprocessing: oldSettings.postprocessing,
		material: oldSettings.material,
		configuration: {
			parametersCommit: oldSettings.general.commitParameters,
		},
	};

	return <ISettingsV7>settings;
};

export const convertToPrevious = (
	s: IGlobalSettings,
	v: versions,
): IGlobalSettings => {
	const newSettings = <ISettingsV7>s;
	const settings: ISettingsV6_2 = {
		settings_version: "6.2",
		ar: newSettings.ar,
		build_date: newSettings.build_date,
		build_version: newSettings.build_version,
		camera: newSettings.camera,
		general: {
			transformation: newSettings.general.transformation,
			blurWhenBusy: newSettings.general.blurWhenBusy,
			commitSettings: false,
			commitParameters:
				newSettings.configuration?.parametersCommit ?? false,
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

	return <ISettingsV6_2>settings;
};
