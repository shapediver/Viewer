import webdriver, { WebDriver } from 'selenium-webdriver'
import { afterAll, beforeAll, describe, expect, test } from '@jest/globals'
import { api as API, DirectionalLight } from '@shapediver/viewer'

import { screenshotCompare } from '../../general/src/setup'
import {
  capabilities as allCapabilities,
  DesktopCapabilities,
  MobileCapabilities,
} from '../../general/src/capabilities'

require('chromedriver');
for (let c = 0; c < allCapabilities.length; c++) {
    let name = 'settings_general';
    const capabilities = Object.assign({ 'name': name, 'build': require('../../../api/api/package.json').version }, allCapabilities[c]);

    if (process.env.PORT !== 'browserstack') {
        name = 'settings_general';
        c = allCapabilities.length;
    } else {
        name = 'settings_general/' + ((allCapabilities[c] as DesktopCapabilities).os ?
            (<DesktopCapabilities>capabilities).os + '_' + (<DesktopCapabilities>capabilities).os_version + '_' + (<DesktopCapabilities>capabilities).browserName + '_' + (<DesktopCapabilities>capabilities).browser_version :
            (<MobileCapabilities>capabilities).device + '_' + (<MobileCapabilities>capabilities).os_version);
    }

    let driver: WebDriver;
    describe('device testing', () => {
        
        beforeAll(async () => {
            if(process.env.PORT !== 'browserstack') {
                driver = await new webdriver.Builder().withCapabilities(webdriver.Capabilities.chrome()).build();
            } else {
                console.log(capabilities)
                driver = await new webdriver.Builder().usingServer('http://alexanderschiftn1:csj6VCzMwzBYyRecsbm2@hub-cloud.browserstack.com/wd/hub').withCapabilities(capabilities).build();
            }
            await driver.navigate().to('https://viewer.shapediver.com/v3/latest/cdn/index.html')
            const TIMEOUT = 300000000
            await driver.manage().setTimeouts( { implicit: TIMEOUT, pageLoad: TIMEOUT, script: TIMEOUT } );
        });
        
        beforeEach(async () => {
            await driver.navigate().to('https://viewer.shapediver.com/v3/latest/cdn/index.html')
        });

        afterAll(async () => {
            await driver.close();
            await driver.quit();
        })

        it(name + '_empty', async () => {
            // check starting default
            const settings1: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).SDV.api;
                let viewer = await api.createViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas'), id: 'myViewer' });
                let session = await api.createSession({ 
                    ticket: 'debb5960372c75a04298b9442f7cfc2acd0b42a599e038715efd2c6ed4286409172dd345ac3f6f34b1894da57967fdd2383e1b4aa194edc4302fa34fa39712e0c59e9a67f7faa655cd256710a3f522407a2fde35a80a2fe8ddf13026396420abd3c56952826899-0a2ccb449be4ca4e8fe3c2e657bf9de8', 
                    modelViewUrl: 'https://sddev2.eu-central-1.shapediver.com', 
                    id: 'mySession'
                });
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                cb((<any>window).SDV.settingsEngine.flatten());
            });
            expect(JSON.stringify(settings1, Object.keys(settings1).sort())).toBe('{"ar.autoScaling":true,"ar.enable":true,"build_date":"","build_version":"","camera.cameraId":"","environment.clearAlpha":1,"environment.clearColor":"#ffffff","environment.map":"none","environment.mapAsBackground":false,"environment.mapResolution":"1024","environmentGeometry.gridVisibility":true,"environmentGeometry.groundPlaneVisibility":true,"general.blurWhenBusy":true,"general.commitParameters":false,"general.commitSettings":false,"general.pointSize":1,"general.showMessages":true,"general.transformation.rotation.x":0,"general.transformation.rotation.y":0,"general.transformation.rotation.z":0,"general.transformation.scale.x":1,"general.transformation.scale.y":1,"general.transformation.scale.z":1,"general.transformation.translation.x":0,"general.transformation.translation.y":0,"general.transformation.translation.z":0,"light.lightSceneId":"","rendering.ambientOcclusion":true,"rendering.ambientOcclusionIntensity":0.1,"rendering.beautyRenderBlendingDuration":1500,"rendering.beautyRenderDelay":50,"rendering.shadows":true,"settings_version":"3.0"}')
            await screenshotCompare(await driver.takeScreenshot(), name + '/empty');
        });
    });
}
