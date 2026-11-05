import {expect, type Page, test} from "@playwright/test";

// Two rectangle transforms whose objects overlap on screen (SS-10327): box B
// lies flat, box A floats above it and covers part of B's rectangle and its
// top right handle. A shared engine selects the boxes (one select and hover
// manager per box, like one parameter each), a selected box gets a rectangle
// transform.

type Point = [number, number, number];

// on top of A, inside B's rectangle, away from the handles of both
const A_PRESS: Point = [1, 1, 3];
// on top of A, outside of B's rectangle and away from its handles
const A_OUTSIDE: Point = [2.8, 2.5, 3];
// on top of B, outside of A
const B_PRESS: Point = [-1, -1, 1];
// the top right handle of B's rectangle, covered by A
const B_HANDLE: Point = [2, 2, 0.5];

const setUpScene = async (page: Page) => {
	await page.goto("test-cdn/index.html");
	await page.evaluate(async () => {
		const SDV = (<any>window).SDV;
		const {
			HoverManager,
			InteractionData,
			InteractionEngine,
			SelectManager,
		} = (<any>window).SDVInteractions;
		const {RectangleTransform} = (<any>window).SDVTransformationTools;

		const viewport = await SDV.createViewport({
			canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			id: "myViewport",
			visibility: SDV.VISIBILITY_MODE.MANUAL,
		});

		const createBox = (name: string, min: number[], max: number[]) => {
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
				color: name === "A" ? "#ff8800" : "#0088ff",
				side: SDV.MATERIAL_SIDE.DOUBLE,
			});
			const node = new SDV.TreeNode(name);
			node.addData(geometryData);
			SDV.sceneTree.root.addChild(node);
			return node;
		};

		const nodes: {[name: string]: any} = {
			B: createBox("B", [-2, -2, 0], [2, 2, 1]),
			A: createBox("A", [0, 0, 2], [3, 3, 3]),
		};
		SDV.sceneTree.root.updateVersion();
		await viewport.update();
		viewport.show = true;
		await viewport.camera.set([0, -1, 20], [0, 0, 0], {duration: 0});
		viewport.render();

		const state = {
			selected: [] as string[],
			hovered: [] as string[],
			transforms: {} as {[name: string]: any},
		};
		(<any>window).overlapTestState = state;

		const engine = new InteractionEngine(viewport);
		const managerNames: {[id: string]: string} = {};
		for (const name of Object.keys(nodes)) {
			const select = new SelectManager(`select_${name}`);
			const hover = new HoverManager(`hover_${name}`);
			managerNames[select.id] = name;
			managerNames[hover.id] = name;
			engine.addInteractionManager(select);
			engine.addInteractionManager(hover);
			nodes[name].addData(
				new InteractionData({select: true, hover: true}, undefined, [
					select.id,
					hover.id,
				]),
			);
			nodes[name].updateVersion();
		}
		await viewport.update();

		SDV.addListener(SDV.EVENTTYPE.INTERACTION.SELECT_ON, (e: any) => {
			const name = managerNames[e.manager.id];
			if (!name) return;
			state.selected.push(name);
			state.transforms[name] = new RectangleTransform(
				viewport,
				[nodes[name]],
				{
					plane: {
						type: "plane",
						origin: [0, 0, 0],
						vector_u: [1, 0, 0],
						vector_v: [0, 1, 0],
					},
				},
			);
		});
		SDV.addListener(SDV.EVENTTYPE.INTERACTION.SELECT_OFF, (e: any) => {
			const name = managerNames[e.manager.id];
			if (!name) return;
			state.selected = state.selected.filter((n) => n !== name);
			state.transforms[name]?.close();
			delete state.transforms[name];
		});
		SDV.addListener(SDV.EVENTTYPE.INTERACTION.HOVER_ON, (e: any) => {
			const name = managerNames[e.manager.id];
			if (name && !state.hovered.includes(name)) state.hovered.push(name);
		});
		SDV.addListener(SDV.EVENTTYPE.INTERACTION.HOVER_OFF, (e: any) => {
			const name = managerNames[e.manager.id];
			if (name) state.hovered = state.hovered.filter((n) => n !== name);
		});

		// the matrix applied to the box by its rectangle transform
		(<any>window).overlapTestMatrix = (name: string) =>
			Array.from(
				nodes[name].transformations.find(
					(t: any) => t.id === "SD_transformation_tools_matrix",
				)?.matrix ?? [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
			);
		(<any>window).overlapTestScreen = (p: number[]) => {
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
	(await page.evaluate((p) => (<any>window).overlapTestScreen(p), p)) as [
		number,
		number,
	];

const testState = async (page: Page) =>
	(await page.evaluate(() => {
		const state = (<any>window).overlapTestState;
		return {selected: [...state.selected], hovered: [...state.hovered]};
	})) as {selected: string[]; hovered: string[]};

const matrix = async (page: Page, name: string) =>
	(await page.evaluate(
		(name) => (<any>window).overlapTestMatrix(name),
		name,
	)) as number[];

const IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

const expectMatrix = (actual: number[], expected: number[]) =>
	actual.forEach((value, i) => expect(value).toBeCloseTo(expected[i], 4));

const press = async (page: Page, p: Point, dx = 0, dy = 0) => {
	const [x, y] = await screen(page, p);
	await page.mouse.move(x, y, {steps: 2});
	await page.mouse.down();
	if (dx !== 0 || dy !== 0)
		await page.mouse.move(x + dx, y + dy, {steps: 10});
	await page.mouse.up();
	await page.waitForTimeout(200);
};

test.describe("Rectangle transforms on top of each other", () => {
	test.beforeEach(async ({page}) => {
		await setUpScene(page);
		// select the box behind: its rectangle covers part of A
		await press(page, B_PRESS);
		expect((await testState(page)).selected).toEqual(["B"]);
	});

	test("the front object wins the hover over the rectangle behind it", async ({
		page,
	}) => {
		const [x, y] = await screen(page, A_PRESS);
		await page.mouse.move(x, y, {steps: 5});
		await expect
			.poll(async () => (await testState(page)).hovered)
			.toEqual(["A"]);
	});

	test("the front object wins the press over the rectangle behind it", async ({
		page,
	}) => {
		// pressing A selects it, B stays where it is
		await press(page, A_PRESS);
		expect((await testState(page)).selected).toEqual(["B", "A"]);
		expectMatrix(await matrix(page, "B"), IDENTITY);

		// with both rectangles shown, a drag on A moves A only
		const before = await matrix(page, "A");
		await press(page, A_PRESS, 40, 0);
		const after = await matrix(page, "A");
		expect(Math.abs(after[12] - before[12])).toBeGreaterThan(0.1);
		expectMatrix(await matrix(page, "B"), IDENTITY);
		expect((await testState(page)).selected).toEqual(["B", "A"]);
	});

	test("an object outside the shown rectangle still receives the hover and the press", async ({
		page,
	}) => {
		const [x, y] = await screen(page, A_OUTSIDE);
		await page.mouse.move(x, y, {steps: 5});
		await expect
			.poll(async () => (await testState(page)).hovered)
			.toEqual(["A"]);
		await press(page, A_OUTSIDE);
		expect((await testState(page)).selected).toEqual(["B", "A"]);
	});

	test("a handle of the rectangle behind still wins over the front object", async ({
		page,
	}) => {
		// the top right handle of B is drawn over A: dragging it scales B
		await press(page, B_HANDLE, 40, -40);
		const b = await matrix(page, "B");
		expect(Math.abs(b[0] - 1)).toBeGreaterThan(0.01);
		expect((await testState(page)).selected).toEqual(["B"]);
		expectMatrix(await matrix(page, "A"), IDENTITY);
	});
});
