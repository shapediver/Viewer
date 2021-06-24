import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import webdriver, { WebDriver } from "selenium-webdriver";
require('chromedriver');
import { api as API } from "@shapediver/viewer"
import { screenshotCompare } from "../../general/src/setup";
import { capabilities as allCapabilities, DesktopCapabilities, MobileCapabilities } from "../../general/src/capabilities";

for (let c = 0; c < allCapabilities.length; c++) {
    let name = 'settings_camera';
    const capabilities = Object.assign({ 'name': name, 'build': require('../../../api/api/package.json').version }, allCapabilities[c]);

    if (process.env.PORT !== 'browserstack') {
        name = 'settings_camera';
        c = allCapabilities.length;
    } else {
        name = 'settings_camera/' + ((allCapabilities[c] as DesktopCapabilities).os ?
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
                let viewer = api.getViewer('myViewer')!;
                let session = api.getSession('mySession')!;
                session.getParameterById('dd319731-fb8a-4aa2-9aef-ac85e96a3060')!.updateDisplayName('COLOR');

                session.getParameterById('7ad4db6d-dc94-48b1-8e89-486b75b29df9')!.updateOrder(0);
                session.getParameterById('23033d60-7078-4836-99ce-990668e4429d')!.updateOrder(1);
                session.getParameterById('5a5aad86-8173-4bbe-8184-54656370cd4b')!.updateOrder(2);
                session.getParameterById('30c907b3-dbcf-4266-9f8f-835bb2353cb6')!.updateOrder(3);
                session.getParameterById('d0ecb53a-90f1-44d6-a6a5-fa47d4a38771')!.updateOrder(4);
                session.getParameterById('1d1af051-22fd-4f3a-a34c-1882c60a7fda')!.updateOrder(5);
                session.getParameterById('de76cade-0cea-47b1-879e-1a0b717910e1')!.updateOrder(6);
                session.getParameterById('dd319731-fb8a-4aa2-9aef-ac85e96a3060')!.updateOrder(7);
                session.getParameterById('9d9e7f0b-385c-495d-825e-3fec2ce9762d')!.updateOrder(8);
                session.getParameterById('55b36bef-a2e8-47cb-bd96-8631f95b11be')!.updateOrder(9);
                session.getParameterById('136b5b03-c3a3-40a1-bc51-009a71c9fc44')!.updateOrder(10);
            
                session.getParameterById('7ad4db6d-dc94-48b1-8e89-486b75b29df9')!.updateHidden(true);
                session.getParameterById('23033d60-7078-4836-99ce-990668e4429d')!.updateHidden(true);
                session.getParameterById('5a5aad86-8173-4bbe-8184-54656370cd4b')!.updateHidden(true);
                session.getParameterById('30c907b3-dbcf-4266-9f8f-835bb2353cb6')!.updateHidden(true);
                session.getParameterById('d0ecb53a-90f1-44d6-a6a5-fa47d4a38771')!.updateHidden(true);
                session.getParameterById('1d1af051-22fd-4f3a-a34c-1882c60a7fda')!.updateHidden(true);
                session.getParameterById('de76cade-0cea-47b1-879e-1a0b717910e1')!.updateHidden(false);
                session.getParameterById('9d9e7f0b-385c-495d-825e-3fec2ce9762d')!.updateHidden(true);
                session.getParameterById('55b36bef-a2e8-47cb-bd96-8631f95b11be')!.updateHidden(true);
                session.getParameterById('136b5b03-c3a3-40a1-bc51-009a71c9fc44')!.updateHidden(true);
                session.getParameterById('dd319731-fb8a-4aa2-9aef-ac85e96a3060')!.updateHidden(false);


                viewer.updateBlurSceneWhenBusy(true);
                const camera = viewer.createPerspectiveCamera();
                viewer.assignCamera(camera.id);
                camera!.updateAutoAdjust(false);
                camera!.updateCameraMovementDuration(800);
                camera!.updateDefaultPosition([58.03696060180664, -290.11590576171875, 87.67756652832031]);
                camera!.updateDefaultTarget([0, 7, -3.25]);
                camera!.updatePosition([58.03696060180664, -290.11590576171875, 87.67756652832031]);
                camera!.updateTarget([0, 7, -3.25]);
                (<any>camera!).updateFov(45);
                (<any>camera!).controls.updateAutoRotationSpeed(0);
                (<any>camera!).controls.updateDamping(0.1);
                viewer.updateEnvironmentMap('none');
                viewer.updateGridVisibility(true);
                viewer.updateGroundPlaneVisibility(true);
                viewer.updateEnvironmentMap('none');

                const lights = viewer.getLights();
                for (let l in lights) {
                    viewer.removeLight(l)
                }
                viewer.addAmbientLight({color: '#ffffff', intensity: 0.5, name: 'ambient0'});
                viewer.addDirectionalLight({color: '#ffffff', intensity: 0.75, direction: [0.5774000287055969, -0.5774000287055969, 0.5774000287055969], castShadow: true, name: 'directional0', shadowMapResolution: 1024, shadowMapBias: -0.00175});
                viewer.addDirectionalLight({color: '#ffffff', intensity: 0.35, direction: [.25, -1, 1], castShadow: false, name: 'directional1', shadowMapResolution: 1024, shadowMapBias: -0.00175});
                viewer.update();
                await session.saveSettings();
                cb();
            });
        });

        it(name + '_save_perspective_front', async () => {
            // check starting default
            const settings1: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = await api.createAndInitializeViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
                let session = await api.createAndInitializeSession({ id: 'mySession', ticket: 'd7275c4a686c2df9ba75ca6c7e05dc674ae60912c1aa75e478f273dab718cd20b2a269073e03b5810daaf461c82ad990b176d3071776ec0f80fa034bb1e2bc6ee6c99fc82764ad55157bcba7dd1856b18eb0390e2b83c201be16e51de33c356fc6ad73cb3100eeecd3fc48ea5405e7f1c2272088d7-ff5d231fc13c2098c7ed85e51331760e', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });
            await screenshotCompare(await driver.takeScreenshot(), name + '/save_perspective_front_1');

            // change and save
            const settings2: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = api.getViewer('myViewer')!;
                let session = api.getSession('mySession')!;

                const camera = viewer.createOrthographicCamera('myNewCamera');
                (<any>camera).updateDirection('front')
                viewer.assignCamera(camera.id);
                viewer.update();

                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });
            await screenshotCompare(await driver.takeScreenshot(), name + '/save_perspective_front_2');


            // reset and save
            const settings3: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let session = api.getSession('mySession')!;
                let viewer = api.getViewer('myViewer')!;
                viewer.assignCamera(Object.values(viewer.getCameras())[0].id);
                viewer.update();

                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });

            await screenshotCompare(await driver.takeScreenshot(), name + '/save_perspective_front_1');

        });
    });
}
