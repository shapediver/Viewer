import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import webdriver, { WebDriver } from "selenium-webdriver";
require('chromedriver');
import { api as API} from "@shapediver/viewer"
import { screenshotCompare } from "../../general/src/setup";
import { capabilities as allCapabilities, DesktopCapabilities, MobileCapabilities } from "../../general/src/capabilities";

for(let c = 0; c < allCapabilities.length; c++) {
    const capabilities = Object.assign({ 'name': 'selenium_tests', 'build': require('../../../api/api/package.json').version }, allCapabilities[c]);
    let name = 'settings_visual';

    if(process.env.PORT !== 'browserstack') {
        name = 'settings_visual';
        c = allCapabilities.length;
    } else {
        name = 'settings_visual ' + ((allCapabilities[c] as DesktopCapabilities).os ? 
        (<DesktopCapabilities>capabilities).os + ' ' + (<DesktopCapabilities>capabilities).os_version + ' ' + (<DesktopCapabilities>capabilities).browserName + ' ' + (<DesktopCapabilities>capabilities).browser_version : 
        (<MobileCapabilities>capabilities).device + ' ' + (<MobileCapabilities>capabilities).os_version);
    }

    let driver: WebDriver;
    describe('device testing', () => {
        beforeEach(async () => {
            console.log(name)

            if(process.env.PORT !== 'browserstack') {
                driver = await new webdriver.Builder().withCapabilities(webdriver.Capabilities.chrome()).build();
            } else {
                driver = await new webdriver.Builder().usingServer('http://alexanderschiftn1:csj6VCzMwzBYyRecsbm2@hub-cloud.browserstack.com/wd/hub').withCapabilities(capabilities).build();
            }
            
            await driver.navigate().to('https://viewer.shapediver.com/v3/latest/test/index.html')
            const TIMEOUT = 300000000
            await driver.manage().setTimeouts( { implicit: TIMEOUT, pageLoad: TIMEOUT, script: TIMEOUT } );
        });
        
        afterEach(async () => {
            await driver.close();
        });
        
        test(name + '_build_date', async () => {
            // DO SOMETHING WITH THE API
            await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api; 
                let viewer = api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
                let session = await api.createAndInitializeSession({ ticket: 'a7a468be421d49eeede903037db71fadbcc9df95919b088e497ef32c4e3d4934a9c0f866997c915f40f4bbb432119fc838c44d89061a64185f6ca8b02125c0d36aa3b1c43951fe0800ec5d367ec2618351a3dbfbac642b23b3593693c8fce19a89122037938d2eb614fcdc2bc50c0dffd01ef2b9718c-69dd449456f08051ab79a42a4cbc9881', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                cb();
            });
            
            // TAKE A SCREENSHOT
            await screenshotCompare(await driver.takeScreenshot(), name + '_build_date');
        });
    });
}
