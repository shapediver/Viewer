import {Page, test as base, expect} from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

/**
 * Gem absorption by path length (SS-10496): the gem material properties
 * `attenuationColor` and `attenuationDistance`. The stones are the generated
 * pave asset of the instancing tests, served via request interception.
 */

const ASSET_HOST = "https://gem-assets.viewertests.invalid";
const STONES = `${ASSET_HOST}/pave-stones.glb`;
const assetsDir = path.join(__dirname, "..", "instancing", "assets");

/** Emerald-like absorption: red and blue are absorbed, green passes. */
const GREEN = "#20c040";

const test = base.extend<Record<string, never>, {workerPage: Page}>({
	workerPage: [
		async ({browser}, use) => {
			const context = await browser.newContext({
				viewport: {width: 800, height: 600},
				deviceScaleFactor: 1,
			});
			const page = await context.newPage();

			await page.route(`${ASSET_HOST}/**`, async (route) => {
				const url = new URL(route.request().url());
				const assetPath = path.join(
					assetsDir,
					path.basename(url.pathname),
				);
				if (!fs.existsSync(assetPath)) {
					await route.fulfill({status: 404});
					return;
				}
				await route.fulfill({
					status: 200,
					contentType: "model/gltf-binary",
					body: fs.readFileSync(assetPath),
				});
			});

			await page.goto("test-cdn/index.html");

			await page.evaluate(async () => {
				const SDV = (<any>window).SDV;
				const DataEngine = SDV.DataEngine;

				const viewer = await SDV.createViewport({
					canvas: <HTMLCanvasElement>(
						document.getElementById("canvas")
					),
					id: "myViewer",
					branding: {backgroundColor: "#000000"},
				});
				viewer.beautyRenderDelay = 100;
				viewer.beautyRenderBlendingDuration = 100;
				viewer.shadows = false;
				viewer.groundPlaneVisibility = false;
				viewer.gridVisibility = false;
				viewer.environmentMap = SDV.ENVIRONMENT_MAP.NEUTRAL;
				(<any>window).viewer = viewer;

				await new Promise<void>((resolve) => {
					SDV.addListener(SDV.EVENTTYPE.TASK.TASK_END, (e: any) => {
						if (e.type === SDV.TASK_TYPE.ENVIRONMENT_MAP_LOADING)
							resolve();
					});
				});

				const rendered = () =>
					new Promise<void>((resolve) => {
						const token = SDV.addListener(
							SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
							() => {
								SDV.removeListener(token);
								resolve();
							},
						);
						viewer.render();
					});

				let currentNode: any;
				/** Loads the stones; every stone gets its own gem material data with `properties`. */
				(<any>window).loadStones = async (
					uri: string,
					properties: any,
				) => {
					const node = await DataEngine.instance.loadContent({
						format: "gltf",
						href: uri,
					});
					const visit = (n: any) => {
						for (const d of n.data)
							if (d.primitive !== undefined)
								d.material = new SDV.MaterialGemData({
									refractionIndex: 2.42,
									...properties,
								});
						n.children.forEach(visit);
					};
					visit(node);
					if (currentNode) SDV.sceneTree.removeNode(currentNode);
					currentNode = node;
					SDV.sceneTree.addNode(node);
					SDV.sceneTree.root.updateVersion();
					viewer.show = true;
					await rendered();
					await viewer.camera!.zoomTo(undefined, {duration: 0});
					await rendered();
					return node;
				};

				/** The gem materials of the converted stones. */
				(<any>window).gemMaterials = () => {
					const materials: any[] = [];
					const visit = (n: any) => {
						for (const d of n.data) {
							const mesh = d.convertedObject?.[viewer.id];
							if (mesh?.material?.isGemMaterial)
								materials.push(mesh.material);
						}
						n.children.forEach(visit);
					};
					visit(SDV.sceneTree.root);
					return materials;
				};

				/** Puts one transformation on the stones, zooms to them and renders. */
				(<any>window).transformStones = async (
					node: any,
					scale: number[],
				) => {
					const old = node.getTransformation("test-scale");
					if (old) node.removeTransformation(old);
					const GL = (<any>window).GL_MATRIX;
					node.addTransformation({
						id: "test-scale",
						matrix: GL.mat4.fromScaling(GL.mat4.create(), scale),
					});
					viewer.updateNodeTransformation(node);
					await rendered();
					await viewer.camera!.zoomTo(undefined, {duration: 0});
					await rendered();
				};

				/**
				 * Mean color of the pixels that are not background, and how
				 * many there are. Green saturation is the ratio of green to
				 * the mean of red and blue; unlike a difference it keeps
				 * rising with the path length when green itself gets darker.
				 */
				(<any>window).measure = async () => {
					await rendered();
					const url = viewer.getScreenshot();
					const image = new Image();
					await new Promise((resolve, reject) => {
						image.onload = resolve;
						image.onerror = reject;
						image.src = url;
					});
					const canvas = document.createElement("canvas");
					canvas.width = image.width;
					canvas.height = image.height;
					const context = canvas.getContext("2d")!;
					context.drawImage(image, 0, 0);
					const data = context.getImageData(
						0,
						0,
						canvas.width,
						canvas.height,
					).data;
					let r = 0,
						g = 0,
						b = 0,
						count = 0;
					for (let i = 0; i < data.length; i += 4) {
						if (data[i] + data[i + 1] + data[i + 2] < 6) continue;
						r += data[i];
						g += data[i + 1];
						b += data[i + 2];
						count++;
					}
					if (count === 0) return {r: 0, g: 0, b: 0, count, green: 0};
					r /= count;
					g /= count;
					b /= count;
					return {r, g, b, count, green: g / ((r + b) / 2 + 1)};
				};
			});

			await use(page);
			await context.close();
		},
		{scope: "worker"},
	],
});

