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
                session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });
            expect(settings1['viewer.scene.gridVisibility']).toStrictEqual(true);
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
                session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });            
            expect(settings2['viewer.scene.gridVisibility']).toStrictEqual(false);
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
                session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });              
            expect(settings3['viewer.scene.gridVisibility']).toStrictEqual(true);
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
                session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });
            expect(settings1['viewer.scene.groundPlaneVisibility']).toStrictEqual(true);
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
                session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });            
            expect(settings2['viewer.scene.groundPlaneVisibility']).toStrictEqual(false);
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
                session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });              
            expect(settings3['viewer.scene.groundPlaneVisibility']).toStrictEqual(true);
            await screenshotCompare(await driver.takeScreenshot(), name + '_groundPlaneVisibility');
        });

    // 'viewer.scene.material.environmentMap': 'none',
    // 'viewer.scene.material.environmentMapAsBackground': false,
    // 'viewer.scene.material.environmentMapResolution': '1024',
    // 'viewer.scene.render.ambientOcclusion': true,
    // 'viewer.scene.render.beautyRenderBlendingDuration': 1500,
    // 'viewer.scene.render.beautyRenderDelay': 50,
    // 'viewer.scene.render.clearAlpha': 1,
    // 'viewer.scene.render.clearColor': '#ffffff',
    // 'viewer.scene.render.pointSize': 1,
    // 'viewer.scene.render.shadows': true,
    // 'viewer.scene.showSceneTransition': '1s',
    // 'viewer.showMessages': true
    });
}
