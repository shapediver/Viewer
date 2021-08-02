import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import webdriver, { WebDriver } from "selenium-webdriver";
require('chromedriver');
import { api as API, PerspectiveCamera, PerspectiveCameraControls} from "@shapediver/viewer"
import { screenshotCompare } from "../../general/src/setup";
import { capabilities as allCapabilities, DesktopCapabilities, MobileCapabilities } from "../../general/src/capabilities";

for(let c = 0; c < allCapabilities.length; c++) {
    let name = 'geometry_tests';
    const capabilities = Object.assign({ 'name': 'geometry_tests', 'build': require('../../../api/api/package.json').version }, allCapabilities[c]);

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
                let session = await api.createAndInitializeSession({ ticket: '96397ab9f94076b64885c3ff3a83cf23178bec2263fffa1dd1766a6778b25090a1a9caef95f267d22309d0c96438075246395b835991d4305fe534f53953153f164b872714e1bed6a004e99fe768c561a1efd3d4eff83cf2cfea1e3b37b03e5a9860102741e7819d97dc37249827c421dd0562415c5bde10eb5eb033b3e07fc1-5575b7a8fe6e3a53825ed5d052675142', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });

                const camera = api.viewers["myViewer"].getCamera()!;
                camera.set([-1400, -3400, 840], [-900, 490, 1330], {})
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                cb();
            });
            
            // TAKE A SCREENSHOT
            await screenshotCompare(await driver.takeScreenshot(), name + '/external_geometry');
        });
    });
}
