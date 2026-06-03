import {IGlobalSettings} from "./interfaces/IGlobalSettings";

import {Defaults as DefaultsV1} from "./versions/v1/Defaults";
import {ISettings as ISettingsV1} from "./versions/v1/ISettings";
import {validate as validateV1} from "./versions/v1/Validator";

import {
	convertFromPrevious as convertFromPreviousV2,
	convertToPrevious as convertToPreviousV2,
} from "./versions/v2/Converter";
import {Defaults as DefaultsV2} from "./versions/v2/Defaults";
import {ISettings as ISettingsV2} from "./versions/v2/ISettings";
import {validate as validateV2} from "./versions/v2/Validator";

import {
	convertFromPrevious as convertFromPreviousV3,
	convertToPrevious as convertToPreviousV3,
} from "./versions/v3/Converter";
import {Defaults as DefaultsV3} from "./versions/v3/Defaults";
import {
	ICameraSettings as ICameraSettingsV3,
	IOrbitControlsSettings as IOrbitControlsSettingsV3,
	IOrthographicCameraSettings as IOrthographicCameraSettingsV3,
	IOrthographicControlsSettings as IOrthographicControlsSettingsV3,
	IPerspectiveCameraSettings as IPerspectiveCameraSettingsV3,
} from "./versions/v3/ICameraSettings";
import {
	IAmbientLightProperties as IAmbientLightPropertiesV3,
	IDirectionalLightProperties as IDirectionalLightPropertiesV3,
	IHemisphereLightProperties as IHemisphereLightPropertiesV3,
	ILightSceneSettings as ILightSceneSettingsV3,
	IPointLightProperties as IPointLightPropertiesV3,
	ISpotLightProperties as ISpotLightPropertiesV3,
} from "./versions/v3/ILightSceneSettings";
import {ISettings as ISettingsV3} from "./versions/v3/ISettings";
import {validate as validateV3} from "./versions/v3/Validator";

import {
	ICameraSettings as ICameraSettingsV3_1,
	IOrbitControlsSettings as IOrbitControlsSettingsV3_1,
	IOrthographicCameraSettings as IOrthographicCameraSettingsV3_1,
	IOrthographicControlsSettings as IOrthographicControlsSettingsV3_1,
	IPerspectiveCameraSettings as IPerspectiveCameraSettingsV3_1,
} from "./versions/v3/ICameraSettings";
import {
	IAmbientLightProperties as IAmbientLightPropertiesV3_1,
	IDirectionalLightProperties as IDirectionalLightPropertiesV3_1,
	IHemisphereLightProperties as IHemisphereLightPropertiesV3_1,
	ILightSceneSettings as ILightSceneSettingsV3_1,
	IPointLightProperties as IPointLightPropertiesV3_1,
	ISpotLightProperties as ISpotLightPropertiesV3_1,
} from "./versions/v3/ILightSceneSettings";
import {
	convertFromPrevious as convertFromPreviousV3_1,
	convertToPrevious as convertToPreviousV3_1,
} from "./versions/v3_1/Converter";
import {Defaults as DefaultsV3_1} from "./versions/v3_1/Defaults";
import {ISettings as ISettingsV3_1} from "./versions/v3_1/ISettings";
import {validate as validateV3_1} from "./versions/v3_1/Validator";

import {
	ICameraSettings as ICameraSettingsV3_2,
	IOrbitControlsSettings as IOrbitControlsSettingsV3_2,
	IOrthographicCameraSettings as IOrthographicCameraSettingsV3_2,
	IOrthographicControlsSettings as IOrthographicControlsSettingsV3_2,
	IPerspectiveCameraSettings as IPerspectiveCameraSettingsV3_2,
} from "./versions/v3/ICameraSettings";
import {
	IAmbientLightProperties as IAmbientLightPropertiesV3_2,
	IDirectionalLightProperties as IDirectionalLightPropertiesV3_2,
	IHemisphereLightProperties as IHemisphereLightPropertiesV3_2,
	ILightSceneSettings as ILightSceneSettingsV3_2,
	IPointLightProperties as IPointLightPropertiesV3_2,
	ISpotLightProperties as ISpotLightPropertiesV3_2,
} from "./versions/v3/ILightSceneSettings";
import {
	convertFromPrevious as convertFromPreviousV3_2,
	convertToPrevious as convertToPreviousV3_2,
} from "./versions/v3_2/Converter";
import {Defaults as DefaultsV3_2} from "./versions/v3_2/Defaults";
import {ISettings as ISettingsV3_2} from "./versions/v3_2/ISettings";
import {validate as validateV3_2} from "./versions/v3_2/Validator";

