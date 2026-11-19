import {test as base, type Page} from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import {isSoftwareRenderer} from "../budgets/harness";

/**
 * Exact checks for SS-10382–SS-10397.
 *
 * Each test encodes the result the ticket asks for. Tests for open tickets
 * are marked `test.fail` with the ticket key; the PR of that ticket removes
 * the marker.
 *
 * Nothing here asserts a millisecond or a frame rate. Docker is the wrong
 * tool for that: a containerized Chrome is SwiftShader, and this viewer
 * disables shadows on SwiftShader, so the shadow tests would not run the
 * code under test. Counts, pixel sizes, and object identity are the same
 * on every machine that has a real GPU.
 */

export const ASSET_HOST = "https://perf-assets.viewertests.invalid";
const assetDirs = [
	path.join(__dirname, "../assets"),
	path.join(__dirname, "../../instancing/assets"),
];

export const test = base.extend({
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

export function installApi() {
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
	let canvasFrames = 0;

	// SS-10384: the first frame after a scene update waits until the
	// parallel shader compile is done, which can take more than two
	// animation frames. Wait for that frame, then one more.
	async function nextFrame(limit = 300) {
		const start = canvasFrames;
		const frame = () =>
			new Promise<void>((resolve) =>
				requestAnimationFrame(() => resolve()),
			);
		for (let i = 0; i < limit && canvasFrames === start; i++) await frame();
		await frame();
	}

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
			if (!target) canvasFrames++;
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
		nextFrame,
		renders,
		renderers,
	};
}

export {isSoftwareRenderer};

/**
 * Skip a test that needs a hardware GPU. Call it first in the test body, before
 * `test.fail`, so that on SwiftShader the skip wins and the test cannot pass
 * for the wrong reason. Run it on SwiftShader with `PERF_RENDERER=swiftshader`.
 */
export async function skipOnSoftwareRenderer(page: Page, reason: string) {
	test.skip(await isSoftwareRenderer(page), `GPU only: ${reason}`);
}

export async function open(page: Page) {
	await page.goto("/index.html");
	await page.waitForFunction(() => Boolean((window as any).SDV));
	await page.evaluate(installApi);
}

/**
 * 8 branches with 8 boxes each below one node. `updated()` returns the names
 * of the nodes whose converted object was updated since the last call.
 */
export function installBranches() {
	const perf = (window as any).__perf;
	const SDV = (window as any).SDV;
	perf.branches = () => {
		const material = new SDV.MaterialStandardData({
			color: "#66cc88",
			side: SDV.MATERIAL_SIDE.FRONT,
		});
		const top = new SDV.TreeNode("top");
		const branches: any[] = [];
		const leaves: any[][] = [];
		for (let i = 0; i < 8; i++) {
			const branch = new SDV.TreeNode(`b${i}`, top);
			branches.push(branch);
			leaves.push([]);
			for (let j = 0; j < 8; j++) {
				const geometry = perf.boxGeometry(
					[i * 2, j * 2, 0],
					[i * 2 + 1, j * 2 + 1, 1],
				);
				geometry.material = material;
				const leaf = new SDV.TreeNode(`b${i}l${j}`, branch);
				leaf.addData(geometry);
				leaves[i].push(leaf);
			}
		}
		SDV.sceneTree.root.addChild(top);
		SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
		const nodes = [top, ...branches, ...leaves.flat()];
		const seen: string[] = [];
		const watch = (node: any) => {
			const object = node.convertedObject[perf.viewport.id];
			if (!object || object.__watched) return;
			object.__watched = true;
			const original = object.applyTransformation.bind(object);
			object.applyTransformation = (matrix: any) => {
				seen.push(node.name);
				return original(matrix);
			};
		};
		nodes.forEach(watch);
		const updated = () => seen.splice(0, seen.length).sort();
		const maxX = (node: any) =>
			node.boundingBoxViewport[perf.viewport.id].max[0];
		const worldX = (node: any) => {
			const mesh = node.data[0].convertedObject[perf.viewport.id];
			const batch = mesh.userData.batchedMesh;
			if (!batch) {
				mesh.updateWorldMatrix(true, false);
				return mesh.matrixWorld.elements[12];
			}
			const elements = new Float32Array(16);
			batch.getMatrixAt(mesh.userData.batchId, {
				elements,
				fromArray(array: ArrayLike<number>, offset = 0) {
					for (let i = 0; i < 16; i++)
						elements[i] = array[i + offset];
					return this;
				},
			});
			return elements[12];
		};
		const shift = (x: number) => ({
			id: "shift",
			matrix: new Float32Array([
				1,
				0,
				0,
				0,
				0,
				1,
				0,
				0,
				0,
				0,
				1,
				0,
				x,
				0,
				0,
				1,
			]),
		});
		return {
			top,
			branches,
			leaves,
			nodes,
			updated,
			watch,
			maxX,
			worldX,
			shift,
		};
	};
}
