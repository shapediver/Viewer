import {expect, type Page} from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import {syntheticGlb} from "../syntheticGlb";
import {ASSET_HOST, open, test} from "./harness";

test("SS-10396 Draco is constructed once and decodes on one worker", async ({
	page,
}) => {
	await open(page);
	const counts = await page.evaluate(async (host) => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		let wasm = 0;
		let workers = 0;
		const instantiate = WebAssembly.instantiate.bind(WebAssembly);
		WebAssembly.instantiate = ((...args: any[]) => {
			wasm++;
			return (instantiate as any)(...args);
		}) as typeof WebAssembly.instantiate;
		if (WebAssembly.instantiateStreaming) {
			const streaming =
				WebAssembly.instantiateStreaming.bind(WebAssembly);
			WebAssembly.instantiateStreaming = ((...args: any[]) => {
				wasm++;
				return (streaming as any)(...args);
			}) as typeof WebAssembly.instantiateStreaming;
		}
		let instances = 0;
		const Instance = WebAssembly.Instance;
		(WebAssembly as any).Instance = function InstanceProxy(
			this: WebAssembly.Instance,
			...args: ConstructorParameters<typeof WebAssembly.Instance>
		) {
			instances++;
			return new Instance(...args);
		};
		const OriginalWorker = window.Worker;
		(window as any).Worker = function WorkerProxy(
			this: Worker,
			...args: ConstructorParameters<typeof Worker>
		) {
			workers++;
			return new OriginalWorker(...args);
		};
		const load = async (href: string) => {
			const node = await SDV.DataEngine.instance.loadContent({
				format: "gltf",
				href,
			});
			let meshes = 0;
			node.traverse((treeNode: any) => {
				treeNode.data?.forEach?.((data: any) => {
					if (data.primitive) meshes++;
				});
			});
			return meshes;
		};
		const plainMeshes = await load(`${host}/shared-mesh-boxes.glb`);
		const workersAfterPlain = workers;
		const wasmAfterPlain = wasm;
		const dracoMeshes = await load(`${host}/Box.gltf`);
		await load(`${host}/Box.gltf`);
		return {
			plainMeshes,
			dracoMeshes,
			workersAfterPlain,
			wasmAfterPlain,
			workers,
			wasm,
			instances,
		};
	}, ASSET_HOST);
	expect(counts.plainMeshes, JSON.stringify(counts)).toBeGreaterThan(0);
	expect(counts.dracoMeshes, JSON.stringify(counts)).toBeGreaterThan(0);
	expect(counts.workersAfterPlain, JSON.stringify(counts)).toBe(0);
	expect(counts.workers, JSON.stringify(counts)).toBe(1);
	expect(counts.wasm, JSON.stringify(counts)).toBeLessThanOrEqual(1);
});

/** Decode Box.gltf and describe the result, for comparing two pages. */
async function decodeDracoBox(page: Page, disableWorker: boolean) {
	await open(page);
	return page.evaluate(
		async ({host, disableWorker}) => {
			const SDV = (window as any).SDV;
			let workers = 0;
			const OriginalWorker = window.Worker;
			(window as any).Worker = disableWorker
				? undefined
				: function WorkerProxy(
						this: Worker,
						...args: ConstructorParameters<typeof Worker>
					) {
						workers++;
						return new OriginalWorker(...args);
					};
			const node = await SDV.DataEngine.instance.loadContent({
				format: "gltf",
				href: `${host}/Box.gltf`,
			});
			const primitives: any[] = [];
			node.traverse((treeNode: any) => {
				treeNode.data?.forEach?.((data: any) => {
					if (!data.primitive) return;
					const attributes: any = {};
					for (const name in data.primitive.attributes) {
						const array = data.primitive.attributes[name].array;
						attributes[name] = Array.from(
							array as ArrayLike<number>,
						);
					}
					primitives.push({
						attributes,
						indices: Array.from(
							data.primitive.indices.array as ArrayLike<number>,
						),
					});
				});
			});
			return {workers, primitives};
		},
		{host: ASSET_HOST, disableWorker},
	);
}

