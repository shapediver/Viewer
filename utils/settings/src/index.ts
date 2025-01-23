import { IGlobalSettings } from "./interfaces/IGlobalSettings"

import { ISettings as ISettingsV1 } from "./versions/v1/ISettings";
import { Defaults as DefaultsV1 } from "./versions/v1/Defaults";
import { validate as validateV1 } from "./versions/v1/Validator";

import { ISettings as ISettingsV2 } from "./versions/v2/ISettings";
import { Defaults as DefaultsV2 } from "./versions/v2/Defaults";
import { validate as validateV2 } from "./versions/v2/Validator";
import { convertFromPrevious as convertFromPreviousV2, convertToPrevious as convertToPreviousV2 } from "./versions/v2/Converter";

import { ISettings as ISettingsV3 } from "./versions/v3/ISettings";
import { Defaults as DefaultsV3 } from "./versions/v3/Defaults";
import { validate as validateV3 } from "./versions/v3/Validator";
import { convertFromPrevious as convertFromPreviousV3, convertToPrevious as convertToPreviousV3 } from "./versions/v3/Converter";
import { ICameraSettings as ICameraSettingsV3, IOrbitControlsSettings as IOrbitControlsSettingsV3, IOrthographicCameraSettings as IOrthographicCameraSettingsV3, IOrthographicControlsSettings as IOrthographicControlsSettingsV3, IPerspectiveCameraSettings as IPerspectiveCameraSettingsV3 } from "./versions/v3/ICameraSettings";
import { IAmbientLightProperties as IAmbientLightPropertiesV3, IDirectionalLightProperties as IDirectionalLightPropertiesV3, IHemisphereLightProperties as IHemisphereLightPropertiesV3, ILightSceneSettings as ILightSceneSettingsV3, IPointLightProperties as IPointLightPropertiesV3, ISpotLightProperties as ISpotLightPropertiesV3 } from "./versions/v3/ILightSceneSettings";

import { ISettings as ISettingsV3_1 } from "./versions/v3_1/ISettings";
import { Defaults as DefaultsV3_1 } from "./versions/v3_1/Defaults";
import { validate as validateV3_1 } from "./versions/v3_1/Validator";
import { convertFromPrevious as convertFromPreviousV3_1, convertToPrevious as convertToPreviousV3_1 } from "./versions/v3_1/Converter";
import { ICameraSettings as ICameraSettingsV3_1, IOrbitControlsSettings as IOrbitControlsSettingsV3_1, IOrthographicCameraSettings as IOrthographicCameraSettingsV3_1, IOrthographicControlsSettings as IOrthographicControlsSettingsV3_1, IPerspectiveCameraSettings as IPerspectiveCameraSettingsV3_1 } from "./versions/v3/ICameraSettings";
import { IAmbientLightProperties as IAmbientLightPropertiesV3_1, IDirectionalLightProperties as IDirectionalLightPropertiesV3_1, IHemisphereLightProperties as IHemisphereLightPropertiesV3_1, ILightSceneSettings as ILightSceneSettingsV3_1, IPointLightProperties as IPointLightPropertiesV3_1, ISpotLightProperties as ISpotLightPropertiesV3_1 } from "./versions/v3/ILightSceneSettings";

import { ISettings as ISettingsV3_2 } from "./versions/v3_2/ISettings";
import { Defaults as DefaultsV3_2 } from "./versions/v3_2/Defaults";
import { validate as validateV3_2 } from "./versions/v3_2/Validator";
import { convertFromPrevious as convertFromPreviousV3_2, convertToPrevious as convertToPreviousV3_2 } from "./versions/v3_2/Converter";
import { ICameraSettings as ICameraSettingsV3_2, IOrbitControlsSettings as IOrbitControlsSettingsV3_2, IOrthographicCameraSettings as IOrthographicCameraSettingsV3_2, IOrthographicControlsSettings as IOrthographicControlsSettingsV3_2, IPerspectiveCameraSettings as IPerspectiveCameraSettingsV3_2 } from "./versions/v3/ICameraSettings";
import { IAmbientLightProperties as IAmbientLightPropertiesV3_2, IDirectionalLightProperties as IDirectionalLightPropertiesV3_2, IHemisphereLightProperties as IHemisphereLightPropertiesV3_2, ILightSceneSettings as ILightSceneSettingsV3_2, IPointLightProperties as IPointLightPropertiesV3_2, ISpotLightProperties as ISpotLightPropertiesV3_2 } from "./versions/v3/ILightSceneSettings";

