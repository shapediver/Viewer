import "reflect-metadata"
import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import webdriver, { WebDriver } from "selenium-webdriver";
require('chromedriver');
import { api as API } from "@shapediver/viewer"
import { container } from "tsyringe"
import { screenshotCompare } from "../../general/src/setup";
import { capabilities as allCapabilities, DesktopCapabilities, MobileCapabilities } from "../../general/src/capabilities";
import { vec3 } from "gl-matrix";
import { OrthographicCamera } from "../../../api/api/node_modules/@shapediver/viewer.rendering-engine.camera-engine/dist";
import { OrthographicCameraControls } from "../../../api/api/node_modules/@shapediver/viewer.rendering-engine.camera-engine/dist";
import { PerspectiveCameraControls } from "../../../api/api/node_modules/@shapediver/viewer.rendering-engine.camera-engine/dist";
import { PerspectiveCamera } from "../../../api/api/node_modules/@shapediver/viewer.rendering-engine.camera-engine/dist";
import { SettingsEngine } from "../../../rendering-engine/camera-engine/node_modules/@shapediver/viewer.shared.services/dist";

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
        beforeEach(async () => {
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

        afterEach(async () => {
            await driver.close();
        });

        it('settings', async () => {
            const settings: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
                let session = await api.createAndInitializeSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                const settingsEngine: SettingsEngine = (<any>window).settingsEngine;

                let deconstructed = {};
                const deconstruct = (settings: any, parentName: string) => {
                    for (let s in settings) {
                        if (settings[s].isSetting === true) {
                            // @ts-ignore
                            deconstructed[parentName ? parentName + '.' + s : '' + s] = settings[s].value;
                        } else {
                            deconstruct(settings[s], parentName ? parentName + '.' + s : '' + s)
                        }
                    }
                }
                deconstruct(settingsEngine.general, '')

                cb(deconstructed);
            });

            expect(settings).toStrictEqual({
                build_date: '',
                build_version: '',
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
                    scene: {
                        id: 'scene',
                        lights: {
                            "POINT": {
                                "id": "POINT",
                                "properties": {
                                    "color": "rgb(250, 0, 0)",
                                    "decay": 2,
                                    "distance": 0,
                                    "intensity": 0.5,
                                    "position": {
                                        "x": 0,
                                        "y": 7,
                                        "z": 34.69486131217243,
                                    },
                                },
                                "type": "point",
                            },
                            "ambient0": {
                                "id": "ambient0",
                                "properties": {
                                    "color": 16777215,
                                    "intensity": 0.5,
                                },
                                "type": "ambient",
                            },
                            "directional0": {
                                "id": "directional0",
                                "properties": {
                                    "castShadow": true,
                                    "color": 16777215,
                                    "direction": {
                                        "x": 0.5774,
                                        "y": -0.5774,
                                        "z": 0.5774,
                                    },
                                    "intensity": 0.75,
                                },
                                "type": "directional",
                            },
                            "directional1": {
                                "id": "directional1",
                                "properties": {
                                    "castShadow": false,
                                    "color": 16777215,
                                    "direction": {
                                        "x": -0.25,
                                        "y": -1,
                                        "z": 1,
                                    },
                                    "intensity": 0.35,
                                },
                                "type": "directional",
                            },
                        },
                    },
                    scene_1: {
                        id: 'scene_1', lights: {
                            "POINT": {
                                "id": "POINT",
                                "properties": {
                                    "color": "rgb(250, 0, 0)",
                                    "decay": 2,
                                    "distance": 0,
                                    "intensity": 0.5,
                                    "position": {
                                        "x": -36.88680908842543,
                                        "y": -4.548343511374867,
                                        "z": 20.503365983713273,
                                    },
                                },
                                "type": "point",
                            },
                            "ambient0": {
                                "id": "ambient0",
                                "properties": {
                                    "color": 16777215,
                                    "intensity": 0.5,
                                },
                                "type": "ambient",
                            },
                            "directional0": {
                                "id": "directional0",
                                "properties": {
                                    "castShadow": true,
                                    "color": 16777215,
                                    "direction": {
                                        "x": 0.5774,
                                        "y": -0.5774,
                                        "z": 0.5774,
                                    },
                                    "intensity": 0.75,
                                },
                                "type": "directional",
                            },
                            "directional1": {
                                "id": "directional1",
                                "properties": {
                                    "castShadow": false,
                                    "color": 16777215,
                                    "direction": {
                                        "x": -0.25,
                                        "y": -1,
                                        "z": 1,
                                    },
                                    "intensity": 0.35,
                                },
                                "type": "directional",
                            },
                        },
                    },
                    scene_2: {
                        id: 'scene_2', lights: {
                            "HEMISPHERE": {
                                "id": "HEMISPHERE",
                                "properties": {
                                    "groundColor": 16777215,
                                    "intensity": 0.5,
                                    "skyColor": 16777215,
                                },
                                "type": "hemisphere",
                            },
                            "POINT": {
                                "id": "POINT",
                                "properties": {
                                    "color": "rgb(250, 0, 0)",
                                    "decay": 2,
                                    "distance": 0,
                                    "intensity": 0.5,
                                    "position": {
                                        "x": -36.88680908842543,
                                        "y": -4.548343511374867,
                                        "z": 20.503365983713273,
                                    },
                                },
                                "type": "point",
                            },
                            "ambient0": {
                                "id": "ambient0",
                                "properties": {
                                    "color": 16777215,
                                    "intensity": 0.5,
                                },
                                "type": "ambient",
                            },
                            "directional0": {
                                "id": "directional0",
                                "properties": {
                                    "castShadow": true,
                                    "color": 16777215,
                                    "direction": {
                                        "x": 0.5774,
                                        "y": -0.5774,
                                        "z": 0.5774,
                                    },
                                    "intensity": 0.75,
                                },
                                "type": "directional",
                            },
                            "directional1": {
                                "id": "directional1",
                                "properties": {
                                    "castShadow": false,
                                    "color": 16777215,
                                    "direction": {
                                        "x": -0.25,
                                        "y": -1,
                                        "z": 1,
                                    },
                                    "intensity": 0.35,
                                },
                                "type": "directional",
                            },
                        },
                    },
                    scene_3: {
                        id: 'scene_3', lights:
                        {
                            "HEMISPHERE": {
                                "id": "HEMISPHERE",
                                "properties": {
                                    "groundColor": 16777215,
                                    "intensity": 0.5,
                                    "skyColor": 16777215,
                                },
                                "type": "hemisphere",
                            },
                            "POINT": {
                                "id": "POINT",
                                "properties": {
                                    "color": "rgb(250, 0, 0)",
                                    "decay": 2,
                                    "distance": 0,
                                    "intensity": 0.5,
                                    "position": {
                                        "x": -36.88680908842543,
                                        "y": -4.548343511374867,
                                        "z": 20.503365983713273,
                                    },
                                },
                                "type": "point",
                            },
                            "SPOT": {
                                "id": "SPOT",
                                "properties": {
                                    "angle": 0.7853981633974483,
                                    "color": 16777215,
                                    "decay": 1,
                                    "distance": 0,
                                    "intensity": 0.5,
                                    "penumbra": 0.5,
                                    "position": {
                                        "x": 53.6621374900404,
                                        "y": 7,
                                        "z": 50.4121374900404,
                                    },
                                    "target": {
                                        "x": 0,
                                        "y": 7,
                                        "z": -3.25,
                                    },
                                },
                                "type": "spot",
                            },
                            "ambient0": {
                                "id": "ambient0",
                                "properties": {
                                    "color": 16777215,
                                    "intensity": 0.5,
                                },
                                "type": "ambient",
                            },
                            "directional0": {
                                "id": "directional0",
                                "properties": {
                                    "castShadow": true,
                                    "color": 16777215,
                                    "direction": {
                                        "x": 0.5774,
                                        "y": -0.5774,
                                        "z": 0.5774,
                                    },
                                    "intensity": 0.75,
                                },
                                "type": "directional",
                            },
                            "directional1": {
                                "id": "directional1",
                                "properties": {
                                    "castShadow": false,
                                    "color": 16777215,
                                    "direction": {
                                        "x": -0.25,
                                        "y": -1,
                                        "z": 1,
                                    },
                                    "intensity": 0.35,
                                },
                                "type": "directional",
                            },
                        },
                    }
                },
                'viewer.scene.material.environmentMap': 'none',
                'viewer.scene.material.environmentMapAsBackground': false,
                'viewer.scene.material.environmentMapResolution': '1024',
                'viewer.scene.render.ambientOcclusion': true,
                'viewer.scene.render.beautyRenderBlendingDuration': 1500,
                'viewer.scene.render.beautyRenderDelay': 50,
                'viewer.scene.render.clearAlpha': 1,
                'viewer.scene.render.clearColor': 'rgb(255, 255, 255)',
                'viewer.scene.render.pointSize': 1,
                'viewer.scene.render.shadows': true,
                'viewer.scene.showSceneTransition': '1s',
                'viewer.showMessages': true
            })
        });
    });
}
