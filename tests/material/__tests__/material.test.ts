import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import webdriver, { WebDriver } from "selenium-webdriver";
require('chromedriver');
import { api as API, PerspectiveCamera, PerspectiveCameraControls} from "@shapediver/viewer"
import { screenshotCompare } from "../../general/src/setup";
import { capabilities as allCapabilities, DesktopCapabilities, MobileCapabilities } from "../../general/src/capabilities";

for(let c = 0; c < allCapabilities.length; c++) {
    let name = 'material_tests';
    const capabilities = Object.assign({ 'name': 'material_tests', 'build': require('../../../api/api/package.json').version }, allCapabilities[c]);

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
                let viewer = await api.createAndInitializeViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
                let session = await api.createAndInitializeSession({ ticket: 'b66e4927343abbfe6f18c38eb160c2120a7b9012e7e10bab4b6666137f1e37ac219c151ce457ec0a896b52fc838c0f9a10c1b36d597c7ff138e0f6ec4179cdf108a56fb1fc802164e74fa3550a03909f38dbb97c7d71fa62cbac58021419889ab819ea122edc59d94b759483824de6d016b6e32087fa06b1ac9a8bdb2c40d321-1f039bfad2e2af6ac84da5c7916c5f71', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });

                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                cb();
            });
            
            // TAKE A SCREENSHOT
            await screenshotCompare(await driver.takeScreenshot(), name + '/test_vertexColors');
        });

        test(name, async () => {
            // DO SOMETHING WITH THE API
            await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api; 
                let viewer = await api.createAndInitializeViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
                let session = await api.createAndInitializeSession({ ticket: 'd5b7a2dbb34e54e05dbbd86d5c626b427557636ba743186e3bcbc3103abfda3b2ae3cc722cfa191b493bfb0e72e873cebe39a629ea908e8080d9d68ce45d8c3de8ec8dd680822c03cfe3b636ea3132a7c1da75cf97a56c4918570c7f3766c7b5da29c04eb6904b4c33ec5118420c3ab7b027d1d6b6cb1422c7d8eafd58d61f34-618144e478003c9e4ca81db572d929fc', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });

                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                cb();
            });
            
            // TAKE A SCREENSHOT
            await screenshotCompare(await driver.takeScreenshot(), name + '/test_vertexColors2');
        });
    });
}
