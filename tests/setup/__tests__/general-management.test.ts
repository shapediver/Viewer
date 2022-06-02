import webdriver from 'selenium-webdriver'
import { afterAll, beforeAll, describe, expect, test } from '@jest/globals'
import * as ShapeDiverViewer from '@shapediver/viewer'

import { createDriver, screenshotCompare } from '../../general/src/setup'
import { sdeuc1 } from '../../general/src/models'

require('chromedriver');

const shelfTicket = sdeuc1.models['Shelf'].ticket;

let driver: webdriver.WebDriver;
let name = 'general_closing';

describe('device testing', () => {
    beforeAll(async () => {
        driver = await createDriver();
    });

    beforeEach(async () => {
        await driver.navigate().to('https://viewer.shapediver.com/v3/branch/task/restructuring/cdn/index.html')
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
            cb();
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + '/1_2');

        await driver.executeAsyncScript(async (cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            await SDV.sessions['mySession'].close();
            cb();
        });
        await screenshotCompare(await driver.takeScreenshot(), name + '/1_3');


        await driver.executeAsyncScript(async (cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            await SDV.viewports['myViewer'].close();
            cb();
        });
        await screenshotCompare(await driver.takeScreenshot(), name + '/1_4');


        await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewer = await SDV.createViewport({
                branding: { logo: 'https://viewer.shapediver.com/v3/graphics/logo.png' }, id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await SDV.createSession({ id: 'mySession', ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            cb();
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + '/1_2');
    });
});