import { ISettings as ISettingsV3_3 } from "./versions/v3_3/ISettings";
import { Defaults as DefaultsV3_3 } from "./versions/v3_3/Defaults";
import { validate as validateV3_3 } from "./versions/v3_3/Validator";
import { convertFromPrevious as convertFromPreviousV3_3, convertToPrevious as convertToPreviousV3_3 } from "./versions/v3_3/Converter";
import { ICameraSettings as ICameraSettingsV3_3, IOrbitControlsSettings as IOrbitControlsSettingsV3_3, IOrthographicCameraSettings as IOrthographicCameraSettingsV3_3, IOrthographicControlsSettings as IOrthographicControlsSettingsV3_3, IPerspectiveCameraSettings as IPerspectiveCameraSettingsV3_3 } from "./versions/v3/ICameraSettings";
import { IAmbientLightProperties as IAmbientLightPropertiesV3_3, IDirectionalLightProperties as IDirectionalLightPropertiesV3_3, IHemisphereLightProperties as IHemisphereLightPropertiesV3_3, ILightSceneSettings as ILightSceneSettingsV3_3, IPointLightProperties as IPointLightPropertiesV3_3, ISpotLightProperties as ISpotLightPropertiesV3_3 } from "./versions/v3/ILightSceneSettings";

import { ISettings as ISettingsV3_4 } from "./versions/v3_4/ISettings";
import { Defaults as DefaultsV3_4 } from "./versions/v3_4/Defaults";
import { validate as validateV3_4 } from "./versions/v3_4/Validator";
import { convertFromPrevious as convertFromPreviousV3_4, convertToPrevious as convertToPreviousV3_4 } from "./versions/v3_4/Converter";
import { ICameraSettings as ICameraSettingsV3_4, IOrbitControlsSettings as IOrbitControlsSettingsV3_4, IOrthographicCameraSettings as IOrthographicCameraSettingsV3_4, IOrthographicControlsSettings as IOrthographicControlsSettingsV3_4, IPerspectiveCameraSettings as IPerspectiveCameraSettingsV3_4 } from "./versions/v3/ICameraSettings";
import { IAmbientLightProperties as IAmbientLightPropertiesV3_4, IDirectionalLightProperties as IDirectionalLightPropertiesV3_4, IHemisphereLightProperties as IHemisphereLightPropertiesV3_4, ILightSceneSettings as ILightSceneSettingsV3_4, IPointLightProperties as IPointLightPropertiesV3_4, ISpotLightProperties as ISpotLightPropertiesV3_4 } from "./versions/v3/ILightSceneSettings";

import { ISettings as ISettingsV4_0 } from "./versions/v4/ISettings";
import { Defaults as DefaultsV4_0 } from "./versions/v4/Defaults";
import { validate as validateV4_0 } from "./versions/v4/Validator";
import { convertFromPrevious as convertFromPreviousV4_0, convertToPrevious as convertToPreviousV4_0 } from "./versions/v4/Converter";
import { ICameraSettings as ICameraSettingsV4_0, IOrbitControlsSettings as IOrbitControlsSettingsV4_0, IOrthographicCameraSettings as IOrthographicCameraSettingsV4_0, IOrthographicControlsSettings as IOrthographicControlsSettingsV4_0, IPerspectiveCameraSettings as IPerspectiveCameraSettingsV4_0 } from "./versions/v3/ICameraSettings";
import { IAmbientLightProperties as IAmbientLightPropertiesV4_0, IDirectionalLightProperties as IDirectionalLightPropertiesV4_0, IHemisphereLightProperties as IHemisphereLightPropertiesV4_0, ILightSceneSettings as ILightSceneSettingsV4_0, IPointLightProperties as IPointLightPropertiesV4_0, ISpotLightProperties as ISpotLightPropertiesV4_0 } from "./versions/v3/ILightSceneSettings";
import { IPostProcessingEffectsArray as IPostProcessingEffectsArrayV4_0 } from "./versions/v4/IPostProcessingEffectSettings"

