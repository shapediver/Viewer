import * as THREE from "three";

import {
	IIntersectionEngine,
	IntersectionEngine,
	RaycasterParameters,
	SelectionBox,
} from "@shapediver/viewer.rendering-engine.intersection-engine";
import {ITree, ITreeNode, Tree} from "@shapediver/viewer.shared.node-tree";
import {EventEngine, EVENTTYPE} from "@shapediver/viewer.shared.services";
import {
	GeometryData,
	IIntersectionDefinition,
	IIntersectionFilter,
	IRay,
	IRayTracingIntersection,
} from "@shapediver/viewer.shared.types";

import {InteractionData} from "./InteractionData";

export class IntersectionManager implements IIntersectionEngine {
	private readonly _eventEngine: EventEngine = EventEngine.instance;
	private readonly _intersectionEngine: IntersectionEngine =
		IntersectionEngine.instance;
	private readonly _tree: ITree = Tree.instance;

	private static _instance: IntersectionManager;

	private _intersectNodes: {
		node: ITreeNode;
		geometryData: {[key: string]: GeometryData};
	}[] = [];

	private constructor() {
		this.gatherNodes();
		this._eventEngine.addListener(
			EVENTTYPE.VIEWPORT.VIEWPORT_UPDATED,
			() => {
				this.gatherNodes();
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
				this._intersectNodes.map((n) => n.node),
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

	private gatherGeometryData(node: ITreeNode): {[key: string]: GeometryData} {
		const geometryData: {[key: string]: GeometryData} = {};
		node.traverseData((d) => {
			if (d instanceof GeometryData) {
				geometryData[`${d.id}_${d.version}`] = d;
				d.updateCallback = (newVersion: string, oldVersion: string) => {
					if (geometryData[`${d.id}_${oldVersion}`]) {
						geometryData[`${d.id}_${newVersion}`] =
							geometryData[`${d.id}_${oldVersion}`];
						delete geometryData[`${d.id}_${oldVersion}`];
					}
				};
			}
		});
		return geometryData;
	}

	private gatherNodes() {
		this._intersectNodes = [];
		this._tree.root.traverse((node) => {
			if (node.visible === false) return;
			if (node.intersectionTest === false) return;

			for (let i = 0; i < node.data.length; i++) {
				if (node.data[i] instanceof InteractionData) {
					const geometryData: {[key: string]: GeometryData} =
						this.gatherGeometryData(node);

					node.updateCallback = () => {
						const index = this._intersectNodes.findIndex(
							(n) => n.node === node,
						);
						if (index !== -1) {
							this._intersectNodes[index].geometryData =
								this.gatherGeometryData(node);
						}
					};

					this._intersectNodes.push({
						node: node,
						geometryData: geometryData,
					});
				}
			}
		});
	}

	private intersectNodes(
		ray: IRay,
		viewportId: string,
		filterCriteria: IIntersectionFilter[] = [],
		rayCasterParams?: RaycasterParameters,
	): IRayTracingIntersection[] {
		let intersections: IRayTracingIntersection[] = [];

		// intersect all nodes
		this._intersectNodes.forEach((i) => {
			const currentIntersection = this._intersectionEngine.intersectNode(
				ray,
				i.node,
				i.geometryData,
				viewportId,
				filterCriteria,
				rayCasterParams,
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