import {
	ICameraSettings as ICameraSettingsV3_3,
	IOrbitControlsSettings as IOrbitControlsSettingsV3_3,
	IOrthographicCameraSettings as IOrthographicCameraSettingsV3_3,
	IOrthographicControlsSettings as IOrthographicControlsSettingsV3_3,
	IPerspectiveCameraSettings as IPerspectiveCameraSettingsV3_3,
} from "./versions/v3/ICameraSettings";
import {
	IAmbientLightProperties as IAmbientLightPropertiesV3_3,
	IDirectionalLightProperties as IDirectionalLightPropertiesV3_3,
	IHemisphereLightProperties as IHemisphereLightPropertiesV3_3,
	ILightSceneSettings as ILightSceneSettingsV3_3,
	IPointLightProperties as IPointLightPropertiesV3_3,
	ISpotLightProperties as ISpotLightPropertiesV3_3,
} from "./versions/v3/ILightSceneSettings";
import {
	convertFromPrevious as convertFromPreviousV3_3,
	convertToPrevious as convertToPreviousV3_3,
} from "./versions/v3_3/Converter";
import {Defaults as DefaultsV3_3} from "./versions/v3_3/Defaults";
import {ISettings as ISettingsV3_3} from "./versions/v3_3/ISettings";
import {validate as validateV3_3} from "./versions/v3_3/Validator";

import {
	ICameraSettings as ICameraSettingsV3_4,
	IOrbitControlsSettings as IOrbitControlsSettingsV3_4,
	IOrthographicCameraSettings as IOrthographicCameraSettingsV3_4,
	IOrthographicControlsSettings as IOrthographicControlsSettingsV3_4,
	IPerspectiveCameraSettings as IPerspectiveCameraSettingsV3_4,
} from "./versions/v3/ICameraSettings";
import {
	IAmbientLightProperties as IAmbientLightPropertiesV3_4,
	IDirectionalLightProperties as IDirectionalLightPropertiesV3_4,
	IHemisphereLightProperties as IHemisphereLightPropertiesV3_4,
	ILightSceneSettings as ILightSceneSettingsV3_4,
	IPointLightProperties as IPointLightPropertiesV3_4,
	ISpotLightProperties as ISpotLightPropertiesV3_4,
} from "./versions/v3/ILightSceneSettings";
import {
	convertFromPrevious as convertFromPreviousV3_4,
	convertToPrevious as convertToPreviousV3_4,
} from "./versions/v3_4/Converter";
import {Defaults as DefaultsV3_4} from "./versions/v3_4/Defaults";
import {ISettings as ISettingsV3_4} from "./versions/v3_4/ISettings";
import {validate as validateV3_4} from "./versions/v3_4/Validator";

import {
	ICameraSettings as ICameraSettingsV4_0,
	IOrbitControlsSettings as IOrbitControlsSettingsV4_0,
	IOrthographicCameraSettings as IOrthographicCameraSettingsV4_0,
	IOrthographicControlsSettings as IOrthographicControlsSettingsV4_0,
	IPerspectiveCameraSettings as IPerspectiveCameraSettingsV4_0,
} from "./versions/v3/ICameraSettings";
import {
	IAmbientLightProperties as IAmbientLightPropertiesV4_0,
	IDirectionalLightProperties as IDirectionalLightPropertiesV4_0,
	IHemisphereLightProperties as IHemisphereLightPropertiesV4_0,
	ILightSceneSettings as ILightSceneSettingsV4_0,
	IPointLightProperties as IPointLightPropertiesV4_0,
	ISpotLightProperties as ISpotLightPropertiesV4_0,
} from "./versions/v3/ILightSceneSettings";
import {
	convertFromPrevious as convertFromPreviousV4_0,
	convertToPrevious as convertToPreviousV4_0,
} from "./versions/v4/Converter";
import {Defaults as DefaultsV4_0} from "./versions/v4/Defaults";
import {IPostProcessingEffectsArray as IPostProcessingEffectsArrayV4_0} from "./versions/v4/IPostProcessingEffectSettings";
import {ISettings as ISettingsV4_0} from "./versions/v4/ISettings";
import {validate as validateV4_0} from "./versions/v4/Validator";

