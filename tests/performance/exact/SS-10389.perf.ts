import {expect} from "@playwright/test";
import {open, test} from "./harness";

test("SS-10389 drawing buffer is not preserved and the screenshot still has the model", async ({
	page,
}) => {
	await open(page);
	const shot = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const geometry = perf.boxGeometry([-4, -4, -0.2], [4, 4, 0.2]);
		geometry.material = new SDV.MaterialUnlitData({color: "#ff0000"});
		const node = new SDV.TreeNode("red");
		node.addData(geometry);
		SDV.sceneTree.root.addChild(node);
		SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
		perf.viewport.show = true;
		await perf.viewport.camera.set([0, 0, 8], [0, 0, 0], {duration: 0});
		await perf.nextFrame();
		const url = perf.viewport.getScreenshot();
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
			preserve: perf.gl.getContextAttributes().preserveDrawingBuffer,
			prefix: url.slice(0, 22),
			pixel: [pixel[0], pixel[1], pixel[2]],
		};
	});
	expect(shot.prefix).toBe("data:image/png;base64,");
	expect(shot.pixel[0], JSON.stringify(shot.pixel)).toBeGreaterThan(200);
	expect(shot.pixel[1], JSON.stringify(shot.pixel)).toBeLessThan(40);
	expect(shot.pixel[2], JSON.stringify(shot.pixel)).toBeLessThan(40);
	expect(shot.preserve).toBe(false);
});
