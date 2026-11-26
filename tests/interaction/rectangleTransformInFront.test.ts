import {expect, type Page, test} from "@playwright/test";

// An object in front of an object with a rectangle transform (SS-10327, e.g.
// the text on a banner), the text has an invisible mesh as its hover area:
// - the closest object wins the hover, also where only its invisible mesh is
//   hit, the object behind it is not hovered,
// - the hover of the plane (move cursor) is only shown where no object is in
//   front of it, for a shown rectangle and for a preview.

type Point = [number, number, number];

// on top of the box, away from the object in front
const BOX: Point = [1.5, 1.5, 1];
// on top of the invisible mesh of the object in front
const FRONT: Point = [0, 0, 1.2];

const setUpScene = async (page: Page, preview: boolean) => {
	await page.goto("test-cdn/index.html");
	await page.evaluate(async (preview) => {
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

		const createBox = (
			name: string,
			min: number[],
			max: number[],
			material: any,
		) => {
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
			geometryData.material = material;
			const node = new SDV.TreeNode(name);
			node.addData(geometryData);
			SDV.sceneTree.root.addChild(node);
			return node;
		};

		const nodes: {[name: string]: any} = {
			box: createBox(
				"box",
				[-2, -2, 0],
				[2, 2, 1],
				new SDV.MaterialStandardData({
					color: "#0088ff",
					side: SDV.MATERIAL_SIDE.DOUBLE,
				}),
			),
			// the hover area of the object in front: not visible
			front: createBox(
				"front",
				[-0.5, -0.5, 1],
				[0.5, 0.5, 1.2],
				new SDV.MaterialStandardData({
					color: "#ffffff",
					opacity: 0,
					alphaMode: "blend",
					side: SDV.MATERIAL_SIDE.DOUBLE,
				}),
			),
		};
		SDV.sceneTree.root.updateVersion();
		await viewport.update();
		viewport.show = true;
		await viewport.camera.set([0, -1, 20], [0, 0, 0], {duration: 0});
		viewport.render();

		const state = {hovered: [] as string[]};
		(<any>window).inFrontState = state;

		const engine = new InteractionEngine(viewport);
		const names: {[id: string]: string} = {};
		for (const name of Object.keys(nodes)) {
			const select = new SelectManager(`select_${name}`);
			const hover = new HoverManager(`hover_${name}`);
			names[select.id] = name;
			names[hover.id] = name;
			engine.addInteractionManager(select);
			engine.addInteractionManager(hover);
			// the occlusion by scene geometry makes the closest object win
			hover.occludeBySceneGeometry = true;
			select.occludeBySceneGeometry = true;
			nodes[name].addData(
				new InteractionData({select: true, hover: true}, undefined, [
					select.id,
					hover.id,
				]),
			);
			nodes[name].updateVersion();
		}
		await viewport.update();

		SDV.addListener(SDV.EVENTTYPE.INTERACTION.HOVER_ON, (e: any) => {
			const name = names[e.manager.id];
			if (name && !state.hovered.includes(name)) state.hovered.push(name);
		});
		SDV.addListener(SDV.EVENTTYPE.INTERACTION.HOVER_OFF, (e: any) => {
			const name = names[e.manager.id];
			if (name) state.hovered = state.hovered.filter((n) => n !== name);
		});

		new RectangleTransform(
			viewport,
			[nodes.box],
			{
				plane: {
					type: "plane",
					origin: [0, 0, 0],
					vector_u: [1, 0, 0],
					vector_v: [0, 1, 0],
				},
				translateOnObjects: true,
				...(preview ? {preview: true} : {}),
			},
			preview ? "preview" : undefined,
		);

		(<any>window).inFrontScreen = (p: number[]) => {
			const ndc = viewport.camera.project(p);
			const rect = viewport.canvas.getBoundingClientRect();
			return [
				rect.left + ((ndc[0] + 1) / 2) * rect.width,
				rect.top + ((1 - ndc[1]) / 2) * rect.height,
			];
		};
	}, preview);
	// the logo shown while loading sits above the canvas and shifts it down
	await page.locator(".sdv-logo-container").waitFor({state: "hidden"});
	await page.waitForTimeout(500);
};

const hoverAt = async (page: Page, p: Point) => {
	const [x, y] = (await page.evaluate(
		(p) => (<any>window).inFrontScreen(p),
		p,
	)) as [number, number];
	await page.mouse.move(10, 10);
	await page.mouse.move(x, y, {steps: 6});
	await page.waitForTimeout(300);
};

const hovered = (page: Page) =>
	page.evaluate(() => [...(<any>window).inFrontState.hovered].sort());

const cursor = (page: Page) =>
	page.evaluate(
		() =>
			(<HTMLCanvasElement>document.getElementById("canvas")).style.cursor,
	);

for (const preview of [false, true]) {
	test.describe(`An object in front of a rectangle transform${preview ? " preview" : ""}`, () => {
		test.beforeEach(async ({page}) => {
			await setUpScene(page, preview);
		});

		test("the object behind keeps the hover and the plane shows the move cursor", async ({
			page,
		}) => {
			await hoverAt(page, BOX);
			await expect.poll(() => hovered(page)).toEqual(["box"]);
			await expect.poll(() => cursor(page)).toBe("move");
		});

		test("the closest object wins the hover on its invisible mesh, the plane does not show the move cursor", async ({
			page,
		}) => {
			await hoverAt(page, FRONT);
			await expect.poll(() => hovered(page)).toEqual(["front"]);
			await expect.poll(() => cursor(page)).not.toBe("move");
		});
	});
}