import {
	ICameraSettings as ICameraSettingsV4_1,
	IOrbitControlsSettings as IOrbitControlsSettingsV4_1,
	IOrthographicCameraSettings as IOrthographicCameraSettingsV4_1,
	IOrthographicControlsSettings as IOrthographicControlsSettingsV4_1,
	IPerspectiveCameraSettings as IPerspectiveCameraSettingsV4_1,
} from "./versions/v3/ICameraSettings";
import {
	IAmbientLightProperties as IAmbientLightPropertiesV4_1,
	IDirectionalLightProperties as IDirectionalLightPropertiesV4_1,
	IHemisphereLightProperties as IHemisphereLightPropertiesV4_1,
	ILightSceneSettings as ILightSceneSettingsV4_1,
	IPointLightProperties as IPointLightPropertiesV4_1,
	ISpotLightProperties as ISpotLightPropertiesV4_1,
} from "./versions/v3/ILightSceneSettings";
import {IPostProcessingEffectsArray as IPostProcessingEffectsArrayV4_1} from "./versions/v4/IPostProcessingEffectSettings";
import {
	convertFromPrevious as convertFromPreviousV4_1,
	convertToPrevious as convertToPreviousV4_1,
} from "./versions/v4_1/Converter";
import {Defaults as DefaultsV4_1} from "./versions/v4_1/Defaults";
import {ISettings as ISettingsV4_1} from "./versions/v4_1/ISettings";
import {validate as validateV4_1} from "./versions/v4_1/Validator";

import {
	IAmbientLightProperties as IAmbientLightPropertiesV5,
	IDirectionalLightProperties as IDirectionalLightPropertiesV5,
	IHemisphereLightProperties as IHemisphereLightPropertiesV5,
	ILightSceneSettings as ILightSceneSettingsV5,
	IPointLightProperties as IPointLightPropertiesV5,
	ISpotLightProperties as ISpotLightPropertiesV5,
} from "./versions/v3/ILightSceneSettings";
import {IPostProcessingEffectsArray as IPostProcessingEffectsArrayV5} from "./versions/v4/IPostProcessingEffectSettings";
import {
	convertFromPrevious as convertFromPreviousV5,
	convertToPrevious as convertToPreviousV5,
} from "./versions/v5/Converter";
import {Defaults as DefaultsV5} from "./versions/v5/Defaults";
import {
	ICameraControlsSettings as ICameraControlsSettingsV5,
	ICameraSettings as ICameraSettingsV5,
	IOrthographicCameraSettings as IOrthographicCameraSettingsV5,
	IPerspectiveCameraSettings as IPerspectiveCameraSettingsV5,
} from "./versions/v5/ICameraSettings";
import {ISettings as ISettingsV5} from "./versions/v5/ISettings";
import {validate as validateV5} from "./versions/v5/Validator";

import {
	IAmbientLightProperties as IAmbientLightPropertiesV6,
	IDirectionalLightProperties as IDirectionalLightPropertiesV6,
	IHemisphereLightProperties as IHemisphereLightPropertiesV6,
	ILightSceneSettings as ILightSceneSettingsV6,
	IPointLightProperties as IPointLightPropertiesV6,
	ISpotLightProperties as ISpotLightPropertiesV6,
} from "./versions/v3/ILightSceneSettings";
import {IPostProcessingEffectsArray as IPostProcessingEffectsArrayV6} from "./versions/v4/IPostProcessingEffectSettings";
import {
	ICameraControlsSettings as ICameraControlsSettingsV6,
	ICameraSettings as ICameraSettingsV6,
	IOrthographicCameraSettings as IOrthographicCameraSettingsV6,
	IPerspectiveCameraSettings as IPerspectiveCameraSettingsV6,
} from "./versions/v5/ICameraSettings";
import {
	convertFromPrevious as convertFromPreviousV6,
	convertToPrevious as convertToPreviousV6,
} from "./versions/v6/Converter";
import {ISettings as ISettingsV6} from "./versions/v6/ISettings";
import {validate as validateV6} from "./versions/v6/Validator";

import {
	IAmbientLightProperties as IAmbientLightPropertiesV6_1,
	IDirectionalLightProperties as IDirectionalLightPropertiesV6_1,
	IHemisphereLightProperties as IHemisphereLightPropertiesV6_1,
	ILightSceneSettings as ILightSceneSettingsV6_1,
	IPointLightProperties as IPointLightPropertiesV6_1,
	ISpotLightProperties as ISpotLightPropertiesV6_1,
} from "./versions/v3/ILightSceneSettings";
import {IPostProcessingEffectsArray as IPostProcessingEffectsArrayV6_1} from "./versions/v4/IPostProcessingEffectSettings";
import {
	ICameraControlsSettings as ICameraControlsSettingsV6_1,
	ICameraSettings as ICameraSettingsV6_1,
	IOrthographicCameraSettings as IOrthographicCameraSettingsV6_1,
	IPerspectiveCameraSettings as IPerspectiveCameraSettingsV6_1,
} from "./versions/v5/ICameraSettings";
import {
	convertFromPrevious as convertFromPreviousV6_1,
	convertToPrevious as convertToPreviousV6_1,
} from "./versions/v6_1/Converter";
import {ISettings as ISettingsV6_1} from "./versions/v6_1/ISettings";
import {validate as validateV6_1} from "./versions/v6_1/Validator";

