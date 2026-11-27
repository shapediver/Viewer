import * as THREE from "three";

import {
	type IIntersectionEngine,
	type InstanceSlotCache,
	IntersectionEngine,
	NodeBoundsHierarchy,
	RaycasterParameters,
	SelectionBox,
} from "@shapediver/viewer.rendering-engine.intersection-engine";
import {
	GeometryData,
	type ITree,
	type ITreeNode,
	Tree,
	TreeNodeIndex,
} from "@shapediver/viewer.shared.node-tree";
import {EventEngine, EVENTTYPE} from "@shapediver/viewer.shared.services";
import {
	type IIntersectionDefinition,
	type IIntersectionFilter,
	type IRay,
	type IRayTracingIntersection,
	type IViewportUpdatedEvent,
} from "@shapediver/viewer.shared.types";

import {InteractionData} from "./InteractionData";

const LINE_OR_POINT_TYPES = new Set([
	"Line",
	"LineLoop",
	"LineSegments",
	"Line2",
	"Points",
]);

function isLineOrPoint(hit: IIntersectionDefinition): boolean {
	const primitive = (
		hit as IRayTracingIntersection & {
			occludePrimitive?: {objectType: string};
		}
	).occludePrimitive;
	return !!primitive && LINE_OR_POINT_TYPES.has(primitive.objectType);
}

/**
 * Whether the node, or one of its ancestors, carries interaction data of one
 * of the given managers (or of all managers, if it is not restricted).
 */
function isInteractiveFor(node: ITreeNode, managerIds: string[]): boolean {
	let current: ITreeNode | undefined = node;
	while (current) {
		for (const data of current.data)
			if (
				data instanceof InteractionData &&
				(data.restrictedManagers.length === 0 ||
					data.restrictedManagers.some((id) =>
						managerIds.includes(id),
					))
			)
				return true;
		current = current.parent;
	}
	return false;
}

/**
 * Whether the hit is on a primitive that is not visible (material opacity at
 * or below the threshold). Such a primitive, e.g. the invisible pick mesh of
 * a transform tool, is still raycastable but must not hide interactive
 * geometry behind it.
 */
function isInvisiblePrimitive(
	hit: IIntersectionDefinition,
	opacityThreshold: number,
): boolean {
	const primitive = (
		hit as IRayTracingIntersection & {
			occludePrimitive?: {
				objectType: string;
				materialOpacity?: number | number[];
			};
		}
	).occludePrimitive;
	if (!primitive) return false;
	const opacity = primitive.materialOpacity;
	if (opacity === undefined) return false;
	if (Array.isArray(opacity))
		return opacity.every((value) => value <= opacityThreshold);
	return opacity <= opacityThreshold;
}

/** An interactive node and the geometry data its picks are tested for. */
interface IInteractiveEntry {
	node: ITreeNode;
	geometryData: {[key: string]: GeometryData};
}

function sameGeometryData(
	a: {[key: string]: GeometryData},
	b: {[key: string]: GeometryData},
): boolean {
	const keys = Object.keys(a);
	return (
		keys.length === Object.keys(b).length &&
		keys.every((key) => a[key] === b[key])
	);
}

export class IntersectionManager implements IIntersectionEngine {
	private readonly _eventEngine: EventEngine = EventEngine.instance;
	private readonly _intersectionEngine: IntersectionEngine =
		IntersectionEngine.instance;
	private readonly _hierarchies: Map<string, NodeBoundsHierarchy> = new Map();
	private readonly _tree: ITree = Tree.instance;

	private static _instance: IntersectionManager;

	// The interactive nodes (visible, taking part in picking, with
	// interaction data), kept up to date from the nodes of a scene update.
	// A node has one entry for each of its interaction data.
	private readonly _index = new TreeNodeIndex<IInteractiveEntry[]>(
		(node) => {
			if (node.visible === false) return;
			if (node.intersectionTest === false) return;
			const entries: IInteractiveEntry[] = [];
			for (let i = 0; i < node.data.length; i++)
				if (node.data[i] instanceof InteractionData)
					entries.push({
						node,
						geometryData: this.collectGeometryData(node),
					});
			return entries.length > 0 ? entries : undefined;
		},
		(a, b) =>
			a.length === b.length &&
			a.every((entry, i) =>
				sameGeometryData(entry.geometryData, b[i].geometryData),
			),
	);
	// The index is read from the tree when it is needed for the first time.
	private _indexBuilt = false;
	// The entries of the index in tree order, for the version of the index in
	// `_listVersion`.
	private _list: IInteractiveEntry[] = [];
	private _listVersion = -1;

