import {afterAll, beforeAll, describe, test} from "@jest/globals";
import * as ShapeDiverViewer from "@shapediver/viewer";
import webdriver from "selenium-webdriver";

import {sdeuc1} from "../../general/src/models";
import {createDriver, screenshotCompare} from "../../general/src/setup";

require("chromedriver");

const shelfTicket = sdeuc1.models["Shelf"].ticket;
const ringTicket = sdeuc1.models["Ring"].ticket;

let driver: webdriver.WebDriver;
let name = "viewer_restriction";

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

	test(name, async () => {
		await driver.executeAsyncScript(
			async (ticket: string, ticket2: string, cb: any) => {
				const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
				let viewer = await SDV.createViewport({
					branding: {
						logo: "https://viewer.shapediver.com/v3/graphics/logo.png",
					},
					id: "myViewer",
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
				});
				let session1 = await SDV.createSession({
					id: "mySession1",
					ticket: ticket2,
					modelViewUrl: "https://sdeuc1.eu-central-1.shapediver.com",
					excludeViewports: ["myViewer"],
				});
				let session2 = await SDV.createSession({
					id: "mySession2",
					ticket,
					modelViewUrl: "https://sdeuc1.eu-central-1.shapediver.com",
				});
				await new Promise<void>((resolve) => {
					SDV.addListener(
						(<any>window).SDV.EVENTTYPE.RENDERING
							.BEAUTY_RENDERING_FINISHED,
						async () => resolve(),
					);
				});
				cb();
			},
			shelfTicket,
			ringTicket,
		);
		await screenshotCompare(
			await driver.takeScreenshot(),
			name + "/test_1",
		);
	});
});
