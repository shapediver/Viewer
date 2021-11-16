import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import webdriver, { By, WebDriver } from "selenium-webdriver";
require('chromedriver');
import { api as API, PerspectiveCamera, PerspectiveCameraControls} from "@shapediver/viewer"
import { screenshotCompare } from "../../general/src/setup";
import { capabilities as allCapabilities, DesktopCapabilities, MobileCapabilities } from "../../general/src/capabilities";

for(let c = 0; c < allCapabilities.length; c++) {
    let name = 'doc_online_test';
    const capabilities = Object.assign({ 'name': 'doc_online_test', 'build': require('../../../api/api/package.json').version }, allCapabilities[c]);

    if(process.env.PORT !== 'browserstack') {
        name = 'doc_online_test';
        c = allCapabilities.length;
    } else {
        name = 'doc_online_test/' + ((allCapabilities[c] as DesktopCapabilities).os ? 
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
        });

        afterAll(async () => {
            await driver.close();
            await driver.quit();
        })

        let codePenExamples = ['https://codepen.io/ShapeDiver/live/WNEbxYM', 'https://codepen.io/ShapeDiver/live/PoKYjeE', 'https://codepen.io/ShapeDiver/live/PoKYjNm'];
        for(let i = 0; i < codePenExamples.length; i++) {
            test(name + '_CodePen_' + i, async () => {
                await driver.navigate().to(codePenExamples[i]);
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // TAKE A SCREENSHOT
                await screenshotCompare(await driver.takeScreenshot(), name + '/_CodePen_' + i);
            });
        }

        let codeSandBoxExamples = ['https://ob8vw.csb.app/', 'https://hcwv4.csb.app/', 'https://vli7o.csb.app/'];
        for(let i = 0; i < codeSandBoxExamples.length; i++) {
            test(name + '_CodeSandBox_' + i, async () => {
                await driver.navigate().to(codeSandBoxExamples[i]);
                await new Promise(resolve => setTimeout(resolve, 5000));
                
                // TAKE A SCREENSHOT
                await screenshotCompare(await driver.takeScreenshot(), name + '/_CodeSandBox_' + i);
            });
        }
    });
}
