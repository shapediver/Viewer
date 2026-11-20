import {expect} from "@playwright/test";
import {open, skipOnSoftwareRenderer, test} from "./harness";

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
		await perf.nextFrame();
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
					for (let i = 0; i < 16; i++)
						elements[i] = array[i + offset];
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
			const positions = new Float32Array([x, 0, 0, x + 1, 0, 0, x, 1, 0]);
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

test("SS-10390 un-mirroring a node returns it to the batch once", async ({
	page,
}) => {
	await open(page);
	const restored = await page.evaluate(async () => {
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
		const mirror = {
			id: "mirror",
			matrix: new Float32Array([
				-1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
			]),
		};
		parent.addTransformation(mirror);
		perf.viewport.updateNodeTransformation(parent);
		parent.removeTransformation(mirror);
		perf.viewport.updateNodeTransformation(parent);
		perf.viewport.show = true;
		perf.renders.length = 0;
		await perf.nextFrame();
		const childMesh = childGeometry.convertedObject[perf.viewport.id];
		const plainMesh = plain.convertedObject[perf.viewport.id];
		const pass = perf.renders.find(
			(item: {target: unknown; triangles: number}) =>
				item.target === null && item.triangles === 24,
		);
		return {
			childBatched: Boolean(childMesh?.userData?.batchedMesh),
			childVisible: childMesh?.visible === true,
			plainBatched: Boolean(plainMesh?.userData?.batchedMesh),
			calls: pass?.calls ?? null,
		};
	});
	expect(restored.childBatched, JSON.stringify(restored)).toBe(true);
	expect(restored.childVisible, JSON.stringify(restored)).toBe(false);
	expect(restored.plainBatched, JSON.stringify(restored)).toBe(true);
	expect(restored.calls, JSON.stringify(restored)).toBe(1);
});

test("SS-10390 a batched material keeps the shadow hook", async ({page}) => {
	await skipOnSoftwareRenderer(
		page,
		"needs soft shadows, which are off on SwiftShader",
	);
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
		await perf.nextFrame();
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
			errors: errors.filter((line) =>
				/shader|lightSizeUV|compile/i.test(line),
			),
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
		perf.viewport.defaultMaterial.side = SDV.MATERIAL_SIDE.FRONT;
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
	expect(result.tint.r, JSON.stringify(result)).toBeCloseTo(
		result.source[0],
		4,
	);
	expect(result.tint.g, JSON.stringify(result)).toBeCloseTo(
		result.source[1],
		4,
	);
	expect(result.tint.b, JSON.stringify(result)).toBeCloseTo(
		result.source[2],
		4,
	);
});

