/**
 * Generates the .glb assets used by the GPU-instancing tests.
 *
 * Run with: node tests/instancing/generate-assets.js
 * The assets are committed; re-run only when the scenarios change.
 *
 * Scenarios:
 * - duplicated-boxes.glb: 9 nodes, each with its OWN mesh whose accessors
 *   duplicate byte-identical box geometry. Materials differ only in
 *   baseColorFactor. Plus one unique tetrahedron (never batched) and two
 *   transparent boxes (excluded from batching by the opacity rule).
 * - shared-mesh-boxes.glb: ONE box mesh referenced by 9 nodes with different
 *   translations (glTF-conformant reuse layout).
 * - baked-boxes.glb: 6 meshes containing the same box with per-occurrence
 *   transforms baked into POSITION/NORMAL (rotation around Z + translation).
 */
const fs = require("fs");
const path = require("path");

// #region geometry helpers

/** Box centered at origin, 24 vertices (per-face normals), 36 indices. */
function createBox(size) {
	const s = size / 2;
	// prettier-ignore
	const faces = [
		{n: [1, 0, 0], corners: [[s, -s, -s], [s, s, -s], [s, s, s], [s, -s, s]]},
		{n: [-1, 0, 0], corners: [[-s, -s, s], [-s, s, s], [-s, s, -s], [-s, -s, -s]]},
		{n: [0, 1, 0], corners: [[-s, s, -s], [-s, s, s], [s, s, s], [s, s, -s]]},
		{n: [0, -1, 0], corners: [[-s, -s, s], [-s, -s, -s], [s, -s, -s], [s, -s, s]]},
		{n: [0, 0, 1], corners: [[-s, -s, s], [s, -s, s], [s, s, s], [-s, s, s]]},
		{n: [0, 0, -1], corners: [[s, -s, -s], [-s, -s, -s], [-s, s, -s], [s, s, -s]]},
	];
	const positions = [];
	const normals = [];
	const indices = [];
	faces.forEach((face, f) => {
		face.corners.forEach((c) => {
			positions.push(...c);
			normals.push(...face.n);
		});
		const o = f * 4;
		indices.push(o, o + 1, o + 2, o, o + 2, o + 3);
	});
	return {
		positions: new Float32Array(positions),
		normals: new Float32Array(normals),
		indices: new Uint16Array(indices),
	};
}

/** Tetrahedron with flat-shaded faces, so it can never hash-match the box. */
function createTetrahedron(size) {
	const s = size / 2;
	// prettier-ignore
	const corners = [[s, s, s], [s, -s, -s], [-s, s, -s], [-s, -s, s]];
	// prettier-ignore
	const faceIdx = [[0, 1, 2], [0, 3, 1], [0, 2, 3], [1, 3, 2]];
	const positions = [];
	const normals = [];
	const indices = [];
	faceIdx.forEach((f, i) => {
		const [a, b, c] = f.map((j) => corners[j]);
		const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
		const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
		const n = [
			u[1] * v[2] - u[2] * v[1],
			u[2] * v[0] - u[0] * v[2],
			u[0] * v[1] - u[1] * v[0],
		];
		const l = Math.hypot(...n);
		positions.push(...a, ...b, ...c);
		for (let j = 0; j < 3; j++) normals.push(n[0] / l, n[1] / l, n[2] / l);
		const o = i * 3;
		indices.push(o, o + 1, o + 2);
	});
	return {
		positions: new Float32Array(positions),
		normals: new Float32Array(normals),
		indices: new Uint16Array(indices),
	};
}

/** Rotate around Z by angle, then translate. Returns new arrays. */
function bakeTransform(geometry, angle, translation) {
	const cos = Math.cos(angle);
	const sin = Math.sin(angle);
	const positions = new Float32Array(geometry.positions.length);
	const normals = new Float32Array(geometry.normals.length);
	for (let i = 0; i < geometry.positions.length; i += 3) {
		const [x, y, z] = [
			geometry.positions[i],
			geometry.positions[i + 1],
			geometry.positions[i + 2],
		];
		positions[i] = cos * x - sin * y + translation[0];
		positions[i + 1] = sin * x + cos * y + translation[1];
		positions[i + 2] = z + translation[2];
		const [nx, ny, nz] = [
			geometry.normals[i],
			geometry.normals[i + 1],
			geometry.normals[i + 2],
		];
		normals[i] = cos * nx - sin * ny;
		normals[i + 1] = sin * nx + cos * ny;
		normals[i + 2] = nz;
	}
	return {positions, normals, indices: geometry.indices.slice()};
}

