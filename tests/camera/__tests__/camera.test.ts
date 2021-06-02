import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import webdriver, { WebDriver } from "selenium-webdriver";
require('chromedriver');
import { api as API} from "@shapediver/viewer"
import { screenshotCompare } from "../../general/src/setup";
import { capabilities as allCapabilities, DesktopCapabilities, MobileCapabilities } from "../../general/src/capabilities";

for(let c = 0; c < allCapabilities.length; c++) {
    const capabilities = Object.assign({ 'name': 'selenium_tests', 'build': require('../../../api/api/package.json').version }, allCapabilities[c]);
    let name = 'camera_tests';

    if(process.env.PORT !== 'browserstack') {
        name = 'camera_tests';
        c = allCapabilities.length;
    } else {
        name = 'camera_tests ' + ((allCapabilities[c] as DesktopCapabilities).os ? 
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
        
        test(name + '_positioning', async () => {
            const r: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api; 
                let viewer = await api.createAndInitializeViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
                let session = await api.createAndInitializeSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                
                cb({
                    defaultPosition: viewer.getCamera()!.defaultPosition,
                    defaultTarget: viewer.getCamera()!.defaultTarget,
                    position: viewer.getCamera()!.position,
                    target: viewer.getCamera()!.target,
                });
            });
            expect(r.defaultPosition[0]).toBeCloseTo(r.position[0])
            expect(r.defaultPosition[1]).toBeCloseTo(r.position[1])
            expect(r.defaultPosition[2]).toBeCloseTo(r.position[2])
            expect(r.defaultTarget[0]).toBeCloseTo(r.target[0])
            expect(r.defaultTarget[1]).toBeCloseTo(r.target[1])
            expect(r.defaultTarget[2]).toBeCloseTo(r.target[2])
            await screenshotCompare(await driver.takeScreenshot(), name + '_positioning');
        });
        
        test(name + '_set', async () => {
            const r: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api; 
                let viewer = await api.createAndInitializeViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
                let session = await api.createAndInitializeSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                
                cb({
                    defaultPosition: viewer.getCamera()!.defaultPosition,
                    defaultTarget: viewer.getCamera()!.defaultTarget,
                    position: viewer.getCamera()!.position,
                    target: viewer.getCamera()!.target,
                });
            });
            expect(r.defaultPosition[0]).toBeCloseTo(r.position[0])
            expect(r.defaultPosition[1]).toBeCloseTo(r.position[1])
            expect(r.defaultPosition[2]).toBeCloseTo(r.position[2])
            expect(r.defaultTarget[0]).toBeCloseTo(r.target[0])
            expect(r.defaultTarget[1]).toBeCloseTo(r.target[1])
            expect(r.defaultTarget[2]).toBeCloseTo(r.target[2])
            await screenshotCompare(await driver.takeScreenshot(), name + '_set_1');

            const r2: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api; 
                let viewer = api.getViewer('myViewer');
                await viewer.getCamera()!.set([100, 100, 100], [-100, -100, -100], {});
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                cb({
                    position: viewer.getCamera()!.position,
                    target: viewer.getCamera()!.target,
                });
            });
            expect(r2.position[0]).toBeCloseTo(100)
            expect(r2.position[1]).toBeCloseTo(100)
            expect(r2.position[2]).toBeCloseTo(100)
            expect(r2.target[0]).toBeCloseTo(-100)
            expect(r2.target[1]).toBeCloseTo(-100)
            expect(r2.target[2]).toBeCloseTo(-100)
            await screenshotCompare(await driver.takeScreenshot(), name + '_set_2');
        });

        
        test(name + '_reset', async () => {
            const r: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api; 
                let viewer = await api.createAndInitializeViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
                let session = await api.createAndInitializeSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                
                cb({
                    defaultPosition: viewer.getCamera()!.defaultPosition,
                    defaultTarget: viewer.getCamera()!.defaultTarget,
                    position: viewer.getCamera()!.position,
                    target: viewer.getCamera()!.target,
                });
            });
            expect(r.defaultPosition[0]).toBeCloseTo(r.position[0])
            expect(r.defaultPosition[1]).toBeCloseTo(r.position[1])
            expect(r.defaultPosition[2]).toBeCloseTo(r.position[2])
            expect(r.defaultTarget[0]).toBeCloseTo(r.target[0])
            expect(r.defaultTarget[1]).toBeCloseTo(r.target[1])
            expect(r.defaultTarget[2]).toBeCloseTo(r.target[2])
            await screenshotCompare(await driver.takeScreenshot(), name + '_reset_1');

            const r2: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api; 
                let viewer = api.getViewer('myViewer');
                await viewer.getCamera()!.set([100, 100, 100], [-100, -100, -100], {});
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                cb({
                    position: viewer.getCamera()!.position,
                    target: viewer.getCamera()!.target,
                });
            });
            expect(r2.position[0]).toBeCloseTo(100)
            expect(r2.position[1]).toBeCloseTo(100)
            expect(r2.position[2]).toBeCloseTo(100)
            expect(r2.target[0]).toBeCloseTo(-100)
            expect(r2.target[1]).toBeCloseTo(-100)
            expect(r2.target[2]).toBeCloseTo(-100)
            await screenshotCompare(await driver.takeScreenshot(), name + '_reset_2');

            const r3: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api; 
                let viewer = api.getViewer('myViewer');
                await viewer.getCamera()!.reset({});
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                cb({
                    position: viewer.getCamera()!.position,
                    target: viewer.getCamera()!.target,
                });
            });
            expect(r.defaultPosition[0]).toBeCloseTo(r3.position[0])
            expect(r.defaultPosition[1]).toBeCloseTo(r3.position[1])
            expect(r.defaultPosition[2]).toBeCloseTo(r3.position[2])
            expect(r.defaultTarget[0]).toBeCloseTo(r3.target[0])
            expect(r.defaultTarget[1]).toBeCloseTo(r3.target[1])
            expect(r.defaultTarget[2]).toBeCloseTo(r3.target[2])
            await screenshotCompare(await driver.takeScreenshot(), name + '_reset_3');
        });

        
        test(name + '_zoomTo', async () => {
            const r: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api; 
                let viewer = await api.createAndInitializeViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
                let session = await api.createAndInitializeSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                
                cb({
                    defaultPosition: viewer.getCamera()!.defaultPosition,
                    defaultTarget: viewer.getCamera()!.defaultTarget,
                    position: viewer.getCamera()!.position,
                    target: viewer.getCamera()!.target,
                });
            });
            expect(r.defaultPosition[0]).toBeCloseTo(r.position[0])
            expect(r.defaultPosition[1]).toBeCloseTo(r.position[1])
            expect(r.defaultPosition[2]).toBeCloseTo(r.position[2])
            expect(r.defaultTarget[0]).toBeCloseTo(r.target[0])
            expect(r.defaultTarget[1]).toBeCloseTo(r.target[1])
            expect(r.defaultTarget[2]).toBeCloseTo(r.target[2])
            await screenshotCompare(await driver.takeScreenshot(), name + '_zoom_1');

            const r2: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api; 
                let viewer = api.getViewer('myViewer');
                await viewer.getCamera()!.set([100, 0, 0], [-100, 0, 0], {});
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                cb({
                    position: viewer.getCamera()!.position,
                    target: viewer.getCamera()!.target,
                });
            });
            expect(r2.position[0]).toBeCloseTo(100)
            expect(r2.position[1]).toBeCloseTo(0)
            expect(r2.position[2]).toBeCloseTo(0)
            expect(r2.target[0]).toBeCloseTo(-100)
            expect(r2.target[1]).toBeCloseTo(0)
            expect(r2.target[2]).toBeCloseTo(0)
            await screenshotCompare(await driver.takeScreenshot(), name + '_zoom_2');

            const r3: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api; 
                let viewer = api.getViewer('myViewer');
                await viewer.getCamera()!.zoomTo();
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                cb({
                    position: viewer.getCamera()!.position,
                    target: viewer.getCamera()!.target,
                });
            });
            await screenshotCompare(await driver.takeScreenshot(), name + '_zoom_3');
        });



        test(name + '_ortho_switch', async () => {
            const r: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api; 
                let viewer = await api.createAndInitializeViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
                let session = await api.createAndInitializeSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })

                const camera = viewer.createOrthographicCamera('myOrthographicCamera');
                viewer.assignCamera(camera.id)
                viewer.update();

                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })

                cb({
                    defaultPosition: viewer.getCamera()!.defaultPosition,
                    defaultTarget: viewer.getCamera()!.defaultTarget,
                    position: viewer.getCamera()!.position,
                    target: viewer.getCamera()!.target,
                });
            });
            expect(r.defaultPosition[0]).toBeCloseTo(r.position[0])
            expect(r.defaultPosition[1]).toBeCloseTo(r.position[1])
            expect(r.defaultPosition[2]).toBeCloseTo(r.position[2])
            expect(r.defaultTarget[0]).toBeCloseTo(r.target[0])
            expect(r.defaultTarget[1]).toBeCloseTo(r.target[1])
            expect(r.defaultTarget[2]).toBeCloseTo(r.target[2])
            await screenshotCompare(await driver.takeScreenshot(), name + '_ortho_positioning');
        });
        
        test(name + '_ortho_set', async () => {
            const r: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api; 
                let viewer = await api.createAndInitializeViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
                let session = await api.createAndInitializeSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                const camera = viewer.createOrthographicCamera('myOrthographicCamera');
                viewer.assignCamera(camera.id)
                viewer.update();

                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })

                cb({
                    defaultPosition: viewer.getCamera()!.defaultPosition,
                    defaultTarget: viewer.getCamera()!.defaultTarget,
                    position: viewer.getCamera()!.position,
                    target: viewer.getCamera()!.target,
                });
            });
            expect(r.defaultPosition[0]).toBeCloseTo(r.position[0])
            expect(r.defaultPosition[1]).toBeCloseTo(r.position[1])
            expect(r.defaultPosition[2]).toBeCloseTo(r.position[2])
            expect(r.defaultTarget[0]).toBeCloseTo(r.target[0])
            expect(r.defaultTarget[1]).toBeCloseTo(r.target[1])
            expect(r.defaultTarget[2]).toBeCloseTo(r.target[2])
            await screenshotCompare(await driver.takeScreenshot(), name + '_ortho_positioning');

            const r2: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api; 
                let viewer = api.getViewer('myViewer');
                await viewer.getCamera()!.set([100, 100, 100], [-100, -100, -100], {});
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                cb({
                    position: viewer.getCamera()!.position,
                    target: viewer.getCamera()!.target,
                });
            });
            expect(r2.position[0]).toBeCloseTo(100)
            expect(r2.position[1]).toBeCloseTo(100)
            expect(r2.position[2]).toBeCloseTo(100)
            expect(r2.target[0]).toBeCloseTo(-100)
            expect(r2.target[1]).toBeCloseTo(-100)
            expect(r2.target[2]).toBeCloseTo(-100)
            await screenshotCompare(await driver.takeScreenshot(), name + '_ortho_set');
        });

        
        test(name + '_ortho_reset', async () => {
            const r: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api; 
                let viewer = await api.createAndInitializeViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
                let session = await api.createAndInitializeSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                
                const camera = viewer.createOrthographicCamera('myOrthographicCamera');
                viewer.assignCamera(camera.id)
                viewer.update();

                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })

                
                cb({
                    defaultPosition: viewer.getCamera()!.defaultPosition,
                    defaultTarget: viewer.getCamera()!.defaultTarget,
                    position: viewer.getCamera()!.position,
                    target: viewer.getCamera()!.target,
                });
            });
            expect(r.defaultPosition[0]).toBeCloseTo(r.position[0])
            expect(r.defaultPosition[1]).toBeCloseTo(r.position[1])
            expect(r.defaultPosition[2]).toBeCloseTo(r.position[2])
            expect(r.defaultTarget[0]).toBeCloseTo(r.target[0])
            expect(r.defaultTarget[1]).toBeCloseTo(r.target[1])
            expect(r.defaultTarget[2]).toBeCloseTo(r.target[2])
            await screenshotCompare(await driver.takeScreenshot(), name + '_ortho_positioning');

            const r2: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api; 
                let viewer = api.getViewer('myViewer');
                await viewer.getCamera()!.set([100, 100, 100], [-100, -100, -100], {});
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                cb({
                    position: viewer.getCamera()!.position,
                    target: viewer.getCamera()!.target,
                });
            });
            expect(r2.position[0]).toBeCloseTo(100)
            expect(r2.position[1]).toBeCloseTo(100)
            expect(r2.position[2]).toBeCloseTo(100)
            expect(r2.target[0]).toBeCloseTo(-100)
            expect(r2.target[1]).toBeCloseTo(-100)
            expect(r2.target[2]).toBeCloseTo(-100)
            await screenshotCompare(await driver.takeScreenshot(), name + '_ortho_set');

            const r3: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api; 
                let viewer = api.getViewer('myViewer');
                await viewer.getCamera()!.reset({});
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                cb({
                    position: viewer.getCamera()!.position,
                    target: viewer.getCamera()!.target,
                });
            });
            expect(r.defaultPosition[0]).toBeCloseTo(r.position[0])
            expect(r.defaultPosition[1]).toBeCloseTo(r.position[1])
            expect(r.defaultPosition[2]).toBeCloseTo(r.position[2])
            expect(r.defaultTarget[0]).toBeCloseTo(r.target[0])
            expect(r.defaultTarget[1]).toBeCloseTo(r.target[1])
            expect(r.defaultTarget[2]).toBeCloseTo(r.target[2])
            await screenshotCompare(await driver.takeScreenshot(), name + '_ortho_positioning');
        });

        
        test(name + '_ortho_zoomTo', async () => {
            const r: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api; 
                let viewer = await api.createAndInitializeViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
                let session = await api.createAndInitializeSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                
                const camera = viewer.createOrthographicCamera('myOrthographicCamera');
                viewer.assignCamera(camera.id)
                viewer.update();

                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })

                
                cb({
                    defaultPosition: viewer.getCamera()!.defaultPosition,
                    defaultTarget: viewer.getCamera()!.defaultTarget,
                    position: viewer.getCamera()!.position,
                    target: viewer.getCamera()!.target,
                });
            });
            expect(r.defaultPosition[0]).toBeCloseTo(r.position[0])
            expect(r.defaultPosition[1]).toBeCloseTo(r.position[1])
            expect(r.defaultPosition[2]).toBeCloseTo(r.position[2])
            expect(r.defaultTarget[0]).toBeCloseTo(r.target[0])
            expect(r.defaultTarget[1]).toBeCloseTo(r.target[1])
            expect(r.defaultTarget[2]).toBeCloseTo(r.target[2])
            await screenshotCompare(await driver.takeScreenshot(), name + '_ortho_positioning');

            const r2: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api; 
                let viewer = api.getViewer('myViewer');
                await viewer.getCamera()!.set([100, 0, 0], [-100, 0, 0], {});
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                cb({
                    position: viewer.getCamera()!.position,
                    target: viewer.getCamera()!.target,
                });
            });
            expect(r2.position[0]).toBeCloseTo(100)
            expect(r2.position[1]).toBeCloseTo(0)
            expect(r2.position[2]).toBeCloseTo(0)
            expect(r2.target[0]).toBeCloseTo(-100)
            expect(r2.target[1]).toBeCloseTo(0)
            expect(r2.target[2]).toBeCloseTo(0)
            await screenshotCompare(await driver.takeScreenshot(), name + '_ortho_zoom');

            const r3: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api; 
                let viewer = api.getViewer('myViewer');
                await viewer.getCamera()!.zoomTo();
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                cb({
                    position: viewer.getCamera()!.position,
                    target: viewer.getCamera()!.target,
                });
            });
            await screenshotCompare(await driver.takeScreenshot(), name + '_ortho_positioning');
        });
    });
}
