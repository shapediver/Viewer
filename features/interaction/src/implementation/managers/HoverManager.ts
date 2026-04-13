import {
	addListener,
	IMaterialAbstractData,
	IViewportApi,
	removeListener,
} from "@shapediver/viewer";
import {ITreeNode, Tree} from "@shapediver/viewer.shared.node-tree";
import {
	EventEngine,
	EVENTTYPE,
	Logger,
} from "@shapediver/viewer.shared.services";
import {
	IIntersectionDefinition,
	IRay,
	IRayTracingIntersection,
} from "@shapediver/viewer.shared.types";

import {IHoverEvent} from "../../interfaces/events/IHoverEvent";
import {INTERACTION_STATE} from "../../interfaces/IInteractionEngine";
import {IInteractionFilterOptions} from "../../interfaces/IInteractionManager";
import {IInteractionEffect} from "../../interfaces/utils/IInteractionEffectUtils";
import {AbstractInteractionManager} from "../AbstractInteractionManager";
import {InteractionManagerUtils} from "../utils/InteractionManagerUtils";

/* eslint-disable @typescript-eslint/no-unused-vars */
export class HoverManager extends AbstractInteractionManager {
	readonly #eventEngine: EventEngine = EventEngine.instance;
	readonly #logger: Logger = Logger.instance;
	readonly #tree: Tree = Tree.instance;

	#currentlyDragging: boolean = false;
	#dragEventTokenEnd: string;
	#dragEventTokenStart: string;
	#filter: IInteractionFilterOptions =
		InteractionManagerUtils.createInteractionFilter("hover", this.id, [
			INTERACTION_STATE.MOVE,
			INTERACTION_STATE.END,
		]);
	#groupInteractionEffectToken: string[][] = [];
	#groupedNodes: ITreeNode[][] = [];
	#interactionEffectTokens: (string | undefined)[] = [];
	#intersections: IIntersectionDefinition[] = [];
	#nodes: ITreeNode[] = [];

