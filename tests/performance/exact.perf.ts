import {test as base, expect, type Page} from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

/**
 * Exact checks for SS-10382–SS-10397.
 *
 * Each test encodes the result the ticket asks for. On current development
 * the tickets are not done, so the checks fail. A later task branch passes
 * the check that belongs to it.
 *
 * Nothing here asserts a millisecond or a frame rate. Docker is the wrong
 * tool for that: a containerized Chrome is SwiftShader, and this viewer
 * disables shadows on SwiftShader, so the shadow tests would not run the
 * code under test. Counts, pixel sizes, and object identity are the same
 * on every machine that has a real GPU.
 */

const ASSET_HOST = "https://perf-assets.viewertests.invalid";
const assetDirs = [
	path.join(__dirname, "assets"),
	path.join(__dirname, "../instancing/assets"),
];

const test = base.extend({
	page: async ({page}, use) => {
		await page.route(`${ASSET_HOST}/**`, async (route) => {
			const name = path.basename(new URL(route.request().url()).pathname);
			const file = assetDirs
				.map((dir) => path.join(dir, name))
				.find((candidate) => fs.existsSync(candidate));
			if (!file) {
				await route.fulfill({status: 404, body: name});
				return;
			}
			const type = name.endsWith(".bin")
				? "application/octet-stream"
				: name.endsWith(".glb")
					? "model/gltf-binary"
					: "model/gltf+json";
			await route.fulfill({
				status: 200,
				contentType: type,
				body: fs.readFileSync(file),
			});
		});
		await use(page);
	},
});

function installApi() {
	const BOX_INDICES = [
		0, 2, 3, 0, 3, 1, 4, 5, 7, 4, 7, 6, 0, 1, 5, 0, 5, 4, 2, 7, 3, 2, 6, 7,
		0, 4, 6, 0, 6, 2, 1, 3, 7, 1, 7, 5,
	];
	const SDV = (window as any).SDV;
	const renderers: any[] = [];
	const devtools = new EventTarget();
	devtools.addEventListener("observe", (event) => {
		const detail = (event as CustomEvent).detail;
		if (detail && detail.isWebGLRenderer) renderers.push(detail);
	});
	(window as any).__THREE_DEVTOOLS__ = devtools;

	const renders: any[] = [];

	function track(renderer: any) {
		const original = renderer.render.bind(renderer);
		renderer.render = (scene: any, camera: any) => {
			let meshes = 0;
			let depthMeshes = 0;
			scene.traverse((object: any) => {
				if (!object.isMesh) return;
				meshes++;
				const materials = Array.isArray(object.material)
					? object.material
					: [object.material];
				if (
					materials.some(
						(material: any) => material?.isMeshDepthMaterial,
					)
				)
					depthMeshes++;
			});
			const result = original(scene, camera);
			const target = renderer.getRenderTarget();
			renders.push({
				calls: renderer.info.render.calls,
				triangles: renderer.info.render.triangles,
				meshes,
				depthMeshes,
				target: target ? [target.width, target.height] : null,
				time: performance.now(),
			});
			return result;
		};
	}

	function boxGeometry(min: number[], max: number[]) {
		const positions = new Float32Array(24);
		for (let i = 0; i < 8; i++) {
			positions[i * 3] = i & 1 ? max[0] : min[0];
			positions[i * 3 + 1] = i & 2 ? max[1] : min[1];
			positions[i * 3 + 2] = i & 4 ? max[2] : min[2];
		}
		const indices = new Uint16Array(BOX_INDICES);
		return new SDV.GeometryData(
			new SDV.PrimitiveData(
				{
					POSITION: new SDV.AttributeData(
						positions,
						3,
						12,
						0,
						4,
						false,
						positions.length,
					),
				},
				new SDV.AttributeData(
					indices,
					1,
					2,
					0,
					2,
					false,
					indices.length,
				),
			),
			SDV.PRIMITIVE_MODE.TRIANGLES,
		);
	}

	function addBoxes(count: number, material: any) {
		for (let i = 0; i < count; i++) {
			const geometry = boxGeometry(
				[-0.4, -0.4, i * 1.2],
				[0.4, 0.4, i * 1.2 + 0.8],
			);
			geometry.material = material;
			const node = new SDV.TreeNode(`box${i}`);
			node.addData(geometry);
			SDV.sceneTree.root.addChild(node);
		}
		SDV.sceneTree.root.updateVersion();
		return count;
	}

	async function create(settings: any = {}) {
		const viewport = await SDV.createViewport({
			canvas: document.getElementById("canvas"),
			id: "perf",
			visibility: SDV.VISIBILITY_MODE.MANUAL,
			branding: {backgroundColor: "#101010"},
		});
		viewport.shadows = settings.shadows ?? false;
		viewport.softShadows = settings.softShadows ?? false;
		viewport.gridVisibility = false;
		viewport.groundPlaneVisibility = false;
		viewport.groundPlaneShadowVisibility = false;
		viewport.contactShadowVisibility = settings.contactShadow ?? false;
		viewport.environmentMap = SDV.ENVIRONMENT_MAP_EMPTY.NONE;
		viewport.beautyRenderDelay = settings.beautyDelay ?? 0;
		viewport.beautyRenderBlendingDuration = settings.beautyDuration ?? 0;
		const renderer = renderers[renderers.length - 1];
		if (!renderer) throw new Error("WebGLRenderer was not captured");
		track(renderer);
		const gl = renderer.getContext();
		const info = gl.getExtension("WEBGL_debug_renderer_info");
		const gpu = info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : "";
		(window as any).__perf.viewport = viewport;
		(window as any).__perf.renderer = renderer;
		(window as any).__perf.gl = gl;
		(window as any).__perf.gpu = String(gpu);
		return gpu;
	}

	(window as any).__perf = {
		create,
		addBoxes,
		boxGeometry,
		renders,
		renderers,
	};
}

async function open(page: Page) {
	await page.goto("/index.html");
	await page.waitForFunction(() => Boolean((window as any).SDV));
	await page.evaluate(installApi);
}