import { ISettings as ISettingsV4_1 } from "./versions/v4_1/ISettings";
import { Defaults as DefaultsV4_1 } from "./versions/v4_1/Defaults";
import { validate as validateV4_1 } from "./versions/v4_1/Validator";
import { convertFromPrevious as convertFromPreviousV4_1, convertToPrevious as convertToPreviousV4_1 } from "./versions/v4_1/Converter";
import { ICameraSettings as ICameraSettingsV4_1, IOrbitControlsSettings as IOrbitControlsSettingsV4_1, IOrthographicCameraSettings as IOrthographicCameraSettingsV4_1, IOrthographicControlsSettings as IOrthographicControlsSettingsV4_1, IPerspectiveCameraSettings as IPerspectiveCameraSettingsV4_1 } from "./versions/v3/ICameraSettings";
import { IAmbientLightProperties as IAmbientLightPropertiesV4_1, IDirectionalLightProperties as IDirectionalLightPropertiesV4_1, IHemisphereLightProperties as IHemisphereLightPropertiesV4_1, ILightSceneSettings as ILightSceneSettingsV4_1, IPointLightProperties as IPointLightPropertiesV4_1, ISpotLightProperties as ISpotLightPropertiesV4_1 } from "./versions/v3/ILightSceneSettings";
import { IPostProcessingEffectsArray as IPostProcessingEffectsArrayV4_1 } from "./versions/v4/IPostProcessingEffectSettings"

import { ISettings as ISettingsV5 } from "./versions/v5/ISettings";
import { Defaults as DefaultsV5 } from "./versions/v5/Defaults";
import { validate as validateV5 } from "./versions/v5/Validator";
import { convertFromPrevious as convertFromPreviousV5, convertToPrevious as convertToPreviousV5 } from "./versions/v5/Converter";
import { ICameraSettings as ICameraSettingsV5, ICameraControlsSettings as ICameraControlsSettingsV5, IOrthographicCameraSettings as IOrthographicCameraSettingsV5, IPerspectiveCameraSettings as IPerspectiveCameraSettingsV5 } from "./versions/v5/ICameraSettings";
import { IAmbientLightProperties as IAmbientLightPropertiesV5, IDirectionalLightProperties as IDirectionalLightPropertiesV5, IHemisphereLightProperties as IHemisphereLightPropertiesV5, ILightSceneSettings as ILightSceneSettingsV5, IPointLightProperties as IPointLightPropertiesV5, ISpotLightProperties as ISpotLightPropertiesV5 } from "./versions/v3/ILightSceneSettings";
import { IPostProcessingEffectsArray as IPostProcessingEffectsArrayV5 } from "./versions/v4/IPostProcessingEffectSettings"

import { ISettings as ISettingsV6 } from "./versions/v6/ISettings";
import { validate as validateV6 } from "./versions/v6/Validator";
import { convertFromPrevious as convertFromPreviousV6, convertToPrevious as convertToPreviousV6 } from "./versions/v6/Converter";
import { ICameraSettings as ICameraSettingsV6, ICameraControlsSettings as ICameraControlsSettingsV6, IOrthographicCameraSettings as IOrthographicCameraSettingsV6, IPerspectiveCameraSettings as IPerspectiveCameraSettingsV6 } from "./versions/v5/ICameraSettings";
import { IAmbientLightProperties as IAmbientLightPropertiesV6, IDirectionalLightProperties as IDirectionalLightPropertiesV6, IHemisphereLightProperties as IHemisphereLightPropertiesV6, ILightSceneSettings as ILightSceneSettingsV6, IPointLightProperties as IPointLightPropertiesV6, ISpotLightProperties as ISpotLightPropertiesV6 } from "./versions/v3/ILightSceneSettings";
import { IPostProcessingEffectsArray as IPostProcessingEffectsArrayV6 } from "./versions/v4/IPostProcessingEffectSettings"

export {
    ISettingsV1, DefaultsV1
}

export {
    ISettingsV2, DefaultsV2
}

export {
    ISettingsV3, DefaultsV3, 
    ICameraSettingsV3, IOrthographicCameraSettingsV3, IPerspectiveCameraSettingsV3, IOrbitControlsSettingsV3, IOrthographicControlsSettingsV3,
    ILightSceneSettingsV3, IAmbientLightPropertiesV3, IDirectionalLightPropertiesV3, IHemisphereLightPropertiesV3, IPointLightPropertiesV3, ISpotLightPropertiesV3
}

