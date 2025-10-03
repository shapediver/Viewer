import {
	IMaterialAbstractData,
	ITreeNode,
	IViewportApi,
	Tree,
} from "@shapediver/viewer";
import {
	EventEngine,
	EVENTTYPE,
	UuidGenerator,
} from "@shapediver/viewer.shared.services";
import {IIntersection, IRay} from "@shapediver/viewer.shared.types";
import {INTERACTION_STATE} from "../interfaces/IInteractionEngine";
import {
	IInteractionFilterOptions,
	IInteractionManager,
} from "../interfaces/IInteractionManager";
import {
	IInteractionEffect,
	IInteractionEffectUtils,
	isMaterialData,
} from "../interfaces/utils/IInteractionEffectUtils";
import {InteractionData} from "./InteractionData";
import {InteractionEffectUtils} from "./utils/InteractionEffectUtils";

export abstract class AbstractInteractionManager
	implements IInteractionManager
{
	// #region Properties (8)

	readonly #eventEngine: EventEngine = EventEngine.instance;
	readonly #id: string;
	readonly #tree: Tree = Tree.instance;

	#interactionEffect?: IInteractionEffect;
	#gatheredGroupedNodes: {
		[key: string]: ITreeNode[];
	} = {};
	#interactionEffectUtils: IInteractionEffectUtils;
	#viewport?: IViewportApi;

	public abstract filter: IInteractionFilterOptions;

	// #endregion Properties (8)

	// #region Constructors (1)

	constructor(
		id?: string,
		interactionEffect?: IInteractionEffect | IMaterialAbstractData,
	) {
		this.#id = id || UuidGenerator.instance.create();

		this.#interactionEffect = interactionEffect;
		this.#interactionEffectUtils = new InteractionEffectUtils();

		this.gatherGroupNodes();
		this.#eventEngine.addListener(
			EVENTTYPE.VIEWPORT.VIEWPORT_UPDATED,
			() => {
				this.gatherGroupNodes();
			},
		);
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (8)

	public get effectMaterial(): IMaterialAbstractData | undefined {
		return this.#interactionEffect &&
			isMaterialData(this.#interactionEffect)
			? this.#interactionEffect
			: undefined;
	}

	public set effectMaterial(value: IMaterialAbstractData | undefined) {
		this.#interactionEffect = value;
	}

	public get interactionEffect(): IInteractionEffect | undefined {
		return this.#interactionEffect;
	}

	public set interactionEffect(value: IInteractionEffect | undefined) {
		this.#interactionEffect = value;
	}

	public get gatheredGroupedNodes(): {
		[key: string]: ITreeNode[];
	} {
		return this.#gatheredGroupedNodes;
	}

	public get id(): string {
		return this.#id;
	}

	public get interactionEffectUtils(): IInteractionEffectUtils {
		return this.#interactionEffectUtils;
	}

	public set interactionEffectUtils(value: IInteractionEffectUtils) {
		this.#interactionEffectUtils = value;
	}

	public get viewport(): IViewportApi | undefined {
		return this.#viewport;
	}

	public set viewport(value: IViewportApi | undefined) {
		this.#viewport = value;
		this.#interactionEffectUtils.viewport = value;
	}

	// #endregion Public Getters And Setters (8)

	// #region Public Abstract Methods (5)

	public abstract add(viewport: IViewportApi): void;
	public abstract onDown(
		event: PointerEvent,
		ray: IRay,
		intersection: IIntersection[],
	): void;
	public abstract onEnd(
		event: PointerEvent,
		ray: IRay,
		intersection: IIntersection[],
		endState: INTERACTION_STATE,
	): void;
	public abstract onMove(
		event: PointerEvent,
		ray: IRay,
		intersection: IIntersection[],
	): void;
	public abstract remove(): void;

	// #endregion Public Abstract Methods (5)

	// #region Private Methods (1)

	private gatherGroupNodes() {
		this.#gatheredGroupedNodes = {};
		this.#tree.root.traverse((node) => {
			if (node.visible === false) return;
			if (
				this.#viewport &&
				node.excludeViewports.includes(this.#viewport.id)
			)
				return;
			if (
				this.#viewport &&
				node.restrictViewports.length > 0 &&
				!node.restrictViewports.includes(this.#viewport.id)
			)
				return;

			for (let i = 0; i < node.data.length; i++) {
				if (
					node.data[i] instanceof InteractionData &&
					(<InteractionData>node.data[i]).groupId
				) {
					if (
						!this.#gatheredGroupedNodes[
							(<InteractionData>node.data[i]).groupId!
						]
					)
						this.#gatheredGroupedNodes[
							(<InteractionData>node.data[i]).groupId!
						] = [];
					this.#gatheredGroupedNodes[
						(<InteractionData>node.data[i]).groupId!
					].push(node);
				}
			}
		});
	}

	// #endregion Private Methods (1)
}
