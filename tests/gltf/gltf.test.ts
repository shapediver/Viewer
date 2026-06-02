import {Page, test as base, expect} from "@playwright/test";
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

/**
 * Worker-scoped fixture: the browser context and page are created once per Playwright worker
 * and reused across all gltf tests assigned to that worker. This eliminates the ~7s
 * page.goto() + viewer init overhead per test (220 tests * 7s / 8 workers ~= 3 min saved).
 *
 * Tests on the same worker run sequentially and share the same viewer instance. addGLTF()
 * removes the previous scene node and adds the new one, effectively resetting the scene
 * without a full page reload.
 *
 * Note: toHaveScreenshot is called with {animations: "allow"} so it does not patch
 * requestAnimationFrame. Patching rAF would break the rendering loop for subsequent tests
 * on the same shared page. The canvas is stable because BEAUTY_RENDERING_FINISHED has
 * already been awaited before the screenshot call.
 */
const test = base.extend<{}, {workerPage: Page}>({
	workerPage: [
		async ({browser}, use) => {
			const context = await browser.newContext({
				viewport: {width: 1280, height: 720},
				deviceScaleFactor: 1,
			});
			const page = await context.newPage();

			await page.goto(
				"https://viewer.shapediver.com/v3/latest/test-cdn/index.html",
			);

			await page.evaluate(async () => {
				const SDV = (<any>window).SDV;
				const DataEngine = (<any>window).SDV.DataEngine;

				const viewer = await SDV.createViewport({
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					id: "myViewer",
					branding: {
						logo: "https://viewer.shapediver.com/v3/graphics/gltf_monster.png",
						backgroundColor: "rgb(3, 5, 49)",
					},
				});
				viewer.beautyRenderDelay = 100;
				viewer.beautyRenderBlendingDuration = 100;
				viewer.shadows = false;
				viewer.physicallyCorrectLights = true;
				viewer.groundPlaneVisibility = false;
				viewer.gridVisibility = false;
				viewer.environmentMap = SDV.ENVIRONMENT_MAP.NEUTRAL;

				await new Promise<void>((resolve) => {
					SDV.addListener(SDV.EVENTTYPE.TASK.TASK_END, (e: any) => {
						if (e.type === SDV.TASK_TYPE.ENVIRONMENT_MAP_LOADING)
							resolve();
					});
				});

				let currentNode: any;
				(<any>window).addGLTF = async (uri: string) => {
					const node = await DataEngine.instance.loadContent({
						format: "gltf",
						href: uri,
					});
					// Register BEFORE dirtying the scene so the event can't be missed
					const renderingP = new Promise<void>((resolve) => {
						SDV.addListener(
							SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
							() => resolve(),
						);
					});
					if (currentNode) SDV.sceneTree.removeNode(currentNode);
					currentNode = node;
					SDV.sceneTree.addNode(currentNode);
					SDV.sceneTree.root.updateVersion();
					viewer.show = true;
					await viewer.camera!.zoomTo(undefined, {duration: 0});
					await renderingP;
				};
			});

			await use(page);
			await context.close();
		},
		{scope: "worker"},
	],
});

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

			test(testName, async ({workerPage}) => {
				await workerPage.evaluate(
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
					},
					{modelName, variant, variantFilename},
				);

				// Use animations:"allow" so toHaveScreenshot does not patch requestAnimationFrame,
				// which would break the rendering loop for subsequent tests on the same shared page.
				// The canvas is already stable because BEAUTY_RENDERING_FINISHED was awaited above.
				await expect(workerPage).toHaveScreenshot(
					name + "/gltf_2.0/" + testName + ".png",
					{animations: "allow"},
				);
			});
		}
	}
});
