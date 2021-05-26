import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import webdriver, { WebDriver } from "selenium-webdriver";
require('chromedriver');
import { api as API} from "@shapediver/viewer"
import { screenshotCompare } from "../../general/src/setup";
import { capabilities as allCapabilities, DesktopCapabilities, MobileCapabilities } from "../../general/src/capabilities";
import { SettingsEngine } from "../../../rendering-engine/camera-engine/node_modules/@shapediver/viewer.shared.services/dist";
import { build_data } from "@shapediver/viewer/src/build_data";

for(let c = 0; c < allCapabilities.length; c++) {
    const capabilities = Object.assign({ 'name': 'selenium_tests', 'build': require('../../../api/api/package.json').version }, allCapabilities[c]);
    let name = 'settings_viewer';

    if(process.env.PORT !== 'browserstack') {
        name = 'settings_viewer';
        c = allCapabilities.length;
    } else {
        name = 'settings_viewer ' + ((allCapabilities[c] as DesktopCapabilities).os ? 
        (<DesktopCapabilities>capabilities).os + ' ' + (<DesktopCapabilities>capabilities).os_version + ' ' + (<DesktopCapabilities>capabilities).browserName + ' ' + (<DesktopCapabilities>capabilities).browser_version : 
        (<MobileCapabilities>capabilities).device + ' ' + (<MobileCapabilities>capabilities).os_version);
    }

    let driver: WebDriver;
    describe('device testing', () => {
        beforeEach(async () => {
            console.log(name)

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

        it(name + '_blur', async () => {
            // 'viewer.blurSceneWhenBusy': true,
            // https://shapediver.atlassian.net/browse/SS-2994
        });
        
        it(name + '_commitParameters', async () => {
            // 'viewer.commitParameters': false,
            // TODO
        });

        it(name + '_commitSettings', async () => {
            // 'viewer.commitSettings': false,
            // TODO
        });

        it(name + '_gridVisibility', async () => {
            // check starting default
            const settings1: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
                let session = await api.createAndInitializeSession({  id: 'mySession', ticket: 'd7275c4a686c2df9ba75ca6c7e05dc674ae60912c1aa75e478f273dab718cd20b2a269073e03b5810daaf461c82ad990b176d3071776ec0f80fa034bb1e2bc6ee6c99fc82764ad55157bcba7dd1856b18eb0390e2b83c201be16e51de33c356fc6ad73cb3100eeecd3fc48ea5405e7f1c2272088d7-ff5d231fc13c2098c7ed85e51331760e', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });
            expect(settings1['viewer.scene.gridVisibility']).toBe(true);
            await screenshotCompare(await driver.takeScreenshot(), name + '_gridVisibility');

            // change and save
            const settings2: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.getViewer('myViewer');
                let session = api.getSession('mySession');
                viewer.gridVisibility = false;
                viewer.update();
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });            
            expect(settings2['viewer.scene.gridVisibility']).toBe(false);
            await screenshotCompare(await driver.takeScreenshot(), name + '_gridVisibility_switch');

            // reset and save
            const settings3: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.getViewer('myViewer');
                let session = api.getSession('mySession');
                viewer.gridVisibility = true;
                viewer.update();
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });              
            expect(settings3['viewer.scene.gridVisibility']).toBe(true);
            await screenshotCompare(await driver.takeScreenshot(), name + '_gridVisibility');
        });

        
        it(name + '_groundPlaneVisibility', async () => {
            // check starting default
            const settings1: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
                let session = await api.createAndInitializeSession({  id: 'mySession', ticket: 'd7275c4a686c2df9ba75ca6c7e05dc674ae60912c1aa75e478f273dab718cd20b2a269073e03b5810daaf461c82ad990b176d3071776ec0f80fa034bb1e2bc6ee6c99fc82764ad55157bcba7dd1856b18eb0390e2b83c201be16e51de33c356fc6ad73cb3100eeecd3fc48ea5405e7f1c2272088d7-ff5d231fc13c2098c7ed85e51331760e', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });
            expect(settings1['viewer.scene.groundPlaneVisibility']).toBe(true);
            await screenshotCompare(await driver.takeScreenshot(), name + '_groundPlaneVisibility');

            // change and save
            const settings2: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.getViewer('myViewer');
                let session = api.getSession('mySession');
                viewer.groundPlaneVisibility = false;
                viewer.update();
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });            
            expect(settings2['viewer.scene.groundPlaneVisibility']).toBe(false);
            await screenshotCompare(await driver.takeScreenshot(), name + '_groundPlaneVisibility_switch');

            // reset and save
            const settings3: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.getViewer('myViewer');
                let session = api.getSession('mySession');
                viewer.groundPlaneVisibility = true;
                viewer.update();
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });              
            expect(settings3['viewer.scene.groundPlaneVisibility']).toBe(true);
            await screenshotCompare(await driver.takeScreenshot(), name + '_groundPlaneVisibility');
        });

        
        
        it(name + '_environmentMap', async () => {
            // check starting default
            const settings1: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
                let session = await api.createAndInitializeSession({  id: 'mySession', ticket: 'd7275c4a686c2df9ba75ca6c7e05dc674ae60912c1aa75e478f273dab718cd20b2a269073e03b5810daaf461c82ad990b176d3071776ec0f80fa034bb1e2bc6ee6c99fc82764ad55157bcba7dd1856b18eb0390e2b83c201be16e51de33c356fc6ad73cb3100eeecd3fc48ea5405e7f1c2272088d7-ff5d231fc13c2098c7ed85e51331760e', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });
            expect(settings1['viewer.scene.material.environmentMap']).toBe('none');
            await screenshotCompare(await driver.takeScreenshot(), name + '_environmentMap');

            // change and save
            const settings2: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.getViewer('myViewer');
                let session = api.getSession('mySession');
                viewer.environmentMap = 'georgentor';
                viewer.update();
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });            
            expect(settings2['viewer.scene.material.environmentMap']).toBe('georgentor');
            await screenshotCompare(await driver.takeScreenshot(), name + '_environmentMap_switch');

            // reset and save
            const settings3: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.getViewer('myViewer');
                let session = api.getSession('mySession');
                viewer.environmentMap = 'none';
                viewer.update();
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });              
            expect(settings3['viewer.scene.material.environmentMap']).toBe('none');
            await screenshotCompare(await driver.takeScreenshot(), name + '_environmentMap');
        });

                
        it(name + '_environmentMapAsBackground', async () => {
            // check starting default
            const settings1: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
                let session = await api.createAndInitializeSession({  id: 'mySession', ticket: 'd7275c4a686c2df9ba75ca6c7e05dc674ae60912c1aa75e478f273dab718cd20b2a269073e03b5810daaf461c82ad990b176d3071776ec0f80fa034bb1e2bc6ee6c99fc82764ad55157bcba7dd1856b18eb0390e2b83c201be16e51de33c356fc6ad73cb3100eeecd3fc48ea5405e7f1c2272088d7-ff5d231fc13c2098c7ed85e51331760e', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });
            expect(settings1['viewer.scene.material.environmentMapAsBackground']).toBe(false);
            await screenshotCompare(await driver.takeScreenshot(), name + '_environmentMapAsBackground');

            // change and save
            const settings2: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.getViewer('myViewer');
                let session = api.getSession('mySession');
                viewer.environmentMap = 'georgentor';
                viewer.environmentMapAsBackground = true;
                viewer.update();
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });            
            expect(settings2['viewer.scene.material.environmentMapAsBackground']).toBe(true);
            await screenshotCompare(await driver.takeScreenshot(), name + '_environmentMapAsBackground_switch');

            // reset and save
            const settings3: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.getViewer('myViewer');
                let session = api.getSession('mySession');
                viewer.environmentMap = 'none';
                viewer.environmentMapAsBackground = false;
                viewer.update();
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });              
            expect(settings3['viewer.scene.material.environmentMapAsBackground']).toBe(false);
            await screenshotCompare(await driver.takeScreenshot(), name + '_environmentMapAsBackground');
        });

                
        it(name + '_environmentMapResolution', async () => {
            // check starting default
            const settings1: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
                let session = await api.createAndInitializeSession({  id: 'mySession', ticket: 'd7275c4a686c2df9ba75ca6c7e05dc674ae60912c1aa75e478f273dab718cd20b2a269073e03b5810daaf461c82ad990b176d3071776ec0f80fa034bb1e2bc6ee6c99fc82764ad55157bcba7dd1856b18eb0390e2b83c201be16e51de33c356fc6ad73cb3100eeecd3fc48ea5405e7f1c2272088d7-ff5d231fc13c2098c7ed85e51331760e', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });
            expect(settings1['viewer.scene.material.environmentMapResolution']).toBe('1024');

            // change and save
            const settings2: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.getViewer('myViewer');
                let session = api.getSession('mySession');
                viewer.environmentMapResolution = '512';
                await session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });            
            expect(settings2['viewer.scene.material.environmentMapResolution']).toBe('512');

            // reset and save
            const settings3: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.getViewer('myViewer');
                let session = api.getSession('mySession');
                viewer.environmentMapResolution = '1024';
                await session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });              
            expect(settings3['viewer.scene.material.environmentMapResolution']).toBe('1024');
        });
  
        it(name + '_ambientOcclusion', async () => {
            // check starting default
            const settings1: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
                let session = await api.createAndInitializeSession({  id: 'mySession', ticket: 'd7275c4a686c2df9ba75ca6c7e05dc674ae60912c1aa75e478f273dab718cd20b2a269073e03b5810daaf461c82ad990b176d3071776ec0f80fa034bb1e2bc6ee6c99fc82764ad55157bcba7dd1856b18eb0390e2b83c201be16e51de33c356fc6ad73cb3100eeecd3fc48ea5405e7f1c2272088d7-ff5d231fc13c2098c7ed85e51331760e', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });
            expect(settings1['viewer.scene.render.ambientOcclusion']).toBe(true);
            await screenshotCompare(await driver.takeScreenshot(), name + '_ambientOcclusion');

            // change and save
            const settings2: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.getViewer('myViewer');
                let session = api.getSession('mySession');
                viewer.ambientOcclusion = false;
                viewer.update();
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });            
            expect(settings2['viewer.scene.render.ambientOcclusion']).toBe(false);
            await screenshotCompare(await driver.takeScreenshot(), name + '_ambientOcclusion_switch');

            // reset and save
            const settings3: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.getViewer('myViewer');
                let session = api.getSession('mySession');
                viewer.ambientOcclusion = true;
                viewer.update();
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });              
            expect(settings3['viewer.scene.render.ambientOcclusion']).toBe(true);
            await screenshotCompare(await driver.takeScreenshot(), name + '_ambientOcclusion');
        });

                
        it(name + '_beautyRenderBlendingDuration', async () => {
            // check starting default
            const settings1: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
                let session = await api.createAndInitializeSession({  id: 'mySession', ticket: 'd7275c4a686c2df9ba75ca6c7e05dc674ae60912c1aa75e478f273dab718cd20b2a269073e03b5810daaf461c82ad990b176d3071776ec0f80fa034bb1e2bc6ee6c99fc82764ad55157bcba7dd1856b18eb0390e2b83c201be16e51de33c356fc6ad73cb3100eeecd3fc48ea5405e7f1c2272088d7-ff5d231fc13c2098c7ed85e51331760e', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });
            expect(settings1['viewer.scene.render.beautyRenderBlendingDuration']).toBe(1500);

            // change and save
            const settings2: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.getViewer('myViewer');
                let session = api.getSession('mySession');
                viewer.beautyRenderBlendingDuration = 500;
                await session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });            
            expect(settings2['viewer.scene.render.beautyRenderBlendingDuration']).toBe(500);

            // reset and save
            const settings3: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.getViewer('myViewer');
                let session = api.getSession('mySession');
                viewer.beautyRenderBlendingDuration = 1500;
                await session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });              
            expect(settings3['viewer.scene.render.beautyRenderBlendingDuration']).toBe(1500);
        });

        it(name + '_beautyRenderDelay', async () => {
            // check starting default
            const settings1: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
                let session = await api.createAndInitializeSession({  id: 'mySession', ticket: 'd7275c4a686c2df9ba75ca6c7e05dc674ae60912c1aa75e478f273dab718cd20b2a269073e03b5810daaf461c82ad990b176d3071776ec0f80fa034bb1e2bc6ee6c99fc82764ad55157bcba7dd1856b18eb0390e2b83c201be16e51de33c356fc6ad73cb3100eeecd3fc48ea5405e7f1c2272088d7-ff5d231fc13c2098c7ed85e51331760e', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });
            expect(settings1['viewer.scene.render.beautyRenderDelay']).toBe(50);

            // change and save
            const settings2: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.getViewer('myViewer');
                let session = api.getSession('mySession');
                viewer.beautyRenderDelay = 500;
                await session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });            
            expect(settings2['viewer.scene.render.beautyRenderDelay']).toBe(500);

            // reset and save
            const settings3: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.getViewer('myViewer');
                let session = api.getSession('mySession');
                viewer.beautyRenderDelay = 50;
                await session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });              
            expect(settings3['viewer.scene.render.beautyRenderDelay']).toBe(50);
        });

        it(name + '_clearAlpha', async () => {
            // check starting default
            const settings1: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                document.getElementById('canvas')!.parentElement!.style.background = 'red';
                let viewer = api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
                let session = await api.createAndInitializeSession({  id: 'mySession', ticket: 'd7275c4a686c2df9ba75ca6c7e05dc674ae60912c1aa75e478f273dab718cd20b2a269073e03b5810daaf461c82ad990b176d3071776ec0f80fa034bb1e2bc6ee6c99fc82764ad55157bcba7dd1856b18eb0390e2b83c201be16e51de33c356fc6ad73cb3100eeecd3fc48ea5405e7f1c2272088d7-ff5d231fc13c2098c7ed85e51331760e', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });
            expect(settings1['viewer.scene.render.clearAlpha']).toBe(1);
            await screenshotCompare(await driver.takeScreenshot(), name + '_clearAlpha');

            // change and save
            const settings2: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.getViewer('myViewer');
                let session = api.getSession('mySession');
                viewer.clearAlpha = 0;
                viewer.update();
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });            
            expect(settings2['viewer.scene.render.clearAlpha']).toBe(0);
            await screenshotCompare(await driver.takeScreenshot(), name + '_clearAlpha_switch');

            // reset and save
            const settings3: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.getViewer('myViewer');
                let session = api.getSession('mySession');
                viewer.clearAlpha = 1;
                viewer.update();
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });              
            expect(settings3['viewer.scene.render.clearAlpha']).toBe(1);
            await screenshotCompare(await driver.takeScreenshot(), name + '_clearAlpha');
        });
        
        it(name + '_clearColor', async () => {
            // check starting default
            const settings1: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
                let session = await api.createAndInitializeSession({  id: 'mySession', ticket: 'd7275c4a686c2df9ba75ca6c7e05dc674ae60912c1aa75e478f273dab718cd20b2a269073e03b5810daaf461c82ad990b176d3071776ec0f80fa034bb1e2bc6ee6c99fc82764ad55157bcba7dd1856b18eb0390e2b83c201be16e51de33c356fc6ad73cb3100eeecd3fc48ea5405e7f1c2272088d7-ff5d231fc13c2098c7ed85e51331760e', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });
            expect(settings1['viewer.scene.render.clearColor']).toBe('#ffffff');
            await screenshotCompare(await driver.takeScreenshot(), name + '_clearColor');

            // change and save
            const settings2: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.getViewer('myViewer');
                let session = api.getSession('mySession');
                viewer.clearColor = '#ff0000';
                viewer.update();
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });            
            expect(settings2['viewer.scene.render.clearColor']).toBe('#ff0000');
            await screenshotCompare(await driver.takeScreenshot(), name + '_clearColor_switch');

            // reset and save
            const settings3: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.getViewer('myViewer');
                let session = api.getSession('mySession');
                viewer.clearColor = '#ffffff';
                viewer.update();
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });              
            expect(settings3['viewer.scene.render.clearColor']).toBe('#ffffff');
            await screenshotCompare(await driver.takeScreenshot(), name + '_clearColor');
        });
        
        it(name + '_pointSize', async () => {
            // 'viewer.scene.render.pointSize': 1,
            // https://shapediver.atlassian.net/browse/SS-2996
        });
        
  
        it(name + '_shadows', async () => {
            // check starting default
            const settings1: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
                let session = await api.createAndInitializeSession({  id: 'mySession', ticket: 'd7275c4a686c2df9ba75ca6c7e05dc674ae60912c1aa75e478f273dab718cd20b2a269073e03b5810daaf461c82ad990b176d3071776ec0f80fa034bb1e2bc6ee6c99fc82764ad55157bcba7dd1856b18eb0390e2b83c201be16e51de33c356fc6ad73cb3100eeecd3fc48ea5405e7f1c2272088d7-ff5d231fc13c2098c7ed85e51331760e', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });
            expect(settings1['viewer.scene.render.shadows']).toBe(true);
            await screenshotCompare(await driver.takeScreenshot(), name + '_shadows');

            // change and save
            const settings2: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.getViewer('myViewer');
                let session = api.getSession('mySession');
                viewer.shadows = false;
                viewer.update();
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });            
            expect(settings2['viewer.scene.render.shadows']).toBe(false);
            await screenshotCompare(await driver.takeScreenshot(), name + '_shadows_switch');

            // reset and save
            const settings3: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.getViewer('myViewer');
                let session = api.getSession('mySession');
                viewer.shadows = true;
                viewer.update();
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });              
            expect(settings3['viewer.scene.render.shadows']).toBe(true);
            await screenshotCompare(await driver.takeScreenshot(), name + '_shadows');
        });

        
        it(name + '_showMessages', async () => {
            // check starting default
            const settings1: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
                let session = await api.createAndInitializeSession({  id: 'mySession', ticket: 'd7275c4a686c2df9ba75ca6c7e05dc674ae60912c1aa75e478f273dab718cd20b2a269073e03b5810daaf461c82ad990b176d3071776ec0f80fa034bb1e2bc6ee6c99fc82764ad55157bcba7dd1856b18eb0390e2b83c201be16e51de33c356fc6ad73cb3100eeecd3fc48ea5405e7f1c2272088d7-ff5d231fc13c2098c7ed85e51331760e', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });
            expect(settings1['viewer.showMessages']).toBe(true);

            // change and save
            const settings2: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.getViewer('myViewer');
                let session = api.getSession('mySession');
                api.showMessages = false;
                await session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });            
            expect(settings2['viewer.showMessages']).toBe(false);

            // reset and save
            const settings3: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.getViewer('myViewer');
                let session = api.getSession('mySession');
                api.showMessages = true;
                await session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });              
            expect(settings3['viewer.showMessages']).toBe(true);
        });
    });
}
