import webdriver from 'selenium-webdriver'
import { afterAll, beforeAll, describe, expect, test } from '@jest/globals'
import { api as API, DirectionalLight } from '@shapediver/viewer'

import { createDriver, screenshotCompare } from '../../general/src/setup'
import { createTokenFromSlug } from '../../general/src/createTokenFromSlug'
import { sdeuc1 } from '../../general/src/models'

require('chromedriver');

const shelfTicket = sdeuc1.models['Shelf'].ticket;

let driver: webdriver.WebDriver;
let name = 'settings_viewer';
let token: string;

describe('device testing', () => {
    beforeAll(async () => {
        driver = await createDriver();
        token = await createTokenFromSlug(sdeuc1.models['Shelf'].slug);
    });

    beforeEach(async () => {
        await driver.navigate().to('https://viewer.shapediver.com/v3/latest/cdn/index.html')
    });

    afterAll(async () => {
        await driver.close();
        await driver.quit();
    })

    const settings = {
        'gridVisibility': {
            defaultValue: true,
            newValue: false,
            location: 'environmentGeometry.gridVisibility'
        },
        'groundPlaneVisibility': {
            defaultValue: true,
            newValue: false,
            location: 'environmentGeometry.groundPlaneVisibility'
        }
    }

    for (let s in settings) {
        const setting = (<any>settings)[s];

        it(name + '_' + s, async () => {
            // check starting default
            const settings1: any = await driver.executeAsyncScript(async (ticket: string, bearerToken: string, cb: any) => {
                const api: typeof API = (<any>window).SDV.api;
                let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
                let session = await api.createSession({ id: 'mySession', bearerToken, ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                cb((<any>window).SDV.settingsEngine.flatten());
            }, shelfTicket, token);
            expect(settings1[setting.location]).toBe(setting.defaultValue);
            await screenshotCompare(await driver.takeScreenshot(), name + '/' + s);
        });

        it(name + '_' + s + 'Change', async () => {
            // check starting default
            const settings1: any = await driver.executeAsyncScript(async (ticket: string, bearerToken: string, s: string, setting: any, cb: any) => {
                const api: typeof API = (<any>window).SDV.api;
                let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
                let session = await api.createSession({ id: 'mySession', bearerToken, ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                (viewer as any)[s] = setting.newValue;
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).SDV.settingsEngine.flatten());
            }, shelfTicket, token, s, setting);
            expect(settings1[setting.location]).toBe(setting.newValue);
            await screenshotCompare(await driver.takeScreenshot(), name + '/' + s + 'Change');
        });

        it(name + '_' + s + 'Check', async () => {
            // check starting default
            const settings1: any = await driver.executeAsyncScript(async (ticket: string, bearerToken: string, cb: any) => {
                const api: typeof API = (<any>window).SDV.api;
                let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
                let session = await api.createSession({ id: 'mySession', bearerToken, ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                cb((<any>window).SDV.settingsEngine.flatten());
            }, shelfTicket, token);
            expect(settings1[setting.location]).toBe(setting.newValue);
            await screenshotCompare(await driver.takeScreenshot(), name + '/' + s + 'Change');
        });

        it(name + '_' + s + 'Reset', async () => {
            // check starting default
            const settings1: any = await driver.executeAsyncScript(async (ticket: string, bearerToken: string, s: string, setting: any, cb: any) => {
                const api: typeof API = (<any>window).SDV.api;
                let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
                let session = await api.createSession({ id: 'mySession', bearerToken, ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                (viewer as any)[s] = setting.defaultValue;
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                await session.saveSettings();
                cb((<any>window).SDV.settingsEngine.flatten());
            }, shelfTicket, token, s, setting);
            expect(settings1[setting.location]).toBe(setting.defaultValue);
            await screenshotCompare(await driver.takeScreenshot(), name + '/' + s);
        });

        it(name + '_' + s + 'ResetCheck', async () => {
            // check starting default
            const settings1: any = await driver.executeAsyncScript(async (ticket: string, bearerToken: string, cb: any) => {
                const api: typeof API = (<any>window).SDV.api;
                let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
                let session = await api.createSession({ id: 'mySession', bearerToken, ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                cb((<any>window).SDV.settingsEngine.flatten());
            }, shelfTicket, token);
            expect(settings1[setting.location]).toBe(setting.defaultValue);
            await screenshotCompare(await driver.takeScreenshot(), name + '/' + s);
        });
    }



});