	private constructor() {
		this._eventEngine.addListener(
			EVENTTYPE.VIEWPORT.VIEWPORT_UPDATED,
			(e) => {
				// Nothing to keep up to date before the first pick.
				if (!this._indexBuilt) return;
				const changes = (<IViewportUpdatedEvent>e).sceneChanges;
				// Without the nodes a scene update went through, the
				// whole tree is read.
				if (changes) this._index.apply(changes, this._tree.root);
				else this._index.rebuild(this._tree.root);
			},
		);
	}

	public static get instance() {
		return this._instance || (this._instance = new this());
	}

	public intersect(
		ray: IRay,
		viewportId: string,
		filterCriteria: IIntersectionFilter[] = [],
		options?: {
			rayCasterParams?: THREE.RaycasterParameters;
			selectionBox?: SelectionBox;
		},
	): IIntersectionDefinition[] {
		if (options?.selectionBox) {
			return options.selectionBox.intersectObjects(
				this.nodeList.map((n) => n.node),
				filterCriteria,
			);
		} else {
			// select with ray
			return this.intersectNodes(
				ray,
				viewportId,
				filterCriteria,
				options?.rayCasterParams,
			);
		}
	}

	/**
	 * Returns the distance to the closest piece of scene geometry hit by the
	 * ray, regardless of whether it has InteractionData. Used to occlude
	 * interactive intersections that are behind solid non-interactive geometry.
	 *
	 * Primitives (meshes, lines, points) whose material opacity is at or below
	 * `opacityThreshold` are skipped. Everything above that opacity still occludes.
	 * An invisible mesh of an interactive node of the given managers (e.g. the
	 * hover area of a text) still occludes: it is the closest object there.
	 */
	public closestSceneGeometryDistance(
		ray: IRay,
		viewportId: string,
		rayCasterParams?: RaycasterParameters,
		opacityThreshold: number = 0.01,
		managerIds: string[] = [],
	): number {
		const hits = this._intersectionEngine.intersect(
			ray,
			viewportId,
			undefined,
			{
				rayCasterParams,
			},
		);
		for (const hit of hits) {
			if (hit.type !== "RayTracingIntersection") continue;
			if (
				isInvisiblePrimitive(hit, opacityThreshold) &&
				(isLineOrPoint(hit) || !isInteractiveFor(hit.node, managerIds))
			)
				continue;
			return (hit as IRayTracingIntersection).distance;
		}
		return Infinity;
	}

	/**
	 * The interactive nodes in tree order. Made again only when a node
	 * entered or left the index or the geometry data of an entry changed; the
	 * bounds hierarchies are made again with it, and the callbacks that keep
	 * the geometry data of an entry up to date are installed again.
	 */
	private get nodeList(): IInteractiveEntry[] {
		if (!this._indexBuilt) {
			this._index.rebuild(this._tree.root);
			this._indexBuilt = true;
		}
		if (this._listVersion !== this._index.version) {
			this._listVersion = this._index.version;
			this._list = this._index
				.entries(this._tree.root)
				.flatMap((entry) => entry.value);
			this._hierarchies.clear();
			this.installCallbacks();
		}
		return this._list;
	}

	/**
	 * The geometry data of the node and of every node below it, by id and
	 * version.
	 */
	private collectGeometryData(node: ITreeNode): {
		[key: string]: GeometryData;
	} {
		const geometryData: {[key: string]: GeometryData} = {};
		node.traverseData((d) => {
			if (d instanceof GeometryData)
				geometryData[`${d.id}_${d.version}`] = d;
		});
		return geometryData;
	}

