import {type versions} from "../..";
import {type IGlobalSettings} from "../../interfaces/IGlobalSettings";
import {Defaults as DefaultsV3_4} from "../v3_4/Defaults";
import {type ISettings as ISettingsV3_4} from "../v3_4/ISettings";
import {Defaults as DefaultsV4_0} from "./Defaults";
import {type ISettings as ISettingsV4_0} from "./ISettings";

export const convertFromPrevious = (
	s: IGlobalSettings,
	v: versions,
): IGlobalSettings => {
	const settings = DefaultsV4_0();
	const oldSettings = <ISettingsV3_4>s;

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

	/**
	 * SETTINGS OBJECTS THAT DID CHANGE
	 */

	settings.rendering.automaticColorAdjustment =
		oldSettings.rendering.automaticColorAdjustment;
	settings.rendering.beautyRenderDelay =
		oldSettings.rendering.beautyRenderDelay;
	settings.rendering.beautyRenderBlendingDuration =
		oldSettings.rendering.beautyRenderBlendingDuration;
	settings.rendering.lights = oldSettings.rendering.lights;
	settings.rendering.outputEncoding = oldSettings.rendering.outputEncoding;
	settings.rendering.physicallyCorrectLights =
		oldSettings.rendering.physicallyCorrectLights;
	settings.rendering.shadows = oldSettings.rendering.shadows;
	settings.rendering.textureEncoding = oldSettings.rendering.textureEncoding;
	settings.rendering.toneMapping = oldSettings.rendering.toneMapping;
	settings.rendering.toneMappingExposure =
		oldSettings.rendering.toneMappingExposure;

	return <ISettingsV4_0>settings;
};

export const convertToPrevious = (
	s: IGlobalSettings,
	v: versions,
): IGlobalSettings => {
	const settings = DefaultsV3_4();
	const newSettings = <ISettingsV4_0>s;

	/**
	 * SETTINGS OBJECTS THAT DID NOT CHANGE
	 */

	settings.ar = newSettings.ar;
	settings.build_date = newSettings.build_date;
	settings.build_version = newSettings.build_version;
	settings.camera = newSettings.camera;
	settings.general = newSettings.general;
	settings.light = newSettings.light;
	settings.session = newSettings.session;
	settings.environment = newSettings.environment;
	settings.environmentGeometry = newSettings.environmentGeometry;

	/**
	 * SETTINGS OBJECTS THAT DID CHANGE
	 */
	settings.rendering.ambientOcclusion = false;
	settings.rendering.ambientOcclusionIntensity = 0.1;

	settings.rendering.automaticColorAdjustment =
		newSettings.rendering.automaticColorAdjustment;
	settings.rendering.beautyRenderDelay =
		newSettings.rendering.beautyRenderDelay;
	settings.rendering.beautyRenderBlendingDuration =
		newSettings.rendering.beautyRenderBlendingDuration;
	settings.rendering.lights = newSettings.rendering.lights;
	settings.rendering.outputEncoding = newSettings.rendering.outputEncoding;
	settings.rendering.physicallyCorrectLights =
		newSettings.rendering.physicallyCorrectLights;
	settings.rendering.shadows = newSettings.rendering.shadows;
	settings.rendering.textureEncoding = newSettings.rendering.textureEncoding;
	settings.rendering.toneMapping = newSettings.rendering.toneMapping;
	settings.rendering.toneMappingExposure =
		newSettings.rendering.toneMappingExposure;

	return <ISettingsV3_4>settings;
};
