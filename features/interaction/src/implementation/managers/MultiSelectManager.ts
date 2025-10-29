import {IMaterialAbstractData, IViewportApi} from "@shapediver/viewer";
import {ITreeNode, Tree} from "@shapediver/viewer.shared.node-tree";
import {
	EventEngine,
	EVENTTYPE,
	Logger,
	ShapeDiverViewerInteractionError,
} from "@shapediver/viewer.shared.services";
import {
	IIntersectionDefinition,
	IRay,
	IRayTracingIntersection,
} from "@shapediver/viewer.shared.types";

import {IMultiSelectEvent} from "../../interfaces/events/IMultiSelectEvent";
import {INTERACTION_STATE} from "../../interfaces/IInteractionEngine";
import {IInteractionFilterOptions} from "../../interfaces/IInteractionManager";
import {IInteractionEffect} from "../../interfaces/utils/IInteractionEffectUtils";
import {AbstractInteractionManager} from "../AbstractInteractionManager";
import {InteractionManagerUtils} from "../utils/InteractionManagerUtils";

/* eslint-disable @typescript-eslint/no-unused-vars */
export class MultiSelectManager extends AbstractInteractionManager {
	readonly #eventEngine: EventEngine = EventEngine.instance;
	readonly #logger: Logger = Logger.instance;
	readonly #tree: Tree = Tree.instance;

