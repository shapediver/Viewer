import webdriver from 'selenium-webdriver'
import { afterAll, beforeAll, describe, expect, test } from '@jest/globals'
import * as ShapeDiverViewer from '@shapediver/viewer'

import { createDriver, screenshotCompare } from '../../general/src/setup'
import { sdeuc1 } from '../../general/src/models'

require('chromedriver');

const shelfTicket = sdeuc1.models['Shelf'].ticket;
const materialPresetsTicket = sdeuc1.models['Material Presets'].ticket;

let driver: webdriver.WebDriver;
let name = 'lights_tests';

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

    test(name + '_default', async () => {
        const r: any = await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewer = await SDV.createViewport({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await SDV.createSession({ ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + '/default');
    });

    test(name + '_addAmbientLight', async () => {
        const r: any = await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewer = await SDV.createViewport({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await SDV.createSession({ ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            viewer.lightScene!.addAmbientLight({});
            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + '/addAmbientLight');
    });

    test(name + '_addDirectionalLight', async () => {
        const r: any = await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewer = await SDV.createViewport({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await SDV.createSession({ ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            viewer.lightScene!.addDirectionalLight({});
            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + '/addDirectionalLight');
    });

    test(name + '_addHemisphereLight', async () => {
        const r: any = await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewer = await SDV.createViewport({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await SDV.createSession({ ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            viewer.lightScene!.addHemisphereLight({});
            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + '/addHemisphereLight');
    });

    test(name + '_addPointLight', async () => {
        const r: any = await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewer = await SDV.createViewport({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await SDV.createSession({ ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            viewer.lightScene!.addPointLight({});
            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + '/addPointLight');
    });

    test(name + '_addSpotLight', async () => {
        const r: any = await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewer = await SDV.createViewport({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await SDV.createSession({ ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            viewer.lightScene!.addSpotLight({});
            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + '/addSpotLight');
    });

    test(name + '_soloAmbientLight', async () => {
        const r: any = await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewer = await SDV.createViewport({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await SDV.createSession({ ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            viewer.createLightScene();
            viewer.removeLightScene('default');
            viewer.lightScene!.addAmbientLight({});
            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + '/soloAmbientLight');
    });

    test(name + '_soloDirectionalLight', async () => {
        const r: any = await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewer = await SDV.createViewport({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await SDV.createSession({ ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            viewer.createLightScene();
            viewer.removeLightScene('default');
            viewer.lightScene!.addDirectionalLight({});
            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + '/soloDirectionalLight');
    });

    test(name + '_soloHemisphereLight', async () => {
        const r: any = await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewer = await SDV.createViewport({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await SDV.createSession({ ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            viewer.createLightScene();
            viewer.removeLightScene('default');
            viewer.lightScene!.addHemisphereLight({});
            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + '/soloHemisphereLight');
    });

    test(name + '_soloPointLight', async () => {
        const r: any = await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewer = await SDV.createViewport({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await SDV.createSession({ ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            viewer.createLightScene();
            viewer.removeLightScene('default');
            viewer.lightScene!.addPointLight({});
            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + '/soloPointLight');
    });

    test(name + '_soloSpotLight', async () => {
        const r: any = await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewer = await SDV.createViewport({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await SDV.createSession({ ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            viewer.createLightScene();
            viewer.removeLightScene('default');
            viewer.lightScene!.addSpotLight({});
            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb(Object.keys(viewer.lightScenes).length);
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + '/soloSpotLight');
    });

    test(name + '_disable', async () => {
        const r: any = await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewer = await SDV.createViewport({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await SDV.createSession({ ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + '/default');

        const r2: any = await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewer = await SDV.createViewport({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await SDV.createSession({ ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            viewer.lights = false;
            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + '/disabled');
    });

    test(name + '_envMap_NONE', async () => {
        const r: any = await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewer = await SDV.createViewport({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await SDV.createSession({ ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
        
            viewer.lights = false;
            viewer.environmentMap = 'none';
            
            await new Promise<void>(resolve => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.TASK.TASK_END, (e) => {
                    const taskEvent = e as any;
                    if(taskEvent.type === (<any>window).SDV.TASK_TYPE.ENVIRONMENT_MAP_LOADING)
                    resolve();
                });
            })
            cb();
        }, materialPresetsTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + '/envMap_none');
    });

    test(name + '_envMap_NULL', async () => {
        const r: any = await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewer = await SDV.createViewport({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await SDV.createSession({ ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
        
            viewer.lights = false;
            viewer.environmentMap = 'null';
            
            await new Promise<void>(resolve => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.TASK.TASK_END, (e) => {
                    const taskEvent = e as any;
                    if(taskEvent.type === (<any>window).SDV.TASK_TYPE.ENVIRONMENT_MAP_LOADING)
                    resolve();
                });
            })
            cb();
        }, materialPresetsTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + '/envMap_null');
    });
});
