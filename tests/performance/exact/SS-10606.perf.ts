import {expect, type Page} from "@playwright/test";
import {createScene, settle, SETTLE_MS} from "../budgets/harness";
import {AEC_DEFAULT, type AecSceneOptions} from "../fixtures/aecScene";
import {openViewer, type SceneVariant} from "../fixtures/probe";
import {skipOnSoftwareRenderer, test} from "./harness";

/**
 * SS-10606: three.js walks the scene graph on every render to build its
 * render list (`projectObject`) and stops only where `visible` is false.
 * A converted object whose branch holds nothing three.js draws on its own
 * (every mesh is drawn by a batch or an instance group) reads `visible`
 * false inside a render, so the walk no longer grows with the node count.
 * Outside a render it still mirrors the node.
 *
 * `renderListVisits` (fixtures/probe.ts) mirrors the walk of three.js
 * 0.184. A three.js upgrade has to check that rule again.
 */

const NO_SHADOWS: SceneVariant = {id: "SS-10606", shadows: false, ssao: false};
const BLENDED: AecSceneOptions = {...AEC_DEFAULT, glassBlend: true};

async function aec(
	page: Page,
	options: AecSceneOptions,
	variant: SceneVariant = NO_SHADOWS,
) {
	await page.clock.install({time: new Date("2026-01-01T00:00:00Z")});
	await openViewer(page, "/index.html");
	await createScene(page, variant, options);
	await settle(page);
}

/** The main-scene passes of the frames drawn while `action` ran. */
async function framesOf(page: Page, action: () => Promise<void>) {
	await page.evaluate(() => (window as any).__probe.reset());
	await action();
	await page.waitForFunction(() => (window as any).__probe.programsReady());
	await page.clock.runFor(SETTLE_MS);
	return page.evaluate(() => {
		const frames = (window as any).__probe.frames() as {
			passes: {
				main: boolean;
				calls: number;
				triangles: number;
				renderListVisits: number;
			}[];
		}[];
		return frames.map((frame) => {
			const main = frame.passes.filter((pass) => pass.main);
			return {
				visits: main.reduce((n, p) => n + p.renderListVisits, 0),
				calls: frame.passes.reduce((n, p) => n + p.calls, 0),
				triangles: frame.passes.reduce((n, p) => n + p.triangles, 0),
			};
		});
	});
}

/** One orbit step and the last frame it drew. */
async function orbitFrame(page: Page) {
	const frames = await framesOf(page, async () => {
		await page.evaluate(() => (window as any).__probe.orbit(1));
		await page.clock.runFor(40);
	});
	expect(frames.length, "the orbit drew no frame").toBeGreaterThan(0);
	return frames[frames.length - 1];
}

async function setCut(page: Page, value: boolean) {
	await page.evaluate((v) => {
		(window as any).__probe.viewport.renderListCut = v;
	}, value);
	await page.clock.runFor(SETTLE_MS);
}

/** The objects in the scene graph. */
function sceneObjects(page: Page): Promise<number> {
	return page.evaluate(() => (window as any).__probe.stats().objects);
}

/** For every tree node: is its converted object's `visible` the node's? */
function mirrorMismatches(page: Page): Promise<number> {
	return page.evaluate(() => {
		const probe = (window as any).__probe;
		const id = probe.viewport.id;
		let mismatches = 0;
		(window as any).SDV.sceneTree.root.traverse((node: any) => {
			const object = node.convertedObject[id];
			if (object && object.visible !== node.visible) mismatches++;
		});
		return mismatches;
	});
}

/** A frame drawn without a camera change. */
async function redrawFrame(page: Page) {
	const frames = await framesOf(page, async () => {
		await page.evaluate(() => (window as any).__probe.viewport.render());
		await page.clock.runFor(40);
	});
	expect(frames.length, "the redraw drew no frame").toBeGreaterThan(0);
	return frames[frames.length - 1];
}

