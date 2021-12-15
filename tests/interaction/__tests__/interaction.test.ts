import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import webdriver, { By, WebDriver } from "selenium-webdriver";
require('chromedriver');
import { api as API, PerspectiveCamera, PerspectiveCameraControls } from "@shapediver/viewer"
import { screenshotCompare } from "../../general/src/setup";
import { capabilities as allCapabilities, DesktopCapabilities, MobileCapabilities } from "../../general/src/capabilities";

let name = 'interaction_tests';
let driver: WebDriver;
let actions: webdriver.Actions;
describe('device testing', () => {
    beforeAll(async () => {
        driver = await new webdriver.Builder().withCapabilities(webdriver.Capabilities.chrome()).build();
        await driver.navigate().to('https://viewer.shapediver.com/v3/latest/interaction/index.html')
        const TIMEOUT = 300000000;
        await driver.manage().setTimeouts({ implicit: TIMEOUT, pageLoad: TIMEOUT, script: TIMEOUT });
    });

    beforeEach(async () => {
        await driver.navigate().to('https://viewer.shapediver.com/v3/latest/interaction/index.html');
    });

    afterAll(async () => {
        await driver.close();
        await driver.quit();
    })

    test(name, async () => {


        // DO SOMETHING WITH THE API
        await driver.executeAsyncScript(async (cb: any) => {
            //const api: typeof API = (<any>window).api; 
            await new Promise(resolve => setTimeout(resolve, 250))
            cb();
        });

        let bottomImage = driver.findElement(By.id('bottom'));
        actions = driver.actions({ async: true, bridge: true });

        // 1000 750
        // -> 750 650
        // -> 450 700
        // -> 1000 750
        await actions.move({ origin: bottomImage }).press().pause(500).move({ x: 1000, y: 750 }).release().pause(500).perform()
        await actions.clear()
        await actions.move({ origin: bottomImage }).move({ x: 1000, y: 750 }).press().move({ x: 750, y: 650 }).release().pause(500).perform()
        await actions.clear()
        await actions.move({ origin: bottomImage }).move({ x: 750, y: 650 }).press().move({ x: 450, y: 700 }).release().pause(500).perform()
        await actions.clear()
        await actions.move({ origin: bottomImage }).move({ x: 450, y: 700 }).press().move({ x: 1000, y: 750 }).release().pause(500).perform()
        await actions.clear()

        // 500 900
        // -> 800 850
        await actions.move({ origin: bottomImage }).press().pause(500).move({ x: 500, y: 900 }).release().pause(500).perform()
        await actions.clear()
        await actions.move({ origin: bottomImage }).move({ x: 500, y: 900 }).press().move({ x: 800, y: 850 }).release().pause(500).perform()
        await actions.clear()


        await actions.move({ origin: bottomImage }).press().pause(500).move({ x: 250, y: 700 }).release().pause(500).perform()
        await actions.clear()

        await actions.move({ origin: bottomImage }).press().pause(500).move({ x: 300, y: 700 }).release().pause(500).perform()
        await actions.clear()

        await actions.move({ origin: bottomImage }).press().pause(500).move({ x: 375, y: 700 }).release().pause(500).perform()
        await actions.clear()

        await actions.move({ origin: bottomImage }).press().pause(500).move({ x: 425, y: 700 }).release().pause(500).perform()
        await actions.clear()

        await actions.move({ origin: bottomImage }).press().pause(500).move({ x: 475, y: 700 }).release().pause(500).perform()
        await actions.clear()

        await actions.move({ origin: bottomImage }).press().pause(500).move({ x: 500, y: 650 }).release().pause(500).perform()
        await actions.clear()

        await actions.move({ origin: bottomImage }).press().pause(500).move({ x: 575, y: 650 }).release().pause(500).perform()
        await actions.clear()


        let topImage = driver.findElement(By.id('top'));
        actions = driver.actions({ async: true, bridge: true });

        // 1000 550
        // -> 725 525
        // -> 500 550
        // -> 1000 550
        await actions.move({ origin: topImage }).press().pause(500).move({ x: 1000, y: 550 }).release().pause(500).perform()
        await actions.clear()
        await actions.move({ origin: topImage }).move({ x: 1000, y: 550 }).press().move({ x: 725, y: 525 }).release().pause(500).perform()
        await actions.clear()
        await actions.move({ origin: topImage }).move({ x: 725, y: 525 }).press().move({ x: 500, y: 500 }).release().pause(500).perform()
        await actions.clear()
        await actions.move({ origin: topImage }).move({ x: 500, y: 500 }).press().move({ x: 1000, y: 550 }).release().pause(500).perform()
        await actions.clear()

        // 350 600
        // -> 900 600
        await actions.move({ origin: topImage }).press().pause(500).move({ x: 350, y: 600 }).release().pause(500).perform()
        await actions.clear()
        await actions.move({ origin: topImage }).move({ x: 350, y: 600 }).press().move({ x: 900, y: 600 }).release().pause(500).perform()
        await actions.clear()

        await actions.move({ origin: topImage }).press().pause(500).move({ x: 225, y: 550 }).release().pause(500).perform()
        await actions.clear()

        await actions.move({ origin: topImage }).press().pause(500).move({ x: 300, y: 550 }).release().pause(500).perform()
        await actions.clear()

        await actions.move({ origin: topImage }).press().pause(500).move({ x: 350, y: 550 }).release().pause(500).perform()
        await actions.clear()

        await actions.move({ origin: topImage }).press().pause(500).move({ x: 425, y: 550 }).release().pause(500).perform()
        await actions.clear()

        await actions.move({ origin: topImage }).press().pause(500).move({ x: 475, y: 500 }).release().pause(500).perform()
        await actions.clear()

        await actions.move({ origin: topImage }).press().pause(500).move({ x: 525, y: 500 }).release().pause(500).perform()
        await actions.clear()

        await actions.move({ origin: topImage }).press().pause(500).move({ x: 575, y: 500 }).release().pause(500).perform()
        await actions.clear()

        await screenshotCompare(await driver.takeScreenshot(), name + '/interaction');
    });
});