import {afterAll, beforeAll, describe, test} from "@jest/globals";
import webdriver, {By} from "selenium-webdriver";

import {createDriver, screenshotCompare} from "../../general/src/setup";

require("chromedriver");
let actions: webdriver.Actions;
let driver: webdriver.WebDriver;
let name = "interaction_tests";

describe("device testing", () => {
	beforeAll(async () => {
		driver = await createDriver();
	});

	beforeEach(async () => {
		await driver
			.navigate()
			.to(
				"https://viewer.shapediver.com/v3/latest/test-interaction/index.html",
			);
	});

	afterAll(async () => {
		await driver.close();
		await driver.quit();
	});

	test(name, async () => {
		// DO SOMETHING WITH THE API
		await driver.executeAsyncScript(async (cb: any) => {
			//const api: typeof API = (<any>window).api;
			await new Promise((resolve) => setTimeout(resolve, 1000));
			cb();
		});

		let bottomImage = driver.findElement(By.id("bottom"));
		actions = driver.actions({async: true, bridge: true});

		const factor = 0.75;

		// await actions.move({ origin: bottomImage }).press().pause(1000).release().pause(1000).perform()
		// await actions.clear()
		await actions
			.move({origin: bottomImage})
			.press()
			.pause(1000)
			.move({x: Math.round(640 * factor), y: Math.round(380 * factor)})
			.release()
			.pause(1000)
			.perform();
		await actions.clear();
		await actions
			.move({origin: bottomImage})
			.press()
			.pause(1000)
			.move({x: Math.round(840 * factor), y: Math.round(450 * factor)})
			.release()
			.pause(1000)
			.perform();
		await actions.clear();
		await actions
			.move({origin: bottomImage})
			.press()
			.pause(1000)
			.move({x: Math.round(540 * factor), y: Math.round(400 * factor)})
			.release()
			.pause(1000)
			.perform();
		await actions.clear();

		let topImage = driver.findElement(By.id("top"));
		actions = driver.actions({async: true, bridge: true});

		await actions
			.move({origin: topImage})
			.press()
			.pause(1000)
			.move({x: Math.round(640 * factor), y: Math.round(300 * factor)})
			.release()
			.pause(1000)
			.perform();
		await actions.clear();
		await actions
			.move({origin: topImage})
			.press()
			.pause(1000)
			.move({x: Math.round(850 * factor), y: Math.round(380 * factor)})
			.release()
			.pause(1000)
			.perform();
		await actions.clear();
		await actions
			.move({origin: topImage})
			.press()
			.pause(1000)
			.move({x: Math.round(540 * factor), y: Math.round(300 * factor)})
			.release()
			.pause(1000)
			.perform();
		await actions.clear();

		await driver.executeAsyncScript(async (cb: any) => {
			//const api: typeof API = (<any>window).api;
			await new Promise((resolve) => setTimeout(resolve, 1000));
			cb();
		});

		await screenshotCompare(
			await driver.takeScreenshot(),
			name + "/interaction",
		);
	});
});
