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

test("modern mode with the flag defines only the analytic DFG", () => {
	const {loader, source} = setup();
	loader.assignEnvironmentMapPbrMode(ENVIRONMENT_MAP_PBR_MODE.MODERN);
	loader.assignEnvironmentMapAnalyticDfg(true);
	const defines = definesOf(source);
	expect(defines).toHaveProperty("SDV_ANALYTIC_DFG");
	expect(defines).not.toHaveProperty("SDV_LEGACY_DFG_APPROX");
	expect(defines).not.toHaveProperty(ENVIRONMENT_MAP_PBR_MODE.LEGACY);
});

test("modern mode without the flag defines neither", () => {
	const {loader, source} = setup();
	loader.assignEnvironmentMapPbrMode(ENVIRONMENT_MAP_PBR_MODE.MODERN);
	loader.assignEnvironmentMapAnalyticDfg(true);
	loader.assignEnvironmentMapAnalyticDfg(false);
	const defines = definesOf(source);
	expect(defines).not.toHaveProperty("SDV_ANALYTIC_DFG");
	expect(defines).not.toHaveProperty("SDV_LEGACY_DFG_APPROX");
});

test("legacy mode without the flag keeps the legacy defines only", () => {
	const {loader, source} = setup();
	loader.assignEnvironmentMapAnalyticDfg(false);
	loader.assignEnvironmentMapPbrMode(ENVIRONMENT_MAP_PBR_MODE.LEGACY);
	const defines = definesOf(source);
	expect(defines).toHaveProperty("SDV_LEGACY_DFG_APPROX");
	expect(defines).toHaveProperty(ENVIRONMENT_MAP_PBR_MODE.LEGACY);
	expect(defines).not.toHaveProperty("SDV_ANALYTIC_DFG");
});

test("the patched shader chunk switches the DFG term on the analytic define", () => {
	adaptShaders();
	const chunk = THREE.ShaderChunk.lights_physical_pars_fragment;
	expect(chunk).toContain(
		"#if defined( SDV_LEGACY_DFG_APPROX ) || defined( SDV_ANALYTIC_DFG )",
	);
	// the DFGApprox definition and the two lookups
	expect(
		chunk.split("defined( SDV_ANALYTIC_DFG )").length - 1,
	).toBeGreaterThanOrEqual(3);
});
