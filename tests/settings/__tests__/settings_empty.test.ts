import webdriver, { WebDriver } from 'selenium-webdriver'
import { afterAll, beforeAll, describe, expect, test } from '@jest/globals'
import { api as API, DirectionalLight } from '@shapediver/viewer'

import { screenshotCompare } from '../../general/src/setup'
import { createTokenFromSlug } from '../../general/src/utils';

require('chromedriver');

let name = 'settings_general';
let driver: WebDriver;
describe('device testing', () => {

    beforeAll(async () => {
        driver = await new webdriver.Builder().withCapabilities(webdriver.Capabilities.chrome()).build();
        await driver.navigate().to('https://viewer.shapediver.com/v3/latest/cdn/index.html')
        const TIMEOUT = 300000000
        await driver.manage().setTimeouts({ implicit: TIMEOUT, pageLoad: TIMEOUT, script: TIMEOUT });
    });

    beforeEach(async () => {
        await driver.navigate().to('https://viewer.shapediver.com/v3/latest/cdn/index.html')
    });

    afterAll(async () => {
        await driver.close();
        await driver.quit();
    })

    it(name + '_empty', async () => {
        const token = await createTokenFromSlug("shelf-49");
        // check starting default
        const settings1: any = await driver.executeAsyncScript(async (bearerToken: string, cb: any) => {
            const api: typeof API = (<any>window).SDV.api;
            let viewer = await api.createViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas'), id: 'myViewer' });
            let session = await api.createSession({
                ticket: '60e6373b9152f62f53967a0bb1c4c3c176fc7fa6dab1190e9a27d47f46678467b62615558b1c0d0a46b23cc1343eb51029566d41515358b0d335c50fa8e40b6e2e8b682db843bfbe5acfddf54abe8ac61a60888709a5be90f8ac14b15807948a8814874c401d8a-748c1301025b18e3fef38e12d5cca40d', 
                modelViewUrl: 'https://sddev2.eu-central-1.shapediver.com', 
                id: 'mySession',
                bearerToken
            });
            await new Promise<void>((resolve) => {
                api.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb((<any>window).SDV.settingsEngine.flatten());
        }, token);
        expect(JSON.stringify(settings1, Object.keys(settings1).sort())).toBe(JSON.stringify(
        {
            'ar.autoScaling': true,
            'ar.enable': true,
            build_date: '',
            build_version: '',
            'camera.cameraId': '',
            'environment.clearAlpha': 1,
            'environment.clearColor': '#ffffff',
            'environment.map': 'none',
            'environment.mapAsBackground': false,
            'environment.mapResolution': '1024',
            'environmentGeometry.gridVisibility': true,
            'environmentGeometry.groundPlaneVisibility': true,        
            'general.blurWhenBusy': true,
            'general.commitParameters': false,
            'general.commitSettings': false,
            'general.pointSize': 1,
            'general.showMessages': true,
            'general.transformation.rotation.x': 0,
            'general.transformation.rotation.y': 0,
            'general.transformation.rotation.z': 0,
            'general.transformation.scale.x': 1,
            'general.transformation.scale.y': 1,
            'general.transformation.scale.z': 1,
            'general.transformation.translation.x': 0,
            'general.transformation.translation.y': 0,
            'general.transformation.translation.z': 0,
            'light.lightSceneId': '',
            'rendering.ambientOcclusion': true,
            'rendering.ambientOcclusionIntensity': 0.1,
            'rendering.beautyRenderBlendingDuration': 1500,
            'rendering.beautyRenderDelay': 50,
            'rendering.shadows': true,
            settings_version: '3.0'
          }
        ))
    });
});
