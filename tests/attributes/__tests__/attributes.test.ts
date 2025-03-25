import {afterAll, beforeAll, describe, test} from "@jest/globals";
import * as ShapeDiverViewer from "@shapediver/viewer";
import * as ShapeDiverViewerAttributeVisualization from "@shapediver/viewer.features.attribute-visualization";
import webdriver from "selenium-webdriver";

import {createDriver, screenshotCompare} from "../../general/src/setup";

require("chromedriver");

let name = "attribute_tests";
let driver: webdriver.WebDriver;

describe("device testing", () => {
	beforeAll(async () => {
		driver = await createDriver();
	});

	beforeEach(async () => {
		await driver
			.navigate()
			.to(
				"https://viewer.shapediver.com/v3/latest/test-attribute-visualization/index.html",
			);
	});

	afterAll(async () => {
		await driver.close();
		await driver.quit();
	});

	test(name + "_none", async () => {
		const r: any = await driver.executeAsyncScript(async (cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			await new Promise<void>((resolve) => {
				SDV.addListener(
					SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
			cb();
		});
		await screenshotCompare(await driver.takeScreenshot(), name + "/none");
	});

	test(name + "_layer_enable", async () => {
		const r: any = await driver.executeAsyncScript(async (cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			await new Promise<void>((resolve) => {
				SDV.addListener(
					SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
			const attributeVisualizationEngine = (<any>window)
				.attributeVisualizationEngine;
			attributeVisualizationEngine.layers["pinky"].enabled = false;
			attributeVisualizationEngine.updateLayers(
				attributeVisualizationEngine.layers,
			);

			await new Promise<void>((resolve) => {
				SDV.addListener(
					SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
			cb();
		});
		await screenshotCompare(
			await driver.takeScreenshot(),
			name + "/layer_enable",
		);
	});

	test(name + "_layer_opacity", async () => {
		const r: any = await driver.executeAsyncScript(async (cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			await new Promise<void>((resolve) => {
				SDV.addListener(
					SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
			const attributeVisualizationEngine = (<any>window)
				.attributeVisualizationEngine;
			attributeVisualizationEngine.layers["pinky"].opacity = 0;
			attributeVisualizationEngine.updateLayers(
				attributeVisualizationEngine.layers,
			);

			await new Promise<void>((resolve) => {
				SDV.addListener(
					SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
			cb();
		});
		await screenshotCompare(
			await driver.takeScreenshot(),
			name + "/layer_opacity",
		);
	});

	test(name + "_string_attribute", async () => {
		const r: any = await driver.executeAsyncScript(async (cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const SDVAV: typeof ShapeDiverViewerAttributeVisualization = (<any>(
				window
			)).SDVAV;
			await new Promise<void>((resolve) => {
				SDV.addListener(
					SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
			const attributeVisualizationEngine = (<any>window)
				.attributeVisualizationEngine;
			attributeVisualizationEngine.updateAttributes([
				{
					key: "x+y, string",
					type: SDV.SDTF_TYPEHINT.STRING,
					visualization:
						SDVAV.ATTRIBUTE_VISUALIZATION.GREEN_WHITE_RED,
				},
			]);

			await new Promise<void>((resolve) => {
				SDV.addListener(
					SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
			cb();
		});
		await screenshotCompare(
			await driver.takeScreenshot(),
			name + "/string_attribute",
		);
	});

	test(name + "_number_attribute", async () => {
		const r: any = await driver.executeAsyncScript(async (cb: any) => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const SDVAV: typeof ShapeDiverViewerAttributeVisualization = (<any>(
				window
			)).SDVAV;
			await new Promise<void>((resolve) => {
				SDV.addListener(
					SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
			const attributeVisualizationEngine = (<any>window)
				.attributeVisualizationEngine;
			attributeVisualizationEngine.updateAttributes([
				{
					key: "x+y, number",
					type: SDV.SDTF_TYPEHINT.DOUBLE,
					visualization:
						SDVAV.ATTRIBUTE_VISUALIZATION.GREEN_WHITE_RED,
				},
			]);

			await new Promise<void>((resolve) => {
				SDV.addListener(
					SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
			cb();
		});
		await screenshotCompare(
			await driver.takeScreenshot(),
			name + "/number_attribute",
		);
	});
});
