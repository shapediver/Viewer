import {expect, type Page} from "@playwright/test";
import {ASSET_HOST, open, test} from "./harness";

/**
 * SS-10643: `GeometryLoader.updateGeometryMaterial` looked up the cache key of
 * a geometry and, on a miss, scanned the whole geometry cache for an entry
 * with an InstanceData suffix. A GPU-instanced occurrence is never in the
 * cache, so every refresh of one (hover effect on or off, material change)
 * scanned all entries: the cost of enabling hover grew with the square of the
 * number of geometries.
 *
 * The scene: N distinct boxes (N entries in the geometry cache) and one glb
 * with 20 nodes that place one more box (GPU-instanced). Each instance node
 * is refreshed once. Counted: the elements of every `Object.keys`,
 * `Object.entries` and `Object.values` result with 1,000 or more elements,
 * which is how the cache was walked (`entriesWalked`). It has to be 0 at
 * 4,000 and at 16,000 boxes.
 */

const INSTANCES = 20;

/** A glb with one box mesh and `count` nodes that place it on a grid. */
function instancesGlb(count: number): Buffer {
	const positions = new Float32Array(24);
	for (let i = 0; i < 8; i++) {
		positions[i * 3] = i & 1 ? 0.4 : -0.4;
		positions[i * 3 + 1] = i & 2 ? 0.4 : -0.4;
		positions[i * 3 + 2] = i & 4 ? 0.8 : 0;
	}
	const indices = new Uint16Array([
		0, 2, 3, 0, 3, 1, 4, 5, 7, 4, 7, 6, 0, 1, 5, 0, 5, 4, 2, 7, 3, 2, 6, 7,
		0, 4, 6, 0, 6, 2, 1, 3, 7, 1, 7, 5,
	]);
	const bin = Buffer.concat([
		Buffer.from(positions.buffer),
		Buffer.from(indices.buffer),
	]);
	const columns = Math.ceil(Math.sqrt(count));
	const nodes: object[] = [{name: "instances", children: [] as number[]}];
	for (let i = 0; i < count; i++) {
		(nodes[0] as {children: number[]}).children.push(nodes.length);
		nodes.push({
			name: `i${i}`,
			mesh: 0,
			translation: [(i % columns) * 2, Math.floor(i / columns) * 2, 0],
		});
	}
	const json = {
		asset: {version: "2.0"},
		scene: 0,
		scenes: [{nodes: [0]}],
		nodes,
		meshes: [
			{primitives: [{attributes: {POSITION: 0}, indices: 1, mode: 4}]},
		],
		accessors: [
			{
				bufferView: 0,
				componentType: 5126,
				count: 8,
				type: "VEC3",
				min: [-0.4, -0.4, 0],
				max: [0.4, 0.4, 0.8],
			},
			{bufferView: 1, componentType: 5123, count: 36, type: "SCALAR"},
		],
		bufferViews: [
			{buffer: 0, byteOffset: 0, byteLength: 96},
			{buffer: 0, byteOffset: 96, byteLength: 72},
		],
		buffers: [{byteLength: bin.length}],
	};
	let text = JSON.stringify(json);
	while (text.length % 4) text += " ";
	const jsonChunk = Buffer.from(text, "utf8");
	const binChunk = Buffer.concat([
		bin,
		Buffer.alloc((4 - (bin.length % 4)) % 4),
	]);
	const header = Buffer.alloc(12);
	header.writeUInt32LE(0x46546c67, 0);
	header.writeUInt32LE(2, 4);
	header.writeUInt32LE(12 + 8 + jsonChunk.length + 8 + binChunk.length, 8);
	const chunk = (type: number, data: Buffer) => {
		const head = Buffer.alloc(8);
		head.writeUInt32LE(data.length, 0);
		head.writeUInt32LE(type, 4);
		return Buffer.concat([head, data]);
	};
	return Buffer.concat([
		header,
		chunk(0x4e4f534a, jsonChunk),
		chunk(0x004e4942, binChunk),
	]);
}

type Work = {
	instanced: number;
	refreshes: number;
	entriesWalked: number;
};

async function measure(page: Page, boxes: number): Promise<Work> {
	const name = `ss10643-${boxes}.glb`;
	const glb = instancesGlb(INSTANCES);
	await page.route(`${ASSET_HOST}/${name}`, (route) =>
		route.fulfill({
			status: 200,
			contentType: "model/gltf-binary",
			body: glb,
		}),
	);
	await open(page);
	return page.evaluate(
		async ({boxes, href}) => {
			const perf = (window as any).__perf;
			const SDV = (window as any).SDV;
			await perf.create({shadows: false});

			perf.addBoxes(
				boxes,
				new SDV.MaterialStandardData({color: "#66cc88"}),
			);
			const root = await SDV.DataEngine.instance.loadContent({
				format: "glb",
				href,
			});
			const nodes: any[] = [];
			root.traverse((node: any) => {
				if (/^i\d+$/.test(node.name)) nodes.push(node);
			});
			SDV.sceneTree.addNode(root);
			SDV.sceneTree.root.updateVersion();
			perf.viewport.update();
			perf.viewport.show = true;
			await perf.viewport.camera.zoomTo(undefined, {duration: 0});
			await perf.nextFrame();

			const viewportId = perf.viewport.id;
			let instanced = 0;
			for (const node of nodes)
				node.convertedObject[viewportId]?.traverse((o: any) => {
					if (o.userData.isInstanced) instanced++;
				});

			// count what is walked of large objects
			let entriesWalked = 0;
			const originals = {
				keys: Object.keys,
				entries: Object.entries,
				values: Object.values,
			};
			const wrap =
				(name: "keys" | "entries" | "values") =>
				(object: any): any => {
					const result = (originals[name] as any)(object);
					if (result.length >= 1000) entriesWalked += result.length;
					return result;
				};
			Object.keys = wrap("keys") as any;
			Object.entries = wrap("entries") as any;
			Object.values = wrap("values") as any;

			// refresh every instance node, as a hover effect does
			let refreshes = 0;
			for (const node of nodes) {
				node.updateVersion();
				perf.viewport.update();
				await perf.nextFrame();
				refreshes++;
			}

			Object.keys = originals.keys;
			Object.entries = originals.entries;
			Object.values = originals.values;
			return {instanced, refreshes, entriesWalked};
		},
		{boxes, href: `${ASSET_HOST}/${name}`},
	);
}

test("SS-10643 refreshing an instanced occurrence walks no cache entries", async ({
	page,
	browser,
}) => {
	const small = await measure(page, 4000);
	const largePage = await browser.newPage();
	const large = await measure(largePage, 16000);
	await largePage.close();
	const context = JSON.stringify({small, large});

	// The fixture does what it should: occurrences are instanced and refreshed.
	expect(small.instanced, context).toBeGreaterThan(0);
	expect(large.instanced, context).toBeGreaterThan(0);
	expect(small.refreshes, context).toBeGreaterThan(0);

	// Nothing walks the cache, at any cache size.
	expect(small.entriesWalked, context).toBe(0);
	expect(large.entriesWalked, context).toBe(0);
});
