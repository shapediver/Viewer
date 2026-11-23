import {expect, type Page, test} from "@playwright/test";

// Two objects, each with a rectangle transform and a select manager of its own
// with deselectOnEmpty (SS-10555, e.g. two artworks with a menu each). The
// plane of a rectangle wins the press; a click on the other object selects it
// and deselects the first one, like a click without the rectangles does.

type Point = [number, number, number];

// on top of each box, away from the handles of the rectangles
const LEFT: Point = [-4, 0, 1];
const RIGHT: Point = [4, 0, 1];

const setUpScene = async (page: Page) => {
	await page.goto("test-cdn/index.html");
	await page.evaluate(async () => {
		const SDV = (<any>window).SDV;
		const {InteractionData, InteractionEngine, SelectManager} = (<any>(
			window
		)).SDVInteractions;
		const {RectangleTransform} = (<any>window).SDVTransformationTools;

		const viewport = await SDV.createViewport({
			canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			id: "myViewport",
			visibility: SDV.VISIBILITY_MODE.MANUAL,
		});

		const box = (cx: number) => {
			const positions = new Float32Array(24);
			const min = [cx - 2, -2, 0];
			const max = [cx + 2, 2, 1];
			for (let i = 0; i < 8; i++) {
				positions[i * 3] = i & 1 ? max[0] : min[0];
				positions[i * 3 + 1] = i & 2 ? max[1] : min[1];
				positions[i * 3 + 2] = i & 4 ? max[2] : min[2];
			}
			const indices = new Uint16Array([
				0, 2, 3, 0, 3, 1, 4, 5, 7, 4, 7, 6, 0, 1, 5, 0, 5, 4, 2, 7, 3,
				2, 6, 7, 0, 4, 6, 0, 6, 2, 1, 3, 7, 1, 7, 5,
			]);
			const geometryData = new SDV.GeometryData(
				new SDV.PrimitiveData(
					{
						POSITION: new SDV.AttributeData(
							positions,
							3,
							12,
							0,
							4,
							false,
							positions.length,
						),
					},
					new SDV.AttributeData(
						indices,
						1,
						2,
						0,
						2,
						false,
						indices.length,
					),
				),
				SDV.PRIMITIVE_MODE.TRIANGLES,
			);
			geometryData.material = new SDV.MaterialStandardData({
				color: "#0088ff",
				side: SDV.MATERIAL_SIDE.DOUBLE,
			});
			return geometryData;
		};

		const state = {selected: [] as string[], selectOn: [] as string[]};
		(<any>window).handoffState = state;

		// each object holds the node its rectangle transform moves, like an
		// artwork and its instance node, and has its own interaction engine
		// (one per App Builder action slot)
		const targets: any[] = [];
		const engines: any[] = [];
		for (const [name, cx] of [
			["left", -4],
			["right", 4],
		] as [string, number][]) {
			const object = new SDV.TreeNode(name);
			const target = new SDV.TreeNode(name + "_target");
			const geometry = new SDV.TreeNode(name + "_geometry");
			geometry.addData(box(cx));
			target.addChild(geometry);
			object.addChild(target);
			SDV.sceneTree.root.addChild(object);
			targets.push(target);

			const engine = new InteractionEngine(viewport);
			const select = new SelectManager("select_" + name, undefined, true);
			engine.addInteractionManager(select);
			engines.push(engine);
			object.addData(
				new InteractionData({select: true}, undefined, [select.id]),
			);

			SDV.addListener(SDV.EVENTTYPE.INTERACTION.SELECT_ON, (e: any) => {
				if (e.manager.id !== select.id) return;
				state.selected.push(name);
				state.selectOn.push(name);
			});
			SDV.addListener(SDV.EVENTTYPE.INTERACTION.SELECT_OFF, (e: any) => {
				if (e.manager.id === select.id)
					state.selected = state.selected.filter((n) => n !== name);
			});
		}
		SDV.sceneTree.root.updateVersion();
		await viewport.update();
		viewport.show = true;
		await viewport.camera.set([0, -1, 30], [0, 0, 0], {duration: 0});
		viewport.render();

		for (const target of targets)
			new RectangleTransform(viewport, [target], {
				plane: {
					type: "plane",
					origin: [0, 0, 0],
					vector_u: [1, 0, 0],
					vector_v: [0, 1, 0],
				},
				translateOnObjects: true,
			});

		(<any>window).handoffScreen = (p: number[]) => {
			const ndc = viewport.camera.project(p);
			const rect = viewport.canvas.getBoundingClientRect();
			return [
				rect.left + ((ndc[0] + 1) / 2) * rect.width,
				rect.top + ((1 - ndc[1]) / 2) * rect.height,
			];
		};
	});
	// the logo shown while loading sits above the canvas and shifts it down
	await page.locator(".sdv-logo-container").waitFor({state: "hidden"});
	await page.waitForTimeout(500);
};

const screen = async (page: Page, p: Point) =>
	(await page.evaluate((p) => (<any>window).handoffScreen(p), p)) as [
		number,
		number,
	];

const selected = async (page: Page) =>
	(await page.evaluate(() =>
		[...(<any>window).handoffState.selected].sort(),
	)) as string[];

const selectOn = async (page: Page) =>
	(await page.evaluate(() => [
		...(<any>window).handoffState.selectOn,
	])) as string[];

const click = async (page: Page, p: Point) => {
	const [x, y] = await screen(page, p);
	await page.mouse.move(x, y, {steps: 2});
	await page.mouse.down();
	await page.mouse.up();
	await page.waitForTimeout(200);
};

test.describe("Objects with a rectangle transform and a menu each", () => {
	test.beforeEach(async ({page}) => {
		await setUpScene(page);
	});

	test("a click on the other object moves the selection", async ({page}) => {
		await click(page, LEFT);
		expect(await selected(page)).toEqual(["left"]);
		await click(page, RIGHT);
		expect(await selected(page)).toEqual(["right"]);
	});

	test("a click on the first object again selects it again", async ({
		page,
	}) => {
		await click(page, LEFT);
		await click(page, RIGHT);
		await click(page, LEFT);
		expect(await selected(page)).toEqual(["left"]);
		expect(await selectOn(page)).toEqual(["left", "right", "left"]);
	});

	test("a click on the selected object keeps it selected", async ({page}) => {
		await click(page, LEFT);
		await click(page, LEFT);
		expect(await selected(page)).toEqual(["left"]);
		expect(await selectOn(page)).toEqual(["left"]);
	});
});
