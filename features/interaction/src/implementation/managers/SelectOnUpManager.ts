import {IMaterialAbstractData, IViewportApi} from "@shapediver/viewer";
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

import {ISelectEvent} from "../../interfaces/events/ISelectEvent";
import {INTERACTION_STATE} from "../../interfaces/IInteractionEngine";
import {IInteractionFilterOptions} from "../../interfaces/IInteractionManager";
import {IInteractionEffect} from "../../interfaces/utils/IInteractionEffectUtils";
import {AbstractInteractionManager} from "../AbstractInteractionManager";
import {InteractionManagerUtils} from "../utils/InteractionManagerUtils";

/* eslint-disable @typescript-eslint/no-unused-vars */
export class SelectOnUpManager extends AbstractInteractionManager {
	readonly #eventEngine: EventEngine = EventEngine.instance;
	readonly #logger: Logger = Logger.instance;
	readonly #tree: Tree = Tree.instance;

	#deselectOnEmpty: boolean = true;
	#filter: IInteractionFilterOptions =
		InteractionManagerUtils.createInteractionFilter("select", this.id, [
			INTERACTION_STATE.UP,
		]);
	#groupInteractionEffectToken?: string[];
	#groupedNodes?: ITreeNode[];
	#interactionEffectToken?: string;
	#intersection: IIntersectionDefinition | null = null;
	#node: ITreeNode | null = null;

	constructor(
		id?: string,
		interactionEffect?: IInteractionEffect | IMaterialAbstractData,
		deselectOnEmpty?: boolean,
	) {
		super(id, interactionEffect);
		if (deselectOnEmpty !== undefined)
			this.#deselectOnEmpty = deselectOnEmpty;
	}

	/**
	 * Deselect the selected node when clicking on an empty space in the Viewport.
	 */
	public get deselectOnEmpty(): boolean {
		return this.#deselectOnEmpty;
	}

	/**
	 * Deselect the selected node when clicking on an empty space in the Viewport.
	 */
	public set deselectOnEmpty(value: boolean) {
		this.#deselectOnEmpty = value;
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
	public deselect() {
		if (this.#node) this.deactivateNode();
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
		if (endState === INTERACTION_STATE.UP) {
			const intersections = intersection.filter(
				(i) =>
					this.filter(INTERACTION_STATE.UP)(i.node) &&
					i.type === "RayTracingIntersection",
			) as IRayTracingIntersection[];

			// create a list that replaces all irrelevant intersections with null
			const filteredIntersections = intersections.map((i) => {
				return InteractionManagerUtils.getInteractionData(
					i.node,
					true,
					this.id,
					"select",
				)
					? i
					: null;
			});

			const firstIntersection =
				filteredIntersections.length > 0
					? filteredIntersections[0]
					: null;

			if (this.#node) {
				if (
					firstIntersection &&
					firstIntersection.node !== this.#node
				) {
					// case other node was clicked, deselect then select
					this.deactivateNode(event);
					this.activateNode(firstIntersection, event, ray);
				} else if (
					firstIntersection &&
					firstIntersection.node === this.#node
				) {
					// case same node was clicked, only deselect
					this.deactivateNode(event);
				} else if (
					!filteredIntersections.some((i) => i !== null) &&
					this.#deselectOnEmpty
				) {
					// case no node was clicked, only deselect when option is on
					this.deactivateNode(event);
				}
			} else if (firstIntersection) {
				// easy case, no node select, just select this one
				this.activateNode(firstIntersection, event, ray);
			}
		}
	}

	public onKeyDown(event: KeyboardEvent): void {}

	public onKeyUp(event: KeyboardEvent): void {}

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
		if (this.#node) this.deactivateNode();
		this.viewport = undefined;
	}

	/**
	 * Select a node.
	 * The point and distance of the intersection can be freely chosen and are provided in the event callbacks.
	 *
	 * @param intersection
	 */
	public select(intersection: IRayTracingIntersection) {
		if (this.#node) this.deactivateNode();
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
		intersection: IRayTracingIntersection,
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
		this.#intersection = intersection;
		this.#node = this.#intersection.node;

		this.#groupedNodes = undefined;
		this.#groupInteractionEffectToken = undefined;

		// find the interaction data
		const data = InteractionManagerUtils.getInteractionData(
			this.#node!,
			true,
			this.id,
			"select",
		);
		if (data) data.interactionStates.select = true;

		// find and store all nodes that are within the group
		if (data && data.groupId) {
			this.#groupedNodes = this.gatheredGroupedNodes[data.groupId] || [];
			this.#groupInteractionEffectToken = [];
		}

		// apply the effect material if there is something to apply
		const {token, groupTokens} =
			InteractionManagerUtils.applyInteractionEffects(
				this.#node,
				this.#groupedNodes,
				this.interactionEffect,
				this.interactionEffectUtils,
			);
		this.#interactionEffectToken = token;
		this.#groupInteractionEffectToken = groupTokens;

		InteractionManagerUtils.updateViewport(
			this.viewport,
			this.#node!,
			this.#groupedNodes,
		);

		this.#eventEngine.emitEvent(EVENTTYPE.INTERACTION.SELECT_ON, {
			viewportId: this.viewport.id,
			node: this.#node,
			intersectionPoint:
				this.#intersection.type === "RayTracingIntersection"
					? (this.#intersection as IRayTracingIntersection).point
					: undefined,
			ray,
			event,
			manager: this,
			groupedNodes: this.#groupedNodes,
		} as ISelectEvent);
	}

	/**
	 * Utility function to make the node inactive.
	 * Set the according values, remove the effect and emit the event.
	 *
	 * @param event
	 */
	private deactivateNode(event?: PointerEvent) {
		if (
			!InteractionManagerUtils.validateViewport(
				this.viewport,
				this.#logger,
			)
		)
			return;

		// find the interaction data
		const data = InteractionManagerUtils.getInteractionData(
			this.#node!,
			true,
			this.id,
			"select",
		);
		if (data) data.interactionStates.select = false;

		InteractionManagerUtils.removeInteractionEffects(
			this.#node!,
			this.#groupedNodes,
			this.#interactionEffectToken,
			this.#groupInteractionEffectToken || [],
			this.interactionEffectUtils,
		);
		this.#interactionEffectToken = undefined;
		this.#groupInteractionEffectToken = undefined;

		InteractionManagerUtils.updateViewport(
			this.viewport,
			this.#node!,
			this.#groupedNodes,
		);

		this.#eventEngine.emitEvent(EVENTTYPE.INTERACTION.SELECT_OFF, {
			viewportId: this.viewport.id,
			node: this.#node,
			event,
			manager: this,
			groupedNodes: this.#groupedNodes,
		} as ISelectEvent);

		this.#intersection = null;
		this.#node = null;

		this.#groupedNodes = undefined;
		this.#groupInteractionEffectToken = undefined;
	}
}
