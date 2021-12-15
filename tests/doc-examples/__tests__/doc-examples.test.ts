import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import webdriver, { By, WebDriver } from "selenium-webdriver";
require('chromedriver');
import { api as API, PerspectiveCamera, PerspectiveCameraControls } from "@shapediver/viewer"
import { screenshotCompare } from "../../general/src/setup";

let name = 'doc_examples_test';

let driver: WebDriver;
describe('device testing', () => {
    beforeAll(async () => {
        driver = await new webdriver.Builder().withCapabilities(webdriver.Capabilities.chrome()).build();
    });

    afterAll(async () => {
        await driver.close();
        await driver.quit();
    })

    let examples1 = ['sessions1', 'sessions2', 'simple', 'viewers1', 'viewers2', 'viewers3'];
    for (let i = 0; i < examples1.length; i++) {
        test(name + '_' + examples1[i], async () => {
            await driver.navigate().to('https://viewer.shapediver.com/v3/latest/doc/' + examples1[i] + '.html')

            // DO SOMETHING WITH THE API
            await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).SDV.api;
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await new Promise(resolve => setTimeout(resolve, 1000));
                cb();
            });

            // TAKE A SCREENSHOT
            await screenshotCompare(await driver.takeScreenshot(), name + '/doc_examples_' + examples1[i] + '');
        });
    }

    let examples2 = ['interactions1', 'interactions2', 'interactions3'];
    for (let i = 0; i < examples2.length; i++) {
        test(name + '_' + examples2[i], async () => {
            await driver.navigate().to('https://viewer.shapediver.com/v3/latest/doc/' + examples2[i] + '.html')

            // DO SOMETHING WITH THE API
            await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).SDV.api;
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                cb();
            });

            let canvas = driver.findElement(By.id('canvas'));
            let actions = driver.actions({ async: true, bridge: true });
            await actions.move({ origin: canvas }).perform()
            await actions.clear()
            // TAKE A SCREENSHOT
            await screenshotCompare(await driver.takeScreenshot(), name + '/doc_examples_' + examples2[i] + '_1');

            await actions.move({ origin: canvas }).press().perform()
            await actions.clear()
            await screenshotCompare(await driver.takeScreenshot(), name + '/doc_examples_' + examples2[i] + '_2');

        });
    }


    let examples3 = ['interactions4', 'interactions5', 'interactions6', 'interactions7', 'interactions8', 'interactions9'];
    for (let i = 0; i < examples3.length; i++) {
        test(name + '_' + examples3[i], async () => {
            await driver.navigate().to('https://viewer.shapediver.com/v3/latest/doc/' + examples3[i] + '.html')

            // DO SOMETHING WITH THE API
            await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).SDV.api;
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                cb();
            });

            let canvas = driver.findElement(By.id('canvas'));
            let actions = driver.actions({ async: true, bridge: true });
            await actions.move({ origin: canvas }).press().move({ x: 500, y: 600 }).release().perform()
            await actions.clear()
            // TAKE A SCREENSHOT
            await screenshotCompare(await driver.takeScreenshot(), name + '/doc_examples_' + examples3[i] + '');

        });
    }
});