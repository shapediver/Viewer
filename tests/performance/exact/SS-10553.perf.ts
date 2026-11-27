import {expect, type Page} from "@playwright/test";
import {open, skipOnSoftwareRenderer, test} from "./harness";

/**
 * SS-10553: the viewport settings `ambientOcclusionWhileMoving` and
 * `softShadowsWhileMoving` (default true). Set to false, frames drawn while
 * the camera moves run none of the ambient occlusion work and use the hard
 * shadow blend 0; both come back with the beauty rendering.
 *
 * `__tools` (installed by `prepare`), one entry per canvas frame:
 * - `ao`: renders of the AO effect's normal, AO and denoise passes in that
 *   frame (they run before the frame reaches the canvas);
 * - `aoNone`: the AO effect showed no occlusion (its input is the white
 *   texture, which the "shading" mode also hands to the materials);
 * - `blend`: the soft-shadow blend uniform of the boxes' material;
 * - `phase`: "still", "drag" (mouse down) or "released";
 * - `camera`: the viewport camera's position and target.
 */
interface Frame {
	ao: number;
	aoNone: boolean;
	blend: number | null;
	phase: string;
	camera: string;
}

interface Settings {
	shadows: boolean;
	softShadows: boolean;
	ao: "composite" | "shading" | null;
	ambientOcclusionWhileMoving: boolean;
	softShadowsWhileMoving: boolean;
}