test("SS-10390 a pulsed member does not supply the batch shader", async ({
	page,
}) => {
	await skipOnSoftwareRenderer(
		page,
		"asserts the soft-shadow blending uniform, which needs shadows",
	);
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
		await perf.nextFrame();
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
		await perf.nextFrame();
		const pulsed = geometry.convertedObject[perf.viewport.id];
		const other = boxes[1].data[0].convertedObject[perf.viewport.id];
		const batch = other?.userData?.batchedMesh;
		return {
			pulsedVisible: pulsed?.visible === true,
			pulsedBatched: Boolean(pulsed?.userData?.batchedMesh),
			otherBatched: Boolean(batch),
			blending:
				batch?.material?.userData?.shader?.uniforms?.blending?.value ??
				null,
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

test("SS-10390 color variants stay one draw and a ray hits that box", async ({
	page,
}) => {
	await open(page);
	const draw = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const green = new SDV.MaterialUnlitData({
			color: "#66cc88",
			side: SDV.MATERIAL_SIDE.FRONT,
		});
		const blue = new SDV.MaterialUnlitData({
			color: "#3366cc",
			side: SDV.MATERIAL_SIDE.FRONT,
		});
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
		await perf.nextFrame();
		const pass = perf.renders.find(
			(item: any) => item.target === null && item.triangles === 192,
		);
		const hits = perf.viewport.raytraceScene([0, 0, -1], [0, 0, 1]);
		const centerPixel = async (eye: number[], target: number[]) => {
			await perf.viewport.camera.set(eye, target, {duration: 0});
			await perf.nextFrame();
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
		await perf.nextFrame();
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
		await perf.nextFrame();
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

test("SS-10390 one mesh stays a mesh and shared transmission stays one batch", async ({
	page,
}) => {
	await open(page);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const plain = new SDV.MaterialStandardData({
			color: "#66cc88",
			side: SDV.MATERIAL_SIDE.FRONT,
		});
		const glass = new SDV.MaterialStandardData({
			color: "#d8a15a",
			roughness: 0.2,
			metalness: 0,
			transmission: 0.75,
			thickness: 0.9,
			ior: 1.55,
			side: SDV.MATERIAL_SIDE.DOUBLE,
		});
		const add = (name: string, material: any, z: number) => {
			const geometry = perf.boxGeometry(
				[-0.4, -0.4, z],
				[0.4, 0.4, z + 0.8],
			);
			geometry.material = material;
			const node = new SDV.TreeNode(name);
			node.addData(geometry);
			SDV.sceneTree.root.addChild(node);
		};
		add("alone", plain, 0);
		add("glassA", glass, 1.2);
		add("glassB", glass, 2.4);
		SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
		const meshOf = (name: string) => {
			const node = SDV.sceneTree.root.children.find(
				(child: {name: string}) => child.name === name,
			);
			return node?.data[0]?.convertedObject[perf.viewport.id];
		};
		const alone = meshOf("alone");
		const glassA = meshOf("glassA");
		const glassB = meshOf("glassB");
		const batch = glassA?.userData?.batchedMesh;
		return {
			aloneVisible: alone?.visible ?? null,
			aloneBatched: Boolean(alone?.userData?.batchedMesh),
			glassVisible: [glassA?.visible ?? null, glassB?.visible ?? null],
			glassBatched: [
				Boolean(glassA?.userData?.batchedMesh),
				Boolean(glassB?.userData?.batchedMesh),
			],
			sameBatch:
				glassA?.userData?.batchedMesh === glassB?.userData?.batchedMesh,
			transmission: batch?.material?.transmission ?? null,
		};
	});
	expect(result.aloneVisible, JSON.stringify(result)).toBe(true);
	expect(result.aloneBatched, JSON.stringify(result)).toBe(false);
	expect(result.glassVisible, JSON.stringify(result)).toEqual([false, false]);
	expect(result.glassBatched, JSON.stringify(result)).toEqual([true, true]);
	expect(result.sameBatch, JSON.stringify(result)).toBe(true);
	expect(result.transmission, JSON.stringify(result)).toBeGreaterThan(0);
});

test("SS-10390 transparent panes stay individual meshes", async ({page}) => {
	await open(page);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const glass = new SDV.MaterialStandardData({
			color: "#d8a15a",
			opacity: 0.52,
			side: SDV.MATERIAL_SIDE.DOUBLE,
		});
		const add = (name: string, z: number) => {
			const geometry = perf.boxGeometry(
				[-0.4, -0.4, z],
				[0.4, 0.4, z + 0.8],
			);
			geometry.material = glass;
			const node = new SDV.TreeNode(name);
			node.addData(geometry);
			SDV.sceneTree.root.addChild(node);
		};
		add("paneA", 0);
		add("paneB", 1.2);
		SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
		const meshOf = (name: string) => {
			const node = SDV.sceneTree.root.children.find(
				(child: {name: string}) => child.name === name,
			);
			return node?.data[0]?.convertedObject[perf.viewport.id];
		};
		const paneA = meshOf("paneA");
		const paneB = meshOf("paneB");
		// SS-10483: a transparent double-sided pane shows a back and front
		// material pair; both have the same transparency and depth write
		const shown = Array.isArray(paneA?.material)
			? paneA.material[0]
			: paneA?.material;
		return {
			visible: [paneA?.visible ?? null, paneB?.visible ?? null],
			batched: [
				Boolean(paneA?.userData?.batchedMesh),
				Boolean(paneB?.userData?.batchedMesh),
			],
			transparent: shown?.transparent ?? null,
			depthWrite: shown?.depthWrite ?? null,
		};
	});
	expect(result.visible, JSON.stringify(result)).toEqual([true, true]);
	expect(result.batched, JSON.stringify(result)).toEqual([false, false]);
	expect(result.transparent, JSON.stringify(result)).toBe(true);
	expect(result.depthWrite, JSON.stringify(result)).toBe(true);
});

test("SS-10390 blended panes without depth write are one visible batch", async ({
	page,
}) => {
	await open(page);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const glass = new SDV.MaterialStandardData({
			color: "#88bbdd",
			opacity: 0.35,
			alphaMode: SDV.MATERIAL_ALPHA.BLEND,
			side: SDV.MATERIAL_SIDE.DOUBLE,
		});
		const count = perf.addBoxes(6, glass);
		perf.viewport.update();
		perf.viewport.show = true;
		await perf.viewport.camera.set([0, 0, -4], [0, 0, 2], {duration: 0});
		perf.renders.length = 0;
		await perf.nextFrame();
		const pass = perf.renders.find(
			(item: any) => item.target === null && item.triangles > 0,
		);
		const meshes = SDV.sceneTree.root.children
			.map((node: any) => node.data[0]?.convertedObject[perf.viewport.id])
			.filter((mesh: any) => mesh?.isMesh === true);
		const batches = new Set(
			meshes.map((mesh: any) => mesh?.userData?.batchedMesh),
		);
		const batch = meshes[0]?.userData?.batchedMesh;
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
			count,
			sourceVisible: meshes.map((mesh: any) => mesh?.visible ?? null),
			batches: batches.size,
			instances: batch?.instanceCount ?? null,
			transparent: batch?.material?.transparent ?? null,
			depthWrite: batch?.material?.depthWrite ?? null,
			side: batch?.material?.side ?? null,
			calls: pass?.calls ?? null,
			pixel: [pixel[0], pixel[1], pixel[2]],
			passes: perf.renders.map((item: any) => ({
				calls: item.calls,
				triangles: item.triangles,
				target: item.target,
			})),
		};
	});
	expect(result.sourceVisible, JSON.stringify(result)).toEqual(
		new Array(result.count).fill(false),
	);
	expect(result.batches, JSON.stringify(result)).toBe(1);
	expect(result.instances, JSON.stringify(result)).toBe(6);
	expect(result.transparent, JSON.stringify(result)).toBe(true);
	expect(result.depthWrite, JSON.stringify(result)).toBe(false);
	expect(result.side, JSON.stringify(result)).toBe(2);
	// three.js draws a transparent double-sided object back faces first,
	// then front faces. The batch is that one object.
	expect(result.calls, JSON.stringify(result.passes)).toBe(2);
	// The background is #101010. Six blue panes in front of it are brighter.
	expect(result.pixel[2], JSON.stringify(result)).toBeGreaterThan(40);
});

