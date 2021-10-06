import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import webdriver, { WebDriver } from "selenium-webdriver";
require('chromedriver');
import { api as API, PerspectiveCamera, PerspectiveCameraControls} from "@shapediver/viewer"
import { screenshotCompare } from "../../general/src/setup";
import { capabilities as allCapabilities, DesktopCapabilities, MobileCapabilities } from "../../general/src/capabilities";

for(let c = 0; c < allCapabilities.length; c++) {
    let name = 'geometry_tests';
    const capabilities = Object.assign({ 'name': 'geometry_tests', 'build': require('../../../api/full/package.json').version }, allCapabilities[c]);

    if(process.env.PORT !== 'browserstack') {
        name = 'geometry_tests';
        c = allCapabilities.length;
    } else {
        name = 'geometry_tests/' + ((allCapabilities[c] as DesktopCapabilities).os ? 
        (<DesktopCapabilities>capabilities).os + '_' + (<DesktopCapabilities>capabilities).os_version + '_' + (<DesktopCapabilities>capabilities).browserName + '_' + (<DesktopCapabilities>capabilities).browser_version : 
        (<MobileCapabilities>capabilities).device + '_' + (<MobileCapabilities>capabilities).os_version);
    }

    let driver: WebDriver;
    describe('device testing', () => {
        beforeAll(async () => {
            if(process.env.PORT !== 'browserstack') {
                driver = await new webdriver.Builder().withCapabilities(webdriver.Capabilities.chrome()).build();
            } else {
                console.log(capabilities)
                driver = await new webdriver.Builder().usingServer('http://alexanderschiftn1:csj6VCzMwzBYyRecsbm2@hub-cloud.browserstack.com/wd/hub').withCapabilities(capabilities).build();
            }
            await driver.navigate().to('https://viewer.shapediver.com/v3/latest/gltf/index.html')
            const TIMEOUT = 300000000
            await driver.manage().setTimeouts( { implicit: TIMEOUT, pageLoad: TIMEOUT, script: TIMEOUT } );
        });

        beforeEach(async () => {
            await driver.navigate().to('https://viewer.shapediver.com/v3/latest/gltf/index.html')
        });

        afterAll(async () => {
            await driver.close();
            await driver.quit();
        })

        const namesV2 = ['AntiqueCamera', 'Avocado', 'BarramundiFish', 'BoomBox', 'Corset', 'DamagedHelmet', 'FlightHelmet', 'Lantern', 'SciFiHelmet', 'Suzanne', 'WaterBottle'];

        for (let i = 0; i < namesV2.length; i++) {
            test(name, async () => {
                // DO SOMETHING WITH THE API
                await driver.executeAsyncScript(async (gltfName: string, cb: any) => {
                    if(gltfName === 'FlightHelmet' || gltfName === 'SciFiHelmet' || gltfName === 'Suzanne') {
                        await ((<any>window).addGLTF('https://shapediverviewer.s3.amazonaws.com/v3/examples/gltf/2.0/' + gltfName + '/glTF/' + gltfName + '.gltf'));
                    } else {
                        await ((<any>window).addGLTF('https://shapediverviewer.s3.amazonaws.com/v3/examples/gltf/2.0/' + gltfName + '/glTF-Binary/' + gltfName + '.glb'))
                    }
                    const api: typeof API = (<any>window).api;

                    await new Promise<void>((resolve) => {
                        api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
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
        //             const api: typeof API = (<any>window).api;

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
}
