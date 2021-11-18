import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import webdriver, { WebDriver } from "selenium-webdriver";
require('chromedriver');
import { api as API } from "@shapediver/viewer"
import { screenshotCompare } from "../../general/src/setup";
import { capabilities as allCapabilities, DesktopCapabilities, MobileCapabilities } from "../../general/src/capabilities";

for (let c = 0; c < allCapabilities.length; c++) {
    let name = 'simple_screenshot';
    const capabilities = Object.assign({ 'name': name, 'build': require('../../../api/api/package.json').version }, allCapabilities[c]);

    if (process.env.PORT !== 'browserstack') {
        name = 'simple_screenshot';
        c = allCapabilities.length;
    } else {
        name = 'simple_screenshot/' + ((allCapabilities[c] as DesktopCapabilities).os ?
            (<DesktopCapabilities>capabilities).os + '_' + (<DesktopCapabilities>capabilities).os_version + '_' + (<DesktopCapabilities>capabilities).browserName + '_' + (<DesktopCapabilities>capabilities).browser_version :
            (<MobileCapabilities>capabilities).device + '_' + (<MobileCapabilities>capabilities).os_version);
    }

    let driver: WebDriver;
    describe('device testing', () => {
        beforeAll(async () => {
            if (process.env.PORT !== 'browserstack') {
                driver = await new webdriver.Builder().withCapabilities(webdriver.Capabilities.chrome()).build();
            } else {
                console.log(capabilities)
                driver = await new webdriver.Builder().usingServer('http://alexanderschiftn1:csj6VCzMwzBYyRecsbm2@hub-cloud.browserstack.com/wd/hub').withCapabilities(capabilities).build();
            }
            await driver.navigate().to('https://viewer.shapediver.com/v3/latest/cdn/index.html')
            const TIMEOUT = 300000000
            await driver.manage().setTimeouts({ implicit: TIMEOUT, pageLoad: TIMEOUT, script: TIMEOUT });
        });

        beforeEach(async () => {
            await driver.navigate().to('https://viewer.shapediver.com/v3/latest/cdn/index.html')
        });

        afterAll(async () => {
            await driver.close();
            await driver.quit();
        })


        const models: { [key: string]: { ticket: string, modelViewUrl: string } } =
        {
            'Coral': {
                ticket: '3017a44322f7cd5dc4e1bfbe4d3e8bfdd9a265fd00c6bf2415f345c28ec76cda9a60a41f41c16af7ddc429ab1d19967469c8a5c3fb73ac8c45288a2a0387a4566ae3d45d2ff44e21493b36be5138e6b7ca92b250b4c7b6f01f7efe120d1e990df4b0237478023040c1965ad40f85043e1c4b1553bb2bc8b45777d9b5fde21f-3655c2562cc577697d3bff8bf250a6fb',
                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com'
            },
            'Donau City': {
                ticket: 'e479c043c7907965e28c5bc422aad1827cbb9a77dde01c72b62b6d9ca8d7d211a9f74ac6c53c21a6029cb1ebc828605721c6bad4734ede24a3a66bc6d60ba8ab39da0a500539e3e182e527df7f8c1c599b2400cdf620168213460239a3034f8dd00f9a4d9cd42dc7b9665b20a4f6e8af51f102a0d414746deeead0984327c9-435d1f500d1f04b76ac49fa7cab2cf4d',
                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com'
            },
            'Material': {
                ticket: '75f6f416a8200ed5d64f9c15f39320df0c9a630878d235332451657e1a1524fa7a39ef96d4a0b866c6ebacbf202b32e5fad90f4fe6a54276d892831f5aa4bc2cbd4cdd73231a2db23055c7a9d6d2707eb329315ab0f8d5a489cdff33b99e9b49ed68af70f4b139c941000063d19fff574b7c3b2b55460eac6ec23a86f3fd0d-a2beded2e997ea7d1d6e9b03cd3c86d1',
                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com'
            },
            'Pointillist': {
                ticket: '3a5d1cb085437aafeafa44dceedb09417b5c82bccfd355f12cf23abc5546b7f697dd7b150b7abd5ee1288e4ef31dc67b7498a6459babaeae4f63ca39afff6b72235052ba0728f785dd36dc55569a0846df3d8162fc29bffbad9fdc0204f7b43c36ca7c7eb44d4ce67a62000ec68bac4c0960c0e360f06ea82b600f895deb6f-ce913db01b16300d5112a5a484cc56a6',
                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com'
            },
            'Perforated Panel': {
                ticket: '1b140110fb009946286d9706db7b576bba76894025ac57b1d3aad48cd34eb58757975053ff1ea08c4cb8dd8b0bf1b526507b981edaf5bf4bf1bdeaec7824f83c2bfb29a21487304eb1a34936d9eb1dc1e90aa45c886b07b1eac73804a021c19e09a1ba52b3217d26d6c191f10090ffef3c46b8eeafa83f2a8b1cfe7a10bc87-978d3eb5e574310fe7d40741623f8a26',
                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com'
            },
            'Sdgtf_All_Types': {
                ticket: 'e96c426ed1b983bb05ceb78145e6da83eaf111e6da9fca3b2c97d8447c3706930df7825932421d14100886f6967059330f25c3c12b08ce47d150bea84ea9fe4f3541ee7b1cbdb16c5735899871155bfddb76d82ff664155530ea143995a317653a5ab2de3799affbcfd3075af2c53cb8e40f26b2eba37d00f71c74c7c1a5ffd8-a23d9dc0e103d57f8ccd89b6f1d1e951',
                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com'
            },
            'Ring': {
                ticket: '61dff41abe9166b08ac7e54e519b71732d001149f139763c5dd8fae91c622811e02ea25f77e9eb89195e720b35c76e320c3f8671336566d9434314deab152aa03b68df31367c949dc03b9d0cd4477dd0a078fe643d35c8997c98af55dc51ee86017c8c513a1ab0840435c6712175dae504cf48eca8f436b134910671d10026-39804597edf047fb68da6d937cd58262',
                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com'
            },
            'Shelf': {
                ticket: 'd7275c4a686c2df9ba75ca6c7e05dc674ae60912c1aa75e478f273dab718cd20b2a269073e03b5810daaf461c82ad990b176d3071776ec0f80fa034bb1e2bc6ee6c99fc82764ad55157bcba7dd1856b18eb0390e2b83c201be16e51de33c356fc6ad73cb3100eeecd3fc48ea5405e7f1c2272088d7-ff5d231fc13c2098c7ed85e51331760e',
                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com'
            },
            'Solar System - Cubes': {
                ticket: 'cbbbcf46757400d733216ff689df5ed9a6831eef95add63449deff35853637171260c362c2b00b1f037eea317620a7c0a816c26cd62e76dd5977fafe997aa8f305bc455fbe2775851f9f51d011e8146881d7143e3089d8b551211b07f9f0b283fa78e77767bdb8bff6a4db8d2a5456e38d9ea108e083898334e75a9dc26856f6-27dd8df325649b7ebff7e42d34f43f13',
                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com'
            },
            'Test model for all supported parameter types': {
                ticket: 'c9f558e0f553bea84f8e540f1c561aff8fad4015b07d89fab2f2048e8b1fae0a3f61d3538ac8a3966f6827cbe4e4cf867c86f60df63d026a2757db15495ccb99b230337cfb21e03697e14d3593d7a8d7b8fc52fc4f142a686104deb6fb2e884a80a827314097ac1a603bd10065a1129efc28719d93fe0d9760ee83187c4f3012-92b182e5dbe03bc50a6f4e1dabf27def',
                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com'
            },
            'test_1': {
                ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8',
                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com'
            },
            '696cf005-1d83-4b00-aa84-e667de6cd164': {
                ticket: 'a0a199a6b6aa158966956f03f911e0b616a45073a09fbd9f1b728ba5dd28613d376dfa51fb25036ed4446b1199fe3c6497590a3a3015ac428360cb433fcac3c0dbe585cdf9a27bb27534ec696d94fb0983ecae931894ad1c7628e415c44520a281cd0ab0663f4a-0e9997a369059b2684364e8819c90485',
                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com'
            },
            'testmissingfaces-12': {
                ticket: '9c8d8ce0cb1a55453706550a4a5ae8a66e6be3011a79e9c6b3a3048734b916729724c990f52e8071dec173df4afb788fc7f973c3799244b9276487ba318baf66071d62a673d48b470559cffb3b84c11b4294ebc492aefa643e8c2d3cc1f8a2906cd0a4ebb954bd-6a440c5597fd51a125823edba5abc055',
                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com'
            },
            'scene1': {
                ticket: 'fa8a747cddbccfe56b7c6dc2aa4424462634142b85580028e58d2fc4908d885032ea1e7c152406b494c7f2c80e123f91c6bb6255a97e14b31799f047f2b80c5d02e271ec78d110824acce9dbea96894697bd953408e6fe188cda073baf9f64c99b77d2eef729ad-1db6cc845746b22b78f20b2397238ddb',
                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com'
            },
            'ad-s-expert-modules-concept-2': {
                ticket: 'c2151e81b60d5965aef31c69f984c8bd52af9ce39353534aed0adb9b5066332c500eec3cd6b6c93296323020f648d90d3e85dbbbf5acf2f7983910e438bc8c39c6247822bc98baabb3de8290f3930deea3a002772e6940592d88c20eeb97584ede9740f1730ae5-0f4816b8f196c0772e755c4a534cb230',
                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com'
            },
            'mansion-1b-v2-1': {
                ticket: 'e997d5214280ac7fb702dbe2cf52d97e0e0ac1acb576336c6e142c3930c9d4d80b31dc1e525eeb052afad1c7209c4711cef6d606cec1831c0203e37863cf94d25b4da62b4ca64d03f84f56a62a0faa04f8b215fe47fe48b8f4ce5ba3b7ed7e7d17342ab65a62d7-34d4fb3aa82eafc4d71f11d4603a67ff',
                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com'
            },
            'structure-jonas-voiles': {
                ticket: '08458854d579b5225b0737857477d20c3de791a8177f04bac699459139eeb94418c4427c24287fc90630f936b3a6b69c8134240e69e7efcc70364cb108426ce69cea2f49b58e729d5fb271d0b8668d4433a32784164979083abaebd098792a65d866c576663fce-039fa84afab6d055b28556c72e871e7d',
                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com'
            },
        };

        for (let m in models) {
            test(name, async () => {

                const { ticket, modelViewUrl } = models[m];

                // DO SOMETHING WITH THE API
                await driver.executeAsyncScript(async (ticket: string, modelViewUrl: string, cb: any) => {
                    const api: typeof API = (<any>window).SDV.api;
                    let viewer = await api.createViewer({ id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
                    let session = await api.createSession({ ticket, modelViewUrl });
                    await new Promise<void>((resolve) => {
                        api.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
                    })
                    cb();
                }, ticket, modelViewUrl);

                // TAKE A SCREENSHOT
                await screenshotCompare(await driver.takeScreenshot(), name + '/' + m);

            });
        }
    });
}