	constructor(
		id?: string,
		interactionEffect?: IInteractionEffect | IMaterialAbstractData,
	) {
		super(id, interactionEffect);

		this.#dragEventTokenStart = addListener(
			EVENTTYPE.INTERACTION.DRAG_START,
			() => {
				this.#currentlyDragging = true;
			},
		);
		this.#dragEventTokenEnd = addListener(
			EVENTTYPE.INTERACTION.DRAG_END,
			() => {
				this.#currentlyDragging = false;
			},
		);
	}

	public get filter(): IInteractionFilterOptions {
		return this.#filter;
	}

	public add(viewport: IViewportApi): void {
		this.viewport = viewport;
	}

	/**
	 * Deselect the current node.
	 */
	public deselect(node: ITreeNode) {
		if (this.#nodes.includes(node)) this.deactivateNode(node);
	}

	/**
	 * Deselect all nodes.
	 */
	public deselectAll() {
		while (this.#nodes.length > 0) this.deactivateNode(this.#nodes[0]);
	}

	public onDown(
		event: PointerEvent,
		ray: IRay,
		intersection: IIntersectionDefinition[],
	): void {
		if (
			!InteractionManagerUtils.validateViewport(
				this.viewport,
				this.#logger,
			)
		)
			return;
	}

	public onEnd(
		event: PointerEvent,
		ray: IRay,
		intersection: IIntersectionDefinition[],
		endState: INTERACTION_STATE,
	): void {
		if (
			!InteractionManagerUtils.validateViewport(
				this.viewport,
				this.#logger,
			)
		)
			return;

		// Check if box selection was involved in this interaction
		const hasBoxSelection = intersection.some(
			(i) => i.type === "BoxSelectionIntersection",
		);

		// If box selection was active, clear all hover effects immediately
		// since they should not persist after box selection ends
		if (hasBoxSelection && this.#nodes.length > 0) {
			this.deactivateAllNodes();
		}
	}

	public onKeyDown(event: KeyboardEvent, pointerInCanvas: boolean): void {}

	public onKeyUp(event: KeyboardEvent, pointerInCanvas: boolean): void {}

	public onMove(
		event: PointerEvent,
		ray: IRay,
		intersection: IIntersectionDefinition[],
	): void {
		if (
			!InteractionManagerUtils.validateViewport(
				this.viewport,
				this.#logger,
			)
		)
			return;

		// if a node is currently being dragged, do not hover any other nodes
		if (this.#currentlyDragging) {
			if (this.#nodes.length > 0) this.deactivateAllNodes();
			return;
		}

		const intersections = intersection.filter((i) =>
			this.filter(INTERACTION_STATE.MOVE)(i.node),
		);

		// create a list that replaces all irrelevant intersections with null
		const filteredIntersections = intersections.map((i) => {
			const data = InteractionManagerUtils.getInteractionData(
				i.node,
				true,
				this.id,
				"hover",
			);
			return data && !data.interactionStates.drag ? i : null;
		});

		// check if there are objects that were selected via box selection
		const hasBoxSelection = filteredIntersections.some(
			(fi) => fi?.type === "BoxSelectionIntersection",
		);

		// if there are no box selection intersections, adjust the filteredIntersections to only contain the first ray tracing intersection
		if (!hasBoxSelection) {
			// Only hover if this manager's node is the closest interactive node
			// overall. If filteredIntersections[0] is null, another manager's node
			// is in front — don't hover anything for this manager.
			const firstIntersectionIndex =
				filteredIntersections.length > 0 &&
				filteredIntersections[0] !== null
					? filteredIntersections.findIndex(
							(fi) => fi?.type === "RayTracingIntersection",
						)
					: -1;
			for (let i = 0; i < filteredIntersections.length; i++) {
				if (i !== firstIntersectionIndex) {
					filteredIntersections[i] = null;
				}
			}
		}

		// loop through all the new nodes
		// then activate those that are not yet active
		for (const fi of filteredIntersections) {
			if (fi) {
				if (!this.#nodes.includes(fi.node)) {
					this.activateNode(fi, event, ray);
				}
			}
		}

		// deactivate those that are no longer hovered
		for (const n of this.#nodes) {
			if (!filteredIntersections.find((fi) => fi && fi.node === n)) {
				this.deactivateNode(n, event);
			}
		}
	}

	public remove(): void {
		this.deactivateAllNodes();
		this.viewport = undefined;

		removeListener(this.#dragEventTokenStart);
		removeListener(this.#dragEventTokenEnd);
	}

	/**
	 * Select a node for hovering.
	 * The point and distance of the intersection can be freely chosen and are provided in the event callbacks.
	 *
	 * @param intersection
	 */
	public select(
		intersection: Omit<IIntersectionDefinition, "type"> &
			Partial<Pick<IIntersectionDefinition, "type">>,
	) {
		if (this.#nodes.includes(intersection.node))
			this.deactivateNode(intersection.node);
		this.activateNode({
			...intersection,
			type: intersection.type ?? "RayTracingIntersection",
		});
	}

	/**
	 * Utility function to make the node the current active node.
	 * Set the according values, apply the effect and emit the event.
	 *
	 * @param intersection
	 * @param event
	 * @param ray
	 */
	private activateNode(
		intersection: IIntersectionDefinition,
		event?: PointerEvent,
		ray?: IRay,
	) {
		if (
			!InteractionManagerUtils.validateViewport(
				this.viewport,
				this.#logger,
			)
		)
			return;
		this.#intersections.push(intersection);
		this.#nodes.push(intersection.node);

		// find the interaction data
		const data = InteractionManagerUtils.getInteractionData(
			intersection.node,
			true,
			this.id,
			"hover",
		);
		if (data) data.interactionStates.hover = true;

		// find and store all nodes that are within the group
		this.#groupedNodes[this.#nodes.length - 1] = [];
		this.#groupInteractionEffectToken[this.#nodes.length - 1] = [];
		if (data && data.groupId)
			this.#groupedNodes[this.#nodes.length - 1] =
				this.gatheredGroupedNodes[data.groupId] || [];

		const {token, groupTokens} =
			InteractionManagerUtils.applyInteractionEffects(
				intersection.node,
				this.#groupedNodes[this.#nodes.length - 1],
				this.interactionEffect,
				this.interactionEffectUtils,
			);
		this.#interactionEffectTokens.push(token);
		this.#groupInteractionEffectToken[this.#nodes.length - 1] = groupTokens;

		InteractionManagerUtils.updateViewport(
			this.viewport,
			intersection.node,
			this.#groupedNodes
				? this.#groupedNodes[this.#nodes.length - 1]
				: undefined,
		);

		this.#eventEngine.emitEvent(EVENTTYPE.INTERACTION.HOVER_ON, {
			viewportId: this.viewport.id,
			nodes: this.#nodes,
			intersectionPoint:
				intersection.type === "RayTracingIntersection"
					? (intersection as IRayTracingIntersection).point
					: undefined,
			ray,
			event,
			manager: this,
			groupedNodes: this.#groupedNodes[this.#nodes.length - 1],
		} as IHoverEvent);
	}

	private deactivateAllNodes() {
		while (this.#nodes.length > 0) this.deactivateNode(this.#nodes[0]);
	}

	/**
	 * Utility function to make the node inactive.
	 * Set the according values, remove the effect and emit the event.
	 *
	 * @param event
	 */
	private deactivateNode(node: ITreeNode, event?: PointerEvent) {
		if (
			!InteractionManagerUtils.validateViewport(
				this.viewport,
				this.#logger,
			)
		)
			return;

		// find the interaction data
		const data = InteractionManagerUtils.getInteractionData(
			node,
			true,
			this.id,
			"hover",
		);
		if (data) data.interactionStates.hover = false;

		const index = this.#nodes.indexOf(node);
		if (index === -1) return;

		InteractionManagerUtils.removeInteractionEffects(
			node,
			this.#groupedNodes[index],
			this.#interactionEffectTokens[index],
			this.#groupInteractionEffectToken[index] || [],
			this.interactionEffectUtils,
		);

		InteractionManagerUtils.updateViewport(
			this.viewport,
			node,
			this.#groupedNodes[index],
		);

		// Store the grouped nodes before removing from arrays for the event
		const groupedNodes = this.#groupedNodes[index];

		this.#nodes.splice(index, 1);
		this.#interactionEffectTokens.splice(index, 1);
		this.#groupedNodes.splice(index, 1);
		this.#groupInteractionEffectToken.splice(index, 1);

		this.#eventEngine.emitEvent(EVENTTYPE.INTERACTION.HOVER_OFF, {
			viewportId: this.viewport.id,
			nodes: this.#nodes,
			event,
			manager: this,
			groupedNodes: groupedNodes,
		} as IHoverEvent);
	}
}