test("SS-10396 the worker decodes the same geometry as the main thread", async ({
	page,
	context,
}) => {
	// The fixture routes only its own page; the second page needs the assets.
	await context.route(`${ASSET_HOST}/**`, async (route) => {
		const name = path.basename(new URL(route.request().url()).pathname);
		const file = path.join(__dirname, "../assets", name);
		if (!fs.existsSync(file))
			return route.fulfill({status: 404, body: name});
		await route.fulfill({status: 200, body: fs.readFileSync(file)});
	});
	const inWorker = await decodeDracoBox(page, false);
	const fallbackPage = await context.newPage();
	const onMainThread = await decodeDracoBox(fallbackPage, true);
	expect(inWorker.workers).toBe(1);
	expect(onMainThread.workers).toBe(0);
	expect(inWorker.primitives.length).toBe(1);
	expect(inWorker.primitives[0].attributes.POSITION.length).toBe(72);
	expect(inWorker.primitives[0].indices.length).toBe(36);
	expect(onMainThread.primitives).toEqual(inWorker.primitives);
});

test("SS-10396 a large glb load yields to the browser", async ({page}) => {
	// 3000 primitives, 6001 nodes: on development this converts in one
	// task of about a second, and no animation frame runs meanwhile.
	const glb = syntheticGlb({meshes: 1000, instancesPerMesh: 3, gridSize: 8});
	await page.route(`${ASSET_HOST}/synthetic-large.glb`, (route) =>
		route.fulfill({
			status: 200,
			contentType: "model/gltf-binary",
			body: glb,
		}),
	);
	await open(page);
	const result = await page.evaluate(async (host) => {
		const SDV = (window as any).SDV;
		const longTasks: number[] = [];
		const observer = new PerformanceObserver((list) =>
			list
				.getEntries()
				.forEach((entry) => longTasks.push(entry.duration)),
		);
		observer.observe({type: "longtask", buffered: false});
		let frames = 0;
		let loading = true;
		const frame = () => {
			if (!loading) return;
			frames++;
			requestAnimationFrame(frame);
		};
		requestAnimationFrame(frame);
		const node = await SDV.DataEngine.instance.loadContent({
			format: "glb",
			href: `${host}/synthetic-large.glb`,
		});
		loading = false;
		await new Promise((resolve) => setTimeout(resolve, 100));
		observer.disconnect();
		let primitives = 0;
		let nodes = 0;
		const min = [Infinity, Infinity];
		const max = [-Infinity, -Infinity];
		node.traverse((treeNode: any) => {
			nodes++;
			treeNode.data?.forEach?.((data: any) => {
				if (!data.primitive) return;
				primitives++;
				const position = data.primitive.attributes.POSITION.array;
				for (let i = 0; i < position.length; i += 3) {
					min[0] = Math.min(min[0], position[i]);
					min[1] = Math.min(min[1], position[i + 1]);
					max[0] = Math.max(max[0], position[i]);
					max[1] = Math.max(max[1], position[i + 1]);
				}
			});
		});
		return {
			frames,
			longestTask: Math.max(0, ...longTasks),
			primitives,
			nodes,
			min,
			max,
		};
	}, ASSET_HOST);
	// The geometry arrives as before: every placement, positions in [0, 1].
	expect(result.primitives, JSON.stringify(result)).toBe(3000);
	expect(result.min, JSON.stringify(result)).toEqual([0, 0]);
	expect(result.max, JSON.stringify(result)).toEqual([1, 1]);
	// Conversion runs in short slices, and the page keeps painting.
	expect(result.frames, JSON.stringify(result)).toBeGreaterThanOrEqual(3);
	// development: one task for the whole conversion (about a second here).
	// The bound leaves room for a garbage collection, not for a whole load.
	expect(result.longestTask, JSON.stringify(result)).toBeLessThan(500);
});

test("SS-10396 a glb with a second buffer loads it", async ({page}) => {
	// Buffer 0 is the GLB body; buffer 1 is a data URI. Both are required.
	const glb = syntheticGlb({
		meshes: 2,
		instancesPerMesh: 1,
		gridSize: 4,
		extraDataUriBuffers: 1,
	});
	await page.route(`${ASSET_HOST}/synthetic-two-buffers.glb`, (route) =>
		route.fulfill({
			status: 200,
			contentType: "model/gltf-binary",
			body: glb,
		}),
	);
	await open(page);
	const result = await page.evaluate(async (host) => {
		const SDV = (window as any).SDV;
		try {
			const node = await SDV.DataEngine.instance.loadContent({
				format: "glb",
				href: `${host}/synthetic-two-buffers.glb`,
			});
			let primitives = 0;
			node.traverse((treeNode: any) => {
				treeNode.data?.forEach?.((data: any) => {
					if (data.primitive) primitives++;
				});
			});
			return {primitives, error: null};
		} catch (error) {
			return {primitives: 0, error: String(error)};
		}
	}, ASSET_HOST);
	expect(result.error).toBeNull();
	expect(result.primitives).toBe(2);
});