import {
	IAmbientLightProperties as IAmbientLightPropertiesV6_2,
	IDirectionalLightProperties as IDirectionalLightPropertiesV6_2,
	IHemisphereLightProperties as IHemisphereLightPropertiesV6_2,
	ILightSceneSettings as ILightSceneSettingsV6_2,
	IPointLightProperties as IPointLightPropertiesV6_2,
	ISpotLightProperties as ISpotLightPropertiesV6_2,
} from "./versions/v3/ILightSceneSettings";
import {IPostProcessingEffectsArray as IPostProcessingEffectsArrayV6_2} from "./versions/v4/IPostProcessingEffectSettings";
import {
	ICameraControlsSettings as ICameraControlsSettingsV6_2,
	ICameraSettings as ICameraSettingsV6_2,
	IOrthographicCameraSettings as IOrthographicCameraSettingsV6_2,
	IPerspectiveCameraSettings as IPerspectiveCameraSettingsV6_2,
} from "./versions/v5/ICameraSettings";
import {
	convertFromPrevious as convertFromPreviousV6_2,
	convertToPrevious as convertToPreviousV6_2,
} from "./versions/v6_2/Converter";
import {ISettings as ISettingsV6_2} from "./versions/v6_2/ISettings";
import {validate as validateV6_2} from "./versions/v6_2/Validator";

import {
	IAmbientLightProperties as IAmbientLightPropertiesV7,
	IDirectionalLightProperties as IDirectionalLightPropertiesV7,
	IHemisphereLightProperties as IHemisphereLightPropertiesV7,
	ILightSceneSettings as ILightSceneSettingsV7,
	IPointLightProperties as IPointLightPropertiesV7,
	ISpotLightProperties as ISpotLightPropertiesV7,
} from "./versions/v3/ILightSceneSettings";
import {IPostProcessingEffectsArray as IPostProcessingEffectsArrayV7} from "./versions/v4/IPostProcessingEffectSettings";
import {
	ICameraControlsSettings as ICameraControlsSettingsV7,
	ICameraSettings as ICameraSettingsV7,
	IOrthographicCameraSettings as IOrthographicCameraSettingsV7,
	IPerspectiveCameraSettings as IPerspectiveCameraSettingsV7,
} from "./versions/v5/ICameraSettings";
import {
	convertFromPrevious as convertFromPreviousV7,
	convertToPrevious as convertToPreviousV7,
} from "./versions/v7/Converter";
import {ISettings as ISettingsV7} from "./versions/v7/ISettings";
import {validate as validateV7} from "./versions/v7/Validator";

import {
	IAmbientLightProperties as IAmbientLightPropertiesV7_1,
	IDirectionalLightProperties as IDirectionalLightPropertiesV7_1,
	IHemisphereLightProperties as IHemisphereLightPropertiesV7_1,
	ILightSceneSettings as ILightSceneSettingsV7_1,
	IPointLightProperties as IPointLightPropertiesV7_1,
	ISpotLightProperties as ISpotLightPropertiesV7_1,
} from "./versions/v3/ILightSceneSettings";
import {IPostProcessingEffectsArray as IPostProcessingEffectsArrayV7_1} from "./versions/v4/IPostProcessingEffectSettings";
import {
	convertFromPrevious as convertFromPreviousV7_1,
	convertToPrevious as convertToPreviousV7_1,
} from "./versions/v7_1/Converter";
import {
	ICameraControlsSettings as ICameraControlsSettingsV7_1,
	ICameraSettings as ICameraSettingsV7_1,
	IOrthographicCameraSettings as IOrthographicCameraSettingsV7_1,
	IPerspectiveCameraSettings as IPerspectiveCameraSettingsV7_1,
} from "./versions/v7_1/ICameraSettings";
import {ISettings as ISettingsV7_1} from "./versions/v7_1/ISettings";
import {validate as validateV7_1} from "./versions/v7_1/Validator";

