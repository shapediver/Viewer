import webdriver from 'selenium-webdriver'
import { afterAll, beforeAll, describe, expect, test } from '@jest/globals'

import { screenshotCompare } from '../../general/src/setup'
import {
  capabilities as allCapabilities,
  DesktopCapabilities,
  MobileCapabilities,
} from '../../general/src/capabilities'
import { sdeuc1 } from '../../general/src/models'

require('chromedriver');

for (let c = 0; c < allCapabilities.length; c++) {
    const capabilities = Object.assign({ 'name': 'mobile_tests', 'build': require('../../../api/api/package.json').version }, allCapabilities[c]);
    let name = 'mobile_tests/' + ((allCapabilities[c] as DesktopCapabilities).os ?
        (<DesktopCapabilities>capabilities).os + '_' + (<DesktopCapabilities>capabilities).os_version + '_' + (<DesktopCapabilities>capabilities).browserName + '_' + (<DesktopCapabilities>capabilities).browser_version :
        (<MobileCapabilities>capabilities).device + '_' + (<MobileCapabilities>capabilities).os_version);

    let driver: webdriver.WebDriver;
    describe('device testing', () => {
        beforeAll(async () => {
            driver = await new webdriver.Builder().usingServer('http://alexanderschiftn1:csj6VCzMwzBYyRecsbm2@hub-cloud.browserstack.com/wd/hub').withCapabilities(capabilities).build();
            await driver.navigate().to('https://viewer.shapediver.com/v3/latest/cdn/index.html')
            const TIMEOUT = 300000000
            await driver.manage().setTimeouts({ implicit: TIMEOUT, pageLoad: TIMEOUT, script: TIMEOUT });
            console.log(name)
        });

        beforeEach(async () => {
            await driver.navigate().to('https://viewer.shapediver.com/v3/latest/cdn/index.html')
        });

        afterAll(async () => {
            await driver.close();
            await driver.quit();
        })

        const backend = sdeuc1.backend;
        for (let model of ['Shelf', 'Pointillist', 'Opacity Test', 'Material Presets', 'Material Assignment', 'glTF2ShapeDiverMaterialExtension']) {
            const modelTicket = sdeuc1.models[model].ticket;
            test(name + '_' + model, async () => {
                // DO SOMETHING WITH THE API
                await driver.executeAsyncScript(async (ticket: string, modelViewUrl: string, cb: any) => {
                    let viewer = await (<any>window).SDV.api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
                    let session = await (<any>window).SDV.api.createSession({ ticket, modelViewUrl });

                    await new Promise<void>((resolve) => {
                        (<any>window).SDV.api.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                    })
                    cb();
                }, modelTicket, backend);

                // TAKE A SCREENSHOT
                await screenshotCompare(await driver.takeScreenshot(), name + '/' + model);
            });
        }
    });
}
