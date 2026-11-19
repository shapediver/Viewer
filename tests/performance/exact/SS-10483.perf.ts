import {expect} from "@playwright/test";
import {open, test} from "./harness";

/**
 * SS-10483: a semi-transparent double-sided material is drawn as a fixed
 * back and front material pair, so three.js does not flip `material.side`
 * and set `needsUpdate` twice per draw. The picture stays the same: each
 * pane is still drawn back faces first, then front faces.
 *
 * Software-safe: it counts material updates and draw calls and reads the
 * materials of the meshes. It reads no pixels and no timing, so it runs the
 * same on SwiftShader and on a hardware GPU. It does not need a hardware GPU.
 * (The pixel check of the same ticket is the Viewer's own screenshot suite.)
 */

// three.js side constants
const FRONT = 0;
const BACK = 1;
const DOUBLE = 2;

const PANES = 3;

/** The scene, the draw recorder and the helpers every test uses. */
async function setup(page: import("@playwright/test").Page) {
	await open(page);
	await page.evaluate(async (panes: number) => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const glass = (options: any = {}) =>
			new SDV.MaterialStandardData({
				color: "#9fc4d6",
				opacity: 0.35,
				metalness: 0,
				roughness: 0.1,
				...options,
			});
		perf.addBoxes(panes, glass());
		perf.viewport.update();
		perf.viewport.show = true;
		perf.viewport.camera.position = [6, -6, 4];
		perf.viewport.camera.target = [0, 0, 1.5];
		await perf.nextFrame();

		const scene = perf.viewport.threeJsCoreObjects.scene;
		const boxes = SDV.sceneTree.root.children.filter((node: any) =>
			node.name.startsWith("box"),
		);
		const geometries = boxes.map((node: any) => node.data[0]);
		const meshes = () =>
			geometries.map(
				(geometry: any) => geometry.convertedObject[perf.viewport.id],
			);

		// Count `needsUpdate = true` inside render, and record every draw of
		// a physical material together with the object and the group.
		let depth = 0;
		let updates = 0;
		const draws: {id: number; side: number; group: number | null}[] = [];
		let proto = meshes()[0].material;
		if (Array.isArray(proto)) proto = proto[0];
		while (proto && !Object.getOwnPropertyDescriptor(proto, "needsUpdate"))
			proto = Object.getPrototypeOf(proto);
		const descriptor = Object.getOwnPropertyDescriptor(
			proto,
			"needsUpdate",
		)!;
		Object.defineProperty(proto, "needsUpdate", {
			configurable: true,
			get: descriptor.get,
			set(value: boolean) {
				if (value === true && depth > 0) updates++;
				descriptor.set!.call(this, value);
			},
		});
		const renderer = perf.renderer;
		const render = renderer.render;
		renderer.render = (...args: any[]) => {
			depth++;
			try {
				return render.apply(renderer, args);
			} finally {
				depth--;
			}
		};
		const direct = renderer.renderBufferDirect;
		renderer.renderBufferDirect = (...args: any[]) => {
			const [, , , material, object, group] = args;
			if (material.isMeshPhysicalMaterial)
				draws.push({
					id: object.id,
					side: material.side,
					group: group ? group.materialIndex : null,
				});
			return direct.apply(renderer, args);
		};

		(window as any).__ss10483 = {
			boxes,
			geometries,
			meshes,
			scene,
			glass,
			/** one camera frame: returns its updates and draws */
			async frame(angle: number) {
				updates = 0;
				draws.length = 0;
				perf.viewport.camera.position = [
					6 * Math.cos(angle),
					-6 * Math.sin(angle),
					4,
				];
				await perf.nextFrame();
				return {updates, draws: draws.slice()};
			},
			async setMaterial(data: any) {
				for (const geometry of geometries) geometry.material = data;
				SDV.sceneTree.root.updateVersion();
				perf.viewport.update();
				await perf.nextFrame();
			},
			/** what each pane shows */
			state() {
				return meshes().map((mesh: any) => {
					const array = Array.isArray(mesh.material);
					const materials = array ? mesh.material : [mesh.material];
					return {
						array,
						sides: materials.map((m: any) => m.side),
						opacities: materials.map((m: any) => m.opacity),
						colors: materials.map((m: any) =>
							m.color.getHexString(),
						),
						transparent: materials.map((m: any) => m.transparent),
						groups: mesh.geometry.groups.map((g: any) => [
							g.start,
							g.count,
							g.materialIndex,
						]),
						position: mesh.geometry.getAttribute("position").count,
					};
				});
			},
		};
	}, PANES);
}

