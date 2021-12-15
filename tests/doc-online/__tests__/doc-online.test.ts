import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import webdriver, { By, WebDriver } from "selenium-webdriver";
require('chromedriver');
import { screenshotCompare } from "../../general/src/setup";

let name = 'doc_online_test';
let driver: WebDriver;
describe('device testing', () => {
    beforeAll(async () => {
        driver = await new webdriver.Builder().withCapabilities(webdriver.Capabilities.chrome()).build();
    });

    afterAll(async () => {
        await driver.close();
        await driver.quit();
    })

    let codePenExamples = ['https://codepen.io/ShapeDiver/live/WNEbxYM', 'https://codepen.io/ShapeDiver/live/PoKYjeE', 'https://codepen.io/ShapeDiver/live/PoKYjNm'];
    for (let i = 0; i < codePenExamples.length; i++) {
        test(name + '_CodePen_' + i, async () => {
            await driver.navigate().to(codePenExamples[i]);
            await new Promise(resolve => setTimeout(resolve, 10000));

            // TAKE A SCREENSHOT
            await screenshotCompare(await driver.takeScreenshot(), name + '/_CodePen_' + i);
        });
    }

    let codeSandBoxExamples = ['https://ob8vw.csb.app/', 'https://hcwv4.csb.app/', 'https://vli7o.csb.app/'];
    for (let i = 0; i < codeSandBoxExamples.length; i++) {
        test(name + '_CodeSandBox_' + i, async () => {
            await driver.navigate().to(codeSandBoxExamples[i]);
            await new Promise(resolve => setTimeout(resolve, 10000));

            // TAKE A SCREENSHOT
            await screenshotCompare(await driver.takeScreenshot(), name + '/_CodeSandBox_' + i);
        });
    }
});