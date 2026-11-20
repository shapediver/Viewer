import {expect, type Page, test} from "@playwright/test";

// DragManager.dragThreshold (SS-10359): with a plane restriction and a drag
// origin at the bottom of a tall object,
// - a click on the top of the object moves nothing and emits no drag events,
// - a press below the threshold moves nothing either,
// - a drag past the threshold moves the object,
// - without the setting, the same click moves the object (snap on pointerdown).

type Point = [number, number, number];

// on the front face, near the top of the object
const TOP: Point = [0, -0.5, 3.5];

const setUpScene = async (page: Page, dragThreshold: boolean) => {
	await page.goto("test-cdn/index.html");
	await page.evaluate(async (dragThreshold) => {
		const SDV = (<any>window).SDV;
		const {DragManager, InteractionData, InteractionEngine} = (<any>window)
			.SDVInteractions;

		const viewport = await SDV.createViewport({
			canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			id: "myViewport",
			visibility: SDV.VISIBILITY_MODE.MANUAL,
		});

		const min = [-0.5, -0.5, 0];
		const max = [0.5, 0.5, 4];
		const positions = new Float32Array(24);
		for (let i = 0; i < 8; i++) {
			positions[i * 3] = i & 1 ? max[0] : min[0];
			positions[i * 3 + 1] = i & 2 ? max[1] : min[1];
			positions[i * 3 + 2] = i & 4 ? max[2] : min[2];
		}
		const indices = new Uint16Array([
			0, 2, 3, 0, 3, 1, 4, 5, 7, 4, 7, 6, 0, 1, 5, 0, 5, 4, 2, 7, 3, 2, 6,
			7, 0, 4, 6, 0, 6, 2, 1, 3, 7, 1, 7, 5,
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
		const node = new SDV.TreeNode("vase");
		node.addData(geometryData);
		SDV.sceneTree.root.addChild(node);
		SDV.sceneTree.root.updateVersion();
		await viewport.update();
		viewport.show = true;
		await viewport.camera.set([0, -12, 6], [0, 0, 1.5], {duration: 0});
		viewport.render();

		const engine = new InteractionEngine(viewport);
		const dragManager = new DragManager("drag");
		dragManager.dragThreshold = dragThreshold;
		engine.addInteractionManager(dragManager);
		dragManager.addRestriction({
			type: "plane",
			id: "zPlane",
			origin: [0, 0, 0],
			vector_u: [1, 0, 0],
			vector_v: [0, 1, 0],
		});
		const data = new InteractionData({drag: true});
		// the bottom centre of the object stays on the plane
		data.dragOrigin = [0, 0, 0];
		node.addData(data);
		node.updateVersion();
		await viewport.update();

		const state = {events: [] as string[]};
		(<any>window).dragThresholdState = state;
		for (const type of ["DRAG_START", "DRAG_END"])
			SDV.addListener(SDV.EVENTTYPE.INTERACTION[type], (e: any) => {
				if (e.manager === dragManager) state.events.push(type);
			});

		(<any>window).dragThresholdMatrix = () => {
			const t = node.transformations.find(
				(t: any) => t.id === "SD_drag_matrix",
			);
			return t ? Array.from(t.matrix as number[]).slice(12, 15) : null;
		};
		(<any>window).dragThresholdScreen = (p: number[]) => {
			const ndc = viewport.camera.project(p);
			const rect = viewport.canvas.getBoundingClientRect();
			return [
				rect.left + ((ndc[0] + 1) / 2) * rect.width,
				rect.top + ((1 - ndc[1]) / 2) * rect.height,
			];
		};
	}, dragThreshold);
	// the logo shown while loading sits above the canvas and shifts it down
	await page.locator(".sdv-logo-container").waitFor({state: "hidden"});
	await page.waitForTimeout(500);
};

const screen = async (page: Page, p: Point) =>
	(await page.evaluate((p) => (<any>window).dragThresholdScreen(p), p)) as [
		number,
		number,
	];

const events = (page: Page) =>
	page.evaluate(() => [...(<any>window).dragThresholdState.events]);

// the translation of the drag matrix, null if the object was not dragged
const translation = (page: Page) =>
	page.evaluate(() => (<any>window).dragThresholdMatrix());

const press = async (page: Page, p: Point, dx: number) => {
	const [x, y] = await screen(page, p);
	await page.mouse.move(x, y);
	await page.mouse.down();
	if (dx !== 0) await page.mouse.move(x + dx, y, {steps: 4});
	await page.mouse.up();
	await page.waitForTimeout(300);
};

test.describe("Drag threshold", () => {
	test("a click on the object moves nothing", async ({page}) => {
		await setUpScene(page, true);
		await press(page, TOP, 0);
		expect(await events(page)).toEqual([]);
		expect(await translation(page)).toBeNull();
	});

	test("a press moved below the threshold moves nothing", async ({page}) => {
		await setUpScene(page, true);
		await press(page, TOP, 2);
		expect(await events(page)).toEqual([]);
		expect(await translation(page)).toBeNull();
	});

	test("a drag past the threshold moves the object on the plane", async ({
		page,
	}) => {
		await setUpScene(page, true);
		await press(page, TOP, 60);
		expect(await events(page)).toEqual(["DRAG_START", "DRAG_END"]);
		const t = (await translation(page)) as number[];
		expect(t).not.toBeNull();
		// the drag origin stays on the plane
		expect(Math.abs(t[2])).toBeLessThan(1e-4);
		expect(Math.hypot(t[0], t[1])).toBeGreaterThan(0.1);
	});

	test("without the setting a click moves the object", async ({page}) => {
		await setUpScene(page, false);
		await press(page, TOP, 0);
		expect(await events(page)).toEqual(["DRAG_START", "DRAG_END"]);
		const t = (await translation(page)) as number[];
		expect(Math.hypot(t[0], t[1])).toBeGreaterThan(0.1);
	});
});