test("SS-10606 1: the render-list walk of an orbit frame does not depend on the scene size", async ({
	page,
	context,
}) => {
	const results: {visits: number; objects: number; uncut: number}[] = [];
	for (const floors of [2, 6]) {
		// A fresh page per size: the clock and the probe are per page.
		const current = floors === 2 ? page : await context.newPage();
		await aec(current, {...BLENDED, floors});
		const cut = await orbitFrame(current);
		await setCut(current, false);
		const uncut = await orbitFrame(current);
		results.push({
			visits: cut.visits,
			objects: await sceneObjects(current),
			uncut: uncut.visits,
		});
	}
	// `renderListVisits` mirrors the walk of this three.js version.
	expect(await page.evaluate(() => (window as any).__THREE__)).toBe("184");
	const [small, large] = results;
	expect(large.objects).toBeGreaterThan(small.objects);
	// Without the cut the walk enters every object the larger tree adds.
	expect(large.uncut - small.uncut).toBe(large.objects - small.objects);
	// With the cut it is a small number, the same for both sizes.
	expect(small.visits).toBeLessThanOrEqual(64);
	expect(large.visits).toBe(small.visits);
});

test("SS-10606 2: outside a render, visible mirrors the node", async ({
	page,
}) => {
	await aec(page, {...BLENDED, floors: 2});
	await orbitFrame(page);
	expect(await mirrorMismatches(page)).toBe(0);
	const hidden = await page.evaluate(() => {
		const probe = (window as any).__probe;
		const node = probe.aec.root.children[0];
		node.visible = false;
		node.updateVersion();
		probe.viewport.update();
		const id = probe.viewport.id;
		return node.convertedObject[id].visible;
	});
	expect(hidden).toBe(false);
	await orbitFrame(page);
	expect(await mirrorMismatches(page)).toBe(0);
});

test("SS-10606 3: the cut draws the same picture", async ({page}) => {
	await aec(page, {...BLENDED, floors: 2});
	// The same camera for both: redraw, do not orbit.
	const cut = await redrawFrame(page);
	const cutImage = await page.evaluate(() =>
		(window as any).__probe.viewport.getScreenshot(),
	);
	await setCut(page, false);
	const uncut = await redrawFrame(page);
	const uncutImage = await page.evaluate(() =>
		(window as any).__probe.viewport.getScreenshot(),
	);
	expect(cut.calls).toBe(uncut.calls);
	expect(cut.triangles).toBe(uncut.triangles);
	expect(cut.visits).toBeLessThan(uncut.visits);
	expect(cutImage === uncutImage, "the screenshots differ").toBe(true);
});

test("SS-10606 4: a hovered member is walked while it is hovered, then cut again", async ({
	page,
}) => {
	// The tower of budgets/interaction.perf.ts: its hover scan hits panes.
	await aec(page, {...BLENDED, floors: 6});
	await page.evaluate(() => (window as any).__probe.setupInteraction());
	await page.waitForFunction(() => (window as any).__probe.programsReady());
	await page.clock.runFor(SETTLE_MS);
	const resting = await redrawFrame(page);

	const box = await page.evaluate(() => (window as any).__probe.canvasRect());
	let hit: [number, number] | undefined;
	for (let row = 1; row <= 10 && !hit; row++)
		for (let column = 1; column <= 12 && !hit; column++) {
			const point: [number, number] = [
				box.x + (box.width * column) / 13,
				box.y + (box.height * row) / 11,
			];
			await page.evaluate(() => (window as any).__probe.reset());
			await page.mouse.move(...point);
			await page.clock.runFor(32);
			const picks = await page.evaluate(() =>
				(window as any).__probe.picks(),
			);
			if (picks.events.hoverOn > 0) hit = point;
		}
	expect(hit, "no pane was hit by the hover scan").toBeDefined();
	await page.clock.runFor(SETTLE_MS);
	const hovered = await redrawFrame(page);
	await setCut(page, false);
	const hoveredUncut = await redrawFrame(page);
	await setCut(page, true);

	// The hovered pane is drawn on its own, and the same as without the cut.
	expect(hovered.calls).toBe(hoveredUncut.calls);
	expect(hovered.visits).toBeGreaterThan(resting.visits);
	// The way to it: the children of each object on the path from the root
	// (three.js enters a cut sibling and returns there), not the scene. On
	// this fixture 4 facades, 16 bays and the parts of one bay.
	expect(hovered.visits - resting.visits).toBeLessThanOrEqual(64);

	await page.mouse.move(box.x + 2, box.y + 2);
	await page.clock.runFor(SETTLE_MS);
	const after = await redrawFrame(page);
	expect(after.visits).toBe(resting.visits);
});