	/**
	 * A geometry data that gets a new version keeps its place in the entry
	 * under the new key. A node that is updated collects its geometry data
	 * again (the first entry of the node, as before).
	 */
	private installCallbacks() {
		const geometryDataCallbacks = (entry: IInteractiveEntry) => {
			const geometryData = entry.geometryData;
			for (const key in geometryData) {
				const d = geometryData[key];
				d.updateCallback = (newVersion: string, oldVersion: string) => {
					const current = entry.geometryData;
					if (current[`${d.id}_${oldVersion}`]) {
						current[`${d.id}_${newVersion}`] =
							current[`${d.id}_${oldVersion}`];
						delete current[`${d.id}_${oldVersion}`];
					}
				};
			}
		};
		const seen = new Set<ITreeNode>();
		for (const entry of this._list) {
			geometryDataCallbacks(entry);
			if (seen.has(entry.node)) continue;
			seen.add(entry.node);
			const node = entry.node;
			node.updateCallback = () => {
				const first = this._index.get(node.id)?.value[0];
				if (!first) return;
				first.geometryData = this.collectGeometryData(node);
				geometryDataCallbacks(first);
			};
		}
	}

	private hierarchyFor(viewportId: string): NodeBoundsHierarchy {
		const key = viewportId ?? "";
		let hierarchy = this._hierarchies.get(key);
		if (!hierarchy) {
			hierarchy = new NodeBoundsHierarchy(viewportId);
			hierarchy.setNodes(this.nodeList);
			this._hierarchies.set(key, hierarchy);
		}
		return hierarchy;
	}

	private intersectNodes(
		ray: IRay,
		viewportId: string,
		filterCriteria: IIntersectionFilter[] = [],
		rayCasterParams?: RaycasterParameters,
	): IRayTracingIntersection[] {
		let intersections: IRayTracingIntersection[] = [];
		const instancedIntersectionCache = new Map<
			THREE.InstancedMesh,
			THREE.Intersection[]
		>();

		// The batched meshes of one ray are raycast once, not once per node.
		const batchedIntersectionCache = new Map<
			THREE.BatchedMesh,
			THREE.Intersection[]
		>();

		// The single instances of one ray are raycast once, not once per node.
		const instanceSlotCache: InstanceSlotCache = new Map();

		// intersect the nodes the ray can hit, in list order, and of their
		// instances only those the ray can hit
		const nodes = this.nodeList;
		const hierarchy = this.hierarchyFor(viewportId);
		hierarchy
			.candidates(
				new THREE.Ray(
					new THREE.Vector3(...ray.origin),
					new THREE.Vector3(...ray.direction),
				),
				this._intersectionEngine.rayThresholds(rayCasterParams),
			)
			.forEach((index) => {
				const i = nodes[index];
				const currentIntersection =
					this._intersectionEngine.intersectNode(
						ray,
						i.node,
						i.geometryData,
						viewportId,
						filterCriteria,
						rayCasterParams,
						instancedIntersectionCache,
						batchedIntersectionCache,
						hierarchy.instanceSlots(index),
						instanceSlotCache,
					);
				if (currentIntersection)
					intersections = intersections.concat(currentIntersection);
			});

		intersections.sort((a, b) => {
			const distanceDiff = a.distance - b.distance;
			if (distanceDiff !== 0) return distanceDiff;

			// if the distance is the same, sort by the closest InteractionData within the sceneTree
			let depthA = Infinity;
			let depthB = Infinity;

			const computeDepth = (
				targetNode: ITreeNode,
				node: ITreeNode,
				depth: number = 0,
			): number => {
				if (targetNode === node) return depth;
				if (node.parent)
					return computeDepth(targetNode, node.parent, depth + 1);
				return Infinity;
			};

			if (a.geometryData) {
				a.node.traverse((node) => {
					if (a.geometryData && node.data.includes(a.geometryData))
						depthA = computeDepth(a.node, node);
				});
			}

			if (b.geometryData) {
				b.node.traverse((node) => {
					if (b.geometryData && node.data.includes(b.geometryData))
						depthB = computeDepth(b.node, node);
				});
			}

			return depthA - depthB;
		});

		return intersections;
	}
}
