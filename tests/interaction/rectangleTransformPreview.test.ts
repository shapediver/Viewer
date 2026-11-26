import {expect, type Page, test} from "@playwright/test";

// Hover preview and one-press gestures of rectangle transforms (SS-10334).
// The scene is the one of rectangleTransformOverlap.test.ts: box B lies flat,
// box A floats above it and covers part of B. A shared engine selects the
// boxes (one select and hover manager per box), the page wires the preview
// like the App Builder does for an exclusive rectangle transform:
// - hovering a box shows a preview rectangle transform on it (one preview,
//   moved between the boxes), HOVER_CHANGED hides it,
// - GESTURE_START on the preview selects its box and promotes it,
// - a press which selects a box without a preview creates its rectangle
//   transform, which continues the press (startTranslation).

type Point = [number, number, number];

// on top of A, inside B's rectangle
const A_PRESS: Point = [1, 1, 3];
// on top of B, outside of A
const B_PRESS: Point = [-1, -1, 1];
// on the ground plane far from both boxes
const EMPTY: Point = [-8, 6, 0];
// between the top edge of B's rectangle and its rotation handle
const B_GAP: Point = [-1, 2.5, 0.5];
// the bottom left handle of B's rectangle
const B_CORNER: Point = [-2, -2, 0.5];

const PREVIEW_ID = "preview";

