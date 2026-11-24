import {expect} from "@playwright/test";
import {open, test} from "./harness";

/**
 * SS-10554: all camera setters request a frame. None of them runs a scene
 * update (`viewport.update()`) or fires `VIEWPORT_UPDATED`, and they take
 * effect while scene updates are suspended. The view they produce is the same
 * as the one with an explicit `update()` after the setter. Software-safe: no
 * pixels of the scene, no timing.
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
		await perf.nextFrame();
	}

	const frame = () =>
		new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

	const round = (n: number) => Number(n.toFixed(5));

	/** Typed arrays and vectors become arrays, numbers are rounded. */
	function norm(value: any): any {
		if (typeof value === "number")
			return Number.isFinite(value) ? round(value) : String(value);
		if (ArrayBuffer.isView(value))
			return Array.from(value as any).map(norm);
		if (Array.isArray(value)) return value.map(norm);
		if (value && typeof value === "object") {
			const result: any = {};
			for (const key of Object.keys(value).sort())
				result[key] = norm(value[key]);
			return result;
		}
		return value;
	}

	/** The three.js camera: position and matrices, rounded. */
	function threeCamera() {
		const camera = perf.viewport.threeJsCoreObjects.camera;
		camera.updateMatrixWorld();
		return {
			position: camera.position.toArray().map(round),
			matrix: camera.matrixWorld.elements.map(round),
			projection: camera.projectionMatrix.elements.map(round),
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
		return [rect.x, rect.y, rect.width, rect.height].map(round);
	}

	(window as any).__t = {
		start,
		frame,
		norm,
		threeCamera,
		withCameraEvents,
		anchorBox,
	};
}

async function setup(page: any) {
	await open(page);
	await page.evaluate(installTools);
}

test("SS-10554 no camera setter runs a scene update", async ({page}) => {
	await setup(page);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const t = (window as any).__t;
		const SDV = (window as any).SDV;
		const ORTHO = SDV.ORTHOGRAPHIC_CAMERA_DIRECTION;
		await t.start();
		perf.viewport.createOrthographicCamera("ortho");

		const box = (n: number) => ({min: [-n, -n, -n], max: [n, n, n]});
		// A value that differs from the current one, and holds the current view.
		type Entry = [string, (current: any) => any, string?];
		const entries: Entry[] = [
			["autoAdjust", (v) => !v],
			["autoRotationSpeed", (v) => v + 1],
			["cameraMovementDuration", (v) => v + 100],
			["cubePositionRestriction", () => box(1000)],
			["cubeTargetRestriction", () => box(1000)],
			["damping", (v) => (v > 0.5 ? v - 0.1 : v + 0.1)],
			["defaultPosition", () => [7, 6, 5]],
			["defaultTarget", () => [0.1, 0.2, 0.3]],
			["enableAutoRotation", (v) => !v],
			["enableAzimuthRotation", (v) => !v],
			["enableKeyPan", (v) => !v],
			["enableObjectControls", (v) => !v],
			["enablePan", (v) => !v],
			["enablePolarRotation", (v) => !v],
			["enableRotation", (v) => !v],
			["enableTurntableControls", (v) => !v],
			["enableZoom", (v) => !v],
			["enabled", (v) => !v],
			["initialAutoAdjust", (v) => !v],
			["keyPanSpeed", (v) => v + 1],
			["movementSmoothness", (v) => (v > 0.5 ? v - 0.1 : v + 0.1)],
			["name", () => "renamed"],
			["objectControlsCenter", () => [1, 2, 3]],
			["order", () => 7],
			["panSpeed", (v) => v + 1],
			["revertAtMouseUp", (v) => !v],
			["revertAtMouseUpDuration", (v) => v + 100],
			[
				"rotationRestriction",
				(v) => ({...v, minPolarAngle: 0, maxPolarAngle: Math.PI}),
			],
			["rotationSpeed", (v) => v + 1],
			[
				"spherePositionRestriction",
				() => ({center: [0, 0, 0], radius: 1000}),
			],
			[
				"sphereTargetRestriction",
				() => ({center: [0, 0, 0], radius: 1000}),
			],
			["turntableCenter", () => [1, 2, 3]],
			[
				"zoomRestriction",
				() => ({minDistance: 0.001, maxDistance: 100000}),
			],
			["zoomSpeed", (v) => v + 1],
			["zoomToFactor", (v) => v + 0.1],
			["fov", (v) => (v > 40 ? v - 10 : v + 10)],
			["direction", () => ORTHO.TOP, "ortho"],
		];

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

		const failures: string[] = [];
		for (const [name, make, which] of entries) {
			try {
				if (which === "ortho") perf.viewport.assignCamera("ortho");
				else perf.viewport.assignCamera(perf.viewport.camera.id);
				const camera: any = which
					? perf.viewport.cameras.ortho
					: perf.viewport.camera;
				await perf.nextFrame();
				await t.frame();
				const before = camera[name];
				const previous = t.norm(before);
				const value = make(before);
				if (JSON.stringify(t.norm(value)) === JSON.stringify(previous))
					failures.push(`${name}: test value equals the current one`);
				perf.renders.length = 0;
				updateCalls = 0;
				viewportUpdatedEvents = 0;
				camera[name] = value;
				await t.frame();
				await t.frame();
				const frames = perf.renders.filter(
					(item: any) => item.target === null,
				).length;
				const same =
					JSON.stringify(t.norm(camera[name])) ===
					JSON.stringify(t.norm(value));
				if (updateCalls !== 0)
					failures.push(`${name}: ${updateCalls} update calls`);
				if (viewportUpdatedEvents !== 0)
					failures.push(
						`${name}: ${viewportUpdatedEvents} VIEWPORT_UPDATED events`,
					);
				if (frames < 1) failures.push(`${name}: no frame was rendered`);
				if (!same)
					failures.push(
						`${name}: getter returns ${JSON.stringify(t.norm(camera[name]))}`,
					);
				camera[name] = before;
				await t.frame();
			} catch (error: any) {
				failures.push(`${name}: threw ${error?.message ?? error}`);
			}
		}
		SDV.removeListener(token);
		perf.viewport.update = update;
		return {failures, count: entries.length};
	});

	expect(result.count).toBe(37);
	expect(result.failures, result.failures.join("\n")).toEqual([]);
});

