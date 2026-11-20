import {expect, type Page, test} from "@playwright/test";

// A rectangle transform which reports its matrix without a move (SS-10334,
// e.g. a flower on a slanted stone): the matrices are the identity, without
// rounding errors. A listener takes any other matrix for a move.

type Point = [number, number, number];

// the panel is tilted around the x axis, like the face of a slant marker
const ANGLE = (35 * Math.PI) / 180;
const U: Point = [1, 0, 0];
const V: Point = [0, Math.cos(ANGLE), Math.sin(ANGLE)];
const N: Point = [0, -Math.sin(ANGLE), Math.cos(ANGLE)];
// near the origin, and far from it (rounding errors grow with the distance)
const ORIGINS: Point[] = [
	[3.7, -1.3, 2.9],
	[1503.7, -801.3, 602.9],
	[15003.7, -8001.3, 6002.9],
];

const onPanel = (ORIGIN: Point, u: number, v: number): Point => [
	ORIGIN[0] + u * U[0] + v * V[0],
	ORIGIN[1] + u * U[1] + v * V[1],
	ORIGIN[2] + u * U[2] + v * V[2],
];

const setUpScene = async (page: Page, ORIGIN: Point) => {
	await page.goto("test-cdn/index.html");
	await page.evaluate(
		async ({ORIGIN, U, V, N}) => {
			const SDV = (<any>window).SDV;
			const {RectangleTransform} = (<any>window).SDVTransformationTools;

			const viewport = await SDV.createViewport({
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
				id: "myViewport",
				visibility: SDV.VISIBILITY_MODE.MANUAL,
			});

			// a thin panel in the tilted plane, 3 by 2, with its corner at ORIGIN
			const corner = (u: number, v: number, n: number) =>
				[0, 1, 2].map(
					(k) => ORIGIN[k] + u * U[k] + v * V[k] + n * N[k],
				);
			const positions = new Float32Array(24);
			for (let i = 0; i < 8; i++)
				positions.set(
					corner(i & 1 ? 3 : 0, i & 2 ? 2 : 0, i & 4 ? 0.1 : 0),
					i * 3,
				);
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
			const node = new SDV.TreeNode("panel");
			node.addData(geometryData);
			SDV.sceneTree.root.addChild(node);
			SDV.sceneTree.root.updateVersion();
			await viewport.update();
			viewport.show = true;
			// look at the panel along its normal
			const center = corner(1.5, 1, 0.1);
			await viewport.camera.set(
				[0, 1, 2].map((k) => center[k] + 12 * N[k]),
				center,
				{duration: 0},
			);
			viewport.render();

			const state = {matrices: [] as number[][]};
			(<any>window).atRestState = state;
			SDV.addListener(
				SDV.EVENTTYPE_TRANSFORMATION_TOOLS.MATRIX_CHANGED,
				(e: any) => {
					for (const m of [
						...e.transformations,
						...e.localTransformations,
					])
						state.matrices.push(Array.from(m));
				},
			);

			new RectangleTransform(viewport, [node], {
				plane: {
					type: "plane",
					origin: ORIGIN,
					vector_u: U,
					vector_v: V,
				},
			});

			(<any>window).atRestScreen = (p: number[]) => {
				const ndc = viewport.camera.project(p);
				const rect = viewport.canvas.getBoundingClientRect();
				return [
					rect.left + ((ndc[0] + 1) / 2) * rect.width,
					rect.top + ((1 - ndc[1]) / 2) * rect.height,
				];
			};
		},
		{ORIGIN, U, V, N},
	);
	// the logo shown while loading sits above the canvas and shifts it down
	await page.locator(".sdv-logo-container").waitFor({state: "hidden"});
	await page.waitForTimeout(500);
};

const IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

for (const ORIGIN of ORIGINS) {
	test.describe(`A rectangle transform on a tilted plane at rest, at ${ORIGIN.join(", ")}`, () => {
		test.beforeEach(async ({page}) => {
			await setUpScene(page, ORIGIN);
		});

		test("a press on the plane without a move reports identity matrices", async ({
			page,
		}) => {
			const [x, y] = (await page.evaluate(
				(p) => (<any>window).atRestScreen(p),
				onPanel(ORIGIN, 1.5, 1),
			)) as [number, number];
			await page.mouse.move(x, y, {steps: 4});
			await page.mouse.down();
			await page.mouse.up();
			await page.waitForTimeout(500);

			const matrices = (await page.evaluate(
				() => (<any>window).atRestState.matrices,
			)) as number[][];
			expect(matrices.length).toBeGreaterThan(0);
			for (const m of matrices) expect(m).toEqual(IDENTITY);
		});

		test("a move of the plane reports its translation", async ({page}) => {
			const [[x1, y1], [x2, y2]] = (await page.evaluate(
				(ps) => ps.map((p) => (<any>window).atRestScreen(p)),
				[onPanel(ORIGIN, 1.5, 1), onPanel(ORIGIN, 2, 1.25)],
			)) as [number, number][];
			await page.mouse.move(x1, y1, {steps: 4});
			await page.mouse.down();
			await page.mouse.move(x2, y2, {steps: 8});
			await page.mouse.up();
			await page.waitForTimeout(500);

			const matrices = (await page.evaluate(
				() => (<any>window).atRestState.matrices,
			)) as number[][];
			// the move is about 0.5 along u and 0.25 along v
			const moved = matrices.filter(
				(m) => Math.hypot(m[12], m[13], m[14]) > 0.2,
			);
			expect(moved.length).toBeGreaterThan(0);
		});
	});
}
