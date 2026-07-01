import {type IGlobalSettings} from "./interfaces/IGlobalSettings";

import {Defaults as DefaultsV1} from "./versions/v1/Defaults";
import {type ISettings as ISettingsV1} from "./versions/v1/ISettings";
import {validate as validateV1} from "./versions/v1/Validator";

import {
	convertFromPrevious as convertFromPreviousV2,
	convertToPrevious as convertToPreviousV2} from "./versions/v2/Converter";
import {Defaults as DefaultsV2} from "./versions/v2/Defaults";
import {type ISettings as ISettingsV2} from "./versions/v2/ISettings";
import {validate as validateV2} from "./versions/v2/Validator";

import {
	convertFromPrevious as convertFromPreviousV3,
	convertToPrevious as convertToPreviousV3} from "./versions/v3/Converter";
import {Defaults as DefaultsV3} from "./versions/v3/Defaults";
import {
	type ICameraSettings as ICameraSettingsV3,
	type IOrbitControlsSettings as IOrbitControlsSettingsV3,
	type IOrthographicCameraSettings as IOrthographicCameraSettingsV3,
	type IOrthographicControlsSettings as IOrthographicControlsSettingsV3,
	type IPerspectiveCameraSettings as IPerspectiveCameraSettingsV3} from "./versions/v3/ICameraSettings";
import {
	type IAmbientLightProperties as IAmbientLightPropertiesV3,
	type IDirectionalLightProperties as IDirectionalLightPropertiesV3,
	type IHemisphereLightProperties as IHemisphereLightPropertiesV3,
	type ILightSceneSettings as ILightSceneSettingsV3,
	type IPointLightProperties as IPointLightPropertiesV3,
	type ISpotLightProperties as ISpotLightPropertiesV3} from "./versions/v3/ILightSceneSettings";
import {type ISettings as ISettingsV3} from "./versions/v3/ISettings";
import {validate as validateV3} from "./versions/v3/Validator";

import {
	type ICameraSettings as ICameraSettingsV3_1,
	type IOrbitControlsSettings as IOrbitControlsSettingsV3_1,
	type IOrthographicCameraSettings as IOrthographicCameraSettingsV3_1,
	type IOrthographicControlsSettings as IOrthographicControlsSettingsV3_1,
	type IPerspectiveCameraSettings as IPerspectiveCameraSettingsV3_1} from "./versions/v3/ICameraSettings";
import {
	type IAmbientLightProperties as IAmbientLightPropertiesV3_1,
	type IDirectionalLightProperties as IDirectionalLightPropertiesV3_1,
	type IHemisphereLightProperties as IHemisphereLightPropertiesV3_1,
	type ILightSceneSettings as ILightSceneSettingsV3_1,
	type IPointLightProperties as IPointLightPropertiesV3_1,
	type ISpotLightProperties as ISpotLightPropertiesV3_1} from "./versions/v3/ILightSceneSettings";
import {
	convertFromPrevious as convertFromPreviousV3_1,
	convertToPrevious as convertToPreviousV3_1} from "./versions/v3_1/Converter";
import {Defaults as DefaultsV3_1} from "./versions/v3_1/Defaults";
import {type ISettings as ISettingsV3_1} from "./versions/v3_1/ISettings";
import {validate as validateV3_1} from "./versions/v3_1/Validator";

import {
	type ICameraSettings as ICameraSettingsV3_2,
	type IOrbitControlsSettings as IOrbitControlsSettingsV3_2,
	type IOrthographicCameraSettings as IOrthographicCameraSettingsV3_2,
	type IOrthographicControlsSettings as IOrthographicControlsSettingsV3_2,
	type IPerspectiveCameraSettings as IPerspectiveCameraSettingsV3_2} from "./versions/v3/ICameraSettings";
import {
	type IAmbientLightProperties as IAmbientLightPropertiesV3_2,
	type IDirectionalLightProperties as IDirectionalLightPropertiesV3_2,
	type IHemisphereLightProperties as IHemisphereLightPropertiesV3_2,
	type ILightSceneSettings as ILightSceneSettingsV3_2,
	type IPointLightProperties as IPointLightPropertiesV3_2,
	type ISpotLightProperties as ISpotLightPropertiesV3_2} from "./versions/v3/ILightSceneSettings";
import {
	convertFromPrevious as convertFromPreviousV3_2,
	convertToPrevious as convertToPreviousV3_2} from "./versions/v3_2/Converter";
