import {expect} from "@playwright/test";
import {open, test} from "./harness";

/**
 * SS-10491: ids come from a pool of random bytes and versions from a
 * counter, so building and re-versioning a tree makes no native
 * `crypto.randomUUID` call and few `crypto.getRandomValues` calls.
 *
 * Software-safe: counts and strings only.
 */

/** Runs in the page. Adds `window.__c`. */
function installCounters() {
	const SDV = (window as any).SDV;
	const counts = {randomUUID: 0, getRandomValues: 0};
	const randomUUID = crypto.randomUUID?.bind(crypto);
	if (randomUUID)
		crypto.randomUUID = (() => {
			counts.randomUUID++;
			return randomUUID();
		}) as typeof crypto.randomUUID;
	const getRandomValues = crypto.getRandomValues.bind(crypto);
	crypto.getRandomValues = ((array: any) => {
		counts.getRandomValues++;
		return getRandomValues(array);
	}) as typeof crypto.getRandomValues;
	(window as any).__c = {
		counts,
		reset() {
			counts.randomUUID = 0;
			counts.getRandomValues = 0;
		},
		SDV,
	};
}

test("SS-10491 building 1,000 nodes with data makes no randomUUID call", async ({
	page,
}) => {
	await open(page);
	await page.evaluate(installCounters);
	const result = await page.evaluate(() => {
		const c = (window as any).__c;
		const SDV = c.SDV;
		const material = new SDV.MaterialStandardData({color: "#888888"});
		const primitive = (window as any).__perf.boxGeometry(
			[0, 0, 0],
			[1, 1, 1],
		).primitive;
		c.reset();
		const root = new SDV.TreeNode("root");
		for (let i = 0; i < 1000; i++) {
			const node = new SDV.TreeNode(`n${i}`, root);
			const geometry = new SDV.GeometryData(
				primitive,
				SDV.PRIMITIVE_MODE.TRIANGLES,
			);
			geometry.material = material;
			node.addData(geometry);
		}
		root.updateVersion();
		return {...c.counts};
	});

	expect(result.randomUUID).toBe(0);
	// 2,001 nodes and data items need 2,001 ids at 256 per call.
	expect(result.getRandomValues).toBeLessThanOrEqual(8);
});

test("SS-10491 updateVersion on a chain of 32 makes no randomUUID call", async ({
	page,
}) => {
	await open(page);
	await page.evaluate(installCounters);
	const result = await page.evaluate(() => {
		const c = (window as any).__c;
		const SDV = c.SDV;
		const nodes = [new SDV.TreeNode("n0")];
		for (let i = 1; i < 32; i++)
			nodes.push(new SDV.TreeNode(`n${i}`, nodes[i - 1]));
		const before = nodes.map((node: any) => node.version);
		c.reset();
		nodes[0].updateVersion();
		return {
			counts: {...c.counts},
			changed: nodes.filter(
				(node: any, i: number) => node.version !== before[i],
			).length,
			formats: nodes.map((node: any) => /^v\d+$/.test(node.version)),
		};
	});

	expect(result.counts.randomUUID).toBe(0);
	expect(result.counts.getRandomValues).toBe(0);
	expect(result.changed).toBe(32);
	expect(result.formats.every(Boolean)).toBe(true);
});

test("SS-10491 ids, data ids and versions of two trees do not collide", async ({
	page,
}) => {
	await open(page);
	const result = await page.evaluate(() => {
		const SDV = (window as any).SDV;
		const perf = (window as any).__perf;
		const primitive = perf.boxGeometry([0, 0, 0], [1, 1, 1]).primitive;
		const seen: string[] = [];
		const valid =
			/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
		let invalidIds = 0;
		for (let t = 0; t < 2; t++) {
			const root = new SDV.TreeNode(`tree${t}`);
			for (let i = 0; i < 200; i++) {
				const node = new SDV.TreeNode(`n${i}`, root);
				const geometry = new SDV.GeometryData(
					primitive,
					SDV.PRIMITIVE_MODE.TRIANGLES,
				);
				node.addData(geometry);
				for (const id of [node.id, geometry.id])
					if (!valid.test(id)) invalidIds++;
				seen.push(node.id, geometry.id, node.version, geometry.version);
			}
		}
		return {total: seen.length, unique: new Set(seen).size, invalidIds};
	});

	expect(result.invalidIds).toBe(0);
	expect(result.unique).toBe(result.total);
});

test("SS-10491 a clone and an update never repeat an earlier version", async ({
	page,
}) => {
	await open(page);
	const result = await page.evaluate(() => {
		const SDV = (window as any).SDV;
		const node = new SDV.TreeNode("source");
		const versions = [node.version];
		const clone = node.clone();
		versions.push(clone.version);
		node.updateVersion();
		versions.push(node.version);
		clone.updateVersion();
		versions.push(clone.version);
		const instance = node.cloneInstance();
		versions.push(instance.version);
		return {total: versions.length, unique: new Set(versions).size};
	});

	expect(result.unique).toBe(result.total);
});

test("SS-10491 updateVersion keeps the id and a clone keeps the original id", async ({
	page,
}) => {
	await open(page);
	const result = await page.evaluate(() => {
		const SDV = (window as any).SDV;
		const node = new SDV.TreeNode("source");
		const id = node.id;
		node.updateVersion();
		const clone = node.clone();
		return {
			sameId: node.id === id,
			cloneOriginalId: clone.originalId === id,
			cloneNewId: clone.id !== id,
		};
	});

	expect(result.sameId).toBe(true);
	expect(result.cloneOriginalId).toBe(true);
	expect(result.cloneNewId).toBe(true);
});
