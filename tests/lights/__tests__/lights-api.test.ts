import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import webdriver, { WebDriver } from "selenium-webdriver";
require('chromedriver');
import { api as API } from "@shapediver/viewer"
import { screenshotCompare } from "../../general/src/setup";
import { sdeuc1 } from "../../general/src/models";
import { createTokenFromSlug } from "../../general/src/utils";

let name = 'lights_api_tests';
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
        // await driver.executeAsyncScript(async (ticket: string, bearerToken: string, cb: any) => {
        //     const api: typeof API = (<any>window).SDV.api;
        //     let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
        //     let session = await api.createSession({ id: 'mySession', ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com', bearerToken });

        //     for(let ls in viewer.lightScenes)
        //         viewer.removeLightScene(ls);

        //     viewer.createLightScene({name: 'standard', standard: true})
        //     viewer.update();
        //     await session.saveSettings();
        //     cb();
        // }, shelfTicket, token);


        await driver.close();
        await driver.quit();
    })

    it(name + '_default', async () => {
        await driver.executeAsyncScript(async (ticket: string, bearerToken: string, cb: any) => {
            const api: typeof API = (<any>window).SDV.api;
            let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await api.createSession({ 
                ticket, 
                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
                bearerToken
            });
            await session.saveSettings();
            cb();
        }, shelfTicket, token);
        await screenshotCompare(await driver.takeScreenshot(), name + '/default');
    });

    it(name + '_createNewLightScene', async () => {
        await driver.executeAsyncScript(async (ticket: string, bearerToken: string, cb: any) => {
            const api: typeof API = (<any>window).SDV.api;
            let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await api.createSession({ 
                ticket, 
                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
                bearerToken
            }); 
            viewer.createLightScene({name: 'test1'});
            viewer.createLightScene({name: 'test2'});
            viewer.createLightScene({name: 'test3'});
            viewer.assignLightScene('standard');
            await session.saveSettings();
            cb();
        }, shelfTicket, token);
        await screenshotCompare(await driver.takeScreenshot(), name + '/default');
    });

    
    it(name + '_createNewLightSceneCount', async () => {
        const r:any = await driver.executeAsyncScript(async (ticket: string, bearerToken: string, cb: any) => {
            const api: typeof API = (<any>window).SDV.api;
            let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await api.createSession({ 
                ticket, 
                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
                bearerToken
            }); 
            cb(Object.keys(viewer.lightScenes).length);
        }, shelfTicket, token);
        expect(r).toBe(4);
    });

    it(name + '_lightScene1Adjustments', async () => {
        await driver.executeAsyncScript(async (ticket: string, bearerToken: string, cb: any) => {
            const api: typeof API = (<any>window).SDV.api;
            let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await api.createSession({ 
                ticket, 
                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
                bearerToken
            }); 
            viewer.assignLightScene('test1');
            viewer.lightScene!.addAmbientLight({color: '#ff0000'})
            cb();
        }, shelfTicket, token);
        await screenshotCompare(await driver.takeScreenshot(), name + '/test1');
    });
    
    it(name + '_lightScene2Adjustments', async () => {
        await driver.executeAsyncScript(async (ticket: string, bearerToken: string, cb: any) => {
            const api: typeof API = (<any>window).SDV.api;
            let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await api.createSession({ 
                ticket, 
                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
                bearerToken
            }); 
            viewer.assignLightScene('test2');
            viewer.lightScene!.addDirectionalLight({color: '#00ff00'})
            cb();
        }, shelfTicket, token);
        await screenshotCompare(await driver.takeScreenshot(), name + '/test2');
    });
    
    it(name + '_lightScene3Adjustments', async () => {
        await driver.executeAsyncScript(async (ticket: string, bearerToken: string, cb: any) => {
            const api: typeof API = (<any>window).SDV.api;
            let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await api.createSession({ 
                ticket, 
                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
                bearerToken
            }); 
            viewer.assignLightScene('test3');
            viewer.lightScene!.addPointLight({color: '#0000ff'})
            cb();
        }, shelfTicket, token);
        await screenshotCompare(await driver.takeScreenshot(), name + '/test3');
    });

    it(name + '_deleteNewLightScene', async () => {
        await driver.executeAsyncScript(async (ticket: string, bearerToken: string, cb: any) => {
            const api: typeof API = (<any>window).SDV.api;
            let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await api.createSession({ 
                ticket, 
                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
                bearerToken
            }); 
            for(let ls in viewer.lightScenes)
                viewer.removeLightScene(ls);

            viewer.createLightScene({name: 'standard', standard: true});
            await session.saveSettings();
            cb();
        }, shelfTicket, token);
        await screenshotCompare(await driver.takeScreenshot(), name + '/default');
    });

    it(name + '_checkDefaultLightScene', async () => {
        const r:any = await driver.executeAsyncScript(async (ticket: string, bearerToken: string, cb: any) => {
            const api: typeof API = (<any>window).SDV.api;
            let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await api.createSession({ 
                ticket, 
                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
                bearerToken
            }); 
            cb(Object.keys(viewer.lightScenes).length);
        }, shelfTicket, token);
        expect(r).toBe(1);
    });
});
