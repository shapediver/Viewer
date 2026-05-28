import {expect, test} from "@playwright/test";
import * as ShapeDiverViewer from "@shapediver/viewer";
import * as fs from "fs";
import * as path from "path";

const SUPPORTED_VARIANTS = [
	"glTF",
	"glTF-Binary",
	"glTF-Embedded",
	"glTF-Draco",
	"glTF-Quantized",
];

const modelsJsonPath = path.join(__dirname, "models.json");
const modelsJson: any[] = fs.existsSync(modelsJsonPath)
	? JSON.parse(fs.readFileSync(modelsJsonPath, "utf-8"))
	: [];

const name = "gltf";

const beforeEachSetup = async (page: any) => {
	await page.goto(
		"https://viewer.shapediver.com/v3/latest/test-cdn/index.html",
	);

	await page.evaluate(async () => {
		const SDV = (<any>window).SDV;
		const DataEngine = (<any>window).SDV.DataEngine;

		const viewer = await SDV.createViewport({
			canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			id: "myViewer",
			branding: {
				logo: "https://viewer.shapediver.com/v3/graphics/gltf_monster.png",
				backgroundColor: "rgb(3, 5, 49)",
			},
		});
		viewer.shadows = false;
		viewer.physicallyCorrectLights = true;
		viewer.groundPlaneVisibility = false;
		viewer.gridVisibility = false;
		viewer.environmentMap = SDV.ENVIRONMENT_MAP.NEUTRAL;

		await new Promise<void>((resolve) => {
			SDV.addListener(SDV.EVENTTYPE.TASK.TASK_END, (e: any) => {
				if (e.type === SDV.TASK_TYPE.ENVIRONMENT_MAP_LOADING) resolve();
			});
		});

		let currentNode: any;
		(<any>window).addGLTF = async (uri: string) => {
			const node = await DataEngine.instance.loadContent({
				format: "gltf",
				href: uri,
			});
			if (currentNode) SDV.sceneTree.removeNode(currentNode);
			currentNode = node;
			SDV.sceneTree.addNode(currentNode);
			SDV.sceneTree.root.updateVersion();
			viewer.update();
			await viewer.camera!.set([0, 0, 0], [0, 0, 0], {duration: 0});
			await viewer.camera!.zoomTo(undefined, {duration: 0});
			viewer.show = true;
		};
	});
};

test.describe("glTF", () => {
	test.describe.configure({mode: "parallel"});

	for (const modelJson of modelsJson) {
		if (
			modelJson.name.startsWith("Unicode") ||
			modelJson.name.startsWith("Fox")
		) {
			continue;
		}

		for (const variant of Object.keys(modelJson.variants)) {
			if (!SUPPORTED_VARIANTS.includes(variant)) continue;

			const testName = `${variant}_${modelJson.name}`;
			const modelName = modelJson.name;
			const variantFilename = modelJson.variants[variant];

			test(testName, async ({page}) => {
				await beforeEachSetup(page);

				await page.evaluate(
					async ({
						modelName,
						variant,
						variantFilename,
					}: {
						modelName: string;
						variant: string;
						variantFilename: string;
					}) => {
						await (<any>window).addGLTF(
							`https://raw.githubusercontent.com/shapediver/glTF-Sample-Models/master/2.0/${modelName}/${variant}/${variantFilename}`,
						);
						const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
						await new Promise<void>((resolve) => {
							SDV.addListener(
								SDV.EVENTTYPE.RENDERING
									.BEAUTY_RENDERING_FINISHED,
								async () => resolve(),
							);
						});
					},
					{modelName, variant, variantFilename},
				);

				await expect(page).toHaveScreenshot(
					name + "/gltf_2.0/" + testName + ".png",
				);
			});
		}
	}
});
