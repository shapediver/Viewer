import webdriver from 'selenium-webdriver'
import { afterAll, beforeAll, describe, test } from '@jest/globals'

import { sdeuc1 } from '../../general/src/models'
import { createDriver, screenshotCompare } from '../../general/src/setup'
import * as ShapeDiverViewer from '@shapediver/viewer'

require('chromedriver');

const shelfTicket = sdeuc1.models['Shelf'].ticket;

let driver: webdriver.WebDriver;
let name = 'animation_tests';

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

    test(name + '_translation', async () => {
        const r: any = await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewer = await SDV.createViewport({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await SDV.createSession({ ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            await new Promise<void>((resolve) => {
                SDV.addListener(SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            const tracks: ShapeDiverViewer.IAnimationTrack[] = [{
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
            viewer.update();

            await new Promise(resolve => setTimeout(resolve, 600))
            await new Promise<void>((resolve) => {
                SDV.addListener(SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb()
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + '/translation');
    });


    test(name + '_rotation', async () => {
        const r: any = await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewer = await SDV.createViewport({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await SDV.createSession({ ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            await new Promise<void>((resolve) => {
                SDV.addListener(SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            const tracks: ShapeDiverViewer.IAnimationTrack[] = [{
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
            viewer.update();

            await new Promise(resolve => setTimeout(resolve, 600))
            await new Promise<void>((resolve) => {
                SDV.addListener(SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb()
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + '/rotation');
    });

    test(name + '_scale', async () => {
        const r: any = await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewer = await SDV.createViewport({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await SDV.createSession({ ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            await new Promise<void>((resolve) => {
                SDV.addListener(SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            const tracks: ShapeDiverViewer.IAnimationTrack[] = [{
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
            viewer.update();

            await new Promise(resolve => setTimeout(resolve, 600))
            await new Promise<void>((resolve) => {
                SDV.addListener(SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb()
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + '/scale');
    });

});