test("SS-10382 updateVersion creates one uuid per node", async ({page}) => {
	await open(page);
	const created = await page.evaluate(() => {
		const SDV = (window as any).SDV;
		const nodes = [new SDV.TreeNode("n0")];
		for (let i = 1; i < 32; i++)
			nodes.push(new SDV.TreeNode(`n${i}`, nodes[i - 1]));
		let createdIds = 0;
		const original = crypto.randomUUID.bind(crypto);
		crypto.randomUUID = () => {
			createdIds++;
			return original();
		};
		nodes[0].updateVersion();
		crypto.randomUUID = original;
		return createdIds;
	});
	// A chain of 32. The walk updates each node once. Ancestors of the
	// chain root are not part of the chain.
	expect(created).toBe(32);
});

test("SS-10383 hidden contact shadow does not render the scene", async ({
	page,
}) => {
	await open(page);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		const gpu = await perf.create({
			shadows: true,
			softShadows: false,
			contactShadow: false,
		});
		const material = new SDV.MaterialStandardData({
			color: "#cccccc",
			side: SDV.MATERIAL_SIDE.FRONT,
		});
		perf.addBoxes(8, material);
		perf.viewport.update();
		perf.viewport.show = true;
		perf.renders.length = 0;
		await new Promise<void>((resolve) => {
			requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
		});
		const passes = perf.renders.map((pass: any) => ({
			calls: pass.calls,
			triangles: pass.triangles,
			meshes: pass.meshes,
			depthMeshes: pass.depthMeshes,
			target: pass.target,
		}));
		return {
			gpu,
			contact: passes.filter((pass: any) => pass.depthMeshes >= 8).length,
			color: passes.some(
				(pass: any) => pass.target === null && pass.triangles === 96,
			),
			passes,
		};
	});
	expect(result.gpu.toLowerCase(), result.gpu).not.toContain("swiftshader");
	expect(result.color, JSON.stringify(result.passes)).toBe(true);
	expect(result.contact, JSON.stringify(result.passes)).toBe(0);
});

test("SS-10384 scene update does not compile shaders synchronously", async ({
	page,
}) => {
	await open(page);
	const syncCompile = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		perf.viewport.update();
		let syncCompile = 0;
		const compile = perf.renderer.compile.bind(perf.renderer);
		perf.renderer.compile = (...args: any[]) => {
			syncCompile++;
			return compile(...args);
		};
		const material = new SDV.MaterialStandardData({
			color: "#44aaff",
			side: SDV.MATERIAL_SIDE.FRONT,
		});
		perf.addBoxes(4, material);
		syncCompile = 0;
		perf.viewport.update();
		return syncCompile;
	});
	expect(syncCompile).toBe(0);
});

test("SS-10385 blending 0 returns before the PCSS kernel", async ({page}) => {
	await open(page);
	const source = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: true, softShadows: true});
		perf.addBoxes(
			1,
			new SDV.MaterialStandardData({
				color: "#dddddd",
				side: SDV.MATERIAL_SIDE.FRONT,
			}),
		);
		perf.viewport.update();
		perf.viewport.show = true;
		await new Promise<void>((resolve) => {
			requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
		});
		const gl = perf.gl;
		const programs = perf.renderer.info.programs ?? [];
		const sources = programs.map(
			(program: any) => gl.getShaderSource(program.fragmentShader) ?? "",
		);
		return (
			sources.find((item: string) => item.includes("getPCSSShadow")) ?? ""
		);
	});
	expect(source.length).toBeGreaterThan(0);
	const guard = source.search(
		/if\s*\(\s*blending\s*==\s*0\.0\s*\)\s*return\s+pcfShadow\s*;/,
	);
	const call = source.lastIndexOf("getPCSSShadow(");
	expect(guard).toBeGreaterThan(-1);
	expect(guard).toBeLessThan(call);
});

test.describe("SS-10386 drawing buffer is capped in physical pixels", () => {
	test.use({viewport: {width: 1280, height: 720}, deviceScaleFactor: 2});

	test("1280x720 at device pixel ratio 2 stays inside 1920x1080", async ({
		page,
	}) => {
		await open(page);
		const size = await page.evaluate(async () => {
			const perf = (window as any).__perf;
			const SDV = (window as any).SDV;
			await perf.create({shadows: false});
			perf.addBoxes(
				1,
				new SDV.MaterialStandardData({
					color: "#888888",
					side: SDV.MATERIAL_SIDE.FRONT,
				}),
			);
			perf.viewport.update();
			perf.viewport.show = true;
			await new Promise<void>((resolve) => {
				requestAnimationFrame(() =>
					requestAnimationFrame(() => resolve()),
				);
			});
			const canvas = perf.renderer.domElement as HTMLCanvasElement;
			const cssWidth = canvas.parentElement!.clientWidth;
			const cssHeight = canvas.parentElement!.clientHeight;
			const ratio = window.devicePixelRatio;
			const maxWidth = 1920;
			const maxHeight = 1080;
			let width = cssWidth * ratio;
			let height = cssHeight * ratio;
			if (width > maxWidth || height > maxHeight) {
				const aspect = cssWidth / cssHeight;
				if ((width - maxWidth) / aspect > height - maxHeight) {
					width = maxWidth;
					height = maxWidth / aspect;
				} else {
					height = maxHeight;
					width = maxHeight * aspect;
				}
			}
			return {
				buffer: [canvas.width, canvas.height],
				expected: [Math.floor(width), Math.floor(height)],
				css: [cssWidth, cssHeight],
				ratio,
			};
		});
		expect(size.ratio).toBe(2);
		expect(size.css).toEqual([1280, 720]);
		expect(size.buffer).toEqual(size.expected);
		expect(size.buffer).toEqual([1920, 1080]);
	});
});

test.describe("SS-10386 device pixel ratio 1 is unchanged", () => {
	test.use({viewport: {width: 800, height: 600}, deviceScaleFactor: 1});

	test("800x600 stays 800x600", async ({page}) => {
		await open(page);
		const size = await page.evaluate(async () => {
			const perf = (window as any).__perf;
			const SDV = (window as any).SDV;
			await perf.create({shadows: false});
			perf.addBoxes(
				1,
				new SDV.MaterialStandardData({
					color: "#888888",
					side: SDV.MATERIAL_SIDE.FRONT,
				}),
			);
			perf.viewport.update();
			perf.viewport.show = true;
			await new Promise<void>((resolve) => {
				requestAnimationFrame(() =>
					requestAnimationFrame(() => resolve()),
				);
			});
			const canvas = perf.renderer.domElement as HTMLCanvasElement;
			return {
				buffer: [canvas.width, canvas.height],
				css: [
					canvas.parentElement!.clientWidth,
					canvas.parentElement!.clientHeight,
				],
			};
		});
		expect(size.css).toEqual([800, 600]);
		expect(size.buffer).toEqual([800, 600]);
	});
});

