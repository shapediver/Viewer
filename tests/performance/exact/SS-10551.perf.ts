import {expect} from "@playwright/test";
import {open, test} from "./harness";

/**
 * SS-10551: the camera `position` and `target` setters request a frame. They
 * do not run a scene update (`viewport.update()`) and do not fire
 * `VIEWPORT_UPDATED`. The view they produce is the same as the one `set`
 * produces. Software-safe: no pixels of the scene, no timing.
 */

/** Runs in the page. Adds `window.__t`. */
function installTools() {
	const perf = (window as any).__perf;
	const SDV = (window as any).SDV;

	async function start() {
		await perf.create({shadows: false});
		perf.addBoxes(
			4,
			new SDV.MaterialStandardData({
				color: "#66cc88",
				side: SDV.MATERIAL_SIDE.FRONT,
			}),
		);
		perf.viewport.update();
		perf.viewport.show = true;
		await perf.nextFrame();
	}

	const frame = () =>
		new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

	/** The three.js camera: position and the matrix, rounded. */
	function threeCamera() {
		const camera = perf.viewport.threeJsCoreObjects.camera;
		camera.updateMatrixWorld();
		return {
			position: camera.position.toArray(),
			matrix: camera.matrixWorld.elements.map((n: number) =>
				Number(n.toFixed(6)),
			),
		};
	}

	/** Counts of the camera events while `action` and the frames after it run. */
	async function withCameraEvents(action: () => Promise<void>) {
		const counts = {start: 0, move: 0, end: 0};
		const tokens = [
			SDV.addListener(SDV.EVENTTYPE.CAMERA.CAMERA_START, () => {
				counts.start++;
			}),
			SDV.addListener(SDV.EVENTTYPE.CAMERA.CAMERA_MOVE, () => {
				counts.move++;
			}),
			SDV.addListener(SDV.EVENTTYPE.CAMERA.CAMERA_END, () => {
				counts.end++;
			}),
		];
		try {
			await action();
			for (let i = 0; i < 12; i++) await frame();
		} finally {
			for (const token of tokens) SDV.removeListener(token);
		}
		return counts;
	}

	function anchorBox() {
		const element = [...document.querySelectorAll("*")].find(
			(e) => e.children.length === 0 && e.textContent === "ANCHOR",
		);
		if (!element) return null;
		const rect = element.getBoundingClientRect();
		return [rect.x, rect.y, rect.width, rect.height].map((n) =>
			Number(n.toFixed(1)),
		);
	}

	function addAnchor() {
		const node = new SDV.TreeNode("anchor");
		node.addData(
			new SDV.HTMLElementAnchorTextData({
				location: [0.4, 0.4, 0.4],
				data: {text: "ANCHOR", color: "#ff0000"},
			}),
		);
		SDV.sceneTree.root.addChild(node);
		SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
	}

	/**
	 * The view after moving from `from` to `to` by the setters (`how` is
	 * "setters") or by `set` (`how` is "set").
	 */
	async function move(
		camera: any,
		from: [number[], number[]],
		to: [number[], number[]],
		how: "setters" | "set",
	) {
		await camera.set(from[0], from[1], {duration: 0});
		perf.viewport.render();
		await perf.nextFrame();
		const events = await withCameraEvents(async () => {
			if (how === "setters") {
				camera.position = to[0];
				camera.target = to[1];
			} else {
				await camera.set(to[0], to[1], {duration: 0});
				perf.viewport.render();
			}
			await perf.nextFrame();
		});
		const round = (v: number[]) => v.map((n) => Number(n.toFixed(6)));
		return {
			position: round([...camera.position]),
			target: round([...camera.target]),
			three: threeCamera(),
			anchor: anchorBox(),
			events,
		};
	}

	(window as any).__t = {
		start,
		frame,
		threeCamera,
		withCameraEvents,
		anchorBox,
		addAnchor,
		move,
	};
}

async function setup(page: any) {
	await open(page);
	await page.evaluate(installTools);
}

test("SS-10551 the camera setters request a frame and no scene update", async ({
	page,
}) => {
	await setup(page);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const t = (window as any).__t;
		const SDV = (window as any).SDV;
		await t.start();
		let updateCalls = 0;
		const update = perf.viewport.update.bind(perf.viewport);
		perf.viewport.update = (...args: any[]) => {
			updateCalls++;
			return update(...args);
		};
		let viewportUpdatedEvents = 0;
		const token = SDV.addListener(
			SDV.EVENTTYPE.VIEWPORT.VIEWPORT_UPDATED,
			() => {
				viewportUpdatedEvents++;
			},
		);
		await t.frame();
		perf.renders.length = 0;
		const position = [9, -7, 5];
		perf.viewport.camera.position = position;
		perf.viewport.camera.target = [1, 1, 1];
		await t.frame();
		const frames = perf.renders.filter(
			(item: any) => item.target === null,
		).length;
		const camera = perf.viewport.threeJsCoreObjects.camera;
		const close = camera.position
			.toArray()
			.every((n: number, i: number) => Math.abs(n - position[i]) < 1e-6);
		SDV.removeListener(token);
		perf.viewport.update = update;
		return {updateCalls, viewportUpdatedEvents, frames, close};
	});

	expect(result.updateCalls).toBe(0);
	expect(result.viewportUpdatedEvents).toBe(0);
	expect(result.frames).toBe(1);
	expect(result.close).toBe(true);
});

