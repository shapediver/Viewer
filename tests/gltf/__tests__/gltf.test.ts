import webdriver from 'selenium-webdriver'
import { afterAll, beforeAll, describe, expect, test } from '@jest/globals'
import { api as API, PerspectiveCamera, PerspectiveCameraControls } from '@shapediver/viewer'

import { createDriver, screenshotCompare } from '../../general/src/setup'

require('chromedriver');

let driver: webdriver.WebDriver;
let name = 'geometry_tests';

describe('device testing', () => {
    beforeAll(async () => {
        driver = await createDriver();
    });

    beforeEach(async () => {
        await driver.navigate().to('https://viewer.shapediver.com/v3/latest/gltf/index.html')
    });

    afterAll(async () => {
        await driver.close();
        await driver.quit();
    })

    const namesV2 = ['AlphaBlendModeTest', 'AntiqueCamera', 'Avocado', 'BarramundiFish', 'BoomBox', 'Corset', 'DamagedHelmet', 'FlightHelmet', 'Lantern', 'SciFiHelmet', 'Suzanne', 'WaterBottle'];

    for (let i = 0; i < namesV2.length; i++) {
        test(name, async () => {
            // DO SOMETHING WITH THE API
            await driver.executeAsyncScript(async (gltfName: string, cb: any) => {
                if (gltfName === 'FlightHelmet' || gltfName === 'SciFiHelmet' || gltfName === 'Suzanne') {
                    await ((<any>window).addGLTF('https://shapediverviewer.s3.amazonaws.com/v3/examples/gltf/2.0/' + gltfName + '/glTF/' + gltfName + '.gltf'));
                } else {
                    await ((<any>window).addGLTF('https://shapediverviewer.s3.amazonaws.com/v3/examples/gltf/2.0/' + gltfName + '/glTF-Binary/' + gltfName + '.glb'))
                }
                const api: typeof API = (<any>window).SDV.api;

                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                cb();
            }, namesV2[i]);

            // TAKE A SCREENSHOT
            await screenshotCompare(await driver.takeScreenshot(), name + '/gltf_2.0_' + namesV2[i]);
        });
    }

    // const namesV1 = ['Duck', 'Avocado', 'BarramundiFish', 'Gearbox Assy'];

    // for (let i = 0; i < namesV1.length; i++) {

    //     test(name, async () => {
    //         // DO SOMETHING WITH THE API
    //         await driver.executeAsyncScript(async (gltfName: string, cb: any) => {
    //             (<any>window).gltfVersion = '1.0';
    //             await ((<any>window).addGLTF('https://shapediverviewer.s3.amazonaws.com/v3/examples/gltf/1.0/' + gltfName + '/glTF-Binary/' + gltfName + '.glb'))
    //             const api: typeof API = (<any>window).SDV.api;

    //             await new Promise<void>((resolve) => {
    //                 api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
    //             })
    //             cb();
    //         }, namesV1[i]);

    //         // TAKE A SCREENSHOT
    //         await screenshotCompare(await driver.takeScreenshot(), name + '/gltf_1.0_' + namesV1[i]);
    //     });
    // }
});
