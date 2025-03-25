import {afterAll, beforeAll, describe, test} from "@jest/globals";
import * as ShapeDiverViewer from "@shapediver/viewer";
import webdriver from "selenium-webdriver";

import {sdeuc1} from "../../general/src/models";
import {createDriver, screenshotCompare} from "../../general/src/setup";

require("chromedriver");
const shelfTicket = sdeuc1.models["Shelf"].ticket;
const ringTicket = sdeuc1.models["Ring"].ticket;

let driver: webdriver.WebDriver;
let name = "session_closing";

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
		await driver.executeAsyncScript(async (ticket: string, cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			let viewer = await SDV.createViewport({
				branding: {
					logo: "https://viewer.shapediver.com/v3/graphics/logo.png",
				},
				id: "myViewer",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			let session = await SDV.createSession({
				id: "mySession",
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
		}, shelfTicket);
		await screenshotCompare(await driver.takeScreenshot(), name + "/1_1");

		await driver.executeAsyncScript(async (cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			await SDV.sessions["mySession"].close();
			cb();
		});
		await screenshotCompare(await driver.takeScreenshot(), name + "/1_2");

		await driver.executeAsyncScript(async (ticket2: string, cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			let session1 = await SDV.createSession({
				id: "mySession1",
				ticket: ticket2,
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
		}, ringTicket);
		await screenshotCompare(await driver.takeScreenshot(), name + "/1_3");
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
		await screenshotCompare(await driver.takeScreenshot(), name + "/2_1");

		await driver.executeAsyncScript(async (cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			await SDV.sessions["mySession1"].close();
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
			cb();
		});
		await screenshotCompare(await driver.takeScreenshot(), name + "/2_2");

		await driver.executeAsyncScript(async (cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			await SDV.sessions["mySession2"].close();
			cb();
		});
		await screenshotCompare(await driver.takeScreenshot(), name + "/2_3");
	});

	test(name, async () => {
		await driver.executeAsyncScript(async (ticket: string, cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			let viewer = await SDV.createViewport({
				branding: {
					logo: "https://viewer.shapediver.com/v3/graphics/logo.png",
				},
				id: "myViewer",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			let session = await SDV.createSession({
				id: "mySession",
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
		}, shelfTicket);
		await screenshotCompare(await driver.takeScreenshot(), name + "/3_1");

		await driver.executeAsyncScript(async (cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			await SDV.sessions["mySession"].close();
			cb();
		});
		await screenshotCompare(await driver.takeScreenshot(), name + "/3_2");

		await driver.executeAsyncScript(async (ticket2: string, cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			let session1 = await SDV.createSession({
				id: "mySession1",
				ticket: ticket2,
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
		}, ringTicket);
		await screenshotCompare(await driver.takeScreenshot(), name + "/3_3");
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
		await screenshotCompare(await driver.takeScreenshot(), name + "/4_1");

		await driver.executeAsyncScript(async (cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			await SDV.sessions["mySession1"].close();
			await new Promise<void>((resolve) => {
				SDV.addListener(
					(<any>window).SDV.EVENTTYPE.RENDERING
						.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
			cb();
		});
		await screenshotCompare(await driver.takeScreenshot(), name + "/4_2");

		await driver.executeAsyncScript(async (cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			await SDV.sessions["mySession2"].close();
			cb();
		});
		await screenshotCompare(await driver.takeScreenshot(), name + "/4_3");
	});

	// removed due to race condition
	// test(name, async () => {
	//     await driver.executeAsyncScript(async (ticket: string, cb: any) => {
	//         const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
	//         let viewer = await SDV.createViewport({
	//             branding: { logo: 'https://viewer.shapediver.com/v3/graphics/logo.png' }, id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
	//         let session2 = await SDV.createSession({ waitForOutputs: false, id: 'mySession2', ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
	//         cb();
	//     }, shelfTicket);
	//     await screenshotCompare(await driver.takeScreenshot(), name + '/5_1');
	// });

	test(name, async () => {
		await driver.executeAsyncScript(async (ticket: string, cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			let viewer = await SDV.createViewport({
				branding: {
					logo: "https://viewer.shapediver.com/v3/graphics/logo.png",
				},
				id: "myViewer",
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			});
			let session2 = await SDV.createSession({
				waitForOutputs: false,
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
		}, shelfTicket);
		await screenshotCompare(await driver.takeScreenshot(), name + "/6_1");
	});
});
