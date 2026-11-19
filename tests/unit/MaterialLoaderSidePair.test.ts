import {expect, test} from "@playwright/test";
import * as THREE from "three";
import {MaterialLoader} from "../../rendering-engine/rendering-engine-threejs/src/loaders/MaterialLoader";

/** A loader with one cached material, as `load` would leave it. */
function setup(
	parameters: THREE.MeshPhysicalMaterialParameters,
	engine: object = {},
) {
	const loader = new MaterialLoader(engine as any);
	const source = new THREE.MeshPhysicalMaterial(parameters);
	source.userData.cacheKey = "source";
	(loader as any)._materialCache["source"] = {
		material: source,
		materialData: null,
	};
	return {loader, source};
}

const glass = {
	transparent: true,
	opacity: 0.35,
	side: THREE.DoubleSide,
	depthWrite: true,
};

test("a transparent double-sided material becomes a back and front pair", () => {
	const {loader, source} = setup(glass);
	const shown = loader.renderMaterialFor(source) as THREE.Material[];
	expect(Array.isArray(shown)).toBe(true);
	expect(shown.map((m) => m.side)).toEqual([THREE.BackSide, THREE.FrontSide]);
	for (const m of shown) {
		expect(m).not.toBe(source);
		expect(m.opacity).toBe(0.35);
		expect(m.transparent).toBe(true);
		expect(m.depthWrite).toBe(true);
	}
	// the source keeps its side, it is only the cache key of the pair
	expect(source.side).toBe(THREE.DoubleSide);
	expect(loader.sourceMaterialOf(shown)).toBe(source);
	expect(loader.sourceMaterialOf(source)).toBe(source);
});

test("the pair is cached, counted once and reached by cache updates", () => {
	const {loader, source} = setup(glass);
	const first = loader.renderMaterialFor(source) as THREE.Material[];
	const second = loader.renderMaterialFor(source) as THREE.Material[];
	expect(second[0]).toBe(first[0]);
	expect(second[1]).toBe(first[1]);
	expect(loader.cacheSize()).toBe(1);
	const versions = first.map((m) => m.version);
	loader.updateMaterials();
	expect(first.map((m) => m.version)).toEqual(versions.map((v) => v + 1));
});

test("the pair gets its own compile hook that keeps the shader for soft shadows", () => {
	const {loader, source} = setup(glass);
	const [back, front] = loader.renderMaterialFor(source) as THREE.Material[];
	expect(back.onBeforeCompile).not.toBe(front.onBeforeCompile);
	const shader = {
		uniforms: {},
		vertexShader: "",
		fragmentShader: "",
	} as unknown as THREE.WebGLProgramParametersWithUniforms;
	(loader as any).patchScreenSpaceAmbientOcclusion = () => {};
	back.onBeforeCompile(shader, {} as THREE.WebGLRenderer);
	expect(back.userData.shader).toBe(shader);
	expect(front.userData.shader).toBeUndefined();
	loader.updateSoftShadow(0.5, 0.25);
	expect((shader.uniforms as any).lightSizeUV.value).toBe(0.5);
	expect((shader.uniforms as any).blending.value).toBe(0.25);
});

test("materials that need the two passes of the renderer stay as they are", () => {
	for (const parameters of [
		{...glass, opacity: 1, transparent: false},
		{...glass, side: THREE.FrontSide},
		{...glass, depthWrite: false},
		{...glass, transmission: 0.5},
		{...glass, forceSinglePass: true},
	]) {
		const {loader, source} = setup(parameters);
		expect(loader.renderMaterialFor(source)).toBe(source);
	}
	// a material the loader does not cache is not paired
	const loader = new MaterialLoader({} as any);
	const stray = new THREE.MeshPhysicalMaterial(glass);
	expect(loader.renderMaterialFor(stray)).toBe(stray);
});

test("removing the source removes and disposes the pair", () => {
	const {loader, source} = setup(glass);
	const shown = loader.renderMaterialFor(source) as THREE.Material[];
	let disposed = 0;
	for (const m of shown) m.addEventListener("dispose", () => disposed++);
	loader.removeFromMaterialCache("source");
	expect(disposed).toBeGreaterThanOrEqual(2);
	expect((loader as any)._materialCache).toEqual({});
	// a new material under the same key gets a new pair
	const {source: next, loader: other} = setup(glass);
	expect(other.renderMaterialFor(next)).not.toEqual(shown);
});

test("the default material update keeps the side of each pair material", () => {
	const {loader, source} = setup(glass, {
		createThreeJsColor: (color: string) => new THREE.Color(color),
		environmentMapForUnlitMaterials: false,
		materialBatchManager: {syncBatchColors: () => {}},
	});
	const [back, front] = loader.renderMaterialFor(source) as THREE.Material[];
	// the in-place copy of assignDefaultMaterial replaces the side
	back.side = THREE.DoubleSide;
	front.side = THREE.DoubleSide;
	(loader as any)._materialCache["source"].materialData = null;
	loader.assignDefaultMaterial();
	expect(back.side).toBe(THREE.BackSide);
	expect(front.side).toBe(THREE.FrontSide);
});
