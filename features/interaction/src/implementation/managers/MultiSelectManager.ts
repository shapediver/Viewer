import {IMaterialAbstractData, IViewportApi} from "@shapediver/viewer";
import {ITreeNode, Tree} from "@shapediver/viewer.shared.node-tree";
import {
	EventEngine,
	EVENTTYPE,
	Logger,
	ShapeDiverViewerInteractionError,
} from "@shapediver/viewer.shared.services";
import {
	IIntersection,
	IIntersectionFilter,
	IRay,
} from "@shapediver/viewer.shared.types";
import {IMultiSelectEvent} from "../../interfaces/events/IMultiSelectEvent";
import {INTERACTION_STATE} from "../../interfaces/IInteractionEngine";
import {IInteractionFilterOptions} from "../../interfaces/IInteractionManager";
import {IInteractionEffect} from "../../interfaces/utils/IInteractionEffectUtils";
import {AbstractInteractionManager} from "../AbstractInteractionManager";
import {InteractionData} from "../InteractionData";
/* eslint-disable @typescript-eslint/no-unused-vars */

export class MultiSelectManager extends AbstractInteractionManager {
	// #region Properties (13)

	readonly #eventEngine: EventEngine = EventEngine.instance;
	readonly #logger: Logger = Logger.instance;
	readonly #tree: Tree = Tree.instance;

	#deselectOnEmpty: boolean = false;
	#interactionEffectTokens: (string | undefined)[] = [];
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
	#groupInteractionEffectToken: string[][] = [];
	#groupedNodes: ITreeNode[][] = [];
	#insertionKey = "Shift";
	#maximumNodes: number = Infinity;
	#minimumNodes: number = 0;
	#nodes: ITreeNode[] = [];
	#removalKey = "Control";
	#useModifierKeys: boolean = false;

	// #endregion Properties (13)

	// #region Constructors (1)

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

	// #endregion Constructors (1)

	// #region Public Getters And Setters (13)

	public get deselectOnEmpty(): boolean {
		return this.#deselectOnEmpty;
	}

	public set deselectOnEmpty(value: boolean) {
		this.#deselectOnEmpty = value;
	}

