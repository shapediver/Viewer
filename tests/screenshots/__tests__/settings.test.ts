import webdriver from 'selenium-webdriver'
import { afterAll, beforeAll, describe, expect, test } from '@jest/globals'
import * as ShapeDiverViewer from '@shapediver/viewer'

import { createDriver, screenshotCompare } from '../../general/src/setup'
import { sdeuc1 } from '../../general/src/models'

require('chromedriver');

const ringTicket = sdeuc1.models['Ring'].ticket;

let driver: webdriver.WebDriver;
let name = 'settings';

describe('device testing', () => {
    beforeAll(async () => {
        driver = await createDriver();
    });

    beforeEach(async () => {
        await driver.navigate().to('https://viewer.shapediver.com/v3/latest/test-cdn/index.html')
    });

    afterAll(async () => {
        await driver.close();
        await driver.quit();
    })

    test(name, async () => {
        await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewer = await SDV.createViewport({
                branding: { logo: 'https://viewer.shapediver.com/v3/graphics/logo.png' }, id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await SDV.createSession({ id: 'mySession', ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            await new Promise<void>((resolve) => {
                SDV.addListener(SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, ringTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + '/automaticColorAdjustmentFalse');

        await driver.executeAsyncScript(async (cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            SDV.viewports["myViewer"].automaticColorAdjustment = true;
            await new Promise<void>((resolve) => {
                SDV.addListener(SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        });
        await screenshotCompare(await driver.takeScreenshot(), name + '/automaticColorAdjustmentTrue');

    });
});
