import {viewports} from "@shapediver/viewer";
import {
	IIntersectionEngine,
	IntersectionEngine,
	RaycasterParameters,
} from "@shapediver/viewer.rendering-engine.intersection-engine";
import {ITree, ITreeNode, Tree} from "@shapediver/viewer.shared.node-tree";
import {EventEngine, EVENTTYPE} from "@shapediver/viewer.shared.services";
import {
	GeometryData,
	IBoxSelectionIntersection,
	IIntersectionDefinition,
	IIntersectionFilter,
	IRay,
	IRayTracingIntersection,
} from "@shapediver/viewer.shared.types";
import {vec3} from "gl-matrix";
import * as THREE from "three";
import {InteractionData} from "./InteractionData";

export class IntersectionManager implements IIntersectionEngine {
	// #region Properties (5)

	private readonly _eventEngine: EventEngine = EventEngine.instance;
	private readonly _intersectionEngine: IntersectionEngine =
		IntersectionEngine.instance;
	private readonly _tree: ITree = Tree.instance;

	private static _instance: IntersectionManager;

	private _intersectNodes: {
		node: ITreeNode;
		geometryData: {[key: string]: GeometryData};
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

	// #region Public Methods (1)

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

	private getSelectionBoxObjects(
		viewportId: string,
		filterCriteria: IIntersectionFilter[],
		selectionBoxCoordinates: {
			start: {x: number; y: number};
			end: {x: number; y: number};
		},
	): IBoxSelectionIntersection[] {
		// get the viewport
		const viewport = Object.values(viewports).find(
			(v) => v.id === viewportId,
		);
		if (!viewport) return [];

		// get the current camera
		const camera = viewport.camera;
		if (!camera) return [];

		const minX = Math.min(
			selectionBoxCoordinates.start.x,
			selectionBoxCoordinates.end.x,
		);
		const maxX = Math.max(
			selectionBoxCoordinates.start.x,
			selectionBoxCoordinates.end.x,
		);
		const minY = Math.min(
			selectionBoxCoordinates.start.y,
			selectionBoxCoordinates.end.y,
		);

		const maxY = Math.max(
			selectionBoxCoordinates.start.y,
			selectionBoxCoordinates.end.y,
		);

		// check if the selection is from the right or left side
		const isRightSelection =
			selectionBoxCoordinates.start.x < selectionBoxCoordinates.end.x;

		// for all nodes that can be intersected
		// check if the bounding sphere center is within the selection box
		const selectedObjects: IBoxSelectionIntersection[] = [];
		this._intersectNodes.forEach((i) => {
			const shouldTest = filterCriteria
				? filterCriteria.some((fc) => fc(i.node))
				: true;
			if (!shouldTest) return;

			// for the selection from the right side, all points of the bounding box have to be included
			let isIncluded = false;
			let breakLoop = false;
			for (let xPoint of [
				i.node.boundingBox.min[0],
				i.node.boundingBox.max[0],
			]) {
				for (let yPoint of [
					i.node.boundingBox.min[1],
					i.node.boundingBox.max[1],
				]) {
					for (let zPoint of [
						i.node.boundingBox.min[2],
						i.node.boundingBox.max[2],
					]) {
						const projection = camera.project(
							vec3.fromValues(xPoint, yPoint, zPoint),
						);

						if (isRightSelection) {
							if (
								!(
									projection[0] >= minX &&
									projection[0] <= maxX &&
									projection[1] >= minY &&
									projection[1] <= maxY
								)
							) {
								isIncluded = false;
								breakLoop = true;
							} else {
								isIncluded = true;
							}
						} else {
							if (
								projection[0] >= minX &&
								projection[0] <= maxX &&
								projection[1] >= minY &&
								projection[1] <= maxY
							) {
								isIncluded = true;
								breakLoop = true;
							}
						}

						if (breakLoop) break;
					}
					if (breakLoop) break;
				}
				if (breakLoop) break;
			}

			if (isIncluded) {
				selectedObjects.push({
					node: i.node,
					type: "BoxSelectionIntersection",
				});
			}
		});
		return selectedObjects;
	}

	public intersect(
		ray: IRay,
		viewportId: string,
		filterCriteria: IIntersectionFilter[] = [],
		options?: {
			rayCasterParams?: THREE.RaycasterParameters;
			selectionBoxCoordinates?: {
				start: {x: number; y: number};
				end: {x: number; y: number};
			};
		},
	): IIntersectionDefinition[] {
		if (options?.selectionBoxCoordinates) {
			// box selection
			return this.getSelectionBoxObjects(
				viewportId,
				filterCriteria,
				options.selectionBoxCoordinates,
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

	// #endregion Public Methods (1)

	// #region Private Methods (1)

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

	// #endregion Private Methods (1)
}
