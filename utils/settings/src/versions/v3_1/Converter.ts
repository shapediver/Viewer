import { ISettings as ISettingsV3 } from "../v3/ISettings"
import { ISettings as ISettingsV3_1 } from "./ISettings"
import { Defaults as DefaultsV3 } from "../v3/Defaults";
import { Defaults as DefaultsV3_1 } from "./Defaults";
import { IGlobalSettings } from "../../interfaces/IGlobalSettings";
import { versions } from "../..";

export const convertFromPrevious = (s: IGlobalSettings, v: versions): IGlobalSettings => {
    const settings = DefaultsV3_1();
    const oldSettings = <ISettingsV3>s;
    settings.ar = oldSettings.ar;
    settings.build_date = oldSettings.build_date;
    settings.build_version = oldSettings.build_version;
    settings.camera = oldSettings.camera;
    settings.environment = oldSettings.environment;
    settings.general = oldSettings.general;
    settings.light = oldSettings.light;
    settings.environmentGeometry.gridVisibility = oldSettings.environmentGeometry.gridVisibility;
    settings.environmentGeometry.groundPlaneVisibility = oldSettings.environmentGeometry.groundPlaneVisibility;
    settings.rendering.ambientOcclusion = oldSettings.rendering.ambientOcclusion;
    settings.rendering.ambientOcclusionIntensity = oldSettings.rendering.ambientOcclusionIntensity;
    settings.rendering.beautyRenderBlendingDuration = oldSettings.rendering.beautyRenderBlendingDuration;
    settings.rendering.beautyRenderDelay = oldSettings.rendering.beautyRenderDelay;
    settings.rendering.shadows = oldSettings.rendering.shadows;
    settings.session = oldSettings.session;

    if(v === '3.0') {
        settings.environmentGeometry.gridColor = '#ffffff';
        settings.environmentGeometry.groundPlaneColor = '#d3d3d3'; 
        settings.rendering.outputEncoding = 'linear'; 
        settings.rendering.physicallyCorrectLights = false;
        settings.rendering.textureEncoding = 'linear'; 
        settings.rendering.toneMapping = 'none'; 
        settings.rendering.toneMappingExposure = 1;
    } else {
        settings.environmentGeometry.gridColor = '#ffffff';
        settings.environmentGeometry.groundPlaneColor = '#d3d3d3'; 
        settings.rendering.outputEncoding = 'srgb'; 
        settings.rendering.physicallyCorrectLights = false;
        settings.rendering.textureEncoding = 'srgb'; 
        settings.rendering.toneMapping = 'none'; 
        settings.rendering.toneMappingExposure = 1;
    }
    return <ISettingsV3_1>settings;
}

export const convertToPrevious = (s: IGlobalSettings, v: versions): IGlobalSettings => {
    const settings = DefaultsV3();
    const newSettings = <ISettingsV3_1>s;

    settings.ar = newSettings.ar;
    settings.build_date = newSettings.build_date;
    settings.build_version = newSettings.build_version;
    settings.camera = newSettings.camera;
    settings.environment = newSettings.environment;
    settings.environmentGeometry.gridVisibility = newSettings.environmentGeometry.gridVisibility;
    settings.environmentGeometry.groundPlaneVisibility = newSettings.environmentGeometry.groundPlaneVisibility;
    settings.general = newSettings.general;
    settings.light = newSettings.light;
    settings.rendering.ambientOcclusion = newSettings.rendering.ambientOcclusion;
    settings.rendering.ambientOcclusionIntensity = newSettings.rendering.ambientOcclusionIntensity;
    settings.rendering.beautyRenderBlendingDuration = newSettings.rendering.beautyRenderBlendingDuration;
    settings.rendering.beautyRenderDelay = newSettings.rendering.beautyRenderDelay;
    settings.rendering.shadows = newSettings.rendering.shadows;
    settings.session = newSettings.session;
    
    return <ISettingsV3>settings;
}