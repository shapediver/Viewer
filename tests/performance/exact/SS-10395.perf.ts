/**
 * SS-10395: a standard material is drawn with three.js `MeshStandardMaterial`
 * unless a physical feature (clearcoat, sheen, transmission, an ior other
 * than 1.5, a specular intensity other than 1, a specular colour other than
 * white, a specular map) changes the picture.
 */
import {expect} from "@playwright/test";
import {open, test} from "./harness";

/** Installs `window.__ss10395` with the helpers of these tests. */
function installHelpers() {
	const perf = (window as any).__perf;
	const SDV = (window as any).SDV;
	/** the three.js material type of the first mesh of a node */
	const typeOf = (node: any) => {
		let found = "";
		const converted = node.convertedObject[perf.viewport.id];
		converted?.traverse?.((object: any) => {
			if (object.isMesh && !found) {
				const material = Array.isArray(object.material)
					? object.material[0]
					: object.material;
				found = material.type;
			}
		});
		return found;
	};
	/** the three.js material of the first mesh of a node */
	const materialOf = (node: any) => {
		let found: any = null;
		node.convertedObject[perf.viewport.id]?.traverse?.((object: any) => {
			if (object.isMesh && !found)
				found = Array.isArray(object.material)
					? object.material[0]
					: object.material;
		});
		return found;
	};
	const addBox = (name: string, material: any, offset = 0) => {
		const geometry = perf.boxGeometry(
			[-0.5 + offset, -0.5, 0],
			[0.5 + offset, 0.5, 1],
		);
		if (material) geometry.material = material;
		const node = new SDV.TreeNode(name);
		node.addData(geometry);
		SDV.sceneTree.root.addChild(node);
		SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
		return node;
	};
	/** pixels of a lossless screenshot (drawn and read in one call) */
	const pixels = async (): Promise<Uint8ClampedArray> => {
		const url = perf.viewport.getScreenshot("image/png");
		const image = new Image();
		image.src = url;
		await image.decode();
		const canvas = document.createElement("canvas");
		canvas.width = image.width;
		canvas.height = image.height;
		const context = canvas.getContext("2d")!;
		context.drawImage(image, 0, 0);
		return context.getImageData(0, 0, image.width, image.height).data;
	};
	(window as any).__ss10395 = {typeOf, materialOf, addBox, pixels};
}

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

test("SS-10395 the standard material draws the same picture as the physical one", async ({
	page,
}) => {
	await open(page);
	await page.evaluate(installHelpers);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		const h = (window as any).__ss10395;
		await perf.create({shadows: false});
		perf.viewport.show = true;
		perf.viewport.camera.position = [2.5, -3, 2.5];
		perf.viewport.camera.target = [0, 0, 0.5];
		const pairs: any[] = [];
		for (const extra of [
			{},
			{transparent: true, opacity: 0.5, side: SDV.MATERIAL_SIDE.DOUBLE},
		]) {
			const base = {
				color: "#777777",
				roughness: 0.4,
				metalness: 0.3,
				...extra,
			};
			const node = h.addBox("box", new SDV.MaterialStandardData(base));
			await perf.nextFrame();
			const standardType = h.typeOf(node);
			const standard = await h.pixels();
			// the same reflectance through the physical class
			node.data[0].material = new SDV.MaterialStandardData({
				...base,
				ior: 1.5000001,
			});
			node.data[0].updateVersion();
			node.updateVersion();
			perf.viewport.update();
			await perf.nextFrame();
			const physicalType = h.typeOf(node);
			const physical = await h.pixels();
			let maxDiff = 0;
			let lit = 0;
			for (let i = 0; i < standard.length; i += 4) {
				for (let c = 0; c < 3; c++)
					maxDiff = Math.max(
						maxDiff,
						Math.abs(standard[i + c] - physical[i + c]),
					);
				if (Math.abs(standard[i] - 0x10) > 10) lit++;
			}
			pairs.push({standardType, physicalType, maxDiff, lit});
			SDV.sceneTree.root.removeChild(node);
			SDV.sceneTree.root.updateVersion();
			perf.viewport.update();
		}
		return pairs;
	});
	for (const pair of result) {
		expect(pair.standardType).toBe("MeshStandardMaterial");
		expect(pair.physicalType).toBe("MeshPhysicalMaterial");
		expect(pair.lit).toBeGreaterThan(0);
		expect(pair.maxDiff).toBeLessThanOrEqual(1);
	}
});

