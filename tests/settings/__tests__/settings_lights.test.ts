import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import webdriver, { WebDriver } from "selenium-webdriver";
require('chromedriver');
import { api as API} from "@shapediver/viewer"
import { screenshotCompare } from "../../general/src/setup";
import { capabilities as allCapabilities, DesktopCapabilities, MobileCapabilities } from "../../general/src/capabilities";
import { SettingsEngine } from "../../../rendering-engine/camera-engine/node_modules/@shapediver/viewer.shared.services/dist";
import { build_data } from "@shapediver/viewer/src/build_data";
const originalSettings = {
    // build_date: '', // this will be different every time
    // build_version: '', // this will be different every time
    'parameters.controlNames': { 'dd319731-fb8a-4aa2-9aef-ac85e96a3060': 'COLOR' },
    'parameters.controlOrder': [
        '7ad4db6d-dc94-48b1-8e89-486b75b29df9',
        '23033d60-7078-4836-99ce-990668e4429d',
        '5a5aad86-8173-4bbe-8184-54656370cd4b',
        '30c907b3-dbcf-4266-9f8f-835bb2353cb6',
        'd0ecb53a-90f1-44d6-a6a5-fa47d4a38771',
        '1d1af051-22fd-4f3a-a34c-1882c60a7fda',
        'de76cade-0cea-47b1-879e-1a0b717910e1',
        'dd319731-fb8a-4aa2-9aef-ac85e96a3060',
        '9d9e7f0b-385c-495d-825e-3fec2ce9762d',
        '55b36bef-a2e8-47cb-bd96-8631f95b11be',
        '136b5b03-c3a3-40a1-bc51-009a71c9fc44'
    ],
    'parameters.parametersHidden': [
        '7ad4db6d-dc94-48b1-8e89-486b75b29df9',
        '23033d60-7078-4836-99ce-990668e4429d',
        '5a5aad86-8173-4bbe-8184-54656370cd4b',
        '30c907b3-dbcf-4266-9f8f-835bb2353cb6',
        'd0ecb53a-90f1-44d6-a6a5-fa47d4a38771',
        '1d1af051-22fd-4f3a-a34c-1882c60a7fda',
        '9d9e7f0b-385c-495d-825e-3fec2ce9762d',
        '55b36bef-a2e8-47cb-bd96-8631f95b11be',
        '136b5b03-c3a3-40a1-bc51-009a71c9fc44'
    ],
    settings_version: '2.0',
    'viewer.blurSceneWhenBusy': true,
    'viewer.commitParameters': false,
    'viewer.commitSettings': false,
    'viewer.scene.camera.autoAdjust': false,
    'viewer.scene.camera.cameraMovementDuration': 800,
    'viewer.scene.camera.cameraTypes.active': 0,
    'viewer.scene.camera.cameraTypes.orthographic.default': { position: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 } },
    'viewer.scene.camera.cameraTypes.perspective.default': { position: { x: 58.03696060180664, y: -290.11590576171875, z: 87.67756652832031 }, target: { x: 0, y: 7, z: -3.25 } },
    'viewer.scene.camera.cameraTypes.perspective.fov': 45,
    'viewer.scene.camera.controls.orbit.autoRotationSpeed': 0,
    'viewer.scene.camera.controls.orbit.damping': 0.1,
    'viewer.scene.camera.controls.orbit.enableAutoRotation': false,
    'viewer.scene.camera.controls.orbit.enableKeyPan': false,
    'viewer.scene.camera.controls.orbit.enablePan': true,
    'viewer.scene.camera.controls.orbit.enableRotation': true,
    'viewer.scene.camera.controls.orbit.enableZoom': true,
    'viewer.scene.camera.controls.orbit.input': {
        keys: { down: 40, left: 37, right: 39, up: 38 },
        mouse: { pan: 2, rotate: 0, zoom: 1 },
        touch: { pan: 3, rotate: 1, zoom: 2 }
    },
    'viewer.scene.camera.controls.orbit.keyPanSpeed': 0.5,
    'viewer.scene.camera.controls.orbit.movementSmoothness': 0.5,
    'viewer.scene.camera.controls.orbit.panSpeed': 0.5,
    'viewer.scene.camera.controls.orbit.restrictions.position.cube': { max: { x: null, y: null, z: null }, min: { x: null, y: null, z: null } },
    'viewer.scene.camera.controls.orbit.restrictions.position.sphere': { center: { x: 0, y: 0, z: 0 }, radius: null },
    'viewer.scene.camera.controls.orbit.restrictions.rotation': {
        maxAzimuthAngle: null,
        maxPolarAngle: 180,
        minAzimuthAngle: null,
        minPolarAngle: 0
    },
    'viewer.scene.camera.controls.orbit.restrictions.target.cube': { max: { x: null, y: null, z: null }, min: { x: null, y: null, z: null } },
    'viewer.scene.camera.controls.orbit.restrictions.target.sphere': { center: { x: 0, y: 0, z: 0 }, radius: null },
    'viewer.scene.camera.controls.orbit.restrictions.zoom': { maxDistance: null, minDistance: 0 },
    'viewer.scene.camera.controls.orbit.rotationSpeed': 0.5,
    'viewer.scene.camera.controls.orbit.zoomSpeed': 0.5,
    'viewer.scene.camera.controls.orthographic.damping': 0.1,
    'viewer.scene.camera.controls.orthographic.enableKeyPan': false,
    'viewer.scene.camera.controls.orthographic.enablePan': true,
    'viewer.scene.camera.controls.orthographic.enableZoom': true,
    'viewer.scene.camera.controls.orthographic.input': {
        keys: { down: 40, left: 37, right: 39, up: 38 },
        mouse: { pan: 2, rotate: 0, zoom: 1 },
        touch: { pan: 3, rotate: 1, zoom: 2 }
    },
    'viewer.scene.camera.controls.orthographic.keyPanSpeed': 0.5,
    'viewer.scene.camera.controls.orthographic.movementSmoothness': 0.5,
    'viewer.scene.camera.controls.orthographic.panSpeed': 0.5,
    'viewer.scene.camera.controls.orthographic.zoomSpeed': 0.5,
    'viewer.scene.camera.enableCameraControls': true,
    'viewer.scene.camera.revertAtMouseUp': false,
    'viewer.scene.camera.revertAtMouseUpDuration': 800,
    'viewer.scene.camera.zoomExtentsFactor': 1,
    'viewer.scene.gridVisibility': true,
    'viewer.scene.groundPlaneVisibility': true,
    'viewer.scene.lights.lightScene': 'default',
    'viewer.scene.lights.lightScenes': {
        "default":{
          "id": "default",
          "lights":{
            "ambient0":{
              "id": "ambient0",
              "properties":{
                "color": "#ffffff",
                "intensity": 0.5,
              },
              "type": "ambient",
            },
            "directional0":{
              "id": "directional0",
              "properties":{
                "castShadow": true,
                "color": "#ffffff",
                "direction":{
                  "x": 0.5774000287055969,
                  "y": -0.5774000287055969,
                  "z": 0.5774000287055969,
                },
                "intensity": 0.75,
                "shadowMapBias": -0.00175,
                "shadowMapResolution": 1024,
              },
              "type": "directional",
            },
            "directional1":{
              "id": "directional1",
              "properties":{
                "castShadow": false,
                "color": "#ffffff",
                "direction":{
                  "x": 0.25,
                  "y": -1,
                  "z": 1,
                },
                "intensity": 0.35,
                "shadowMapBias": -0.00175,
                "shadowMapResolution": 1024,
              },
              "type": "directional",
            },
          },
        },
    },
    'viewer.scene.material.environmentMap': 'none',
    'viewer.scene.material.environmentMapAsBackground': false,
    'viewer.scene.material.environmentMapResolution': '1024',
    'viewer.scene.render.ambientOcclusion': true,
    'viewer.scene.render.beautyRenderBlendingDuration': 1500,
    'viewer.scene.render.beautyRenderDelay': 50,
    'viewer.scene.render.clearAlpha': 1,
    'viewer.scene.render.clearColor': '#ffffff',
    'viewer.scene.render.pointSize': 1,
    'viewer.scene.render.shadows': true,
    'viewer.showMessages': true
};