// #endregion

// #region glb writer

function createGlbBuilder() {
	const binChunks = [];
	let binLength = 0;
	const json = {
		asset: {version: "2.0", generator: "instancing-test-assets"},
		scene: 0,
		scenes: [{name: "scene", nodes: []}],
		nodes: [],
		meshes: [],
		materials: [],
		accessors: [],
		bufferViews: [],
		buffers: [],
	};

	function addBufferView(typedArray) {
		// 4-byte alignment
		const pad = (4 - (binLength % 4)) % 4;
		if (pad > 0) {
			binChunks.push(Buffer.alloc(pad));
			binLength += pad;
		}
		const buf = Buffer.from(
			typedArray.buffer,
			typedArray.byteOffset,
			typedArray.byteLength,
		);
		json.bufferViews.push({
			buffer: 0,
			byteOffset: binLength,
			byteLength: buf.length,
		});
		binChunks.push(buf);
		binLength += buf.length;
		return json.bufferViews.length - 1;
	}

	function minMax(array, itemSize) {
		const min = new Array(itemSize).fill(Infinity);
		const max = new Array(itemSize).fill(-Infinity);
		for (let i = 0; i < array.length; i += itemSize)
			for (let j = 0; j < itemSize; j++) {
				min[j] = Math.min(min[j], array[i + j]);
				max[j] = Math.max(max[j], array[i + j]);
			}
		return {min, max};
	}

	function addAccessor(typedArray, type, componentType, withMinMax) {
		const itemSize = {SCALAR: 1, VEC3: 3}[type];
		const accessor = {
			bufferView: addBufferView(typedArray),
			componentType,
			count: typedArray.length / itemSize,
			type,
		};
		if (withMinMax) Object.assign(accessor, minMax(typedArray, itemSize));
		json.accessors.push(accessor);
		return json.accessors.length - 1;
	}

	function addMaterial(name, baseColorFactor, alphaMode) {
		const material = {
			name,
			pbrMetallicRoughness: {
				baseColorFactor,
				metallicFactor: 0.1,
				roughnessFactor: 0.6,
			},
		};
		if (alphaMode) material.alphaMode = alphaMode;
		json.materials.push(material);
		return json.materials.length - 1;
	}

	/** Adds a mesh with its own (duplicated) accessors. */
	function addMesh(name, geometry, materialId) {
		json.meshes.push({
			name,
			primitives: [
				{
					attributes: {
						POSITION: addAccessor(
							geometry.positions,
							"VEC3",
							5126,
							true,
						),
						NORMAL: addAccessor(geometry.normals, "VEC3", 5126),
					},
					indices: addAccessor(geometry.indices, "SCALAR", 5123),
					material: materialId,
					mode: 4,
				},
			],
		});
		return json.meshes.length - 1;
	}

	function addNode(name, meshId, translation) {
		const node = {name, mesh: meshId};
		if (translation) node.translation = translation;
		json.nodes.push(node);
		json.scenes[0].nodes.push(json.nodes.length - 1);
		return json.nodes.length - 1;
	}

	function build() {
		json.buffers.push({byteLength: binLength});
		let jsonBuf = Buffer.from(JSON.stringify(json), "utf-8");
		const jsonPad = (4 - (jsonBuf.length % 4)) % 4;
		if (jsonPad > 0)
			jsonBuf = Buffer.concat([jsonBuf, Buffer.alloc(jsonPad, 0x20)]);
		let binBuf = Buffer.concat(binChunks);
		const binPad = (4 - (binBuf.length % 4)) % 4;
		if (binPad > 0) binBuf = Buffer.concat([binBuf, Buffer.alloc(binPad)]);

		const header = Buffer.alloc(12);
		header.writeUInt32LE(0x46546c67, 0); // magic "glTF"
		header.writeUInt32LE(2, 4);
		header.writeUInt32LE(12 + 8 + jsonBuf.length + 8 + binBuf.length, 8);

		const jsonHeader = Buffer.alloc(8);
		jsonHeader.writeUInt32LE(jsonBuf.length, 0);
		jsonHeader.writeUInt32LE(0x4e4f534a, 4); // "JSON"

		const binHeader = Buffer.alloc(8);
		binHeader.writeUInt32LE(binBuf.length, 0);
		binHeader.writeUInt32LE(0x004e4942, 4); // "BIN"

		return Buffer.concat([header, jsonHeader, jsonBuf, binHeader, binBuf]);
	}

	return {json, addMaterial, addMesh, addNode, build};
}

