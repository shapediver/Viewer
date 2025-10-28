import {
	FLAG_TYPE,
	IGeometryData,
	IMaterialAbstractData,
	IViewportApi,
} from "@shapediver/viewer";
import {
	LineRestrictionProperties,
	PlaneRestrictionProperties,
	PointRestrictionProperties,
	RayTraceResult,
	RestrictionManager,
	RestrictionProperties,
	RESTRICTION_TYPE,
} from "@shapediver/viewer.rendering-engine.intersection-restriction-engine";
import {
	ITransformation,
	ITreeNode,
	Tree,
} from "@shapediver/viewer.shared.node-tree";
import {
	EventEngine,
	EVENTTYPE,
	Logger,
	UuidGenerator,
} from "@shapediver/viewer.shared.services";
import {
	IIntersectionDefinition,
	IIntersectionFilter,
	IRay,
	IRayTracingIntersection,
} from "@shapediver/viewer.shared.types";

import {mat4, vec3} from "gl-matrix";

import {IDragEvent} from "../../interfaces/events/IDragEvent";
import {INTERACTION_STATE} from "../../interfaces/IInteractionEngine";
import {IInteractionFilterOptions} from "../../interfaces/IInteractionManager";
import {IDragConstraint} from "../../interfaces/utils/IDragConstraint";
import {IInteractionEffect} from "../../interfaces/utils/IInteractionEffectUtils";
import {AbstractInteractionManager} from "../AbstractInteractionManager";
import {CameraPlaneConstraint} from "../dragConstraints/CameraPlaneConstraint";
import {LineConstraint} from "../dragConstraints/LineConstraint";
import {PlaneConstraint} from "../dragConstraints/PlaneConstraint";
import {PointConstraint} from "../dragConstraints/PointConstraint";
import {IDragAnchor, InteractionData} from "../InteractionData";

/* eslint-disable @typescript-eslint/no-unused-vars */
export class DragManager extends AbstractInteractionManager {
	readonly #eventEngine: EventEngine = EventEngine.instance;
	readonly #logger: Logger = Logger.instance;
	readonly #tree: Tree = Tree.instance;
	readonly #uuidGenerator: UuidGenerator = UuidGenerator.instance;