test("SS-10554 the setters give the view of a setter with an update", async ({
	page,
}) => {
	await setup(page);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const t = (window as any).__t;
		const SDV = (window as any).SDV;
		await t.start();
		perf.viewport.createOrthographicCamera("ortho");
		const persp = perf.viewport.camera;
		const ortho = perf.viewport.cameras.ortho;

		const from: [number[], number[]] = [
			[6, 5, 4],
			[0.4, 0.4, 0.4],
		];
		type Case = {
			name: string;
			camera: any;
			apply: (camera: any) => void;
			finish?: (camera: any) => Promise<void>;
		};
		const cases: Case[] = [
			{
				name: "fov",
				camera: persp,
				apply: (c) => (c.fov = c.fov > 40 ? c.fov - 20 : c.fov + 20),
			},
			{
				name: "direction",
				camera: ortho,
				apply: (c) =>
					(c.direction = SDV.ORTHOGRAPHIC_CAMERA_DIRECTION.TOP),
			},
			{
				name: "cubePositionRestriction",
				camera: persp,
				apply: (c) =>
					(c.cubePositionRestriction = {
						min: [-2, -2, -2],
						max: [2, 2, 2],
					}),
			},
			{
				name: "spherePositionRestriction",
				camera: persp,
				apply: (c) =>
					(c.spherePositionRestriction = {
						center: [0, 0, 0],
						radius: 3,
					}),
			},
			{
				name: "zoomRestriction",
				camera: persp,
				apply: (c) =>
					(c.zoomRestriction = {minDistance: 15, maxDistance: 30}),
			},
			{
				name: "rotationRestriction",
				camera: persp,
				apply: (c) =>
					(c.rotationRestriction = {
						...c.rotationRestriction,
						minPolarAngle: 0.1,
						maxPolarAngle: 0.5,
					}),
			},
			{
				name: "turntable",
				camera: persp,
				apply: (c) => {
					c.enableTurntableControls = true;
					c.turntableCenter = [1, 1, 0];
				},
			},
			{
				name: "objectControls",
				camera: persp,
				apply: (c) => {
					c.enableObjectControls = true;
					c.objectControlsCenter = [1, 1, 1];
				},
			},
			{
				name: "defaultPosition and defaultTarget then reset",
				camera: persp,
				apply: (c) => {
					c.defaultPosition = [-6, 4, 3];
					c.defaultTarget = [0.2, 0.1, 0.3];
				},
				finish: async (c) => {
					await c.reset({duration: 0});
				},
			},
			{
				name: "zoomToFactor then zoomTo",
				camera: persp,
				apply: (c) => (c.zoomToFactor = c.zoomToFactor * 2),
				finish: async (c) => {
					await c.zoomTo(undefined, {duration: 0});
				},
			},
		];

		const run = async (item: Case, withUpdate: boolean) => {
			const camera = item.camera;
			perf.viewport.assignCamera(camera.id);
			await perf.nextFrame();
			const saved = t.norm({
				fov: (camera as any).fov,
				direction: (camera as any).direction,
				cube: camera.cubePositionRestriction,
				sphere: camera.spherePositionRestriction,
				zoom: camera.zoomRestriction,
				rotation: camera.rotationRestriction,
				turntable: camera.enableTurntableControls,
				turntableCenter: camera.turntableCenter,
				objects: camera.enableObjectControls,
				objectsCenter: camera.objectControlsCenter,
				defaultPosition: camera.defaultPosition,
				defaultTarget: camera.defaultTarget,
				factor: camera.zoomToFactor,
			});
			const live = {
				cube: camera.cubePositionRestriction,
				sphere: camera.spherePositionRestriction,
				zoom: camera.zoomRestriction,
				rotation: camera.rotationRestriction,
				turntableCenter: [...camera.turntableCenter],
				objectsCenter: [...camera.objectControlsCenter],
				defaultPosition: [...camera.defaultPosition],
				defaultTarget: [...camera.defaultTarget],
				direction: (camera as any).direction,
			};
			await camera.set(from[0], from[1], {duration: 0});
			perf.viewport.render();
			await perf.nextFrame();
			const events = await t.withCameraEvents(async () => {
				item.apply(camera);
				if (withUpdate) perf.viewport.update();
				if (item.finish) await item.finish(camera);
				await perf.nextFrame();
			});
			const round = (v: number[]) => v.map((n) => Number(n.toFixed(5)));
			const view = {
				position: round([...camera.position]),
				target: round([...camera.target]),
				three: t.threeCamera(),
				anchor: t.anchorBox(),
				events,
			};
			// Back to the start for the next run.
			if (item.name === "direction") camera.direction = live.direction;
			camera.cubePositionRestriction = live.cube;
			camera.spherePositionRestriction = live.sphere;
			camera.zoomRestriction = live.zoom;
			camera.rotationRestriction = live.rotation;
			camera.enableTurntableControls = false;
			camera.enableObjectControls = false;
			camera.turntableCenter = live.turntableCenter;
			camera.objectControlsCenter = live.objectsCenter;
			camera.defaultPosition = live.defaultPosition;
			camera.defaultTarget = live.defaultTarget;
			if ((camera as any).fov !== undefined)
				(camera as any).fov = (saved as any).fov;
			camera.zoomToFactor = (saved as any).factor;
			await perf.nextFrame();
			return view;
		};

		const results: any[] = [];
		for (const item of cases) {
			const bySetter = await run(item, false);
			const byUpdate = await run(item, true);
			results.push({name: item.name, bySetter, byUpdate});
		}
		return results;
	});

	for (const item of result) {
		expect(item.bySetter.position, item.name).toEqual(
			item.byUpdate.position,
		);
		expect(item.bySetter.target, item.name).toEqual(item.byUpdate.target);
		expect(item.bySetter.three, item.name).toEqual(item.byUpdate.three);
		expect(item.bySetter.anchor, item.name).toEqual(item.byUpdate.anchor);
		expect(item.bySetter.events, item.name).toEqual(item.byUpdate.events);
	}
	// The cases change the view: the cube restriction holds the camera inside.
	const cube = result.find((r: any) => r.name === "cubePositionRestriction");
	for (const n of cube.bySetter.position)
		expect(Math.abs(n)).toBeLessThanOrEqual(2 + 1e-4);
});

test("SS-10554 the camera setters work while scene updates are suspended", async ({
	page,
}) => {
	await setup(page);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const t = (window as any).__t;
		const SDV = (window as any).SDV;
		await t.start();
		const token = perf.viewport.addFlag(
			SDV.FLAG_TYPE.SUSPEND_SCENE_UPDATES,
		);
		await t.frame();
		const camera = perf.viewport.camera;
		const three = perf.viewport.threeJsCoreObjects.camera;
		const next = camera.fov > 40 ? camera.fov - 15 : camera.fov + 15;
		camera.fov = next;
		for (let i = 0; i < 4; i++) await t.frame();
		const applied = Math.abs(three.fov - next) < 1e-6;
		perf.viewport.removeFlag(token);
		await perf.nextFrame();
		return {applied, fov: three.fov, next};
	});

	expect(result.applied, JSON.stringify(result)).toBe(true);
});