export {
	DefaultsV1,
	DefaultsV2,
	DefaultsV3,
	DefaultsV3_1,
	DefaultsV3_2,
	DefaultsV3_3,
	DefaultsV3_4,
	DefaultsV4_0,
	DefaultsV4_1,
	DefaultsV5,
	type IAmbientLightPropertiesV3,
	type IAmbientLightPropertiesV3_1,
	type IAmbientLightPropertiesV3_2,
	type IAmbientLightPropertiesV3_3,
	type IAmbientLightPropertiesV3_4,
	type IAmbientLightPropertiesV4_0,
	type IAmbientLightPropertiesV4_1,
	type IAmbientLightPropertiesV5,
	type IAmbientLightPropertiesV6,
	type IAmbientLightPropertiesV6_1,
	type IAmbientLightPropertiesV6_2,
	type IAmbientLightPropertiesV7,
	type IAmbientLightPropertiesV7_1,
	type ICameraControlsSettingsV5,
	type ICameraControlsSettingsV6,
	type ICameraControlsSettingsV6_1,
	type ICameraControlsSettingsV6_2,
	type ICameraControlsSettingsV7,
	type ICameraControlsSettingsV7_1,
	type ICameraSettingsV3,
	type ICameraSettingsV3_1,
	type ICameraSettingsV3_2,
	type ICameraSettingsV3_3,
	type ICameraSettingsV3_4,
	type ICameraSettingsV4_0,
	type ICameraSettingsV4_1,
	type ICameraSettingsV5,
	type ICameraSettingsV6,
	type ICameraSettingsV6_1,
	type ICameraSettingsV6_2,
	type ICameraSettingsV7,
	type ICameraSettingsV7_1,
	type IDirectionalLightPropertiesV3,
	type IDirectionalLightPropertiesV3_1,
	type IDirectionalLightPropertiesV3_2,
	type IDirectionalLightPropertiesV3_3,
	type IDirectionalLightPropertiesV3_4,
	type IDirectionalLightPropertiesV4_0,
	type IDirectionalLightPropertiesV4_1,
	type IDirectionalLightPropertiesV5,
	type IDirectionalLightPropertiesV6,
	type IDirectionalLightPropertiesV6_1,
	type IDirectionalLightPropertiesV6_2,
	type IDirectionalLightPropertiesV7,
	type IDirectionalLightPropertiesV7_1,
	type IHemisphereLightPropertiesV3,
	type IHemisphereLightPropertiesV3_1,
	type IHemisphereLightPropertiesV3_2,
	type IHemisphereLightPropertiesV3_3,
	type IHemisphereLightPropertiesV3_4,
	type IHemisphereLightPropertiesV4_0,
	type IHemisphereLightPropertiesV4_1,
	type IHemisphereLightPropertiesV5,
	type IHemisphereLightPropertiesV6,
	type IHemisphereLightPropertiesV6_1,
	type IHemisphereLightPropertiesV6_2,
	type IHemisphereLightPropertiesV7,
	type IHemisphereLightPropertiesV7_1,
	type ILightSceneSettingsV3,
	type ILightSceneSettingsV3_1,
	type ILightSceneSettingsV3_2,
	type ILightSceneSettingsV3_3,
	type ILightSceneSettingsV3_4,
	type ILightSceneSettingsV4_0,
	type ILightSceneSettingsV4_1,
	type ILightSceneSettingsV5,
	type ILightSceneSettingsV6,
	type ILightSceneSettingsV6_1,
	type ILightSceneSettingsV6_2,
	type ILightSceneSettingsV7,
	type ILightSceneSettingsV7_1,
	type IOrbitControlsSettingsV3,
	type IOrbitControlsSettingsV3_1,
	type IOrbitControlsSettingsV3_2,
	type IOrbitControlsSettingsV3_3,
	type IOrbitControlsSettingsV3_4,
	type IOrbitControlsSettingsV4_0,
	type IOrbitControlsSettingsV4_1,
	type IOrthographicCameraSettingsV3,
	type IOrthographicCameraSettingsV3_1,
	type IOrthographicCameraSettingsV3_2,
	type IOrthographicCameraSettingsV3_3,
	type IOrthographicCameraSettingsV3_4,
	type IOrthographicCameraSettingsV4_0,
	type IOrthographicCameraSettingsV4_1,
	type IOrthographicCameraSettingsV5,
	type IOrthographicCameraSettingsV6,
	type IOrthographicCameraSettingsV6_1,
	type IOrthographicCameraSettingsV6_2,
	type IOrthographicCameraSettingsV7,
	type IOrthographicCameraSettingsV7_1,
	type IOrthographicControlsSettingsV3,
	type IOrthographicControlsSettingsV3_1,
	type IOrthographicControlsSettingsV3_2,
	type IOrthographicControlsSettingsV3_3,
	type IOrthographicControlsSettingsV3_4,
	type IOrthographicControlsSettingsV4_0,
	type IOrthographicControlsSettingsV4_1,
	type IPerspectiveCameraSettingsV3,
	type IPerspectiveCameraSettingsV3_1,
	type IPerspectiveCameraSettingsV3_2,
	type IPerspectiveCameraSettingsV3_3,
	type IPerspectiveCameraSettingsV3_4,
	type IPerspectiveCameraSettingsV4_0,
	type IPerspectiveCameraSettingsV4_1,
	type IPerspectiveCameraSettingsV5,
	type IPerspectiveCameraSettingsV6,
	type IPerspectiveCameraSettingsV6_1,
	type IPerspectiveCameraSettingsV6_2,
	type IPerspectiveCameraSettingsV7,
	type IPerspectiveCameraSettingsV7_1,
	type IPointLightPropertiesV3,
	type IPointLightPropertiesV3_1,
	type IPointLightPropertiesV3_2,
	type IPointLightPropertiesV3_3,
	type IPointLightPropertiesV3_4,
	type IPointLightPropertiesV4_0,
	type IPointLightPropertiesV4_1,
	type IPointLightPropertiesV5,
	type IPointLightPropertiesV6,
	type IPointLightPropertiesV6_1,
	type IPointLightPropertiesV6_2,
	type IPointLightPropertiesV7,
	type IPointLightPropertiesV7_1,
	type IPostProcessingEffectsArrayV4_0,
	type IPostProcessingEffectsArrayV4_1,
	type IPostProcessingEffectsArrayV5,
	type IPostProcessingEffectsArrayV6,
	type IPostProcessingEffectsArrayV6_1,
	type IPostProcessingEffectsArrayV6_2,
	type IPostProcessingEffectsArrayV7,
	type IPostProcessingEffectsArrayV7_1,
	type ISettingsV1,
	type ISettingsV2,
	type ISettingsV3,
	type ISettingsV3_1,
	type ISettingsV3_2,
	type ISettingsV3_3,
	type ISettingsV3_4,
	type ISettingsV4_0,
	type ISettingsV4_1,
	type ISettingsV5,
	type ISettingsV6,
	type ISettingsV6_1,
	type ISettingsV6_2,
	type ISettingsV7,
	type ISettingsV7_1,
	type ISpotLightPropertiesV3,
	type ISpotLightPropertiesV3_1,
	type ISpotLightPropertiesV3_2,
	type ISpotLightPropertiesV3_3,
	type ISpotLightPropertiesV3_4,
	type ISpotLightPropertiesV4_0,
	type ISpotLightPropertiesV4_1,
	type ISpotLightPropertiesV5,
	type ISpotLightPropertiesV6,
	type ISpotLightPropertiesV6_1,
	type ISpotLightPropertiesV6_2,
	type ISpotLightPropertiesV7,
	type ISpotLightPropertiesV7_1,
};
// this changes every version
export {
	type IAmbientLightPropertiesV7_1 as IAmbientLightProperties,
	type ICameraControlsSettingsV7_1 as ICameraControlsSettings,
	type ICameraSettingsV7_1 as ICameraSettings,
	type IDirectionalLightPropertiesV7_1 as IDirectionalLightProperties,
	type IHemisphereLightPropertiesV7_1 as IHemisphereLightProperties,
	type ILightSceneSettingsV7_1 as ILightSceneSettings,
	type IOrthographicCameraSettingsV7_1 as IOrthographicCameraSettings,
	type IPerspectiveCameraSettingsV7_1 as IPerspectiveCameraSettings,
	type IPointLightPropertiesV7_1 as IPointLightProperties,
	type IPostProcessingEffectsArrayV7_1 as IPostProcessingEffectsArray,
	type ISettingsV7_1 as ISettings,
	type ISpotLightPropertiesV7_1 as ISpotLightProperties,
};

