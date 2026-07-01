import {type versions} from "../..";
import {type IGlobalSettings} from "../../interfaces/IGlobalSettings";
import {Defaults as DefaultsV3_1} from "../v3_1/Defaults";
import {type ISettings as ISettingsV3_1} from "../v3_1/ISettings";
import {Defaults as DefaultsV3_2} from "./Defaults";
import {type ISettings as ISettingsV3_2} from "./ISettings";

export const convertFromPrevious = (
	s: IGlobalSettings,
	v: versions,
): IGlobalSettings => {
	const settings = DefaultsV3_2();
	const oldSettings = <ISettingsV3_1>s;

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

	/**
	 * SETTINGS OBJECTS THAT DID CHANGE
	 */

	settings.environment.clearAlpha = oldSettings.environment.clearAlpha;
	settings.environment.clearColor = oldSettings.environment.clearColor;
	settings.environment.map = oldSettings.environment.map;
	settings.environment.mapAsBackground =
		oldSettings.environment.mapAsBackground;
	settings.environment.mapResolution = oldSettings.environment.mapResolution;

	settings.environmentGeometry.gridColor =
		oldSettings.environmentGeometry.gridColor;
	settings.environmentGeometry.gridVisibility =
		oldSettings.environmentGeometry.gridVisibility;
	settings.environmentGeometry.groundPlaneColor =
		oldSettings.environmentGeometry.groundPlaneColor;
	settings.environmentGeometry.groundPlaneVisibility =
		oldSettings.environmentGeometry.groundPlaneVisibility;

	settings.rendering.ambientOcclusion =
		oldSettings.rendering.ambientOcclusion;
	settings.rendering.ambientOcclusionIntensity =
		oldSettings.rendering.ambientOcclusionIntensity;
	settings.rendering.beautyRenderBlendingDuration =
		oldSettings.rendering.beautyRenderBlendingDuration;
	settings.rendering.beautyRenderDelay =
		oldSettings.rendering.beautyRenderDelay;
	settings.rendering.outputEncoding = oldSettings.rendering.outputEncoding;
	settings.rendering.physicallyCorrectLights =
		oldSettings.rendering.physicallyCorrectLights;
	settings.rendering.shadows = oldSettings.rendering.shadows;
	settings.rendering.textureEncoding = oldSettings.rendering.textureEncoding;
	settings.rendering.toneMapping = oldSettings.rendering.toneMapping;
	settings.rendering.toneMappingExposure =
		oldSettings.rendering.toneMappingExposure;

	return <ISettingsV3_2>settings;
};

export const convertToPrevious = (
	s: IGlobalSettings,
	v: versions,
): IGlobalSettings => {
	const settings = DefaultsV3_1();
	const newSettings = <ISettingsV3_2>s;

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

	/**
	 * SETTINGS OBJECTS THAT DID CHANGE
	 */

	settings.environment.clearAlpha = newSettings.environment.clearAlpha;
	settings.environment.clearColor = newSettings.environment.clearColor;
	settings.environment.map = newSettings.environment.map;
	settings.environment.mapAsBackground =
		newSettings.environment.mapAsBackground;
	settings.environment.mapResolution = newSettings.environment.mapResolution;

	settings.environmentGeometry.gridColor =
		newSettings.environmentGeometry.gridColor;
	settings.environmentGeometry.gridVisibility =
		newSettings.environmentGeometry.gridVisibility;
	settings.environmentGeometry.groundPlaneColor =
		newSettings.environmentGeometry.groundPlaneColor;
	settings.environmentGeometry.groundPlaneVisibility =
		newSettings.environmentGeometry.groundPlaneVisibility;

	settings.rendering.ambientOcclusion =
		newSettings.rendering.ambientOcclusion;
	settings.rendering.ambientOcclusionIntensity =
		newSettings.rendering.ambientOcclusionIntensity;
	settings.rendering.beautyRenderBlendingDuration =
		newSettings.rendering.beautyRenderBlendingDuration;
	settings.rendering.beautyRenderDelay =
		newSettings.rendering.beautyRenderDelay;
	settings.rendering.outputEncoding = newSettings.rendering.outputEncoding;
	settings.rendering.physicallyCorrectLights =
		newSettings.rendering.physicallyCorrectLights;
	settings.rendering.shadows = newSettings.rendering.shadows;
	settings.rendering.textureEncoding = newSettings.rendering.textureEncoding;
	settings.rendering.toneMapping = newSettings.rendering.toneMapping;
	settings.rendering.toneMappingExposure =
		newSettings.rendering.toneMappingExposure;

	return <ISettingsV3_1>settings;
};
