import "reflect-metadata"
import puppeteer from 'puppeteer';
import * as FS from 'fs';
import { toMatchImageSnapshot } from 'jest-image-snapshot';

let browser: puppeteer.Browser;
let page: puppeteer.Page;

jest.setTimeout(100000)
expect.extend({ toMatchImageSnapshot });

beforeAll(async () => {
    browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
})

beforeEach(async () => {
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
})

export const getPage = async (name: string): Promise<puppeteer.Page> => {
    // ENABLE THIS FOR CONSOLE OUTPUT
    // FS.writeFile(name+"_log.txt", "", () => { });
    // let outputIDProcessing = 0;
    // let outputID = 0;
    // page.on('console', async message => {
    //     const myOutputID = outputID;
    //     outputID++;
    //     while (myOutputID !== outputIDProcessing) await new Promise((resolve) => { setTimeout(resolve, 50) });
    //     FS.readFile(name+"_log.txt", 'utf8', function (err, data) {
    //         FS.writeFile(name+"_log.txt", data + "\n" + message.text(), 'utf8', () => {
    //             outputIDProcessing++;
    //         });
    //     });
    // })
    await page.goto('http://127.0.0.1:8080/dist-prod/index.html');
    return page;
};

export const screenshotCompare = async (name: string) => {
    const image = await page.screenshot();
    expect(image).toMatchImageSnapshot({
        customSnapshotIdentifier: name,
        failureThreshold: 0.01,
        failureThresholdType: 'percent'
    });
}

afterEach(() => {
    page.close();
})

afterAll(() => {
    browser.close();
})
