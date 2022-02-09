import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import webdriver, { WebDriver } from "selenium-webdriver";
require('chromedriver');
import { api as API } from "@shapediver/viewer"
import { screenshotCompare } from "../../general/src/setup";
import { sdeuc1 } from "../../general/src/models";

let name = 'lights_tests';
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

    test(name + '_default', async () => {
        const r: any = await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const api: typeof API = (<any>window).SDV.api;
            let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await api.createSession({ ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            await new Promise<void>((resolve) => {
                api.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + '/default');
    });

    test(name + '_addAmbientLight', async () => {
        const r: any = await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const api: typeof API = (<any>window).SDV.api;
            let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await api.createSession({ ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            viewer.lightScene!.addAmbientLight({});
            await new Promise<void>((resolve) => {
                api.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + '/addAmbientLight');
    });

    test(name + '_addDirectionalLight', async () => {
        const r: any = await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const api: typeof API = (<any>window).SDV.api;
            let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await api.createSession({ ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            viewer.lightScene!.addDirectionalLight({});
            await new Promise<void>((resolve) => {
                api.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + '/addDirectionalLight');
    });

    test(name + '_addHemisphereLight', async () => {
        const r: any = await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const api: typeof API = (<any>window).SDV.api;
            let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await api.createSession({ ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            viewer.lightScene!.addHemisphereLight({});
            await new Promise<void>((resolve) => {
                api.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + '/addHemisphereLight');
    });

    test(name + '_addPointLight', async () => {
        const r: any = await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const api: typeof API = (<any>window).SDV.api;
            let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await api.createSession({ ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            viewer.lightScene!.addPointLight({});
            await new Promise<void>((resolve) => {
                api.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + '/addPointLight');
    });

    test(name + '_addSpotLight', async () => {
        const r: any = await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const api: typeof API = (<any>window).SDV.api;
            let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await api.createSession({ ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            viewer.lightScene!.addSpotLight({});
            await new Promise<void>((resolve) => {
                api.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + '/addSpotLight');
    });

    test(name + '_soloAmbientLight', async () => {
        const r: any = await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const api: typeof API = (<any>window).SDV.api;
            let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await api.createSession({ ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            viewer.createLightScene();
            viewer.removeLightScene('default');
            viewer.lightScene!.addAmbientLight({});
            await new Promise<void>((resolve) => {
                api.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + '/soloAmbientLight');
    });

    test(name + '_soloDirectionalLight', async () => {
        const r: any = await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const api: typeof API = (<any>window).SDV.api;
            let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await api.createSession({ ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            viewer.createLightScene();
            viewer.removeLightScene('default');
            viewer.lightScene!.addDirectionalLight({});
            await new Promise<void>((resolve) => {
                api.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + '/soloDirectionalLight');
    });

    test(name + '_soloHemisphereLight', async () => {
        const r: any = await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const api: typeof API = (<any>window).SDV.api;
            let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await api.createSession({ ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            viewer.createLightScene();
            viewer.removeLightScene('default');
            viewer.lightScene!.addHemisphereLight({});
            await new Promise<void>((resolve) => {
                api.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + '/soloHemisphereLight');
    });

    test(name + '_soloPointLight', async () => {
        const r: any = await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const api: typeof API = (<any>window).SDV.api;
            let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await api.createSession({ ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            viewer.createLightScene();
            viewer.removeLightScene('default');
            viewer.lightScene!.addPointLight({});
            await new Promise<void>((resolve) => {
                api.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + '/soloPointLight');
    });

    test(name + '_soloSpotLight', async () => {
        const r: any = await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const api: typeof API = (<any>window).SDV.api;
            let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await api.createSession({ ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            viewer.createLightScene();
            viewer.removeLightScene('default');
            viewer.lightScene!.addSpotLight({});
            await new Promise<void>((resolve) => {
                api.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb(Object.keys(viewer.lightScenes).length);
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + '/soloSpotLight');
    });
});