export type versions =
	| "1.0"
	| "2.0"
	| "3.0"
	| "3.1"
	| "3.2"
	| "3.3"
	| "3.4"
	| "4.0"
	| "4.1"
	| "5.0"
	| "6.0"
	| "6.1"
	| "6.2"
	| "7.0"
	| "7.1";
export const previousVersion: versions[] = [
	"1.0",
	"2.0",
	"3.0",
	"3.1",
	"3.2",
	"3.3",
	"3.4",
	"4.0",
	"4.1",
	"5.0",
	"6.0",
	"6.1",
	"6.2",
	"7.0",
];

const settingsUtilities: {
	version: versions;
	defaults?: () => IGlobalSettings;
	convertToPrevious: (s: IGlobalSettings, v: versions) => IGlobalSettings;
	convertFromPrevious: (s: IGlobalSettings, v: versions) => IGlobalSettings;
	validate: (s: any) => void;
}[] = [];
settingsUtilities.push({
	version: "1.0",
	defaults: DefaultsV1,
	convertToPrevious: (s) => s,
	convertFromPrevious: (s) => s,
	validate: validateV1,
});
settingsUtilities.push({
	version: "2.0",
	defaults: DefaultsV2,
	convertToPrevious: convertToPreviousV2,
	convertFromPrevious: convertFromPreviousV2,
	validate: validateV2,
});
settingsUtilities.push({
	version: "3.0",
	defaults: DefaultsV3,
	convertToPrevious: convertToPreviousV3,
	convertFromPrevious: convertFromPreviousV3,
	validate: validateV3,
});
settingsUtilities.push({
	version: "3.1",
	defaults: DefaultsV3_1,
	convertToPrevious: convertToPreviousV3_1,
	convertFromPrevious: convertFromPreviousV3_1,
	validate: validateV3_1,
});
settingsUtilities.push({
	version: "3.2",
	defaults: DefaultsV3_2,
	convertToPrevious: convertToPreviousV3_2,
	convertFromPrevious: convertFromPreviousV3_2,
	validate: validateV3_2,
});
settingsUtilities.push({
	version: "3.3",
	defaults: DefaultsV3_3,
	convertToPrevious: convertToPreviousV3_3,
	convertFromPrevious: convertFromPreviousV3_3,
	validate: validateV3_3,
});
settingsUtilities.push({
	version: "3.4",
	defaults: DefaultsV3_4,
	convertToPrevious: convertToPreviousV3_4,
	convertFromPrevious: convertFromPreviousV3_4,
	validate: validateV3_4,
});
settingsUtilities.push({
	version: "4.0",
	defaults: DefaultsV4_0,
	convertToPrevious: convertToPreviousV4_0,
	convertFromPrevious: convertFromPreviousV4_0,
	validate: validateV4_0,
});
settingsUtilities.push({
	version: "4.1",
	defaults: DefaultsV4_1,
	convertToPrevious: convertToPreviousV4_1,
	convertFromPrevious: convertFromPreviousV4_1,
	validate: validateV4_1,
});
settingsUtilities.push({
	version: "5.0",
	defaults: DefaultsV5,
	convertToPrevious: convertToPreviousV5,
	convertFromPrevious: convertFromPreviousV5,
	validate: validateV5,
});
settingsUtilities.push({
	version: "6.0",
	convertToPrevious: convertToPreviousV6,
	convertFromPrevious: convertFromPreviousV6,
	validate: validateV6,
});
settingsUtilities.push({
	version: "6.1",
	convertToPrevious: convertToPreviousV6_1,
	convertFromPrevious: convertFromPreviousV6_1,
	validate: validateV6_1,
});
settingsUtilities.push({
	version: "6.2",
	convertToPrevious: convertToPreviousV6_2,
	convertFromPrevious: convertFromPreviousV6_2,
	validate: validateV6_2,
});
settingsUtilities.push({
	version: "7.0",
	convertToPrevious: convertToPreviousV7,
	convertFromPrevious: convertFromPreviousV7,
	validate: validateV7,
});
settingsUtilities.push({
	version: "7.1",
	convertToPrevious: convertToPreviousV7_1,
	convertFromPrevious: convertFromPreviousV7_1,
	validate: validateV7_1,
});

