import {expect, type Page, test} from "@playwright/test";

// Two objects, each with a rectangle transform and a select manager of its own
// with deselectOnEmpty (SS-10555, e.g. two artworks with a menu each), above a
// selectable floor. The plane of a rectangle wins the press; a click on the
// other object selects it and deselects the first one, like a click without
// the rectangles does. A drag on the rectangle of the selected object keeps it
// selected, also where the rectangle lies over the floor.
// App Builder puts every select manager of a viewport into one shared
// interaction engine; each scenario also runs with one engine per manager.

type Point = [number, number, number];

// the left object is two cubes in opposite corners of its rectangle
// (x -7..-1, y -3..3): its top left corner is empty and lies over the floor
const LEFT: Point = [-6, -2, 1];
const LEFT_EMPTY_CORNER: Point = [-6, 2, 0];
const RIGHT: Point = [4, 0, 1];
const FLOOR: Point = [0, -6, -0.5];

const setUpScene = async (page: Page, sharedEngine: boolean) => {
	await page.goto("test-cdn/index.html");
	await page.evaluate(async (sharedEngine) => {
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

		const box = (min: number[], max: number[], color: string) => {
			const positions = new Float32Array(24);
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
				color,
				side: SDV.MATERIAL_SIDE.DOUBLE,
			});
			const node = new SDV.TreeNode("geometry");
			node.addData(geometryData);
			return node;
		};

		const state = {selected: [] as string[], selectOn: [] as string[]};
		(<any>window).handoffState = state;

		const shared = sharedEngine ? new InteractionEngine(viewport) : null;
		const addSelectable = (name: string, object: any) => {
			const engine = shared ?? new InteractionEngine(viewport);
			const select = new SelectManager("select_" + name, undefined, true);
			engine.addInteractionManager(select);
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
		};

		// each object holds the node its rectangle transform moves, like an
		// artwork and its instance node
		const targets: {[name: string]: any} = {};
		const objects: [string, [number[], number[]][]][] = [
			[
				"left",
				[
					[
						[-7, -3, 0],
						[-5, -1, 1],
					],
					[
						[-3, 1, 0],
						[-1, 3, 1],
					],
				],
			],
			[
				"right",
				[
					[
						[2, -2, 0],
						[6, 2, 1],
					],
				],
			],
		];
		for (const [name, boxes] of objects) {
			const object = new SDV.TreeNode(name);
			const target = new SDV.TreeNode(name + "_target");
			for (const [min, max] of boxes)
				target.addChild(box(min, max, "#0088ff"));
			object.addChild(target);
			SDV.sceneTree.root.addChild(object);
			targets[name] = target;
			addSelectable(name, object);
		}
		const floor = new SDV.TreeNode("floor");
		floor.addChild(box([-12, -9, -1], [12, 9, -0.5], "#cccccc"));
		SDV.sceneTree.root.addChild(floor);
		addSelectable("floor", floor);

		SDV.sceneTree.root.updateVersion();
		await viewport.update();
		viewport.show = true;
		await viewport.camera.set([0, -1, 30], [0, 0, 0], {duration: 0});
		viewport.render();

		for (const target of Object.values(targets))
			new RectangleTransform(viewport, [target], {
				plane: {
					type: "plane",
					origin: [0, 0, 0],
					vector_u: [1, 0, 0],
					vector_v: [0, 1, 0],
				},
				translateOnObjects: true,
			});

		(<any>window).handoffMatrix = (name: string) =>
			Array.from(
				targets[name].transformations.find(
					(t: any) => t.id === "SD_transformation_tools_matrix",
				)?.matrix ?? [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
			);
		(<any>window).handoffScreen = (p: number[]) => {
			const ndc = viewport.camera.project(p);
			const rect = viewport.canvas.getBoundingClientRect();
			return [
				rect.left + ((ndc[0] + 1) / 2) * rect.width,
				rect.top + ((1 - ndc[1]) / 2) * rect.height,
			];
		};
	}, sharedEngine);
	// the logo shown while loading sits above the canvas and shifts it down
	await page.locator(".sdv-logo-container").waitFor({state: "hidden"});
	await page.waitForTimeout(500);
};

const screen = async (page: Page, p: Point) =>
	(await page.evaluate((p) => (<any>window).handoffScreen(p), p)) as [
		number,
		number,
	];

// the selected objects, without the floor (see the floor test)
const selected = async (page: Page) =>
	(await page.evaluate(() =>
		[...(<any>window).handoffState.selected]
			.filter((n: string) => n !== "floor")
			.sort(),
	)) as string[];

const selectOn = async (page: Page) =>
	(await page.evaluate(() =>
		[...(<any>window).handoffState.selectOn].filter(
			(n: string) => n !== "floor",
		),
	)) as string[];

const matrix = async (page: Page, name: string) =>
	(await page.evaluate(
		(name) => (<any>window).handoffMatrix(name),
		name,
	)) as number[];

const press = async (page: Page, p: Point, dx = 0, dy = 0) => {
	const [x, y] = await screen(page, p);
	await page.mouse.move(x, y, {steps: 2});
	await page.mouse.down();
	if (dx !== 0 || dy !== 0)
		await page.mouse.move(x + dx, y + dy, {steps: 10});
	await page.mouse.up();
	await page.waitForTimeout(200);
};

for (const sharedEngine of [true, false]) {
	test.describe(`Objects with a rectangle transform and a menu each (${
		sharedEngine ? "one shared engine" : "one engine per object"
	})`, () => {
		test.beforeEach(async ({page}) => {
			await setUpScene(page, sharedEngine);
		});

		test("a click on the other object moves the selection", async ({
			page,
		}) => {
			await press(page, LEFT);
			expect(await selected(page)).toEqual(["left"]);
			await press(page, RIGHT);
			expect(await selected(page)).toEqual(["right"]);
		});

		test("a click on the first object again selects it again", async ({
			page,
		}) => {
			await press(page, LEFT);
			await press(page, RIGHT);
			await press(page, LEFT);
			expect(await selected(page)).toEqual(["left"]);
			expect(await selectOn(page)).toEqual(["left", "right", "left"]);
		});

		test("a click on the selected object keeps it selected", async ({
			page,
		}) => {
			await press(page, LEFT);
			await press(page, LEFT);
			expect(await selected(page)).toEqual(["left"]);
			expect(await selectOn(page)).toEqual(["left"]);
		});

		test("a drag on the rectangle over the floor keeps the object selected", async ({
			page,
		}) => {
			await press(page, LEFT);
			expect(await selected(page)).toEqual(["left"]);
			await press(page, LEFT_EMPTY_CORNER, 40, 0);
			expect(Math.abs((await matrix(page, "left"))[12])).toBeGreaterThan(
				0.1,
			);
			expect(await selected(page)).toEqual(["left"]);
		});

		test("a click on the floor deselects the object", async ({page}) => {
			await press(page, LEFT);
			await press(page, FLOOR);
			expect(await selected(page)).toEqual([]);
		});
	});
}
