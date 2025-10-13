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
	IIntersection,
	IIntersectionFilter,
	IRay,
} from "@shapediver/viewer.shared.types";
import {IHoverEvent} from "../../interfaces/events/IHoverEvent";
import {INTERACTION_STATE} from "../../interfaces/IInteractionEngine";
import {IInteractionFilterOptions} from "../../interfaces/IInteractionManager";
import {IInteractionEffect} from "../../interfaces/utils/IInteractionEffectUtils";
import {AbstractInteractionManager} from "../AbstractInteractionManager";
import {InteractionData} from "../InteractionData";
/* eslint-disable @typescript-eslint/no-unused-vars */

export class HoverManager extends AbstractInteractionManager {
	// #region Properties (8)

	readonly #eventEngine: EventEngine = EventEngine.instance;
	readonly #logger: Logger = Logger.instance;
	readonly #tree: Tree = Tree.instance;

	#interactionEffectToken?: string;
	#filter: IInteractionFilterOptions = (
		interactionState: INTERACTION_STATE,
	): IIntersectionFilter => {
		if (interactionState === INTERACTION_STATE.MOVE) {
			return (node: ITreeNode) => {
				return !!this.getInteractionData(node);
			};
		}

		return (node: ITreeNode) => false;
	};
	#groupInteractionEffectToken?: string[];
	#groupedNodes?: ITreeNode[];
	#intersection: IIntersection | null = null;
	#node: ITreeNode | null = null;
	#dragEventTokenStart: string;
	#currentlyDragging: boolean = false;
	#dragEventTokenEnd: string;

	// #endregion Properties (8)

	// #region Constructors (1)

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

	// #endregion Constructors (1)

	// #region Public Getters And Setters (1)

	public get filter(): IInteractionFilterOptions {
		return this.#filter;
	}

	// #endregion Public Getters And Setters (1)

	// #region Public Methods (7)

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
		intersection: IIntersection[],
	): void {
		if (!this.viewport) {
			this.#logger.warn(
				"The interaction manager does not belong to an interaction engine. Please add it to one first.",
			);
			return;
		}
	}

	public onEnd(
		event: PointerEvent,
		ray: IRay,
		intersection: IIntersection[],
		endState: INTERACTION_STATE,
	): void {
		if (!this.viewport) {
			this.#logger.warn(
				"The interaction manager does not belong to an interaction engine. Please add it to one first.",
			);
			return;
		}
	}

	public onMove(
		event: PointerEvent,
		ray: IRay,
		intersection: IIntersection[],
	): void {
		if (!this.viewport) {
			this.#logger.warn(
				"The interaction manager does not belong to an interaction engine. Please add it to one first.",
			);
			return;
		}

		// if a node is currently being dragged, do not hover any other nodes
		if (this.#currentlyDragging) {
			if (this.#node) this.deactivateNode(event);
			return;
		}

		const intersections = intersection.filter((i) =>
			this.filter(INTERACTION_STATE.MOVE)(i.node),
		);

		// create a list that replaces all irrelevant intersections with null
		const filteredIntersections = intersections.map((i) => {
			const data = this.getInteractionData(i.node);
			return data && data.interactionStates.drag === true ? i : null;
		});

		const firstIntersection =
			filteredIntersections.length > 0 ? filteredIntersections[0] : null;

		if (this.#node) {
			if (firstIntersection && firstIntersection.node === this.#node) {
				// do nothing
			} else if (firstIntersection) {
				this.deactivateNode(event);
				this.activateNode(firstIntersection, event, ray);
			} else {
				this.deactivateNode(event);
			}
		} else if (firstIntersection) {
			// easy case, no node hover, just hover this one
			this.activateNode(firstIntersection, event, ray);
		}
	}

	public remove(): void {
		if (this.#node) this.deactivateNode();
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
	public select(intersection: IIntersection) {
		if (this.#node) this.deactivateNode();
		this.activateNode(intersection);
	}

	// #endregion Public Methods (7)

	// #region Private Methods (2)

	/**
	 * Utility function to make the node the current active node.
	 * Set the according values, apply the effect and emit the event.
	 *
	 * @param intersection
	 * @param event
	 * @param ray
	 */
	private activateNode(
		intersection: IIntersection,
		event?: PointerEvent,
		ray?: IRay,
	) {
		if (!this.viewport) {
			this.#logger.warn(
				"The interaction manager does not belong to an interaction engine. Please add it to one first.",
			);
			return;
		}
		this.#intersection = intersection;
		this.#node = this.#intersection.node;

		this.#groupedNodes = undefined;
		this.#groupInteractionEffectToken = undefined;

		// find the interaction data
		const data = this.getInteractionData(this.#node!);
		if (data) data.interactionStates.hover = true;

		// find and store all nodes that are within the group
		if (data && data.groupId) {
			this.#groupedNodes = this.gatheredGroupedNodes[data.groupId] || [];
			this.#groupInteractionEffectToken = [];
		}

		// apply the effect material if there is something to apply
		if (this.interactionEffect) {
			this.#interactionEffectToken =
				this.interactionEffectUtils.applyInteractionEffect(
					this.#node,
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

		this.viewport.updateNode(this.#node);
		if (this.#groupedNodes)
			this.#groupedNodes!.forEach((n) => this.viewport!.updateNode(n));

		this.viewport.render();

		this.#eventEngine.emitEvent(EVENTTYPE.INTERACTION.HOVER_ON, {
			viewportId: this.viewport.id,
			node: this.#node,
			intersectionPoint: this.#intersection.point,
			ray,
			event,
			manager: this,
			groupedNodes: this.#groupedNodes,
		} as IHoverEvent);
	}

	/**
	 * Utility function to make the node inactive.
	 * Set the according values, remove the effect and emit the event.
	 *
	 * @param event
	 */
	private deactivateNode(event?: PointerEvent) {
		if (!this.viewport) {
			this.#logger.warn(
				"The interaction manager does not belong to an interaction engine. Please add it to one first.",
			);
			return;
		}

		// find the interaction data
		const data = this.getInteractionData(this.#node!);
		if (data) data.interactionStates.hover = false;

		if (this.#interactionEffectToken) {
			this.interactionEffectUtils.removeInteractionEffect(
				this.#node!,
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

		this.viewport.updateNode(this.#node!);
		if (this.#groupedNodes)
			this.#groupedNodes!.forEach((n) => this.viewport!.updateNode(n));

		this.viewport.render();

		this.#eventEngine.emitEvent(EVENTTYPE.INTERACTION.HOVER_OFF, {
			viewportId: this.viewport.id,
			node: this.#node,
			event,
			manager: this,
			groupedNodes: this.#groupedNodes,
		} as IHoverEvent);

		this.#intersection = null;
		this.#node = null;

		this.#groupedNodes = undefined;
		this.#groupInteractionEffectToken = undefined;
	}

	private getInteractionData(node: ITreeNode): InteractionData | undefined {
		for (let i = 0; i < node.data.length; i++) {
			if (node.data[i] instanceof InteractionData) {
				if (
					((<InteractionData>node.data[i]).restrictedManagers
						.length === 0 ||
						(<InteractionData>(
							node.data[i]
						)).restrictedManagers.includes(this.id)) &&
					(<InteractionData>node.data[i]).interactionTypes.hover
				)
					return node.data[i] as InteractionData;
			}
		}
	}

	// #endregion Private Methods (2)
}
