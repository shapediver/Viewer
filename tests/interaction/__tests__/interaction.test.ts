import webdriver, { By } from 'selenium-webdriver'
import { afterAll, beforeAll, describe, test } from '@jest/globals'

import { createDriver, screenshotCompare } from '../../general/src/setup'

require('chromedriver');
let actions: webdriver.Actions;
let driver: webdriver.WebDriver;
let name = 'interaction_tests';

describe('device testing', () => {
    beforeAll(async () => {
        driver = await createDriver();
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

        await actions.move({ origin: bottomImage }).press().pause(500).move({ x: 400, y: 250 }).release().pause(500).perform()
        await actions.clear()
        await actions.move({ origin: bottomImage }).press().pause(500).move({ x: 275, y: 275 }).release().pause(500).perform()
        await actions.clear()
        await actions.move({ origin: bottomImage }).press().pause(500).move({ x: 500, y: 275 }).release().pause(500).perform()
        await actions.clear()
    
        let topImage = driver.findElement(By.id('top'));
        actions = driver.actions({ async: true, bridge: true });

        await actions.move({ origin: topImage }).press().pause(500).move({ x: 400, y: 200 }).release().pause(500).perform()
        await actions.clear()
        await actions.move({ origin: topImage }).press().pause(500).move({ x: 275, y: 200 }).release().pause(500).perform()
        await actions.clear()
        await actions.move({ origin: topImage }).press().pause(500).move({ x: 525, y: 200 }).release().pause(500).perform()
        await actions.clear()

        await driver.executeAsyncScript(async (cb: any) => {
            //const api: typeof API = (<any>window).api; 
            await new Promise(resolve => setTimeout(resolve, 1000))
            cb();
        });

        await screenshotCompare(await driver.takeScreenshot(), name + '/interaction');
    });
});