import {Defaults as DefaultsV3_2} from "./versions/v3_2/Defaults";
import {type ISettings as ISettingsV3_2} from "./versions/v3_2/ISettings";
import {validate as validateV3_2} from "./versions/v3_2/Validator";

import {
	type ICameraSettings as ICameraSettingsV3_3,
	type IOrbitControlsSettings as IOrbitControlsSettingsV3_3,
	type IOrthographicCameraSettings as IOrthographicCameraSettingsV3_3,
	type IOrthographicControlsSettings as IOrthographicControlsSettingsV3_3,
	type IPerspectiveCameraSettings as IPerspectiveCameraSettingsV3_3} from "./versions/v3/ICameraSettings";
import {
	type IAmbientLightProperties as IAmbientLightPropertiesV3_3,
	type IDirectionalLightProperties as IDirectionalLightPropertiesV3_3,
	type IHemisphereLightProperties as IHemisphereLightPropertiesV3_3,
	type ILightSceneSettings as ILightSceneSettingsV3_3,
	type IPointLightProperties as IPointLightPropertiesV3_3,
	type ISpotLightProperties as ISpotLightPropertiesV3_3} from "./versions/v3/ILightSceneSettings";
import {
	convertFromPrevious as convertFromPreviousV3_3,
	convertToPrevious as convertToPreviousV3_3} from "./versions/v3_3/Converter";
import {Defaults as DefaultsV3_3} from "./versions/v3_3/Defaults";
import {type ISettings as ISettingsV3_3} from "./versions/v3_3/ISettings";
import {validate as validateV3_3} from "./versions/v3_3/Validator";

import {
	type ICameraSettings as ICameraSettingsV3_4,
	type IOrbitControlsSettings as IOrbitControlsSettingsV3_4,
	type IOrthographicCameraSettings as IOrthographicCameraSettingsV3_4,
	type IOrthographicControlsSettings as IOrthographicControlsSettingsV3_4,
	type IPerspectiveCameraSettings as IPerspectiveCameraSettingsV3_4} from "./versions/v3/ICameraSettings";
import {
	type IAmbientLightProperties as IAmbientLightPropertiesV3_4,
	type IDirectionalLightProperties as IDirectionalLightPropertiesV3_4,
	type IHemisphereLightProperties as IHemisphereLightPropertiesV3_4,
	type ILightSceneSettings as ILightSceneSettingsV3_4,
	type IPointLightProperties as IPointLightPropertiesV3_4,
	type ISpotLightProperties as ISpotLightPropertiesV3_4} from "./versions/v3/ILightSceneSettings";
import {
	convertFromPrevious as convertFromPreviousV3_4,
	convertToPrevious as convertToPreviousV3_4} from "./versions/v3_4/Converter";
import {Defaults as DefaultsV3_4} from "./versions/v3_4/Defaults";
import {type ISettings as ISettingsV3_4} from "./versions/v3_4/ISettings";
import {validate as validateV3_4} from "./versions/v3_4/Validator";

import {
	type ICameraSettings as ICameraSettingsV4_0,
	type IOrbitControlsSettings as IOrbitControlsSettingsV4_0,
	type IOrthographicCameraSettings as IOrthographicCameraSettingsV4_0,
	type IOrthographicControlsSettings as IOrthographicControlsSettingsV4_0,
	type IPerspectiveCameraSettings as IPerspectiveCameraSettingsV4_0} from "./versions/v3/ICameraSettings";
import {
	type IAmbientLightProperties as IAmbientLightPropertiesV4_0,
	type IDirectionalLightProperties as IDirectionalLightPropertiesV4_0,
	type IHemisphereLightProperties as IHemisphereLightPropertiesV4_0,
	type ILightSceneSettings as ILightSceneSettingsV4_0,
	type IPointLightProperties as IPointLightPropertiesV4_0,
	type ISpotLightProperties as ISpotLightPropertiesV4_0} from "./versions/v3/ILightSceneSettings";
import {
	convertFromPrevious as convertFromPreviousV4_0,
	convertToPrevious as convertToPreviousV4_0} from "./versions/v4/Converter";
import {Defaults as DefaultsV4_0} from "./versions/v4/Defaults";
import {type IPostProcessingEffectsArray as IPostProcessingEffectsArrayV4_0} from "./versions/v4/IPostProcessingEffectSettings";
import {type ISettings as ISettingsV4_0} from "./versions/v4/ISettings";
import {validate as validateV4_0} from "./versions/v4/Validator";