const setUpScene = async (page: Page, usePreview: boolean) => {
	await page.goto("test-cdn/index.html");
	await page.evaluate(async (usePreview) => {
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

		const PREVIEW_ID = "preview";
		const settings = {
			plane: {
				type: "plane",
				origin: [0, 0, 0],
				vector_u: [1, 0, 0],
				vector_v: [0, 1, 0],
			},
			translateOnObjects: true,
		};
		const state = {
			selected: [] as string[],
			preview: undefined as string | undefined,
			previewShown: false,
			gestures: [] as {id: string; target: string}[],
			transforms: {} as {[name: string]: any},
		};
		(<any>window).previewTestState = state;
		let preview: any;

		const engine = new InteractionEngine(viewport);
		const managerNames: {[id: string]: string} = {};
		const selectManagers: {[name: string]: any} = {};
		for (const name of Object.keys(nodes)) {
			const select = new SelectManager(`select_${name}`);
			const hover = new HoverManager(`hover_${name}`);
			managerNames[select.id] = name;
			managerNames[hover.id] = name;
			selectManagers[name] = select;
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

		// one selected box (like an exclusive parameter)
		const select = (name: string, transform?: any) => {
			for (const other of [...state.selected]) {
				if (other === name) continue;
				state.transforms[other]?.close();
				delete state.transforms[other];
				selectManagers[other].deselect();
			}
			state.selected = [name];
			state.transforms[name] =
				transform ??
				new RectangleTransform(viewport, [nodes[name]], settings, name);
		};

		SDV.addListener(SDV.EVENTTYPE.INTERACTION.HOVER_ON, (e: any) => {
			const name = managerNames[e.manager.id];
			if (!usePreview || !name || state.selected.includes(name)) return;
			if (!e.event || e.event.buttons !== 0) return;
			if (preview) {
				if (state.preview !== name || !preview.show)
					preview.setNodes([nodes[name]], {});
				preview.show = true;
			} else {
				preview = new RectangleTransform(
					viewport,
					[nodes[name]],
					{...settings, preview: true},
					PREVIEW_ID,
				);
			}
			state.preview = name;
			state.previewShown = true;
		});
		SDV.addListener(
			SDV.EVENTTYPE.TRANSFORMATION_TOOLS.HOVER_CHANGED,
			(e: any) => {
				if (e.id !== PREVIEW_ID || e.hovered || !preview) return;
				preview.show = false;
				state.previewShown = false;
			},
		);
		SDV.addListener(
			SDV.EVENTTYPE.TRANSFORMATION_TOOLS.GESTURE_START,
			(e: any) => {
				state.gestures.push({id: e.id, target: e.target});
				if (e.id !== PREVIEW_ID || !preview) return;
				const name = state.preview!;
				preview.promote(name);
				selectManagers[name].select({
					distance: 1,
					point: [0, 0, 0],
					node: nodes[name],
				});
				select(name, preview);
				preview = undefined;
				state.preview = undefined;
				state.previewShown = false;
			},
		);
		SDV.addListener(SDV.EVENTTYPE.INTERACTION.SELECT_ON, (e: any) => {
			const name = managerNames[e.manager.id];
			if (!name || !e.event) return;
			const pointerDown = e.event;
			// the camera stays still until the press ends
			const freeze = viewport.addFlag(SDV.FLAG_TYPE.CAMERA_FREEZE);
			window.addEventListener(
				"pointerup",
				() => viewport.removeFlag(freeze),
				{once: true},
			);
			// the gizmo is created after the event, like by a React effect
			setTimeout(() => {
				select(name);
				state.transforms[name].startTranslation(pointerDown);
			});
		});

		// the matrix applied to the box by its rectangle transform
		(<any>window).previewTestMatrix = (name: string) =>
			Array.from(
				nodes[name].transformations.find(
					(t: any) => t.id === "SD_transformation_tools_matrix",
				)?.matrix ?? [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
			);
		(<any>window).previewTestCamera = () =>
			Array.from(viewport.camera.position);
		(<any>window).previewTestScreen = (p: number[]) => {
			const ndc = viewport.camera.project(p);
			const rect = viewport.canvas.getBoundingClientRect();
			return [
				rect.left + ((ndc[0] + 1) / 2) * rect.width,
				rect.top + ((1 - ndc[1]) / 2) * rect.height,
			];
		};
	}, usePreview);
	// the logo shown while loading sits above the canvas and shifts it down
	await page.locator(".sdv-logo-container").waitFor({state: "hidden"});
	await page.waitForTimeout(500);
};

const screen = async (page: Page, p: Point) =>
	(await page.evaluate((p) => (<any>window).previewTestScreen(p), p)) as [
		number,
		number,
	];

const testState = async (page: Page) =>
	(await page.evaluate(() => {
		const state = (<any>window).previewTestState;
		return {
			selected: [...state.selected],
			preview: state.preview,
			previewShown: state.previewShown,
			gestures: [...state.gestures],
		};
	})) as {
		selected: string[];
		preview?: string;
		previewShown: boolean;
		gestures: {id: string; target: string}[];
	};

const matrix = async (page: Page, name: string) =>
	(await page.evaluate(
		(name) => (<any>window).previewTestMatrix(name),
		name,
	)) as number[];

const camera = async (page: Page) =>
	(await page.evaluate(() => (<any>window).previewTestCamera())) as number[];

const IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

const expectMatrix = (actual: number[], expected: number[]) =>
	actual.forEach((value, i) => expect(value).toBeCloseTo(expected[i], 4));

const hover = async (page: Page, p: Point) => {
	const [x, y] = await screen(page, p);
	await page.mouse.move(x, y, {steps: 5});
	await page.waitForTimeout(100);
};

const press = async (page: Page, p: Point, dx = 0, dy = 0) => {
	const [x, y] = await screen(page, p);
	await page.mouse.move(x, y, {steps: 2});
	await page.mouse.down();
	if (dx !== 0 || dy !== 0)
		await page.mouse.move(x + dx, y + dy, {steps: 10});
	await page.mouse.up();
	await page.waitForTimeout(200);
};

const cancelPointer = (page: Page) =>
	page.evaluate(() => {
		const canvas = document.getElementById("canvas")!;
		canvas.dispatchEvent(
			new PointerEvent("pointercancel", {
				pointerId: 1,
				pointerType: "mouse",
				bubbles: true,
			}),
		);
	});

test.describe("Rectangle transform preview", () => {
	test.beforeEach(async ({page}) => {
		await setUpScene(page, true);
	});

	test("hovering an object shows a preview, leaving it hides it", async ({
		page,
	}) => {
		await hover(page, B_PRESS);
		await expect
			.poll(async () => (await testState(page)).previewShown)
			.toBe(true);
		expect((await testState(page)).preview).toBe("B");
		expect((await testState(page)).selected).toEqual([]);

		await hover(page, EMPTY);
		await expect
			.poll(async () => (await testState(page)).previewShown)
			.toBe(false);
		expect((await testState(page)).selected).toEqual([]);
		expectMatrix(await matrix(page, "B"), IDENTITY);
	});

	test("the preview stays while the pointer is in the gap up to the rotation handle", async ({
		page,
	}) => {
		await hover(page, B_PRESS);
		await expect
			.poll(async () => (await testState(page)).preview)
			.toBe("B");
		await hover(page, B_GAP);
		await page.waitForTimeout(200);
		expect((await testState(page)).previewShown).toBe(true);
	});

	test("a press on a handle of the preview selects the object and scales it in the same press", async ({
		page,
	}) => {
		await hover(page, B_PRESS);
		await expect
			.poll(async () => (await testState(page)).preview)
			.toBe("B");
		await hover(page, B_CORNER);
		expect((await testState(page)).previewShown).toBe(true);

		await press(page, B_CORNER, -40, 40);
		const state = await testState(page);
		expect(state.selected).toEqual(["B"]);
		expect(state.gestures[0]).toEqual({id: PREVIEW_ID, target: "handle"});
		expect(Math.abs((await matrix(page, "B"))[0] - 1)).toBeGreaterThan(
			0.01,
		);
	});

	test("one preview moves between the objects", async ({page}) => {
		await hover(page, B_PRESS);
		await expect
			.poll(async () => (await testState(page)).preview)
			.toBe("B");
		await hover(page, A_PRESS);
		await expect
			.poll(async () => (await testState(page)).preview)
			.toBe("A");
		expect((await testState(page)).previewShown).toBe(true);
		expectMatrix(await matrix(page, "A"), IDENTITY);
		expectMatrix(await matrix(page, "B"), IDENTITY);

		// the moved preview works like a new one
		await press(page, A_PRESS, 60, 0);
		expect((await testState(page)).selected).toEqual(["A"]);
		expect((await matrix(page, "A"))[12]).toBeGreaterThan(0.1);
		expectMatrix(await matrix(page, "B"), IDENTITY);
	});

	test("a press on the previewed object selects it and moves it in the same press", async ({
		page,
	}) => {
		await hover(page, B_PRESS);
		await expect
			.poll(async () => (await testState(page)).preview)
			.toBe("B");
		const cameraBefore = await camera(page);

		await press(page, B_PRESS, 60, 0);
		const state = await testState(page);
		expect(state.selected).toEqual(["B"]);
		expect(state.gestures[0]).toEqual({id: PREVIEW_ID, target: "plane"});
		const b = await matrix(page, "B");
		expect(b[12]).toBeGreaterThan(0.1);
		// the camera does not move with the object
		expectMatrix(await camera(page), cameraBefore);
	});

	test("a click on the previewed object only selects it", async ({page}) => {
		await hover(page, B_PRESS);
		await expect
			.poll(async () => (await testState(page)).preview)
			.toBe("B");
		await press(page, B_PRESS);
		expect((await testState(page)).selected).toEqual(["B"]);
		expectMatrix(await matrix(page, "B"), IDENTITY);
	});

	test("a press moved less than the drag threshold changes nothing", async ({
		page,
	}) => {
		await hover(page, B_PRESS);
		await expect
			.poll(async () => (await testState(page)).preview)
			.toBe("B");
		await press(page, B_PRESS);
		expect((await testState(page)).selected).toEqual(["B"]);

		await press(page, B_PRESS, 2, 0);
		expectMatrix(await matrix(page, "B"), IDENTITY);
		expect((await testState(page)).selected).toEqual(["B"]);
	});

	test("pressing the selected object never deselects it", async ({page}) => {
		await hover(page, B_PRESS);
		await press(page, B_PRESS);
		await press(page, B_PRESS);
		await press(page, B_PRESS);
		expect((await testState(page)).selected).toEqual(["B"]);
	});

	test("a pointercancel returns the object to its placement at the press", async ({
		page,
	}) => {
		await hover(page, B_PRESS);
		await press(page, B_PRESS);
		expect((await testState(page)).selected).toEqual(["B"]);

		const [x, y] = await screen(page, B_PRESS);
		await page.mouse.move(x, y, {steps: 2});
		await page.mouse.down();
		await page.mouse.move(x + 60, y, {steps: 10});
		await cancelPointer(page);
		await page.mouse.up();
		await page.waitForTimeout(200);
		expectMatrix(await matrix(page, "B"), IDENTITY);

		// the next drag works again
		await press(page, B_PRESS, 60, 0);
		expect((await matrix(page, "B"))[12]).toBeGreaterThan(0.1);
	});

	test("the selected rectangle transform wins over a preview where they overlap", async ({
		page,
	}) => {
		// A is selected, the preview of B covers the area below A
		await hover(page, A_PRESS);
		await press(page, A_PRESS);
		expect((await testState(page)).selected).toEqual(["A"]);
		await hover(page, B_PRESS);
		await expect
			.poll(async () => (await testState(page)).preview)
			.toBe("B");

		// a drag on A moves A, B keeps its placement and is not selected
		await press(page, A_PRESS, 60, 0);
		expect((await testState(page)).selected).toEqual(["A"]);
		expect((await matrix(page, "A"))[12]).toBeGreaterThan(0.1);
		expectMatrix(await matrix(page, "B"), IDENTITY);
	});
});

test.describe("Rectangle transform without a preview (touch)", () => {
	test.beforeEach(async ({page}) => {
		await setUpScene(page, false);
	});

	test("the press which selects an object moves it", async ({page}) => {
		const cameraBefore = await camera(page);
		await press(page, B_PRESS, 60, 0);
		expect((await testState(page)).selected).toEqual(["B"]);
		expect((await matrix(page, "B"))[12]).toBeGreaterThan(0.1);
		expectMatrix(await camera(page), cameraBefore);
	});

	test("a click selects the object without moving it", async ({page}) => {
		await press(page, B_PRESS);
		expect((await testState(page)).selected).toEqual(["B"]);
		expectMatrix(await matrix(page, "B"), IDENTITY);
	});
});
