import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import webdriver, { By, WebDriver } from "selenium-webdriver";
require('chromedriver');
import { api as API, PerspectiveCamera, PerspectiveCameraControls} from "@shapediver/viewer"
import { screenshotCompare } from "../../general/src/setup";
import { capabilities as allCapabilities, DesktopCapabilities, MobileCapabilities } from "../../general/src/capabilities";

for(let c = 0; c < allCapabilities.length; c++) {
    let name = 'doc_examples_test';
    const capabilities = Object.assign({ 'name': 'doc_examples_test', 'build': require('../../../api/api/package.json').version }, allCapabilities[c]);

    if(process.env.PORT !== 'browserstack') {
        name = 'doc_examples_test';
        c = allCapabilities.length;
    } else {
        name = 'doc_examples_test/' + ((allCapabilities[c] as DesktopCapabilities).os ? 
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

        let examples1 = ['sessions1', 'sessions2', 'simple', 'viewers1', 'viewers2', 'viewers3', 'attributes1', 'attributes2', 'attributes3', 'attributes4'];
        for(let i = 0; i < examples1.length; i++) {
            test(name + '_' + examples1[i], async () => {
                await driver.navigate().to('https://viewer.shapediver.com/v3/latest/doc/' + examples1[i] + '.html')
    
                // DO SOMETHING WITH THE API
                await driver.executeAsyncScript(async (cb: any) => {
                    const api: typeof API = (<any>window).SDV.api; 
                    await new Promise<void>((resolve) => {
                        api.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                    })
                    cb();
                });
                
                // TAKE A SCREENSHOT
                await screenshotCompare(await driver.takeScreenshot(), name + '/doc_examples_' + examples1[i] + '');
            });
        }

        let examples2 = ['interactions1', 'interactions2', 'interactions3'];
        for(let i = 0; i < examples2.length; i++) {
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
                let actions = driver.actions({async: true, bridge: true});
                await actions.move({origin: canvas}).perform()
                await actions.clear()
                // TAKE A SCREENSHOT
                await screenshotCompare(await driver.takeScreenshot(), name + '/doc_examples_' + examples2[i] + '_1');
                
                await actions.move({origin: canvas}).press().perform()
                await actions.clear()
                await screenshotCompare(await driver.takeScreenshot(), name + '/doc_examples_' + examples2[i] + '_2');

            });
        }

        
        let examples3 = ['interactions4', 'interactions5', 'interactions6', 'interactions7', 'interactions8', 'interactions9'];
        for(let i = 0; i < examples3.length; i++) {
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
                let actions = driver.actions({async: true, bridge: true});
                await actions.move({origin: canvas}).press().move({x: 500, y: 600}).release().perform()
                await actions.clear()
                // TAKE A SCREENSHOT
                await screenshotCompare(await driver.takeScreenshot(), name + '/doc_examples_' + examples3[i] + '');

            });
        }
    });
}
