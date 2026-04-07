import {ICameraSettingsV7, versions} from "../..";
import {IGlobalSettings} from "../../interfaces/IGlobalSettings";
import {ISettings as ISettingsV7} from "../v7/ISettings";
import {ICameraSettings} from "./ICameraSettings";
import {ISettings as ISettingsV7_1} from "./ISettings";

export const convertFromPrevious = (
	s: IGlobalSettings,
	v: versions,
): IGlobalSettings => {
	const oldSettings = <ISettingsV7>s;
	const newCameras: ICameraSettings = {};

	for (const cameraId in oldSettings.camera.cameras) {
		const camera = oldSettings.camera.cameras[cameraId];
		newCameras[cameraId] = {
			...camera,
			initialAutoAdjust: false,
		};
	}

	const settings: ISettingsV7_1 = {
		settings_version: "7.1",
		ar: oldSettings.ar,
		build_date: oldSettings.build_date,
		build_version: oldSettings.build_version,
		camera: {
			cameraId: oldSettings.camera.cameraId,
			cameras: newCameras,
			loadDefaultCameras: oldSettings.camera.loadDefaultCameras,
		},
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

	const oldCameras: ICameraSettingsV7 = {};
	for (const cameraId in newSettings.camera.cameras) {
		const camera = newSettings.camera.cameras[cameraId];
		oldCameras[cameraId] = {
			...camera,
		};
		delete (oldCameras[cameraId] as any).initialAutoAdjust;
	}

	const settings: ISettingsV7 = {
		settings_version: "7.0",
		ar: newSettings.ar,
		build_date: newSettings.build_date,
		build_version: newSettings.build_version,
		camera: {
			cameraId: newSettings.camera.cameraId,
			cameras: oldCameras,
			loadDefaultCameras: newSettings.camera.loadDefaultCameras,
		},
		general: newSettings.general,
		light: newSettings.light,
		session: newSettings.session,
		environment: newSettings.environment,
		environmentGeometry: newSettings.environmentGeometry,
		rendering: newSettings.rendering,
		postprocessing: newSettings.postprocessing,
		material: newSettings.material,
		configuration: newSettings.configuration,
	};

	return <ISettingsV7>settings;
};
