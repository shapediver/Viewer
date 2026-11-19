import {expect} from "@playwright/test";
import {open, skipOnSoftwareRenderer, test} from "./harness";

test("SS-10384 scene update does not compile shaders synchronously", async ({
	page,
}) => {
	await skipOnSoftwareRenderer(
		page,
		"the test asserts a hardware renderer; SwiftShader compiles differently",
	);
	await open(page);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		const gpu = await perf.create({shadows: false});
		perf.viewport.show = true;
		perf.viewport.update();
		await perf.nextFrame();
		const gl = perf.gl;
		const parallel = Boolean(
			gl.getExtension("KHR_parallel_shader_compile"),
		);
		// three.js r184 compileAsync calls renderer.compile itself to start
		// the programs, so counting compile calls says nothing. What blocks
		// the page is a program query other than COMPLETION_STATUS_KHR while
		// the driver is still compiling. Count those for the new programs.
		const COMPLETION_STATUS_KHR = 0x91b1;
		const query = gl.getProgramParameter.bind(gl);
		const before = new Set(
			(perf.renderer.info.programs ?? []).map(
				(item: any) => item.program,
			),
		);
		const created = new Set<WebGLProgram>();
		let blockingQueries = 0;
		gl.getProgramParameter = (program: WebGLProgram, pname: number) => {
			if (!before.has(program)) {
				created.add(program);
				if (
					pname !== COMPLETION_STATUS_KHR &&
					!query(program, COMPLETION_STATUS_KHR)
				)
					blockingQueries++;
			}
			return query(program, pname);
		};
		perf.renders.length = 0;
		// The animation loop sees the new root version, updates the scene
		// and asks for a frame in the same callback.
		perf.addBoxes(
			4,
			new SDV.MaterialStandardData({
				color: "#44aaff",
				side: SDV.MATERIAL_SIDE.FRONT,
			}),
		);
		await new Promise<void>((resolve) => {
			const check = () => {
				const drawn = perf.renders.some(
					(pass: any) => pass.target === null && pass.triangles >= 12,
				);
				if (drawn) resolve();
				else requestAnimationFrame(check);
			};
			check();
		});
		return {
			gpu,
			parallel,
			created: created.size,
			blockingQueries,
			screenshot: perf.viewport.getScreenshot().length,
		};
	});
	expect(result.gpu.toLowerCase(), result.gpu).not.toContain("swiftshader");
	expect(result.parallel, JSON.stringify(result)).toBe(true);
	expect(result.created, JSON.stringify(result)).toBeGreaterThan(0);
	expect(result.blockingQueries, JSON.stringify(result)).toBe(0);
	expect(result.screenshot, JSON.stringify(result)).toBeGreaterThan(1000);
});

test("SS-10384 a screenshot in the turn of a scene update shows the update", async ({
	page,
}) => {
	await open(page);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		perf.viewport.show = true;
		perf.viewport.update();
		await perf.nextFrame();
		perf.addBoxes(
			4,
			new SDV.MaterialStandardData({
				color: "#44aaff",
				side: SDV.MATERIAL_SIDE.FRONT,
			}),
		);
		perf.renders.length = 0;
		perf.viewport.update();
		const screenshot = perf.viewport.getScreenshot();
		// The screenshot draws in the same turn, with the programs of the
		// update, whether or not their parallel compile has finished. The
		// camera has not moved yet, so not every box is inside the frustum.
		const drawn = perf.renders.some(
			(pass: any) => pass.target === null && pass.triangles >= 12,
		);
		// Closing while programs may still be compiling leaves nothing
		// behind that fires later.
		const errors: string[] = [];
		window.addEventListener("error", (event) =>
			errors.push(String(event.message)),
		);
		await perf.viewport.close();
		await new Promise((resolve) => setTimeout(resolve, 100));
		return {drawn, screenshot: screenshot.length, errors};
	});
	expect(result.drawn, JSON.stringify(result)).toBe(true);
	expect(result.screenshot, JSON.stringify(result)).toBeGreaterThan(1000);
	expect(result.errors, JSON.stringify(result)).toEqual([]);
});
