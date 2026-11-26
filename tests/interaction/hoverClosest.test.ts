import {expect, type Page, test} from "@playwright/test";

// Objects on top of each other, each with its own hover manager (SS-10334,
// e.g. a text on a panel, each with its own rectangle transform), without
// occludeBySceneGeometry:
// - only the closest object is hovered, the object behind it is not,
// - an object is hovered where nothing is in front of it,
// - two managers which hover the same object both hover it (a tie).

type Point = [number, number, number];

// on top of the panel, away from the text
const PANEL: Point = [1.5, 1.5, 1];
// on top of the text
const TEXT: Point = [0, 0, 1.2];

const setUpScene = async (page: Page) => {
	await page.goto("test-cdn/index.html");
	await page.evaluate(async () => {
		const SDV = (<any>window).SDV;
		const {HoverManager, InteractionData, InteractionEngine} = (<any>window)
			.SDVInteractions;

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
				color: "#0088ff",
				side: SDV.MATERIAL_SIDE.DOUBLE,
			});
			const node = new SDV.TreeNode(name);
			node.addData(geometryData);
			SDV.sceneTree.root.addChild(node);
			return node;
		};

		const nodes: {[name: string]: any} = {
			panel: createBox("panel", [-2, -2, 0], [2, 2, 1]),
			text: createBox("text", [-0.5, -0.5, 1], [0.5, 0.5, 1.2]),
		};
		SDV.sceneTree.root.updateVersion();
		await viewport.update();
		viewport.show = true;
		await viewport.camera.set([0, -1, 20], [0, 0, 0], {duration: 0});
		viewport.render();

		const state = {hovered: [] as string[]};
		(<any>window).hoverClosestState = state;

		const engine = new InteractionEngine(viewport);
		const names: {[id: string]: string} = {};
		const addHover = (id: string, node: any) => {
			const hover = new HoverManager(id);
			names[hover.id] = id;
			engine.addInteractionManager(hover);
			node.addData(
				new InteractionData({hover: true}, undefined, [hover.id]),
			);
			node.updateVersion();
		};
		addHover("panel", nodes.panel);
		addHover("text", nodes.text);
		// a second manager on the text, e.g. a selection next to the transform
		addHover("text2", nodes.text);
		await viewport.update();

		SDV.addListener(SDV.EVENTTYPE.INTERACTION.HOVER_ON, (e: any) => {
			const name = names[e.manager.id];
			if (name && !state.hovered.includes(name)) state.hovered.push(name);
		});
		SDV.addListener(SDV.EVENTTYPE.INTERACTION.HOVER_OFF, (e: any) => {
			const name = names[e.manager.id];
			if (name) state.hovered = state.hovered.filter((n) => n !== name);
		});

		(<any>window).hoverClosestScreen = (p: number[]) => {
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

const hoverAt = async (page: Page, p: Point) => {
	const [x, y] = (await page.evaluate(
		(p) => (<any>window).hoverClosestScreen(p),
		p,
	)) as [number, number];
	await page.mouse.move(10, 10);
	await page.mouse.move(x, y, {steps: 6});
	await page.waitForTimeout(300);
};

// move without leaving the canvas first
const moveTo = async (page: Page, p: Point) => {
	const [x, y] = (await page.evaluate(
		(p) => (<any>window).hoverClosestScreen(p),
		p,
	)) as [number, number];
	await page.mouse.move(x, y, {steps: 6});
	await page.waitForTimeout(300);
};

const hovered = (page: Page) =>
	page.evaluate(() => [...(<any>window).hoverClosestState.hovered].sort());

test.describe("Objects of different hover managers on top of each other", () => {
	test.beforeEach(async ({page}) => {
		await setUpScene(page);
	});

	test("the object behind is hovered where nothing is in front of it", async ({
		page,
	}) => {
		await hoverAt(page, PANEL);
		await expect.poll(() => hovered(page)).toEqual(["panel"]);
	});

	test("only the closest object is hovered, by each of its managers", async ({
		page,
	}) => {
		await hoverAt(page, TEXT);
		await expect.poll(() => hovered(page)).toEqual(["text", "text2"]);
	});

	test("moving from the object behind onto the object in front unhovers the one behind", async ({
		page,
	}) => {
		await hoverAt(page, PANEL);
		await expect.poll(() => hovered(page)).toEqual(["panel"]);
		await moveTo(page, TEXT);
		await expect.poll(() => hovered(page)).toEqual(["text", "text2"]);
		await moveTo(page, PANEL);
		await expect.poll(() => hovered(page)).toEqual(["panel"]);
	});
});