/**
 * Convert the provided settings to the target version provided.
 * The settings object will be validate beforehand, an error will be thrown if the validation was not successful.
 *
 * @param settings
 * @param targetVersion
 * @returns
 */
export const convert = (
	settings: any,
	targetVersion: versions,
): IGlobalSettings => {
	const original_version = settings.settings_version || "1.0";
	if (original_version === targetVersion) return settings;
	const target = settingsUtilities.findIndex((util) => {
		return util.version === targetVersion;
	});
	const current = settingsUtilities.findIndex((util) => {
		return util.version === original_version;
	});
	if (target === -1)
		throw new Error("ViewerSettings.convert: Target version not available");
	if (current === -1)
		throw new Error(
			"ViewerSettings.convert: Settings version not available",
		);

	let tempSettings: IGlobalSettings = settings;
	if (target < current) {
		for (let i = current; target < i; i--)
			tempSettings = settingsUtilities[i].convertToPrevious(
				tempSettings,
				original_version,
			);
	} else {
		for (let i = current + 1; i <= target; i++)
			tempSettings = settingsUtilities[i].convertFromPrevious(
				tempSettings,
				original_version,
			);
	}
	return tempSettings;
};

/**
 * Validate the provided settings. If not target version is specified, an extraction of the version from the settings object is attempted.
 * If the validation is not successful, an error is thrown with the necessary information on why the validation failed.
 *
 * @param settings
 * @param targetVersion
 */
