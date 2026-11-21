import {
	GeometryData,
	type ITree,
	type ITreeNode,
	Tree,
} from "@shapediver/viewer.shared.node-tree";
import {EventEngine, EVENTTYPE} from "@shapediver/viewer.shared.services";
import {
	type IIntersectionDefinition,
	type IIntersectionFilter,
	type IRay,
	type IRayTracingIntersection,
} from "@shapediver/viewer.shared.types";
import * as THREE from "three";
import {type IIntersectionEngine} from "../interfaces/IIntersectionEngine";
import {NodeBoundsHierarchy} from "./NodeBoundsHierarchy";
import {SelectionBox} from "./SelectionBox";

export class IntersectionEngine implements IIntersectionEngine {
	// #region Properties (9)

	private readonly _candidateDirection: THREE.Vector3 = new THREE.Vector3();
	private readonly _candidateOrigin: THREE.Vector3 = new THREE.Vector3();
	private readonly _candidateRay: THREE.Ray = new THREE.Ray();
	private readonly _eventEngine: EventEngine = EventEngine.instance;
	private readonly _hierarchies: Map<string, NodeBoundsHierarchy> = new Map();
	private readonly _memberSphere: THREE.Sphere = new THREE.Sphere();
	private readonly _unitRay: THREE.Ray = new THREE.Ray();
	private readonly _instanceMatrix: THREE.Matrix4 = new THREE.Matrix4();
	private readonly _instanceWorldMatrix: THREE.Matrix4 = new THREE.Matrix4();
	private readonly _normalMatrix: THREE.Matrix3 = new THREE.Matrix3();
	private readonly _raycaster: THREE.Raycaster = new THREE.Raycaster();
	private readonly _tree: ITree = Tree.instance;
	private readonly _worldNormal: THREE.Vector3 = new THREE.Vector3();

	private static _instance: IntersectionEngine;

	private _intersectNodes: {
		node: ITreeNode;
		geometryData: {[key: string]: GeometryData};
		visible: boolean;
		excludeViewports: string[];
		restrictViewports: string[];
	}[] = [];

	// #endregion Properties (9)

	// #region Constructors (1)

	private constructor() {
		this.gatherNodes();
		this._eventEngine.addListener(
			EVENTTYPE.VIEWPORT.VIEWPORT_UPDATED,
			() => {
				this.gatherNodes();
			},
		);
	}

	// #endregion Constructors (1)

	// #region Public Static Getters And Setters (1)

	public static get instance() {
		return this._instance || (this._instance = new this());
	}

	// #endregion Public Static Getters And Setters (1)

	// #region Public Methods (2)

