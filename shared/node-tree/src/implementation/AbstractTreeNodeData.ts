import {UuidGenerator} from "@shapediver/viewer.shared.services";
import {
	type ITreeNodeData,
	type SceneNodeChangeKind,
} from "@shapediver/viewer.shared.types";
import {nextVersion} from "./version";

export abstract class AbstractTreeNodeData implements ITreeNodeData {
	readonly #id: string;
	readonly #uuidGenerator: UuidGenerator = UuidGenerator.instance;

	#convertedObject: {[key: string]: unknown} = {};
	#parentsUpdateVersions: {
		[key: string]: () => void;
	} = {};
	#updateCallback: ((newVersion: string, oldVersion: string) => void) | null =
		null;
	#updateCallbackConvertedObject:
		| ((newObj: unknown, oldObj: unknown, viewport: string) => void)
		| null = null;
	#version: string;

	/**
	 * Creates a tree node data object.
	 *
	 * @param id Id of this data object
	 */
	constructor(id?: string, version?: string) {
		this.#id = id || this.#uuidGenerator.create();
		this.#version = version || nextVersion();
	}

	/**
	 * What a change of this data item (added to a node, removed from it, or
	 * given a new version) changes on the nodes that hold it. `undefined`:
	 * nothing that a viewport draws.
	 *
	 * @internal
	 */
	public get changeKind(): SceneNodeChangeKind | undefined {
		return "geometry";
	}

	public get convertedObject(): {[key: string]: unknown} {
		return this.#convertedObject;
	}

	public set convertedObject(value: {[key: string]: unknown}) {
		this.#convertedObject = value;
	}

	public get id(): string {
		return this.#id;
	}

	public get parentsUpdateVersions(): {
		[key: string]: () => void;
	} {
		return this.#parentsUpdateVersions;
	}

	public get updateCallback():
		| ((newVersion: string, oldVersion: string) => void)
		| null {
		return this.#updateCallback;
	}

	public set updateCallback(
		value: ((newVersion: string, oldVersion: string) => void) | null,
	) {
		this.#updateCallback = value;
	}

	public get updateCallbackConvertedObject():
		| ((newObj: unknown, oldObj: unknown, viewport: string) => void)
		| null {
		return this.#updateCallbackConvertedObject;
	}

	public set updateCallbackConvertedObject(
		value:
			| ((newObj: unknown, oldObj: unknown, viewport: string) => void)
			| null,
	) {
		this.#updateCallbackConvertedObject = value;
	}

	public get version(): string {
		return this.#version;
	}

	/**
	 * Clones the tree node data.
	 */
	public clone(): ITreeNodeData {
		const clone = new (this.constructor as new () => ITreeNodeData)();
		return clone;
	}

	/**
	 * Records a change of `kind` on every node that holds this item, without
	 * a new version (for example an effect material that a viewport applies
	 * directly).
	 *
	 * @internal
	 */
	public noteParentsChange(kind: SceneNodeChangeKind): void {
		for (const callback of Object.values(this.#parentsUpdateVersions))
			(callback as (changeOnly?: SceneNodeChangeKind) => void)(kind);
	}

	/**
	 * Update the version
	 */
	public updateVersion(): void {
		const oldVersion = this.#version;
		this.#version = nextVersion();

		// notify all parents about the version change
		Object.values(this.#parentsUpdateVersions).forEach((cb) => cb());
		if (this.#updateCallback)
			this.#updateCallback(this.#version, oldVersion);
	}
}
