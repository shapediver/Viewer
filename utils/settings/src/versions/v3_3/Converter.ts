import { ISettings as ISettingsV3_2 } from "../v3_2/ISettings"
import { ISettings as ISettingsV3_3 } from "./ISettings"
import { Defaults as DefaultsV3_2 } from "../v3_2/Defaults";
import { Defaults as DefaultsV3_3 } from "./Defaults";
import { IGlobalSettings } from "../../interfaces/IGlobalSettings";
import { versions } from "../..";

export const convertFromPrevious = (s: IGlobalSettings, v: versions): IGlobalSettings => {
    const settings = DefaultsV3_3();
    const oldSettings = <ISettingsV3_2>s;

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

    settings.rendering.ambientOcclusion = oldSettings.rendering.ambientOcclusion;
    settings.rendering.ambientOcclusionIntensity = oldSettings.rendering.ambientOcclusionIntensity;
    settings.rendering.automaticColorAdjustment = false;
    settings.rendering.beautyRenderBlendingDuration = oldSettings.rendering.beautyRenderBlendingDuration;
    settings.rendering.beautyRenderDelay = oldSettings.rendering.beautyRenderDelay;
    settings.rendering.outputEncoding = oldSettings.rendering.outputEncoding;
    settings.rendering.physicallyCorrectLights = oldSettings.rendering.physicallyCorrectLights;
    settings.rendering.shadows = oldSettings.rendering.shadows;
    settings.rendering.textureEncoding = oldSettings.rendering.textureEncoding;
    settings.rendering.toneMapping = oldSettings.rendering.toneMapping;
    settings.rendering.toneMappingExposure = oldSettings.rendering.toneMappingExposure;

    return <ISettingsV3_3>settings;
}

export const convertToPrevious = (s: IGlobalSettings, v: versions): IGlobalSettings => {
    const settings = DefaultsV3_2();
    const newSettings = <ISettingsV3_3>s;

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

    settings.rendering.ambientOcclusion = newSettings.rendering.ambientOcclusion;
    settings.rendering.ambientOcclusionIntensity = newSettings.rendering.ambientOcclusionIntensity;
    settings.rendering.beautyRenderBlendingDuration = newSettings.rendering.beautyRenderBlendingDuration;
    settings.rendering.beautyRenderDelay = newSettings.rendering.beautyRenderDelay;
    settings.rendering.outputEncoding = newSettings.rendering.outputEncoding;
    settings.rendering.physicallyCorrectLights = newSettings.rendering.physicallyCorrectLights;
    settings.rendering.shadows = newSettings.rendering.shadows;
    settings.rendering.textureEncoding = newSettings.rendering.textureEncoding;
    settings.rendering.toneMapping = newSettings.rendering.toneMapping;
    settings.rendering.toneMappingExposure = newSettings.rendering.toneMappingExposure;

    return <ISettingsV3_2>settings;
}