export {
    ISettingsV3_1, DefaultsV3_1, 
    ICameraSettingsV3_1, IOrthographicCameraSettingsV3_1, IPerspectiveCameraSettingsV3_1, IOrbitControlsSettingsV3_1, IOrthographicControlsSettingsV3_1,
    ILightSceneSettingsV3_1, IAmbientLightPropertiesV3_1, IDirectionalLightPropertiesV3_1, IHemisphereLightPropertiesV3_1, IPointLightPropertiesV3_1, ISpotLightPropertiesV3_1
}


export {
    ISettingsV3_2, DefaultsV3_2, 
    ICameraSettingsV3_2, IOrthographicCameraSettingsV3_2, IPerspectiveCameraSettingsV3_2, IOrbitControlsSettingsV3_2, IOrthographicControlsSettingsV3_2,
    ILightSceneSettingsV3_2, IAmbientLightPropertiesV3_2, IDirectionalLightPropertiesV3_2, IHemisphereLightPropertiesV3_2, IPointLightPropertiesV3_2, ISpotLightPropertiesV3_2
}

export {
    ISettingsV3_3, DefaultsV3_3, 
    ICameraSettingsV3_3, IOrthographicCameraSettingsV3_3, IPerspectiveCameraSettingsV3_3, IOrbitControlsSettingsV3_3, IOrthographicControlsSettingsV3_3,
    ILightSceneSettingsV3_3, IAmbientLightPropertiesV3_3, IDirectionalLightPropertiesV3_3, IHemisphereLightPropertiesV3_3, IPointLightPropertiesV3_3, ISpotLightPropertiesV3_3
}

export {
    ISettingsV3_4, DefaultsV3_4, 
    ICameraSettingsV3_4, IOrthographicCameraSettingsV3_4, IPerspectiveCameraSettingsV3_4, IOrbitControlsSettingsV3_4, IOrthographicControlsSettingsV3_4,
    ILightSceneSettingsV3_4, IAmbientLightPropertiesV3_4, IDirectionalLightPropertiesV3_4, IHemisphereLightPropertiesV3_4, IPointLightPropertiesV3_4, ISpotLightPropertiesV3_4
}

export {
    ISettingsV4_0, DefaultsV4_0, 
    ICameraSettingsV4_0, IOrthographicCameraSettingsV4_0, IPerspectiveCameraSettingsV4_0, IOrbitControlsSettingsV4_0, IOrthographicControlsSettingsV4_0,
    ILightSceneSettingsV4_0, IAmbientLightPropertiesV4_0, IDirectionalLightPropertiesV4_0, IHemisphereLightPropertiesV4_0, IPointLightPropertiesV4_0, ISpotLightPropertiesV4_0, 
    IPostProcessingEffectsArrayV4_0
}

export {
    ISettingsV4_1, DefaultsV4_1, 
    ICameraSettingsV4_1, IOrthographicCameraSettingsV4_1, IPerspectiveCameraSettingsV4_1, IOrbitControlsSettingsV4_1, IOrthographicControlsSettingsV4_1,
    ILightSceneSettingsV4_1, IAmbientLightPropertiesV4_1, IDirectionalLightPropertiesV4_1, IHemisphereLightPropertiesV4_1, IPointLightPropertiesV4_1, ISpotLightPropertiesV4_1, 
    IPostProcessingEffectsArrayV4_1
}

export {
    ISettingsV5, DefaultsV5, 
    ICameraSettingsV5, IOrthographicCameraSettingsV5, IPerspectiveCameraSettingsV5, ICameraControlsSettingsV5,
    ILightSceneSettingsV5, IAmbientLightPropertiesV5, IDirectionalLightPropertiesV5, IHemisphereLightPropertiesV5, IPointLightPropertiesV5, ISpotLightPropertiesV5, 
    IPostProcessingEffectsArrayV5
}

export {
    ISettingsV6, 
    ICameraSettingsV6, IOrthographicCameraSettingsV6, IPerspectiveCameraSettingsV6, ICameraControlsSettingsV6,
    ILightSceneSettingsV6, IAmbientLightPropertiesV6, IDirectionalLightPropertiesV6, IHemisphereLightPropertiesV6, IPointLightPropertiesV6, ISpotLightPropertiesV6, 
    IPostProcessingEffectsArrayV6
}

