import {expect, test} from "@playwright/test";
import {MaterialStandardData, Tree} from "@shapediver/viewer.shared.node-tree";
import * as THREE from "three";
import {
	MaterialLoader,
	needsPhysicalMaterial,
} from "../../rendering-engine/rendering-engine-threejs/src/loaders/MaterialLoader";

const map = {} as any;

test("a standard material at the defaults is drawn standard", () => {
	expect(needsPhysicalMaterial(new MaterialStandardData())).toBe(false);
	expect(
		needsPhysicalMaterial(
			new MaterialStandardData({
				color: "#777777",
				roughness: 0.4,
				metalness: 0.2,
			}),
		),
	).toBe(false);
});

test("each physical feature alone makes the material physical", () => {
	const cases: Record<string, unknown>[] = [
		{clearcoat: 0.01},
		{sheen: 0.01},
		{transmission: 0.01},
		{ior: 1.45},
		{ior: 1.5000001},
		{specularIntensity: 0.99},
		{specularColor: "#fefefe"},
		{specularIntensityMap: map},
		{specularColorMap: map},
	];
	for (const properties of cases) {
		const data = new MaterialStandardData(properties as any);
		expect(needsPhysicalMaterial(data), JSON.stringify(properties)).toBe(
			true,
		);
	}
});

test("inputs three.js ignores without their feature keep the material standard", () => {
	const cases: Record<string, unknown>[] = [
		{clearcoatMap: map, clearcoatNormalMap: map, clearcoatRoughness: 0.3},
		{sheenColor: "#ff0000", sheenRoughness: 0.2, sheenColorMap: map},
		{transmissionMap: map, thickness: 1, thicknessMap: map},
		{attenuationDistance: 2, attenuationColor: "#00ff00"},
		{specularColor: "#ffffff"},
		{specularColor: "#FFFFFF"},
		{specularColor: [255, 255, 255]},
	];
	for (const properties of cases) {
		const data = new MaterialStandardData(properties as any);
		expect(needsPhysicalMaterial(data), JSON.stringify(properties)).toBe(
			false,
		);
	}
});

const engine = {
	createThreeJsColor: (color: string) => new THREE.Color(color),
	environmentMapForUnlitMaterials: false,
	materialBatchManager: {syncBatchColors: () => {}},
};

/** A loader with one cached default-material entry, as `load` would leave it. */
function setup(material: THREE.MeshStandardMaterial) {
	const loader = new MaterialLoader(engine as any);
	material.userData.cacheKey = "default";
	(loader as any)._materialCache["default"] = {
		material,
		materialData: null,
	};
	return loader;
}

test("a default material that crosses the rule is rebuilt with the other class", () => {
	for (const [material, data] of [
		[
			new THREE.MeshStandardMaterial(),
			new MaterialStandardData({clearcoat: 0.5}),
		],
		[new THREE.MeshPhysicalMaterial(), new MaterialStandardData()],
	] as const) {
		const loader = setup(material);
		let disposed = 0;
		material.addEventListener("dispose", () => disposed++);
		const version = Tree.instance.root.version;
		loader.defaultMaterialData = data;
		expect((loader as any)._materialCache).toEqual({});
		expect(disposed).toBe(1);
		expect(Tree.instance.root.version).not.toBe(version);
		// the mesh that shows it loads its material again
		expect(loader.isDropped(material)).toBe(true);
	}
});

test("a default material of the fitting class is copied in place and keeps its batch hook", () => {
	const material = new THREE.MeshStandardMaterial({color: "#ff0000"});
	const hook = () => {};
	material.onBeforeCompile = hook;
	material.userData.materialBatch = true;
	const loader = setup(material);
	const version = Tree.instance.root.version;
	loader.defaultMaterialData = new MaterialStandardData({
		color: "#00ff00",
		roughness: 0.25,
	});
	expect((loader as any)._materialCache["default"].material).toBe(material);
	expect(material.type).toBe("MeshStandardMaterial");
	expect(material.roughness).toBe(0.25);
	// a batch keeps a white color, the tint is per instance
	expect(material.color.getHexString()).toBe("ffffff");
	expect(material.onBeforeCompile).toBe(hook);
	expect(Tree.instance.root.version).toBe(version);
	expect(loader.isDropped(material)).toBe(false);

	const physical = new THREE.MeshPhysicalMaterial();
	const other = setup(physical);
	other.defaultMaterialData = new MaterialStandardData({clearcoat: 0.5});
	expect((other as any)._materialCache["default"].material).toBe(physical);
	expect(physical.clearcoat).toBe(0.5);
});

test("a default material copied in place keeps its cache key, so a later class change still reloads it", () => {
	const material = new THREE.MeshStandardMaterial();
	const loader = setup(material);
	loader.defaultMaterialData = new MaterialStandardData({roughness: 0.3});
	expect(material.userData.cacheKey).toBe("default");
	loader.defaultMaterialData = new MaterialStandardData({clearcoat: 0.5});
	expect(loader.isDropped(material)).toBe(true);
});

test("a GPU instance material of the other class is copied in place, not dropped", () => {
	const loader = new MaterialLoader(engine as any);
	const material = new THREE.MeshPhysicalMaterial({clearcoat: 0.5});
	loader.trackMaterial("gpu-instance/group", material);
	const version = Tree.instance.root.version;
	loader.defaultMaterialData = new MaterialStandardData({roughness: 0.2});
	const entry = (loader as any)._materialCache["gpu-instance/group"];
	expect(entry.material).toBe(material);
	expect(material.roughness).toBe(0.2);
	// physical with the three.js defaults: the picture of the plain default
	expect(material.clearcoat).toBe(0);
	expect(loader.isDropped(material)).toBe(false);
	expect(Tree.instance.root.version).toBe(version);
});

test("a copy of a dropped default material counts as dropped until it is loaded again", () => {
	const material = new THREE.MeshStandardMaterial();
	const loader = setup(material);
	loader.defaultMaterialData = new MaterialStandardData({clearcoat: 0.5});
	const pulse = material.clone();
	expect(loader.isDropped(pulse)).toBe(true);
	(loader as any)._materialCache["default"] = {
		material: new THREE.MeshPhysicalMaterial(),
		materialData: null,
	};
	expect(loader.isDropped(pulse)).toBe(false);
});

test("under the gem override a plain default material stays physical", () => {
	const loader = setup(new THREE.MeshStandardMaterial());
	(loader as any)._materialOverrideType = "gem";
	loader.defaultMaterialData = new MaterialStandardData();
	expect((loader as any)._materialCache).toEqual({});
});