test("SS-10390 double-sided metal is one batch and keeps its shading", async ({
	page,
}) => {
	await open(page);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const metal = new SDV.MaterialStandardData({
			color: "#6b4d37",
			metalness: 1,
			roughness: 0.25,
			side: SDV.MATERIAL_SIDE.DOUBLE,
		});
		const add = (name: string, z: number) => {
			const geometry = perf.boxGeometry(
				[-0.4, -0.4, z],
				[0.4, 0.4, z + 0.8],
			);
			geometry.material = metal;
			const node = new SDV.TreeNode(name);
			node.addData(geometry);
			SDV.sceneTree.root.addChild(node);
		};
		add("panelA", 0);
		add("panelB", 1.2);
		SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
		const meshOf = (name: string) => {
			const node = SDV.sceneTree.root.children.find(
				(child: {name: string}) => child.name === name,
			);
			return node?.data[0]?.convertedObject[perf.viewport.id];
		};
		const panelA = meshOf("panelA");
		const panelB = meshOf("panelB");
		const batch = panelA?.userData?.batchedMesh;
		perf.viewport.show = true;
		await perf.viewport.camera.set([2, 2, -3], [0, 0, 0.4], {duration: 0});
		await perf.nextFrame();
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
			visible: [panelA?.visible ?? null, panelB?.visible ?? null],
			batched: [
				Boolean(panelA?.userData?.batchedMesh),
				Boolean(panelB?.userData?.batchedMesh),
			],
			sameBatch: batch === panelB?.userData?.batchedMesh,
			side: batch?.material?.side ?? null,
			metalness: batch?.material?.metalness ?? null,
			sourceDefines: Object.keys(panelA?.material?.defines ?? {}).sort(),
			batchDefines: Object.keys(batch?.material?.defines ?? {}).sort(),
			pixel: [pixel[0], pixel[1], pixel[2]],
		};
	});
	expect(result.visible, JSON.stringify(result)).toEqual([false, false]);
	expect(result.batched, JSON.stringify(result)).toEqual([true, true]);
	expect(result.sameBatch, JSON.stringify(result)).toBe(true);
	expect(result.side, JSON.stringify(result)).toBe(2);
	expect(result.metalness, JSON.stringify(result)).toBe(1);
	// Material.copy resets defines. Without the legacy PBR define the
	// batch is shaded by stock three.js and this metal is black, because
	// the viewport has no environment map.
	expect(result.sourceDefines, JSON.stringify(result)).toContain("legacy");
	expect(result.batchDefines, JSON.stringify(result)).toEqual(
		result.sourceDefines,
	);
	expect(result.pixel[0], JSON.stringify(result)).toBeGreaterThan(30);
});

