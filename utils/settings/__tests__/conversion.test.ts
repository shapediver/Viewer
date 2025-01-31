import { ISettings as ISettingsV1 } from "../src/versions/v1/ISettings"
import { ISettings as ISettingsV2 } from "../src/versions/v2/ISettings"
import { ISettings as ISettingsV3 } from "../src/versions/v3/ISettings"
import { Defaults as DefaultsV1 } from "../src/versions/v1/Defaults";
import { Defaults as DefaultsV2 } from "../src/versions/v2/Defaults";
import { Defaults as DefaultsV3 } from "../src/versions/v3/Defaults";

import { convertFromPrevious as CFPv2, convertToPrevious as CTPv2 } from "../src/versions/v2/Converter";
import { convertFromPrevious as CFPv3, convertToPrevious as CTPv3 } from "../src/versions/v3/Converter";
import { convertFromPrevious as CFPv3_1, convertToPrevious as CTPv3_1 } from "../src/versions/v3_1/Converter";
import { DefaultsV3_1, ISettingsV3_1 } from "../src";

describe('conversion - V2', () => {
    it('convertFrom - equal', async () => {
        const defaultsV1 = DefaultsV1();
        const defaultsV2 = DefaultsV2();

        // settings v1 are different from settings v2, we therefore have to change the differences
        defaultsV1.cameraMovementDuration = 800;
        defaultsV1.rotateSpeed = 0.5;
        defaultsV1.zoomSpeed = 0.5;
        defaultsV1.showGrid = true;
        defaultsV1.showGroundPlane = true;
        defaultsV1.lightScenes = {};

        const converted = CFPv2(defaultsV1, '1.0');
        expect(JSON.stringify(converted)).toStrictEqual(JSON.stringify(defaultsV2));
    });

    it('convertFrom - not equal', async () => {
        const defaultsV1 = DefaultsV1();
        const defaultsV2 = DefaultsV2();

        defaultsV1.ambientOcclusion = false;

        // settings v1 are different from settings v2, we therefore have to change the differences
        defaultsV1.cameraMovementDuration = 800;
        defaultsV1.rotateSpeed = 0.5;
        defaultsV1.zoomSpeed = 0.5;
        defaultsV1.showGrid = true;
        defaultsV1.showGroundPlane = true;
        defaultsV1.lightScenes = {};

        const converted = CFPv2(defaultsV1, '1.0');
        expect(JSON.stringify(converted)).not.toStrictEqual(JSON.stringify(defaultsV2));
    });

    it('convertTo - equal', async () => {
        const defaultsV1 = DefaultsV1();
        const defaultsV2 = DefaultsV2();

        // settings v1 are different from settings v2, we therefore have to change the differences
        defaultsV2.viewer.scene.camera.cameraMovementDuration = 0;
        defaultsV2.viewer.scene.camera.controls.orbit.rotationSpeed = 0.25;
        defaultsV2.viewer.scene.camera.controls.orbit.zoomSpeed = 1.0;
        defaultsV2.viewer.scene.gridVisibility = false;
        defaultsV2.viewer.scene.groundPlaneVisibility = false;
        (<any>defaultsV2.viewer.scene.lights).lightScenes = null;

        const converted = CTPv2(defaultsV2, '2.0');
        expect(JSON.stringify(converted)).toStrictEqual(JSON.stringify(defaultsV1));
    });

    it('convertFrom - not equal', async () => {
        const defaultsV1 = DefaultsV1();
        const defaultsV2 = DefaultsV2();

        defaultsV2.viewer.scene.render.ambientOcclusion = false;

        // settings v1 are different from settings v2, we therefore have to change the differences
        defaultsV2.viewer.scene.camera.cameraMovementDuration = 0;
        defaultsV2.viewer.scene.camera.controls.orbit.rotationSpeed = 0.25;
        defaultsV2.viewer.scene.camera.controls.orbit.zoomSpeed = 1.0;
        defaultsV2.viewer.scene.gridVisibility = false;
        defaultsV2.viewer.scene.groundPlaneVisibility = false;
        defaultsV2.viewer.scene.lights.lightScenes = {};

        const converted = CTPv2(defaultsV2, '2.0');
        expect(JSON.stringify(converted)).not.toStrictEqual(JSON.stringify(defaultsV1));
    });
})


