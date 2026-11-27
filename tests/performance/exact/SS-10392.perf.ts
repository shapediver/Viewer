import {expect, type Page} from "@playwright/test";
import {open, skipOnSoftwareRenderer, test} from "./harness";

test("SS-10392 the beauty blend renders 16 frames across 1500ms", async ({
	page,
}) => {
	await skipOnSoftwareRenderer(
		page,
		"the beauty blend is the soft-shadow fade, off on SwiftShader",
	);
	test.fail(
		true,
		"SS-10687 not implemented: the capped fade (16 frames) moved to SS-10687",
	);
	await page.clock.install({time: new Date("2026-01-01T00:00:00Z")});
	await open(page);
	await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({
			shadows: true,
			softShadows: true,
			beautyDelay: 50,
			beautyDuration: 1500,
		});
		perf.addBoxes(
			1,
			new SDV.MaterialStandardData({
				color: "#8899aa",
				side: SDV.MATERIAL_SIDE.FRONT,
			}),
		);
		perf.viewport.update();
		perf.viewport.show = true;
	});
	await page.clock.runFor(50);
	await page.evaluate(() => {
		(window as any).__perf.renders.length = 0;
	});
	await page.clock.runFor(1500);
	const frames = await page.evaluate(() => {
		const times = new Set(
			(window as any).__perf.renders
				.filter((pass: any) => pass.target === null)
				.map((pass: any) => pass.time),
		);
		return times.size;
	});
	expect(frames).toBe(16);
});

/**
 * SS-10392, addition of 26 Nov 2026: when nothing fades (shadows or soft
 * shadows off, no post-processing, no frame accumulation), a change draws
 * one frame and the viewport stops. The default delay and duration are set,
 * so the countdown and the fade would run if they were not skipped.
 *
 * `__tools` (installed by `prepare`):
 * - `frames()`: canvas frames since the last `reset()`, one entry per
 *   animation frame, with the camera's world matrix of that frame;
 * - `finished()`: `BEAUTY_RENDERING_FINISHED` events since the last reset.
 */
async function prepare(
	page: Page,
	settings: {shadows: boolean; softShadows: boolean},
) {
	await page.clock.install({time: new Date("2026-01-01T00:00:00Z")});
	await open(page);
	await page.evaluate(async (settings) => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({...settings, beautyDelay: 50, beautyDuration: 1500});
		perf.addBoxes(
			2,
			new SDV.MaterialStandardData({
				color: "#8899aa",
				side: SDV.MATERIAL_SIDE.FRONT,
			}),
		);
		perf.viewport.update();
		perf.viewport.show = true;

		let finished = 0;
		SDV.addListener(
			SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
			() => finished++,
		);
		const cameras: {time: number; matrix: string}[] = [];
		const renderer = perf.renderer;
		const render = renderer.render.bind(renderer);
		renderer.render = (scene: any, camera: any) => {
			const result = render(scene, camera);
			if (!renderer.getRenderTarget())
				cameras.push({
					time: performance.now(),
					matrix: camera.matrixWorld.elements.join(","),
				});
			return result;
		};
		(window as any).__tools = {
			frames: () => {
				const byTime = new Map<number, string>();
				for (const c of cameras) byTime.set(c.time, c.matrix);
				return [...byTime.values()];
			},
			finished: () => finished,
			reset: () => {
				cameras.length = 0;
				finished = 0;
			},
		};
	}, settings);
	// The first frame waits for the shader compile, which runs in real time:
	// advance the clock until it is drawn, then let the viewport settle.
	await page.clock.pauseAt(new Date("2026-01-01T01:00:00Z"));
	for (let i = 0; i < 300; i++) {
		await page.clock.runFor(100);
		const drawn = await page.evaluate(
			() => (window as any).__tools.frames().length > 0,
		);
		if (drawn) break;
		await page.waitForTimeout(50);
	}
	await page.clock.runFor(2500);
	await page.evaluate(() => (window as any).__tools.reset());
}

/** 30 animation frames of the fake clock. */
const THIRTY_FRAMES_MS = 30 * 16;

async function afterChange(page: Page, change: () => void) {
	await page.evaluate(change);
	await page.clock.runFor(THIRTY_FRAMES_MS);
	const result = await page.evaluate(() => ({
		frames: (window as any).__tools.frames().length,
		finished: (window as any).__tools.finished(),
	}));
	// nothing is drawn later either, the fade does not start afterwards
	await page.clock.runFor(2500);
	const late = await page.evaluate(() => ({
		frames: (window as any).__tools.frames().length,
		finished: (window as any).__tools.finished(),
	}));
	await page.evaluate(() => (window as any).__tools.reset());
	return {...result, late};
}

