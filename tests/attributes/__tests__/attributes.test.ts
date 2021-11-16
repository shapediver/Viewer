import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import webdriver, { WebDriver } from "selenium-webdriver";
require('chromedriver');
import { api as API} from "@shapediver/viewer"
import { screenshotCompare } from "../../general/src/setup";
import { capabilities as allCapabilities, DesktopCapabilities, MobileCapabilities } from "../../general/src/capabilities";

for(let c = 0; c < allCapabilities.length; c++) {
    let name = 'attribute_tests';
    const capabilities = Object.assign({ 'name': 'attribute_tests', 'build': require('../../../api/api/package.json').version }, allCapabilities[c]);

    if(process.env.PORT !== 'browserstack') {
        name = 'attribute_tests';
        c = allCapabilities.length;
    } else {
        name = 'attribute_tests/' + ((allCapabilities[c] as DesktopCapabilities).os ? 
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
            await driver.navigate().to('https://viewer.shapediver.com/v3/latest/test/index.html')
            const TIMEOUT = 300000000
            await driver.manage().setTimeouts( { implicit: TIMEOUT, pageLoad: TIMEOUT, script: TIMEOUT } );
        });

        beforeEach(async () => {
            await driver.navigate().to('https://viewer.shapediver.com/v3/latest/test/index.html')
        });

        afterAll(async () => {
            await driver.close();
            await driver.quit();
        })
        
        test(name + '_none', async () => {
            const r: any = await driver.executeAsyncScript(async (cb: any) => {
                const SDV = (<any>window).SDV; 
                let viewer = await SDV.api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
                let session = await SDV.api.createSession({ ticket: 'b22758984bda025b74ade62e123efb70d01a11f220918de42462e49cabaf63c4c73c1369c8881b4c6e9245bc35a8993e9b7d140d8d2eb4f43fae35290756bd68aafcf9feede2d7d6f7b9cc2268aa663a3667a1ef6aae6af5d3c6135504c280dab96cc30806e899-b24927af11874874c346a214a19a81e5', modelViewUrl: 'https://sddev2.eu-central-1.shapediver.com' });
                viewer.ambientOcclusion = false;
                viewer.shadows = false;
                viewer.type = SDV.RENDERERTYPE.ATTRIBUTES;
                session.node.updateVersion()
                viewer.update();

                await new Promise<void>((resolve) => {
                    SDV.api.addListener(SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                cb();
            });
            await screenshotCompare(await driver.takeScreenshot(), name + '/none');
        });

        test(name + '_color', async () => {
            const r: any = await driver.executeAsyncScript(async (cb: any) => {
                const SDV = (<any>window).SDV; 
                let viewer = await SDV.api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
                let session = await SDV.api.createSession({ ticket: 'b22758984bda025b74ade62e123efb70d01a11f220918de42462e49cabaf63c4c73c1369c8881b4c6e9245bc35a8993e9b7d140d8d2eb4f43fae35290756bd68aafcf9feede2d7d6f7b9cc2268aa663a3667a1ef6aae6af5d3c6135504c280dab96cc30806e899-b24927af11874874c346a214a19a81e5', modelViewUrl: 'https://sddev2.eu-central-1.shapediver.com' });
                viewer.ambientOcclusion = false;
                viewer.shadows = false;
                viewer.type = SDV.RENDERERTYPE.ATTRIBUTES;
                viewer.visualizationAttributes["color"] = true;

                session.node.updateVersion()
                viewer.update();

                await new Promise<void>((resolve) => {
                    SDV.api.addListener(SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                cb();
            });
            await screenshotCompare(await driver.takeScreenshot(), name + '/color');
        });

        test(name + '_plotcolor', async () => {
            const r: any = await driver.executeAsyncScript(async (cb: any) => {
                const SDV = (<any>window).SDV; 
                let viewer = await SDV.api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
                let session = await SDV.api.createSession({ ticket: 'b22758984bda025b74ade62e123efb70d01a11f220918de42462e49cabaf63c4c73c1369c8881b4c6e9245bc35a8993e9b7d140d8d2eb4f43fae35290756bd68aafcf9feede2d7d6f7b9cc2268aa663a3667a1ef6aae6af5d3c6135504c280dab96cc30806e899-b24927af11874874c346a214a19a81e5', modelViewUrl: 'https://sddev2.eu-central-1.shapediver.com' });
                viewer.ambientOcclusion = false;
                viewer.shadows = false;
                viewer.type = SDV.RENDERERTYPE.ATTRIBUTES;
                viewer.visualizationAttributes["plotcolor"] = true;

                session.node.updateVersion()
                viewer.update();

                await new Promise<void>((resolve) => {
                    SDV.api.addListener(SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                cb();
            });
            await screenshotCompare(await driver.takeScreenshot(), name + '/plotcolor');
        });

        test(name + '_layer', async () => {
            const r: any = await driver.executeAsyncScript(async (cb: any) => {
                const SDV = (<any>window).SDV; 
                let viewer = await SDV.api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
                let session = await SDV.api.createSession({ ticket: 'b22758984bda025b74ade62e123efb70d01a11f220918de42462e49cabaf63c4c73c1369c8881b4c6e9245bc35a8993e9b7d140d8d2eb4f43fae35290756bd68aafcf9feede2d7d6f7b9cc2268aa663a3667a1ef6aae6af5d3c6135504c280dab96cc30806e899-b24927af11874874c346a214a19a81e5', modelViewUrl: 'https://sddev2.eu-central-1.shapediver.com' });
                viewer.ambientOcclusion = false;
                viewer.shadows = false;
                viewer.type = SDV.RENDERERTYPE.ATTRIBUTES;
                viewer.visualizationAttributes["layer"] = true;

                session.node.updateVersion()
                viewer.update();

                await new Promise<void>((resolve) => {
                    SDV.api.addListener(SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                cb();
            });
            await screenshotCompare(await driver.takeScreenshot(), name + '/layer');
        });
        
        
    });
}