test("SS-10387 camera start and beauty activation do not dirty materials", async ({
	page,
}) => {
	await open(page);
	await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({
			shadows: true,
			softShadows: true,
			beautyDelay: 0,
			beautyDuration: 80,
		});
		perf.addBoxes(
			1,
			new SDV.MaterialStandardData({
				color: "#99aabb",
				side: SDV.MATERIAL_SIDE.FRONT,
			}),
		);
		perf.viewport.update();
		perf.viewport.show = true;
		await new Promise<void>((resolve) => {
			SDV.addListener(
				SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
				() => resolve(),
			);
		});
		let flips = 0;
		perf.renderer.domElement.ownerDocument.defaultView;
		const seen = new Set<any>();
		const trap = (material: any) => {
			if (!material || seen.has(material)) return;
			seen.add(material);
			let value = material.needsUpdate;
			Object.defineProperty(material, "needsUpdate", {
				configurable: true,
				get: () => value,
				set: (next: boolean) => {
					if (next === true && value !== true) flips++;
					value = next;
				},
			});
		};
		const root = SDV.sceneTree.root;
		root.traverse((node: any) => {
			const converted = node.convertedObject[perf.viewport.id];
			converted?.traverse?.((object: any) => {
				const materials = Array.isArray(object.material)
					? object.material
					: [object.material];
				materials.forEach(trap);
			});
		});
		(window as any).__perfFlips = () => flips;
		(window as any).__beauty = () =>
			new Promise<void>((resolve) => {
				SDV.addListener(
					SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED,
					() => resolve(),
				);
			});
	});
	const before = await page.evaluate(() => (window as any).__perfFlips());
	const finished = page.evaluate(() => (window as any).__beauty());
	await page.mouse.move(200, 200);
	await page.mouse.down();
	await page.mouse.move(280, 240);
	await page.mouse.up();
	await finished;
	const afterGesture = await page.evaluate(() =>
		(window as any).__perfFlips(),
	);
	expect(afterGesture - before).toBe(0);
	const afterShadow = await page.evaluate(() => {
		const beforeToggle = (window as any).__perfFlips();
		(window as any).__perf.viewport.shadows = false;
		return (window as any).__perfFlips() - beforeToggle;
	});
	expect(afterShadow).toBeGreaterThan(0);
});

test("SS-10388 omitted side is front, stored double stays double", async ({
	page,
}) => {
	await open(page);
	const sides = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		const created = new SDV.MaterialStandardData({});
		const explicit = new SDV.MaterialStandardData({
			side: SDV.MATERIAL_SIDE.DOUBLE,
		});
		await perf.create({shadows: false});
		const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
		const indices = new Uint16Array([0, 1, 2]);
		const bytes = new Uint8Array(44);
		bytes.set(new Uint8Array(positions.buffer), 0);
		bytes.set(new Uint8Array(indices.buffer), 36);
		let binary = "";
		for (let i = 0; i < bytes.length; i++)
			binary += String.fromCharCode(bytes[i]);
		const gltf = {
			asset: {version: "2.0"},
			scene: 0,
			scenes: [{nodes: [0, 1]}],
			nodes: [
				{name: "omitted", mesh: 0},
				{name: "doubled", mesh: 1, translation: [2, 0, 0]},
			],
			meshes: [
				{
					primitives: [
						{attributes: {POSITION: 0}, indices: 1, material: 0},
					],
				},
				{
					primitives: [
						{attributes: {POSITION: 0}, indices: 1, material: 1},
					],
				},
			],
			materials: [
				{pbrMetallicRoughness: {baseColorFactor: [1, 0, 0, 1]}},
				{
					doubleSided: true,
					pbrMetallicRoughness: {baseColorFactor: [0, 1, 0, 1]},
				},
			],
			accessors: [
				{
					bufferView: 0,
					componentType: 5126,
					count: 3,
					type: "VEC3",
					min: [0, 0, 0],
					max: [1, 1, 0],
				},
				{bufferView: 1, componentType: 5123, count: 3, type: "SCALAR"},
			],
			bufferViews: [
				{buffer: 0, byteOffset: 0, byteLength: 36},
				{buffer: 0, byteOffset: 36, byteLength: 6},
			],
			buffers: [
				{
					uri: `data:application/octet-stream;base64,${btoa(binary)}`,
					byteLength: bytes.length,
				},
			],
		};
		const blob = new Blob([JSON.stringify(gltf)], {
			type: "model/gltf+json",
		});
		const href = URL.createObjectURL(blob);
		const node = await SDV.DataEngine.instance.loadContent({
			format: "gltf",
			href,
		});
		SDV.sceneTree.addNode(node);
		SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
		const found: {omitted?: number; doubled?: number} = {};
		SDV.sceneTree.root.traverse((treeNode: any) => {
			const converted = treeNode.convertedObject[perf.viewport.id];
			converted?.traverse?.((object: any) => {
				if (!object.isMesh) return;
				if (treeNode.name === "omitted")
					found.omitted = object.material.side;
				if (treeNode.name === "doubled")
					found.doubled = object.material.side;
			});
		});
		return {
			created: created.side,
			explicit: explicit.side,
			front: SDV.MATERIAL_SIDE.FRONT,
			double: SDV.MATERIAL_SIDE.DOUBLE,
			rendered: found,
		};
	});
	expect(sides.created, JSON.stringify(sides)).toBe(sides.front);
	expect(sides.explicit).toBe(sides.double);
	expect(sides.rendered.omitted).toBe(0);
	expect(sides.rendered.doubled).toBe(2);
});

