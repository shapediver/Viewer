import {versions} from "../..";
import {IGlobalSettings} from "../../interfaces/IGlobalSettings";
import {Defaults as DefaultsV3_3} from "../v3_3/Defaults";
import {ISettings as ISettingsV3_3} from "../v3_3/ISettings";
import {Defaults as DefaultsV3_4} from "./Defaults";
import {ISettings as ISettingsV3_4} from "./ISettings";

export const convertFromPrevious = (
	s: IGlobalSettings,
	v: versions,
): IGlobalSettings => {
	const settings = DefaultsV3_4();
	const oldSettings = <ISettingsV3_3>s;

	/**
	 * SETTINGS OBJECTS THAT DID NOT CHANGE
	 */

	settings.ar = oldSettings.ar;
	settings.build_date = oldSettings.build_date;
	settings.build_version = oldSettings.build_version;
	settings.camera = oldSettings.camera;
	// settings.general = oldSettings.general;
	settings.light = oldSettings.light;
	settings.session = oldSettings.session;
	// settings.environment = oldSettings.environment;
	settings.environmentGeometry = oldSettings.environmentGeometry;
	settings.rendering = oldSettings.rendering;

	/**
	 * SETTINGS OBJECTS THAT DID CHANGE
	 */
	settings.general.transformation = oldSettings.general.transformation;
	settings.general.blurWhenBusy = oldSettings.general.blurWhenBusy;
	settings.general.commitSettings = oldSettings.general.commitSettings;
	settings.general.commitParameters = oldSettings.general.commitParameters;
	settings.general.pointSize = oldSettings.general.pointSize;
	settings.general.showMessages = oldSettings.general.showMessages;
	settings.general.defaultMaterialColor = "#199b9bff";

	settings.environment.clearAlpha = oldSettings.environment.clearAlpha;
	settings.environment.clearColor = oldSettings.environment.clearColor;
	settings.environment.map = oldSettings.environment.map;
	settings.environment.mapAsBackground =
		oldSettings.environment.mapAsBackground;
	settings.environment.mapResolution = oldSettings.environment.mapResolution;
	settings.environment.rotation = {x: 0, y: 0, z: 0, w: 1};
	settings.environment.blurriness = 0;
	settings.environment.intensity = 1;

	return <ISettingsV3_4>settings;
};

export const convertToPrevious = (
	s: IGlobalSettings,
	v: versions,
): IGlobalSettings => {
	const settings = DefaultsV3_3();
	const newSettings = <ISettingsV3_4>s;

	/**
	 * SETTINGS OBJECTS THAT DID NOT CHANGE
	 */

	settings.ar = newSettings.ar;
	settings.build_date = newSettings.build_date;
	settings.build_version = newSettings.build_version;
	settings.camera = newSettings.camera;
	// settings.general = newSettings.general;
	settings.light = newSettings.light;
	settings.session = newSettings.session;
	// settings.environment = newSettings.environment;
	settings.environmentGeometry = newSettings.environmentGeometry;
	settings.rendering = newSettings.rendering;

	/**
	 * SETTINGS OBJECTS THAT DID CHANGE
	 */
	settings.general.transformation = newSettings.general.transformation;
	settings.general.blurWhenBusy = newSettings.general.blurWhenBusy;
	settings.general.commitSettings = newSettings.general.commitSettings;
	settings.general.commitParameters = newSettings.general.commitParameters;
	settings.general.pointSize = newSettings.general.pointSize;
	settings.general.showMessages = newSettings.general.showMessages;

	settings.environment.clearAlpha = newSettings.environment.clearAlpha;
	settings.environment.clearColor = newSettings.environment.clearColor;
	settings.environment.map = newSettings.environment.map;
	settings.environment.mapAsBackground =
		newSettings.environment.mapAsBackground;
	settings.environment.mapResolution = newSettings.environment.mapResolution;

	return <ISettingsV3_3>settings;
};