	#draggedNode?: {
		node: ITreeNode;
		worldMatrix: mat4;
		worldMatrixInverse: mat4;
		previousDragMatrix: mat4;
		dragAnchors: IDragAnchor[];
		dragOrigin: vec3;
	};
	#filter: IInteractionFilterOptions = (
		interactionState: INTERACTION_STATE,
	): IIntersectionFilter => {
		if (interactionState === INTERACTION_STATE.DOWN) {
			return (node: ITreeNode) => {
				return !!this.getInteractionData(node, false);
			};
		}

		return (node: ITreeNode) => false;
	};
	#groupInteractionEffectToken?: string[];
	#groupedNodes?: ITreeNode[];
	#interactionEffectToken?: string;
	#intersection: IRayTracingIntersection | null = null;
	#restrictionManager?: RestrictionManager;
	#setupOptions: {
		viewport: IViewportApi;
		node: ITreeNode;
		ray: IRay;
		intersection: IRayTracingIntersection;
	} | null = null;
	#tokenCameraFreeze!: string;
	#tokenContinuousRendering!: string;
	#tokenContinuousShadowMapUpdate!: string;

	constructor(
		id?: string,
		interactionEffect?: IInteractionEffect | IMaterialAbstractData,
	) {
		super(id, interactionEffect);
	}

	public get filter(): IInteractionFilterOptions {
		return this.#filter;
	}

	public add(viewport: IViewportApi): void {
		this.viewport = viewport;
		this.#restrictionManager = new RestrictionManager(this.viewport!);
	}

	/**
	 * Add a new drag constraint.
	 * Returns a token that is used for removing the drag constraint via {@link removeRestriction}.
	 *
	 * @deprecated This method is deprecated. Please use {@link addRestriction} instead.
	 * @param constraint
	 * @returns
	 */
	public addDragConstraint(constraint: IDragConstraint): string | undefined {
		if (!this.#restrictionManager) {
			this.#logger.warn(
				"The interaction manager does not belong to an interaction engine. Please add it to one first.",
			);
			return;
		}
		Logger.instance.warn(
			"The method addDragConstraint is deprecated. Please use addRestriction instead.",
		);

		const token = this.#uuidGenerator.create();
		if (constraint instanceof PointConstraint) {
			this.#restrictionManager.addRestriction({
				type: RESTRICTION_TYPE.POINT,
				id: token,
				point: constraint.point,
				radius: constraint.radius,
				rotation: constraint.rotation,
			} as PointRestrictionProperties)!;
		} else if (constraint instanceof LineConstraint) {
			this.#restrictionManager.addRestriction({
				type: RESTRICTION_TYPE.LINE,
				id: token,
				point1: constraint.point1,
				point2: constraint.point2,
				radius: constraint.radius,
				rotation: constraint.rotation,
			} as LineRestrictionProperties)!;
		} else if (constraint instanceof CameraPlaneConstraint) {
			this.#restrictionManager.addRestriction({
				type: RESTRICTION_TYPE.CAMERA_PLANE,
				id: token,
			})!;
		} else if (constraint instanceof PlaneConstraint) {
			const origin = constraint.coplanarPoint
				? vec3.clone(constraint.coplanarPoint)
				: vec3.fromValues(0, 0, 0);
			const normal = vec3.normalize(vec3.create(), constraint.normal);

			const vector_u = vec3.create();
			const vector_v = vec3.create();

			if (Math.abs(vec3.dot(normal, vec3.fromValues(0, 0, 1))) < 0.999) {
				vec3.cross(vector_u, normal, vec3.fromValues(0, 0, 1));
			} else {
				vec3.cross(vector_u, normal, vec3.fromValues(0, 1, 0));
			}

			vec3.normalize(vector_u, vector_u);
			vec3.cross(vector_v, normal, vector_u);
			vec3.normalize(vector_v, vector_v);

			this.#restrictionManager.addRestriction({
				type: RESTRICTION_TYPE.PLANE,
				id: token,
				vector_u,
				vector_v,
				rotation: constraint.rotation,
				origin,
			} as PlaneRestrictionProperties)!;
		}

		return token;
	}

	/**
	 * Add a new restriction.
	 * Returns a token that is used for removing the restriction via {@link removeRestriction}.
	 *
	 * @param properties
	 * @returns
	 */
	public addRestriction(
		properties: RestrictionProperties,
	): string | undefined {
		if (!this.#restrictionManager) {
			this.#logger.warn(
				"The interaction manager does not belong to an interaction engine. Please add it to one first.",
			);
			return;
		}
		return this.#restrictionManager.addRestriction(properties);
	}

	public onDown(
		event: PointerEvent,
		ray: IRay,
		intersection: IIntersectionDefinition[],
	): void {
		if (!this.viewport) {
			this.#logger.warn(
				"The interaction manager does not belong to an interaction engine. Please add it to one first.",
			);
			return;
		}
		const intersections: IRayTracingIntersection[] = intersection.filter(
			(i) =>
				this.filter(INTERACTION_STATE.DOWN)(i.node) &&
				i.type === "RayTracingIntersection",
		) as IRayTracingIntersection[];

		// create a list that replaces all irrelevant intersections with null
		const filteredIntersections = intersections.map((i) => {
			return this.getInteractionData(i.node, true) ? i : null;
		});

		const firstIntersection =
			filteredIntersections.length > 0 ? filteredIntersections[0] : null;

		if (firstIntersection) {
			this.setNode(
				firstIntersection.node,
				firstIntersection.geometryData,
				firstIntersection.distance,
				firstIntersection.point,
				event,
				ray,
			);
			this.#restrictionManager!.showRestrictionVisualization = true;
		}
	}

	public onEnd(
		event: PointerEvent,
		ray: IRay,
		intersection: IIntersectionDefinition[],
		endState: INTERACTION_STATE,
	): void {
		if (!this.viewport) {
			this.#logger.warn(
				"The interaction manager does not belong to an interaction engine. Please add it to one first.",
			);
			return;
		}

		this.#restrictionManager!.showRestrictionVisualization = false;
		if (!this.#draggedNode) return;

		const transformationResult = this.#restrictionManager!.rayTrace(ray, {
			type: "dragging",
			dragAnchors: this.#draggedNode.dragAnchors,
			dragOrigin: this.#draggedNode.dragOrigin,
			node: this.#draggedNode.node,
			startPoint: this.#draggedNode.dragOrigin,
		});
		const transformationMatrix = mat4.multiply(
			mat4.create(),
			mat4.multiply(
				mat4.create(),
				this.#draggedNode.worldMatrixInverse,
				transformationResult?.transformation || mat4.create(),
			),
			this.#draggedNode.worldMatrix,
		);

		// apply the transformation for the main node
		this.applyTransformation(this.#draggedNode.node, transformationMatrix);
		this.viewport.updateNodeTransformation(this.#draggedNode.node);

		// and apply it for all grouped nodes
		if (this.#groupedNodes) {
			this.#groupedNodes.forEach((n) => {
				this.applyTransformation(n, transformationMatrix!);
				this.viewport!.updateNodeTransformation(n);
			});
		}

		this.removeNode(event, ray);
	}

	public onKeyDown(event: KeyboardEvent): void {}

	public onKeyUp(event: KeyboardEvent): void {}

	public onMove(
		event: PointerEvent,
		ray: IRay,
		intersection: IIntersectionDefinition[],
	): void {
		if (!this.viewport) {
			this.#logger.warn(
				"The interaction manager does not belong to an interaction engine. Please add it to one first.",
			);
			return;
		}
		if (!this.#draggedNode) return;
		this.#restrictionManager!.showRestrictionVisualization = true;

		const interactionData = this.getInteractionData(
			this.#draggedNode.node,
			true,
		);
		const transformationResult = this.#restrictionManager!.rayTrace(ray, {
			type: "dragging",
			dragAnchors: this.#draggedNode.dragAnchors,
			dragOrigin: this.#draggedNode.dragOrigin,
			node: this.#draggedNode.node,
			startPoint: this.#draggedNode.dragOrigin,
		});
		const transformationMatrix = mat4.multiply(
			mat4.create(),
			mat4.multiply(
				mat4.create(),
				this.#draggedNode.worldMatrixInverse,
				transformationResult?.transformation || mat4.create(),
			),
			this.#draggedNode.worldMatrix,
		);

		// apply the transformation for the main node
		this.applyTransformation(this.#draggedNode.node, transformationMatrix);
		this.viewport.updateNodeTransformation(this.#draggedNode.node);

		// and apply it for all grouped nodes
		if (this.#groupedNodes) {
			this.#groupedNodes.forEach((n) => {
				this.applyTransformation(n, transformationMatrix!);
				this.viewport!.updateNodeTransformation(n);
			});
		}

		this.#eventEngine.emitEvent(EVENTTYPE.INTERACTION.DRAG_MOVE, {
			viewportId: this.viewport.id,
			node: this.#draggedNode.node,
			matrix: transformationMatrix,
			ray,
			event,
			restriction: transformationResult?.restriction,
			dragAnchor: transformationResult?.dragAnchor,
			manager: this,
			groupedNodes: this.#groupedNodes,
		} as IDragEvent);
	}

	public remove(): void {
		this.removeNode();
		this.viewport = undefined;
	}

	/**
	 * Remove the drag constraint that was added via {@link removeRestriction}.
	 *
	 * @deprecated This method is deprecated. Please use {@link removeRestriction} instead.
	 * @param token
	 * @returns
	 */
	public removeDragConstraint(token: string): boolean {
		if (!this.#restrictionManager) {
			this.#logger.warn(
				"The interaction manager does not belong to an interaction engine. Please add it to one first.",
			);
			return false;
		}
		return this.#restrictionManager.removeRestriction(token);
	}

	/**
	 * Remove the node as the currently used drag node.
	 *
	 * @returns
	 */
	public removeNode(event?: PointerEvent, ray?: IRay) {
		if (!this.viewport) {
			this.#logger.warn(
				"The interaction manager does not belong to an interaction engine. Please add it to one first.",
			);
			return;
		}
		if (!this.#draggedNode) return;

		this.#restrictionManager!.showRestrictionVisualization = false;

		let transformationMatrix: mat4 | undefined,
			transformationResult: RayTraceResult | undefined;

		// if we have everything we need (the ray) than we try one last time to calculate the transformation
		if (ray) {
			const interactionData = this.getInteractionData(
				this.#draggedNode.node,
				true,
			);
			transformationResult = this.#restrictionManager!.rayTrace(ray, {
				type: "dragging",
				dragAnchors: this.#draggedNode.dragAnchors,
				dragOrigin: this.#draggedNode.dragOrigin,
				node: this.#draggedNode.node,
				startPoint: this.#draggedNode.dragOrigin,
			});
			transformationMatrix = mat4.multiply(
				mat4.create(),
				mat4.multiply(
					mat4.create(),
					this.#draggedNode.worldMatrixInverse,
					transformationResult?.transformation || mat4.create(),
				),
				this.#draggedNode.worldMatrix,
			);

			// apply the transformation for the main node
			this.applyTransformation(
				this.#draggedNode.node,
				transformationMatrix,
			);
			this.viewport.updateNodeTransformation(this.#draggedNode.node);

			// and apply it for all grouped nodes
			if (this.#groupedNodes) {
				this.#groupedNodes.forEach((n) => {
					this.applyTransformation(n, transformationMatrix!);
					this.viewport!.updateNodeTransformation(n);
				});
			}
		} else {
			transformationMatrix = this.#draggedNode.node.transformations.find(
				(t: ITransformation) => t.id === "SD_drag_matrix",
			)?.matrix;
		}

		this.#eventEngine.emitEvent(EVENTTYPE.INTERACTION.DRAG_END, {
			viewportId: this.viewport.id,
			node: this.#draggedNode.node,
			matrix: transformationMatrix,
			event,
			ray,
			restriction: transformationResult?.restriction,
			dragAnchor: transformationResult?.dragAnchor,
			manager: this,
			groupedNodes: this.#groupedNodes,
		} as IDragEvent);
		this.#setupOptions = null;

		// optional removal
		// this.removeTransformation(this.#draggedNode.node);
		this.viewport.updateNode(this.#draggedNode.node);

		// and update all grouped nodes
		if (this.#groupedNodes)
			this.#groupedNodes.forEach((n) => this.viewport!.updateNode(n));

		this.deactivateNode();

		this.viewport.removeFlag(this.#tokenCameraFreeze);
		this.viewport.removeFlag(this.#tokenContinuousRendering);
		this.viewport.removeFlag(this.#tokenContinuousShadowMapUpdate);
	}

	/**
	 * Removes the restriction with the given token.
	 *
	 * @param token
	 * @returns
	 */
	public removeRestriction(token: string): boolean {
		if (!this.#restrictionManager) {
			this.#logger.warn(
				"The interaction manager does not belong to an interaction engine. Please add it to one first.",
			);
			return false;
		}
		return this.#restrictionManager.removeRestriction(token);
	}

	/**
	 * Removes all restrictions.
	 */
	public removeRestrictions() {
		if (!this.#restrictionManager) {
			this.#logger.warn(
				"The interaction manager does not belong to an interaction engine. Please add it to one first.",
			);
			return;
		}
		for (const token of Object.keys(
			this.#restrictionManager.restrictions,
		)) {
			this.#restrictionManager.removeRestriction(token);
		}
	}

	/**
	 * Set the current dragged node.
	 * This will serve as the start of the drag event.
	 * This function is also called internally at onDown events.
	 *
	 * @param node
	 * @param distance
	 * @param intersectionPoint
	 * @param ray
	 */
	public setNode(
		node: ITreeNode,
		geometryData?: IGeometryData,
		distance: number = 0,
		intersectionPoint: vec3 = vec3.create(),
		event?: PointerEvent,
		ray: IRay = {origin: vec3.create(), direction: vec3.create()},
	) {
		if (!this.viewport) {
			this.#logger.warn(
				"The interaction manager does not belong to an interaction engine. Please add it to one first.",
			);
			return;
		}
		if (this.#draggedNode) this.removeNode();

		this.#restrictionManager!.showRestrictionVisualization = true;

		this.#draggedNode = this.activateNode({
			node,
			distance,
			point: intersectionPoint,
			geometryData: geometryData,
			type: "RayTracingIntersection",
		});
		if (!this.#draggedNode) return;
		this.#setupOptions = {
			viewport: this.viewport,
			node: this.#draggedNode.node,
			ray,
			intersection: this.#intersection!,
		};

		const transformationResult = this.#restrictionManager!.rayTrace(ray, {
			type: "dragging",
			dragAnchors: this.#draggedNode.dragAnchors,
			dragOrigin: this.#draggedNode.dragOrigin,
			node: this.#draggedNode.node,
			startPoint: this.#draggedNode.dragOrigin,
		});
		const transformationMatrix = mat4.multiply(
			mat4.create(),
			mat4.multiply(
				mat4.create(),
				this.#draggedNode.worldMatrixInverse,
				transformationResult?.transformation || mat4.create(),
			),
			this.#draggedNode.worldMatrix,
		);

		// apply the transformation for the main node
		this.applyTransformation(this.#draggedNode.node, transformationMatrix);
		this.viewport.updateNode(this.#draggedNode.node);

		// and apply it for all grouped nodes
		if (this.#groupedNodes) {
			this.#groupedNodes.forEach((n) => {
				this.applyTransformation(n, transformationMatrix);
				this.viewport!.updateNode(n);
			});
		}

		this.#tokenCameraFreeze = this.viewport.addFlag(
			FLAG_TYPE.CAMERA_FREEZE,
		);
		this.#tokenContinuousRendering = this.viewport.addFlag(
			FLAG_TYPE.CONTINUOUS_RENDERING,
		);
		this.#tokenContinuousShadowMapUpdate = this.viewport.addFlag(
			FLAG_TYPE.CONTINUOUS_SHADOW_MAP_UPDATE,
		);
		this.#eventEngine.emitEvent(EVENTTYPE.INTERACTION.DRAG_START, {
			viewportId: this.viewport.id,
			node: this.#draggedNode.node,
			matrix: transformationMatrix,
			intersectionPoint,
			ray,
			event,
			restriction: transformationResult?.restriction,
			dragAnchor: transformationResult?.dragAnchor,
			manager: this,
			groupedNodes: this.#groupedNodes,
		} as IDragEvent);
	}

	/**
	 * Utility function to make the node the current active node.
	 * Set the according values, apply the effect and emit the event.
	 *
	 * @param intersection
	 */
	private activateNode(intersection: IRayTracingIntersection) {
		if (!this.viewport) {
			this.#logger.warn(
				"The interaction manager does not belong to an interaction engine. Please add it to one first.",
			);
			return;
		}
		this.#intersection = intersection;
		const node = this.#intersection.node;
		this.#groupedNodes = undefined;
		this.#groupInteractionEffectToken = undefined;

		// find the interaction data
		const data = this.getInteractionData(node, true);
		if (data) data.interactionStates.drag = true;

		// find and store all nodes that are within the group
		if (data && data.groupId) {
			this.#groupedNodes = this.gatheredGroupedNodes[data.groupId] || [];
			this.#groupInteractionEffectToken = [];
		}

		// remove the previous transformation of the dragged node (and all grouped within)
		const previousDragMatrix = this.removeTransformation(node);
		let invertedPreviousDragMatrix = mat4.invert(
			mat4.create(),
			previousDragMatrix,
		);
		if (!invertedPreviousDragMatrix)
			invertedPreviousDragMatrix = mat4.create();
		if (this.#groupedNodes)
			this.#groupedNodes!.forEach((n) => this.removeTransformation(n));

		// store the initial world matrix and its inverse
		const worldMatrix = node.worldMatrix;
		let worldMatrixInverse = mat4.invert(mat4.create(), worldMatrix);
		if (!worldMatrixInverse) worldMatrixInverse = mat4.create();

		// apply the effect material if there is something to apply
		if (this.interactionEffect) {
			this.#interactionEffectToken =
				this.interactionEffectUtils.applyInteractionEffect(
					node,
					this.interactionEffect,
				);
			if (this.#groupedNodes)
				this.#groupedNodes!.forEach((n) =>
					this.#groupInteractionEffectToken!.push(
						this.interactionEffectUtils.applyInteractionEffect(
							n,
							this.interactionEffect!,
						),
					),
				);
		} else {
			this.#interactionEffectToken = undefined;
		}

		// update the node
		this.viewport.updateNode(node);
		if (this.#groupedNodes)
			this.#groupedNodes!.forEach((n) => this.viewport!.updateNode(n));

		this.viewport.render();

		return {
			node,
			worldMatrix,
			worldMatrixInverse,
			previousDragMatrix,
			dragAnchors: data?.dragAnchors || [],
			dragOrigin: data?.dragOrigin
				? vec3.transformMat4(
						vec3.create(),
						data.dragOrigin!,
						node.worldMatrix,
					)
				: vec3.transformMat4(
						vec3.create(),
						intersection.point,
						invertedPreviousDragMatrix,
					),
		};
	}

	/**
	 * Utility function to apply the transformation to the current node.
	 *
	 * @param node
	 * @param matrix
	 */
	private applyTransformation(node: ITreeNode, matrix: mat4) {
		const index = node.transformations.findIndex(
			(t: ITransformation) => t.id === "SD_drag_matrix",
		);
		if (index !== -1) {
			node.transformations[index].matrix = matrix;
		} else {
			node.addTransformation({id: "SD_drag_matrix", matrix});
		}
	}

	/**
	 * Utility function to make the node inactive.
	 * Set the according values, remove the effect and emit the event.
	 *
	 * @param intersection
	 */
	private deactivateNode() {
		if (!this.viewport) {
			this.#logger.warn(
				"The interaction manager does not belong to an interaction engine. Please add it to one first.",
			);
			return;
		}
		if (!this.#draggedNode) return;

		// find the interaction data
		const data = this.getInteractionData(this.#draggedNode.node, true);
		if (data) data.interactionStates.drag = false;

		if (this.#interactionEffectToken) {
			this.interactionEffectUtils.removeInteractionEffect(
				this.#draggedNode.node,
				this.#interactionEffectToken,
			);
			this.#interactionEffectToken = undefined;

			if (this.#groupedNodes)
				this.#groupedNodes!.forEach((n, i) =>
					this.interactionEffectUtils.removeInteractionEffect(
						n,
						this.#groupInteractionEffectToken![i],
					),
				);
			this.#groupInteractionEffectToken = undefined;
		}

		this.viewport.updateNode(this.#draggedNode.node);
		if (this.#groupedNodes)
			this.#groupedNodes!.forEach((n) => this.viewport!.updateNode(n));

		this.viewport.render();

		this.#intersection = null;
		this.#draggedNode = undefined;

		this.#groupedNodes = undefined;
		this.#groupInteractionEffectToken = undefined;
	}

	private getInteractionData(
		node: ITreeNode,
		restrictions: boolean,
	): InteractionData | undefined {
		for (let i = 0; i < node.data.length; i++) {
			if (node.data[i] instanceof InteractionData) {
				const data = node.data[i] as InteractionData;
				if (data.interactionTypes.drag !== true) continue;

				if (restrictions) {
					if (
						(<InteractionData>node.data[i]).restrictedManagers
							.length === 0 ||
						(<InteractionData>(
							node.data[i]
						)).restrictedManagers.includes(this.id)
					)
						return node.data[i] as InteractionData;
				} else {
					return node.data[i] as InteractionData;
				}
			}
		}
	}

	private removeTransformation(node: ITreeNode): mat4 {
		const index = node.transformations.findIndex(
			(t: ITransformation) => t.id === "SD_drag_matrix",
		);
		if (index !== -1) {
			const matrix = mat4.clone(node.transformations[index].matrix);
			node.removeTransformation(node.transformations[index]);
			return matrix;
		}
		return mat4.create();
	}
}
