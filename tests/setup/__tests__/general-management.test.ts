import webdriver from 'selenium-webdriver'
import { afterAll, beforeAll, describe, expect, test } from '@jest/globals'
import { api as API } from '@shapediver/viewer'

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
        await driver.navigate().to('https://viewer.shapediver.com/v3/latest/cdn/index.html')
    });

    afterAll(async () => {
        await driver.close();
        await driver.quit();
    })

    test(name, async () => {
        await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const api: typeof API = (<any>window).SDV.api;
            let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas'), branding: { logo: 'https://shapediverviewer.s3.amazonaws.com/v3/graphics/logo.png' } })
            let session = await api.createSession({ id: 'mySession', ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            cb();
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + '/1_2');

        await driver.executeAsyncScript(async (cb: any) => {
            const api: typeof API = (<any>window).SDV.api;
            await api.closeSession('mySession');
            cb();
        });
        await screenshotCompare(await driver.takeScreenshot(), name + '/1_3');


        await driver.executeAsyncScript(async (cb: any) => {
            const api: typeof API = (<any>window).SDV.api;
            await api.closeViewer('myViewer');
            cb();
        });
        await screenshotCompare(await driver.takeScreenshot(), name + '/1_4');


        await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const api: typeof API = (<any>window).SDV.api;
            let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas'), branding: { logo: 'https://shapediverviewer.s3.amazonaws.com/v3/graphics/logo.png' } })
            let session = await api.createSession({ id: 'mySession', ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            cb();
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + '/1_2');
    });
});