for (const settings of [
	{name: "shadows off", shadows: false, softShadows: true},
	{name: "soft shadows off", shadows: true, softShadows: false},
]) {
	test(`SS-10392 ${settings.name}: a hide or move draws 1 of the next 30 frames`, async ({
		page,
	}) => {
		if (settings.shadows)
			await skipOnSoftwareRenderer(
				page,
				"shadows are off on SwiftShader",
			);
		await prepare(page, settings);

		const hide = await afterChange(page, () => {
			const root = (window as any).SDV.sceneTree.root;
			const node = root.children.find((n: any) => n.name === "box1");
			node.visible = false;
			node.updateVersion();
			(window as any).__perf.viewport.update();
		});
		expect(hide).toEqual({
			frames: 1,
			finished: 1,
			late: {frames: 1, finished: 1},
		});

		// the edit plus updateVersion(), the next frame applies it
		const show = await afterChange(page, () => {
			const root = (window as any).SDV.sceneTree.root;
			const node = root.children.find((n: any) => n.name === "box1");
			node.visible = true;
			node.updateVersion();
		});
		expect(show).toEqual({
			frames: 1,
			finished: 1,
			late: {frames: 1, finished: 1},
		});

		const move = await afterChange(page, () => {
			const root = (window as any).SDV.sceneTree.root;
			const node = root.children.find((n: any) => n.name === "box0");
			node.addTransformation({
				id: "move",
				matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0.5, 0, 0, 1],
			});
			node.updateVersion();
			(window as any).__perf.viewport.update();
		});
		expect(move).toEqual({
			frames: 1,
			finished: 1,
			late: {frames: 1, finished: 1},
		});

		// a move on each of 5 frames (a drag): 5 frames, the event once at
		// the end, not once per frame
		for (let step = 1; step <= 5; step++) {
			await page.evaluate((x) => {
				const root = (window as any).SDV.sceneTree.root;
				const node = root.children.find((n: any) => n.name === "box0");
				node.addTransformation({
					id: "move",
					matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, 0, 0, 1],
				});
				node.updateVersion();
				(window as any).__perf.viewport.update();
			}, step);
			await page.clock.runFor(16);
		}
		await page.clock.runFor(2500);
		const drag = await page.evaluate(() => ({
			frames: (window as any).__tools.frames().length,
			finished: (window as any).__tools.finished(),
		}));
		expect(drag).toEqual({frames: 5, finished: 1});
	});
}

for (const settings of [
	{name: "shadows off", shadows: false, softShadows: true},
	{name: "soft shadows off", shadows: true, softShadows: false},
]) {
	test(`SS-10392 ${settings.name}: after a camera release one frame follows the last camera frame`, async ({
		page,
	}) => {
		if (settings.shadows)
			await skipOnSoftwareRenderer(
				page,
				"shadows are off on SwiftShader",
			);
		await cameraRelease(page, settings);
	});
}

async function cameraRelease(
	page: Page,
	settings: {shadows: boolean; softShadows: boolean},
) {
	await prepare(page, settings);
	await page.mouse.move(600, 360);
	await page.mouse.down();
	for (let step = 1; step <= 4; step++) {
		await page.mouse.move(600 + step * 20, 360 + step * 10);
		await page.clock.runFor(32);
	}
	await page.mouse.up();
	await page.clock.runFor(2500);
	const result = await page.evaluate(() => {
		const frames: string[] = (window as any).__tools.frames();
		let lastMove = -1;
		for (let i = 1; i < frames.length; i++)
			if (frames[i] !== frames[i - 1]) lastMove = i;
		return {
			moved: lastMove > 0,
			after: frames.length - 1 - lastMove,
			finished: (window as any).__tools.finished(),
		};
	});
	expect(result).toEqual({moved: true, after: 1, finished: 1});
}

test("SS-10392 soft shadows on: the fade still draws across the duration", async ({
	page,
}) => {
	await skipOnSoftwareRenderer(
		page,
		"the soft-shadow fade is off on SwiftShader",
	);
	await prepare(page, {shadows: true, softShadows: true});
	const hide = await afterChange(page, () => {
		const root = (window as any).SDV.sceneTree.root;
		const node = root.children.find((n: any) => n.name === "box1");
		node.visible = false;
		node.updateVersion();
		(window as any).__perf.viewport.update();
	});
	// every one of the 30 frames draws, the fade is not shortened
	expect(hide.frames).toBe(30);
	expect(hide.finished).toBe(0);
	expect(hide.late.frames).toBeGreaterThan(90);
	expect(hide.late.finished).toBe(1);
});
