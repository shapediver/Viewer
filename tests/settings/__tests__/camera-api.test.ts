import webdriver from 'selenium-webdriver'
import { afterAll, beforeAll, describe, expect, test } from '@jest/globals'
import { api as API } from '@shapediver/viewer'

import { createDriver, screenshotCompare } from '../../general/src/setup'
import { sdeuc1 } from '../../general/src/models'
import { createTokenFromSlug } from '../../general/src/createTokenFromSlug'

require('chromedriver');

const shelfTicket = sdeuc1.models['Shelf'].ticket;

let driver: webdriver.WebDriver;
let name = 'camera_api_tests';
let token: string;

describe('device testing', () => {
    beforeAll(async () => {
        driver = await createDriver();
        token = await createTokenFromSlug(sdeuc1.models['Shelf'].slug);
    });

    beforeEach(async () => {
        await driver.navigate().to('https://viewer.shapediver.com/v3/latest/cdn/index.html')
    });

    afterAll(async () => {
        // await driver.executeAsyncScript(async (ticket: string, bearerToken: string, cb: any) => {
        //     const api: typeof API = (<any>window).SDV.api;
        //     let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
        //     let session = await api.createSession({ id: 'mySession', ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com', bearerToken });

        //     const camera = viewer.createPerspectiveCamera();
        //     viewer.assignCamera(camera.id);
        //     camera!.autoAdjust = (false);
        //     camera!.cameraMovementDuration = (800);
        //     camera!.defaultPosition = ([0, -80, 60]);
        //     camera!.defaultTarget = ([0, 7, -3.25]);
        //     camera!.position = ([0, -80, 60]);
        //     camera!.target = ([0, 7, -3.25]);
        //     viewer.update();
        //     await session.saveSettings();
        //     cb();
        // }, shelfTicket, token);

        await driver.close();
        await driver.quit();
    })

    it(name + '_save_perspective_front_1', async () => {
        await driver.executeAsyncScript(async (ticket: string, bearerToken: string, cb: any) => {
            const api: typeof API = (<any>window).SDV.api;
            let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await api.createSession({ id: 'mySession', ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com', bearerToken });
            await new Promise<void>((resolve) => {
                api.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            await session.saveSettings();
            cb();
        }, shelfTicket, token);

        await screenshotCompare(await driver.takeScreenshot(), name + '/default');

    });
    it(name + '_save_perspective_front_2', async () => {
        // change and save
        await driver.executeAsyncScript(async (ticket: string, bearerToken: string, cb: any) => {
            const api: typeof API = (<any>window).SDV.api;
            let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await api.createSession({ id: 'mySession', ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com', bearerToken });

            const camera = viewer.createOrthographicCamera('myNewCamera');
            (<any>camera).direction = ('front')
            viewer.assignCamera(camera.id);
            viewer.update();

            await new Promise<void>((resolve) => {
                api.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            await session.saveSettings();
            cb();
        }, shelfTicket, token);
        await screenshotCompare(await driver.takeScreenshot(), name + '/orthographic');
    });

    it(name + '_save_perspective_front_3', async () => {
        // reset and save
        await driver.executeAsyncScript(async (ticket: string, bearerToken: string, cb: any) => {
            const api: typeof API = (<any>window).SDV.api;
            let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await api.createSession({ id: 'mySession', ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com', bearerToken });

            const camera = viewer.createPerspectiveCamera();
            viewer.assignCamera(camera.id);
            camera!.autoAdjust = (false);
            camera!.cameraMovementDuration = (800);
            camera!.defaultPosition = ([0, -80, 60]);
            camera!.defaultTarget = ([0, 7, -3.25]);
            camera!.position = ([0, -80, 60]);
            camera!.target = ([0, 7, -3.25]);
            viewer.update();

            await new Promise<void>((resolve) => {
                api.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            await session.saveSettings();
            cb();
        }, shelfTicket, token);
        await screenshotCompare(await driver.takeScreenshot(), name + '/default');

    });
});
