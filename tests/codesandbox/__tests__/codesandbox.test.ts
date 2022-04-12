import webdriver, { By } from 'selenium-webdriver'
import { afterAll, beforeAll, describe, expect, test } from '@jest/globals'

import { createDriver, screenshotCompare } from '../../general/src/setup'

require('chromedriver');
let driver: webdriver.WebDriver;
let name = 'codesandbox_tests';
let actions: webdriver.Actions;

describe('device testing', () => {
    beforeAll(async () => {
        driver = await createDriver();
    });

    afterAll(async () => {
        await driver.close();
        await driver.quit();
    })

    // https://codesandbox.io/s/38jb7p
    // https://codesandbox.io/s/5k2pzj
    // https://codesandbox.io/s/ksd9rj
    // https://codesandbox.io/s/l9vbrl
    // https://codesandbox.io/s/byps1d
    // https://codesandbox.io/s/77loks
    // https://codesandbox.io/s/lqxuz0
    // https://codesandbox.io/s/c3ktw0
    // https://codesandbox.io/s/12w4yt

    test('csb_screenshot', async () => {
        const csb = ['0l2ry7', '542nh', 'vnoy7', 'ri4i6j', 'f1tzg', 'xi26s3', 'gzekxl', 'c42f6t', '8yloh2', '2n1ewj', 'ld917', '3sik8', '0y4g50', 'ps1h2m', '1p5iqr', 'mvrwsw', '7bifbr', 'u1is14', '3uzl3f', 'n5fz0i', 'nthqrt', 'fulxod', 'p067cn', 's4brw7', 'nolu01', '8hjyjl', 'vm7v5r', 'sxxbz0', '5k1r0f', '9ojnfz', 'emi7lk', 'gmv34s', 'k652x0']
        for (let i = 0; i < csb.length; i++) {
            const model = csb[i];
            await driver.navigate().to('https://' + model + '.csb.app/');
            await new Promise<void>(resolve => setTimeout(resolve, 15000));
            await screenshotCompare(await driver.takeScreenshot(), name + '/csb_screenshot/' + model);
        }
    });

    test('csb_selection', async () => {
        const csb = ['l3r3gv', 'rn4m7r', '7effk4', 'btbrku', 'qbx6mh']
        for (let i = 0; i < csb.length; i++) {
            const model = csb[i];
            await driver.navigate().to('https://' + model + '.csb.app/');
            await new Promise<void>(resolve => setTimeout(resolve, 15000));
            actions = driver.actions({ async: true, bridge: true });

            let canvas = driver.findElement(By.id('canvas'));
            await actions.move({ origin: canvas }).press().pause(1000).release().pause(1000).perform()
            await actions.clear()
            await screenshotCompare(await driver.takeScreenshot(), name + '/csb_selection/' + model + "_selection");
            
            await actions.move({ origin: canvas }).move({x: 400, y: 400}).press().pause(1000).release().pause(1000).perform()
            await actions.clear()
            await screenshotCompare(await driver.takeScreenshot(), name + '/csb_selection/' + model + "_deselection");

        }
    });

    test('csb_dragging', async () => {
        const csb = ['yu4xtq', 'oquxu7', 'occdmh', 'mjt8lj', 'cqtfp7', 'mwqhf9']
        for (let i = 0; i < csb.length; i++) {
            const model = csb[i];
            await driver.navigate().to('https://' + model + '.csb.app/');
            await new Promise<void>(resolve => setTimeout(resolve, 15000));
            actions = driver.actions({ async: true, bridge: true });

            let canvas = driver.findElement(By.id('canvas'));
            await screenshotCompare(await driver.takeScreenshot(), name + '/csb_dragging/' + model + "_before");
            await actions.move({ origin: canvas }).press().move({x: 0, y: 600, duration: 1}).release().perform()
            await actions.clear()
            await screenshotCompare(await driver.takeScreenshot(), name + '/csb_dragging/' + model + "_after");

        }
    });

});
