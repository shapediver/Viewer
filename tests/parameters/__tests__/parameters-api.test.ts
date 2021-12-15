import webdriver, { WebDriver } from 'selenium-webdriver'
import { afterAll, beforeAll, describe, expect, test } from '@jest/globals'
import { api as API, DirectionalLight } from '@shapediver/viewer'
import { sdeuc1 } from '../../general/src/models';
import { createTokenFromSlug } from '../../general/src/utils';

require('chromedriver');
let name = 'settings_parameters';
const shelfTicket = sdeuc1.models['Shelf'].ticket;
let token: string;

let driver: WebDriver;
describe('device testing', () => {

    beforeAll(async () => {
        driver = await new webdriver.Builder().withCapabilities(webdriver.Capabilities.chrome()).build();
        await driver.navigate().to('https://viewer.shapediver.com/v3/latest/cdn/index.html')
        const TIMEOUT = 300000000
        await driver.manage().setTimeouts({ implicit: TIMEOUT, pageLoad: TIMEOUT, script: TIMEOUT });
        token = await createTokenFromSlug(sdeuc1.models['Shelf'].slug);
    });

    beforeEach(async () => {
        await driver.navigate().to('https://viewer.shapediver.com/v3/latest/cdn/index.html')
    });

    afterAll(async () => {
        await driver.close();
        await driver.quit();
    })

    it(name + '_sessionSettingsDefault', async () => {
        // check starting default
        const r: any = await driver.executeAsyncScript(async (ticket: string, bearerToken: string, cb: any) => {
            const api: typeof API = (<any>window).SDV.api;
            let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await api.createSession({ 
                ticket, 
                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
                bearerToken
            });
            await session.saveSettings();
            cb({ settings: (<any>window).SDV.settingsEngine.flatten(), tooltip: session.parameters['dd319731-fb8a-4aa2-9aef-ac85e96a3060'].tooltip });
        }, shelfTicket, token);
        expect(r.settings['session.dd319731-fb8a-4aa2-9aef-ac85e96a3060.displayname']).toBe('');
        expect(r.settings['session.dd319731-fb8a-4aa2-9aef-ac85e96a3060.hidden']).toBe(false);
        expect(r.settings['session.dd319731-fb8a-4aa2-9aef-ac85e96a3060.order']).toBe(4);
        expect(r.tooltip).toBe('');
    });

    it(name + '_sessionSettingsChange', async () => {
        // check starting default
        const r: any = await driver.executeAsyncScript(async (ticket: string, bearerToken: string, cb: any) => {
            const api: typeof API = (<any>window).SDV.api;
            let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await api.createSession({ 
                ticket, 
                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
                bearerToken
            });
            session.parameters['dd319731-fb8a-4aa2-9aef-ac85e96a3060'].displayname = 'test';
            session.parameters['dd319731-fb8a-4aa2-9aef-ac85e96a3060'].hidden = true;
            session.parameters['dd319731-fb8a-4aa2-9aef-ac85e96a3060'].order = 1000;
            session.parameters['dd319731-fb8a-4aa2-9aef-ac85e96a3060'].tooltip = 'testtip';
            await session.saveSettings();
            cb({ settings: (<any>window).SDV.settingsEngine.flatten(), tooltip: session.parameters['dd319731-fb8a-4aa2-9aef-ac85e96a3060'].tooltip });
        }, shelfTicket, token);
        expect(r.settings['session.dd319731-fb8a-4aa2-9aef-ac85e96a3060.displayname']).toBe('test');
        expect(r.settings['session.dd319731-fb8a-4aa2-9aef-ac85e96a3060.hidden']).toBe(true);
        expect(r.settings['session.dd319731-fb8a-4aa2-9aef-ac85e96a3060.order']).toBe(1000);
        expect(r.tooltip).toBe('testtip')
    });

    it(name + '_sessionSettingsChangeCheck', async () => {
        // check starting default
        const r: any = await driver.executeAsyncScript(async (ticket: string, bearerToken: string, cb: any) => {
            const api: typeof API = (<any>window).SDV.api;
            let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await api.createSession({ 
                ticket, 
                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
                bearerToken
            });
            cb({ settings: (<any>window).SDV.settingsEngine.flatten(), tooltip: session.parameters['dd319731-fb8a-4aa2-9aef-ac85e96a3060'].tooltip });
        }, shelfTicket, token);
        expect(r.settings['session.dd319731-fb8a-4aa2-9aef-ac85e96a3060.displayname']).toBe('test');
        expect(r.settings['session.dd319731-fb8a-4aa2-9aef-ac85e96a3060.hidden']).toBe(true);
        expect(r.settings['session.dd319731-fb8a-4aa2-9aef-ac85e96a3060.order']).toBe(1000);
        expect(r.tooltip).toBe('testtip')
    });

    it(name + '_sessionSettingsReset', async () => {
        // check starting default
        const r: any = await driver.executeAsyncScript(async (ticket: string, bearerToken: string, cb: any) => {
            const api: typeof API = (<any>window).SDV.api;
            let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await api.createSession({ 
                ticket, 
                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
                bearerToken
            });
            session.parameters['dd319731-fb8a-4aa2-9aef-ac85e96a3060'].displayname = '';
            session.parameters['dd319731-fb8a-4aa2-9aef-ac85e96a3060'].hidden = false;
            session.parameters['dd319731-fb8a-4aa2-9aef-ac85e96a3060'].order = 4;
            session.parameters['dd319731-fb8a-4aa2-9aef-ac85e96a3060'].tooltip = '';
            await session.saveSettings();
            cb({ settings: (<any>window).SDV.settingsEngine.flatten(), tooltip: session.parameters['dd319731-fb8a-4aa2-9aef-ac85e96a3060'].tooltip });
        }, shelfTicket, token);
        expect(r.settings['session.dd319731-fb8a-4aa2-9aef-ac85e96a3060.displayname']).toBe('');
        expect(r.settings['session.dd319731-fb8a-4aa2-9aef-ac85e96a3060.hidden']).toBe(false);
        expect(r.settings['session.dd319731-fb8a-4aa2-9aef-ac85e96a3060.order']).toBe(4);
        expect(r.tooltip).toBe('');
    });

    it(name + '_sessionSettingsResetCheck', async () => {
        // check starting default
        const r: any = await driver.executeAsyncScript(async (ticket: string, bearerToken: string, cb: any) => {
            const api: typeof API = (<any>window).SDV.api;
            let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await api.createSession({ 
                ticket, 
                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
                bearerToken
            });
            cb({ settings: (<any>window).SDV.settingsEngine.flatten(), tooltip: session.parameters['dd319731-fb8a-4aa2-9aef-ac85e96a3060'].tooltip });
        }, shelfTicket, token);
        expect(r.settings['session.dd319731-fb8a-4aa2-9aef-ac85e96a3060.displayname']).toBe('');
        expect(r.settings['session.dd319731-fb8a-4aa2-9aef-ac85e96a3060.hidden']).toBe(false);
        expect(r.settings['session.dd319731-fb8a-4aa2-9aef-ac85e96a3060.order']).toBe(4);
        expect(r.tooltip).toBe('');
    });

});