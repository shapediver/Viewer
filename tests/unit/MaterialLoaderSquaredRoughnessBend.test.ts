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
		.defines;

test("modern mode with the flag defines only the squared roughness bend", () => {
	const {loader, source} = setup();
	loader.assignEnvironmentMapPbrMode(ENVIRONMENT_MAP_PBR_MODE.MODERN);
	loader.assignEnvironmentMapSquaredRoughnessBend(true);
	const defines = definesOf(source);
	expect(defines).toHaveProperty("SDV_SQUARED_ROUGHNESS_BEND");
	expect(defines).not.toHaveProperty(ENVIRONMENT_MAP_PBR_MODE.LEGACY);
	expect(defines).not.toHaveProperty("SDV_LEGACY_DFG_APPROX");
	expect(defines).not.toHaveProperty("SDV_ANALYTIC_DFG");
});

test("the flag survives a change of the PBR mode and can be turned off", () => {
	const {loader, source} = setup();
	loader.assignEnvironmentMapSquaredRoughnessBend(true);
	loader.assignEnvironmentMapPbrMode(ENVIRONMENT_MAP_PBR_MODE.MODERN);
	expect(definesOf(source)).toHaveProperty("SDV_SQUARED_ROUGHNESS_BEND");
	loader.assignEnvironmentMapSquaredRoughnessBend(false);
	expect(definesOf(source)).not.toHaveProperty("SDV_SQUARED_ROUGHNESS_BEND");
});

test("without the flag neither mode defines it", () => {
	for (const mode of Object.values(ENVIRONMENT_MAP_PBR_MODE)) {
		const {loader, source} = setup();
		loader.assignEnvironmentMapPbrMode(mode);
		expect(definesOf(source)).not.toHaveProperty(
			"SDV_SQUARED_ROUGHNESS_BEND",
		);
	}
});

test("the patched shader chunk bends by roughness² on the legacy or the bend define", () => {
	adaptShaders();
	const chunk = THREE.ShaderChunk.envmap_physical_pars_fragment;
	expect(chunk).toContain(
		`#if defined( ${ENVIRONMENT_MAP_PBR_MODE.LEGACY} ) || defined( SDV_SQUARED_ROUGHNESS_BEND )`,
	);
	expect(chunk).toContain(
		"float sdvEnvironmentMapPbrMix = roughness * roughness;",
	);
	expect(chunk).toContain(
		"float sdvEnvironmentMapPbrMix = roughness * roughness * roughness * roughness;",
	);
	// three.js' own bend is replaced, not kept next to ours
	expect(chunk).not.toContain("pow4( roughness )");
});
