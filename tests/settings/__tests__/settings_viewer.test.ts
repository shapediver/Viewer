import webdriver, { WebDriver } from 'selenium-webdriver'
import { afterAll, beforeAll, describe, expect, test } from '@jest/globals'
import { api as API, DirectionalLight } from '@shapediver/viewer'

import { screenshotCompare } from '../../general/src/setup'
import {
  capabilities as allCapabilities,
  DesktopCapabilities,
  MobileCapabilities,
} from '../../general/src/capabilities'

require('chromedriver');
for (let c = 0; c < allCapabilities.length; c++) {
    let name = 'settings_viewer';
    const capabilities = Object.assign({ 'name': name, 'build': require('../../../api/api/package.json').version }, allCapabilities[c]);

    if (process.env.PORT !== 'browserstack') {
        name = 'settings_viewer';
        c = allCapabilities.length;
    } else {
        name = 'settings_viewer/' + ((allCapabilities[c] as DesktopCapabilities).os ?
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
            await driver.navigate().to('https://viewer.shapediver.com/v3/latest/test/index.html')
            const TIMEOUT = 300000000
            await driver.manage().setTimeouts( { implicit: TIMEOUT, pageLoad: TIMEOUT, script: TIMEOUT } );
        });
        
        beforeEach(async () => {
            await driver.navigate().to('https://viewer.shapediver.com/v3/latest/test/index.html')
        });

        afterAll(async () => {
            await driver.close();
            await driver.quit();
        })

        afterEach(async () => {
            await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.viewers['myViewer']!;
                let session = api.sessions['mySession']!;
                session.getParameterById('dd319731-fb8a-4aa2-9aef-ac85e96a3060')!.displayname = ('COLOR');

                session.getParameterById('7ad4db6d-dc94-48b1-8e89-486b75b29df9')!.order = (0);
                session.getParameterById('23033d60-7078-4836-99ce-990668e4429d')!.order = (1);
                session.getParameterById('5a5aad86-8173-4bbe-8184-54656370cd4b')!.order = (2);
                session.getParameterById('30c907b3-dbcf-4266-9f8f-835bb2353cb6')!.order = (3);
                session.getParameterById('d0ecb53a-90f1-44d6-a6a5-fa47d4a38771')!.order = (4);
                session.getParameterById('1d1af051-22fd-4f3a-a34c-1882c60a7fda')!.order = (5);
                session.getParameterById('de76cade-0cea-47b1-879e-1a0b717910e1')!.order = (6);
                session.getParameterById('dd319731-fb8a-4aa2-9aef-ac85e96a3060')!.order = (7);
                session.getParameterById('9d9e7f0b-385c-495d-825e-3fec2ce9762d')!.order = (8);
                session.getParameterById('55b36bef-a2e8-47cb-bd96-8631f95b11be')!.order = (9);
                session.getParameterById('136b5b03-c3a3-40a1-bc51-009a71c9fc44')!.order = (10);
            
                session.getParameterById('7ad4db6d-dc94-48b1-8e89-486b75b29df9')!.hidden = (true);
                session.getParameterById('23033d60-7078-4836-99ce-990668e4429d')!.hidden = (true);
                session.getParameterById('5a5aad86-8173-4bbe-8184-54656370cd4b')!.hidden = (true);
                session.getParameterById('30c907b3-dbcf-4266-9f8f-835bb2353cb6')!.hidden = (true);
                session.getParameterById('d0ecb53a-90f1-44d6-a6a5-fa47d4a38771')!.hidden = (true);
                session.getParameterById('1d1af051-22fd-4f3a-a34c-1882c60a7fda')!.hidden = (true);
                session.getParameterById('de76cade-0cea-47b1-879e-1a0b717910e1')!.hidden = (false);
                session.getParameterById('9d9e7f0b-385c-495d-825e-3fec2ce9762d')!.hidden = (true);
                session.getParameterById('55b36bef-a2e8-47cb-bd96-8631f95b11be')!.hidden = (true);
                session.getParameterById('136b5b03-c3a3-40a1-bc51-009a71c9fc44')!.hidden = (true);
                session.getParameterById('dd319731-fb8a-4aa2-9aef-ac85e96a3060')!.hidden = (false);


                viewer.blurSceneWhenBusy = true;
                const camera = viewer.createPerspectiveCamera();
                viewer.assignCamera(camera.id);
                camera!.autoAdjust = (false);
                camera!.cameraMovementDuration = (800);
                camera!.defaultPosition = ([58.03696060180664, -290.11590576171875, 87.67756652832031]);
                camera!.defaultTarget = ([0, 7, -3.25]);
                camera!.position = ([58.03696060180664, -290.11590576171875, 87.67756652832031]);
                camera!.target = ([0, 7, -3.25]);
                (<any>camera!).fov = (45);
                (<any>camera!).controls.autoRotationSpeed = (0);
                (<any>camera!).controls.damping = (0.1);
                viewer.environmentMap = ('none');
                viewer.environmentMapAsBackground = (false);
                viewer.gridVisibility = (true);
                viewer.groundPlaneVisibility = (true);
                viewer.environmentMap = ('none');

                const lights = viewer.lightScene!.lights;
                for (let l in lights) {
                    if(l !== '6e219562-c916-4492-b9b9-1dfbac80d51f' && l !== '70bc760c-45dc-46b0-9cd2-8990ac77124f' && l !== '748019ac-ce54-4de7-94d2-737dae6579dd')
                        viewer.lightScene!.removeLight(l)
                }
                viewer.lightScene!.lights["748019ac-ce54-4de7-94d2-737dae6579dd"].name = ('ambient0')
                viewer.lightScene!.lights["748019ac-ce54-4de7-94d2-737dae6579dd"].intensity = (0.5)
                viewer.lightScene!.lights["748019ac-ce54-4de7-94d2-737dae6579dd"].color = ('#ffffff')

                viewer.lightScene!.lights["70bc760c-45dc-46b0-9cd2-8990ac77124f"].name = ('directional0')
                viewer.lightScene!.lights["70bc760c-45dc-46b0-9cd2-8990ac77124f"].intensity = (0.75)
                viewer.lightScene!.lights["70bc760c-45dc-46b0-9cd2-8990ac77124f"].color = ('#ffffff');
                (<DirectionalLight>viewer.lightScene!.lights["70bc760c-45dc-46b0-9cd2-8990ac77124f"]).direction = ([0.5774000287055969, -0.5774000287055969, 0.5774000287055969])

                viewer.lightScene!.lights["6e219562-c916-4492-b9b9-1dfbac80d51f"].name = ('directional1')
                viewer.lightScene!.lights["6e219562-c916-4492-b9b9-1dfbac80d51f"].intensity = (0.35)
                viewer.lightScene!.lights["6e219562-c916-4492-b9b9-1dfbac80d51f"].color = ('#ffffff');
                (<DirectionalLight>viewer.lightScene!.lights["6e219562-c916-4492-b9b9-1dfbac80d51f"]).direction = ([0.25, -1, 1])
                viewer.update();
                await session.saveSettings();
                cb();
            });
        });

        // it(name + '_blur', async () => {
        //     // 'viewer.blurSceneWhenBusy': true,
        //     // https://shapediver.atlassian.net/browse/SS-2994
        // });

        // it(name + '_commitParameters', async () => {
        //     // 'viewer.commitParameters': false,
        //     // TODO
        // });

        // it(name + '_commitSettings', async () => {
        //     // 'viewer.commitSettings': false,
        //     // TODO
        // });

        it(name + '_gridVisibility', async () => {
            // check starting default
            const settings1: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
                let session = await api.createSession({ id: 'mySession', ticket: 'd7275c4a686c2df9ba75ca6c7e05dc674ae60912c1aa75e478f273dab718cd20b2a269073e03b5810daaf461c82ad990b176d3071776ec0f80fa034bb1e2bc6ee6c99fc82764ad55157bcba7dd1856b18eb0390e2b83c201be16e51de33c356fc6ad73cb3100eeecd3fc48ea5405e7f1c2272088d7-ff5d231fc13c2098c7ed85e51331760e', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.flatten());
            });
            expect(settings1['environmentGeometry.gridVisibility']).toBe(true);
            await screenshotCompare(await driver.takeScreenshot(), name + '/gridVisibility');

            // change and save
            const settings2: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.viewers['myViewer']!;
                let session = api.sessions['mySession']!;
                viewer.gridVisibility = (false);
                viewer.update();
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.flatten());
            });
            expect(settings2['environmentGeometry.gridVisibility']).toBe(false);
            await screenshotCompare(await driver.takeScreenshot(), name + '/gridVisibility_switch');

            // reset and save
            const settings3: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.viewers['myViewer']!;
                let session = api.sessions['mySession']!;
                viewer.gridVisibility = (true);
                viewer.update();
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.flatten());
            });
            expect(settings3['environmentGeometry.gridVisibility']).toBe(true);
            await screenshotCompare(await driver.takeScreenshot(), name + '/gridVisibility');
        });


        it(name + '_groundPlaneVisibility', async () => {
            // check starting default
            const settings1: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
                let session = await api.createSession({ id: 'mySession', ticket: 'd7275c4a686c2df9ba75ca6c7e05dc674ae60912c1aa75e478f273dab718cd20b2a269073e03b5810daaf461c82ad990b176d3071776ec0f80fa034bb1e2bc6ee6c99fc82764ad55157bcba7dd1856b18eb0390e2b83c201be16e51de33c356fc6ad73cb3100eeecd3fc48ea5405e7f1c2272088d7-ff5d231fc13c2098c7ed85e51331760e', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.flatten());
            });
            expect(settings1['environmentGeometry.groundPlaneVisibility']).toBe(true);
            await screenshotCompare(await driver.takeScreenshot(), name + '/groundPlaneVisibility');

            // change and save
            const settings2: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.viewers['myViewer']!;
                let session = api.sessions['mySession']!;
                viewer.groundPlaneVisibility = (false);
                viewer.update();
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.flatten());
            });
            expect(settings2['environmentGeometry.groundPlaneVisibility']).toBe(false);
            await screenshotCompare(await driver.takeScreenshot(), name + '/groundPlaneVisibility_switch');

            // reset and save
            const settings3: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.viewers['myViewer']!;
                let session = api.sessions['mySession']!;
                viewer.groundPlaneVisibility = (true);
                viewer.update();
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.flatten());
            });
            expect(settings3['environmentGeometry.groundPlaneVisibility']).toBe(true);
            await screenshotCompare(await driver.takeScreenshot(), name + '/groundPlaneVisibility');
        });



        it(name + '_environmentMap', async () => {
            // check starting default
            const settings1: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
                let session = await api.createSession({ id: 'mySession', ticket: 'd7275c4a686c2df9ba75ca6c7e05dc674ae60912c1aa75e478f273dab718cd20b2a269073e03b5810daaf461c82ad990b176d3071776ec0f80fa034bb1e2bc6ee6c99fc82764ad55157bcba7dd1856b18eb0390e2b83c201be16e51de33c356fc6ad73cb3100eeecd3fc48ea5405e7f1c2272088d7-ff5d231fc13c2098c7ed85e51331760e', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.flatten());
            });
            expect(settings1['environment.map']).toBe('none');
            await screenshotCompare(await driver.takeScreenshot(), name + '/environmentMap');

            // change and save
            const settings2: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.viewers['myViewer']!;
                let session = api.sessions['mySession']!;
                viewer.environmentMap = ('georgentor');
                viewer.update();
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await new Promise(resolve  => setTimeout(resolve, 500));
                await session.saveSettings();
                cb((<any>window).settingsEngine.flatten());
            });
            expect(settings2['environment.map']).toBe('georgentor');
            await screenshotCompare(await driver.takeScreenshot(), name + '/environmentMap_switch');

            // reset and save
            const settings3: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.viewers['myViewer']!;
                let session = api.sessions['mySession']!;
                viewer.environmentMap = ('none');
                viewer.update();
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await new Promise(resolve  => setTimeout(resolve, 500));
                await session.saveSettings();
                cb((<any>window).settingsEngine.flatten());
            });
            expect(settings3['environment.map']).toBe('none');
            await screenshotCompare(await driver.takeScreenshot(), name + '/environmentMap');
        });


        it(name + '_environmentMapAsBackground', async () => {
            // check starting default
            const settings1: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
                let session = await api.createSession({ id: 'mySession', ticket: 'd7275c4a686c2df9ba75ca6c7e05dc674ae60912c1aa75e478f273dab718cd20b2a269073e03b5810daaf461c82ad990b176d3071776ec0f80fa034bb1e2bc6ee6c99fc82764ad55157bcba7dd1856b18eb0390e2b83c201be16e51de33c356fc6ad73cb3100eeecd3fc48ea5405e7f1c2272088d7-ff5d231fc13c2098c7ed85e51331760e', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.flatten());
            });
            expect(settings1['environment.mapAsBackground']).toBe(false);
            await screenshotCompare(await driver.takeScreenshot(), name + '/environmentMapAsBackground');

            // change and save
            const settings2: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.viewers['myViewer']!;
                let session = api.sessions['mySession']!;
                viewer.environmentMap = ('georgentor');
                viewer.environmentMapAsBackground = (true);
                viewer.update();
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await new Promise(resolve  => setTimeout(resolve, 500));
                await session.saveSettings();
                cb((<any>window).settingsEngine.flatten());
            });
            expect(settings2['environment.mapAsBackground']).toBe(true);
            await screenshotCompare(await driver.takeScreenshot(), name + '/environmentMapAsBackground_switch');

            // reset and save
            const settings3: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.viewers['myViewer']!;
                let session = api.sessions['mySession']!;
                viewer.environmentMap = ('none');
                viewer.environmentMapAsBackground = (false);
                viewer.update();
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await new Promise(resolve  => setTimeout(resolve, 500));
                await session.saveSettings();
                cb((<any>window).settingsEngine.flatten());
            });
            expect(settings3['environment.mapAsBackground']).toBe(false);
            await screenshotCompare(await driver.takeScreenshot(), name + '/environmentMapAsBackground');
        });


        it(name + '_environmentMapResolution', async () => {
            // check starting default
            const settings1: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
                let session = await api.createSession({ id: 'mySession', ticket: 'd7275c4a686c2df9ba75ca6c7e05dc674ae60912c1aa75e478f273dab718cd20b2a269073e03b5810daaf461c82ad990b176d3071776ec0f80fa034bb1e2bc6ee6c99fc82764ad55157bcba7dd1856b18eb0390e2b83c201be16e51de33c356fc6ad73cb3100eeecd3fc48ea5405e7f1c2272088d7-ff5d231fc13c2098c7ed85e51331760e', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.flatten());
            });
            expect(settings1['environment.mapResolution']).toBe('1024');

            // change and save
            const settings2: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.viewers['myViewer']!;
                let session = api.sessions['mySession']!;
                viewer.environmentMapResolution = ('512');
                await session.saveSettings();
                cb((<any>window).settingsEngine.flatten());
            });
            expect(settings2['environment.mapResolution']).toBe('512');

            // reset and save
            const settings3: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.viewers['myViewer']!;
                let session = api.sessions['mySession']!;
                viewer.environmentMapResolution = ('1024');
                await session.saveSettings();
                cb((<any>window).settingsEngine.flatten());
            });
            expect(settings3['environment.mapResolution']).toBe('1024');
        });

        it(name + '_ambientOcclusion', async () => {
            // check starting default
            const settings1: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
                let session = await api.createSession({ id: 'mySession', ticket: 'd7275c4a686c2df9ba75ca6c7e05dc674ae60912c1aa75e478f273dab718cd20b2a269073e03b5810daaf461c82ad990b176d3071776ec0f80fa034bb1e2bc6ee6c99fc82764ad55157bcba7dd1856b18eb0390e2b83c201be16e51de33c356fc6ad73cb3100eeecd3fc48ea5405e7f1c2272088d7-ff5d231fc13c2098c7ed85e51331760e', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.flatten());
            });
            expect(settings1['rendering.ambientOcclusion']).toBe(true);
            await screenshotCompare(await driver.takeScreenshot(), name + '/ambientOcclusion');

            // change and save
            const settings2: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.viewers['myViewer']!;
                let session = api.sessions['mySession']!;
                viewer.ambientOcclusion = (false);
                viewer.update();
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.flatten());
            });
            expect(settings2['rendering.ambientOcclusion']).toBe(false);
            await screenshotCompare(await driver.takeScreenshot(), name + '/ambientOcclusion_switch');

            // reset and save
            const settings3: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.viewers['myViewer']!;
                let session = api.sessions['mySession']!;
                viewer.ambientOcclusion = (true);
                viewer.update();
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.flatten());
            });
            expect(settings3['rendering.ambientOcclusion']).toBe(true);
            await screenshotCompare(await driver.takeScreenshot(), name + '/ambientOcclusion');
        });

        it(name + '_ambientOcclusionIntensity', async () => {
            // check starting default
            const settings1: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
                let session = await api.createSession({ id: 'mySession', ticket: 'd7275c4a686c2df9ba75ca6c7e05dc674ae60912c1aa75e478f273dab718cd20b2a269073e03b5810daaf461c82ad990b176d3071776ec0f80fa034bb1e2bc6ee6c99fc82764ad55157bcba7dd1856b18eb0390e2b83c201be16e51de33c356fc6ad73cb3100eeecd3fc48ea5405e7f1c2272088d7-ff5d231fc13c2098c7ed85e51331760e', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.flatten());
            });
            expect(settings1['rendering.ambientOcclusionIntensity']).toBe(0.1);
            await screenshotCompare(await driver.takeScreenshot(), name + '/ambientOcclusionIntensity');

            // change and save
            const settings2: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.viewers['myViewer']!;
                let session = api.sessions['mySession']!;
                viewer.ambientOcclusionIntensity = 1.0;
                viewer.update();
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.flatten());
            });
            await screenshotCompare(await driver.takeScreenshot(), name + '/ambientOcclusionIntensity_switch');

            // reset and save
            const settings3: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.viewers['myViewer']!;
                let session = api.sessions['mySession']!;
                viewer.ambientOcclusionIntensity = 0.1;
                viewer.update();
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.flatten());
            });
            expect(settings1['rendering.ambientOcclusionIntensity']).toBe(0.1);
            await screenshotCompare(await driver.takeScreenshot(), name + '/ambientOcclusionIntensity');
        });

        it(name + '_beautyRenderBlendingDuration', async () => {
            // check starting default
            const settings1: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
                let session = await api.createSession({ id: 'mySession', ticket: 'd7275c4a686c2df9ba75ca6c7e05dc674ae60912c1aa75e478f273dab718cd20b2a269073e03b5810daaf461c82ad990b176d3071776ec0f80fa034bb1e2bc6ee6c99fc82764ad55157bcba7dd1856b18eb0390e2b83c201be16e51de33c356fc6ad73cb3100eeecd3fc48ea5405e7f1c2272088d7-ff5d231fc13c2098c7ed85e51331760e', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.flatten());
            });
            expect(settings1['rendering.beautyRenderBlendingDuration']).toBe(1500);

            // change and save
            const settings2: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.viewers['myViewer']!;
                let session = api.sessions['mySession']!;
                viewer.beautyRenderBlendingDuration = (500);
                await session.saveSettings();
                cb((<any>window).settingsEngine.flatten());
            });
            expect(settings2['rendering.beautyRenderBlendingDuration']).toBe(500);

            // reset and save
            const settings3: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.viewers['myViewer']!;
                let session = api.sessions['mySession']!;
                viewer.beautyRenderBlendingDuration = (1500);
                await session.saveSettings();
                cb((<any>window).settingsEngine.flatten());
            });
            expect(settings3['rendering.beautyRenderBlendingDuration']).toBe(1500);
        });

        it(name + '_beautyRenderDelay', async () => {
            // check starting default
            const settings1: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
                let session = await api.createSession({ id: 'mySession', ticket: 'd7275c4a686c2df9ba75ca6c7e05dc674ae60912c1aa75e478f273dab718cd20b2a269073e03b5810daaf461c82ad990b176d3071776ec0f80fa034bb1e2bc6ee6c99fc82764ad55157bcba7dd1856b18eb0390e2b83c201be16e51de33c356fc6ad73cb3100eeecd3fc48ea5405e7f1c2272088d7-ff5d231fc13c2098c7ed85e51331760e', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.flatten());
            });
            expect(settings1['rendering.beautyRenderDelay']).toBe(50);

            // change and save
            const settings2: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.viewers['myViewer']!;
                let session = api.sessions['mySession']!;
                viewer.beautyRenderDelay = (500);
                await session.saveSettings();
                cb((<any>window).settingsEngine.flatten());
            });
            expect(settings2['rendering.beautyRenderDelay']).toBe(500);

            // reset and save
            const settings3: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.viewers['myViewer']!;
                let session = api.sessions['mySession']!;
                viewer.beautyRenderDelay = (50);
                await session.saveSettings();
                cb((<any>window).settingsEngine.flatten());
            });
            expect(settings3['rendering.beautyRenderDelay']).toBe(50);
        });

        it(name + '_clearAlpha', async () => {
            // check starting default
            const settings1: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                document.getElementById('canvas')!.parentElement!.style.background = 'red';
                let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
                let session = await api.createSession({ id: 'mySession', ticket: 'd7275c4a686c2df9ba75ca6c7e05dc674ae60912c1aa75e478f273dab718cd20b2a269073e03b5810daaf461c82ad990b176d3071776ec0f80fa034bb1e2bc6ee6c99fc82764ad55157bcba7dd1856b18eb0390e2b83c201be16e51de33c356fc6ad73cb3100eeecd3fc48ea5405e7f1c2272088d7-ff5d231fc13c2098c7ed85e51331760e', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.flatten());
            });
            expect(settings1['environment.clearAlpha']).toBe(1);
            await screenshotCompare(await driver.takeScreenshot(), name + '/clearAlpha');

            // change and save
            const settings2: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.viewers['myViewer']!;
                let session = api.sessions['mySession']!;
                viewer.clearAlpha = (0);
                viewer.update();
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.flatten());
            });
            expect(settings2['environment.clearAlpha']).toBe(0);
            await screenshotCompare(await driver.takeScreenshot(), name + '/clearAlpha_switch');

            // reset and save
            const settings3: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.viewers['myViewer']!;
                let session = api.sessions['mySession']!;
                viewer.clearAlpha = (1);
                viewer.update();
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.flatten());
            });
            expect(settings3['environment.clearAlpha']).toBe(1);
            await screenshotCompare(await driver.takeScreenshot(), name + '/clearAlpha');
        });

        it(name + '_clearColor', async () => {
            // check starting default
            const settings1: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
                let session = await api.createSession({ id: 'mySession', ticket: 'd7275c4a686c2df9ba75ca6c7e05dc674ae60912c1aa75e478f273dab718cd20b2a269073e03b5810daaf461c82ad990b176d3071776ec0f80fa034bb1e2bc6ee6c99fc82764ad55157bcba7dd1856b18eb0390e2b83c201be16e51de33c356fc6ad73cb3100eeecd3fc48ea5405e7f1c2272088d7-ff5d231fc13c2098c7ed85e51331760e', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.flatten());
            });
            expect(settings1['environment.clearColor']).toBe('#ffffff');
            await screenshotCompare(await driver.takeScreenshot(), name + '/clearColor');

            // change and save
            const settings2: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.viewers['myViewer']!;
                let session = api.sessions['mySession']!;
                viewer.clearColor = ('#ff0000');
                viewer.update();
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.flatten());
            });
            expect(settings2['environment.clearColor']).toBe('#ff0000');
            await screenshotCompare(await driver.takeScreenshot(), name + '/clearColor_switch');

            // reset and save
            const settings3: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.viewers['myViewer']!;
                let session = api.sessions['mySession']!;
                viewer.clearColor = ('#ffffff');
                viewer.update();
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.flatten());
            });
            expect(settings3['environment.clearColor']).toBe('#ffffff');
            await screenshotCompare(await driver.takeScreenshot(), name + '/clearColor');
        });

        // it(name + '_pointSize', async () => {
        //     // 'viewer.scene.render.pointSize': 1,
        //     // https://shapediver.atlassian.net/browse/SS-2996
        // });


        it(name + '_shadows', async () => {
            // check starting default
            const settings1: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
                let session = await api.createSession({ id: 'mySession', ticket: 'd7275c4a686c2df9ba75ca6c7e05dc674ae60912c1aa75e478f273dab718cd20b2a269073e03b5810daaf461c82ad990b176d3071776ec0f80fa034bb1e2bc6ee6c99fc82764ad55157bcba7dd1856b18eb0390e2b83c201be16e51de33c356fc6ad73cb3100eeecd3fc48ea5405e7f1c2272088d7-ff5d231fc13c2098c7ed85e51331760e', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.flatten());
            });
            expect(settings1['rendering.shadows']).toBe(true);
            await screenshotCompare(await driver.takeScreenshot(), name + '/shadows');

            // change and save
            const settings2: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.viewers['myViewer']!;
                let session = api.sessions['mySession']!;
                viewer.shadows = (false);
                viewer.update();
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.flatten());
            });
            expect(settings2['rendering.shadows']).toBe(false);
            await screenshotCompare(await driver.takeScreenshot(), name + '/shadows_switch');

            // reset and save
            const settings3: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.viewers['myViewer']!;
                let session = api.sessions['mySession']!;
                viewer.shadows = (true);
                viewer.update();
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.flatten());
            });
            expect(settings3['rendering.shadows']).toBe(true);
            await screenshotCompare(await driver.takeScreenshot(), name + '/shadows');
        });


        it(name + '_showMessages', async () => {
            // check starting default
            const settings1: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
                let session = await api.createSession({ id: 'mySession', ticket: 'd7275c4a686c2df9ba75ca6c7e05dc674ae60912c1aa75e478f273dab718cd20b2a269073e03b5810daaf461c82ad990b176d3071776ec0f80fa034bb1e2bc6ee6c99fc82764ad55157bcba7dd1856b18eb0390e2b83c201be16e51de33c356fc6ad73cb3100eeecd3fc48ea5405e7f1c2272088d7-ff5d231fc13c2098c7ed85e51331760e', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.flatten());
            });
            expect(settings1['general.showMessages']).toBe(true);

            // change and save
            const settings2: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.viewers['myViewer']!;
                let session = api.sessions['mySession']!;
                api.showMessages = false;
                await session.saveSettings();
                cb((<any>window).settingsEngine.flatten());
            });
            expect(settings2['general.showMessages']).toBe(false);

            // reset and save
            const settings3: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.viewers['myViewer']!;
                let session = api.sessions['mySession']!;
                api.showMessages = true;
                await session.saveSettings();
                cb((<any>window).settingsEngine.flatten());
            });
            expect(settings3['general.showMessages']).toBe(true);
        });
    });
}