/** The draws of one frame, as `[id, side, group]` pairs per pane. */
function pairs(draws: {id: number; side: number; group: number | null}[]) {
	const result: number[][][] = [];
	for (let i = 0; i < draws.length; i += 2)
		result.push([
			[draws[i].id, draws[i].side, draws[i].group ?? -1],
			[draws[i + 1].id, draws[i + 1].side, draws[i + 1].group ?? -1],
		]);
	return result;
}

test("SS-10483 a camera frame causes no material updates inside render", async ({
	page,
}) => {
	await setup(page);
	const result = await page.evaluate(async () => {
		const t = (window as any).__ss10483;
		const first = await t.frame(0.2);
		const second = await t.frame(0.4);
		return {first, second, state: t.state()};
	});
	for (const state of result.state) {
		expect(state.array).toBe(true);
		expect(state.sides).toEqual([BACK, FRONT]);
	}
	expect(result.first.updates).toBe(0);
	expect(result.second.updates).toBe(0);
});

test("SS-10483 each pane is still drawn back faces first, then front faces", async ({
	page,
}) => {
	await setup(page);
	const result = await page.evaluate(async () => {
		const t = (window as any).__ss10483;
		const frame = await t.frame(0.3);
		return {draws: frame.draws, ids: t.meshes().map((m: any) => m.id)};
	});
	// two draws per pane, the back group right before the front group
	expect(result.draws.length).toBeGreaterThanOrEqual(2 * PANES);
	expect(result.draws.length % (2 * PANES)).toBe(0);
	for (const [back, front] of pairs(result.draws)) {
		expect(back[0]).toBe(front[0]);
		expect(result.ids).toContain(back[0]);
		expect([back[1], back[2]]).toEqual([BACK, 0]);
		expect([front[1], front[2]]).toEqual([FRONT, 1]);
	}
	// every pane takes part
	const drawn = new Set(result.draws.map((draw: any) => draw.id));
	expect(drawn.size).toBe(PANES);
});

test("SS-10483 a material change reaches both materials and leaves no stale pair", async ({
	page,
}) => {
	await setup(page);
	const result = await page.evaluate(async () => {
		const t = (window as any).__ss10483;
		const SDV = (window as any).SDV;
		const log: Record<string, any> = {};
		log.initial = t.state();

		await t.setMaterial(t.glass({opacity: 0.6}));
		log.opacity = t.state();
		log.opacityFrame = await t.frame(0.5);

		await t.setMaterial(t.glass({opacity: 0.6, color: "#ff0000"}));
		log.color = t.state();

		await t.setMaterial(
			t.glass({opacity: 0.6, side: SDV.MATERIAL_SIDE.FRONT}),
		);
		log.front = t.state();

		await t.setMaterial(t.glass({opacity: 1}));
		log.opaque = t.state();

		await t.setMaterial(t.glass({opacity: 0.4}));
		log.back = t.state();
		log.backFrame = await t.frame(0.7);
		return log;
	});

	const shows = (states: any[], opacity: number, color?: string) => {
		for (const state of states) {
			expect(state.array).toBe(true);
			expect(state.sides).toEqual([BACK, FRONT]);
			expect(state.opacities).toEqual([opacity, opacity]);
			expect(state.transparent).toEqual([true, true]);
			expect(state.colors[0]).toBe(state.colors[1]);
			if (color) expect(state.colors).toEqual([color, color]);
			expect(state.groups).toEqual([
				[0, 36, 0],
				[0, 36, 1],
			]);
		}
	};
	shows(result.initial, 0.35);
	shows(result.opacity, 0.6);
	expect(result.opacityFrame.updates).toBe(0);
	shows(result.color, 0.6, "ff0000");

	// a single-sided material is one material on the shared geometry
	for (const state of result.front) {
		expect(state.array).toBe(false);
		expect(state.sides).toEqual([FRONT]);
		expect(state.opacities).toEqual([0.6]);
		expect(state.groups).toEqual([]);
	}
	// an opaque material is one double-sided material, not a pair
	for (const state of result.opaque) {
		expect(state.array).toBe(false);
		expect(state.sides).toEqual([DOUBLE]);
		expect(state.transparent).toEqual([false]);
		expect(state.groups).toEqual([]);
	}
	// and back to semi-transparent: a new pair with the new opacity
	shows(result.back, 0.4);
	expect(result.backFrame.updates).toBe(0);
	expect(result.backFrame.draws.length % (2 * PANES)).toBe(0);
});
