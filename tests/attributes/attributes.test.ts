import {expect, test} from "@playwright/test";
import * as ShapeDiverViewer from "@shapediver/viewer";
import * as ShapeDiverViewerAttributeVisualization from "@shapediver/viewer.features.attribute-visualization";

const name = "attributes";

test.describe("Attribute Visualization", () => {
	test.beforeEach(async ({page}) => {
		await page.goto(
			"https://viewer.shapediver.com/v3/latest/test-cdn/index.html",
		);

		await page.evaluate(async () => {
			const SDV = (<any>window).SDV;
			const SDVAV = (<any>window).SDVAttributeVisualization;
			(<any>window).SDVAV = SDVAV;

			const viewport = await SDV.createViewport({
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
				id: "myViewer",
			});
			await SDV.createSession({
				ticket: "2327f137cfe00be4b3dcb87def2d7906d8575d7b1b8b4e2a225433284e2ac3712203456f10b6b7dca19b645b758c4463c08ce73641d38d85695bf6da5a4d6e85acc5205f33c0611c68b8663a107c4167e9487679386cc9b1319f66633394bc24597c012bad4ce4-109c9925ede0bc853d18abcccfd5d37c",
				modelViewUrl: "https://sdeuc1.eu-central-1.shapediver.com",
				id: "mySession",
				loadSdtf: true,
			});
			viewport.type = SDV.RENDERER_TYPE.ATTRIBUTES;
			const attributeVisualizationEngine =
				new SDVAV.AttributeVisualizationEngine(viewport);
			(<any>window).attributeVisualizationEngine =
				attributeVisualizationEngine;
			await new Promise<void>((resolve) => {
				SDV.addListener(
					SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
					async () => resolve(),
				);
			});
		});
	});

	test("none", async ({page}) => {
		await expect(page).toHaveScreenshot(name + "/none.png");
	});

	test("layer_enable", async ({page}) => {
		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
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
		});
		await expect(page).toHaveScreenshot(name + "/layer_enable.png");
	});

	test("layer_opacity", async ({page}) => {
		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
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
		});
		await expect(page).toHaveScreenshot(name + "/layer_opacity.png");
	});

	test("string_attribute", async ({page}) => {
		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const SDVAV: typeof ShapeDiverViewerAttributeVisualization = (<any>(
				window
			)).SDVAV;
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
		});
		await expect(page).toHaveScreenshot(name + "/string_attribute.png");
	});

	test("number_attribute", async ({page}) => {
		await page.evaluate(async () => {
			const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
			const SDVAV: typeof ShapeDiverViewerAttributeVisualization = (<any>(
				window
			)).SDVAV;
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
		});
		await expect(page).toHaveScreenshot(name + "/number_attribute.png");
	});
});
