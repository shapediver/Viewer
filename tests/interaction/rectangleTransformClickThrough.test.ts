import {expect, type Page, test} from "@playwright/test";

// An object with a rectangle transform and a select manager of its own
// (SS-10334, e.g. an artwork with a menu): the plane of the rectangle wins
// the press, the object is selected once the pointer is released, whether or
// not it was dragged. A press on the selected object never deselects it.

type Point = [number, number, number];

// on top of the box, away from the handles of the rectangle
const TOP: Point = [0, 0, 1];

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

		const positions = new Float32Array(24);
		const min = [-2, -2, 0];
		const max = [2, 2, 1];
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

		// the object with the select manager (the menu) holds the node the
		// rectangle transform moves, like an artwork and its instance node
		const object = new SDV.TreeNode("object");
		const target = new SDV.TreeNode("target");
		const geometry = new SDV.TreeNode("geometry");
		geometry.addData(geometryData);
		target.addChild(geometry);
		object.addChild(target);
		SDV.sceneTree.root.addChild(object);
		SDV.sceneTree.root.updateVersion();
		await viewport.update();
		viewport.show = true;
		await viewport.camera.set([0, -1, 20], [0, 0, 0], {duration: 0});
		viewport.render();

		const state = {selected: [] as string[], hovered: false};
		(<any>window).clickThroughState = state;

		const engine = new InteractionEngine(viewport);
		const select = new SelectManager("select_object");
		const hover = new HoverManager("hover_object");
		engine.addInteractionManager(select);
		engine.addInteractionManager(hover);
		object.addData(
			new InteractionData({select: true, hover: true}, undefined, [
				select.id,
				hover.id,
			]),
		);
		object.updateVersion();
		await viewport.update();

		SDV.addListener(SDV.EVENTTYPE.INTERACTION.SELECT_ON, (e: any) => {
			if (e.manager.id === select.id) state.selected.push("object");
		});
		SDV.addListener(SDV.EVENTTYPE.INTERACTION.SELECT_OFF, (e: any) => {
			if (e.manager.id === select.id)
				state.selected = state.selected.filter((n) => n !== "object");
		});

		SDV.addListener(SDV.EVENTTYPE.INTERACTION.HOVER_ON, (e: any) => {
			if (e.manager.id === hover.id) state.hovered = true;
		});
		SDV.addListener(SDV.EVENTTYPE.INTERACTION.HOVER_OFF, (e: any) => {
			if (e.manager.id === hover.id) state.hovered = false;
		});

		new RectangleTransform(viewport, [target], {
			plane: {
				type: "plane",
				origin: [0, 0, 0],
				vector_u: [1, 0, 0],
				vector_v: [0, 1, 0],
			},
			translateOnObjects: true,
		});

		(<any>window).clickThroughMatrix = () =>
			Array.from(
				target.transformations.find(
					(t: any) => t.id === "SD_transformation_tools_matrix",
				)?.matrix ?? [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
			);
		(<any>window).clickThroughScreen = (p: number[]) => {
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
	(await page.evaluate((p) => (<any>window).clickThroughScreen(p), p)) as [
		number,
		number,
	];

const selected = async (page: Page) =>
	(await page.evaluate(() => [
		...(<any>window).clickThroughState.selected,
	])) as string[];

const hovered = async (page: Page) =>
	(await page.evaluate(
		() => (<any>window).clickThroughState.hovered,
	)) as boolean;

const matrix = async (page: Page) =>
	(await page.evaluate(() => (<any>window).clickThroughMatrix())) as number[];

const press = async (page: Page, p: Point, dx = 0, dy = 0) => {
	const [x, y] = await screen(page, p);
	await page.mouse.move(x, y, {steps: 2});
	await page.mouse.down();
	if (dx !== 0 || dy !== 0)
		await page.mouse.move(x + dx, y + dy, {steps: 10});
	await page.mouse.up();
	await page.waitForTimeout(200);
};

test.describe("The object under the plane of a rectangle transform", () => {
	test.beforeEach(async ({page}) => {
		await setUpScene(page);
	});

	test("the object keeps its hover under the plane", async ({page}) => {
		const [x, y] = await screen(page, TOP);
		await page.mouse.move(x, y, {steps: 5});
		await expect.poll(() => hovered(page)).toBe(true);
		await page.mouse.move(10, 10, {steps: 5});
		await expect.poll(() => hovered(page)).toBe(false);
	});

	test("a click selects the object", async ({page}) => {
		expect(await selected(page)).toEqual([]);
		await press(page, TOP);
		expect(await selected(page)).toEqual(["object"]);
		expect((await matrix(page))[12]).toBeCloseTo(0, 4);
	});

	test("a drag moves the object and selects it", async ({page}) => {
		await press(page, TOP, 40, 0);
		expect(await selected(page)).toEqual(["object"]);
		expect(Math.abs((await matrix(page))[12])).toBeGreaterThan(0.1);
	});

	test("a press on the selected object does not deselect it", async ({
		page,
	}) => {
		await press(page, TOP);
		expect(await selected(page)).toEqual(["object"]);
		await press(page, TOP);
		expect(await selected(page)).toEqual(["object"]);
		const before = (await matrix(page))[12];
		await press(page, TOP, 40, 0);
		expect(await selected(page)).toEqual(["object"]);
		expect(Math.abs((await matrix(page))[12] - before)).toBeGreaterThan(
			0.1,
		);
	});
});
