import {expect, test} from "@playwright/test";
import {ENVIRONMENT_MAP_PBR_MODE} from "@shapediver/viewer.shared.types";
import * as THREE from "three";
import {
	adaptShaders,
	MaterialLoader,
} from "../../rendering-engine/rendering-engine-threejs/src/loaders/MaterialLoader";

/** A loader with one cached material, as `load` would leave it. */
function setup() {
	const loader = new MaterialLoader({} as any);
	const source = new THREE.MeshPhysicalMaterial({});
	source.userData.cacheKey = "source";
	(loader as any)._materialCache["source"] = {
		material: source,
		materialData: null,
	};
	return {loader, source};
}

const definesOf = (material: THREE.Material): {[key: string]: string} =>
	(material as THREE.MeshStandardMaterial & {defines: {[k: string]: string}})
		.defines || {};

test("the irradiance is mirrored by default (legacy orientation)", () => {
	const {loader, source} = setup();
	loader.assignEnvironmentMapPbrMode(ENVIRONMENT_MAP_PBR_MODE.MODERN);
	expect(definesOf(source)).not.toHaveProperty("SDV_IRRADIANCE_NO_MIRROR");
});

test("the mirror is dropped and restored on the cached materials", () => {
	const {loader, source} = setup();
	loader.assignEnvironmentMapIrradianceMirror(false);
	expect(definesOf(source)).toHaveProperty("SDV_IRRADIANCE_NO_MIRROR");
	loader.assignEnvironmentMapIrradianceMirror(true);
	expect(definesOf(source)).not.toHaveProperty("SDV_IRRADIANCE_NO_MIRROR");
});

test("the dropped mirror survives a change of the PBR mode", () => {
	const {loader, source} = setup();
	loader.assignEnvironmentMapIrradianceMirror(false);
	for (const mode of Object.values(ENVIRONMENT_MAP_PBR_MODE)) {
		loader.assignEnvironmentMapPbrMode(mode);
		expect(definesOf(source)).toHaveProperty("SDV_IRRADIANCE_NO_MIRROR");
	}
});

test("a tracked clone (GPU instancing) gets the define back after copy reset it", () => {
	const {loader, source} = setup();
	loader.assignEnvironmentMapIrradianceMirror(false);
	const clone = source.clone();
	expect(definesOf(clone)).not.toHaveProperty("SDV_IRRADIANCE_NO_MIRROR");
	loader.trackMaterial("gpu-instance/test", clone);
	expect(definesOf(clone)).toHaveProperty("SDV_IRRADIANCE_NO_MIRROR");
	loader.assignEnvironmentMapIrradianceMirror(true);
	expect(definesOf(clone)).not.toHaveProperty("SDV_IRRADIANCE_NO_MIRROR");
});

test("the patched irradiance lookup mirrors only without the define", () => {
	adaptShaders();
	const chunk = THREE.ShaderChunk.envmap_physical_pars_fragment;
	const unmirrored =
		"vec4 envMapColor = textureCubeUV( envMap, rotatedReflectVec, 1.0 );";
	const mirrored =
		"vec4 envMapColor = textureCubeUV( envMap, vec3(-rotatedReflectVec.x, rotatedReflectVec.y, rotatedReflectVec.z), 1.0 );";
	const define = chunk.indexOf("#ifdef SDV_IRRADIANCE_NO_MIRROR");
	expect(define).toBeGreaterThan(-1);
	expect(chunk.indexOf(unmirrored)).toBeGreaterThan(define);
	expect(chunk.indexOf(mirrored)).toBeGreaterThan(chunk.indexOf(unmirrored));
	// the radiance lookup is not mirrored in either orientation
	expect(chunk).toContain(
		"vec4 envMapColor = textureCubeUV( envMap, vec3(rotatedReflectVec.x, rotatedReflectVec.y, rotatedReflectVec.z), roughness );",
	);
});