const CASES = ["perspective", "orthographic", "cube restriction"] as const;

for (const name of CASES) {
	test(`SS-10551 the setters give the view of camera.set: ${name}`, async ({
		page,
	}) => {
		await setup(page);
		const result = await page.evaluate(async (which: string) => {
			const perf = (window as any).__perf;
			const t = (window as any).__t;
			await t.start();
			t.addAnchor();
			await perf.nextFrame();
			let camera = perf.viewport.camera;
			if (which === "orthographic") {
				camera = perf.viewport.createOrthographicCamera("ortho");
				perf.viewport.assignCamera("ortho");
				await perf.nextFrame();
			}
			if (which === "cube restriction")
				camera.cubePositionRestriction = {
					min: [-2, -2, -2],
					max: [2, 2, 2],
				};
			const from: [number[], number[]] = [
				[6, 5, 4],
				[0.4, 0.4, 0.4],
			];
			const to: [number[], number[]] = [
				which === "cube restriction" ? [10, 10, 10] : [-5, 7, 3],
				[0.5, 0.2, 0.4],
			];
			const bySet = await t.move(camera, from, to, "set");
			const bySetters = await t.move(camera, from, to, "setters");
			return {bySet, bySetters, which};
		}, name);

		expect(result.bySetters.position).toEqual(result.bySet.position);
		expect(result.bySetters.target).toEqual(result.bySet.target);
		expect(result.bySetters.three).toEqual(result.bySet.three);
		expect(result.bySetters.anchor).toEqual(result.bySet.anchor);
		expect(result.bySetters.events).toEqual(result.bySet.events);
		if (name === "cube restriction")
			for (const n of result.bySetters.position)
				expect(Math.abs(n)).toBeLessThanOrEqual(2 + 1e-6);
	});
}

test("SS-10551 the setters keep the defaults, the settings and the zoom to fit", async ({
	page,
}) => {
	await setup(page);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const t = (window as any).__t;
		const SDV = (window as any).SDV;
		await t.start();
		const ortho = perf.viewport.createOrthographicCamera("ortho");
		perf.viewport.assignCamera("ortho");
		await perf.nextFrame();
		const camera = perf.viewport.camera;
		const defaults = {
			position: [...camera.defaultPosition],
			target: [...camera.defaultTarget],
		};
		const settings = () =>
			JSON.stringify(
				perf.viewport.getViewportSettings().camera.cameras.ortho,
			);
		const settingsBefore = settings();
		camera.position = [-5, 7, 3];
		camera.target = [0.5, 0.2, 0.4];
		await perf.nextFrame();
		const defaultsAfter = {
			position: [...camera.defaultPosition],
			target: [...camera.defaultTarget],
		};
		const settingsAfter = settings();

		// Zoom to fit ends where calculateZoomTo says.
		const expected = camera.calculateZoomTo();
		await camera.zoomTo(undefined, {duration: 0});
		await perf.nextFrame();
		const near = (a: number[], b: number[]) =>
			a.every((n, i) => Math.abs(n - b[i]) < 1e-3);
		const zoomed = near([...camera.position], [...expected.position]);

		// A box far away grows the bounding box: zoom to fit follows it.
		const before = [...camera.position];
		const geometry = perf.boxGeometry([500, 500, 500], [501, 501, 501]);
		geometry.material = new SDV.MaterialStandardData({color: "#cc6688"});
		const node = new SDV.TreeNode("far");
		node.addData(geometry);
		SDV.sceneTree.root.addChild(node);
		SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
		await perf.nextFrame();
		const grown = camera.calculateZoomTo();
		await camera.zoomTo(undefined, {duration: 0});
		await perf.nextFrame();
		const moved =
			near([...camera.position], [...grown.position]) &&
			!near(before, [...camera.position]);
		void ortho;
		return {
			sameDefaults:
				JSON.stringify(defaults) === JSON.stringify(defaultsAfter),
			sameSettings: settingsBefore === settingsAfter,
			zoomed,
			moved,
		};
	});

	expect(result.sameDefaults).toBe(true);
	expect(result.sameSettings).toBe(true);
	expect(result.zoomed).toBe(true);
	expect(result.moved).toBe(true);
});