test("SS-10389 drawing buffer is not preserved and the screenshot still has the model", async ({
	page,
}) => {
	await open(page);
	const shot = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const geometry = perf.boxGeometry([-4, -4, -0.2], [4, 4, 0.2]);
		geometry.material = new SDV.MaterialUnlitData({color: "#ff0000"});
		const node = new SDV.TreeNode("red");
		node.addData(geometry);
		SDV.sceneTree.root.addChild(node);
		SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
		perf.viewport.show = true;
		await perf.viewport.camera.set([0, 0, 8], [0, 0, 0], {duration: 0});
		await new Promise<void>((resolve) => {
			requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
		});
		const url = perf.viewport.getScreenshot();
		const bitmap = await createImageBitmap(await (await fetch(url)).blob());
		const canvas = document.createElement("canvas");
		canvas.width = bitmap.width;
		canvas.height = bitmap.height;
		const context = canvas.getContext("2d")!;
		context.drawImage(bitmap, 0, 0);
		const pixel = context.getImageData(
			Math.floor(bitmap.width / 2),
			Math.floor(bitmap.height / 2),
			1,
			1,
		).data;
		return {
			preserve: perf.gl.getContextAttributes().preserveDrawingBuffer,
			prefix: url.slice(0, 22),
			pixel: [pixel[0], pixel[1], pixel[2]],
		};
	});
	expect(shot.prefix).toBe("data:image/png;base64,");
	expect(shot.pixel[0], JSON.stringify(shot.pixel)).toBeGreaterThan(200);
	expect(shot.pixel[1], JSON.stringify(shot.pixel)).toBeLessThan(40);
	expect(shot.pixel[2], JSON.stringify(shot.pixel)).toBeLessThan(40);
	expect(shot.preserve).toBe(false);
});

test("SS-10390 one material is one draw", async ({page}) => {
	await open(page);
	const draw = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const material = new SDV.MaterialStandardData({
			color: "#66cc88",
			side: SDV.MATERIAL_SIDE.FRONT,
		});
		const count = 16;
		perf.addBoxes(count, material);
		perf.viewport.update();
		perf.viewport.show = true;
		perf.renders.length = 0;
		await new Promise<void>((resolve) => {
			requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
		});
		const triangles = count * 12;
		const pass = perf.renders.find(
			(item: any) => item.target === null && item.triangles === triangles,
		);
		return {
			calls: pass?.calls ?? null,
			passes: perf.renders.map((item: any) => ({
				calls: item.calls,
				triangles: item.triangles,
				target: item.target,
			})),
		};
	});
	expect(draw.calls, JSON.stringify(draw.passes)).toBe(1);
});

test("SS-10390 a parent transform moves a batched child", async ({page}) => {
	await open(page);
	const moved = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const material = new SDV.MaterialStandardData({
			color: "#66cc88",
			side: SDV.MATERIAL_SIDE.FRONT,
		});
		const anchor = perf.boxGeometry([-0.4, -0.4, 0], [0.4, 0.4, 0.8]);
		anchor.material = material;
		const anchorNode = new SDV.TreeNode("anchor");
		anchorNode.addData(anchor);
		const childGeometry = perf.boxGeometry(
			[-0.4, -0.4, 2],
			[0.4, 0.4, 2.8],
		);
		childGeometry.material = material;
		const child = new SDV.TreeNode("child");
		child.addData(childGeometry);
		const parent = new SDV.TreeNode("parent");
		parent.addChild(child);
		SDV.sceneTree.root.addChild(anchorNode);
		SDV.sceneTree.root.addChild(parent);
		SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
		const mesh = childGeometry.convertedObject[perf.viewport.id];
		const batch = mesh?.userData?.batchedMesh;
		const read = () => {
			const elements = new Float32Array(16);
			batch.getMatrixAt(mesh.userData.batchId, {
				elements,
				fromArray(array: ArrayLike<number>, offset = 0) {
					for (let i = 0; i < 16; i++) elements[i] = array[i + offset];
					return this;
				},
			});
			return elements[12];
		};
		const before = read();
		const matrix = new Float32Array([
			1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 4, 0, 0, 1,
		]);
		parent.addTransformation({id: "shift", matrix});
		perf.viewport.updateNodeTransformation(parent);
		return {before, after: read(), batched: Boolean(batch)};
	});
	expect(moved.batched).toBe(true);
	expect(moved.after).toBeCloseTo(moved.before + 4, 4);
});

test("SS-10390 a batched triangle is one ray hit", async ({page}) => {
	await open(page);
	const hit = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const material = new SDV.MaterialStandardData({
			color: "#66cc88",
			side: SDV.MATERIAL_SIDE.FRONT,
		});
		const triangle = (name: string, x: number) => {
			const positions = new Float32Array([
				x, 0, 0, x + 1, 0, 0, x, 1, 0,
			]);
			const indices = new Uint16Array([0, 1, 2]);
			const geometry = new SDV.GeometryData(
				new SDV.PrimitiveData(
					{
						POSITION: new SDV.AttributeData(
							positions,
							3,
							12,
							0,
							4,
							false,
							positions.length,
						),
					},
					new SDV.AttributeData(
						indices,
						1,
						2,
						0,
						2,
						false,
						indices.length,
					),
				),
				SDV.PRIMITIVE_MODE.TRIANGLES,
			);
			geometry.material = material;
			const node = new SDV.TreeNode(name);
			node.addData(geometry);
			SDV.sceneTree.root.addChild(node);
			return geometry;
		};
		const first = triangle("near", 0);
		triangle("far", 3);
		SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
		const mesh = first.convertedObject[perf.viewport.id];
		const hits = perf.viewport.raytraceScene([0.2, 0.2, 1], [0, 0, -1]);
		return {
			batched: Boolean(mesh?.userData?.batchedMesh),
			count: hits.length,
			name: hits[0]?.node?.name ?? null,
		};
	});
	expect(hit.batched).toBe(true);
	expect(hit.count).toBe(1);
	expect(hit.name).toBe("near");
});

