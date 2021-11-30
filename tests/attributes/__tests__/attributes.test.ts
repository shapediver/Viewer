import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import webdriver, { WebDriver } from "selenium-webdriver";
require('chromedriver');
import { api as API} from "@shapediver/viewer"
import { screenshotCompare } from "../../general/src/setup";
import { capabilities as allCapabilities, DesktopCapabilities, MobileCapabilities } from "../../general/src/capabilities";

for(let c = 0; c < allCapabilities.length; c++) {
    let name = 'attribute_tests';
    const capabilities = Object.assign({ 'name': 'attribute_tests', 'build': require('../../../api/api/package.json').version }, allCapabilities[c]);

    if(process.env.PORT !== 'browserstack') {
        name = 'attribute_tests';
        c = allCapabilities.length;
    } else {
        name = 'attribute_tests/' + ((allCapabilities[c] as DesktopCapabilities).os ? 
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
            await driver.navigate().to('https://viewer.shapediver.com/v3/latest/attribute-visualization/index.html')
            const TIMEOUT = 300000000
            await driver.manage().setTimeouts( { implicit: TIMEOUT, pageLoad: TIMEOUT, script: TIMEOUT } );
        });

        beforeEach(async () => {
            await driver.navigate().to('https://viewer.shapediver.com/v3/latest/attribute-visualization/index.html')
        });

        afterAll(async () => {
            await driver.close();
            await driver.quit();
        })
        
        test(name + '_none', async () => {
            const r: any = await driver.executeAsyncScript(async (cb: any) => {
                const SDV = (<any>window).SDV; 
                await new Promise<void>((resolve) => {
                    SDV.api.addListener(SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                cb();
            });
            await screenshotCompare(await driver.takeScreenshot(), name + '/none');
        });

        test(name + '_layer_enable', async () => {
            const r: any = await driver.executeAsyncScript(async (cb: any) => {
                const SDV = (<any>window).SDV; 
                await new Promise<void>((resolve) => {
                    SDV.api.addListener(SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                const attributeVisualizationEngine = (<any>window).attributeVisualizationEngine; 
                attributeVisualizationEngine.layers['pinky'].enabled = false;
                attributeVisualizationEngine.updateLayers(attributeVisualizationEngine.layers);


                await new Promise<void>((resolve) => {
                    SDV.api.addListener(SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                cb();
            });
            await screenshotCompare(await driver.takeScreenshot(), name + '/layer_enable');
        });

        test(name + '_layer_opacity', async () => {
            const r: any = await driver.executeAsyncScript(async (cb: any) => {
                const SDV = (<any>window).SDV; 
                await new Promise<void>((resolve) => {
                    SDV.api.addListener(SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                const attributeVisualizationEngine = (<any>window).attributeVisualizationEngine; 
                attributeVisualizationEngine.layers['pinky'].opacity = 0;
                attributeVisualizationEngine.updateLayers(attributeVisualizationEngine.layers);

                await new Promise<void>((resolve) => {
                    SDV.api.addListener(SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                cb();
            });
            await screenshotCompare(await driver.takeScreenshot(), name + '/layer_opacity');
        });

        test(name + '_string_attribute', async () => {
            const r: any = await driver.executeAsyncScript(async (cb: any) => {
                const SDV = (<any>window).SDV; 
                await new Promise<void>((resolve) => {
                    SDV.api.addListener(SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                const attributeVisualizationEngine = (<any>window).attributeVisualizationEngine; 
                attributeVisualizationEngine.updateAttributes([
                    {
                        key: 'x+y, string',
                        type: SDV.PRIMITIVETYPEHINT.STRING,
                        visualization: SDV.ATTRIBUTEVISUALIZATION.GREEN_WHITE_RED
                    }
                ])

                await new Promise<void>((resolve) => {
                    SDV.api.addListener(SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                cb();
            });
            await screenshotCompare(await driver.takeScreenshot(), name + '/string_attribute');
        });

        test(name + '_number_attribute', async () => {
            const r: any = await driver.executeAsyncScript(async (cb: any) => {
                const SDV = (<any>window).SDV; 
                await new Promise<void>((resolve) => {
                    SDV.api.addListener(SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                const attributeVisualizationEngine = (<any>window).attributeVisualizationEngine; 
                attributeVisualizationEngine.updateAttributes([
                    {
                        key: 'x+y, number',
                        type: SDV.PRIMITIVETYPEHINT.DOUBLE,
                        visualization: SDV.ATTRIBUTEVISUALIZATION.GREEN_WHITE_RED
                    }
                ])

                await new Promise<void>((resolve) => {
                    SDV.api.addListener(SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                cb();
            });
            await screenshotCompare(await driver.takeScreenshot(), name + '/number_attribute');
        });
        
        
    });
}
