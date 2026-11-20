import {expect} from "@playwright/test";
import {open, skipOnSoftwareRenderer, test} from "./harness";

/**
 * SS-10484: a scene update compiles only the objects it created or
 * re-materialized. A change of something every program depends on (light
 * set, shadows forced off or on, renderer type, instancing, first update of
 * a viewport) still compiles the whole scene. In both cases the first frame
 * after the update compiles no program.
 *
 * `watch` wraps `renderer.compile` and `renderer.render` of the viewport:
 * - `compiles`: one entry per compile call with the number of meshes it
 *   walks and whether it was given the whole scene (no target scene),
 * - `renderCompiled`: the programs created inside each render call.
 */
function installWatch() {
	const perf = (window as any).__perf;
	perf.watch = () => {
		const renderer = perf.renderer;
		const log = {
			compiles: [] as {meshes: number; full: boolean}[],
			renderCompiled: [] as number[],
		};
		const programs = () => new Set<unknown>(renderer.info.programs ?? []);
		const compile = renderer.compile.bind(renderer);
		renderer.compile = (scene: any, camera: any, target?: any) => {
			let meshes = 0;
			scene.traverse((object: any) => {
				if (object.isMesh) meshes++;
			});
			log.compiles.push({meshes, full: !target});
			return compile(scene, camera, target);
		};
		const render = renderer.render.bind(renderer);
		renderer.render = (scene: any, camera: any) => {
			const before = programs();
			const result = render(scene, camera);
			let created = 0;
			for (const program of programs())
				if (!before.has(program)) created++;
			log.renderCompiled.push(created);
			return result;
		};
		return {
			log,
			reset() {
				log.compiles.length = 0;
				log.renderCompiled.length = 0;
			},
		};
	};
}

async function setup(page: any) {
	await open(page);
	await page.evaluate(installWatch);
}

test("SS-10484 a one-node change compiles only the changed objects", async ({
	page,
}) => {
	await skipOnSoftwareRenderer(
		page,
		"programsCompiledInRender needs the real compile path of a GPU",
	);
	await setup(page);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const material = new SDV.MaterialStandardData({
			color: "#cccccc",
			side: SDV.MATERIAL_SIDE.FRONT,
		});
		perf.addBoxes(40, material);
		perf.viewport.show = true;
		perf.viewport.update();
		await perf.nextFrame();
		await perf.nextFrame();
		const watch = perf.watch();

		// One node gets a glass material: another program, so it cannot stay
		// in the batch of the opaque boxes.
		const node = SDV.sceneTree.root.children.find(
			(child: any) => child.name === "box0",
		);
		node.data[0].material = new SDV.MaterialStandardData({
			color: "#88bbdd",
			opacity: 0.5,
			alphaMode: SDV.MATERIAL_ALPHA.BLEND,
			side: SDV.MATERIAL_SIDE.DOUBLE,
		});
		node.updateVersion();
		perf.viewport.update();
		const afterUpdate = watch.log.compiles.slice();
		await perf.nextFrame();
		return {
			compiles: afterUpdate,
			renderCompiled: watch.log.renderCompiled,
		};
	});
	const compiled = result.compiles.reduce(
		(sum: number, call: any) => sum + call.meshes,
		0,
	);
	expect(result.compiles.length, JSON.stringify(result)).toBeGreaterThan(0);
	// The scene has 40 source meshes. Only the changed node, the batch it
	// left and the meshes that came out of the old batch may be compiled.
	expect(compiled, JSON.stringify(result)).toBeLessThanOrEqual(6);
	expect(
		result.compiles.some((call: any) => call.full),
		JSON.stringify(result),
	).toBe(false);
	expect(
		result.renderCompiled.reduce((a: number, b: number) => a + b, 0),
		JSON.stringify(result),
	).toBe(0);
});

test("SS-10484 an update that creates nothing compiles nothing", async ({
	page,
}) => {
	await setup(page);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		perf.addBoxes(
			12,
			new SDV.MaterialStandardData({
				color: "#cccccc",
				side: SDV.MATERIAL_SIDE.FRONT,
			}),
		);
		perf.viewport.show = true;
		perf.viewport.update();
		await perf.nextFrame();
		await perf.nextFrame();
		const watch = perf.watch();
		SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
		return watch.log.compiles;
	});
	const compiled = result.reduce(
		(sum: number, call: any) => sum + call.meshes,
		0,
	);
	expect(compiled, JSON.stringify(result)).toBe(0);
});

test("SS-10484 the first update of a viewport compiles the whole scene", async ({
	page,
}) => {
	await setup(page);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const watch = perf.watch();
		perf.addBoxes(
			12,
			new SDV.MaterialStandardData({
				color: "#cccccc",
				side: SDV.MATERIAL_SIDE.FRONT,
			}),
		);
		perf.viewport.show = true;
		perf.viewport.update();
		return watch.log.compiles;
	});
	expect(result.length, JSON.stringify(result)).toBeGreaterThan(0);
	expect(
		result.some((call: any) => call.full),
		JSON.stringify(result),
	).toBe(true);
});