test("SS-10606 5: hide, show and move a batched node", async ({page}) => {
	await aec(page, {...BLENDED, floors: 2});
	const result = await page.evaluate(() => {
		const probe = (window as any).__probe;
		const viewport = probe.viewport;
		const id = viewport.id;
		// A node that holds a batched mesh, and the way to read its instance.
		let node: any;
		(window as any).SDV.sceneTree.root.traverse((candidate: any) => {
			if (node) return;
			const object = candidate.convertedObject[id];
			if (
				object?.children.some(
					(child: any) => child.userData.batchedMesh,
				)
			)
				node = candidate;
		});
		const mesh = node.convertedObject[id].children.find(
			(child: any) => child.userData.batchedMesh,
		);
		const read = () => {
			const batch = mesh.userData.batchedMesh;
			return batch.getVisibleAt(mesh.userData.batchId);
		};
		const matrix = () => {
			const batch = mesh.userData.batchedMesh;
			const m = new mesh.matrixWorld.constructor();
			batch.getMatrixAt(mesh.userData.batchId, m);
			return [m.elements[12], m.elements[13], m.elements[14]];
		};
		const shown = read();
		node.visible = false;
		node.updateVersion();
		viewport.update();
		const hidden = read();
		node.visible = true;
		node.updateVersion();
		viewport.update();
		const shownAgain = read();
		const before = matrix();
		const transformation = node.transformations.find(
			(t: any) => t.id === "SS-10606",
		);
		if (!transformation)
			node.addTransformation({
				id: "SS-10606",
				matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 5, 0, 0, 1],
			});
		node.updateVersion();
		viewport.update();
		const after = matrix();
		const moved = Math.hypot(
			after[0] - before[0],
			after[1] - before[1],
			after[2] - before[2],
		);
		return {shown, hidden, shownAgain, moved};
	});
	expect(result.shown).toBe(true);
	expect(result.hidden).toBe(false);
	expect(result.shownAgain).toBe(true);
	expect(result.moved).toBeCloseTo(5, 5);
	await orbitFrame(page);
	expect(await mirrorMismatches(page)).toBe(0);
});

test("SS-10606 6: individual meshes keep their branches walked", async ({
	page,
}) => {
	// Depth-writing glass stays one mesh per pane (static-batching rule).
	await aec(page, {...AEC_DEFAULT, floors: 2});
	const cut = await orbitFrame(page);
	await setCut(page, false);
	const uncut = await orbitFrame(page);
	expect(cut.calls).toBe(uncut.calls);
	expect(cut.triangles).toBe(uncut.triangles);
	// The panes are walked; the batched mullions are cut.
	expect(cut.visits).toBeLessThan(uncut.visits);
	expect(cut.visits).toBeGreaterThan(64);
});

test("SS-10606 7: shadows and ambient occlusion draw the same with the cut", async ({
	page,
}) => {
	await skipOnSoftwareRenderer(
		page,
		"shadow maps are off on the software renderer",
	);
	await aec(
		page,
		{...BLENDED, floors: 2},
		{id: "SS-10606-shadows", shadows: true, ssao: true},
	);
	const cut = await orbitFrame(page);
	await setCut(page, false);
	const uncut = await orbitFrame(page);
	expect(cut.calls).toBe(uncut.calls);
	expect(cut.triangles).toBe(uncut.triangles);
});