test("SS-10390 a god ray source stays a visible mesh", async ({page}) => {
	await open(page);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const material = new SDV.MaterialStandardData({
			color: "#e8d7b0",
			side: SDV.MATERIAL_SIDE.FRONT,
		});
		perf.addBoxes(4, material);
		perf.viewport.update();
		const node = SDV.sceneTree.root.children.find(
			(child: {name: string}) => child.name === "box0",
		);
		const token = perf.viewport.postProcessing.addEffect({
			type: SDV.POST_PROCESSING_EFFECT_TYPE.GOD_RAYS,
			properties: {decay: 1, weight: 0.6},
		});
		perf.viewport.postProcessing.godRaysEffects[token].setLightSource(node);
		const mesh = node?.data[0]?.convertedObject[perf.viewport.id];
		const sibling = SDV.sceneTree.root.children.find(
			(child: {name: string}) => child.name === "box1",
		)?.data[0]?.convertedObject[perf.viewport.id];
		return {
			visible: mesh?.visible ?? null,
			batched: Boolean(mesh?.userData?.batchedMesh),
			siblingBatched: Boolean(sibling?.userData?.batchedMesh),
			transparent: mesh?.material?.transparent ?? null,
			depthWrite: mesh?.material?.depthWrite ?? null,
		};
	});
	expect(result.visible, JSON.stringify(result)).toBe(true);
	expect(result.batched, JSON.stringify(result)).toBe(false);
	expect(result.siblingBatched, JSON.stringify(result)).toBe(true);
	expect(result.transparent, JSON.stringify(result)).toBe(true);
	expect(result.depthWrite, JSON.stringify(result)).toBe(false);
});

test("SS-10390 meshes that share a primitive are one geometry in the batch", async ({
	page,
}) => {
	await open(page);
	const result = await page.evaluate(async () => {
		const perf = (window as any).__perf;
		const SDV = (window as any).SDV;
		await perf.create({shadows: false});
		const material = new SDV.MaterialStandardData({
			color: "#66cc88",
			side: SDV.MATERIAL_SIDE.FRONT,
		});
		const first = perf.boxGeometry([-0.4, -0.4, 0], [0.4, 0.4, 0.8]);
		const other = perf.boxGeometry([-0.4, -0.4, 0], [0.4, 0.4, 0.8]);
		const add = (name: string, primitive: any, x: number) => {
			const geometry = new SDV.GeometryData(
				primitive,
				SDV.PRIMITIVE_MODE.TRIANGLES,
			);
			geometry.material = material;
			const node = new SDV.TreeNode(name);
			node.addData(geometry);
			node.addTransformation({
				id: name,
				matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, 0, 0, 1],
			});
			SDV.sceneTree.root.addChild(node);
		};
		for (let i = 0; i < 6; i++) add(`shared${i}`, first.primitive, i * 1.2);
		add("other", other.primitive, 7.2);
		SDV.sceneTree.root.updateVersion();
		perf.viewport.update();
		perf.viewport.show = true;
		perf.renders.length = 0;
		await perf.nextFrame();
		const pass = perf.renders.find(
			(item: any) => item.target === null && item.triangles === 84,
		);
		const meshes = SDV.sceneTree.root.children
			.map((node: any) => node.data[0]?.convertedObject[perf.viewport.id])
			.filter((mesh: any) => mesh?.isMesh === true);
		const batch = meshes[0]?.userData?.batchedMesh;
		const hits = perf.viewport.raytraceScene([3.6, 0, -1], [0, 0, 1]);
		return {
			batches: new Set(
				meshes.map((mesh: any) => mesh?.userData?.batchedMesh),
			).size,
			instances: batch?.instanceCount ?? null,
			vertices: batch?.geometry?.attributes?.position?.count ?? null,
			indices: batch?.geometry?.index?.count ?? null,
			calls: pass?.calls ?? null,
			hit: hits[0]?.node?.name ?? null,
			passes: perf.renders.map((item: any) => ({
				calls: item.calls,
				triangles: item.triangles,
				target: item.target,
			})),
		};
	});
	expect(result.batches, JSON.stringify(result)).toBe(1);
	expect(result.instances, JSON.stringify(result)).toBe(7);
	// Two unique boxes: 8 vertices and 36 indices each.
	expect(result.vertices, JSON.stringify(result)).toBe(16);
	expect(result.indices, JSON.stringify(result)).toBe(72);
	expect(result.calls, JSON.stringify(result)).toBe(1);
	expect(result.hit, JSON.stringify(result)).toBe("shared3");
});
