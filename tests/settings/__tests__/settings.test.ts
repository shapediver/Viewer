import "reflect-metadata"
import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import webdriver, { WebDriver } from "selenium-webdriver";
require('chromedriver');
import { api as API, DirectionalLight } from "@shapediver/viewer"
import { container } from "tsyringe"
import { screenshotCompare } from "../../general/src/setup";
import { capabilities as allCapabilities, DesktopCapabilities, MobileCapabilities } from "../../general/src/capabilities";
import { vec3 } from "gl-matrix";
import { SettingsEngine } from "../../../rendering-engine/camera-engine/node_modules/@shapediver/viewer.shared.services/dist";
import { build_data } from "../../../shared/build-data/src/build_data";

const originalSettings = { "settings_version": "3.0", "camera.cameraId": "cameraId", "camera.cameras.cameraId.autoAdjust": false, "camera.cameras.cameraId.cameraMovementDuration": 800, "camera.cameras.cameraId.controls.autoRotationSpeed": 0, "camera.cameras.cameraId.controls.damping": 0.1, "camera.cameras.cameraId.controls.enableAutoRotation": false, "camera.cameras.cameraId.controls.enableKeyPan": false, "camera.cameras.cameraId.controls.enablePan": true, "camera.cameras.cameraId.controls.enableRotation": true, "camera.cameras.cameraId.controls.enableZoom": true, "camera.cameras.cameraId.controls.input.keys.down": 40, "camera.cameras.cameraId.controls.input.keys.left": 37, "camera.cameras.cameraId.controls.input.keys.right": 39, "camera.cameras.cameraId.controls.input.keys.up": 38, "camera.cameras.cameraId.controls.input.mouse.pan": 2, "camera.cameras.cameraId.controls.input.mouse.rotate": 0, "camera.cameras.cameraId.controls.input.mouse.zoom": 1, "camera.cameras.cameraId.controls.input.touch.pan": 3, "camera.cameras.cameraId.controls.input.touch.rotate": 1, "camera.cameras.cameraId.controls.input.touch.zoom": 2, "camera.cameras.cameraId.controls.keyPanSpeed": 0.5, "camera.cameras.cameraId.controls.movementSmoothness": 0.5, "camera.cameras.cameraId.controls.panSpeed": 0.5, "camera.cameras.cameraId.controls.restrictions.position.cube.max.x": null, "camera.cameras.cameraId.controls.restrictions.position.cube.max.y": null, "camera.cameras.cameraId.controls.restrictions.position.cube.max.z": null, "camera.cameras.cameraId.controls.restrictions.position.cube.min.x": null, "camera.cameras.cameraId.controls.restrictions.position.cube.min.y": null, "camera.cameras.cameraId.controls.restrictions.position.cube.min.z": null, "camera.cameras.cameraId.controls.restrictions.position.sphere.center.x": 0, "camera.cameras.cameraId.controls.restrictions.position.sphere.center.y": 0, "camera.cameras.cameraId.controls.restrictions.position.sphere.center.z": 0, "camera.cameras.cameraId.controls.restrictions.position.sphere.radius": null, "camera.cameras.cameraId.controls.restrictions.rotation.maxAzimuthAngle": null, "camera.cameras.cameraId.controls.restrictions.rotation.maxPolarAngle": 180, "camera.cameras.cameraId.controls.restrictions.rotation.minAzimuthAngle": null, "camera.cameras.cameraId.controls.restrictions.rotation.minPolarAngle": 0, "camera.cameras.cameraId.controls.restrictions.target.cube.max.x": null, "camera.cameras.cameraId.controls.restrictions.target.cube.max.y": null, "camera.cameras.cameraId.controls.restrictions.target.cube.max.z": null, "camera.cameras.cameraId.controls.restrictions.target.cube.min.x": null, "camera.cameras.cameraId.controls.restrictions.target.cube.min.y": null, "camera.cameras.cameraId.controls.restrictions.target.cube.min.z": null, "camera.cameras.cameraId.controls.restrictions.target.sphere.center.x": 0, "camera.cameras.cameraId.controls.restrictions.target.sphere.center.y": 0, "camera.cameras.cameraId.controls.restrictions.target.sphere.center.z": 0, "camera.cameras.cameraId.controls.restrictions.target.sphere.radius": null, "camera.cameras.cameraId.controls.restrictions.zoom.maxDistance": null, "camera.cameras.cameraId.controls.restrictions.zoom.minDistance": 0, "camera.cameras.cameraId.controls.rotationSpeed": 0.5, "camera.cameras.cameraId.controls.zoomSpeed": 0.5, "camera.cameras.cameraId.enableCameraControls": true, "camera.cameras.cameraId.fov": 45, "camera.cameras.cameraId.position.x": 58.03696060180664, "camera.cameras.cameraId.position.y": -290.11590576171875, "camera.cameras.cameraId.position.z": 87.67756652832031, "camera.cameras.cameraId.revertAtMouseUp": false, "camera.cameras.cameraId.revertAtMouseUpDuration": 800, "camera.cameras.cameraId.target.x": 0, "camera.cameras.cameraId.target.y": 7, "camera.cameras.cameraId.target.z": -3.25, "camera.cameras.cameraId.type": "perspective", "camera.cameras.cameraId.zoomExtentsFactor": 1, "environment.clearAlpha": 1, "environment.clearColor": "#ffffff", "environment.map": "none", "environment.mapAsBackground": false, "environment.mapResolution": "1024", "environmentGeometry.gridVisibility": true, "environmentGeometry.groundPlaneVisibility": true, "general.blurWhenBusy": true, "general.commitParameters": false, "general.commitSettings": false, "general.pointSize": 1, "general.showMessages": true, "general.transformation.rotation.x": 0, "general.transformation.rotation.y": 0, "general.transformation.rotation.z": 0, "general.transformation.scale.x": 1, "general.transformation.scale.y": 1, "general.transformation.scale.z": 1, "general.transformation.translation.x": 0, "general.transformation.translation.y": 0, "general.transformation.translation.z": 0, "light.lightSceneId": "default", "light.lightScenes.a2a392df-c842-4562-acd4-91df7ed68822.lights.6e219562-c916-4492-b9b9-1dfbac80d51f.name": "directional1", "light.lightScenes.a2a392df-c842-4562-acd4-91df7ed68822.lights.6e219562-c916-4492-b9b9-1dfbac80d51f.properties.castShadow": false, "light.lightScenes.a2a392df-c842-4562-acd4-91df7ed68822.lights.6e219562-c916-4492-b9b9-1dfbac80d51f.properties.color": "#ffffff", "light.lightScenes.a2a392df-c842-4562-acd4-91df7ed68822.lights.6e219562-c916-4492-b9b9-1dfbac80d51f.properties.direction.x": 0.25, "light.lightScenes.a2a392df-c842-4562-acd4-91df7ed68822.lights.6e219562-c916-4492-b9b9-1dfbac80d51f.properties.direction.y": -1, "light.lightScenes.a2a392df-c842-4562-acd4-91df7ed68822.lights.6e219562-c916-4492-b9b9-1dfbac80d51f.properties.direction.z": 1, "light.lightScenes.a2a392df-c842-4562-acd4-91df7ed68822.lights.6e219562-c916-4492-b9b9-1dfbac80d51f.properties.intensity": 0.35, "light.lightScenes.a2a392df-c842-4562-acd4-91df7ed68822.lights.6e219562-c916-4492-b9b9-1dfbac80d51f.properties.shadowMapBias": -0.00175, "light.lightScenes.a2a392df-c842-4562-acd4-91df7ed68822.lights.6e219562-c916-4492-b9b9-1dfbac80d51f.properties.shadowMapResolution": 1024, "light.lightScenes.a2a392df-c842-4562-acd4-91df7ed68822.lights.6e219562-c916-4492-b9b9-1dfbac80d51f.type": "directional", "light.lightScenes.a2a392df-c842-4562-acd4-91df7ed68822.lights.70bc760c-45dc-46b0-9cd2-8990ac77124f.name": "directional0", "light.lightScenes.a2a392df-c842-4562-acd4-91df7ed68822.lights.70bc760c-45dc-46b0-9cd2-8990ac77124f.properties.castShadow": true, "light.lightScenes.a2a392df-c842-4562-acd4-91df7ed68822.lights.70bc760c-45dc-46b0-9cd2-8990ac77124f.properties.color": "#ffffff", "light.lightScenes.a2a392df-c842-4562-acd4-91df7ed68822.lights.70bc760c-45dc-46b0-9cd2-8990ac77124f.properties.direction.x": 0.5774000287055969, "light.lightScenes.a2a392df-c842-4562-acd4-91df7ed68822.lights.70bc760c-45dc-46b0-9cd2-8990ac77124f.properties.direction.y": -0.5774000287055969, "light.lightScenes.a2a392df-c842-4562-acd4-91df7ed68822.lights.70bc760c-45dc-46b0-9cd2-8990ac77124f.properties.direction.z": 0.5774000287055969, "light.lightScenes.a2a392df-c842-4562-acd4-91df7ed68822.lights.70bc760c-45dc-46b0-9cd2-8990ac77124f.properties.intensity": 0.75, "light.lightScenes.a2a392df-c842-4562-acd4-91df7ed68822.lights.70bc760c-45dc-46b0-9cd2-8990ac77124f.properties.shadowMapBias": -0.00175, "light.lightScenes.a2a392df-c842-4562-acd4-91df7ed68822.lights.70bc760c-45dc-46b0-9cd2-8990ac77124f.properties.shadowMapResolution": 1024, "light.lightScenes.a2a392df-c842-4562-acd4-91df7ed68822.lights.70bc760c-45dc-46b0-9cd2-8990ac77124f.type": "directional", "light.lightScenes.a2a392df-c842-4562-acd4-91df7ed68822.lights.748019ac-ce54-4de7-94d2-737dae6579dd.name": "ambient0", "light.lightScenes.a2a392df-c842-4562-acd4-91df7ed68822.lights.748019ac-ce54-4de7-94d2-737dae6579dd.properties.color": "#ffffff", "light.lightScenes.a2a392df-c842-4562-acd4-91df7ed68822.lights.748019ac-ce54-4de7-94d2-737dae6579dd.properties.intensity": 0.5, "light.lightScenes.a2a392df-c842-4562-acd4-91df7ed68822.lights.748019ac-ce54-4de7-94d2-737dae6579dd.type": "ambient", "light.lightScenes.a2a392df-c842-4562-acd4-91df7ed68822.name": "default", "rendering.ambientOcclusion": true, "rendering.beautyRenderBlendingDuration": 1500, "rendering.beautyRenderDelay": 50, "rendering.shadows": true, "session.1d1af051-22fd-4f3a-a34c-1882c60a7fda.displayName": "", "session.1d1af051-22fd-4f3a-a34c-1882c60a7fda.hidden": true, "session.1d1af051-22fd-4f3a-a34c-1882c60a7fda.order": 5, "session.5a5aad86-8173-4bbe-8184-54656370cd4b.displayName": "", "session.5a5aad86-8173-4bbe-8184-54656370cd4b.hidden": true, "session.5a5aad86-8173-4bbe-8184-54656370cd4b.order": 2, "session.7ad4db6d-dc94-48b1-8e89-486b75b29df9.displayName": "", "session.7ad4db6d-dc94-48b1-8e89-486b75b29df9.hidden": true, "session.7ad4db6d-dc94-48b1-8e89-486b75b29df9.order": 0, "session.9d9e7f0b-385c-495d-825e-3fec2ce9762d.displayName": "", "session.9d9e7f0b-385c-495d-825e-3fec2ce9762d.hidden": true, "session.9d9e7f0b-385c-495d-825e-3fec2ce9762d.order": 8, "session.30c907b3-dbcf-4266-9f8f-835bb2353cb6.displayName": "", "session.30c907b3-dbcf-4266-9f8f-835bb2353cb6.hidden": true, "session.30c907b3-dbcf-4266-9f8f-835bb2353cb6.order": 3, "session.55b36bef-a2e8-47cb-bd96-8631f95b11be.displayName": "", "session.55b36bef-a2e8-47cb-bd96-8631f95b11be.hidden": true, "session.55b36bef-a2e8-47cb-bd96-8631f95b11be.order": 9, "session.136b5b03-c3a3-40a1-bc51-009a71c9fc44.displayName": "", "session.136b5b03-c3a3-40a1-bc51-009a71c9fc44.hidden": true, "session.136b5b03-c3a3-40a1-bc51-009a71c9fc44.order": 10, "session.23033d60-7078-4836-99ce-990668e4429d.displayName": "", "session.23033d60-7078-4836-99ce-990668e4429d.hidden": true, "session.23033d60-7078-4836-99ce-990668e4429d.order": 1, "session.d0ecb53a-90f1-44d6-a6a5-fa47d4a38771.displayName": "", "session.d0ecb53a-90f1-44d6-a6a5-fa47d4a38771.hidden": true, "session.d0ecb53a-90f1-44d6-a6a5-fa47d4a38771.order": 4, "session.dd319731-fb8a-4aa2-9aef-ac85e96a3060.displayName": "COLOR", "session.dd319731-fb8a-4aa2-9aef-ac85e96a3060.hidden": false, "session.dd319731-fb8a-4aa2-9aef-ac85e96a3060.order": 7, "session.de76cade-0cea-47b1-879e-1a0b717910e1.displayName": "", "session.de76cade-0cea-47b1-879e-1a0b717910e1.hidden": false, "session.de76cade-0cea-47b1-879e-1a0b717910e1.order": 6 };