import {
	type ICameraSettings as ICameraSettingsV4_1,
	type IOrbitControlsSettings as IOrbitControlsSettingsV4_1,
	type IOrthographicCameraSettings as IOrthographicCameraSettingsV4_1,
	type IOrthographicControlsSettings as IOrthographicControlsSettingsV4_1,
	type IPerspectiveCameraSettings as IPerspectiveCameraSettingsV4_1} from "./versions/v3/ICameraSettings";
import {
	type IAmbientLightProperties as IAmbientLightPropertiesV4_1,
	type IDirectionalLightProperties as IDirectionalLightPropertiesV4_1,
	type IHemisphereLightProperties as IHemisphereLightPropertiesV4_1,
	type ILightSceneSettings as ILightSceneSettingsV4_1,
	type IPointLightProperties as IPointLightPropertiesV4_1,
	type ISpotLightProperties as ISpotLightPropertiesV4_1} from "./versions/v3/ILightSceneSettings";
import {type IPostProcessingEffectsArray as IPostProcessingEffectsArrayV4_1} from "./versions/v4/IPostProcessingEffectSettings";
import {
	convertFromPrevious as convertFromPreviousV4_1,
	convertToPrevious as convertToPreviousV4_1} from "./versions/v4_1/Converter";
import {Defaults as DefaultsV4_1} from "./versions/v4_1/Defaults";
import {ISettings as ISettingsV4_1} from "./versions/v4_1/ISettings";
import {validate as validateV4_1} from "./versions/v4_1/Validator";

import {
	type IAmbientLightProperties as IAmbientLightPropertiesV5,
	type IDirectionalLightProperties as IDirectionalLightPropertiesV5,
	type IHemisphereLightProperties as IHemisphereLightPropertiesV5,
	type ILightSceneSettings as ILightSceneSettingsV5,
	type IPointLightProperties as IPointLightPropertiesV5,
	type ISpotLightProperties as ISpotLightPropertiesV5} from "./versions/v3/ILightSceneSettings";
import {type IPostProcessingEffectsArray as IPostProcessingEffectsArrayV5} from "./versions/v4/IPostProcessingEffectSettings";
import {
	convertFromPrevious as convertFromPreviousV5,
	convertToPrevious as convertToPreviousV5} from "./versions/v5/Converter";
import {Defaults as DefaultsV5} from "./versions/v5/Defaults";
import {
	type ICameraControlsSettings as ICameraControlsSettingsV5,
	type ICameraSettings as ICameraSettingsV5,
	type IOrthographicCameraSettings as IOrthographicCameraSettingsV5,
	type IPerspectiveCameraSettings as IPerspectiveCameraSettingsV5} from "./versions/v5/ICameraSettings";
import {type ISettings as ISettingsV5} from "./versions/v5/ISettings";
import {validate as validateV5} from "./versions/v5/Validator";

import {
	type IAmbientLightProperties as IAmbientLightPropertiesV6,
	type IDirectionalLightProperties as IDirectionalLightPropertiesV6,
	type IHemisphereLightProperties as IHemisphereLightPropertiesV6,
	type ILightSceneSettings as ILightSceneSettingsV6,
	type IPointLightProperties as IPointLightPropertiesV6,
	type ISpotLightProperties as ISpotLightPropertiesV6} from "./versions/v3/ILightSceneSettings";
import {type IPostProcessingEffectsArray as IPostProcessingEffectsArrayV6} from "./versions/v4/IPostProcessingEffectSettings";
import {
	type ICameraControlsSettings as ICameraControlsSettingsV6,
	type ICameraSettings as ICameraSettingsV6,
	type IOrthographicCameraSettings as IOrthographicCameraSettingsV6,
	type IPerspectiveCameraSettings as IPerspectiveCameraSettingsV6} from "./versions/v5/ICameraSettings";
import {
	convertFromPrevious as convertFromPreviousV6,
	convertToPrevious as convertToPreviousV6} from "./versions/v6/Converter";
import {type ISettings as ISettingsV6} from "./versions/v6/ISettings";
import {validate as validateV6} from "./versions/v6/Validator";

import {
	type IAmbientLightProperties as IAmbientLightPropertiesV6_1,
	type IDirectionalLightProperties as IDirectionalLightPropertiesV6_1,
	type IHemisphereLightProperties as IHemisphereLightPropertiesV6_1,
	type ILightSceneSettings as ILightSceneSettingsV6_1,
	type IPointLightProperties as IPointLightPropertiesV6_1,
	type ISpotLightProperties as ISpotLightPropertiesV6_1} from "./versions/v3/ILightSceneSettings";
