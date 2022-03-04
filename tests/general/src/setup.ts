import webdriver from 'selenium-webdriver'
import { toMatchImageSnapshot } from 'jest-image-snapshot'
import { Options } from 'selenium-webdriver/chrome'
import { jest } from '@jest/globals'

jest.setTimeout(3000000); // 3000 seconds
expect.extend({ toMatchImageSnapshot });

export const screenshotCompare = async (image: any, name: string) => {
    expect(image).toMatchImageSnapshot({
        customSnapshotIdentifier: name,
        failureThreshold: 0.01,
        failureThresholdType: 'percent'
    });
}

export const createDriver = async (): Promise<webdriver.WebDriver> => {
    const opt = new Options();
    opt.windowSize({width: 800, height: 600});
    const driver = await new webdriver.Builder().setChromeOptions(opt).withCapabilities(webdriver.Capabilities.chrome()).build();
    await driver.navigate().to('https://viewer.shapediver.com/v3/latest/cdn/index.html')
    const TIMEOUT = 300000000
    await driver.manage().setTimeouts({ implicit: TIMEOUT, pageLoad: TIMEOUT, script: TIMEOUT });
    return driver;
}