// this changes every version
export {
    ISettingsV6 as ISettings,
    ICameraSettingsV6 as ICameraSettings, IOrthographicCameraSettingsV6 as IOrthographicCameraSettings, IPerspectiveCameraSettingsV6 as IPerspectiveCameraSettings, ICameraControlsSettingsV6 as ICameraControlsSettings,
    ILightSceneSettingsV6 as ILightSceneSettings, IAmbientLightPropertiesV6 as IAmbientLightProperties, IDirectionalLightPropertiesV6 as IDirectionalLightProperties, IHemisphereLightPropertiesV6 as IHemisphereLightProperties, IPointLightPropertiesV6 as IPointLightProperties, ISpotLightPropertiesV6 as ISpotLightProperties, 
    IPostProcessingEffectsArrayV6 as IPostProcessingEffectsArray
}

export type versions = '1.0' | '2.0' | '3.0' | '3.1' | '3.2' | '3.3' | '3.4' | '4.0' | '4.1' | '5.0' | '6.0';
export const previousVersion: versions[] = ['1.0' , '2.0' , '3.0' , '3.1' , '3.2' , '3.3' , '3.4' , '4.0' , '4.1', '5.0'];

let settingsUtilities: {
    version: versions,
    defaults?: () => IGlobalSettings,
    convertToPrevious: (s: IGlobalSettings, v: versions) => IGlobalSettings,
    convertFromPrevious: (s: IGlobalSettings, v: versions) => IGlobalSettings,
    validate: (s: any) => void
}[] = [];
settingsUtilities.push({
    version: '1.0',
    defaults: DefaultsV1,
    convertToPrevious: s => s,
    convertFromPrevious: s => s,
    validate: validateV1
});
settingsUtilities.push({
    version: '2.0',
    defaults: DefaultsV2,
    convertToPrevious: convertToPreviousV2,
    convertFromPrevious: convertFromPreviousV2,
    validate: validateV2
});
settingsUtilities.push({
    version: '3.0',
    defaults: DefaultsV3,
    convertToPrevious: convertToPreviousV3,
    convertFromPrevious: convertFromPreviousV3,
    validate: validateV3
});
settingsUtilities.push({
    version: '3.1',
    defaults: DefaultsV3_1,
    convertToPrevious: convertToPreviousV3_1,
    convertFromPrevious: convertFromPreviousV3_1,
    validate: validateV3_1
});
settingsUtilities.push({
    version: '3.2',
    defaults: DefaultsV3_2,
    convertToPrevious: convertToPreviousV3_2,
    convertFromPrevious: convertFromPreviousV3_2,
    validate: validateV3_2
});
settingsUtilities.push({
    version: '3.3',
    defaults: DefaultsV3_3,
    convertToPrevious: convertToPreviousV3_3,
    convertFromPrevious: convertFromPreviousV3_3,
    validate: validateV3_3
});
settingsUtilities.push({
    version: '3.4',
    defaults: DefaultsV3_4,
    convertToPrevious: convertToPreviousV3_4,
    convertFromPrevious: convertFromPreviousV3_4,
    validate: validateV3_4
});
settingsUtilities.push({
    version: '4.0',
    defaults: DefaultsV4_0,
    convertToPrevious: convertToPreviousV4_0,
    convertFromPrevious: convertFromPreviousV4_0,
    validate: validateV4_0
});
settingsUtilities.push({
    version: '4.1',
    defaults: DefaultsV4_1,
    convertToPrevious: convertToPreviousV4_1,
    convertFromPrevious: convertFromPreviousV4_1,
    validate: validateV4_1
});
settingsUtilities.push({
    version: '5.0',
    defaults: DefaultsV5,
    convertToPrevious: convertToPreviousV5,
    convertFromPrevious: convertFromPreviousV5,
    validate: validateV5
});
settingsUtilities.push({
    version: '6.0',
    convertToPrevious: convertToPreviousV6,
    convertFromPrevious: convertFromPreviousV6,
    validate: validateV6
});

/**
 * Convert the provided settings to the target version provided.
 * The settings object will be validate beforehand, an error will be thrown if the validation was not successful.
 * 
 * @param settings 
 * @param targetVersion 
 * @returns 
 */
