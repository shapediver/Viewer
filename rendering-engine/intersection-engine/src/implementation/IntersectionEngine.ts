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
import {SelectionBox} from "./SelectionBox";

export class IntersectionEngine implements IIntersectionEngine {
	// #region Properties (5)

	private readonly _eventEngine: EventEngine = EventEngine.instance;
	private readonly _raycaster: THREE.Raycaster = new THREE.Raycaster();
	private readonly _tree: ITree = Tree.instance;

	private static _instance: IntersectionEngine;

	private _intersectNodes: {
		node: ITreeNode;
		geometryData: {[key: string]: GeometryData};
		visible: boolean;
		excludeViewports: string[];
		restrictViewports: string[];
	}[] = [];

	// #endregion Properties (5)

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
			let intersections: IRayTracingIntersection[] = [];
			this._intersectNodes.forEach((i) => {
				const currentIntersections = this.intersectNode(
					ray,
					i.node,
					i.geometryData,
					viewportId,
					filterCriteria,
					options?.rayCasterParams,
					instancedIntersectionCache,
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
			);
		}
	}

	// #endregion Public Methods (2)

	// #region Private Methods (3)

	/**
	 * Gather all nodes that contain geometry data.
	 */
	private gatherNodes() {
		this._intersectNodes = [];
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
			const intersectionThree =
				this._raycaster.intersectObject(threeJsObject);
			intersections = intersections.concat(
				intersectionThree.map((i) => {
					const intersectionDefinition: IRayTracingIntersection = {
						distance: i.distance,
						point: [i.point.x, i.point.y, i.point.z],
						node: node,
						geometryData:
							geometryData[
								`${(i.object.parent as any).SDid}_${(i.object.parent as any).SDversion}`
							],
						type: "RayTracingIntersection",
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

	// #endregion Private Methods (3)
}
