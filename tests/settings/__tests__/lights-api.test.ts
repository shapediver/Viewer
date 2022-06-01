import webdriver from 'selenium-webdriver'
import { afterAll, beforeAll, describe, expect, test } from '@jest/globals'
import * as ShapeDiverViewer from '@shapediver/viewer'

import { createDriver, screenshotCompare } from '../../general/src/setup'
import { sdeuc1 } from '../../general/src/models'
import { createTokenFromSlug } from '../../general/src/createTokenFromSlug'

require('chromedriver');

const shelfTicket = sdeuc1.models['Shelf'].ticket;

let driver: webdriver.WebDriver;
let name = 'lights_SDV_tests';
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
        //     const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
        //     let viewer = await SDV.createViewport({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
        //     let session = await SDV.createSession({ id: 'mySession', ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com', bearerToken });

        //     for(let ls in viewer.lightScenes)
        //         viewer.removeLightScene(ls);

        //     viewer.createLightScene({name: 'standard', standard: true})
        //     viewer.update();
        //     await session.saveSettings();
        //     cb();
        // }, shelfTicket, token);


        await driver.close();
        await driver.quit();
    })

    it(name + '_default', async () => {
        await driver.executeAsyncScript(async (ticket: string, bearerToken: string, cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewer = await SDV.createViewport({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await SDV.createSession({
                ticket,
                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
                jwtToken: bearerToken
            });
            await session.saveSettings();
            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket, token);
        await screenshotCompare(await driver.takeScreenshot(), name + '/default');
    });

    it(name + '_createNewLightScene', async () => {
        await driver.executeAsyncScript(async (ticket: string, bearerToken: string, cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewer = await SDV.createViewport({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await SDV.createSession({
                ticket,
                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
                jwtToken: bearerToken
            });
            viewer.createLightScene({ name: 'test1' });
            viewer.createLightScene({ name: 'test2' });
            viewer.createLightScene({ name: 'test3' });
            viewer.assignLightScene('standard');
            await session.saveSettings();
            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket, token);
        await screenshotCompare(await driver.takeScreenshot(), name + '/default');
    });


    it(name + '_createNewLightSceneCount', async () => {
        const r: any = await driver.executeAsyncScript(async (ticket: string, bearerToken: string, cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewer = await SDV.createViewport({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await SDV.createSession({
                ticket,
                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
                jwtToken: bearerToken
            });
            cb(Object.keys(viewer.lightScenes).length);
        }, shelfTicket, token);
        expect(r).toBe(4);
    });

    it(name + '_lightScene1Adjustments', async () => {
        await driver.executeAsyncScript(async (ticket: string, bearerToken: string, cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewer = await SDV.createViewport({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await SDV.createSession({
                ticket,
                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
                jwtToken: bearerToken
            });
            viewer.assignLightScene('test1');
            viewer.lightScene!.addAmbientLight({ color: '#ff0000' })
            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket, token);
        await screenshotCompare(await driver.takeScreenshot(), name + '/test1');
    });

    it(name + '_lightScene2Adjustments', async () => {
        await driver.executeAsyncScript(async (ticket: string, bearerToken: string, cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewer = await SDV.createViewport({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await SDV.createSession({
                ticket,
                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
                jwtToken: bearerToken
            });
            viewer.assignLightScene('test2');
            viewer.lightScene!.addDirectionalLight({ color: '#00ff00' })
            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket, token);
        await screenshotCompare(await driver.takeScreenshot(), name + '/test2');
    });

    it(name + '_lightScene3Adjustments', async () => {
        await driver.executeAsyncScript(async (ticket: string, bearerToken: string, cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewer = await SDV.createViewport({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await SDV.createSession({
                ticket,
                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
                jwtToken: bearerToken
            });
            viewer.assignLightScene('test3');
            viewer.lightScene!.addPointLight({ color: '#0000ff' })
            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket, token);
        await screenshotCompare(await driver.takeScreenshot(), name + '/test3');
    });

    it(name + '_deleteNewLightScene', async () => {
        await driver.executeAsyncScript(async (ticket: string, bearerToken: string, cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewer = await SDV.createViewport({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await SDV.createSession({
                ticket,
                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
                jwtToken: bearerToken
            });
            for (let ls in viewer.lightScenes)
                viewer.removeLightScene(ls);

            const ls = viewer.createLightScene({ name: 'standard' });
            ls.addAmbientLight({ color: '#ffffff', intensity: 0.5, name: 'ambient0' });
            ls.addDirectionalLight({ color: '#ffffff', intensity: 0.75, direction: [.5774, -.5774, .5774], castShadow: true, name: 'directional0' });
            ls.addDirectionalLight({ color: '#ffffff', intensity: 0.35, direction: [.25, -1, 1], castShadow: false, name: 'directional1' });
            await session.saveSettings();
            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket, token);
        await screenshotCompare(await driver.takeScreenshot(), name + '/default');
    });

    it(name + '_checkDefaultLightScene', async () => {
        const r: any = await driver.executeAsyncScript(async (ticket: string, bearerToken: string, cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewer = await SDV.createViewport({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await SDV.createSession({
                ticket,
                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
                jwtToken: bearerToken
            });
            cb(Object.keys(viewer.lightScenes).length);
        }, shelfTicket, token);
        expect(r).toBe(1);
    });
});