import {type IPostProcessingEffectsArray as IPostProcessingEffectsArrayV6_1} from "./versions/v4/IPostProcessingEffectSettings";
import {
	type ICameraControlsSettings as ICameraControlsSettingsV6_1,
	type ICameraSettings as ICameraSettingsV6_1,
	type IOrthographicCameraSettings as IOrthographicCameraSettingsV6_1,
	type IPerspectiveCameraSettings as IPerspectiveCameraSettingsV6_1} from "./versions/v5/ICameraSettings";
import {
	convertFromPrevious as convertFromPreviousV6_1,
	convertToPrevious as convertToPreviousV6_1} from "./versions/v6_1/Converter";
import {type ISettings as ISettingsV6_1} from "./versions/v6_1/ISettings";
import {validate as validateV6_1} from "./versions/v6_1/Validator";

import {
	type IAmbientLightProperties as IAmbientLightPropertiesV6_2,
	type IDirectionalLightProperties as IDirectionalLightPropertiesV6_2,
	type IHemisphereLightProperties as IHemisphereLightPropertiesV6_2,
	type ILightSceneSettings as ILightSceneSettingsV6_2,
	type IPointLightProperties as IPointLightPropertiesV6_2,
	type ISpotLightProperties as ISpotLightPropertiesV6_2} from "./versions/v3/ILightSceneSettings";
import {type IPostProcessingEffectsArray as IPostProcessingEffectsArrayV6_2} from "./versions/v4/IPostProcessingEffectSettings";
import {
	type ICameraControlsSettings as ICameraControlsSettingsV6_2,
	type ICameraSettings as ICameraSettingsV6_2,
	type IOrthographicCameraSettings as IOrthographicCameraSettingsV6_2,
	type IPerspectiveCameraSettings as IPerspectiveCameraSettingsV6_2} from "./versions/v5/ICameraSettings";
import {
	convertFromPrevious as convertFromPreviousV6_2,
	convertToPrevious as convertToPreviousV6_2} from "./versions/v6_2/Converter";
import {type ISettings as ISettingsV6_2} from "./versions/v6_2/ISettings";
import {validate as validateV6_2} from "./versions/v6_2/Validator";

import {
	type IAmbientLightProperties as IAmbientLightPropertiesV7,
	type IDirectionalLightProperties as IDirectionalLightPropertiesV7,
	type IHemisphereLightProperties as IHemisphereLightPropertiesV7,
	type ILightSceneSettings as ILightSceneSettingsV7,
	type IPointLightProperties as IPointLightPropertiesV7,
	type ISpotLightProperties as ISpotLightPropertiesV7} from "./versions/v3/ILightSceneSettings";
import {type IPostProcessingEffectsArray as IPostProcessingEffectsArrayV7} from "./versions/v4/IPostProcessingEffectSettings";
import {
	type ICameraControlsSettings as ICameraControlsSettingsV7,
	type ICameraSettings as ICameraSettingsV7,
	type IOrthographicCameraSettings as IOrthographicCameraSettingsV7,
	type IPerspectiveCameraSettings as IPerspectiveCameraSettingsV7} from "./versions/v5/ICameraSettings";
import {
	convertFromPrevious as convertFromPreviousV7,
	convertToPrevious as convertToPreviousV7} from "./versions/v7/Converter";
import {type ISettings as ISettingsV7} from "./versions/v7/ISettings";
import {validate as validateV7} from "./versions/v7/Validator";

import {
	type IAmbientLightProperties as IAmbientLightPropertiesV7_1,
	type IDirectionalLightProperties as IDirectionalLightPropertiesV7_1,
	type IHemisphereLightProperties as IHemisphereLightPropertiesV7_1,
	type ILightSceneSettings as ILightSceneSettingsV7_1,
	type IPointLightProperties as IPointLightPropertiesV7_1,
	type ISpotLightProperties as ISpotLightPropertiesV7_1} from "./versions/v3/ILightSceneSettings";
import {type IPostProcessingEffectsArray as IPostProcessingEffectsArrayV7_1} from "./versions/v4/IPostProcessingEffectSettings";
import {
	convertFromPrevious as convertFromPreviousV7_1,
	convertToPrevious as convertToPreviousV7_1} from "./versions/v7_1/Converter";
