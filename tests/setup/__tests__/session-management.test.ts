import webdriver from 'selenium-webdriver'
import { afterAll, beforeAll, describe, expect, test } from '@jest/globals'
import { api as API } from '@shapediver/viewer'

import { createDriver, screenshotCompare } from '../../general/src/setup'
import { sdeuc1 } from '../../general/src/models'

require('chromedriver');
const shelfTicket = sdeuc1.models['Shelf'].ticket;
const ringTicket = sdeuc1.models['Ring'].ticket;

let driver: webdriver.WebDriver;
let name = 'session_closing';

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
            let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await api.createSession({ id: 'mySession', ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            await new Promise<void>((resolve) => {
                api.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + '/1_1');

        await driver.executeAsyncScript(async (cb: any) => {
            const api: typeof API = (<any>window).SDV.api;
            await api.closeSession('mySession');
            cb();
        });
        await screenshotCompare(await driver.takeScreenshot(), name + '/1_2');

        await driver.executeAsyncScript(async (ticket2: string, cb: any) => {
            const api: typeof API = (<any>window).SDV.api;
            let session1 = await api.createSession({ id: 'mySession1', ticket: ticket2, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            await new Promise<void>((resolve) => {
                api.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, ringTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + '/1_3');
    });


    test(name, async () => {
        await driver.executeAsyncScript(async (ticket: string, ticket2: string, cb: any) => {
            const api: typeof API = (<any>window).SDV.api;
            let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session1 = await api.createSession({ id: 'mySession1', ticket: ticket2, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            let session2 = await api.createSession({ id: 'mySession2', ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            await new Promise<void>((resolve) => {
                api.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket, ringTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + '/2_1');

        await driver.executeAsyncScript(async (cb: any) => {
            const api: typeof API = (<any>window).SDV.api;
            await api.closeSession('mySession1');
            await new Promise<void>((resolve) => {
                api.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        });
        await screenshotCompare(await driver.takeScreenshot(), name + '/2_2');

        await driver.executeAsyncScript(async (cb: any) => {
            const api: typeof API = (<any>window).SDV.api;
            await api.closeSession('mySession2');
            cb();
        });
        await screenshotCompare(await driver.takeScreenshot(), name + '/2_3');
    });



    test(name, async () => {
        await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const api: typeof API = (<any>window).SDV.api;
            let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await api.createSession({ id: 'mySession', ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });

            await new Promise<void>((resolve) => {
                api.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + '/3_1');

        await driver.executeAsyncScript(async (cb: any) => {
            const api: typeof API = (<any>window).SDV.api;
            await api.closeSession('mySession');
            cb();
        });
        await screenshotCompare(await driver.takeScreenshot(), name + '/3_2');

        await driver.executeAsyncScript(async (ticket2: string, cb: any) => {
            const api: typeof API = (<any>window).SDV.api;
            let session1 = await api.createSession({ id: 'mySession1', ticket: ticket2, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            await new Promise<void>((resolve) => {
                api.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, ringTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + '/3_3');
    });


    test(name, async () => {
        await driver.executeAsyncScript(async (ticket: string, ticket2: string, cb: any) => {
            const api: typeof API = (<any>window).SDV.api;
            let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session1 = await api.createSession({ id: 'mySession1', ticket: ticket2, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            let session2 = await api.createSession({ id: 'mySession2', ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });

            await new Promise<void>((resolve) => {
                api.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket, ringTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + '/4_1');

        await driver.executeAsyncScript(async (cb: any) => {
            const api: typeof API = (<any>window).SDV.api;
            await api.closeSession('mySession1');
            await new Promise<void>((resolve) => {
                api.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        });
        await screenshotCompare(await driver.takeScreenshot(), name + '/4_2');

        await driver.executeAsyncScript(async (cb: any) => {
            const api: typeof API = (<any>window).SDV.api;
            await api.closeSession('mySession2');
            cb();
        });
        await screenshotCompare(await driver.takeScreenshot(), name + '/4_3');
    });



    test(name, async () => {
        await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const api: typeof API = (<any>window).SDV.api;
            let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session2 = await api.createSession({ waitForOutputs: false, id: 'mySession2', ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            cb();
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + '/5_1');
    });


    test(name, async () => {
        await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const api: typeof API = (<any>window).SDV.api;
            let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session2 = await api.createSession({ waitForOutputs: false, id: 'mySession2', ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            await new Promise<void>((resolve) => {
                api.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + '/6_1');
    });
});