test("SS-10390 a mirrored node stays out of the batch", async ({page}) => {
	await open(page);
	const mirrored = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const material = new SDV.MaterialStandardData({
			color: "#66cc88",
			side: SDV.MATERIAL_SIDE.FRONT,
		});
		const plain = perf.boxGeometry([-0.4, -0.4, 0], [0.4, 0.4, 0.8]);
		plain.material = material;
		const plainNode = new SDV.TreeNode("plain");
		plainNode.addData(plain);
		const childGeometry = perf.boxGeometry(
			[-0.4, -0.4, 2],
			[0.4, 0.4, 2.8],
		);
		childGeometry.material = material;
		const child = new SDV.TreeNode("child");
		child.addData(childGeometry);
		const parent = new SDV.TreeNode("parent");
		parent.addChild(child);
		SDV.sceneTree.root.addChild(plainNode);
		SDV.sceneTree.root.addChild(parent);
		SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
		const matrix = new Float32Array([
			-1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
		]);
		parent.addTransformation({id: "mirror", matrix});
		perf.viewport.updateNodeTransformation(parent);
		const childMesh = childGeometry.convertedObject[perf.viewport.id];
		const plainMesh = plain.convertedObject[perf.viewport.id];
		return {
			childBatched: Boolean(childMesh?.userData?.batchedMesh),
			childVisible: childMesh?.visible === true,
			plainBatched: Boolean(plainMesh?.userData?.batchedMesh),
		};
	});
	expect(mirrored.childBatched).toBe(false);
	expect(mirrored.childVisible).toBe(true);
	expect(mirrored.plainBatched).toBe(true);
});

test("SS-10390 a batched material keeps the shadow hook", async ({page}) => {
	await open(page);
	const shader = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		const errors: string[] = [];
		const report = console.error;
		console.error = (...args: unknown[]) => {
			errors.push(args.map((arg) => String(arg)).join(" "));
			report.apply(console, args);
		};
		await perf.create({shadows: true, softShadows: true});
		perf.addBoxes(
			2,
			new SDV.MaterialStandardData({
				color: "#66cc88",
				side: SDV.MATERIAL_SIDE.FRONT,
			}),
		);
		perf.viewport.update();
		perf.viewport.show = true;
		await new Promise<void>((resolve) => {
			requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
		});
		const node = SDV.sceneTree.root.children.find(
			(child: {name: string}) => child.name === "box0",
		);
		const mesh = node?.data[0]?.convertedObject[perf.viewport.id];
		const batch = mesh?.userData?.batchedMesh;
		const uniforms = batch?.material?.userData?.shader?.uniforms;
		console.error = report;
		return {
			lightSizeUV: Boolean(uniforms?.lightSizeUV),
			blending: Boolean(uniforms?.blending),
			errors: errors.filter((line) => /shader|lightSizeUV|compile/i.test(line)),
		};
	});
	expect(shader.lightSizeUV, JSON.stringify(shader)).toBe(true);
	expect(shader.blending, JSON.stringify(shader)).toBe(true);
	expect(shader.errors, JSON.stringify(shader.errors)).toEqual([]);
});

test("SS-10390 a default color change leaves an authored batch alone", async ({
	page,
}) => {
	await open(page);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const material = new SDV.MaterialStandardData({
			color: "#66cc88",
			metalness: 0.2,
			roughness: 0.15,
			side: SDV.MATERIAL_SIDE.FRONT,
		});
		perf.addBoxes(2, material);
		perf.viewport.update();
		perf.viewport.defaultMaterialColor = "#ff0000";
		const node = SDV.sceneTree.root.children.find(
			(child: {name: string}) => child.name === "box0",
		);
		const mesh = node?.data[0]?.convertedObject[perf.viewport.id];
		const batch = mesh?.userData?.batchedMesh;
		return {
			r: batch?.material?.color?.r ?? null,
			g: batch?.material?.color?.g ?? null,
			b: batch?.material?.color?.b ?? null,
			metalness: batch?.material?.metalness ?? null,
			roughness: batch?.material?.roughness ?? null,
		};
	});
	expect(result.r, JSON.stringify(result)).toBeCloseTo(1, 5);
	expect(result.g, JSON.stringify(result)).toBeCloseTo(1, 5);
	expect(result.b, JSON.stringify(result)).toBeCloseTo(1, 5);
	expect(result.metalness, JSON.stringify(result)).toBeCloseTo(0.2, 5);
	expect(result.roughness, JSON.stringify(result)).toBeCloseTo(0.15, 5);
});

test("SS-10390 a default color change keeps the batch white and updates its tint", async ({
	page,
}) => {
	await open(page);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const geometry = perf.boxGeometry([-0.4, -0.4, 0], [0.4, 0.4, 0.8]);
		const node = new SDV.TreeNode("plain");
		node.addData(geometry);
		const other = perf.boxGeometry([-0.4, -0.4, 2], [0.4, 0.4, 2.8]);
		const otherNode = new SDV.TreeNode("other");
		otherNode.addData(other);
		SDV.sceneTree.root.addChild(node);
		SDV.sceneTree.root.addChild(otherNode);
		SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
		perf.viewport.defaultMaterialColor = "#ff0000";
		const mesh = geometry.convertedObject[perf.viewport.id];
		const batch = mesh?.userData?.batchedMesh;
		const tint = {r: 0, g: 0, b: 0};
		batch.getColorAt(mesh.userData.batchId, {
			setRGB(r: number, g: number, b: number) {
				tint.r = r;
				tint.g = g;
				tint.b = b;
				return this;
			},
			fromArray(array: ArrayLike<number>, offset = 0) {
				tint.r = array[offset];
				tint.g = array[offset + 1];
				tint.b = array[offset + 2];
				return this;
			},
		});
		return {
			batch: [
				batch?.material?.color?.r,
				batch?.material?.color?.g,
				batch?.material?.color?.b,
			],
			tint,
			source: [
				mesh?.material?.color?.r,
				mesh?.material?.color?.g,
				mesh?.material?.color?.b,
			],
		};
	});
	expect(result.batch[0], JSON.stringify(result)).toBeCloseTo(1, 5);
	expect(result.batch[1], JSON.stringify(result)).toBeCloseTo(1, 5);
	expect(result.batch[2], JSON.stringify(result)).toBeCloseTo(1, 5);
	expect(result.tint.r, JSON.stringify(result)).toBeCloseTo(result.source[0], 4);
	expect(result.tint.g, JSON.stringify(result)).toBeCloseTo(result.source[1], 4);
	expect(result.tint.b, JSON.stringify(result)).toBeCloseTo(result.source[2], 4);
});

