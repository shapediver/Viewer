import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import webdriver, { WebDriver } from "selenium-webdriver";
require('chromedriver');
import { api as API} from "@shapediver/viewer"
import { screenshotCompare } from "../../general/src/setup";
import { capabilities as allCapabilities, DesktopCapabilities, MobileCapabilities } from "../../general/src/capabilities";

for(let c = 0; c < allCapabilities.length; c++) {
    const capabilities = Object.assign({ 'name': 'selenium_tests', 'build': require('../../../api/api/package.json').version }, allCapabilities[c]);
    let name = 'session_closing';

    if(process.env.PORT !== 'browserstack') {
        name = 'session_closing';
        c = allCapabilities.length;
    } else {
        name = 'session_closing ' + ((allCapabilities[c] as DesktopCapabilities).os ? 
        (<DesktopCapabilities>capabilities).os + ' ' + (<DesktopCapabilities>capabilities).os_version + ' ' + (<DesktopCapabilities>capabilities).browserName + ' ' + (<DesktopCapabilities>capabilities).browser_version : 
        (<MobileCapabilities>capabilities).device + ' ' + (<MobileCapabilities>capabilities).os_version);
    }

    let driver: WebDriver;
    describe('device testing', () => {
        beforeEach(async () => {

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
        
        test(name, async () => {
            await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api; 
                let viewer = api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
                let session = await api.createAndInitializeSession({ id: 'mySession', ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                cb();
            });
            await screenshotCompare(await driver.takeScreenshot(), name + '_1_1');

            await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api; 
                await api.closeSession('mySession');
                cb();
            });
            await screenshotCompare(await driver.takeScreenshot(), name + '_1_2');

            await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api; 
                let session1 = await api.createAndInitializeSession({ id: 'mySession1', ticket: 'affa36eb1031f3cd6175477dc4d76b785e2ca1c6a70c36adabc1d9547c11660a2957f4ba5e4f55a16225af626c2f25be90d944d355938fd35fc03daaaf9c56cbc85f0c6c7325aeb956145b3a030ad4aa217eefaf2d977b2815aefec5e87912ea1b731507ff24f9109cf74b0aa0eebcea9b9e7b3c807a-8b9959c9e647a0d633136750b78fbf61', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                cb();
            });
            await screenshotCompare(await driver.takeScreenshot(), name + '_1_3');
        });

        
        test(name, async () => {
            await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api; 
                let viewer = api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
                let session1 = await api.createAndInitializeSession({ id: 'mySession1', ticket: 'affa36eb1031f3cd6175477dc4d76b785e2ca1c6a70c36adabc1d9547c11660a2957f4ba5e4f55a16225af626c2f25be90d944d355938fd35fc03daaaf9c56cbc85f0c6c7325aeb956145b3a030ad4aa217eefaf2d977b2815aefec5e87912ea1b731507ff24f9109cf74b0aa0eebcea9b9e7b3c807a-8b9959c9e647a0d633136750b78fbf61', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                let session2 = await api.createAndInitializeSession({ id: 'mySession2', ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                cb();
            });
            await screenshotCompare(await driver.takeScreenshot(), name + '_2_1');

            await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api; 
                await api.closeSession('mySession1');
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                cb();
            });
            await screenshotCompare(await driver.takeScreenshot(), name + '_2_2');

            await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api; 
                await api.closeSession('mySession2');
                cb();
            });
            await screenshotCompare(await driver.takeScreenshot(), name + '_2_3');
        });

        
        
        test(name, async () => {
            await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api; 
                let viewer = api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
                let session = api.createSession({ id: 'mySession', ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                
                await session.init();
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                cb();
            });
            await screenshotCompare(await driver.takeScreenshot(), name + '_3_1');

            await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api; 
                await api.closeSession('mySession');
                cb();
            });
            await screenshotCompare(await driver.takeScreenshot(), name + '_3_2');

            await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api; 
                let session1 = api.createSession({ id: 'mySession1', ticket: 'affa36eb1031f3cd6175477dc4d76b785e2ca1c6a70c36adabc1d9547c11660a2957f4ba5e4f55a16225af626c2f25be90d944d355938fd35fc03daaaf9c56cbc85f0c6c7325aeb956145b3a030ad4aa217eefaf2d977b2815aefec5e87912ea1b731507ff24f9109cf74b0aa0eebcea9b9e7b3c807a-8b9959c9e647a0d633136750b78fbf61', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await session1.init();
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                cb();
            });
            await screenshotCompare(await driver.takeScreenshot(), name + '_3_3');
        });

        
        test(name, async () => {
            await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api; 
                let viewer = api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
                let session1 = api.createSession({ id: 'mySession1', ticket: 'affa36eb1031f3cd6175477dc4d76b785e2ca1c6a70c36adabc1d9547c11660a2957f4ba5e4f55a16225af626c2f25be90d944d355938fd35fc03daaaf9c56cbc85f0c6c7325aeb956145b3a030ad4aa217eefaf2d977b2815aefec5e87912ea1b731507ff24f9109cf74b0aa0eebcea9b9e7b3c807a-8b9959c9e647a0d633136750b78fbf61', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                let session2 = api.createSession({ id: 'mySession2', ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await session1.init();
                await session2.init();

                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                cb();
            });
            await screenshotCompare(await driver.takeScreenshot(), name + '_4_1');

            await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api; 
                await api.closeSession('mySession1');
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                cb();
            });
            await screenshotCompare(await driver.takeScreenshot(), name + '_4_2');

            await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api; 
                await api.closeSession('mySession2');
                cb();
            });
            await screenshotCompare(await driver.takeScreenshot(), name + '_4_3');
        });
    });
}
