import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import webdriver, { WebDriver } from "selenium-webdriver";
require('chromedriver');
import { api as API } from "@shapediver/viewer"
import { screenshotCompare } from "../../general/src/setup";
import { capabilities as allCapabilities, DesktopCapabilities, MobileCapabilities } from "../../general/src/capabilities";
import { vec3 } from "gl-matrix";
import { OrthographicCamera } from "../../../api/api/node_modules/@shapediver/viewer.rendering-engine.camera-engine/dist";
import { OrthographicCameraControls } from "../../../api/api/node_modules/@shapediver/viewer.rendering-engine.camera-engine/dist";
import { PerspectiveCameraControls } from "../../../api/api/node_modules/@shapediver/viewer.rendering-engine.camera-engine/dist";
import { PerspectiveCamera } from "../../../api/api/node_modules/@shapediver/viewer.rendering-engine.camera-engine/dist";

for (let c = 0; c < allCapabilities.length; c++) {
    const capabilities = Object.assign({ 'name': 'selenium_tests', 'build': require('../../../api/api/package.json').version }, allCapabilities[c]);
    let name = 'settings_tests';

    if (process.env.PORT !== 'browserstack') {
        name = 'settings_tests';
        c = allCapabilities.length;
    } else {
        name = 'settings_tests ' + ((allCapabilities[c] as DesktopCapabilities).os ?
            (<DesktopCapabilities>capabilities).os + ' ' + (<DesktopCapabilities>capabilities).os_version + ' ' + (<DesktopCapabilities>capabilities).browserName + ' ' + (<DesktopCapabilities>capabilities).browser_version :
            (<MobileCapabilities>capabilities).device + ' ' + (<MobileCapabilities>capabilities).os_version);
    }

    let driver: WebDriver;

    describe('Settings Tests', () => {
        beforeAll(async () => {
            console.log(name)

            if (process.env.PORT !== 'browserstack') {
                driver = await new webdriver.Builder().withCapabilities(webdriver.Capabilities.chrome()).build();
            } else {
                driver = await new webdriver.Builder().usingServer('http://alexanderschiftn1:csj6VCzMwzBYyRecsbm2@hub-cloud.browserstack.com/wd/hub').withCapabilities(capabilities).build();
            }

            await driver.navigate().to('https://viewer.shapediver.com/v3/latest/test/index.html')
            const TIMEOUT = 300000000
            await driver.manage().setTimeouts({ implicit: TIMEOUT, pageLoad: TIMEOUT, script: TIMEOUT });
        });

        afterAll(async () => {
            await driver.quit();
        });

        it('settings', async () => {
            // TODO build_date
            // TODO build_version
            // TODO settings_version
            // TODO viewer.blurSceneWhenBusy
            // TODO viewer.scene.showSceneTransition
            // TODO viewer.scene.camera.active
            const settings: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
                let session = await api.createAndInitializeSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                cb({
                    controlOrder: session.controlOrder,
                    controlNames: session.controlNames,
                    controlHidden: session.controlHidden,
                    loggingLevel: api.loggingLevel,
                    showMessages: api.showMessages,
                    commitParameters: session.commitParameters,
                    commitSettings: session.commitSettings,
                    show: viewer.show,
                    gridVisibility: viewer.gridVisibility,
                    groundPlaneVisibility: viewer.groundPlaneVisibility,
                    lightScene: viewer.lightScene,
                    environmentMap: viewer.environmentMap,
                    environmentMapAsBackground: viewer.environmentMapAsBackground,
                    environmentMapResolution: viewer.environmentMapResolution,
                    ambientOcclusion: viewer.ambientOcclusion,
                    beautyRenderDelay: viewer.beautyRenderDelay,
                    beautyRenderBlendingDuration: viewer.beautyRenderBlendingDuration,
                    clearColor: viewer.clearColor,
                    clearAlpha: viewer.clearAlpha,
                    pointSize: viewer.pointSize,
                    shadows: viewer.shadows,

                });
            });
            expect(Array.isArray(settings.controlOrder)).toBe(true);
            expect(settings.controlOrder.length).toBe(11);
            expect(Object.values(settings.controlNames)[0]).toBe('COLOR');
            expect(Array.isArray(settings.controlHidden)).toBe(true);
            expect(settings.controlHidden.length).toBe(9);
            expect(settings.loggingLevel).toBe('none');
            expect(settings.showMessages).toBe(true);
            expect(settings.commitParameters).toBe(false);
            expect(settings.commitSettings).toBe(false);
            expect(settings.show).toBe(false);
            expect(settings.gridVisibility).toBe(true);
            expect(settings.groundPlaneVisibility).toBe(true);
            expect(settings.lightScene).toBe('default');
            expect(settings.environmentMap).toBe('none');
            expect(settings.environmentMapAsBackground).toBe(false);
            expect(settings.environmentMapResolution).toBe("1024");
            expect(settings.ambientOcclusion).toBe(true);
            expect(settings.beautyRenderDelay).toBe(50);
            expect(settings.beautyRenderBlendingDuration).toBe(1500);
            expect(settings.clearColor).toBe('#ffffff');         
            expect(settings.clearAlpha).toBe(1);
            expect(settings.pointSize).toBe(1);
            expect(settings.shadows).toBe(true);

        });
        
        it('camera perspective', async () => {
            const settings: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
                const c: PerspectiveCamera = (<PerspectiveCamera><unknown>viewer.createPerspectiveCamera());
                const controls: PerspectiveCameraControls = (<PerspectiveCameraControls><unknown>(<PerspectiveCamera><unknown>c).controls);
                viewer.assignCamera(c.id)
                let session = await api.createAndInitializeSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                cb({
                    autoAdjust: c.autoAdjust,
                    cameraMovementDuration: c.cameraMovementDuration,
                    enableCameraControls: c.enableCameraControls,
                    revertAtMouseUp: c.revertAtMouseUp,
                    revertAtMouseUpDuration: c.revertAtMouseUpDuration,
                    zoomExtentsFactor: c.zoomExtentsFactor,
                    defaultPosition: c.defaultPosition,
                    defaultTarget: c.defaultTarget,
                    fov: c.fov,
                    autoRotationSpeed: controls.autoRotationSpeed,
                    damping: controls.damping,
                    enableAutoRotation: controls.enableAutoRotation,
                    enableKeyPan: controls.enableKeyPan,
                    enablePan: controls.enablePan,
                    enableRotation: controls.enableRotation,
                    enableZoom: controls.enableZoom,
                    input: controls.input,
                    keyPanSpeed: controls.keyPanSpeed,
                    movementSmoothness: controls.movementSmoothness,
                    rotationSpeed: controls.rotationSpeed,
                    panSpeed: controls.panSpeed,
                    zoomSpeed: controls.zoomSpeed,
                    cubePositionRestriction: controls.cubePositionRestriction,
                    cubeTargetRestriction: controls.cubeTargetRestriction,
                    spherePositionRestriction: controls.spherePositionRestriction,
                    sphereTargetRestriction: controls.sphereTargetRestriction,
                    rotationRestriction: controls.rotationRestriction,
                    zoomRestriction: controls.zoomRestriction
                });
            });
            expect(settings.autoAdjust).toBe(false);
            expect(settings.cameraMovementDuration).toBe(800);
            expect(settings.enableCameraControls).toBe(true);
            expect(settings.revertAtMouseUp).toBe(false);
            expect(settings.revertAtMouseUpDuration).toBe(800);
            expect(settings.zoomExtentsFactor).toBe(1);
            expect(settings.defaultPosition[0]).toBe(0);
            expect(settings.defaultPosition[1]).toBe(0);
            expect(settings.defaultPosition[2]).toBe(0);
            expect(settings.defaultTarget[0]).toBe(0);
            expect(settings.defaultTarget[1]).toBe(0);
            expect(settings.defaultTarget[2]).toBe(0);
            expect(settings.fov).toBe(45);
            expect(settings.autoRotationSpeed).toBe(0);
            expect(settings.damping).toBe(0.1);
            expect(settings.enableAutoRotation).toBe(false);
            expect(settings.enableKeyPan).toBe(false);
            expect(settings.enablePan).toBe(true);
            expect(settings.enableRotation).toBe(true);
            expect(settings.enableZoom).toBe(true);
            expect(settings.input).toEqual({ keys: { up: 38, down: 40, left: 37, right: 39 }, mouse: { rotate: 0, zoom: 1, pan: 2 }, touch: { rotate: 1, zoom: 2, pan: 3 }, });
            expect(settings.keyPanSpeed).toBe(0.5);
            expect(settings.movementSmoothness).toBe(0.5);
            expect(settings.rotationSpeed).toBe(0.5);
            expect(settings.panSpeed).toBe(0.5);
            expect(settings.zoomSpeed).toBe(0.5);            
            expect(settings.cubePositionRestriction.min[0]).toBe(null); // should be -Infinity but serialization doesn't work
            expect(settings.cubePositionRestriction.min[1]).toBe(null); // should be -Infinity but serialization doesn't work
            expect(settings.cubePositionRestriction.min[2]).toBe(null); // should be -Infinity but serialization doesn't work
            expect(settings.cubePositionRestriction.max[0]).toBe(null); // should be Infinity but serialization doesn't work
            expect(settings.cubePositionRestriction.max[1]).toBe(null); // should be Infinity but serialization doesn't work
            expect(settings.cubePositionRestriction.max[2]).toBe(null); // should be Infinity but serialization doesn't work
            expect(settings.cubeTargetRestriction.min[0]).toBe(null); // should be -Infinity but serialization doesn't work
            expect(settings.cubeTargetRestriction.min[1]).toBe(null); // should be -Infinity but serialization doesn't work
            expect(settings.cubeTargetRestriction.min[2]).toBe(null); // should be -Infinity but serialization doesn't work
            expect(settings.cubeTargetRestriction.max[0]).toBe(null); // should be Infinity but serialization doesn't work
            expect(settings.cubeTargetRestriction.max[1]).toBe(null); // should be Infinity but serialization doesn't work
            expect(settings.cubeTargetRestriction.max[2]).toBe(null); // should be Infinity but serialization doesn't work
            expect(settings.spherePositionRestriction.center[0]).toBe(0);
            expect(settings.spherePositionRestriction.center[1]).toBe(0);
            expect(settings.spherePositionRestriction.center[2]).toBe(0);
            expect(settings.spherePositionRestriction.radius).toBe(null); // should be Infinity but serialization doesn't work
            expect(settings.sphereTargetRestriction.center[0]).toBe(0);
            expect(settings.sphereTargetRestriction.center[1]).toBe(0);
            expect(settings.sphereTargetRestriction.center[2]).toBe(0);
            expect(settings.sphereTargetRestriction.radius).toBe(null); // should be Infinity but serialization doesn't work
            expect(settings.rotationRestriction.minPolarAngle).toBe(0);
            expect(settings.rotationRestriction.maxPolarAngle).toBe(180);
            expect(settings.rotationRestriction.minAzimuthAngle).toBe(null); // should be -Infinity but serialization doesn't work
            expect(settings.rotationRestriction.maxAzimuthAngle).toBe(null); // should be Infinity but serialization doesn't work
            expect(settings.zoomRestriction.minDistance).toBe(0);
            expect(settings.zoomRestriction.maxDistance).toBe(null); // should be Infinity but serialization doesn't work
        });

        it('camera perspective', async () => {
            const settings: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
                const c: OrthographicCamera = (<OrthographicCamera><unknown>viewer.createOrthographicCamera());
                const controls: OrthographicCameraControls = (<OrthographicCameraControls><unknown>(<OrthographicCamera><unknown>c).controls);
                viewer.assignCamera(c.id)
                let session = await api.createAndInitializeSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                cb({
                    autoAdjust: c.autoAdjust,
                    cameraMovementDuration: c.cameraMovementDuration,
                    enableCameraControls: c.enableCameraControls,
                    revertAtMouseUp: c.revertAtMouseUp,
                    revertAtMouseUpDuration: c.revertAtMouseUpDuration,
                    zoomExtentsFactor: c.zoomExtentsFactor,
                    defaultPosition: c.defaultPosition,
                    defaultTarget: c.defaultTarget,
                    damping: controls.damping,
                    enableKeyPan: controls.enableKeyPan,
                    enablePan: controls.enablePan,
                    enableZoom: controls.enableZoom,
                    input: controls.input,
                    keyPanSpeed: controls.keyPanSpeed,
                    movementSmoothness: controls.movementSmoothness,
                    panSpeed: controls.panSpeed,
                    zoomSpeed: controls.zoomSpeed
                });
            });
            expect(settings.autoAdjust).toBe(false);
            expect(settings.cameraMovementDuration).toBe(800);
            expect(settings.enableCameraControls).toBe(true);
            expect(settings.revertAtMouseUp).toBe(false);
            expect(settings.revertAtMouseUpDuration).toBe(800);
            expect(settings.zoomExtentsFactor).toBe(1);
            expect(settings.defaultPosition[0]).toBe(0);
            expect(settings.defaultPosition[1]).toBe(0);
            expect(settings.defaultPosition[2]).toBe(0);
            expect(settings.defaultTarget[0]).toBe(0);
            expect(settings.defaultTarget[1]).toBe(0);
            expect(settings.defaultTarget[2]).toBe(0);
            expect(settings.damping).toBe(0.1);
            expect(settings.enableKeyPan).toBe(false);
            expect(settings.enablePan).toBe(true);
            expect(settings.enableZoom).toBe(true);
            expect(settings.input).toEqual({ keys: { up: 38, down: 40, left: 37, right: 39 }, mouse: { rotate: 0, zoom: 1, pan: 2 }, touch: { rotate: 1, zoom: 2, pan: 3 }, });
            expect(settings.keyPanSpeed).toBe(0.5);
            expect(settings.movementSmoothness).toBe(0.5);
            expect(settings.panSpeed).toBe(0.5);
            expect(settings.zoomSpeed).toBe(0.5);
        });
    });
}
