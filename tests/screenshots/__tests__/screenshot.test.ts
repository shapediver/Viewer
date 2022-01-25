import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import webdriver, { WebDriver } from "selenium-webdriver";
require('chromedriver');
import { screenshotCompare } from "../../general/src/setup";
import { sddev2, sdtest, sdeuc1 } from "../../general/src/models";
import { createTokenFromSlug } from "../../general/src/utils";

let name = 'screenshot_tests';

let driver: WebDriver;
describe('device testing', () => {
    beforeAll(async () => {
        driver = await new webdriver.Builder().withCapabilities(webdriver.Capabilities.chrome()).build();
        await driver.navigate().to('https://viewer.shapediver.com/v3/latest/cdn/index.html')
        const TIMEOUT = 300000000
        await driver.manage().setTimeouts({ implicit: TIMEOUT, pageLoad: TIMEOUT, script: TIMEOUT });
    });

    beforeEach(async () => {
        await driver.navigate().to('https://viewer.shapediver.com/v3/latest/cdn/index.html')
    });

    afterAll(async () => {
        await driver.close();
        await driver.quit();
    })

    for(let modelDescription of [/*sddev2, sdtest, */sdeuc1]) {
        const backend = modelDescription.backend;

        for(let model in modelDescription.models) {
            const modelTicket = modelDescription.models[model].ticket;
            test(modelDescription.name + '_' + model, async () => {
                // DO SOMETHING WITH THE API
                await driver.executeAsyncScript(async (ticket: string, modelViewUrl: string, cb: any) => {
                    let viewer = await (<any>window).SDV.api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
                    let session = await (<any>window).SDV.api.createSession({ ticket, modelViewUrl });
        
                    await new Promise<void>((resolve) => {
                        (<any>window).SDV.api.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                    })
                    cb();
                }, modelTicket, backend);
                
                // TAKE A SCREENSHOT
                await screenshotCompare(await driver.takeScreenshot(), name + '/' + modelDescription.name + '/' + model);
            });        
        }
    }
});