test("SS-10390 a pulsed member does not supply the batch shader", async ({
	page,
}) => {
	await open(page);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: true, softShadows: true});
		const material = new SDV.MaterialStandardData({
			color: "#66cc88",
			side: SDV.MATERIAL_SIDE.FRONT,
		});
		perf.addBoxes(2, material);
		perf.viewport.update();
		perf.viewport.show = true;
		await new Promise<void>((resolve) => {
			requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
		});
		const boxes = ["box0", "box1"].map((name) =>
			SDV.sceneTree.root.children.find(
				(child: {name: string}) => child.name === name,
			),
		);
		const geometry = boxes[0].data[0];
		geometry.effectPulses.push({
			effect: {type: "pulse", color: "#00ff78"},
			token: "pulse",
		});
		geometry.updateVersion();
		perf.viewport.update();
		await new Promise<void>((resolve) => {
			requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
		});
		const pulsed = geometry.convertedObject[perf.viewport.id];
		const other = boxes[1].data[0].convertedObject[perf.viewport.id];
		const batch = other?.userData?.batchedMesh;
		return {
			pulsedVisible: pulsed?.visible === true,
			pulsedBatched: Boolean(pulsed?.userData?.batchedMesh),
			otherBatched: Boolean(batch),
			blending: batch?.material?.userData?.shader?.uniforms?.blending?.value ?? null,
		};
	});
	expect(result.pulsedVisible, JSON.stringify(result)).toBe(true);
	expect(result.pulsedBatched, JSON.stringify(result)).toBe(false);
	expect(result.otherBatched, JSON.stringify(result)).toBe(true);
	expect(result.blending, JSON.stringify(result)).toBeGreaterThan(0);
});

test("SS-10390 reusing geometry after a batch does not throw", async ({
	page,
}) => {
	await open(page);
	const reused = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const material = new SDV.MaterialStandardData({
			color: "#66cc88",
			side: SDV.MATERIAL_SIDE.FRONT,
		});
		const geometry = perf.boxGeometry([-0.4, -0.4, 0], [0.4, 0.4, 0.8]);
		geometry.material = material;
		const first = new SDV.TreeNode("first");
		first.addData(geometry);
		SDV.sceneTree.root.addChild(first);
		SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
		const second = new SDV.TreeNode("second");
		second.addData(geometry);
		SDV.sceneTree.root.addChild(second);
		SDV.sceneTree.root.updateVersion();
		let thrown: string | null = null;
		try {
			perf.viewport.update();
		} catch (error) {
			thrown = String(error);
		}
		const mesh = geometry.convertedObject[perf.viewport.id];
		return {
			thrown,
			batched: Boolean(mesh?.userData?.batchedMesh),
			secondMesh: Boolean(
				second.convertedObject[perf.viewport.id]?.children?.length,
			),
		};
	});
	expect(reused.thrown).toBeNull();
	expect(reused.batched).toBe(true);
	expect(reused.secondMesh).toBe(true);
});

test("SS-10397", async ({page}) => {
	await open(page);
	const sortObjects = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		await perf.create({shadows: false});
		return perf.renderer.sortObjects;
	});
	expect(sortObjects).toBe(true);
});

test("SS-10390 color variants stay one draw and a ray hits that box", async ({
	page,
}) => {
	await open(page);
	const draw = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const green = new SDV.MaterialUnlitData({color: "#66cc88"});
		const blue = new SDV.MaterialUnlitData({color: "#3366cc"});
		perf.addBoxes(8, green);
		for (let i = 0; i < 8; i++) {
			const geometry = perf.boxGeometry(
				[1.2, -0.4, i * 1.2],
				[2, 0.4, i * 1.2 + 0.8],
			);
			geometry.material = blue;
			const node = new SDV.TreeNode(`blue${i}`);
			node.addData(geometry);
			SDV.sceneTree.root.addChild(node);
		}
		SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
		perf.viewport.show = true;
		perf.renders.length = 0;
		await new Promise<void>((resolve) => {
			requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
		});
		const pass = perf.renders.find(
			(item: any) => item.target === null && item.triangles === 192,
		);
		const hits = perf.viewport.raytraceScene([0, 0, -1], [0, 0, 1]);
		const centerPixel = async (eye: number[], target: number[]) => {
			await perf.viewport.camera.set(eye, target, {duration: 0});
			await new Promise<void>((resolve) => {
				requestAnimationFrame(() =>
					requestAnimationFrame(() => resolve()),
				);
			});
			const url = perf.viewport.getScreenshot();
			const bitmap = await createImageBitmap(
				await (await fetch(url)).blob(),
			);
			const canvas = document.createElement("canvas");
			canvas.width = bitmap.width;
			canvas.height = bitmap.height;
			const context = canvas.getContext("2d")!;
			context.drawImage(bitmap, 0, 0);
			const pixel = context.getImageData(
				Math.floor(bitmap.width / 2),
				Math.floor(bitmap.height / 2),
				1,
				1,
			).data;
			return [pixel[0], pixel[1], pixel[2]];
		};
		const greenPixel = await centerPixel([0, 0, 4], [0, 0, 0.4]);
		const bluePixel = await centerPixel([1.6, 0, 4], [1.6, 0, 0.4]);
		return {
			calls: pass?.calls ?? null,
			hit: hits[0]?.node?.name ?? null,
			greenPixel,
			bluePixel,
			passes: perf.renders.map((item: any) => ({
				calls: item.calls,
				triangles: item.triangles,
				target: item.target,
			})),
		};
	});
	expect(draw.calls, JSON.stringify(draw.passes)).toBe(1);
	expect(draw.hit).toBe("box0");
	expect(draw.greenPixel[1], JSON.stringify(draw.greenPixel)).toBeGreaterThan(
		draw.greenPixel[0],
	);
	expect(draw.greenPixel[1], JSON.stringify(draw.greenPixel)).toBeGreaterThan(
		draw.greenPixel[2],
	);
	expect(draw.bluePixel[2], JSON.stringify(draw.bluePixel)).toBeGreaterThan(
		draw.bluePixel[0],
	);
	expect(draw.bluePixel[2], JSON.stringify(draw.bluePixel)).toBeGreaterThan(
		draw.bluePixel[1],
	);
});