import {
	type ICameraControlsSettings as ICameraControlsSettingsV7_1,
	type ICameraSettings as ICameraSettingsV7_1,
	type IOrthographicCameraSettings as IOrthographicCameraSettingsV7_1,
	type IPerspectiveCameraSettings as IPerspectiveCameraSettingsV7_1} from "./versions/v7_1/ICameraSettings";
import {type ISettings as ISettingsV7_1} from "./versions/v7_1/ISettings";
import {validate as validateV7_1} from "./versions/v7_1/Validator";

export {DefaultsV1,
	DefaultsV2,
	DefaultsV3,
	DefaultsV3_1,
	DefaultsV3_2,
	DefaultsV3_3,
	DefaultsV3_4,
	DefaultsV4_0,
	DefaultsV4_1,
	DefaultsV5,
	ISettingsV4_1};
export type {IAmbientLightPropertiesV3,
	IAmbientLightPropertiesV3_1,
	IAmbientLightPropertiesV3_2,
	IAmbientLightPropertiesV3_3,
	IAmbientLightPropertiesV3_4,
	IAmbientLightPropertiesV4_0,
	IAmbientLightPropertiesV4_1,
	IAmbientLightPropertiesV5,
	IAmbientLightPropertiesV6,
	IAmbientLightPropertiesV6_1,
	IAmbientLightPropertiesV6_2,
	IAmbientLightPropertiesV7,
	IAmbientLightPropertiesV7_1,
	ICameraControlsSettingsV5,
	ICameraControlsSettingsV6,
	ICameraControlsSettingsV6_1,
	ICameraControlsSettingsV6_2,
	ICameraControlsSettingsV7,
	ICameraControlsSettingsV7_1,
	ICameraSettingsV3,
	ICameraSettingsV3_1,
	ICameraSettingsV3_2,
	ICameraSettingsV3_3,
	ICameraSettingsV3_4,
	ICameraSettingsV4_0,
	ICameraSettingsV4_1,
	ICameraSettingsV5,
	ICameraSettingsV6,
	ICameraSettingsV6_1,
	ICameraSettingsV6_2,
	ICameraSettingsV7,
	ICameraSettingsV7_1,
	IDirectionalLightPropertiesV3,
	IDirectionalLightPropertiesV3_1,
	IDirectionalLightPropertiesV3_2,
	IDirectionalLightPropertiesV3_3,
	IDirectionalLightPropertiesV3_4,
	IDirectionalLightPropertiesV4_0,
	IDirectionalLightPropertiesV4_1,
	IDirectionalLightPropertiesV5,
	IDirectionalLightPropertiesV6,
	IDirectionalLightPropertiesV6_1,
	IDirectionalLightPropertiesV6_2,
	IDirectionalLightPropertiesV7,
	IDirectionalLightPropertiesV7_1,
	IHemisphereLightPropertiesV3,
	IHemisphereLightPropertiesV3_1,
	IHemisphereLightPropertiesV3_2,
	IHemisphereLightPropertiesV3_3,
	IHemisphereLightPropertiesV3_4,
	IHemisphereLightPropertiesV4_0,
	IHemisphereLightPropertiesV4_1,
	IHemisphereLightPropertiesV5,
	IHemisphereLightPropertiesV6,
	IHemisphereLightPropertiesV6_1,
	IHemisphereLightPropertiesV6_2,
	IHemisphereLightPropertiesV7,
	IHemisphereLightPropertiesV7_1,
	ILightSceneSettingsV3,
	ILightSceneSettingsV3_1,
	ILightSceneSettingsV3_2,
	ILightSceneSettingsV3_3,
	ILightSceneSettingsV3_4,
	ILightSceneSettingsV4_0,
	ILightSceneSettingsV4_1,
	ILightSceneSettingsV5,
	ILightSceneSettingsV6,
	ILightSceneSettingsV6_1,
	ILightSceneSettingsV6_2,
	ILightSceneSettingsV7,
	ILightSceneSettingsV7_1,
	IOrbitControlsSettingsV3,
	IOrbitControlsSettingsV3_1,
	IOrbitControlsSettingsV3_2,
	IOrbitControlsSettingsV3_3,
	IOrbitControlsSettingsV3_4,
	IOrbitControlsSettingsV4_0,
	IOrbitControlsSettingsV4_1,
	IOrthographicCameraSettingsV3,
	IOrthographicCameraSettingsV3_1,
	IOrthographicCameraSettingsV3_2,
	IOrthographicCameraSettingsV3_3,
	IOrthographicCameraSettingsV3_4,
	IOrthographicCameraSettingsV4_0,
	IOrthographicCameraSettingsV4_1,
	IOrthographicCameraSettingsV5,
	IOrthographicCameraSettingsV6,
	IOrthographicCameraSettingsV6_1,
	IOrthographicCameraSettingsV6_2,
	IOrthographicCameraSettingsV7,
	IOrthographicCameraSettingsV7_1,
	IOrthographicControlsSettingsV3,
	IOrthographicControlsSettingsV3_1,
	IOrthographicControlsSettingsV3_2,
	IOrthographicControlsSettingsV3_3,
	IOrthographicControlsSettingsV3_4,
	IOrthographicControlsSettingsV4_0,
	IOrthographicControlsSettingsV4_1,
	IPerspectiveCameraSettingsV3,
	IPerspectiveCameraSettingsV3_1,
	IPerspectiveCameraSettingsV3_2,
	IPerspectiveCameraSettingsV3_3,
	IPerspectiveCameraSettingsV3_4,
	IPerspectiveCameraSettingsV4_0,
	IPerspectiveCameraSettingsV4_1,
	IPerspectiveCameraSettingsV5,
	IPerspectiveCameraSettingsV6,
	IPerspectiveCameraSettingsV6_1,
	IPerspectiveCameraSettingsV6_2,
	IPerspectiveCameraSettingsV7,
	IPerspectiveCameraSettingsV7_1,
	IPointLightPropertiesV3,
	IPointLightPropertiesV3_1,
	IPointLightPropertiesV3_2,
	IPointLightPropertiesV3_3,
	IPointLightPropertiesV3_4,
	IPointLightPropertiesV4_0,
	IPointLightPropertiesV4_1,
	IPointLightPropertiesV5,
	IPointLightPropertiesV6,
	IPointLightPropertiesV6_1,
	IPointLightPropertiesV6_2,
	IPointLightPropertiesV7,
	IPointLightPropertiesV7_1,
	IPostProcessingEffectsArrayV4_0,
	IPostProcessingEffectsArrayV4_1,
	IPostProcessingEffectsArrayV5,
	IPostProcessingEffectsArrayV6,
	IPostProcessingEffectsArrayV6_1,
	IPostProcessingEffectsArrayV6_2,
	IPostProcessingEffectsArrayV7,
	IPostProcessingEffectsArrayV7_1,
	ISettingsV1,
	ISettingsV2,
	ISettingsV3,
	ISettingsV3_1,
	ISettingsV3_2,
	ISettingsV3_3,
	ISettingsV3_4,
	ISettingsV4_0,
	ISettingsV5,
	ISettingsV6,
	ISettingsV6_1,
	ISettingsV6_2,
	ISettingsV7,
	ISettingsV7_1,
	ISpotLightPropertiesV3,
	ISpotLightPropertiesV3_1,
	ISpotLightPropertiesV3_2,
	ISpotLightPropertiesV3_3,
	ISpotLightPropertiesV3_4,
	ISpotLightPropertiesV4_0,
	ISpotLightPropertiesV4_1,
	ISpotLightPropertiesV5,
	ISpotLightPropertiesV6,
	ISpotLightPropertiesV6_1,
	ISpotLightPropertiesV6_2,
	ISpotLightPropertiesV7,
	ISpotLightPropertiesV7_1};
// this changes every version
export type {IAmbientLightPropertiesV7_1 as IAmbientLightProperties,
	ICameraControlsSettingsV7_1 as ICameraControlsSettings,
	ICameraSettingsV7_1 as ICameraSettings,
	IDirectionalLightPropertiesV7_1 as IDirectionalLightProperties,
	IHemisphereLightPropertiesV7_1 as IHemisphereLightProperties,
	ILightSceneSettingsV7_1 as ILightSceneSettings,
	IOrthographicCameraSettingsV7_1 as IOrthographicCameraSettings,
	IPerspectiveCameraSettingsV7_1 as IPerspectiveCameraSettings,
	IPointLightPropertiesV7_1 as IPointLightProperties,
	IPostProcessingEffectsArrayV7_1 as IPostProcessingEffectsArray,
	ISettingsV7_1 as ISettings,
	ISpotLightPropertiesV7_1 as ISpotLightProperties};

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
