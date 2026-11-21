/**
 * Parametric AEC-like scene for the performance budgets and the benchmark.
 *
 * A square tower: every floor has an opaque slab and four facades, every
 * facade has `baysPerSide` bays, every bay has a transparent glass pane, a
 * metal mullion, and a metal transom. Materials use the product default
 * side (double). Each kind of part shares one primitive across all nodes,
 * the way a Grasshopper model repeats one profile.
 *
 * Each mesh sits three nodes below its bay (part, item, mesh) so the tree
 * has about three nodes per mesh, like an exported output tree.
 *
 * Nothing here is customer data.
 */

export interface AecSceneOptions {
	floors: number;
	baysPerSide: number;
	/** Width of one bay in scene units. */
	bayWidth: number;
	/** Height of one floor in scene units. */
	floorHeight: number;
	glassOpacity: number;
	mullionMetalness: number;
	/**
	 * Blended glass, as glTF `alphaMode: BLEND` exports it: transparent
	 * and no depth write. Without it the panes are transparent through
	 * their opacity and still write depth.
	 */
	glassBlend?: boolean;
}

export const AEC_DEFAULT: AecSceneOptions = {
	floors: 20,
	baysPerSide: 16,
	bayWidth: 1.5,
	floorHeight: 3.5,
	glassOpacity: 0.35,
	mullionMetalness: 0.6,
};

const SIDES = 4;
const PARTS_PER_BAY = 3;
const NODES_PER_PART = 3;

/** Mesh and tree node counts the generator produces for these options. */
export function aecSceneCounts(options: AecSceneOptions) {
	const bays = options.floors * SIDES * options.baysPerSide;
	const meshes = bays * PARTS_PER_BAY + options.floors;
	const treeNodes =
		1 + // fixture root
		options.floors + // floor
		options.floors + // slab
		options.floors * SIDES + // facade
		bays + // bay
		bays * PARTS_PER_BAY * NODES_PER_PART;
	return {
		bays,
		meshes,
		treeNodes,
		glass: bays,
		metal: bays * 2,
		slabs: options.floors,
	};
}

/**
 * Runs in the page. Adds `window.__aec.build(options)`.
 * It must not reference anything outside its own body.
 */
export function installAecScene() {
	const SDV = (window as any).SDV;
	const BOX_INDICES = [
		0, 2, 3, 0, 3, 1, 4, 5, 7, 4, 7, 6, 0, 1, 5, 0, 5, 4, 2, 7, 3, 2, 6, 7,
		0, 4, 6, 0, 6, 2, 1, 3, 7, 1, 7, 5,
	];

	function boxPrimitive(min: number[], max: number[]) {
		const positions = new Float32Array(24);
		for (let i = 0; i < 8; i++) {
			positions[i * 3] = i & 1 ? max[0] : min[0];
			positions[i * 3 + 1] = i & 2 ? max[1] : min[1];
			positions[i * 3 + 2] = i & 4 ? max[2] : min[2];
		}
		const indices = new Uint16Array(BOX_INDICES);
		return new SDV.PrimitiveData(
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
			new SDV.AttributeData(indices, 1, 2, 0, 2, false, indices.length),
		);
	}

	// Column-major 4x4, the layout gl-matrix uses.
	function translation(x: number, y: number, z: number) {
		return new Float32Array([
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
			y,
			z,
			1,
		]);
	}

	function rotationZ(quarterTurns: number) {
		const cos = [1, 0, -1, 0][quarterTurns % 4];
		const sin = [0, 1, 0, -1][quarterTurns % 4];
		return new Float32Array([
			cos,
			sin,
			0,
			0,
			-sin,
			cos,
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
		]);
	}

	function build(options: any) {
		const {floors, baysPerSide, bayWidth, floorHeight} = options;
		const side = baysPerSide * bayWidth;
		const half = side / 2;
		const profile = 0.06;

		const glass = new SDV.MaterialStandardData({
			color: "#9fc4d6",
			opacity: options.glassOpacity,
			metalness: 0,
			roughness: 0.1,
			...(options.glassBlend
				? {alphaMode: SDV.MATERIAL_ALPHA.BLEND}
				: {}),
		});
		const metal = new SDV.MaterialStandardData({
			color: "#8a8d91",
			metalness: options.mullionMetalness,
			roughness: 0.4,
		});
		const concrete = new SDV.MaterialStandardData({
			color: "#c8c8c8",
			metalness: 0,
			roughness: 0.9,
		});

		const parts = [
			{
				name: "glass",
				material: glass,
				primitive: boxPrimitive(
					[profile, -0.012, 0.3 + profile],
					[bayWidth - profile, 0.012, floorHeight - profile],
				),
			},
			{
				name: "mullion",
				material: metal,
				primitive: boxPrimitive(
					[-profile, -0.1, 0.3],
					[profile, 0.1, floorHeight],
				),
			},
			{
				name: "transom",
				material: metal,
				primitive: boxPrimitive(
					[profile, -0.1, 0.3 - profile],
					[bayWidth - profile, 0.1, 0.3 + profile],
				),
			},
		];
		const slabPrimitive = boxPrimitive(
			[-half, -half, 0],
			[half, half, 0.3],
		);

		const root = new SDV.TreeNode("aec");
		const glassNodes: any[] = [];
		const mullionNodes: any[] = [];
		// Item nodes carry interaction and sdTF data, as in a session model.
		const glassItems: any[] = [];
		const items: any[] = [];
		let meshes = 0;
		let treeNodes = 1;

		function meshNode(
			name: string,
			primitive: any,
			material: any,
			parent: any,
		) {
			const geometry = new SDV.GeometryData(
				primitive,
				SDV.PRIMITIVE_MODE.TRIANGLES,
			);
			geometry.material = material;
			const node = new SDV.TreeNode(name, parent);
			node.addData(geometry);
			meshes++;
			treeNodes++;
			return node;
		}

		for (let f = 0; f < floors; f++) {
			const floor = new SDV.TreeNode(`floor${f}`, root);
			floor.addTransformation({
				id: "floor",
				matrix: translation(0, 0, f * floorHeight),
			});
			treeNodes++;
			meshNode("slab", slabPrimitive, concrete, floor);

			for (let s = 0; s < 4; s++) {
				const facade = new SDV.TreeNode(`facade${s}`, floor);
				facade.addTransformation({
					id: "facade",
					matrix: rotationZ(s),
				});
				treeNodes++;

				for (let b = 0; b < baysPerSide; b++) {
					const bay = new SDV.TreeNode(`bay${b}`, facade);
					bay.addTransformation({
						id: "bay",
						matrix: translation(-half + b * bayWidth, -half, 0),
					});
					treeNodes++;

					for (const part of parts) {
						const group = new SDV.TreeNode(part.name, bay);
						const item = new SDV.TreeNode("0", group);
						treeNodes += 2;
						const node = meshNode(
							"mesh",
							part.primitive,
							part.material,
							item,
						);
						items.push(item);
						if (part.name === "mullion") mullionNodes.push(node);
						if (part.name === "glass") {
							glassNodes.push(node);
							glassItems.push(item);
						}
					}
				}
			}
		}

		SDV.sceneTree.root.addChild(root);
		SDV.sceneTree.root.updateVersion();

		const height = floors * floorHeight;
		return {
			root,
			glassNodes,
			mullionNodes,
			glassItems,
			items,
			meshes,
			treeNodes,
			// A fixed three-quarter view of the whole tower.
			camera: {
				position: [side * 2.2, -side * 3, height * 0.8],
				target: [0, 0, height / 2],
			},
		};
	}

	(window as any).__aec = {build, boxPrimitive};
}
