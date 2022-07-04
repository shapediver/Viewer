import webdriver from 'selenium-webdriver'
import { afterAll, beforeAll, describe, expect, test } from '@jest/globals'

import { sdeuc1 } from '../../general/src/models'
import { createDriver, screenshotCompare } from '../../general/src/setup'

import * as ShapeDiverViewer from "@shapediver/viewer"

require('chromedriver');

const shelfTicket = sdeuc1.models['Shelf'].ticket;

let driver: webdriver.WebDriver;
let name = 'api_tests';

describe('device testing', () => {
    beforeAll(async () => {
        driver = await createDriver();
    });

    beforeEach(async () => {
        await driver.navigate().to('https://viewer.shapediver.com/v3/latest/cdn/index.html')
    });

    afterAll(async () => {
        await driver.close();
        await driver.quit();
    })

        
    test(name + '_scale', async () => {
        await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewer = await SDV.createViewport({ 
                id: 'myViewer', 
                canvas: <HTMLCanvasElement>document.getElementById('canvas')
            })
            let session = await SDV.createSession({ 
                id: 'mySession', 
                ticket, 
                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' 
            });

            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + '/scale');
    });

});