async function prepare(page: Page, settings: Settings) {
	await page.clock.install({time: new Date("2026-01-01T00:00:00Z")});
	await open(page);
	await page.evaluate(async (settings) => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({
			shadows: settings.shadows,
			softShadows: settings.softShadows,
			beautyDelay: 50,
			beautyDuration: 1500,
		});
		const viewport = perf.viewport;
		viewport.ambientOcclusionWhileMoving =
			settings.ambientOcclusionWhileMoving;
		viewport.softShadowsWhileMoving = settings.softShadowsWhileMoving;
		perf.addBoxes(
			2,
			new SDV.MaterialStandardData({
				color: "#8899aa",
				side: SDV.MATERIAL_SIDE.FRONT,
			}),
		);
		let token: any = null;
		if (settings.ao) {
			token = viewport.postProcessing.addEffect({
				type: SDV.POST_PROCESSING_EFFECT_TYPE.SSAO,
				properties: {mode: settings.ao},
			});
		}
		viewport.update();
		viewport.show = true;

		// The composer builds its effects when the effect pass is rebuilt:
		// look the effect up again and wrap each pass once per object.
		let ao = 0;
		const wrapped = new WeakSet<object>();
		const count = (pass: any) => {
			if (!pass || wrapped.has(pass)) return;
			wrapped.add(pass);
			const render = pass.render.bind(pass);
			pass.render = (...args: unknown[]) => {
				ao++;
				return render(...args);
			};
		};
		const currentEffect = (): any =>
			token === null ? null : viewport.postProcessing.getEffect(token);
		const wrapAo = () => {
			const effect = currentEffect();
			if (!effect) return;
			count(effect.normalPass);
			count(effect.aoPass);
			count(effect.poissionDenoisePass);
		};

		// the soft-shadow blend uniform of the boxes' material
		const blend = (): number | null => {
			const node = SDV.sceneTree.root.children.find(
				(child: {name: string}) => child.name === "box0",
			);
			const mesh = node?.data[0]?.convertedObject[viewport.id];
			const own = mesh?.material;
			const candidates: any[] = [
				mesh?.userData?.batchedMesh?.material,
				...(Array.isArray(own) ? own : [own]),
			];
			for (const material of candidates) {
				const uniform = material?.userData?.shader?.uniforms?.blending;
				if (uniform) return uniform.value;
			}
			return null;
		};

		let finished = 0;
		SDV.addListener(
			SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
			() => finished++,
		);
		const frames: Frame[] = [];
		let lastTime = -1;
		const tools = {
			phase: "still",
			frames: () => frames,
			finished: () => finished,
			programs: () => perf.renderer.info.programs?.length ?? 0,
			wrapAo,
			reset: () => {
				frames.length = 0;
				finished = 0;
				ao = 0;
			},
		};
		const renderer = perf.renderer;
		const render = renderer.render.bind(renderer);
		renderer.render = (scene: any, camera: any) => {
			const result = render(scene, camera);
			if (renderer.getRenderTarget()) return result;
			// the AO passes of the next frame run before it reaches the canvas
			wrapAo();
			const effect = currentEffect();
			const time = performance.now();
			// the composer may reach the canvas more than once per frame
			if (time === lastTime && frames.length > 0) {
				frames[frames.length - 1].ao += ao;
			} else {
				frames.push({
					ao,
					aoNone: effect
						? effect.uniforms.get("inputTexture").value ===
							effect.constructor.noAOTexture
						: false,
					blend: blend(),
					phase: tools.phase,
					camera: JSON.stringify([
						...viewport.camera.position,
						...viewport.camera.target,
					]),
				});
			}
			ao = 0;
			lastTime = time;
			return result;
		};
		(window as any).__tools = tools;
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
	// the AO passes must be wrapped before the first counted frame
	await page.evaluate(() => (window as any).__tools.wrapAo());
	await page.evaluate(() => (window as any).__tools.reset());
}

/** Drags the camera, releases it and lets the viewport settle. */
async function drag(page: Page, middle?: () => void) {
	const programs = await page.evaluate(() =>
		(window as any).__tools.programs(),
	);
	await page.mouse.move(600, 360);
	await page.evaluate(() => ((window as any).__tools.phase = "drag"));
	await page.mouse.down();
	for (let step = 1; step <= 6; step++) {
		await page.mouse.move(600 + step * 20, 360 + step * 10);
		await page.clock.runFor(32);
		if (step === 3 && middle) await page.evaluate(middle);
	}
	await page.evaluate(() => ((window as any).__tools.phase = "released"));
	await page.mouse.up();
	await page.clock.runFor(3000);
	const result = await page.evaluate(() => ({
		frames: (window as any).__tools.frames() as Frame[],
		finished: (window as any).__tools.finished() as number,
		programs: (window as any).__tools.programs() as number,
	}));
	return {...result, programsBefore: programs};
}

/** Index of the last frame whose camera differs from the frame before. */
function lastCameraFrame(frames: Frame[]) {
	let last = -1;
	for (let i = 1; i < frames.length; i++)
		if (frames[i].camera !== frames[i - 1].camera) last = i;
	return last;
}

for (const mode of ["composite", "shading"] as const) {
	test(`SS-10553 ambientOcclusionWhileMoving false, ${mode}: no AO work while the camera moves, AO back after the stop`, async ({
		page,
	}) => {
		await prepare(page, {
			shadows: false,
			softShadows: false,
			ao: mode,
			ambientOcclusionWhileMoving: false,
			softShadowsWhileMoving: true,
		});
		const result = await drag(page);
		const {frames} = result;
		const moved = lastCameraFrame(frames);
		expect(moved, "the camera did not move").toBeGreaterThan(0);
		const dragFrames = frames.filter((f) => f.phase === "drag");
		expect(dragFrames.length).toBeGreaterThan(0);
		// every frame up to the last camera change runs no AO pass and shows no occlusion
		const moving = frames.slice(0, moved + 1);
		expect(
			moving.map((f) => f.ao),
			JSON.stringify(moving.map((f) => [f.ao, f.aoNone])),
		).toEqual(moving.map(() => 0));
		expect(moving.every((f) => f.aoNone)).toBe(true);
		// after the stop the AO comes back, and the last frame shows it
		const last = frames[frames.length - 1];
		expect(last.ao).toBeGreaterThan(0);
		expect(last.aoNone).toBe(false);
		expect(result.finished).toBe(1);
		// switching between moving and still builds no shader program
		expect(result.programs).toBe(result.programsBefore);
	});
}

test("SS-10553 ambientOcclusionWhileMoving true (default): AO runs while the camera moves", async ({
	page,
}) => {
	await prepare(page, {
		shadows: false,
		softShadows: false,
		ao: "composite",
		ambientOcclusionWhileMoving: true,
		softShadowsWhileMoving: true,
	});
	const {frames} = await drag(page);
	const moved = lastCameraFrame(frames);
	expect(moved).toBeGreaterThan(0);
	const moving = frames.slice(0, moved + 1);
	expect(moving.every((f) => f.ao > 0 && !f.aoNone)).toBe(true);
});

test("SS-10553 ambientOcclusionWhileMoving false: a hide on a still camera keeps the AO", async ({
	page,
}) => {
	await prepare(page, {
		shadows: false,
		softShadows: false,
		ao: "composite",
		ambientOcclusionWhileMoving: false,
		softShadowsWhileMoving: false,
	});
	await page.evaluate(() => {
		const root = (window as any).SDV.sceneTree.root;
		const node = root.children.find((n: any) => n.name === "box1");
		node.visible = false;
		node.updateVersion();
		(window as any).__perf.viewport.update();
	});
	await page.clock.runFor(500);
	const frames: Frame[] = await page.evaluate(() =>
		(window as any).__tools.frames(),
	);
	expect(frames.length).toBeGreaterThan(0);
	expect(frames.every((f) => f.ao > 0 && !f.aoNone)).toBe(true);
});

test("SS-10553 ambientOcclusionWhileMoving false: no AO work while the camera autorotates", async ({
	page,
}) => {
	await prepare(page, {
		shadows: false,
		softShadows: false,
		ao: "composite",
		ambientOcclusionWhileMoving: false,
		softShadowsWhileMoving: true,
	});
	await page.evaluate(() => {
		const camera = (window as any).__perf.viewport.camera;
		camera.autoRotationSpeed = 0.1;
		camera.enableAutoRotation = true;
	});
	await page.clock.runFor(500);
	const rotating: Frame[] = await page.evaluate(() =>
		(window as any).__tools.frames(),
	);
	expect(rotating.length).toBeGreaterThan(5);
	expect(lastCameraFrame(rotating)).toBeGreaterThan(0);
	expect(rotating.every((f) => f.ao === 0 && f.aoNone)).toBe(true);

	await page.evaluate(() => {
		(window as any).__perf.viewport.camera.enableAutoRotation = false;
	});
	await page.clock.runFor(3000);
	const frames: Frame[] = await page.evaluate(() =>
		(window as any).__tools.frames(),
	);
	const last = frames[frames.length - 1];
	expect(last.ao).toBeGreaterThan(0);
	expect(last.aoNone).toBe(false);
});

for (const whileMoving of [false, true]) {
	test(`SS-10553 softShadowsWhileMoving ${whileMoving}: the blend of frames drawn while the camera moves`, async ({
		page,
	}) => {
		await skipOnSoftwareRenderer(
			page,
			"the soft-shadow blend needs shadows, which are off on SwiftShader",
		);
		await prepare(page, {
			shadows: true,
			softShadows: true,
			ao: null,
			ambientOcclusionWhileMoving: true,
			softShadowsWhileMoving: whileMoving,
		});
		const result = await drag(page);
		const {frames} = result;
		const moved = lastCameraFrame(frames);
		expect(moved, "the camera did not move").toBeGreaterThan(0);
		const moving = frames.slice(0, moved + 1);
		expect(
			moving.map((f) => f.blend),
			JSON.stringify(frames.map((f) => [f.phase, f.blend])),
		).toEqual(moving.map(() => (whileMoving ? 0.1 : 0)));
		// the fade still runs to the full soft shadows after the stop
		expect(frames[frames.length - 1].blend).toBe(1);
		expect(result.finished).toBe(1);
		expect(result.programs).toBe(result.programsBefore);
	});
}

test("SS-10553 a setting switched during the drag applies on the next frame", async ({
	page,
}) => {
	await skipOnSoftwareRenderer(
		page,
		"the soft-shadow blend needs shadows, which are off on SwiftShader",
	);
	await prepare(page, {
		shadows: true,
		softShadows: true,
		ao: "composite",
		ambientOcclusionWhileMoving: true,
		softShadowsWhileMoving: true,
	});
	const result = await drag(page, () => {
		const viewport = (window as any).__perf.viewport;
		viewport.softShadowsWhileMoving = false;
		viewport.ambientOcclusionWhileMoving = false;
	});
	const {frames} = result;
	const moved = lastCameraFrame(frames);
	const switched = frames.findIndex((f) => f.blend === 0);
	expect(switched, JSON.stringify(frames)).toBeGreaterThan(0);
	expect(switched).toBeLessThanOrEqual(moved);
	// from then on, every moving frame is cheap
	for (const f of frames.slice(switched, moved + 1)) {
		expect(f.blend).toBe(0);
		expect(f.ao).toBe(0);
	}
	expect(frames[frames.length - 1].blend).toBe(1);
	expect(frames[frames.length - 1].ao).toBeGreaterThan(0);
	expect(result.programs).toBe(result.programsBefore);
});