test("SS-10484 a changed light set compiles the whole scene", async ({
	page,
}) => {
	await skipOnSoftwareRenderer(
		page,
		"programsCompiledInRender needs the real compile path of a GPU",
	);
	await setup(page);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		perf.addBoxes(
			12,
			new SDV.MaterialStandardData({
				color: "#cccccc",
				side: SDV.MATERIAL_SIDE.FRONT,
			}),
		);
		perf.viewport.show = true;
		perf.viewport.update();
		await perf.nextFrame();
		await perf.nextFrame();
		const lights =
			perf.viewport.lightScene ?? perf.viewport.createLightScene();
		perf.viewport.update();
		await perf.nextFrame();
		const watch = perf.watch();
		lights.addDirectionalLight({});
		SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
		const compiles = watch.log.compiles.slice();
		await perf.nextFrame();
		return {compiles, renderCompiled: watch.log.renderCompiled};
	});
	expect(
		result.compiles.some((call: any) => call.full),
		JSON.stringify(result),
	).toBe(true);
	expect(
		result.renderCompiled.reduce((a: number, b: number) => a + b, 0),
		JSON.stringify(result),
	).toBe(0);
});

test("SS-10484 a renderer type and an instancing switch compile the whole scene", async ({
	page,
}) => {
	await skipOnSoftwareRenderer(
		page,
		"programsCompiledInRender needs the real compile path of a GPU",
	);
	await setup(page);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		perf.addBoxes(
			12,
			new SDV.MaterialStandardData({
				color: "#cccccc",
				side: SDV.MATERIAL_SIDE.FRONT,
			}),
		);
		perf.viewport.show = true;
		perf.viewport.update();
		await perf.nextFrame();
		await perf.nextFrame();
		const watch = perf.watch();
		const steps: Record<string, any> = {};
		const step = async (name: string, change: () => void) => {
			watch.reset();
			change();
			perf.viewport.update();
			const compiles = watch.log.compiles.slice();
			await perf.nextFrame();
			steps[name] = {
				full: compiles.some((call: any) => call.full),
				renderCompiled: watch.log.renderCompiled.reduce(
					(a: number, b: number) => a + b,
					0,
				),
			};
		};
		await step("instancingOff", () => {
			perf.viewport.gpuInstancing.enabled =
				!perf.viewport.gpuInstancing.enabled;
		});
		await step("instancingOn", () => {
			perf.viewport.gpuInstancing.enabled =
				!perf.viewport.gpuInstancing.enabled;
		});
		await step("attributes", () => {
			perf.viewport.type = SDV.RENDERER_TYPE.ATTRIBUTES;
		});
		await step("standard", () => {
			perf.viewport.type = SDV.RENDERER_TYPE.STANDARD;
		});
		return steps;
	});
	for (const [name, step] of Object.entries(result) as [string, any][]) {
		expect(step.full, name + JSON.stringify(result)).toBe(true);
	}
	for (const [name, step] of Object.entries(result) as [string, any][])
		expect(step.renderCompiled, name + JSON.stringify(result)).toBe(0);
});

test("SS-10484 shadows forced off and back on compile the whole scene", async ({
	page,
}) => {
	await skipOnSoftwareRenderer(
		page,
		"shadows are off on SwiftShader and the test needs them",
	);
	await setup(page);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		// The viewer reads the texture unit limit once, right after it
		// created the renderer: three.js reads it first. Give the viewer a
		// limit of one unit, so a second shadow map goes over it.
		const MAX_TEXTURE_IMAGE_UNITS = 0x8872;
		let reads = 0;
		for (const proto of [
			WebGL2RenderingContext.prototype,
			WebGLRenderingContext.prototype,
		]) {
			const original = proto.getParameter;
			proto.getParameter = function (this: any, name: number) {
				if (name === MAX_TEXTURE_IMAGE_UNITS && ++reads > 1) return 1;
				return original.call(this, name);
			};
		}
		await perf.create({shadows: true});
		perf.addBoxes(
			12,
			new SDV.MaterialStandardData({
				color: "#cccccc",
				side: SDV.MATERIAL_SIDE.FRONT,
			}),
		);
		perf.viewport.show = true;
		perf.viewport.update();
		await perf.nextFrame();
		await perf.nextFrame();
		const lights =
			perf.viewport.lightScene ?? perf.viewport.createLightScene();
		perf.viewport.update();
		await perf.nextFrame();
		const watch = perf.watch();
		const steps: Record<string, any> = {};
		const step = async (name: string, change: () => void) => {
			watch.reset();
			change();
			perf.viewport.update();
			const compiles = watch.log.compiles.slice();
			await perf.nextFrame();
			steps[name] = {
				full: compiles.some((call: any) => call.full),
				renderCompiled: watch.log.renderCompiled.reduce(
					(a: number, b: number) => a + b,
					0,
				),
			};
		};
		let added: any;
		await step("forcedOff", () => {
			added = lights.addDirectionalLight({
				castShadow: true,
			});
			SDV.sceneTree.root.updateVersion();
		});
		await step("forcedOn", () => {
			lights.removeLight(added.id);
			SDV.sceneTree.root.updateVersion();
		});
		return {steps, reads};
	});
	for (const [name, step] of Object.entries(result.steps) as [
		string,
		any,
	][]) {
		expect(step.full, name + JSON.stringify(result)).toBe(true);
	}
	// The forced state reaches the lights after the compile of the update
	// that detects it, so one program is created in that first frame, with
	// or without this ticket. Going back to normal compiles everything.
	expect(result.steps.forcedOff.renderCompiled).toBeLessThanOrEqual(1);
	expect(result.steps.forcedOn.renderCompiled).toBe(0);
});
