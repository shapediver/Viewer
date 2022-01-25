import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import webdriver, { WebDriver } from "selenium-webdriver";
require('chromedriver');
import { screenshotCompare } from "../../general/src/setup";
import { sdeuc1 } from "../../general/src/models";

let name = 'animation_tests';
const shelfTicket = sdeuc1.models['Shelf'].ticket;

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

    test(name + '_translation', async () => {
        const r: any = await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const SDV = (<any>window).SDV;
            let viewer = await SDV.api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await SDV.api.createSession({ ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            await new Promise<void>((resolve) => {
                SDV.api.addListener(SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            const tracks = [{
                times: [0, 0.5],
                node: session.node,
                values: [0, 0, 0, 25, 0, 0],
                path: 'translation',
                interpolation: 'linear'
            }];
            const data = new SDV.AnimationData('myAnimation', tracks, 0, 0.5);
            data.reset = false;
            session.node.data.push(data);
            data.startAnimation();
            SDV.api.update();


            await new Promise(resolve => setTimeout(resolve, 600))
            await new Promise<void>((resolve) => {
                SDV.api.addListener(SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb()
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + '/translation');
    });


    test(name + '_rotation', async () => {
        const r: any = await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const SDV = (<any>window).SDV;
            let viewer = await SDV.api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await SDV.api.createSession({ ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            await new Promise<void>((resolve) => {
                SDV.api.addListener(SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            const tracks = [{
                times: [0, 0.5],
                node: session.node,
                values: [0, 0, 0, 1, 0, 0, 1, 0],
                path: 'rotation',
                interpolation: 'linear'
            }];
            const data = new SDV.AnimationData('myAnimation', tracks, 0, 0.5);
            data.reset = false;
            session.node.data.push(data);
            data.startAnimation();
            SDV.api.update();


            await new Promise(resolve => setTimeout(resolve, 600))
            await new Promise<void>((resolve) => {
                SDV.api.addListener(SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb()
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + '/rotation');
    });

    test(name + '_scale', async () => {
        const r: any = await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const SDV = (<any>window).SDV;
            let viewer = await SDV.api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await SDV.api.createSession({ ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            await new Promise<void>((resolve) => {
                SDV.api.addListener(SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            const tracks = [{
                times: [0, 0.5],
                node: session.node,
                values: [1, 1, 1, 1.5, 1.5, 1.5],
                path: 'scale',
                interpolation: 'linear'
            }];
            const data = new SDV.AnimationData('myAnimation', tracks, 0, 0.5);
            data.reset = false;
            session.node.data.push(data);
            data.startAnimation();
            SDV.api.update();


            await new Promise(resolve => setTimeout(resolve, 600))
            await new Promise<void>((resolve) => {
                SDV.api.addListener(SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb()
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + '/scale');
    });

});