test("SS-10395 a runtime change of a physical feature switches the class both ways", async ({
	page,
}) => {
	await open(page);
	await page.evaluate(installHelpers);
	const steps = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		const h = (window as any).__ss10395;
		await perf.create({shadows: false});
		const material = new SDV.MaterialStandardData({
			color: "#336699",
			roughness: 0.35,
		});
		const node = h.addBox("box", material);
		const steps: any[] = [];
		const read = (label: string) => {
			const three = h.materialOf(node);
			steps.push({
				label,
				type: three.type,
				color: three.color.getHexString(),
				roughness: three.roughness,
			});
		};
		// a material edit as the ViewerExamples apply it
		const apply = () => {
			node.data[0].updateVersion();
			material.updateVersion();
			node.updateVersion();
			perf.viewport.update();
		};
		read("plain");
		for (const [key, on, off] of [
			["clearcoat", 0.5, 0],
			["ior", 1.45, 1.5],
			["specularIntensity", 0.5, 1],
		] as const) {
			material[key] = on;
			apply();
			read(`${key} on`);
			material[key] = off;
			apply();
			read(`${key} off`);
		}
		// the colour as three.js holds it for the data colour
		const expected = h.materialOf(node).color.getHexString();
		return {steps, expected};
	});
	for (const step of steps.steps) {
		expect(step.type, step.label).toBe(
			step.label.endsWith(" on")
				? "MeshPhysicalMaterial"
				: "MeshStandardMaterial",
		);
		expect(step.color, step.label).toBe(steps.expected);
		expect(step.roughness, step.label).toBe(0.35);
	}
});

test("SS-10395 inputs three.js does not use without their feature keep the standard class", async ({
	page,
}) => {
	await open(page);
	await page.evaluate(installHelpers);
	const types = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		const h = (window as any).__ss10395;
		await perf.create({shadows: false});
		const ignored = h.addBox(
			"ignored",
			new SDV.MaterialStandardData({
				color: "#777777",
				clearcoat: 0,
				clearcoatRoughness: 0.3,
				thickness: 1,
				transmission: 0,
				attenuationDistance: 2,
				sheen: 0,
				sheenRoughness: 0.5,
			}),
		);
		return {ignored: h.typeOf(ignored)};
	});
	expect(types.ignored).toBe("MeshStandardMaterial");
});

test("SS-10395 the default material follows the rule, also in a batch", async ({
	page,
}) => {
	await open(page);
	await page.evaluate(installHelpers);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		const h = (window as any).__ss10395;
		await perf.create({shadows: false});
		perf.viewport.show = true;
		// three boxes without a material: a static batch of the default
		const nodes = [0, 1, 2].map((i) => h.addBox(`box${i}`, null, i * 2));
		await perf.nextFrame();
		const scene = perf.viewport.threeJsCoreObjects.scene;
		/** types of what is drawn: the batch, or the meshes */
		const drawn = () => {
			const types = new Set<string>();
			scene.traverse((object: any) => {
				if (!object.isMesh) return;
				let visible = true;
				for (let o = object; o; o = o.parent)
					if (!o.visible) visible = false;
				if (!visible) return;
				const material = Array.isArray(object.material)
					? object.material[0]
					: object.material;
				if (material.type?.startsWith("MeshStandard"))
					types.add(
						`${object.isBatchedMesh ? "batch" : "mesh"}:${material.type}`,
					);
				if (material.type?.startsWith("MeshPhysical"))
					types.add(
						`${object.isBatchedMesh ? "batch" : "mesh"}:${material.type}`,
					);
			});
			return [...types].sort();
		};
		const steps: any[] = [];
		const read = (label: string) =>
			steps.push({label, node: h.typeOf(nodes[0]), drawn: drawn()});
		read("plain");
		perf.viewport.updateDefaultMaterial(
			new SDV.MaterialStandardData({clearcoat: 0.5}),
		);
		await perf.nextFrame();
		read("coated");
		perf.viewport.updateDefaultMaterial(
			new SDV.MaterialStandardData({color: "#aa5500"}),
		);
		await perf.nextFrame();
		read("plain again");
		return steps;
	});
	const [plain, coated, plainAgain] = result;
	expect(plain.node).toBe("MeshStandardMaterial");
	expect(coated.node).toBe("MeshPhysicalMaterial");
	expect(plainAgain.node).toBe("MeshStandardMaterial");
	for (const step of [plain, plainAgain])
		for (const entry of step.drawn)
			expect(entry, step.label).toMatch(/:MeshStandardMaterial$/);
	for (const entry of coated.drawn)
		expect(entry, coated.label).toMatch(/:MeshPhysicalMaterial$/);
	// the boxes are drawn as a static batch in every step
	for (const step of result)
		expect(
			step.drawn.some((entry: string) => entry.startsWith("batch:")),
			JSON.stringify(step),
		).toBe(true);
});

