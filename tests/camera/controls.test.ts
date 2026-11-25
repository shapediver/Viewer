import {expect, type Page, test} from "@playwright/test";

// Camera controls (SS-10628): input moves the camera by the documented amount
// and the camera stops when the input stops, on any display refresh rate.
// - a drag that is held still leaves the camera standing still on its goal,
// - a drag rotates by one full turn per canvas height at rotationSpeed 0.5,
// - one wheel notch changes the distance by about 12 %,
// - auto-rotation turns once per minute at autoRotationSpeed 1.

type Pose = {
	azimuth: number;
	distance: number;
	position: number[];
	time: number;
};

const setUpScene = async (page: Page) => {
	await page.goto("test-cdn/index.html");
	await page.evaluate(async () => {
		const SDV = (<any>window).SDV;

		const viewport = await SDV.createViewport({
			canvas: <HTMLCanvasElement>document.getElementById("canvas"),
			id: "myViewport",
			visibility: SDV.VISIBILITY_MODE.MANUAL,
		});

		const positions = new Float32Array(24);
		for (let i = 0; i < 8; i++) {
			positions[i * 3] = i & 1 ? 1 : -1;
			positions[i * 3 + 1] = i & 2 ? 1 : -1;
			positions[i * 3 + 2] = i & 4 ? 1 : -1;
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
		const node = new SDV.TreeNode("box");
		node.addData(geometryData);
		SDV.sceneTree.root.addChild(node);
		SDV.sceneTree.root.updateVersion();
		await viewport.update();
		viewport.show = true;
		await viewport.camera.set([0, -12, 0], [0, 0, 0], {duration: 0});
		viewport.render();

		(<any>window).cameraControlsPose = () => {
			const position = Array.from(viewport.camera.position as number[]);
			const target = Array.from(viewport.camera.target as number[]);
			const offset = position.map((v, i) => v - target[i]);
			return {
				// the angle around the vertical axis, 0 for the start position
				azimuth: Math.atan2(offset[0], -offset[1]),
				distance: Math.hypot(offset[0], offset[1], offset[2]),
				position,
				time: performance.now(),
			};
		};
	});
	// the logo shown while loading sits above the canvas and shifts it down
	await page.locator(".sdv-logo-container").waitFor({state: "hidden"});
	await page.waitForTimeout(500);
};

const pose = (page: Page) =>
	page.evaluate(() => (<any>window).cameraControlsPose()) as Promise<Pose>;

const canvasBox = async (page: Page) => {
	const box = await page.locator("#canvas").boundingBox();
	expect(box).not.toBeNull();
	return box!;
};

// the rotation of a horizontal drag at the default rotationSpeed of 0.5
const rotationOf = (pixels: number, canvasHeight: number) =>
	(pixels * 2 * Math.PI) / canvasHeight;

test.describe("Camera controls", () => {
	test("the camera stands still while the pointer is held still", async ({
		page,
	}) => {
		await setUpScene(page);
		const box = await canvasBox(page);
		const x = box.x + box.width / 2 - 100;
		const y = box.y + box.height / 2;
		const distance = 200;

		await page.mouse.move(x, y);
		await page.mouse.down();
		await page.mouse.move(x + distance, y, {steps: 10});

		// button still down
		await page.waitForTimeout(1000);
		const first = await pose(page);
		await page.waitForTimeout(200);
		const second = await pose(page);
		expect(second.position).toEqual(first.position);
		// and it stands on the goal of the drag
		expect(first.azimuth).toBeCloseTo(-rotationOf(distance, box.height), 3);

		// releasing a pointer that stands still gives no inertia
		await page.mouse.up();
		await page.waitForTimeout(500);
		const third = await pose(page);
		expect(third.position).toEqual(first.position);
	});

	test("a drag rotates by one full turn per canvas height", async ({
		page,
	}) => {
		await setUpScene(page);
		await page.evaluate(() => {
			const camera = (<any>window).SDV.viewports["myViewport"].camera;
			camera.damping = 1;
			camera.movementSmoothness = 0;
		});
		const box = await canvasBox(page);
		const x = box.x + box.width / 2 - 100;
		const y = box.y + box.height / 2;
		const distance = 120;

		await page.mouse.move(x, y);
		await page.mouse.down();
		await page.mouse.move(x + distance, y, {steps: 6});
		await page.mouse.up();
		await page.waitForTimeout(300);

		const result = await pose(page);
		expect(result.azimuth).toBeCloseTo(
			-rotationOf(distance, box.height),
			3,
		);
		expect(result.distance).toBeCloseTo(12, 3);
	});

	test("one wheel notch changes the distance by about 12 %", async ({
		page,
	}) => {
		await setUpScene(page);
		const box = await canvasBox(page);
		await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);

		await page.mouse.wheel(0, -100);
		await page.waitForTimeout(2000);
		const zoomedIn = await pose(page);
		expect(zoomedIn.distance / 12).toBeCloseTo(Math.exp(-0.125), 3);

		await page.mouse.wheel(0, 100);
		await page.waitForTimeout(2000);
		const zoomedOut = await pose(page);
		expect(zoomedOut.distance).toBeCloseTo(12, 2);
	});

	test("auto-rotation turns once per minute at autoRotationSpeed 1", async ({
		page,
	}) => {
		await setUpScene(page);
		await page.evaluate(() => {
			const camera = (<any>window).SDV.viewports["myViewport"].camera;
			camera.autoRotationSpeed = 1;
			camera.enableAutoRotation = true;
		});
		await page.waitForTimeout(200);

		const start = await pose(page);
		await page.waitForTimeout(2000);
		const end = await pose(page);

		const expected = (2 * Math.PI * (end.time - start.time)) / 60000;
		const angle = Math.abs(end.azimuth - start.azimuth);
		expect(angle).toBeGreaterThan(expected * 0.95);
		expect(angle).toBeLessThan(expected * 1.05);
	});
});
