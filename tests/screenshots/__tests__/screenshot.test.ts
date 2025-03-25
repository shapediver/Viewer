import {afterAll, beforeAll, describe, test} from "@jest/globals";
import * as ShapeDiverViewer from "@shapediver/viewer";
import webdriver from "selenium-webdriver";

import {sdeuc1, sdr7euc1} from "../../general/src/models";
import {createDriver, screenshotCompare} from "../../general/src/setup";

require("chromedriver");
let driver: webdriver.WebDriver;
let name = "screenshot_tests";

describe("device testing", () => {
	beforeAll(async () => {
		driver = await createDriver();
	});

	beforeEach(async () => {
		await driver
			.navigate()
			.to("https://viewer.shapediver.com/v3/latest/test-cdn/index.html");
	});

	afterAll(async () => {
		await driver.close();
		await driver.quit();
	});

	for (let modelDescription of [/*sddev2, sdtest, */ sdeuc1, sdr7euc1]) {
		const backend = modelDescription.backend;

		for (let model in modelDescription.models) {
			const modelTicket = modelDescription.models[model].ticket;
			test(modelDescription.name + "_" + model, async () => {
				// DO SOMETHING WITH THE API
				await driver.executeAsyncScript(
					async (ticket: string, modelViewUrl: string, cb: any) => {
						const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
						let viewer = await SDV.createViewport({
							id: "myViewer",
							canvas: <HTMLCanvasElement>(
								document.getElementById("canvas")
							),
						});
						let session = await SDV.createSession({
							ticket,
							modelViewUrl,
						});

						await new Promise<void>((resolve) => {
							SDV.addListener(
								SDV.EVENTTYPE.RENDERING
									.BEAUTY_RENDERING_FINISHED,
								async () => resolve(),
							);
						});
						cb();
					},
					modelTicket,
					backend,
				);

				// TAKE A SCREENSHOT
				await screenshotCompare(
					await driver.takeScreenshot(),
					name + "/" + modelDescription.name + "/" + model,
				);
			});
		}
	}
});