export const convert = (settings: any, targetVersion: versions): IGlobalSettings => {
    const original_version = settings.settings_version || '1.0'; 
    if (original_version === targetVersion) return settings;
    const target = settingsUtilities.findIndex(util => { return util.version === targetVersion });
    const current = settingsUtilities.findIndex(util => { return util.version === original_version });
    if (target === -1) throw new Error('ViewerSettings.convert: Target version not available');
    if (current === -1) throw new Error('ViewerSettings.convert: Settings version not available');

    let tempSettings: IGlobalSettings = settings;
    if(target < current) {
        for(let i = current; target < i; i--)
            tempSettings = settingsUtilities[i].convertToPrevious(tempSettings, original_version);
    } else {
        for(let i = current+1; i <= target; i++)
            tempSettings = settingsUtilities[i].convertFromPrevious(tempSettings, original_version);
    }
    return tempSettings;
}

/**
 * Validate the provided settings. If not target version is specified, an extraction of the version from the settings object is attempted.
 * If the validation is not successful, an error is thrown with the necessary information on why the validation failed.
 * 
 * @param settings 
 * @param targetVersion 
 */
export const validate = (settings: any, targetVersion?: versions): void => {
    const settings_version = settings.settings_version || '1.0';
    if (targetVersion !== undefined) {
        const index = settingsUtilities.findIndex(util => { return util.version === targetVersion });
        if (index === -1) throw new Error('ViewerSettings.validate: Target version was not found.');
        if (settings_version !== undefined && settings_version !== targetVersion) throw new Error('ViewerSettings.validate: The settings do have a different version than the target version.');
        settingsUtilities[index].validate(settings);
    } else {
        if (!settings_version) throw new Error('ViewerSettings.validate: Settings do not have a version specified.');
        const index = settingsUtilities.findIndex(util => { return util.version === settings_version });
        settingsUtilities[index].validate(settings);
    }
}

/**
 * Evaluate which settings version to use by using the viewer version.
 * 
 * @param viewerVersion 
 * @returns 
 */
export const evaluateSettingsVersion = (viewerVersion?: string): versions => {
    // case 1: no version, return 1.0
    if(!viewerVersion || viewerVersion.startsWith('1'))
        return '1.0';

    // case 2: starts with 2, if higher or equal than 2.18.0, return 2.0
    if(viewerVersion.startsWith('2')) {
        const upgradeVersions = viewerVersion
            .split('.')
            .map(item => item.match(/^\d+/)?.[0])
            .filter(Boolean)
            .map(match => parseInt(match!));

        if(upgradeVersions[1] >= 18) {
            return '2.0';
        } else {
            return '1.0';
        }
    }

    // case 3: starts with 3, return 3.0 or higher
    if(viewerVersion.startsWith('3')) {
        const upgradeVersions = viewerVersion
            .split('.')
            .map(item => item.match(/^\d+/)?.[0])
            .filter(Boolean)
            .map(match => parseInt(match!));

        if(upgradeVersions[1] >= 3 && upgradeVersions[2] >= 8) { // starting from 3.3.8.0
            return '6.0';
        } else if(upgradeVersions[1] >= 3) { // starting from 3.3.0.0
            return '5.0';
        } else if((upgradeVersions[1] === 2 && upgradeVersions[2] >= 11)) { // starting from 3.2.11.0
            return '4.1';
        } else if((upgradeVersions[1] === 2 && upgradeVersions[2] >= 10)) { // starting from 3.2.10.0
            return '4.0';
        } else if((upgradeVersions[1] === 2 && upgradeVersions[2] >= 9)) { // starting from 3.2.9.0
            return '3.4';
        } else if((upgradeVersions[1] === 2 && upgradeVersions[2] >= 7)) { // starting from 3.2.7.0
            return '3.3';
        } else if((upgradeVersions[1] === 2 && upgradeVersions[2] >= 6)) { // starting from 3.2.6.0
            return '3.2';
        } else if((upgradeVersions[1] === 1 && upgradeVersions[2] >= 12) || upgradeVersions[1] > 1) { // starting from 3.1.12.0
            return '3.1';
        } else {
            return '3.0';
        }
    }

    // should not happen
    return '1.0';
}

export const latestVersion = '6.0';