import {versions} from "../..";
import {IGlobalSettings} from "../../interfaces/IGlobalSettings";
import {Defaults as DefaultsV4_0} from "../v4/Defaults";
import {ISettings as ISettingsV4_0} from "../v4/ISettings";
import {Defaults as DefaultsV4_1} from "./Defaults";
import {ISettings as ISettingsV4_1} from "./ISettings";

export const convertFromPrevious = (
	s: IGlobalSettings,
	v: versions,
): IGlobalSettings => {
	const settings = DefaultsV4_1();
	const oldSettings = <ISettingsV4_0>s;

	/**
	 * SETTINGS OBJECTS THAT DID NOT CHANGE
	 */

	settings.ar = oldSettings.ar;
	settings.build_date = oldSettings.build_date;
	settings.build_version = oldSettings.build_version;
	settings.camera = oldSettings.camera;
	settings.general = oldSettings.general;
	settings.light = oldSettings.light;
	settings.session = oldSettings.session;
	settings.environment = oldSettings.environment;
	settings.environmentGeometry = oldSettings.environmentGeometry;
	settings.rendering = oldSettings.rendering;

	/**
	 * SETTINGS OBJECTS THAT DID CHANGE
	 */
	settings.postprocessing.antiAliasingTechnique =
		oldSettings.postprocessing.antiAliasingTechnique;
	settings.postprocessing.antiAliasingTechniqueMobile =
		oldSettings.postprocessing.antiAliasingTechniqueMobile;
	settings.postprocessing.enablePostProcessingOnMobile =
		oldSettings.postprocessing.enablePostProcessingOnMobile;
	settings.postprocessing.ssaaSampleLevel =
		oldSettings.postprocessing.ssaaSampleLevel;

	settings.postprocessing.effects = oldSettings.postprocessing.effects;
	const ssaoEffect = settings.postprocessing.effects.find(
		(e) => e.type === "ssao",
	);
	// if no ssaoEffect, add it
	if (!ssaoEffect)
		settings.postprocessing.effects.push(
			DefaultsV4_1().postprocessing.effects.find(
				(e) => e.type === "ssao",
			)!,
		);

	return <ISettingsV4_1>settings;
};

export const convertToPrevious = (
	s: IGlobalSettings,
	v: versions,
): IGlobalSettings => {
	const settings = DefaultsV4_0();
	const newSettings = <ISettingsV4_1>s;

	/**
	 * SETTINGS OBJECTS THAT DID NOT CHANGE
	 */

	settings.ar = newSettings.ar;
	settings.build_date = newSettings.build_date;
	settings.build_version = newSettings.build_version;
	settings.camera = newSettings.camera;
	settings.general = newSettings.general;
	settings.light = newSettings.light;
	settings.rendering = newSettings.rendering;
	settings.session = newSettings.session;
	settings.environment = newSettings.environment;
	settings.environmentGeometry = newSettings.environmentGeometry;
	settings.postprocessing = newSettings.postprocessing;

	/**
	 * SETTINGS OBJECTS THAT DID CHANGE
	 */

	return <ISettingsV4_0>settings;
};