export const validate = (settings: any, targetVersion?: versions): void => {
	const settings_version = settings.settings_version || "1.0";
	if (targetVersion !== undefined) {
		const index = settingsUtilities.findIndex((util) => {
			return util.version === targetVersion;
		});
		if (index === -1)
			throw new Error(
				"ViewerSettings.validate: Target version was not found.",
			);
		if (
			settings_version !== undefined &&
			settings_version !== targetVersion
		)
			throw new Error(
				"ViewerSettings.validate: The settings do have a different version than the target version.",
			);
		settingsUtilities[index].validate(settings);
	} else {
		if (!settings_version)
			throw new Error(
				"ViewerSettings.validate: Settings do not have a version specified.",
			);
		const index = settingsUtilities.findIndex((util) => {
			return util.version === settings_version;
		});
		settingsUtilities[index].validate(settings);
	}
};

/**
 * Evaluate which settings version to use by using the viewer version.
 *
 * @param viewerVersion
 * @returns
 */
export const evaluateSettingsVersion = (viewerVersion?: string): versions => {
	// case 1: no version, return 1.0
	if (!viewerVersion || viewerVersion.startsWith("1")) return "1.0";

	// case 2: starts with 2, if higher or equal than 2.18.0, return 2.0
	if (viewerVersion.startsWith("2")) {
		const upgradeVersions = viewerVersion
			.split(".")
			.map((item) => item.match(/^\d+/)?.[0])
			.filter(Boolean)
			.map((match) => parseInt(match!));

		if (upgradeVersions[1] >= 18) {
			return "2.0";
		} else {
			return "1.0";
		}
	}

	// case 3: starts with 3, return 3.0 or higher
	if (viewerVersion.startsWith("3")) {
		const upgradeVersions = viewerVersion
			.split(".")
			.map((item) => item.match(/^\d+/)?.[0])
			.filter(Boolean)
			.map((match) => parseInt(match!));

		if (upgradeVersions[1] >= 3 && upgradeVersions[2] >= 16) {
			// starting from 3.3.16.0
			return "7.1";
		} else if (upgradeVersions[1] >= 3 && upgradeVersions[2] >= 12) {
			// starting from 3.3.12.0
			return "7.0";
		} else if (upgradeVersions[1] >= 3 && upgradeVersions[2] >= 11) {
			// starting from 3.3.11.0
			return "6.2";
		} else if (upgradeVersions[1] >= 3 && upgradeVersions[2] >= 8) {
			// starting from 3.3.8.0
			// version 6.0 was never really in use due to a bug in the versioning
			return "6.1";
		} else if (upgradeVersions[1] >= 3) {
			// starting from 3.3.0.0
			return "5.0";
		} else if (upgradeVersions[1] === 2 && upgradeVersions[2] >= 11) {
			// starting from 3.2.11.0
			return "4.1";
		} else if (upgradeVersions[1] === 2 && upgradeVersions[2] >= 10) {
			// starting from 3.2.10.0
			return "4.0";
		} else if (upgradeVersions[1] === 2 && upgradeVersions[2] >= 9) {
			// starting from 3.2.9.0
			return "3.4";
		} else if (upgradeVersions[1] === 2 && upgradeVersions[2] >= 7) {
			// starting from 3.2.7.0
			return "3.3";
		} else if (upgradeVersions[1] === 2 && upgradeVersions[2] >= 6) {
			// starting from 3.2.6.0
			return "3.2";
		} else if (
			(upgradeVersions[1] === 1 && upgradeVersions[2] >= 12) ||
			upgradeVersions[1] > 1
		) {
			// starting from 3.1.12.0
			return "3.1";
		} else {
			return "3.0";
		}
	}

	// should not happen
	return "1.0";
};

export const latestVersion = "7.1";