	public intersect(
		ray: IRay,
		viewportId: string,
		filterCriteria?: IIntersectionFilter[],
		options?: {
			rayCasterParams?: THREE.RaycasterParameters;
			selectionBox?: SelectionBox;
		},
	): IIntersectionDefinition[] {
		if (options?.selectionBox) {
			const selectionBox = options.selectionBox;
			return selectionBox.intersectObjects(
				this._intersectNodes.map((n) => n.node),
				filterCriteria || [],
			);
		} else {
			const instancedIntersectionCache = new Map<
				THREE.InstancedMesh,
				THREE.Intersection[]
			>();
			const batchedIntersectionCache = new Map<
				THREE.BatchedMesh,
				THREE.Intersection[]
			>();
			let intersections: IRayTracingIntersection[] = [];
			// Only the nodes a ray can hit are tested, in list order.
			const candidates = this.hierarchyFor(viewportId).candidates(
				this.toThreeRay(ray),
			);
			candidates.forEach((index) => {
				const i = this._intersectNodes[index];
				const currentIntersections = this.intersectNode(
					ray,
					i.node,
					i.geometryData,
					viewportId,
					filterCriteria,
					options?.rayCasterParams,
					instancedIntersectionCache,
					batchedIntersectionCache,
				);
				if (currentIntersections)
					intersections = intersections.concat(currentIntersections);
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
						if (
							a.geometryData &&
							node.data.includes(a.geometryData)
						)
							depthA = computeDepth(a.node, node);
					});
				}

				if (b.geometryData) {
					b.node.traverse((node) => {
						if (
							b.geometryData &&
							node.data.includes(b.geometryData)
						)
							depthB = computeDepth(b.node, node);
					});
				}

				return depthA - depthB;
			});
			return intersections;
		}
	}

	public intersectNode(
		ray: IRay,
		node: ITreeNode,
		geometryData: {[key: string]: GeometryData},
		viewportId: string,
		filterCriteria?: IIntersectionFilter[],
		rayCasterParams?: THREE.RaycasterParameters,
		instancedIntersectionCache: Map<
			THREE.InstancedMesh,
			THREE.Intersection[]
		> = new Map(),
		batchedIntersectionCache: Map<
			THREE.BatchedMesh,
			THREE.Intersection[]
		> = new Map(),
	): IRayTracingIntersection[] | undefined {
		if (node.visible === false) return;

		if (viewportId !== undefined) {
			if (node.excludeViewports.includes(viewportId)) return;
			if (
				node.restrictViewports.length > 0 &&
				!node.restrictViewports.includes(viewportId)
			)
				return;
		}

		if (filterCriteria) {
			for (let i = 0; i < filterCriteria.length; i++) {
				// if the filter criteria returns false, skip the intersection test
				// the filter criteria per geometryData is then evaluated in the intersectionTest method
				if (filterCriteria[i](node))
					return this.intersectionTest(
						ray,
						node,
						geometryData,
						viewportId,
						rayCasterParams,
						filterCriteria,
						instancedIntersectionCache,
						batchedIntersectionCache,
					);
			}
		} else {
			return this.intersectionTest(
				ray,
				node,
				geometryData,
				viewportId,
				rayCasterParams,
				undefined,
				instancedIntersectionCache,
				batchedIntersectionCache,
			);
		}
	}

	// #endregion Public Methods (2)

	// #region Private Methods (5)

	private hierarchyFor(viewportId: string): NodeBoundsHierarchy {
		const key = viewportId ?? "";
		let hierarchy = this._hierarchies.get(key);
		if (!hierarchy) {
			hierarchy = new NodeBoundsHierarchy(viewportId);
			hierarchy.setNodes(this._intersectNodes);
			this._hierarchies.set(key, hierarchy);
		}
		return hierarchy;
	}

	private toThreeRay(ray: IRay): THREE.Ray {
		return this._candidateRay.set(
			this._candidateOrigin.set(
				ray.origin[0],
				ray.origin[1],
				ray.origin[2],
			),
			this._candidateDirection.set(
				ray.direction[0],
				ray.direction[1],
				ray.direction[2],
			),
		);
	}

	/**
	 * Raycast the object and its children like `intersectObject`, but leave
	 * out the hidden source meshes of batched members: the BatchedMesh
	 * returns those hits, and three r184 raycasts `visible === false`.
	 * `raycast` of the other objects is still called, so a silenced one
	 * stays silent.
	 */
	private intersectSkippingBatchedSources(
		object: THREE.Object3D,
		output: THREE.Intersection[] = [],
	): THREE.Intersection[] {
		if (object.userData.batchedMesh == null)
			this._raycaster.intersectObject(object, false, output);
		for (let i = 0; i < object.children.length; i++)
			this.intersectSkippingBatchedSources(object.children[i], output);
		return output;
	}

	/**
	 * Whether the ray can hit the member of the batch that the hidden source
	 * mesh stands for. The sphere is the one `BatchedMesh.raycast` tests for
	 * that instance: the bounds of the batch geometry under the world matrix
	 * of the instance. `intersectsSphere` needs a ray of unit length, and
	 * the ray of a pick may not have one.
	 */
	private rayHitsMemberBounds(
		ray: THREE.Ray,
		member: THREE.Object3D,
		batch: THREE.BatchedMesh,
	): boolean {
		const batchId = member.userData.batchId as number | undefined;
		if (batchId === undefined) return true;
		let sphere: THREE.Sphere | null;
		try {
			// These throw for an instance that is inactive or out of range.
			// Then the batch is tested, as it was before this check.
			sphere = batch.getBoundingSphereAt(
				batch.getGeometryIdAt(batchId),
				this._memberSphere,
			);
			if (!sphere) return true;
			batch.getMatrixAt(batchId, this._instanceMatrix);
		} catch {
			return true;
		}
		this._instanceWorldMatrix.multiplyMatrices(
			batch.matrixWorld,
			this._instanceMatrix,
		);
		sphere.applyMatrix4(this._instanceWorldMatrix);
		sphere.radius += Math.max(1e-6, 1e-6 * sphere.radius);
		this._unitRay.copy(ray);
		this._unitRay.direction.normalize();
		return this._unitRay.intersectsSphere(sphere);
	}

	/**
	 * Gather all nodes that contain geometry data.
	 */
	private gatherNodes() {
		this._intersectNodes = [];
		this._hierarchies.clear();
		this._tree.root.traverse((node) => {
			if (node.visible === false) return;
			if (node.intersectionTest === false) return;

			for (let i = 0; i < node.data.length; i++) {
				if (node.data[i] instanceof GeometryData) {
					const geometryData: GeometryData = node.data[
						i
					] as GeometryData;
					let tempNode = node;
					let visible = true,
						restrictViewports: string[] = [],
						excludeViewports: string[] = [];
					while (tempNode.parent) {
						visible = tempNode.visible && visible;
						restrictViewports = restrictViewports.concat(
							tempNode.restrictViewports,
						);
						excludeViewports = excludeViewports.concat(
							tempNode.excludeViewports,
						);
						tempNode = tempNode.parent;
					}

					this._intersectNodes.push({
						node,
						geometryData: {
							[`${geometryData.id}_${geometryData.version}`]:
								geometryData,
						},
						visible,
						restrictViewports: [...new Set(restrictViewports)],
						excludeViewports: [...new Set(excludeViewports)],
					});
				}
			}
		});
	}

	/**
	 * Do the intersection test with the ray and the node.
	 *
	 * @param ray the ray to test
	 * @param node the node to test
	 * @param geometryData the geometry data of the node
	 * @param viewportId the viewport id
	 * @returns
	 */
	private intersectionTest(
		ray: IRay,
		node: ITreeNode,
		geometryData: {[key: string]: GeometryData},
		viewportId: string,
		rayCasterParams?: THREE.RaycasterParameters,
		filterCriteria?: IIntersectionFilter[],
		instancedIntersectionCache: Map<
			THREE.InstancedMesh,
			THREE.Intersection[]
		> = new Map(),
		batchedIntersectionCache: Map<
			THREE.BatchedMesh,
			THREE.Intersection[]
		> = new Map(),
	): IRayTracingIntersection[] | undefined {
		if (rayCasterParams) this._raycaster.params = rayCasterParams;

		this._raycaster.ray.direction.set(
			ray.direction[0],
			ray.direction[1],
			ray.direction[2],
		);
		this._raycaster.ray.origin.set(
			ray.origin[0],
			ray.origin[1],
			ray.origin[2],
		);

		const geometryValues = Object.values(geometryData);
		const instancedMeshes = new Set<THREE.InstancedMesh>();
		geometryValues.forEach((geometry) => {
			const convertedObject = geometry.convertedObject[viewportId];
			if (!(convertedObject instanceof THREE.InstancedMesh)) return;

			const instanceHash = convertedObject.userData.instanceHash as
				| string
				| undefined;
			const groupMeshes = convertedObject.parent?.children.filter(
				(child): child is THREE.InstancedMesh =>
					child instanceof THREE.InstancedMesh &&
					child.userData.instanceHash === instanceHash,
			) ?? [convertedObject];
			groupMeshes.forEach((mesh) => instancedMeshes.add(mesh));
		});

		let intersections: IRayTracingIntersection[] = [];
		instancedMeshes.forEach((mesh) => {
			let meshIntersections = instancedIntersectionCache.get(mesh);
			if (!meshIntersections) {
				meshIntersections = this._raycaster.intersectObject(
					mesh,
					false,
				);
				instancedIntersectionCache.set(mesh, meshIntersections);
			}

			const instanceHash = mesh.userData.instanceHash as
				| string
				| undefined;
			const instanceNodes = mesh.userData.instanceNodes as
				| (ITreeNode | undefined)[]
				| undefined;
			meshIntersections.forEach((intersection) => {
				const hitNode =
					intersection.instanceId !== undefined && instanceNodes
						? instanceNodes[intersection.instanceId]
						: undefined;
				if (!hitNode || !this.isNodeWithinOwner(hitNode, node)) return;
				if (
					hitNode.intersectionTest === false ||
					hitNode.visible === false
				)
					return;
				if (
					viewportId &&
					hitNode.excludeViewports?.includes(viewportId)
				)
					return;
				if (
					viewportId &&
					hitNode.restrictViewports?.length &&
					!hitNode.restrictViewports.includes(viewportId)
				)
					return;

				const hitGeometry = this.resolveInstancedGeometry(
					hitNode,
					mesh,
					intersection.instanceId,
					instanceHash,
					geometryValues.find(
						(geometry) =>
							(
								geometry as GeometryData & {
									instanceHash?: string;
								}
							).instanceHash === instanceHash,
					),
				);
				if (!hitGeometry || !geometryValues.includes(hitGeometry))
					return;

				intersections.push({
					distance: intersection.distance,
					point: [
						intersection.point.x,
						intersection.point.y,
						intersection.point.z,
					],
					normal: this.worldFaceNormal(intersection),
					node,
					geometryData: hitGeometry,
					type: "RayTracingIntersection",
				});
			});
		});

		const batchedMeshes = new Set<THREE.BatchedMesh>();
		const convertedNode = node.convertedObject[viewportId!] as
			| THREE.Object3D
			| undefined;
		convertedNode?.traverse((child) => {
			const batch = child.userData.batchedMesh as
				| THREE.BatchedMesh
				| undefined;
			// A batch is only tested if the ray can hit one of its members
			// of this node (the batch raycast visits every instance).
			if (
				batch &&
				!batchedMeshes.has(batch) &&
				this.rayHitsMemberBounds(this._raycaster.ray, child, batch)
			)
				batchedMeshes.add(batch);
		});
		batchedMeshes.forEach((mesh) => {
			let meshIntersections = batchedIntersectionCache.get(mesh);
			if (!meshIntersections) {
				meshIntersections = this._raycaster.intersectObject(
					mesh,
					false,
				);
				batchedIntersectionCache.set(mesh, meshIntersections);
			}
			const batchNodes = mesh.userData.batchNodes as
				| (ITreeNode | undefined)[]
				| undefined;
			const batchKeys = mesh.userData.batchKeys as
				| (string | undefined)[]
				| undefined;
			const batchGeometries = mesh.userData.batchGeometries as
				| (GeometryData | undefined)[]
				| undefined;
			meshIntersections.forEach((intersection) => {
				const batchId = intersection.batchId;
				const hitNode =
					batchId !== undefined ? batchNodes?.[batchId] : undefined;
				if (!hitNode || !this.isNodeWithinOwner(hitNode, node)) return;
				if (
					hitNode.intersectionTest === false ||
					hitNode.visible === false
				)
					return;
				if (
					viewportId &&
					hitNode.excludeViewports?.includes(viewportId)
				)
					return;
				if (
					viewportId &&
					hitNode.restrictViewports?.length &&
					!hitNode.restrictViewports.includes(viewportId)
				)
					return;
				const hitGeometry = this.resolveBatchedGeometry(
					hitNode,
					batchId,
					batchKeys,
					batchGeometries,
				);
				if (!hitGeometry || !geometryValues.includes(hitGeometry))
					return;
				intersections.push({
					distance: intersection.distance,
					point: [
						intersection.point.x,
						intersection.point.y,
						intersection.point.z,
					],
					normal: this.worldFaceNormal(intersection),
					node,
					geometryData: hitGeometry,
					type: "RayTracingIntersection",
				});
			});
		});

		// Standard (non-instanced) path
		const threeJsObject = node.convertedObject[
			viewportId!
		] as THREE.Object3D;
		if (threeJsObject) {
			// A batched member is already returned from the BatchedMesh, so
			// its hidden source mesh would be a second hit of the same
			// surface. It is not raycast at all.
			const intersectionThree = this.intersectSkippingBatchedSources(
				threeJsObject,
			).sort((a, b) => a.distance - b.distance);
			intersections = intersections.concat(
				intersectionThree.map((i) => {
					const parent = i.object.parent as {
						SDid?: string;
						SDversion?: string;
					} | null;
					const material = (i.object as THREE.Mesh).material;
					const materialOpacity = Array.isArray(material)
						? material.map((entry) => entry.opacity)
						: material?.opacity;
					const intersectionDefinition: IRayTracingIntersection & {
						occludePrimitive?: {
							objectType: string;
							materialOpacity?: number | number[];
						};
					} = {
						distance: i.distance,
						point: [i.point.x, i.point.y, i.point.z],
						node: node,
						geometryData:
							geometryData[
								`${parent?.SDid}_${parent?.SDversion}`
							],
						normal: this.worldFaceNormal(i),
						type: "RayTracingIntersection",
						occludePrimitive: {
							objectType: i.object.type,
							materialOpacity,
						},
					};
					return intersectionDefinition;
				}),
			);
		}

		if (filterCriteria) {
			intersections = intersections.filter((intersection) =>
				filterCriteria.some((filter) =>
					filter(node, intersection.geometryData),
				),
			);
		}
		intersections.sort((a, b) => a.distance - b.distance);
		return intersections.length > 0 ? intersections : undefined;
	}

	/**
	 * Geometric face normal in world space.
	 * Three.js keeps `face.normal` in the mesh's local space. An instanced
	 * hit also needs that instance's matrix.
	 */
	private worldFaceNormal(
		intersection: THREE.Intersection,
	): [number, number, number] | undefined {
		const local = intersection.face?.normal;
		if (!local) return undefined;
		const object = intersection.object;
		let worldMatrix = object.matrixWorld;
		const batchedId =
			object instanceof THREE.BatchedMesh
				? intersection.batchId
				: undefined;
		const instancedId =
			object instanceof THREE.InstancedMesh
				? intersection.instanceId
				: undefined;
		const perObjectId = batchedId ?? instancedId;
		if (
			perObjectId !== undefined &&
			(object instanceof THREE.BatchedMesh ||
				object instanceof THREE.InstancedMesh)
		) {
			object.getMatrixAt(perObjectId, this._instanceMatrix);
			this._instanceWorldMatrix.multiplyMatrices(
				object.matrixWorld,
				this._instanceMatrix,
			);
			worldMatrix = this._instanceWorldMatrix;
		}
		this._normalMatrix.getNormalMatrix(worldMatrix);
		this._worldNormal.copy(local).applyMatrix3(this._normalMatrix);
		if (this._worldNormal.lengthSq() < 1e-20) return undefined;
		this._worldNormal.normalize();
		return [this._worldNormal.x, this._worldNormal.y, this._worldNormal.z];
	}

	private isNodeWithinOwner(node: ITreeNode, owner: ITreeNode): boolean {
		let currentNode: ITreeNode | undefined = node;
		while (currentNode) {
			if (currentNode === owner) return true;
			currentNode = currentNode.parent;
		}
		return false;
	}

	/**
	 * Map an InstancedMesh hit to the GeometryData for that slot. The slot key
	 * is `${node.id}:${geometry.id}`; falling back to the first matching hash
	 * would pick the wrong primitive when one node has several identical ones.
	 */
	private resolveBatchedGeometry(
		hitNode: ITreeNode,
		batchId: number | undefined,
		batchKeys: (string | undefined)[] | undefined,
		batchGeometries: (GeometryData | undefined)[] | undefined,
	): GeometryData | undefined {
		if (batchId === undefined) return undefined;
		const stored = batchGeometries?.[batchId];
		if (stored && hitNode.data.includes(stored)) return stored;
		const nodeKey = batchKeys?.[batchId];
		const prefix = hitNode.id + ":";
		const geometryId = nodeKey?.startsWith(prefix)
			? nodeKey.slice(prefix.length)
			: undefined;
		if (!geometryId) return stored;
		return (
			(hitNode.data.find(
				(data) =>
					data instanceof GeometryData && data.id === geometryId,
			) as GeometryData | undefined) ?? stored
		);
	}

	private resolveInstancedGeometry(
		hitNode: ITreeNode,
		mesh: THREE.InstancedMesh,
		instanceId: number | undefined,
		instanceHash: string | undefined,
		fallback: GeometryData | undefined,
	): GeometryData | undefined {
		const instanceKeys = mesh.userData.instanceKeys as
			| (string | undefined)[]
			| undefined;
		const nodeKey =
			instanceId !== undefined ? instanceKeys?.[instanceId] : undefined;
		const prefix = hitNode.id + ":";
		const geometryId = nodeKey?.startsWith(prefix)
			? nodeKey.slice(prefix.length)
			: undefined;
		if (geometryId) {
			const byId = hitNode.data.find(
				(d) => d instanceof GeometryData && d.id === geometryId,
			) as GeometryData | undefined;
			if (byId) return byId;
		}
		return (
			(hitNode.data.find(
				(d) =>
					d instanceof GeometryData &&
					(
						d as GeometryData & {
							instanceHash?: string;
						}
					).instanceHash === instanceHash,
			) as GeometryData | undefined) ?? fallback
		);
	}

	// #endregion Private Methods (5)
}