describe('conversion - V3', () => {
    it('convertFrom - equal', async () => {
        const defaultsV2 = DefaultsV2();
        const defaultsV3 = DefaultsV3();

        // settings V2 are different from settings V3, we therefore have to change the differences
        defaultsV2.viewer.scene.material.environmentMap = 'none';
        defaultsV2.viewer.scene.lights.lightScene = '';

        const converted = <ISettingsV3>CFPv3(defaultsV2, '2.0');

        // the default camera will be written into the cameras, to be conform with the default settings
        // we have to remove it
        expect(converted.camera.cameraId).toHaveLength(36); // uuid length
        expect(converted.camera.cameras[converted.camera.cameraId]).not.toBeUndefined(); // camera conversion

        converted.camera.cameraId = '';
        converted.camera.cameras = {};

        expect(JSON.stringify(converted)).toStrictEqual(JSON.stringify(defaultsV3));
    });

    it('convertFrom - not equal', async () => {
        const defaultsV2 = DefaultsV2();
        const defaultsV3 = DefaultsV3();

        defaultsV2.viewer.scene.render.ambientOcclusion = false;

        // settings V2 are different from settings V3, we therefore have to change the differences

        const converted = CFPv3(defaultsV2, '2.0');
        expect(JSON.stringify(converted)).not.toStrictEqual(JSON.stringify(defaultsV3));
    });

    it('convertTo - equal', async () => {
        const defaultsV2 = DefaultsV2();
        const defaultsV3 = DefaultsV3();

        // settings V2 are different from settings V3, we therefore have to change the differences
        defaultsV2.viewer.scene.material.environmentMap = 'none';
        
        const converted = CTPv3(defaultsV3, '3.0');
        expect(JSON.stringify(converted)).toStrictEqual(JSON.stringify(defaultsV2));
    });

    it('convertFrom - not equal', async () => {
        const defaultsV2 = DefaultsV2();
        const defaultsV3 = DefaultsV3();

        defaultsV3.rendering.ambientOcclusion = false;

        // settings V2 are different from settings V3, we therefore have to change the differences

        const converted = CTPv3(defaultsV3, '3.0');
        expect(JSON.stringify(converted)).not.toStrictEqual(JSON.stringify(defaultsV2));
    });
})


describe('conversion - V3.1', () => {
    it('convertFrom - equal', async () => {
        const defaultsV3 = DefaultsV3();
        const defaultsV3_1 = DefaultsV3_1();

        const converted = <ISettingsV3_1>CFPv3_1(defaultsV3, '3.0');
        converted.rendering.textureEncoding = 'srgb';
        converted.rendering.outputEncoding = 'srgb';
        converted.rendering.physicallyCorrectLights = true;
        converted.environment.map = 'photo_studio';
        converted.environmentGeometry.groundPlaneColor = '#636363ff';
        converted.environmentGeometry.gridColor = '#44444426';
        converted.rendering.ambientOcclusion = false;
        expect(JSON.stringify(converted)).toStrictEqual(JSON.stringify(defaultsV3_1));
    });

    it('convertFrom - not equal', async () => {
        const defaultsV3 = DefaultsV3();
        const defaultsV3_1 = DefaultsV3_1();

        defaultsV3.rendering.shadows = false;

        // settings V2 are different from settings V3, we therefore have to change the differences

        const converted = <ISettingsV3_1>CFPv3_1(defaultsV3, '3.0');
        converted.rendering.textureEncoding = 'srgb';
        converted.rendering.outputEncoding = 'srgb';
        converted.rendering.physicallyCorrectLights = true;
        converted.environment.map = 'photo_studio';
        converted.environmentGeometry.groundPlaneColor = '#636363ff';
        converted.environmentGeometry.gridColor = '#44444426';
        converted.rendering.ambientOcclusion = false;
        expect(JSON.stringify(converted)).not.toStrictEqual(JSON.stringify(defaultsV3_1));
    });

    it('convertTo - equal', async () => {
        const defaultsV3 = DefaultsV3();
        const defaultsV3_1 = DefaultsV3_1();

        defaultsV3.environment.map = 'photo_studio';
        defaultsV3.rendering.ambientOcclusion = false;

        const converted = CTPv3_1(defaultsV3_1, '3.1');
        expect(JSON.stringify(converted)).toStrictEqual(JSON.stringify(defaultsV3));
    });

    it('convertFrom - not equal', async () => {
        const defaultsV3 = DefaultsV3();
        const defaultsV3_1 = DefaultsV3_1();

        defaultsV3_1.rendering.shadows = false;

        const converted = CTPv3_1(defaultsV3_1, '3.1');
        expect(JSON.stringify(converted)).not.toStrictEqual(JSON.stringify(defaultsV3));
    });
})