test("SS-10390 hiding one box keeps the batch and drops its triangles", async ({
	page,
}) => {
	await open(page);
	const draw = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const material = new SDV.MaterialStandardData({
			color: "#66cc88",
			side: SDV.MATERIAL_SIDE.FRONT,
		});
		perf.addBoxes(16, material);
		const hidden = SDV.sceneTree.root.children.find(
			(node: any) => node.name === "box0",
		);
		hidden.visible = false;
		SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
		perf.viewport.show = true;
		perf.renders.length = 0;
		await new Promise<void>((resolve) => {
			requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
		});
		const pass = perf.renders.find(
			(item: any) => item.target === null && item.triangles === 180,
		);
		return {
			calls: pass?.calls ?? null,
			passes: perf.renders.map((item: any) => ({
				calls: item.calls,
				triangles: item.triangles,
				target: item.target,
			})),
		};
	});
	expect(draw.calls, JSON.stringify(draw.passes)).toBe(1);
});

test("SS-10390 a morph target stays its own draw", async ({page}) => {
	await open(page);
	const draw = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const material = new SDV.MaterialStandardData({
			color: "#66cc88",
			side: SDV.MATERIAL_SIDE.FRONT,
		});
		perf.addBoxes(16, material);
		const morph = perf.boxGeometry([-0.4, -0.4, 0.85], [0.4, 0.4, 1.15]);
		morph.material = material;
		morph.morphWeights = [0];
		const node = new SDV.TreeNode("morph");
		node.addData(morph);
		SDV.sceneTree.root.addChild(node);
		SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
		perf.viewport.show = true;
		perf.renders.length = 0;
		await new Promise<void>((resolve) => {
			requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
		});
		const pass = perf.renders.find(
			(item: any) => item.target === null && item.triangles === 204,
		);
		return {
			calls: pass?.calls ?? null,
			passes: perf.renders.map((item: any) => ({
				calls: item.calls,
				triangles: item.triangles,
				target: item.target,
			})),
		};
	});
	expect(draw.calls, JSON.stringify(draw.passes)).toBe(2);
});

test("SS-10391 reused primitives share one position buffer", async ({page}) => {
	await open(page);
	const shared = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const first = perf.boxGeometry([-0.5, -0.5, 0], [0.5, 0.5, 1]);
		const material = new SDV.MaterialStandardData({
			color: "#888888",
			side: SDV.MATERIAL_SIDE.FRONT,
		});
		first.material = material;
		// Same primitive id, so the geometry cache is hit for the second use.
		const second = new SDV.GeometryData(
			first.primitive,
			SDV.PRIMITIVE_MODE.TRIANGLES,
		);
		second.material = material;
		for (const geometry of [first, second]) {
			const node = new SDV.TreeNode(
				geometry === first ? "first" : "second",
			);
			node.addData(geometry);
			SDV.sceneTree.root.addChild(node);
		}
		SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
		const buffers: any[] = [];
		for (const geometry of [first, second]) {
			const mesh = geometry.convertedObject[perf.viewport.id];
			const attribute = mesh?.geometry?.attributes?.position;
			if (attribute) buffers.push(attribute.array.buffer);
		}
		return {meshes: buffers.length, buffers: new Set(buffers).size};
	});
	expect(shared.meshes).toBe(2);
	expect(shared.buffers).toBe(1);
});

test("SS-10391 removing one mesh keeps the shared geometry", async ({page}) => {
	await open(page);
	const shared = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const first = perf.boxGeometry([-0.5, -0.5, 0], [0.5, 0.5, 1]);
		const material = new SDV.MaterialStandardData({
			color: "#888888",
			side: SDV.MATERIAL_SIDE.FRONT,
		});
		first.material = material;
		const second = new SDV.GeometryData(
			first.primitive,
			SDV.PRIMITIVE_MODE.TRIANGLES,
		);
		second.material = material;
		const firstNode = new SDV.TreeNode("first");
		firstNode.addData(first);
		const secondNode = new SDV.TreeNode("second");
		secondNode.addData(second);
		SDV.sceneTree.root.addChild(firstNode);
		SDV.sceneTree.root.addChild(secondNode);
		SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
		const kept = second.convertedObject[perf.viewport.id];
		const buffer = kept?.geometry?.attributes?.position?.array?.buffer;
		SDV.sceneTree.root.removeChild(firstNode);
		SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
		const after = second.convertedObject[perf.viewport.id];
		const position = after?.geometry?.attributes?.position;
		return {
			alive: position?.array?.buffer === buffer,
			count: position?.count ?? 0,
		};
	});
	expect(shared.alive).toBe(true);
	expect(shared.count).toBeGreaterThan(0);
});

test("SS-10391 a triangle strip clones before rewriting the index", async ({
	page,
}) => {
	await open(page);
	const shared = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const positions = new Float32Array([
			0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0,
		]);
		const indices = new Uint16Array([0, 1, 2, 3]);
		const primitive = new SDV.PrimitiveData(
			{
				POSITION: new SDV.AttributeData(
					positions,
					3,
					12,
					0,
					4,
					false,
					positions.length,
				),
			},
			new SDV.AttributeData(indices, 1, 2, 0, 2, false, indices.length),
		);
		const material = new SDV.MaterialStandardData({
			color: "#888888",
			side: SDV.MATERIAL_SIDE.FRONT,
		});
		const triangles = new SDV.GeometryData(
			primitive,
			SDV.PRIMITIVE_MODE.TRIANGLES,
		);
		triangles.material = material;
		const strip = new SDV.GeometryData(
			primitive,
			SDV.PRIMITIVE_MODE.TRIANGLE_STRIP,
		);
		strip.material = material;
		for (const geometry of [triangles, strip]) {
			const node = new SDV.TreeNode(
				geometry === triangles ? "triangles" : "strip",
			);
			node.addData(geometry);
			SDV.sceneTree.root.addChild(node);
		}
		SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
		const triangleMesh = triangles.convertedObject[perf.viewport.id];
		const stripMesh = strip.convertedObject[perf.viewport.id];
		return {
			triangleIndex: triangleMesh?.geometry?.getIndex()?.count ?? 0,
			stripIndex: stripMesh?.geometry?.getIndex()?.count ?? 0,
			sameGeometry: triangleMesh?.geometry === stripMesh?.geometry,
		};
	});
	expect(shared.triangleIndex).toBe(4);
	expect(shared.stripIndex).toBe(6);
	expect(shared.sameGeometry).toBe(false);
});