// #endregion

// #region scenarios

const COLORS = [
	[0.8, 0.1, 0.1, 1],
	[0.1, 0.6, 0.1, 1],
	[0.1, 0.2, 0.8, 1],
];

function gridTranslation(i, spacing) {
	return [
		(i % 3) * spacing - spacing,
		Math.floor(i / 3) * spacing - spacing,
		0,
	];
}

function generateDuplicatedBoxes() {
	const builder = createGlbBuilder();
	const box = createBox(1);
	for (let i = 0; i < 9; i++) {
		// each node gets its own byte-identical mesh + accessors
		const materialId = builder.addMaterial(
			`box_material_${i % 3}_${i}`,
			COLORS[i % 3],
		);
		const meshId = builder.addMesh(`box_${i}`, createBox(1), materialId);
		builder.addNode(`box_node_${i}`, meshId, gridTranslation(i, 2));
	}
	// unique geometry: never batched
	const tetraMaterial = builder.addMaterial(
		"tetra_material",
		[0.9, 0.7, 0.1, 1],
	);
	const tetraMesh = builder.addMesh(
		"tetra",
		createTetrahedron(1),
		tetraMaterial,
	);
	builder.addNode("tetra_node", tetraMesh, [0, 0, 2]);
	// transparent duplicates: excluded from batching by the opacity rule
	for (let i = 0; i < 2; i++) {
		const materialId = builder.addMaterial(
			`transparent_material_${i}`,
			[0.2, 0.6, 0.9, 0.4],
			"BLEND",
		);
		const meshId = builder.addMesh(
			`transparent_box_${i}`,
			createBox(1),
			materialId,
		);
		builder.addNode(`transparent_node_${i}`, meshId, [i * 2 - 1, 0, -2]);
	}
	void box;
	return builder.build();
}

function generateSharedMeshBoxes() {
	const builder = createGlbBuilder();
	const materialId = builder.addMaterial("box_material", COLORS[2]);
	const meshId = builder.addMesh("box", createBox(1), materialId);
	for (let i = 0; i < 9; i++)
		builder.addNode(`box_node_${i}`, meshId, gridTranslation(i, 2));
	return builder.build();
}

function generateBakedBoxes() {
	const builder = createGlbBuilder();
	const box = createBox(1);
	for (let i = 0; i < 6; i++) {
		const materialId = builder.addMaterial(
			`box_material_${i % 3}_${i}`,
			COLORS[i % 3],
		);
		const baked = bakeTransform(
			box,
			(i * Math.PI) / 6,
			gridTranslation(i, 2.5),
		);
		const meshId = builder.addMesh(`baked_box_${i}`, baked, materialId);
		builder.addNode(`baked_node_${i}`, meshId); // no node transform
	}
	return builder.build();
}

// #endregion

const outDir = path.join(__dirname, "assets");
fs.mkdirSync(outDir, {recursive: true});
const assets = {
	"duplicated-boxes.glb": generateDuplicatedBoxes(),
	"shared-mesh-boxes.glb": generateSharedMeshBoxes(),
	"baked-boxes.glb": generateBakedBoxes(),
};
for (const [name, buffer] of Object.entries(assets)) {
	fs.writeFileSync(path.join(outDir, name), buffer);
	console.log(`${name}: ${buffer.length} bytes`);
}