for(let c = 0; c < allCapabilities.length; c++) {
    const capabilities = Object.assign({ 'name': 'selenium_tests', 'build': require('../../../api/api/package.json').version }, allCapabilities[c]);
    let name = 'settings_lights';

    if(process.env.PORT !== 'browserstack') {
        name = 'settings_lights';
        c = allCapabilities.length;
    } else {
        name = 'settings_lights ' + ((allCapabilities[c] as DesktopCapabilities).os ? 
        (<DesktopCapabilities>capabilities).os + ' ' + (<DesktopCapabilities>capabilities).os_version + ' ' + (<DesktopCapabilities>capabilities).browserName + ' ' + (<DesktopCapabilities>capabilities).browser_version : 
        (<MobileCapabilities>capabilities).device + ' ' + (<MobileCapabilities>capabilities).os_version);
    }

    let driver: WebDriver;
    describe('device testing', () => {
        beforeEach(async () => {
            if(process.env.PORT !== 'browserstack') {
                driver = await new webdriver.Builder().withCapabilities(webdriver.Capabilities.chrome()).build();
            } else {
                driver = await new webdriver.Builder().usingServer('http://alexanderschiftn1:csj6VCzMwzBYyRecsbm2@hub-cloud.browserstack.com/wd/hub').withCapabilities(capabilities).build();
            }
            
            await driver.navigate().to('https://viewer.shapediver.com/v3/latest/test/index.html')
            const TIMEOUT = 300000000
            await driver.manage().setTimeouts( { implicit: TIMEOUT, pageLoad: TIMEOUT, script: TIMEOUT } );
        });
        
        afterEach(async () => {
            await driver.close();
        });

        it(name + '_adjustments', async () => {
            // check starting default
            const settings1: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
                let session = await api.createAndInitializeSession({  id: 'mySession', ticket: 'd7275c4a686c2df9ba75ca6c7e05dc674ae60912c1aa75e478f273dab718cd20b2a269073e03b5810daaf461c82ad990b176d3071776ec0f80fa034bb1e2bc6ee6c99fc82764ad55157bcba7dd1856b18eb0390e2b83c201be16e51de33c356fc6ad73cb3100eeecd3fc48ea5405e7f1c2272088d7-ff5d231fc13c2098c7ed85e51331760e', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });
            delete settings1.build_date;
            delete settings1.build_version;    
            expect(settings1).toStrictEqual(originalSettings);
            await screenshotCompare(await driver.takeScreenshot(), name + '_adjustments');

            // change and save
            const settings2: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.getViewer('myViewer');
                const lights = viewer.getLights();
                for(let l in lights) {
                    if(lights[l].name === 'ambient0')
                        lights[l].color = '#ff0000';
                        
                    if(lights[l].name === 'directional0')
                        lights[l].color = '#00ff00';
                    
                    if(lights[l].name === 'directional1')
                        lights[l].color = '#0000ff';
                }
                let session = api.getSession('mySession');
                viewer.update();
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });        
            delete settings2.build_date;
            delete settings2.build_version;    
            expect(settings2['viewer.scene.lights.lightScenes'].default.lights.ambient0.properties.color).toStrictEqual('#ff0000');
            await screenshotCompare(await driver.takeScreenshot(), name + '_adjustments_switch');

            // reset and save
            const settings3: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.getViewer('myViewer');
                let session = api.getSession('mySession');
                const lights = viewer.getLights();
                for(let l in lights) {
                    for(let l in lights) {
                        if(lights[l].name === 'ambient0')
                            lights[l].color = '#ffffff';
                            
                        if(lights[l].name === 'directional0')
                            lights[l].color = '#ffffff';
                        
                        if(lights[l].name === 'directional1')
                            lights[l].color = '#ffffff';
                    }
                }                
                viewer.update();
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });              
            
            delete settings3.build_date;
            delete settings3.build_version;
            expect(settings3).toStrictEqual(originalSettings);
            await screenshotCompare(await driver.takeScreenshot(), name + '_adjustments');
        });

        
        it(name + '_newLightScene', async () => {
            // check starting default
            const settings1: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
                let session = await api.createAndInitializeSession({  id: 'mySession', ticket: 'd7275c4a686c2df9ba75ca6c7e05dc674ae60912c1aa75e478f273dab718cd20b2a269073e03b5810daaf461c82ad990b176d3071776ec0f80fa034bb1e2bc6ee6c99fc82764ad55157bcba7dd1856b18eb0390e2b83c201be16e51de33c356fc6ad73cb3100eeecd3fc48ea5405e7f1c2272088d7-ff5d231fc13c2098c7ed85e51331760e', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });
            delete settings1.build_date;
            delete settings1.build_version;    
            expect(settings1).toStrictEqual(originalSettings);
            await screenshotCompare(await driver.takeScreenshot(), name + '_newLightScene');

            // change and save
            const settings2: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.getViewer('myViewer');
                viewer.createLightScene({id: 'testLightScene'});
                viewer.addAmbientLight({ color: '#ff0000', intensity: 0.4, id: 'ambient'})
                viewer.addDirectionalLight({ color: '#00ff00', intensity: 0.5, direction: [1, -1, 0], castShadow: true, shadowMapBias: 0.0001, shadowMapResolution: 512, id: 'directional'})
                viewer.addHemisphereLight({ color: '#ff000f', groundColor: '#0f0f0f', intensity: 0.6, id: 'hemisphere'})
                viewer.addPointLight({ color: '#000f0f', intensity: 0.7, position: [50, 0, 0], id: 'point' })
                viewer.addSpotLight({ color: '#000fff', intensity: 0.8, position: [50, 0, 0], target: [0,0,0],  id: 'spot' })

                let session = api.getSession('mySession');
                viewer.update();
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });        
            delete settings2.build_date;
            delete settings2.build_version;    
            expect(settings2['viewer.scene.lights.lightScenes'].testLightScene.lights.ambient.properties.color).toBe('#ff0000');
            expect(settings2['viewer.scene.lights.lightScenes'].testLightScene.lights.ambient.properties.intensity).toBe(0.4);

            
            expect(settings2['viewer.scene.lights.lightScenes'].testLightScene.lights.directional.properties.color).toBe('#00ff00');
            expect(settings2['viewer.scene.lights.lightScenes'].testLightScene.lights.directional.properties.intensity).toBe(0.5);
            await screenshotCompare(await driver.takeScreenshot(), name + '_newLightScene_switch');

            // reset and save
            const settings3: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.getViewer('myViewer');
                let session = api.getSession('mySession');

                viewer.assignLightScene('default');
                viewer.removeLightScene('testLightScene')
                viewer.update();
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });              
            
            delete settings3.build_date;
            delete settings3.build_version;
            expect(settings3).toStrictEqual(originalSettings);
            await screenshotCompare(await driver.takeScreenshot(), name + '_newLightScene');
        });
    });
    
}
