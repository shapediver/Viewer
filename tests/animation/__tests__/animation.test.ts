import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import webdriver, { WebDriver } from "selenium-webdriver";
require('chromedriver');
import { AnimationData, api as API} from "@shapediver/viewer"
import { screenshotCompare } from "../../general/src/setup";
import { capabilities as allCapabilities, DesktopCapabilities, MobileCapabilities } from "../../general/src/capabilities";

for(let c = 0; c < allCapabilities.length; c++) {
    let name = 'animation_tests';
    const capabilities = Object.assign({ 'name': 'animation_tests', 'build': require('../../../api/api/package.json').version }, allCapabilities[c]);

    if(process.env.PORT !== 'browserstack') {
        name = 'animation_tests';
        c = allCapabilities.length;
    } else {
        name = 'animation_tests/' + ((allCapabilities[c] as DesktopCapabilities).os ? 
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
            await driver.navigate().to('https://viewer.shapediver.com/v3/latest/cdn/index.html')
            const TIMEOUT = 300000000
            await driver.manage().setTimeouts( { implicit: TIMEOUT, pageLoad: TIMEOUT, script: TIMEOUT } );
        });

        beforeEach(async () => {
            await driver.navigate().to('https://viewer.shapediver.com/v3/latest/cdn/index.html')
        });

        afterAll(async () => {
            await driver.close();
            await driver.quit();
        })
        
        test(name + '_translation', async () => {
            const r: any = await driver.executeAsyncScript(async (cb: any) => {
                const SDV = (<any>window).SDV; 
                let viewer = await SDV.api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
                let session = await SDV.api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await new Promise<void>((resolve) => {
                    SDV.api.addListener(SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                const tracks = [{
                    times: [0, 0.5],
                    node: session.node,
                    values: [0, 0, 0, 25, 0, 0],
                    path: 'translation',
                    interpolation: 'linear'
                }];
                const data = new SDV.AnimationData('myAnimation', tracks, 0, 0.5);
                data.reset = false;
                session.node.data.push(data);
                data.startAnimation();
                SDV.api.update();
                

                await new Promise(resolve => setTimeout(resolve, 600))
                cb()
            });
            await screenshotCompare(await driver.takeScreenshot(), name + '/translation');
        });

        
        test(name + '_rotation', async () => {
            const r: any = await driver.executeAsyncScript(async (cb: any) => {
                const SDV = (<any>window).SDV; 
                let viewer = await SDV.api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
                let session = await SDV.api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await new Promise<void>((resolve) => {
                    SDV.api.addListener(SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                const tracks = [{
                    times: [0, 0.5],
                    node: session.node,
                    values: [0, 0, 0, 1, 0, 0, 1, 0],
                    path: 'rotation',
                    interpolation: 'linear'
                }];
                const data = new SDV.AnimationData('myAnimation', tracks, 0, 0.5);
                data.reset = false;
                session.node.data.push(data);
                data.startAnimation();
                SDV.api.update();
                

                await new Promise(resolve => setTimeout(resolve, 600))
                cb()
            });
            await screenshotCompare(await driver.takeScreenshot(), name + '/rotation');
        });
        
        test(name + '_scale', async () => {
            const r: any = await driver.executeAsyncScript(async (cb: any) => {
                const SDV = (<any>window).SDV; 
                let viewer = await SDV.api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
                let session = await SDV.api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await new Promise<void>((resolve) => {
                    SDV.api.addListener(SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                const tracks = [{
                    times: [0, 0.5],
                    node: session.node,
                    values: [1,1,1, 2,2,2],
                    path: 'scale',
                    interpolation: 'linear'
                }];
                const data = new SDV.AnimationData('myAnimation', tracks, 0, 0.5);
                data.reset = false;
                session.node.data.push(data);
                data.startAnimation();
                SDV.api.update();
                

                await new Promise(resolve => setTimeout(resolve, 600))
                cb()
            });
            await screenshotCompare(await driver.takeScreenshot(), name + '/scale');
        });
        
    });
}