test("SS-10395 a standard material keeps the environment map type define", async ({
	page,
}) => {
	await open(page);
	await page.evaluate(installHelpers);
	const defines = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		const h = (window as any).__ss10395;
		await perf.create({shadows: false});
		const node = h.addBox(
			"box",
			new SDV.MaterialStandardData({color: "#777777", metalness: 1}),
		);
		const material = h.materialOf(node);
		return {
			type: material.type,
			keys: Object.keys(material.defines ?? {}),
		};
	});
	expect(defines.type).toBe("MeshStandardMaterial");
	expect(defines.keys.some((key) => key.startsWith("ENVMAP_TYPE_"))).toBe(
		true,
	);
});

test("SS-10395 a transparent standard material stays out of the ambient occlusion normal pass", async ({
	page,
}) => {
	await open(page);
	await page.evaluate(installHelpers);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		const h = (window as any).__ss10395;
		await perf.create({shadows: false});
		perf.viewport.show = true;
		perf.viewport.camera.position = [2.5, -3, 2.5];
		perf.viewport.camera.target = [0, 0, 0.5];
		perf.viewport.postProcessing.addEffect({
			type: SDV.POST_PROCESSING_EFFECT_TYPE.SSAO,
		});
		const glassNode = h.addBox(
			"glass",
			new SDV.MaterialStandardData({color: "#9fc4d6", opacity: 0.4}),
		);
		const opaqueNode = h.addBox(
			"opaque",
			new SDV.MaterialStandardData({color: "#777777"}),
			2,
		);
		await perf.nextFrame();
		const glass = h.materialOf(glassNode);
		/** the mesh of a node and the materials it is drawn with */
		const meshOf = (node: any) => {
			let found: any = null;
			node.convertedObject[perf.viewport.id]?.traverse?.((o: any) => {
				if (o.isMesh && !found) found = o;
			});
			return {
				mesh: found,
				// a back and front pair is an array material
				materials: Array.isArray(found.material)
					? [...found.material]
					: [found.material],
			};
		};
		const boxes = {glass: meshOf(glassNode), opaque: meshOf(opaqueNode)};
		// per box: draws with its own material (colour pass) and with
		// another one (the normal pass draws with an override material)
		const counts = {
			glass: {own: 0, other: 0},
			opaque: {own: 0, other: 0},
		};
		const renderer = perf.renderer;
		const direct = renderer.renderBufferDirect;
		renderer.renderBufferDirect = (...args: any[]) => {
			const [, , , drawn, object] = args;
			for (const key of ["glass", "opaque"] as const) {
				if (object !== boxes[key].mesh) continue;
				const own = boxes[key].materials.includes(drawn);
				counts[key][own ? "own" : "other"]++;
			}
			return direct.apply(renderer, args);
		};
		perf.viewport.camera.position = [2.6, -3, 2.5];
		perf.viewport.render();
		await perf.nextFrame();
		renderer.renderBufferDirect = direct;
		return {glassType: glass.type, counts};
	});
	expect(result.glassType).toBe("MeshStandardMaterial");
	const detail = JSON.stringify(result.counts);
	// the normal pass ran and drew the opaque box
	expect(result.counts.opaque.other, detail).toBeGreaterThan(0);
	// the glass box is drawn in the colour pass, never in the normal pass
	expect(result.counts.glass.own, detail).toBeGreaterThan(0);
	expect(result.counts.glass.other, detail).toBe(0);
});
