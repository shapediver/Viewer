import webdriver from 'selenium-webdriver'
import { afterAll, beforeAll, describe, expect, test } from '@jest/globals'
import { api as API } from '@shapediver/viewer'

import { createDriver, screenshotCompare } from '../../general/src/setup'
import { sdeuc1 } from '../../general/src/models'

require('chromedriver');

const shelfTicket = sdeuc1.models['Shelf'].ticket;
const ringTicket = sdeuc1.models['Ring'].ticket;

let driver: webdriver.WebDriver;
let name = 'viewer_restriction';

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
        await driver.executeAsyncScript(async (ticket: string, ticket2: string, cb: any) => {
            const api: typeof API = (<any>window).SDV.api;
            let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session1 = await api.createSession({ excludeViewers: ['myViewer'], id: 'mySession1', ticket: ticket2, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            let session2 = await api.createSession({ id: 'mySession2', ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            await new Promise<void>((resolve) => {
                api.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket, ringTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + '/test_1');

    });
});