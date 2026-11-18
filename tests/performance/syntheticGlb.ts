/**
 * Build a glb shaped like ShapeDiverGltfV2Writer output: one material, one
 * primitive per mesh with POSITION, NORMAL and uint32 indices in separate
 * buffer views, and a group node per mesh whose children place instances.
 *
 * Used by the SS-10396 load tests so that no binary fixture is committed.
 */
export function syntheticGlb(options: {
	meshes: number;
	instancesPerMesh: number;
	gridSize: number;
	/** Distinct vertex positions per mesh, so meshes are not rigid copies. */
	jitter?: boolean;
	/** Extra external buffers, written as data URIs after the GLB body. */
	extraDataUriBuffers?: number;
}): Buffer {
	const {meshes, instancesPerMesh, gridSize} = options;
	const vertexCount = gridSize * gridSize;
	const cells = (gridSize - 1) * (gridSize - 1);

	const chunks: Buffer[] = [];
	let byteLength = 0;
	const bufferViews: object[] = [];
	const accessors: object[] = [];
	const addView = (data: Buffer, target: number) => {
		const padding = (4 - (byteLength % 4)) % 4;
		if (padding) {
			chunks.push(Buffer.alloc(padding));
			byteLength += padding;
		}
		bufferViews.push({
			buffer: 0,
			byteOffset: byteLength,
			byteLength: data.length,
			target,
		});
		chunks.push(data);
		byteLength += data.length;
		return bufferViews.length - 1;
	};

	const gltfMeshes: object[] = [];
	for (let m = 0; m < meshes; m++) {
		const positions = new Float32Array(vertexCount * 3);
		const normals = new Float32Array(vertexCount * 3);
		const min = [Infinity, Infinity, Infinity];
		const max = [-Infinity, -Infinity, -Infinity];
		for (let i = 0; i < vertexCount; i++) {
			const x = (i % gridSize) / (gridSize - 1);
			const y = Math.floor(i / gridSize) / (gridSize - 1);
			const z = options.jitter
				? 0.05 * Math.sin(i * 12.9898 + m * 78.233)
				: 0.05 * Math.sin((x + y + m) * 6.283);
			positions.set([x, y, z], i * 3);
			normals.set([0, 0, 1], i * 3);
			[x, y, z].forEach((v, k) => {
				min[k] = Math.min(min[k], v);
				max[k] = Math.max(max[k], v);
			});
		}
		const indices = new Uint32Array(cells * 6);
		let o = 0;
		for (let r = 0; r < gridSize - 1; r++) {
			for (let c = 0; c < gridSize - 1; c++) {
				const a = r * gridSize + c;
				indices.set(
					[
						a,
						a + 1,
						a + gridSize,
						a + 1,
						a + gridSize + 1,
						a + gridSize,
					],
					o,
				);
				o += 6;
			}
		}
		const position = accessors.length;
		accessors.push({
			bufferView: addView(Buffer.from(positions.buffer), 34962),
			componentType: 5126,
			count: vertexCount,
			type: "VEC3",
			min,
			max,
		});
		accessors.push({
			bufferView: addView(Buffer.from(normals.buffer), 34962),
			componentType: 5126,
			count: vertexCount,
			type: "VEC3",
		});
		accessors.push({
			bufferView: addView(Buffer.from(indices.buffer), 34963),
			componentType: 5125,
			count: indices.length,
			type: "SCALAR",
		});
		gltfMeshes.push({
			primitives: [
				{
					attributes: {POSITION: position, NORMAL: position + 1},
					indices: position + 2,
					material: 0,
					mode: 4,
				},
			],
		});
	}

	const nodes: object[] = [{children: [] as number[]}];
	for (let m = 0; m < meshes; m++) {
		const group = {children: [] as number[]};
		(nodes[0] as {children: number[]}).children.push(nodes.length);
		nodes.push(group);
		for (let i = 0; i < instancesPerMesh; i++) {
			group.children.push(nodes.length);
			nodes.push({
				mesh: m,
				translation: [
					(m % 40) * 1.2,
					Math.floor(m / 40) * 1.2,
					i * 0.5,
				],
			});
		}
	}

	const buffers: object[] = [{byteLength}];
	for (let b = 0; b < (options.extraDataUriBuffers ?? 0); b++) {
		// One float per extra buffer; a scalar accessor references it.
		const data = Buffer.from(new Float32Array([b + 1]).buffer);
		buffers.push({
			byteLength: data.length,
			uri: `data:application/octet-stream;base64,${data.toString("base64")}`,
		});
		bufferViews.push({buffer: buffers.length - 1, byteLength: data.length});
		accessors.push({
			bufferView: bufferViews.length - 1,
			componentType: 5126,
			count: 1,
			type: "SCALAR",
		});
	}

	const json = {
		asset: {version: "2.0", generator: "syntheticGlb"},
		scene: 0,
		scenes: [{nodes: [0]}],
		nodes,
		meshes: gltfMeshes,
		materials: [
			{pbrMetallicRoughness: {baseColorFactor: [0.8, 0.8, 0.8, 1]}},
		],
		accessors,
		bufferViews,
		buffers,
	};
	let jsonBuffer = Buffer.from(JSON.stringify(json));
	jsonBuffer = Buffer.concat([
		jsonBuffer,
		Buffer.alloc((4 - (jsonBuffer.length % 4)) % 4, 0x20),
	]);
	let bin = Buffer.concat(chunks);
	bin = Buffer.concat([bin, Buffer.alloc((4 - (bin.length % 4)) % 4)]);

	const header = Buffer.alloc(12);
	header.write("glTF", 0);
	header.writeUInt32LE(2, 4);
	header.writeUInt32LE(12 + 8 + jsonBuffer.length + 8 + bin.length, 8);
	const jsonHeader = Buffer.alloc(8);
	jsonHeader.writeUInt32LE(jsonBuffer.length, 0);
	jsonHeader.writeUInt32LE(0x4e4f534a, 4);
	const binHeader = Buffer.alloc(8);
	binHeader.writeUInt32LE(bin.length, 0);
	binHeader.writeUInt32LE(0x004e4942, 4);
	return Buffer.concat([header, jsonHeader, jsonBuffer, binHeader, bin]);
}
