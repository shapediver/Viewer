import {afterAll, beforeAll, describe, test} from "@jest/globals";
import * as ShapeDiverViewer from "@shapediver/viewer";
import webdriver from "selenium-webdriver";

import {createDriver, screenshotCompare} from "../../general/src/setup";

require("chromedriver");

let driver: webdriver.WebDriver;
let name = "geometry_tests";
let modelsJson: any;

describe("device testing", () => {
	beforeAll(async () => {
		driver = await createDriver();
		modelsJson = await driver.executeAsyncScript(async (cb: any) => {
			cb(
				await (
					await fetch(
						"https://raw.githubusercontent.com/shapediver/glTF-Sample-Models/master/2.0/model-index.json",
					)
				).json(),
			);
		});
	});

	beforeEach(async () => {
		await driver
			.navigate()
			.to("https://viewer.shapediver.com/v3/latest/test-gltf/index.html");
	});

	afterAll(async () => {
		await driver.close();
		await driver.quit();
	});

	test(name, async () => {
		for (let i = 0; i < modelsJson.length; i++) {
			const modelJson: any = modelsJson[i];
			if (modelJson.name.startsWith("Unicode")) {
				console.log(
					"Unicode tests not supported. Webdriver cannot handle them.",
				);
				continue;
			}

			for (let variant in modelJson.variants) {
				if (
					![
						"glTF",
						"glTF-Binary",
						"glTF-Embedded",
						"glTF-Draco",
						"glTF-Quantized",
					].includes(variant)
				) {
					console.log("Variant " + variant + " not supported.");
					continue;
				}

				const modelName = variant + "_" + modelJson.name;

				await driver.executeAsyncScript(
					async (name: string, variant: string, cb: any) => {
						await (<any>window).addGLTF(
							`https://raw.githubusercontent.com/shapediver/glTF-Sample-Models/master/2.0/${name}/${variant}/${name}.${variant === "glTF-Binary" ? "glb" : "gltf"}`,
						);
						const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
						await new Promise<void>((resolve) => {
							SDV.addListener(
								SDV.EVENTTYPE.RENDERING
									.BEAUTY_RENDERING_FINISHED,
								async () => resolve(),
							);
						});
						cb();
					},
					modelJson.name,
					variant,
				);

				// TAKE A SCREENSHOT
				await screenshotCompare(
					await driver.takeScreenshot(),
					name + "/gltf_2.0/" + modelName,
				);
			}
		}
	});
});
