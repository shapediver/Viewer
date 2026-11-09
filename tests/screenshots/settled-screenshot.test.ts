import {expect, test} from "@playwright/test";

/**
 * getScreenshot after the camera has settled. The drawing buffer is not
 * kept between frames, so this has to read the canvas in the same turn as
 * the draw. The buffer flag itself is intentionally not asserted here.
 */
test("settled camera screenshot still shows the model", async ({page}) => {
	await page.goto("test-cdn/index.html");
	await page.waitForFunction(() => Boolean((window as any).SDV));

	const shot = await page.evaluate(async () => {
		const SDV = (window as any).SDV;
		const viewer = await SDV.createViewport({
			id: "settled-screenshot",
			canvas: document.getElementById("canvas"),
		});
		viewer.shadows = false;
		viewer.softShadows = false;
		viewer.gridVisibility = false;
		viewer.groundPlaneVisibility = false;
		viewer.groundPlaneShadowVisibility = false;
		viewer.contactShadowVisibility = false;
		viewer.environmentMap = SDV.ENVIRONMENT_MAP_EMPTY.NONE;
		viewer.beautyRenderDelay = 0;
		viewer.beautyRenderBlendingDuration = 0;

		const indices = new Uint16Array([
			0, 2, 3, 0, 3, 1, 4, 5, 7, 4, 7, 6, 0, 1, 5, 0, 5, 4, 2, 7, 3, 2, 6,
			7, 0, 4, 6, 0, 6, 2, 1, 3, 7, 1, 7, 5,
		]);
		const positions = new Float32Array(24);
		const min = [-4, -4, -0.2];
		const max = [4, 4, 0.2];
		for (let i = 0; i < 8; i++) {
			positions[i * 3] = i & 1 ? max[0] : min[0];
			positions[i * 3 + 1] = i & 2 ? max[1] : min[1];
			positions[i * 3 + 2] = i & 4 ? max[2] : min[2];
		}
		const geometry = new SDV.GeometryData(
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
		geometry.material = new SDV.MaterialUnlitData({color: "#ff0000"});
		const node = new SDV.TreeNode("red");
		node.addData(geometry);
		SDV.sceneTree.root.addChild(node);
		SDV.sceneTree.root.updateVersion();
		const settled = new Promise<void>((resolve) => {
			SDV.addListener(
				SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
				() => resolve(),
			);
			setTimeout(resolve, 5000);
		});
		viewer.update();
		viewer.show = true;
		await viewer.camera.set([0, 0, 8], [0, 0, 0], {duration: 0});
		await settled;
		await new Promise<void>((resolve) => {
			requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
		});

		const url = viewer.getScreenshot();
		const bitmap = await createImageBitmap(await (await fetch(url)).blob());
		const canvas = document.createElement("canvas");
		canvas.width = bitmap.width;
		canvas.height = bitmap.height;
		const context = canvas.getContext("2d")!;
		context.drawImage(bitmap, 0, 0);
		const pixel = context.getImageData(
			Math.floor(bitmap.width / 2),
			Math.floor(bitmap.height / 2),
			1,
			1,
		).data;
		return {
			prefix: url.slice(0, 22),
			pixel: [pixel[0], pixel[1], pixel[2]],
		};
	});

	expect(shot.prefix).toBe("data:image/png;base64,");
	expect(shot.pixel[0], JSON.stringify(shot.pixel)).toBeGreaterThan(200);
	expect(shot.pixel[1], JSON.stringify(shot.pixel)).toBeLessThan(40);
	expect(shot.pixel[2], JSON.stringify(shot.pixel)).toBeLessThan(40);
});
