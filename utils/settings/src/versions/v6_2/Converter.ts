import {versions} from "../..";
import {IGlobalSettings} from "../../interfaces/IGlobalSettings";
import {ISettings as ISettingsV6_1} from "../v6_1/ISettings";
import {ISettings as ISettingsV6_2} from "./ISettings";

export const convertFromPrevious = (
	s: IGlobalSettings,
	v: versions,
): IGlobalSettings => {
	const oldSettings = <ISettingsV6_1>s;
	const settings: ISettingsV6_2 = {
		settings_version: "6.2",
		ar: oldSettings.ar,
		build_date: oldSettings.build_date,
		build_version: oldSettings.build_version,
		camera: {
			cameraId: oldSettings.camera.cameraId,
			cameras: oldSettings.camera.cameras,
			loadDefaultCameras: true,
		},
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

	return <ISettingsV6_2>settings;
};

export const convertToPrevious = (
	s: IGlobalSettings,
	v: versions,
): IGlobalSettings => {
	const newSettings = <ISettingsV6_2>s;
	const settings = {
		settings_version: "6.1",
		ar: newSettings.ar,
		build_date: newSettings.build_date,
		build_version: newSettings.build_version,
		camera: {
			cameraId: newSettings.camera.cameraId,
			cameras: newSettings.camera.cameras,
		},
		general: newSettings.general,
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

	return <ISettingsV6_1>settings;
};