test("SS-10391 gems that share a primitive keep the tight sphere", async ({
	page,
}) => {
	await open(page);
	const gems = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const positions = new Float32Array([
			0, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 0, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 0,
			0.5, 0.5, 1,
		]);
		const indices = new Uint16Array([
			4, 0, 2, 4, 2, 1, 4, 1, 3, 4, 3, 0, 5, 2, 0, 5, 1, 2, 5, 3, 1, 5,
			0, 3,
		]);
		const primitive = new SDV.PrimitiveData(
			{
				POSITION: new SDV.AttributeData(
					positions,
					3,
					12,
					0,
					4,
					false,
					positions.length,
				),
			},
			new SDV.AttributeData(indices, 1, 2, 0, 2, false, indices.length),
		);
		const firstMaterial = new SDV.MaterialGemData({color: "#88ccff"});
		const secondMaterial = new SDV.MaterialGemData({color: "#88ccff"});
		const first = new SDV.GeometryData(
			primitive,
			SDV.PRIMITIVE_MODE.TRIANGLES,
		);
		first.material = firstMaterial;
		const second = new SDV.GeometryData(
			primitive,
			SDV.PRIMITIVE_MODE.TRIANGLES,
		);
		second.material = secondMaterial;
		for (const geometry of [first, second]) {
			const node = new SDV.TreeNode(geometry === first ? "gem-a" : "gem-b");
			node.addData(geometry);
			SDV.sceneTree.root.addChild(node);
		}
		SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
		const mesh = first.convertedObject[perf.viewport.id];
		return {
			first: firstMaterial.radius,
			second: secondMaterial.radius,
			shared: mesh?.geometry?.boundingSphere?.radius ?? null,
		};
	});
	expect(gems.first).toBeCloseTo(gems.second, 5);
	expect(gems.shared).not.toBeNull();
	expect(gems.first).toBeLessThan((gems.shared as number) - 0.05);
});

test("SS-10392 the beauty blend renders 16 frames across 1500ms", async ({
	page,
}) => {
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

test("SS-10393 a ray hits the known triangle through a BVH", async ({page}) => {
	await open(page);
	const hit = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
		const indices = new Uint16Array([0, 1, 2]);
		const geometry = new SDV.GeometryData(
			new SDV.PrimitiveData(
				{
					POSITION: new SDV.AttributeData(
						positions,
						3,
						12,
						0,
						4,
						false,
						positions.length,
					),
				},
				new SDV.AttributeData(
					indices,
					1,
					2,
					0,
					2,
					false,
					indices.length,
				),
			),
			SDV.PRIMITIVE_MODE.TRIANGLES,
		);
		geometry.material = new SDV.MaterialUnlitData({color: "#00ff00"});
		const node = new SDV.TreeNode("triangle");
		node.addData(geometry);
		SDV.sceneTree.root.addChild(node);
		SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
		const hits = perf.viewport.raytraceScene([0.2, 0.2, 1], [0, 0, -1]);
		let boundsTree = false;
		const converted = node.convertedObject[perf.viewport.id];
		converted?.traverse?.((object: any) => {
			if (object.isMesh && object.geometry?.boundsTree) boundsTree = true;
		});
		return {
			count: hits.length,
			distance: hits[0]?.distance ?? null,
			boundsTree,
		};
	});
	expect(hit.count).toBe(1);
	expect(hit.distance).toBeCloseTo(1, 4);
	expect(hit.boundsTree).toBe(true);
});

test("SS-10394 a leaf change does not read unchanged sibling leaves", async ({
	page,
}) => {
	await open(page);
	const reads = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const root = new SDV.TreeNode("perfRoot");
		SDV.sceneTree.root.addChild(root);
		const unchanged = new SDV.TreeNode("unchanged", root);
		const unchangedLeaves = [];
		for (let i = 0; i < 16; i++)
			unchangedLeaves.push(new SDV.TreeNode(`u${i}`, unchanged));
		const changed = new SDV.TreeNode("changed", root);
		const leaf = new SDV.TreeNode("leaf", changed);
		root.updateVersion();
		perf.viewport.update();
		const proto = Object.getPrototypeOf(leaf);
		const descriptor = Object.getOwnPropertyDescriptor(proto, "version")!;
		const seen = new Set<string>();
		Object.defineProperty(proto, "version", {
			configurable: true,
			get() {
				seen.add(this.id);
				return descriptor.get!.call(this);
			},
			set(value: string) {
				descriptor.set!.call(this, value);
			},
		});
		seen.clear();
		leaf.updateVersion();
		seen.clear();
		perf.viewport.update();
		return {
			changedLeaf: seen.has(leaf.id),
			unchangedLeaves: unchangedLeaves.filter((node) => seen.has(node.id))
				.length,
		};
	});
	expect(reads.changedLeaf).toBe(true);
	expect(reads.unchangedLeaves).toBe(0);
});

test("SS-10395 a default standard material is MeshStandardMaterial", async ({
	page,
}) => {
	await open(page);
	const types = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const plain = new SDV.MaterialStandardData({
			color: "#777777",
			side: SDV.MATERIAL_SIDE.FRONT,
		});
		const coated = new SDV.MaterialStandardData({
			color: "#777777",
			side: SDV.MATERIAL_SIDE.FRONT,
			clearcoat: 0.5,
		});
		const plainGeometry = perf.boxGeometry([-0.5, -0.5, 0], [0.5, 0.5, 1]);
		plainGeometry.material = plain;
		const coatedGeometry = perf.boxGeometry([-0.5, -0.5, 2], [0.5, 0.5, 3]);
		coatedGeometry.material = coated;
		const plainNode = new SDV.TreeNode("plain");
		plainNode.addData(plainGeometry);
		const coatedNode = new SDV.TreeNode("coated");
		coatedNode.addData(coatedGeometry);
		SDV.sceneTree.root.addChild(plainNode);
		SDV.sceneTree.root.addChild(coatedNode);
		SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
		const typeOf = (node: any) => {
			let found = "";
			const converted = node.convertedObject[perf.viewport.id];
			converted?.traverse?.((object: any) => {
				if (object.isMesh) found = object.material.type;
			});
			return found;
		};
		return {plain: typeOf(plainNode), coated: typeOf(coatedNode)};
	});
	expect(types.plain).toBe("MeshStandardMaterial");
	expect(types.coated).toBe("MeshPhysicalMaterial");
});

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
