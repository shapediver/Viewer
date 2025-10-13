import {IMaterialAbstractData, IViewportApi} from "@shapediver/viewer";
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
import {ISelectEvent} from "../../interfaces/events/ISelectEvent";
import {INTERACTION_STATE} from "../../interfaces/IInteractionEngine";
import {IInteractionFilterOptions} from "../../interfaces/IInteractionManager";
import {IInteractionEffect} from "../../interfaces/utils/IInteractionEffectUtils";
import {AbstractInteractionManager} from "../AbstractInteractionManager";
import {InteractionData} from "../InteractionData";
/* eslint-disable @typescript-eslint/no-unused-vars */

export class SelectManager extends AbstractInteractionManager {
	// #region Properties (11)

	readonly #eventEngine: EventEngine = EventEngine.instance;
	readonly #logger: Logger = Logger.instance;
	readonly #tree: Tree = Tree.instance;

	#deselectOnEmpty: boolean = false;
	#interactionEffectToken?: string;
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
	#intersection: IIntersection | null = null;
	#node: ITreeNode | null = null;
	#removalKey = "Control";
	#useModifierKeys: boolean = false;

	// #endregion Properties (11)

	// #region Constructors (1)

	constructor(
		id?: string,
		interactionEffect?: IInteractionEffect | IMaterialAbstractData,
		deselectOnEmpty?: boolean,
		useModifierKeys?: boolean,
	) {
		super(id, interactionEffect);
		if (deselectOnEmpty !== undefined)
			this.#deselectOnEmpty = deselectOnEmpty;
		if (useModifierKeys !== undefined)
			this.#useModifierKeys = useModifierKeys;
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (7)

	public get deselectOnEmpty(): boolean {
		return this.#deselectOnEmpty;
	}

	public set deselectOnEmpty(value: boolean) {
		this.#deselectOnEmpty = value;
	}

	public get filter(): IInteractionFilterOptions {
		return this.#filter;
	}

	public get removalKey(): string {
		return this.#removalKey;
	}

	public set removalKey(value: string) {
		this.#removalKey = value;
	}

	public get useModifierKeys(): boolean {
		return this.#useModifierKeys;
	}

	public set useModifierKeys(value: boolean) {
		this.#useModifierKeys = value;
	}

	// #endregion Public Getters And Setters (7)

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
		const intersections = intersection.filter((i) =>
			this.filter(INTERACTION_STATE.DOWN)(i.node),
		);

		// create a list that replaces all irrelevant intersections with null
		const filteredIntersections = intersections.map((i) => {
			return this.getInteractionData(i.node, true) ? i : null;
		});

		const firstIntersection =
			filteredIntersections.length > 0 ? filteredIntersections[0] : null;

		if (this.#useModifierKeys === false) {
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
					filteredIntersections.some((i) => i !== null) &&
					this.#deselectOnEmpty
				) {
					// case no node was clicked, only deselect when option is on
					this.deactivateNode(event);
				}
			} else if (firstIntersection) {
				// easy case, no node select, just select this one
				this.activateNode(firstIntersection, event, ray);
			}
		} else {
			const controlPressed = event.ctrlKey;
			if (this.#node) {
				if (
					firstIntersection &&
					firstIntersection.node !== this.#node
				) {
					// case other node was clicked, deselect then select
					this.deactivateNode(event);
					this.activateNode(firstIntersection, event, ray);
				} else if (
					controlPressed &&
					firstIntersection &&
					firstIntersection.node === this.#node
				) {
					// case same node was clicked, only deselect
					this.deactivateNode(event);
				} else if (
					filteredIntersections.some((i) => i !== null) &&
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
	public select(intersection: IIntersection) {
		if (this.#node) this.deactivateNode(undefined, true);
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
		const data = this.getInteractionData(this.#node!, true);
		if (data) data.interactionStates.select = true;

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

		this.#eventEngine.emitEvent(EVENTTYPE.INTERACTION.SELECT_ON, {
			viewportId: this.viewport.id,
			node: this.#node,
			intersectionPoint: this.#intersection.point,
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
	private deactivateNode(event?: PointerEvent, reselection: boolean = false) {
		if (!this.viewport) {
			this.#logger.warn(
				"The interaction manager does not belong to an interaction engine. Please add it to one first.",
			);
			return;
		}

		// find the interaction data
		const data = this.getInteractionData(this.#node!, true);
		if (data) data.interactionStates.select = false;

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

		this.#eventEngine.emitEvent(EVENTTYPE.INTERACTION.SELECT_OFF, {
			viewportId: this.viewport.id,
			node: this.#node,
			event,
			manager: this,
			groupedNodes: this.#groupedNodes,
			reselection,
		} as ISelectEvent);

		this.#intersection = null;
		this.#node = null;

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
				if (data.interactionTypes.select !== true) continue;

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

	// #endregion Private Methods (2)
}
