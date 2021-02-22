import puppeteer from 'puppeteer';

let page: puppeteer.Page;
let browser: puppeteer.Browser;

describe('ShapeDiver', () => {
    beforeAll(async () => {
        browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
        page = await browser.newPage();
        await page.goto('http://127.0.0.1:8080/dist-prod/index.html');
    });

    it('should be titled "ShapeDiver"', async () => {
        await new Promise<void>((resolve) => setTimeout(() => {resolve()}, 2000));

        await page.screenshot({path: 'test.png'});

        await expect(page.title()).resolves.toMatch('ShapeDiver');
        await browser.close();
    });
});