for (let c = 0; c < allCapabilities.length; c++) {
    let name = 'settings_tests';
    const capabilities = Object.assign({ 'name': name, 'build': require('../../../api/api/package.json').version }, allCapabilities[c]);

    if (process.env.PORT !== 'browserstack') {
        name = 'settings_tests';
        c = allCapabilities.length;
    } else {
        name = 'settings_tests/' + ((allCapabilities[c] as DesktopCapabilities).os ?
            (<DesktopCapabilities>capabilities).os + '_' + (<DesktopCapabilities>capabilities).os_version + '_' + (<DesktopCapabilities>capabilities).browserName + '_' + (<DesktopCapabilities>capabilities).browser_version :
            (<MobileCapabilities>capabilities).device + '_' + (<MobileCapabilities>capabilities).os_version);
    }

    let driver: WebDriver;

    describe('Settings Tests', () => {
        
        beforeAll(async () => {
            if(process.env.PORT !== 'browserstack') {
                driver = await new webdriver.Builder().withCapabilities(webdriver.Capabilities.chrome()).build();
            } else {
                console.log(capabilities)
                driver = await new webdriver.Builder().usingServer('http://alexanderschiftn1:csj6VCzMwzBYyRecsbm2@hub-cloud.browserstack.com/wd/hub').withCapabilities(capabilities).build();
            }
            await driver.navigate().to('https://viewer.shapediver.com/v3/latest/test/index.html')
            const TIMEOUT = 300000000
            await driver.manage().setTimeouts( { implicit: TIMEOUT, pageLoad: TIMEOUT, script: TIMEOUT } );
        });
        
        beforeEach(async () => {
            await driver.navigate().to('https://viewer.shapediver.com/v3/latest/test/index.html');
        });

        afterAll(async () => {
            await driver.close();
            await driver.quit();
        })

        afterEach(async () => {
            await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.viewers['myViewer']!;
                let session = api.sessions['mySession']!;
                session.getParameterById('dd319731-fb8a-4aa2-9aef-ac85e96a3060')!.displayName = ('COLOR');

                session.getParameterById('7ad4db6d-dc94-48b1-8e89-486b75b29df9')!.order = (0);
                session.getParameterById('23033d60-7078-4836-99ce-990668e4429d')!.order = (1);
                session.getParameterById('5a5aad86-8173-4bbe-8184-54656370cd4b')!.order = (2);
                session.getParameterById('30c907b3-dbcf-4266-9f8f-835bb2353cb6')!.order = (3);
                session.getParameterById('d0ecb53a-90f1-44d6-a6a5-fa47d4a38771')!.order = (4);
                session.getParameterById('1d1af051-22fd-4f3a-a34c-1882c60a7fda')!.order = (5);
                session.getParameterById('de76cade-0cea-47b1-879e-1a0b717910e1')!.order = (6);
                session.getParameterById('dd319731-fb8a-4aa2-9aef-ac85e96a3060')!.order = (7);
                session.getParameterById('9d9e7f0b-385c-495d-825e-3fec2ce9762d')!.order = (8);
                session.getParameterById('55b36bef-a2e8-47cb-bd96-8631f95b11be')!.order = (9);
                session.getParameterById('136b5b03-c3a3-40a1-bc51-009a71c9fc44')!.order = (10);
            
                session.getParameterById('7ad4db6d-dc94-48b1-8e89-486b75b29df9')!.hidden = (true);
                session.getParameterById('23033d60-7078-4836-99ce-990668e4429d')!.hidden = (true);
                session.getParameterById('5a5aad86-8173-4bbe-8184-54656370cd4b')!.hidden = (true);
                session.getParameterById('30c907b3-dbcf-4266-9f8f-835bb2353cb6')!.hidden = (true);
                session.getParameterById('d0ecb53a-90f1-44d6-a6a5-fa47d4a38771')!.hidden = (true);
                session.getParameterById('1d1af051-22fd-4f3a-a34c-1882c60a7fda')!.hidden = (true);
                session.getParameterById('de76cade-0cea-47b1-879e-1a0b717910e1')!.hidden = (false);
                session.getParameterById('9d9e7f0b-385c-495d-825e-3fec2ce9762d')!.hidden = (true);
                session.getParameterById('55b36bef-a2e8-47cb-bd96-8631f95b11be')!.hidden = (true);
                session.getParameterById('136b5b03-c3a3-40a1-bc51-009a71c9fc44')!.hidden = (true);
                session.getParameterById('dd319731-fb8a-4aa2-9aef-ac85e96a3060')!.hidden = (false);


                viewer.updateBlurSceneWhenBusy(true);
                const camera = viewer.createPerspectiveCamera();
                viewer.assignCamera(camera.id);
                camera!.updateAutoAdjust(false);
                camera!.updateCameraMovementDuration(800);
                camera!.updateDefaultPosition([58.03696060180664, -290.11590576171875, 87.67756652832031]);
                camera!.updateDefaultTarget([0, 7, -3.25]);
                camera!.updatePosition([58.03696060180664, -290.11590576171875, 87.67756652832031]);
                camera!.updateTarget([0, 7, -3.25]);
                (<any>camera!).updateFov(45);
                (<any>camera!).controls.updateAutoRotationSpeed(0);
                (<any>camera!).controls.updateDamping(0.1);
                viewer.updateEnvironmentMapAsBackground(false);
                viewer.updateEnvironmentMap('none');
                viewer.updateGridVisibility(true);
                viewer.updateGroundPlaneVisibility(true);
                viewer.updateEnvironmentMap('none');

                const lights = viewer.lightScene!.lights;
                for (let l in lights) {
                    if(l !== '6e219562-c916-4492-b9b9-1dfbac80d51f' && l !== '70bc760c-45dc-46b0-9cd2-8990ac77124f' && l !== '748019ac-ce54-4de7-94d2-737dae6579dd')
                        viewer.lightScene.removeLight(l)
                }
                viewer.lightScene!.lights["748019ac-ce54-4de7-94d2-737dae6579dd"].updateName('ambient0')
                viewer.lightScene!.lights["748019ac-ce54-4de7-94d2-737dae6579dd"].updateIntensity(0.5)
                viewer.lightScene!.lights["748019ac-ce54-4de7-94d2-737dae6579dd"].updateColor('#ffffff')

                viewer.lightScene!.lights["70bc760c-45dc-46b0-9cd2-8990ac77124f"].updateName('directional0')
                viewer.lightScene!.lights["70bc760c-45dc-46b0-9cd2-8990ac77124f"].updateIntensity(0.75)
                viewer.lightScene!.lights["70bc760c-45dc-46b0-9cd2-8990ac77124f"].updateColor('#ffffff');
                (<DirectionalLight>viewer.lightScene!.lights["70bc760c-45dc-46b0-9cd2-8990ac77124f"]).updateDirection([0.5774000287055969, -0.5774000287055969, 0.5774000287055969])

                viewer.lightScene!.lights["6e219562-c916-4492-b9b9-1dfbac80d51f"].updateName('directional1')
                viewer.lightScene!.lights["6e219562-c916-4492-b9b9-1dfbac80d51f"].updateIntensity(0.35)
                viewer.lightScene!.lights["6e219562-c916-4492-b9b9-1dfbac80d51f"].updateColor('#ffffff')<
                (<DirectionalLight>viewer.lightScene!.lights["6e219562-c916-4492-b9b9-1dfbac80d51f"]).updateDirection([0.25, -1, 1])
                viewer.update();
                await session.saveSettings();
                cb();
            });
        });

        it('settings', async () => {
            const settings: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = await api.createAndInitializeViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
                let session = await api.createAndInitializeSession({ id: 'mySession', ticket: 'd7275c4a686c2df9ba75ca6c7e05dc674ae60912c1aa75e478f273dab718cd20b2a269073e03b5810daaf461c82ad990b176d3071776ec0f80fa034bb1e2bc6ee6c99fc82764ad55157bcba7dd1856b18eb0390e2b83c201be16e51de33c356fc6ad73cb3100eeecd3fc48ea5405e7f1c2272088d7-ff5d231fc13c2098c7ed85e51331760e', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                const settingsEngine: SettingsEngine = (<any>window).settingsEngine;
                cb(settingsEngine.flatten());
            });

            delete settings.build_date;
            delete settings.build_version;
            for(let k in settings) {
                if(k.includes(settings["camera.cameraId"])) {
                    const value = settings[k];
                    delete settings[k];
                    k = k.replace(settings["camera.cameraId"], 'cameraId');
                    settings[k] = value;
                }
            }
            settings["camera.cameraId"] = 'cameraId';
            expect(settings).toStrictEqual(originalSettings)
        });

        it('settings - save exactly the same', async () => {
            const settings: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = await api.createAndInitializeViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
                let session = await api.createAndInitializeSession({ id: 'mySession', ticket: 'd7275c4a686c2df9ba75ca6c7e05dc674ae60912c1aa75e478f273dab718cd20b2a269073e03b5810daaf461c82ad990b176d3071776ec0f80fa034bb1e2bc6ee6c99fc82764ad55157bcba7dd1856b18eb0390e2b83c201be16e51de33c356fc6ad73cb3100eeecd3fc48ea5405e7f1c2272088d7-ff5d231fc13c2098c7ed85e51331760e', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                const settingsEngine: SettingsEngine = (<any>window).settingsEngine;
                cb(settingsEngine.flatten());
            });

            delete settings.build_date;
            delete settings.build_version;
            for(let k in settings) {
                if(k.includes(settings["camera.cameraId"])) {
                    const value = settings[k];
                    delete settings[k];
                    k = k.replace(settings["camera.cameraId"], 'cameraId');
                    settings[k] = value;
                }
            }
            settings["camera.cameraId"] = 'cameraId';
            expect(settings).toStrictEqual(originalSettings)
        });

        it('settings - general', async () => {
            const settings: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = await api.createAndInitializeViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
                let session = await api.createAndInitializeSession({ id: 'mySession', ticket: 'd7275c4a686c2df9ba75ca6c7e05dc674ae60912c1aa75e478f273dab718cd20b2a269073e03b5810daaf461c82ad990b176d3071776ec0f80fa034bb1e2bc6ee6c99fc82764ad55157bcba7dd1856b18eb0390e2b83c201be16e51de33c356fc6ad73cb3100eeecd3fc48ea5405e7f1c2272088d7-ff5d231fc13c2098c7ed85e51331760e', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                const settingsEngine: SettingsEngine = (<any>window).settingsEngine;
                cb(settingsEngine.flatten());
            });
            expect(settings.build_date).toBe(build_data.build_date);
            expect(settings.build_version).toBe(build_data.build_version);
            expect(settings.settings_version).toBe('3.0');
        });

    });
}
