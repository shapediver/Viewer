import {jest} from "@jest/globals";
import {toMatchImageSnapshot} from "jest-image-snapshot";
import webdriver from "selenium-webdriver";
import {Options} from "selenium-webdriver/chrome";

jest.setTimeout(3000000); // 3000 seconds
expect.extend({toMatchImageSnapshot});

export const screenshotCompare = async (image: any, name: string) => {
	expect(image).toMatchImageSnapshot({
		customSnapshotIdentifier: name,
		failureThreshold: 0.01,
		failureThresholdType: "percent",
	});
};

export const createDriver = async (): Promise<webdriver.WebDriver> => {
	const opt = new Options();
	opt.addArguments("--disable-search-engine-choice-screen");

	const tempDriver1 = await new webdriver.Builder()
		.setChromeOptions(opt)
		.withCapabilities(webdriver.Capabilities.chrome())
		.build();
	await tempDriver1
		.navigate()
		.to("https://viewer.shapediver.com/v3/latest/test-cdn/index.html");
	const dpr: number = await tempDriver1.executeAsyncScript(
		async (cb: any) => {
			cb((<any>window).devicePixelRatio);
		},
	);
	await tempDriver1.close();
	await tempDriver1.quit();

	opt.excludeSwitches("enable-automation");
	const dprSize = {width: 1920 / dpr, height: 1080 / dpr};
	opt.windowSize(dprSize);
	const tempDriver2 = await new webdriver.Builder()
		.setChromeOptions(opt)
		.withCapabilities(webdriver.Capabilities.chrome())
		.build();
	await tempDriver2
		.navigate()
		.to("https://viewer.shapediver.com/v3/latest/test-cdn/index.html");
	const size: {width: number; height: number} =
		await tempDriver2.executeAsyncScript(async (cb: any) => {
			cb({
				width: (<any>window).innerWidth,
				height: (<any>window).innerHeight,
			});
		});
	await tempDriver2.close();
	await tempDriver2.quit();

	opt.windowSize({
		width: dprSize.width + (dprSize.width - size.width),
		height: dprSize.height + (dprSize.height - size.height),
	});
	const driver = await new webdriver.Builder()
		.setChromeOptions(opt)
		.withCapabilities(webdriver.Capabilities.chrome())
		.build();
	await driver
		.navigate()
		.to("https://viewer.shapediver.com/v3/latest/test-cdn/index.html");
	const TIMEOUT = 3000000;
	await driver
		.manage()
		.setTimeouts({implicit: TIMEOUT, pageLoad: TIMEOUT, script: TIMEOUT});
	return driver;
};