	public get filter(): IInteractionFilterOptions {
		return this.#filter;
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

	// #endregion Public Getters And Setters (13)

	// #region Public Methods (8)

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
			if (this.#nodes.length > 0) {
				let originalNode: ITreeNode | undefined;
				this.#groupedNodes.forEach((array) => {
					if (
						firstIntersection &&
						array.includes(firstIntersection.node)
					)
						originalNode = this.#nodes.find((n) =>
							array.includes(n),
						)!;
				});

				if (
					firstIntersection &&
					!this.#nodes.includes(firstIntersection.node) &&
					!originalNode
				) {
					// case other node was clicked, deselect then select
					this.activateNode(firstIntersection, event, ray);
				} else if (
					firstIntersection &&
					this.#nodes.includes(firstIntersection.node)
				) {
					// case same node was clicked, only deselect
					this.deactivateNode(firstIntersection.node, event);
				} else if (originalNode) {
					// case it is one of the grouped nodes
					this.deactivateNode(originalNode!, event);
				}
			} else if (firstIntersection) {
				// easy case, no node select, just select this one
				this.activateNode(firstIntersection, event, ray);
			}
		} else {
			const shiftPressed = event.shiftKey;
			const controlPressed = event.ctrlKey;
			if (this.#nodes.length > 0) {
				let originalNode: ITreeNode | undefined;
				this.#groupedNodes.forEach((array) => {
					if (
						firstIntersection &&
						array.includes(firstIntersection.node)
					)
						originalNode = this.#nodes.find((n) =>
							array.includes(n),
						)!;
				});

				if (
					shiftPressed &&
					!controlPressed &&
					firstIntersection &&
					!this.#nodes.includes(firstIntersection.node) &&
					!originalNode
				) {
					// case other node was clicked, deselect then select
					this.activateNode(firstIntersection, event, ray);
				} else if (
					controlPressed &&
					!shiftPressed &&
					firstIntersection &&
					this.#nodes.includes(firstIntersection.node)
				) {
					// case same node was clicked, only deselect
					this.deactivateNode(firstIntersection.node, event);
				} else if (controlPressed && !shiftPressed && originalNode) {
					// case it is one of the grouped nodes
					this.deactivateNode(originalNode!, event);
				} else if (
					!shiftPressed &&
					!controlPressed &&
					firstIntersection &&
					!this.#nodes.includes(firstIntersection.node)
				) {
					// switch nodes
					this.deselectAll();
					this.activateNode(firstIntersection, event, ray);
				} else if (
					!filteredIntersections.some((i) => i !== null) &&
					this.#deselectOnEmpty
				) {
					this.deselectAll();
				}
			} else if (!controlPressed && firstIntersection) {
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
		while (this.#nodes.length > 0) this.deactivateNode(this.#nodes[0]);
		this.viewport = undefined;
	}

	/**
	 * Select a node.
	 * The point and distance of the intersection can be freely chosen and are provided in the event callbacks.
	 *
	 * @param intersection
	 */
	public select(intersection: IIntersection) {
		if (this.#nodes.includes(intersection.node))
			this.deactivateNode(intersection.node);
		this.activateNode(intersection);
	}

	// #endregion Public Methods (8)

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

		if (this.#nodes.length >= this.#maximumNodes) {
			this.#eventEngine.emitEvent(
				EVENTTYPE.INTERACTION.MULTI_SELECT_MAXIMUM_NODES,
				{
					viewportId: this.viewport.id,
					node: intersection.node,
					nodes: this.#nodes,
					intersectionPoint: intersection.point,
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
		const data = this.getInteractionData(intersection.node, true);
		if (data) data.interactionStates.select = true;

		// find and store all nodes that are within the group
		this.#groupedNodes[this.#nodes.length - 1] = [];
		this.#groupInteractionEffectToken[this.#nodes.length - 1] = [];
		if (data && data.groupId)
			this.#groupedNodes[this.#nodes.length - 1] =
				this.gatheredGroupedNodes[data.groupId] || [];

		if (this.interactionEffect) {
			this.#interactionEffectTokens.push(
				this.interactionEffectUtils.applyInteractionEffect(
					intersection.node,
					this.interactionEffect,
				),
			);
			if (this.#groupedNodes[this.#nodes.length - 1])
				this.#groupedNodes[this.#nodes.length - 1]!.forEach((n) =>
					this.#groupInteractionEffectToken[
						this.#nodes.length - 1
					]!.push(
						this.interactionEffectUtils.applyInteractionEffect(
							n,
							this.interactionEffect!,
						),
					),
				);
		} else {
			this.#interactionEffectTokens.push(undefined);
		}

		this.viewport.updateNode(intersection.node);
		if (this.#groupedNodes)
			this.#groupedNodes[this.#nodes.length - 1]!.forEach((n) =>
				this.viewport!.updateNode(n),
			);

		this.viewport.render();

		this.#eventEngine.emitEvent(EVENTTYPE.INTERACTION.MULTI_SELECT_ON, {
			viewportId: this.viewport.id,
			nodes: this.#nodes,
			node: intersection.node,
			intersectionPoint: intersection.point,
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
					intersectionPoint: intersection.point,
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
		if (!this.viewport) {
			this.#logger.warn(
				"The interaction manager does not belong to an interaction engine. Please add it to one first.",
			);
			return;
		}

		// find the interaction data
		const data = this.getInteractionData(node, true);
		if (data) data.interactionStates.select = false;

		const index = this.#nodes.indexOf(node);
		if (index === -1) return;

		const interactionEffectToken = this.#interactionEffectTokens[index];
		this.#interactionEffectTokens.splice(index, 1);
		if (interactionEffectToken) {
			this.interactionEffectUtils.removeInteractionEffect(
				node,
				interactionEffectToken,
			);
			if (this.#groupedNodes[index])
				this.#groupedNodes[index]!.forEach((n, i) =>
					this.interactionEffectUtils.removeInteractionEffect(
						n,
						this.#groupInteractionEffectToken[index]![i],
					),
				);
		}

		this.viewport.updateNode(node);
		if (this.#groupedNodes[index])
			this.#groupedNodes[index]!.forEach((n) =>
				this.viewport!.updateNode(n),
			);

		this.viewport.render();

		this.#nodes.splice(index, 1);
		this.#eventEngine.emitEvent(EVENTTYPE.INTERACTION.MULTI_SELECT_OFF, {
			viewportId: this.viewport.id,
			nodes: this.#nodes,
			node: node,
			event,
			manager: this,
			groupedNodes: this.#groupedNodes[index],
		} as IMultiSelectEvent);
		this.#groupedNodes.splice(index, 1);
		this.#groupInteractionEffectToken.splice(index, 1);

		if (this.#nodes.length < this.#minimumNodes) {
			this.#eventEngine.emitEvent(
				EVENTTYPE.INTERACTION.MULTI_SELECT_MINIMUM_NODES,
				{
					viewportId: this.viewport.id,
					node: node,
					nodes: this.#nodes,
					event,
					manager: this,
					groupedNodes: this.#groupedNodes[index],
				} as IMultiSelectEvent,
			);
		}
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
