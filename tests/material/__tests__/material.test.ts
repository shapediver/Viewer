import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import webdriver, { WebDriver } from "selenium-webdriver";
require('chromedriver');
import { api as API, PerspectiveCamera, PerspectiveCameraControls} from "@shapediver/viewer"
import { screenshotCompare } from "../../general/src/setup";
import { capabilities as allCapabilities, DesktopCapabilities, MobileCapabilities } from "../../general/src/capabilities";

for(let c = 0; c < allCapabilities.length; c++) {
    let name = 'material_tests';
    const capabilities = Object.assign({ 'name': 'material_tests', 'build': require('../../../api/full/package.json').version }, allCapabilities[c]);

    if(process.env.PORT !== 'browserstack') {
        name = 'material_tests';
        c = allCapabilities.length;
    } else {
        name = 'material_tests/' + ((allCapabilities[c] as DesktopCapabilities).os ? 
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
        
        test(name, async () => {
            // DO SOMETHING WITH THE API
            await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api; 
                let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
                let session = await api.createSession({ ticket: '3017a44322f7cd5dc4e1bfbe4d3e8bfdd9a265fd00c6bf2415f345c28ec76cda9a60a41f41c16af7ddc429ab1d19967469c8a5c3fb73ac8c45288a2a0387a4566ae3d45d2ff44e21493b36be5138e6b7ca92b250b4c7b6f01f7efe120d1e990df4b0237478023040c1965ad40f85043e1c4b1553bb2bc8b45777d9b5fde21f-3655c2562cc577697d3bff8bf250a6fb', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });

                const camera = api.viewers["myViewer"].camera!;
                (<PerspectiveCamera>camera).controls.enableAutoRotation = false;

                camera.reset({});
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                cb();
            });
            
            // TAKE A SCREENSHOT
            await screenshotCompare(await driver.takeScreenshot(), name + '/vertexColors');
        });

        test(name, async () => {
            // DO SOMETHING WITH THE API
            await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api; 
                let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
                let session = await api.createSession({ ticket: 'b9deea346b988b90b45ef359be0e57d3325fb8e089c33008a5c7e41b5a3020b1ba16b5f4926c9d487037cf128455653573096649deee8415afa220b4ec27565e28178f2193c9f66366361de05e866e9c91e0c44f278261692f7c778dbf3ee3c53a139526fded5aea8aa8a52f19a9fc20aed1eab5f6da22eac8e0eff4b8ca4ddd-df2cbd31660c1cd9d38673d8362b9466', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                const camera = viewer.camera!;
                (<PerspectiveCamera>camera).controls.enableAutoRotation = false;
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                cb();
            });
            
            // TAKE A SCREENSHOT
            await screenshotCompare(await driver.takeScreenshot(), name + '/vertexColors2');
        });

        test(name, async () => {
            // DO SOMETHING WITH THE API
            await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api; 
                let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
                let session = await api.createSession({ ticket: '75f6f416a8200ed5d64f9c15f39320df0c9a630878d235332451657e1a1524fa7a39ef96d4a0b866c6ebacbf202b32e5fad90f4fe6a54276d892831f5aa4bc2cbd4cdd73231a2db23055c7a9d6d2707eb329315ab0f8d5a489cdff33b99e9b49ed68af70f4b139c941000063d19fff574b7c3b2b55460eac6ec23a86f3fd0d-a2beded2e997ea7d1d6e9b03cd3c86d1', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });

                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                cb();
            });
            
            // TAKE A SCREENSHOT
            await screenshotCompare(await driver.takeScreenshot(), name + '/standard_material');
        });
    });
}