	#boxSelectionKey = "Alt";
	#deselectOnEmpty: boolean = false;
	#filter: IInteractionFilterOptions =
		InteractionManagerUtils.createInteractionFilter("select", this.id, [
			INTERACTION_STATE.DOWN,
			INTERACTION_STATE.END,
		]);
	#groupInteractionEffectToken: string[][] = [];
	#groupedNodes: ITreeNode[][] = [];
	#insertionKey = "Shift";
	#interactionEffectTokens: (string | undefined)[] = [];
	#keyPressed: {
		insertion: boolean;
		removal: boolean;
		boxSelection: boolean;
	} = {
		insertion: false,
		removal: false,
		boxSelection: false,
	};
	#maximumNodes: number = Infinity;
	#minimumNodes: number = 0;
	#nodes: ITreeNode[] = [];
	#removalKey = "Control";

	constructor(
		id?: string,
		interactionEffect?: IInteractionEffect | IMaterialAbstractData,
		minimumNodes?: number,
		maximumNodes?: number,
	) {
		super(id, interactionEffect);
		if (minimumNodes) this.#minimumNodes = minimumNodes;
		if (maximumNodes) this.#maximumNodes = maximumNodes;
	}

	public get boxSelectionActive(): boolean {
		return this.#keyPressed.boxSelection;
	}

	public get boxSelectionKey(): string {
		return this.#boxSelectionKey;
	}

	public set boxSelectionKey(value: string) {
		this.#boxSelectionKey = value;
	}

	public get deselectOnEmpty(): boolean {
		return this.#deselectOnEmpty;
	}

	public set deselectOnEmpty(value: boolean) {
		this.#deselectOnEmpty = value;
	}

	public get filter(): IInteractionFilterOptions {
		return this.#filter;
	}

	public get insertionActive(): boolean {
		return this.#keyPressed.insertion;
	}

	public get insertionKey(): string {
		return this.#insertionKey;
	}

	public set insertionKey(value: string) {
		this.#insertionKey = value;
	}

	public get maximumNodes(): number {
		return this.#maximumNodes;
	}

	public set maximumNodes(value: number) {
		this.#maximumNodes = value;
	}

	public get minimumNodes(): number {
		return this.#minimumNodes;
	}

	public set minimumNodes(value: number) {
		this.#minimumNodes = value;
	}

	public get removalActive(): boolean {
		return this.#keyPressed.removal;
	}

	public get removalKey(): string {
		return this.#removalKey;
	}

	public set removalKey(value: string) {
		this.#removalKey = value;
	}

	public add(viewport: IViewportApi): void {
		this.viewport = viewport;
	}

	/**
	 * Deselect a specific node.
	 *
	 * @param node
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
		const intersections = intersection.filter((i) =>
			this.filter(INTERACTION_STATE.DOWN)(i.node),
		);

		// create a list that replaces all irrelevant intersections with null
		const filteredIntersections = intersections.map((i) => {
			return InteractionManagerUtils.getInteractionData(
				i.node,
				true,
				this.id,
				"select",
			) && i.type === "RayTracingIntersection"
				? i
				: null;
		});

		const firstIntersection =
			filteredIntersections.length > 0 ? filteredIntersections[0] : null;

		this.manageIntersection(event, firstIntersection, ray);
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
		const intersections = intersection.filter((i) =>
			this.filter(INTERACTION_STATE.END)(i.node),
		);

		// create a list that replaces all irrelevant intersections with null
		const filteredIntersections = intersections.map((i) => {
			return InteractionManagerUtils.getInteractionData(
				i.node,
				true,
				this.id,
				"select",
			) && i.type === "BoxSelectionIntersection"
				? i
				: null;
		});
		for (let i = 0; i < filteredIntersections.length; i++) {
			const intersection = filteredIntersections[i];

			this.manageIntersection(event, intersection, ray);
		}
	}

	public onKeyDown(event: KeyboardEvent, pointerInCanvas: boolean): void {
		if (event.key === this.#insertionKey) this.#keyPressed.insertion = true;
		if (event.key === this.#removalKey) this.#keyPressed.removal = true;
		if (event.key === this.#boxSelectionKey)
			this.#keyPressed.boxSelection = true;
	}

	public onKeyUp(event: KeyboardEvent, pointerInCanvas: boolean): void {
		if (event.key === this.#insertionKey)
			this.#keyPressed.insertion = false;
		if (event.key === this.#removalKey) this.#keyPressed.removal = false;
		if (event.key === this.#boxSelectionKey)
			this.#keyPressed.boxSelection = false;
	}

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
	}

	public remove(): void {
		while (this.#nodes.length > 0) this.deactivateNode(this.#nodes[0]);
		this.viewport = undefined;
	}

	/**
	 * Select a node.
	 * The point and distance of the intersection can be freely chosen and are provided in the event callbacks.
	 *
	 * @param intersection
	 */
	public select(intersection: IIntersectionDefinition) {
		if (this.#nodes.includes(intersection.node))
			this.deactivateNode(intersection.node);
		this.activateNode(intersection);
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

		if (this.#nodes.length >= this.#maximumNodes) {
			this.#eventEngine.emitEvent(
				EVENTTYPE.INTERACTION.MULTI_SELECT_MAXIMUM_NODES,
				{
					viewportId: this.viewport.id,
					node: intersection.node,
					nodes: this.#nodes,
					intersectionPoint:
						intersection.type === "RayTracingIntersection"
							? (intersection as IRayTracingIntersection).point
							: undefined,
					ray,
					event,
					manager: this,
					groupedNodes: this.#groupedNodes[this.#nodes.length - 1],
				} as IMultiSelectEvent,
			);
			throw new ShapeDiverViewerInteractionError(
				`The maximum number of nodes ${this.maximumNodes} has been reached.`,
			);
		}

		this.#nodes.push(intersection.node);

		// find the interaction data
		const data = InteractionManagerUtils.getInteractionData(
			intersection.node,
			true,
			this.id,
			"select",
		);
		if (data) data.interactionStates.select = true;

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

		this.#eventEngine.emitEvent(EVENTTYPE.INTERACTION.MULTI_SELECT_ON, {
			viewportId: this.viewport.id,
			nodes: this.#nodes,
			node: intersection.node,
			intersectionPoint:
				intersection.type === "RayTracingIntersection"
					? (intersection as IRayTracingIntersection).point
					: undefined,
			ray,
			event,
			manager: this,
			groupedNodes: this.#groupedNodes[this.#nodes.length - 1],
		} as IMultiSelectEvent);

		if (this.#nodes.length < this.#minimumNodes) {
			this.#eventEngine.emitEvent(
				EVENTTYPE.INTERACTION.MULTI_SELECT_MINIMUM_NODES,
				{
					viewportId: this.viewport.id,
					node: intersection.node,
					nodes: this.#nodes,
					intersectionPoint:
						intersection.type === "RayTracingIntersection"
							? (intersection as IRayTracingIntersection).point
							: undefined,
					ray,
					event,
					manager: this,
					groupedNodes: this.#groupedNodes[this.#nodes.length - 1],
				} as IMultiSelectEvent,
			);
		}
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
			"select",
		);
		if (data) data.interactionStates.select = false;

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

		this.#eventEngine.emitEvent(EVENTTYPE.INTERACTION.MULTI_SELECT_OFF, {
			viewportId: this.viewport.id,
			nodes: this.#nodes,
			node: node,
			event,
			manager: this,
			groupedNodes: groupedNodes,
		} as IMultiSelectEvent);

		if (this.#nodes.length < this.#minimumNodes) {
			this.#eventEngine.emitEvent(
				EVENTTYPE.INTERACTION.MULTI_SELECT_MINIMUM_NODES,
				{
					viewportId: this.viewport.id,
					node: node,
					nodes: this.#nodes,
					event,
					manager: this,
					groupedNodes: groupedNodes,
				} as IMultiSelectEvent,
			);
		}
	}

	private manageIntersection(
		event: PointerEvent,
		intersection: IIntersectionDefinition | null,
		ray: IRay,
	) {
		if (this.#nodes.length > 0) {
			let originalNode: ITreeNode | undefined;
			this.#groupedNodes.forEach((array) => {
				if (intersection && array.includes(intersection.node))
					originalNode = this.#nodes.find((n) => array.includes(n))!;
			});

			if (
				intersection &&
				!this.#nodes.includes(intersection.node) &&
				!originalNode
			) {
				// case other node was clicked, deselect then select (unless removal key is pressed)
				if (!this.#keyPressed.removal)
					this.activateNode(intersection, event, ray);
			} else if (
				intersection &&
				this.#nodes.includes(intersection.node)
			) {
				// case same node was clicked, only deselect (unless insertion key is pressed)
				if (!this.#keyPressed.insertion)
					this.deactivateNode(intersection.node, event);
			} else if (originalNode) {
				// case it is one of the grouped nodes, deselect (unless insertion key is pressed)
				if (!this.#keyPressed.insertion)
					this.deactivateNode(originalNode!, event);
			}
		} else if (intersection) {
			// easy case, no node select, just select this one (unless removal key is pressed)
			if (!this.#keyPressed.removal)
				this.activateNode(intersection, event, ray);
		}
	}
}
