import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import webdriver, { WebDriver } from "selenium-webdriver";
require('chromedriver');
import { api as API, PerspectiveCamera, PerspectiveCameraControls} from "@shapediver/viewer"
import { screenshotCompare } from "../../general/src/setup";
import { capabilities as allCapabilities, DesktopCapabilities, MobileCapabilities } from "../../general/src/capabilities";

for(let c = 0; c < allCapabilities.length; c++) {
    let name = 'geometry_tests';
    const capabilities = Object.assign({ 'name': 'geometry_tests', 'build': require('../../../api/api/package.json').version }, allCapabilities[c]);

    if(process.env.PORT !== 'browserstack') {
        name = 'geometry_tests';
        c = allCapabilities.length;
    } else {
        name = 'geometry_tests/' + ((allCapabilities[c] as DesktopCapabilities).os ? 
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
        
        test(name, async () => {
            // DO SOMETHING WITH THE API
            await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).SDV.api; 
                let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
                let session = await api.createSession({ ticket: 'e479c043c7907965e28c5bc422aad1827cbb9a77dde01c72b62b6d9ca8d7d211a9f74ac6c53c21a6029cb1ebc828605721c6bad4734ede24a3a66bc6d60ba8ab39da0a500539e3e182e527df7f8c1c599b2400cdf620168213460239a3034f8dd00f9a4d9cd42dc7b9665b20a4f6e8af51f102a0d414746deeead0984327c9-435d1f500d1f04b76ac49fa7cab2cf4d', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });

                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                cb();
            });
            
            // TAKE A SCREENSHOT
            await screenshotCompare(await driver.takeScreenshot(), name + '/donau_city');
        });

        test(name, async () => {
            // DO SOMETHING WITH THE API
            await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).SDV.api; 
                let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
                let session = await api.createSession({ ticket: '3a5d1cb085437aafeafa44dceedb09417b5c82bccfd355f12cf23abc5546b7f697dd7b150b7abd5ee1288e4ef31dc67b7498a6459babaeae4f63ca39afff6b72235052ba0728f785dd36dc55569a0846df3d8162fc29bffbad9fdc0204f7b43c36ca7c7eb44d4ce67a62000ec68bac4c0960c0e360f06ea82b600f895deb6f-ce913db01b16300d5112a5a484cc56a6', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });

                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                cb();
            });
            
            // TAKE A SCREENSHOT
            await screenshotCompare(await driver.takeScreenshot(), name + '/points');
        });

        
        test(name, async () => {
            // DO SOMETHING WITH THE API
            await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).SDV.api; 
                let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
                let session = await api.createSession({ ticket: '1b140110fb009946286d9706db7b576bba76894025ac57b1d3aad48cd34eb58757975053ff1ea08c4cb8dd8b0bf1b526507b981edaf5bf4bf1bdeaec7824f83c2bfb29a21487304eb1a34936d9eb1dc1e90aa45c886b07b1eac73804a021c19e09a1ba52b3217d26d6c191f10090ffef3c46b8eeafa83f2a8b1cfe7a10bc87-978d3eb5e574310fe7d40741623f8a26', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });

                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                cb();
            });
            
            // TAKE A SCREENSHOT
            await screenshotCompare(await driver.takeScreenshot(), name + '/external');
        });

        test(name, async () => {
            // DO SOMETHING WITH THE API
            await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).SDV.api; 
                let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
                let session = await api.createSession({ ticket: 'e96c426ed1b983bb05ceb78145e6da83eaf111e6da9fca3b2c97d8447c3706930df7825932421d14100886f6967059330f25c3c12b08ce47d150bea84ea9fe4f3541ee7b1cbdb16c5735899871155bfddb76d82ff664155530ea143995a317653a5ab2de3799affbcfd3075af2c53cb8e40f26b2eba37d00f71c74c7c1a5ffd8-a23d9dc0e103d57f8ccd89b6f1d1e951', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });

                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                cb();
            });
            
            // TAKE A SCREENSHOT
            await screenshotCompare(await driver.takeScreenshot(), name + '/sdgtf');
        });

        
        test(name, async () => {
            // DO SOMETHING WITH THE API
            await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).SDV.api; 
                let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
                let session = await api.createSession({ ticket: 'c9f558e0f553bea84f8e540f1c561aff8fad4015b07d89fab2f2048e8b1fae0a3f61d3538ac8a3966f6827cbe4e4cf867c86f60df63d026a2757db15495ccb99b230337cfb21e03697e14d3593d7a8d7b8fc52fc4f142a686104deb6fb2e884a80a827314097ac1a603bd10065a1129efc28719d93fe0d9760ee83187c4f3012-92b182e5dbe03bc50a6f4e1dabf27def', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });

                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                cb();
            });
            
            // TAKE A SCREENSHOT
            await screenshotCompare(await driver.takeScreenshot(), name + '/all_types');
        });
        
        test(name, async () => {
            // DO SOMETHING WITH THE API
            await driver.executeAsyncScript(async (cb: any) => {
                const api: typeof API = (<any>window).SDV.api; 
                let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
                let session = await api.createSession({id: 'mySession',  ticket: 'cbbbcf46757400d733216ff689df5ed9a6831eef95add63449deff35853637171260c362c2b00b1f037eea317620a7c0a816c26cd62e76dd5977fafe997aa8f305bc455fbe2775851f9f51d011e8146881d7143e3089d8b551211b07f9f0b283fa78e77767bdb8bff6a4db8d2a5456e38d9ea108e083898334e75a9dc26856f6-27dd8df325649b7ebff7e42d34f43f13', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });

                await new Promise<void>((resolve) => {
                    api.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                })
                cb();
            });

            for(let i = 0; i < 9; i++) {
                await driver.executeAsyncScript(async (i: number, cb: any) => {
                    const api: typeof API = (<any>window).SDV.api; 
                    api.sessions["mySession"].parameters["d5fa299b-d1f8-481e-b095-77ebd4c19e1e"].value = i+'';
                    await api.sessions["mySession"].customize();
                    await new Promise<void>((resolve) => {
                        api.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                    })
                    cb();
                }, i);

                // TAKE A SCREENSHOT
                await screenshotCompare(await driver.takeScreenshot(), name + '/plugins_' + i);
            }
            
        });
    });
}