test.describe("gem absorption by path length", () => {
	test.describe.configure({mode: "serial"});

	test("is off by default and leaves the shader unchanged", async ({
		workerPage,
	}) => {
		const pageErrors: string[] = [];
		workerPage.on("pageerror", (error) => pageErrors.push(error.message));
		const state = await workerPage.evaluate(async (uri: string) => {
			const w = <any>window;
			await w.loadStones(uri, {});
			const plain = w.gemMaterials();
			const plainImage = await w.measure();
			const defaults = {
				count: plain.length,
				distance: plain[0].attenuationDistance,
				defined: plain.some((m: any) => "GEM_ATTENUATION" in m.defines),
			};
			// a color without a finite distance changes nothing
			await w.loadStones(uri, {attenuationColor: "#20c040"});
			const colored = w.gemMaterials();
			const coloredImage = await w.measure();
			return {
				defaults,
				coloredDefined: colored.some(
					(m: any) => "GEM_ATTENUATION" in m.defines,
				),
				plainImage,
				coloredImage,
			};
		}, STONES);

		expect(state.defaults.count).toBeGreaterThan(0);
		expect(state.defaults.distance).toBe(Infinity);
		expect(state.defaults.defined).toBe(false);
		expect(state.coloredDefined).toBe(false);
		expect(state.coloredImage).toEqual(state.plainImage);
		expect(pageErrors).toEqual([]);
	});

	for (const gemTracing of ["sphere", "facets"] as const)
		test(`thick paths absorb more, in world units (${gemTracing} tracing)`, async ({
			workerPage,
		}) => {
			const pageErrors: string[] = [];
			workerPage.on("pageerror", (error) =>
				pageErrors.push(error.message),
			);
			const result = await workerPage.evaluate(
				async ({uri, color, gemTracing}) => {
					const w = <any>window;
					w.viewer.gemTracing = gemTracing;

					const off = await (async () => {
						const node = await w.loadStones(uri, {});
						const unscaled = await w.measure();
						await w.transformStones(node, [2, 2, 2]);
						const scaled = await w.measure();
						await w.transformStones(node, [-1, 1, 1]);
						const mirrored = await w.measure();
						return {unscaled, scaled, mirrored};
					})();

					// The stones are about 0.1 model units wide.
					const distance = 0.2;
					const loadWith = (d: number) =>
						w.loadStones(uri, {
							attenuationColor: color,
							attenuationDistance: d,
						});

					let node = await loadWith(distance);
					const defined = w
						.gemMaterials()
						.every((m: any) => "GEM_ATTENUATION" in m.defines);
					const unscaled = await w.measure();
					// twice the size and twice the distance: the same absorption
					await w.transformStones(node, [2, 2, 2]);
					const scaledSameDistance = await w.measure();
					node = await loadWith(distance * 2);
					await w.transformStones(node, [2, 2, 2]);
					const scaledDoubleDistance = await w.measure();
					// mirrored: the same absorption as unmirrored
					node = await loadWith(distance);
					await w.transformStones(node, [-1, 1, 1]);
					const mirrored = await w.measure();
					w.viewer.gemTracing = "sphere";
					return {
						defined,
						off,
						unscaled,
						scaledSameDistance,
						scaledDoubleDistance,
						mirrored,
					};
				},
				{uri: STONES, color: GREEN, gemTracing},
			);

			expect(result.defined).toBe(true);
			// absorption turns the stones green and does not make them black
			const gain = result.unscaled.green - result.off.unscaled.green;
			expect(gain).toBeGreaterThan(0.2);
			expect(result.unscaled.g).toBeGreaterThan(
				result.off.unscaled.g * 0.25,
			);
			expect(result.unscaled.count).toBeGreaterThan(
				result.off.unscaled.count * 0.5,
			);

			// a stone twice as large has twice the path: more absorption ...
			const scaledSameGain =
				result.scaledSameDistance.green - result.off.scaled.green;
			expect(scaledSameGain).toBeGreaterThan(gain * 1.1);
			// ... unless the distance is doubled too
			const scaledDoubleGain =
				result.scaledDoubleDistance.green - result.off.scaled.green;
			expect(Math.abs(scaledDoubleGain - gain)).toBeLessThan(gain * 0.2);
			// a mirrored stone absorbs like the original
			const mirroredGain =
				result.mirrored.green - result.off.mirrored.green;
			expect(Math.abs(mirroredGain - gain)).toBeLessThan(gain * 0.2);
			expect(pageErrors).toEqual([]);
		});
});
