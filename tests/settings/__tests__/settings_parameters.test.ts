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
    let name = 'settings_parameters';

    if(process.env.PORT !== 'browserstack') {
        name = 'settings_parameters';
        c = allCapabilities.length;
    } else {
        name = 'settings_parameters ' + ((allCapabilities[c] as DesktopCapabilities).os ? 
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

        it(name + '_controlNames', async () => {
            // check starting default
            const settings1: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = await api.createAndInitializeViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
                let session = await api.createAndInitializeSession({  id: 'mySession', ticket: 'd7275c4a686c2df9ba75ca6c7e05dc674ae60912c1aa75e478f273dab718cd20b2a269073e03b5810daaf461c82ad990b176d3071776ec0f80fa034bb1e2bc6ee6c99fc82764ad55157bcba7dd1856b18eb0390e2b83c201be16e51de33c356fc6ad73cb3100eeecd3fc48ea5405e7f1c2272088d7-ff5d231fc13c2098c7ed85e51331760e', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });
            expect(settings1['parameters.controlNames']).toStrictEqual({ 
                'dd319731-fb8a-4aa2-9aef-ac85e96a3060': 'COLOR',
            });

            // change and save
            const settings2: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let session = api.getSession('mySession');
                session.getParameterById('de76cade-0cea-47b1-879e-1a0b717910e1')!.displayName = 'THE LENGTH';
                await session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });            
            expect(settings2['parameters.controlNames']).toStrictEqual({ 
                'dd319731-fb8a-4aa2-9aef-ac85e96a3060': 'COLOR',
                'de76cade-0cea-47b1-879e-1a0b717910e1': 'THE LENGTH'
            });

            // reset and save
            const settings3: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let session = api.getSession('mySession');
                session.getParameterById('de76cade-0cea-47b1-879e-1a0b717910e1')!.displayName = undefined;
                await session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });     
            expect(settings3['parameters.controlNames']).toStrictEqual({ 
                'dd319731-fb8a-4aa2-9aef-ac85e96a3060': 'COLOR',
            });

        });

        it(name + '_controlOrder', async () => {
            // check starting default
            const settings1: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = await api.createAndInitializeViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
                let session = await api.createAndInitializeSession({  id: 'mySession', ticket: 'd7275c4a686c2df9ba75ca6c7e05dc674ae60912c1aa75e478f273dab718cd20b2a269073e03b5810daaf461c82ad990b176d3071776ec0f80fa034bb1e2bc6ee6c99fc82764ad55157bcba7dd1856b18eb0390e2b83c201be16e51de33c356fc6ad73cb3100eeecd3fc48ea5405e7f1c2272088d7-ff5d231fc13c2098c7ed85e51331760e', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });
            expect(settings1['parameters.controlOrder']).toStrictEqual([
                '7ad4db6d-dc94-48b1-8e89-486b75b29df9',
                '23033d60-7078-4836-99ce-990668e4429d',
                '5a5aad86-8173-4bbe-8184-54656370cd4b',
                '30c907b3-dbcf-4266-9f8f-835bb2353cb6',
                'd0ecb53a-90f1-44d6-a6a5-fa47d4a38771',
                '1d1af051-22fd-4f3a-a34c-1882c60a7fda',
                'de76cade-0cea-47b1-879e-1a0b717910e1',
                'dd319731-fb8a-4aa2-9aef-ac85e96a3060',
                '9d9e7f0b-385c-495d-825e-3fec2ce9762d',
                '55b36bef-a2e8-47cb-bd96-8631f95b11be',
                '136b5b03-c3a3-40a1-bc51-009a71c9fc44'
            ]);
            
            // change and save
            const settings2: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let session = api.getSession('mySession');
                session.getParameterById('136b5b03-c3a3-40a1-bc51-009a71c9fc44')!.order = 9;
                session.getParameterById('55b36bef-a2e8-47cb-bd96-8631f95b11be')!.order = 10;
                await session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });            
            expect(settings2['parameters.controlOrder']).toStrictEqual([
                '7ad4db6d-dc94-48b1-8e89-486b75b29df9',
                '23033d60-7078-4836-99ce-990668e4429d',
                '5a5aad86-8173-4bbe-8184-54656370cd4b',
                '30c907b3-dbcf-4266-9f8f-835bb2353cb6',
                'd0ecb53a-90f1-44d6-a6a5-fa47d4a38771',
                '1d1af051-22fd-4f3a-a34c-1882c60a7fda',
                'de76cade-0cea-47b1-879e-1a0b717910e1',
                'dd319731-fb8a-4aa2-9aef-ac85e96a3060',
                '9d9e7f0b-385c-495d-825e-3fec2ce9762d',
                '136b5b03-c3a3-40a1-bc51-009a71c9fc44',
                '55b36bef-a2e8-47cb-bd96-8631f95b11be'
            ]);

            // reset and save
            const settings3: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let session = api.getSession('mySession');
                session.getParameterById('136b5b03-c3a3-40a1-bc51-009a71c9fc44')!.order = 10;
                session.getParameterById('55b36bef-a2e8-47cb-bd96-8631f95b11be')!.order = 9;
                await session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });     
            expect(settings3['parameters.controlOrder']).toStrictEqual([
                '7ad4db6d-dc94-48b1-8e89-486b75b29df9',
                '23033d60-7078-4836-99ce-990668e4429d',
                '5a5aad86-8173-4bbe-8184-54656370cd4b',
                '30c907b3-dbcf-4266-9f8f-835bb2353cb6',
                'd0ecb53a-90f1-44d6-a6a5-fa47d4a38771',
                '1d1af051-22fd-4f3a-a34c-1882c60a7fda',
                'de76cade-0cea-47b1-879e-1a0b717910e1',
                'dd319731-fb8a-4aa2-9aef-ac85e96a3060',
                '9d9e7f0b-385c-495d-825e-3fec2ce9762d',
                '55b36bef-a2e8-47cb-bd96-8631f95b11be',
                '136b5b03-c3a3-40a1-bc51-009a71c9fc44'
            ]);

        });

        it(name + '_parametersHidden', async () => {
            // check starting default
            const settings1: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let viewer = await api.createAndInitializeViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
                let session = await api.createAndInitializeSession({  id: 'mySession', ticket: 'd7275c4a686c2df9ba75ca6c7e05dc674ae60912c1aa75e478f273dab718cd20b2a269073e03b5810daaf461c82ad990b176d3071776ec0f80fa034bb1e2bc6ee6c99fc82764ad55157bcba7dd1856b18eb0390e2b83c201be16e51de33c356fc6ad73cb3100eeecd3fc48ea5405e7f1c2272088d7-ff5d231fc13c2098c7ed85e51331760e', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });
            expect(settings1['parameters.parametersHidden']).toStrictEqual([
                '7ad4db6d-dc94-48b1-8e89-486b75b29df9',
                '23033d60-7078-4836-99ce-990668e4429d',
                '5a5aad86-8173-4bbe-8184-54656370cd4b',
                '30c907b3-dbcf-4266-9f8f-835bb2353cb6',
                'd0ecb53a-90f1-44d6-a6a5-fa47d4a38771',
                '1d1af051-22fd-4f3a-a34c-1882c60a7fda',
                '9d9e7f0b-385c-495d-825e-3fec2ce9762d',
                '55b36bef-a2e8-47cb-bd96-8631f95b11be',
                '136b5b03-c3a3-40a1-bc51-009a71c9fc44'
            ]);

            // change and save
            const settings2: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let session = api.getSession('mySession');
                session.getParameterById('7ad4db6d-dc94-48b1-8e89-486b75b29df9')!.hidden = false;
                await session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });            
            expect(settings2['parameters.parametersHidden']).toStrictEqual([
                '23033d60-7078-4836-99ce-990668e4429d',
                '5a5aad86-8173-4bbe-8184-54656370cd4b',
                '30c907b3-dbcf-4266-9f8f-835bb2353cb6',
                'd0ecb53a-90f1-44d6-a6a5-fa47d4a38771',
                '1d1af051-22fd-4f3a-a34c-1882c60a7fda',
                '9d9e7f0b-385c-495d-825e-3fec2ce9762d',
                '55b36bef-a2e8-47cb-bd96-8631f95b11be',
                '136b5b03-c3a3-40a1-bc51-009a71c9fc44'
            ]);

            // reset and save
            const settings3: any = await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).api;
                let session = api.getSession('mySession');
                session.getParameterById('7ad4db6d-dc94-48b1-8e89-486b75b29df9')!.hidden = true;
                await session.saveSettings();
                cb((<any>window).settingsEngine.deconstruct());
            });     
            expect(settings3['parameters.parametersHidden']).toStrictEqual([
                '7ad4db6d-dc94-48b1-8e89-486b75b29df9',
                '23033d60-7078-4836-99ce-990668e4429d',
                '5a5aad86-8173-4bbe-8184-54656370cd4b',
                '30c907b3-dbcf-4266-9f8f-835bb2353cb6',
                'd0ecb53a-90f1-44d6-a6a5-fa47d4a38771',
                '1d1af051-22fd-4f3a-a34c-1882c60a7fda',
                '9d9e7f0b-385c-495d-825e-3fec2ce9762d',
                '55b36bef-a2e8-47cb-bd96-8631f95b11be',
                '136b5b03-c3a3-40a1-bc51-009a71c9fc44'
            ]);

        });
    });
}
