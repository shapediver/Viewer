import {
	type IMaterialAbstractData,
	type ITreeNode,
	type IViewportApi,
	Tree,
} from "@shapediver/viewer";
import {TreeNodeIndex} from "@shapediver/viewer.shared.node-tree";
import {
	EventEngine,
	EVENTTYPE,
	UuidGenerator,
} from "@shapediver/viewer.shared.services";
import {
	type IIntersectionDefinition,
	type IRay,
	type IViewportUpdatedEvent,
} from "@shapediver/viewer.shared.types";

import {INTERACTION_STATE} from "../interfaces/IInteractionEngine";
import {
	type IInteractionFilterOptions,
	type IInteractionManager,
} from "../interfaces/IInteractionManager";
import {
	type IInteractionEffect,
	type IInteractionEffectUtils,
	isMaterialData,
} from "../interfaces/utils/IInteractionEffectUtils";
import {InteractionData} from "./InteractionData";
import {InteractionEffectUtils} from "./utils/InteractionEffectUtils";

export abstract class AbstractInteractionManager implements IInteractionManager {
	readonly #eventEngine: EventEngine = EventEngine.instance;
	readonly #id: string;
	readonly #tree: Tree = Tree.instance;

	// The ids of the groups of each node that is in a group and can be seen
	// in the viewport of the manager, kept up to date from the nodes of a
	// scene update.
	readonly #groupIndex = new TreeNodeIndex<string[]>(
		(node) => this.groupIdsOf(node),
		(a, b) => a.length === b.length && a.every((id, i) => id === b[i]),
	);
	// The index is read from the tree when it is needed for the first time
	// and after the viewport changed.
	#groupIndexBuilt = false;
	#gatheredGroupedNodes: {
		[key: string]: ITreeNode[];
	} = {};
	// The version of the index the grouped nodes were made for.
	#gatheredVersion = -1;
	#interactionEffect?: IInteractionEffect;
	#interactionEffectUtils: IInteractionEffectUtils;
	#occludeBySceneGeometry: boolean = false;
	#viewport?: IViewportApi;

	public abstract filter: IInteractionFilterOptions;

	constructor(
		id?: string,
		interactionEffect?: IInteractionEffect | IMaterialAbstractData,
	) {
		this.#id = id || UuidGenerator.instance.create();

		this.#interactionEffect = interactionEffect;
		this.#interactionEffectUtils = new InteractionEffectUtils();

		this.#eventEngine.addListener(
			EVENTTYPE.VIEWPORT.VIEWPORT_UPDATED,
			(e) => {
				// Nothing to keep up to date before the groups are used.
				if (!this.#groupIndexBuilt) return;
				const changes = (<IViewportUpdatedEvent>e).sceneChanges;
				// Without the nodes a scene update went through, the
				// whole tree is read.
				if (changes) this.#groupIndex.apply(changes, this.#tree.root);
				else this.#groupIndex.rebuild(this.#tree.root);
			},
		);
	}

	public get effectMaterial(): IMaterialAbstractData | undefined {
		return this.#interactionEffect &&
			isMaterialData(this.#interactionEffect)
			? this.#interactionEffect
			: undefined;
	}

	public set effectMaterial(value: IMaterialAbstractData | undefined) {
		this.#interactionEffect = value;
	}

	/**
	 * The nodes of each group, by group id, in tree order.
	 */
	public get gatheredGroupedNodes(): {
		[key: string]: ITreeNode[];
	} {
		if (!this.#groupIndexBuilt) {
			this.#groupIndex.rebuild(this.#tree.root);
			this.#groupIndexBuilt = true;
		}
		if (this.#gatheredVersion !== this.#groupIndex.version) {
			this.#gatheredVersion = this.#groupIndex.version;
			const grouped: {[key: string]: ITreeNode[]} = {};
			for (const entry of this.#groupIndex.entries(this.#tree.root))
				for (const groupId of entry.value) {
					if (!grouped[groupId]) grouped[groupId] = [];
					grouped[groupId].push(entry.node);
				}
			this.#gatheredGroupedNodes = grouped;
		}
		return this.#gatheredGroupedNodes;
	}

	public get id(): string {
		return this.#id;
	}

	public get interactionEffect(): IInteractionEffect | undefined {
		return this.#interactionEffect;
	}

	public set interactionEffect(value: IInteractionEffect | undefined) {
		this.#interactionEffect = value;
	}

	public get occludeBySceneGeometry(): boolean {
		return this.#occludeBySceneGeometry;
	}

	public set occludeBySceneGeometry(value: boolean) {
		this.#occludeBySceneGeometry = value;
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
		// Which nodes can be seen depends on the viewport.
		this.#groupIndexBuilt = false;
	}

	public abstract add(viewport: IViewportApi): void;

	public abstract onDown(
		event: PointerEvent,
		ray: IRay,
		intersection: IIntersectionDefinition[],
	): void;

	public abstract onEnd(
		event: PointerEvent,
		ray: IRay,
		intersection: IIntersectionDefinition[],
		endState: INTERACTION_STATE,
	): void;

	public abstract onKeyDown(
		event: KeyboardEvent,
		pointerInCanvas: boolean,
	): void;

	public abstract onKeyUp(
		event: KeyboardEvent,
		pointerInCanvas: boolean,
	): void;

	public abstract onMove(
		event: PointerEvent,
		ray: IRay,
		intersection: IIntersectionDefinition[],
	): void;

	public abstract remove(): void;

	/**
	 * The group ids of the node (one for each interaction data that has one),
	 * or `undefined` if the node is hidden, not in the viewport of the
	 * manager, or in no group.
	 */
	private groupIdsOf(node: ITreeNode): string[] | undefined {
		if (node.visible === false) return;
		if (this.#viewport && node.excludeViewports.includes(this.#viewport.id))
			return;
		if (
			this.#viewport &&
			node.restrictViewports.length > 0 &&
			!node.restrictViewports.includes(this.#viewport.id)
		)
			return;

		const groupIds: string[] = [];
		for (let i = 0; i < node.data.length; i++) {
			if (
				node.data[i] instanceof InteractionData &&
				(<InteractionData>node.data[i]).groupId
			)
				groupIds.push((<InteractionData>node.data[i]).groupId!);
		}
		return groupIds.length > 0 ? groupIds : undefined;
	}
}
