import webdriver from 'selenium-webdriver'
import { afterAll, beforeAll, describe, expect, test } from '@jest/globals'
import * as ShapeDiverViewer from '@shapediver/viewer'

import { createDriver, screenshotCompare } from '../../general/src/setup'
import { sdeuc1 } from '../../general/src/models'

require('chromedriver');

const shelfTicket = sdeuc1.models['Shelf'].ticket;

let driver: webdriver.WebDriver;
let name = 'parameter_change';

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
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewer = await SDV.createViewport({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await SDV.createSession({ id: 'mySession', ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket);

        for (let i = 2; i <= 10; i++) {
            await driver.executeAsyncScript(async (i: number, cb: any) => {
                const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
                const session = SDV.sessions['mySession']!;
                session.getParameterById('de76cade-0cea-47b1-879e-1a0b717910e1')!.value = i;
                await session.customize();
                await new Promise<void>((resolve) => {
                    SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                cb();
            }, i);
            await screenshotCompare(await driver.takeScreenshot(), name + '/' + i);
        }
    });

    test(name, async () => {
        await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewer = await SDV.createViewport({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await SDV.createSession({ id: 'mySession', ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket);
        // [4] -> []
        await screenshotCompare(await driver.takeScreenshot(), 'undo/change_4');

        await driver.executeAsyncScript(async (cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            const session = SDV.sessions['mySession']!;
            session.getParameterById('de76cade-0cea-47b1-879e-1a0b717910e1')!.value = (2)
            await session.customize();
            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        });
        // [4, 2] -> []
        await screenshotCompare(await driver.takeScreenshot(), 'undo/change_2');

        await driver.executeAsyncScript(async (cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            const session = SDV.sessions['mySession']!;
            session.getParameterById('de76cade-0cea-47b1-879e-1a0b717910e1')!.value = (3)
            await session.customize();
            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        });
        // [4, 2, 3] -> []
        await screenshotCompare(await driver.takeScreenshot(), 'undo/change_3');

        await driver.executeAsyncScript(async (cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            const session = SDV.sessions['mySession']!;
            session.getParameterById('de76cade-0cea-47b1-879e-1a0b717910e1')!.value = (4)
            await session.customize();
            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        });
        // [4, 2, 3, 4] -> []
        await screenshotCompare(await driver.takeScreenshot(), 'undo/change_4');

        await driver.executeAsyncScript(async (cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            const session = SDV.sessions['mySession']!;
            session.getParameterById('de76cade-0cea-47b1-879e-1a0b717910e1')!.value = (5)
            await session.customize();
            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        });
        // [4, 2, 3, 4, 5] -> []
        await screenshotCompare(await driver.takeScreenshot(), 'undo/change_5');

        await driver.executeAsyncScript(async (cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            const session = SDV.sessions['mySession']!;
            await session.goBack();
            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        });
        // [4, 2, 3, 4] -> [5]
        await screenshotCompare(await driver.takeScreenshot(), 'undo/change_4');

        await driver.executeAsyncScript(async (cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            const session = SDV.sessions['mySession']!;
            await session.goBack();
            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        });
        // [4, 2, 3] -> [5, 4]
        await screenshotCompare(await driver.takeScreenshot(), 'undo/change_3');

        await driver.executeAsyncScript(async (cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            const session = SDV.sessions['mySession']!;
            await session.goForward();
            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        });
        // [4, 2, 3, 4] -> [5]
        await screenshotCompare(await driver.takeScreenshot(), 'undo/change_4');

        await driver.executeAsyncScript(async (cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            const session = SDV.sessions['mySession']!;
            session.getParameterById('de76cade-0cea-47b1-879e-1a0b717910e1')!.value = (2)
            await session.customize();
            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        });
        // [4, 2, 3, 4, 2] -> []
        await screenshotCompare(await driver.takeScreenshot(), 'undo/change_2');

        await driver.executeAsyncScript(async (cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            const session = SDV.sessions['mySession']!;
            await session.goForward();
            cb();
        });
        // should do nothing
        // [4, 2, 3, 4, 2] -> []
        await screenshotCompare(await driver.takeScreenshot(), 'undo/change_2');

        await driver.executeAsyncScript(async (cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            const session = SDV.sessions['mySession']!;
            await session.goBack();
            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        });
        // [4, 2, 3, 4] -> [2]
        await screenshotCompare(await driver.takeScreenshot(), 'undo/change_4');
    });

    test(name, async () => {
        await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewer = await SDV.createViewport({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await SDV.createSession({
                id: 'mySession',
                ticket,
                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
                initialParameterValues: {
                    'de76cade-0cea-47b1-879e-1a0b717910e1': '2'
                }
            });
            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + '/initial_parameters');
    });
});
