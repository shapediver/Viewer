import {Box, type IBox} from "@shapediver/viewer.shared.math";
import {
	ObservableArray,
	UuidGenerator,
} from "@shapediver/viewer.shared.services";
import {
	type ITransformation,
	type ITreeNode,
	type ITreeNodeData,
	type SceneNodeChangeKind,
} from "@shapediver/viewer.shared.types";

import {mat4} from "gl-matrix";
import {
	dataChangeKind,
	SCENE_NODE_CHANGE_KIND_INDEX,
	SCENE_NODE_CHANGE_KINDS,
} from "./changeKinds";
import {
	currentSerial,
	lastReadSerial,
	markTreeRead,
	nextSerial,
	nextSerialIfRead,
	serialOfVersion,
} from "./version";

export class TreeNode implements ITreeNode {
	readonly #boundingBox: IBox = new Box();
	readonly #boundingBoxViewport: {[key: string]: IBox} = {};
	readonly #children: ITreeNode[] = [];
	readonly #dataProxy: ObservableArray<ITreeNodeData> =
		new ObservableArray<ITreeNodeData>({
			initialData: [],
			onChanged: this.onDataChanged.bind(this),
		});
	readonly #id: string;
	readonly #uuidGenerator: UuidGenerator = UuidGenerator.instance;

	/**
	 * Per change kind (index in SCENE_NODE_CHANGE_KINDS), the clock value of
	 * the last change of that kind. Allocated at the first change after the
	 * node was read.
	 */
	private _changeSerials?: Float64Array;
	/**
	 * The children that got a new version, were added or were removed, with
	 * the clock value of that change, oldest first. Created at the first
	 * entry. See {@link changedChildren}.
	 */
	private _changedChildren?: IChangedChild[];
	/** The clock value of the last overflow of {@link _changedChildren}. */
	private _changedChildrenReset = 0;
	#convertedObject: {[key: string]: unknown} = {};
	#displayName: string | undefined;
	#excludeViewports: string[] = [];
	#intersectionTest: boolean = true;
	#name: string = "";
	#originalId: string;
	#originalName?: string;
	#parent?: ITreeNode;
	#restrictViewports: string[] = [];
	// A plain field: the walk in structureChanged reads it on ancestors.
	private _structureVersion = 0;
	#transformations: ITransformation[] = [];
	#updateCallback: ((newVersion: string, oldVersion: string) => void) | null =
		null;
	#updateCallbackConvertedObject:
		| ((newObj: unknown, oldObj: unknown, viewport: string) => void)
		| null = null;
	#version: string;
	private _serial: number;
	#visible: boolean = true;
	/**
	 * The clock value at the creation of this node. While it is later than
	 * the last read of the tree (markTreeRead), nobody has read the node, and
	 * its changes are not recorded: its first conversion reports its data.
	 * Set before the constructor body runs, so changes made in the
	 * constructor are not recorded either.
	 */
	private readonly _createdAt: number = currentSerial() + 1;
	/**
	 * The number of data items of each change kind, by kind index. Created
	 * once the node holds a data item with a kind.
	 */
	private _dataKindCounts?: Uint32Array;

	/**
	 * Creation of a node that can be used in the node tree.
	 *
	 * @param name the name of the node
	 * @param parent the parent of this node
	 * @param data the array of data
	 * @param transformations the array of transformations
	 */
	constructor(
		name: string = "node",
		parent?: ITreeNode,
		data: ITreeNodeData[] = [],
		transformations: ITransformation[] = [],
	) {
		this.#name = name;
		this.#parent = parent;
		this.#dataProxy.setData(data);
		this.#transformations = transformations;

		this.#id = this.#uuidGenerator.create();
		this.#originalId = this.#id;
		// nextVersion(), with its number kept
		const serial = nextSerial();
		this._serial = serial;
		this.#version = "v" + serial;
		this.#parent?.addChild(this);
	}

	public get boundingBox(): IBox {
		return this.#boundingBox;
	}

	public get boundingBoxViewport(): {[key: string]: IBox} {
		return this.#boundingBoxViewport;
	}

	/**
	 * Per change kind, the clock value of the node's last own change of that
	 * kind (see `version.ts`). `0`: no change since the node was first read.
	 * A copy: the scene update reads `changedKindsSince` instead.
	 *
	 * @internal
	 */
	public get changeSerials(): Readonly<Record<SceneNodeChangeKind, number>> {
		const record = {} as Record<SceneNodeChangeKind, number>;
		for (let i = 0; i < SCENE_NODE_CHANGE_KINDS.length; i++)
			record[SCENE_NODE_CHANGE_KINDS[i]] = this._changeSerials?.[i] ?? 0;
		return Object.freeze(record);
	}

	/**
	 * The children that got a new version (`updateVersion()`, own or from
	 * below), were added or were removed, with the clock value of that
	 * change (`nextSerial()`), oldest first. The same child again moves its
	 * entry to the end. At most `children.length + 1` entries: on overflow
	 * the list is cleared and {@link changedChildrenReset} set, and a reader
	 * that last read the list before that value looks at all children.
	 *
	 * @internal
	 */
	public get changedChildren(): readonly IChangedChild[] {
		return this._changedChildren ?? NO_CHANGED_CHILDREN;
	}

	/**
	 * The clock value of the last overflow of {@link changedChildren}, `0`
	 * if it never overflowed.
	 *
	 * @internal
	 */
	public get changedChildrenReset(): number {
		return this._changedChildrenReset;
	}

	public get children(): ITreeNode[] {
		return this.#children;
	}

	public get convertedObject(): {[key: string]: unknown} {
		return this.#convertedObject;
	}

	public set convertedObject(value: {[key: string]: unknown}) {
		this.#convertedObject = value;
	}

	public get data(): ITreeNodeData[] {
		return this.#dataProxy.value;
	}

	public get displayName(): string | undefined {
		return this.#displayName;
	}

	public set displayName(value: string | undefined) {
		this.#displayName = value;
	}

	public get excludeViewports(): string[] {
		return this.#excludeViewports;
	}

	public set excludeViewports(value: string[]) {
		this.#excludeViewports = value;
	}

	public get id(): string {
		return this.#id;
	}

	public get intersectionTest(): boolean {
		return this.#intersectionTest;
	}

	public set intersectionTest(value: boolean) {
		this.#intersectionTest = value;
	}

	public get name(): string {
		return this.#name;
	}

	public set name(value: string) {
		this.#name = value;
	}

	public get nodeMatrix(): mat4 {
		const matrix: mat4 = mat4.create();
		for (const transform of this.#transformations)
			if (transform.id !== "sdtf")
				mat4.multiply(matrix, matrix, transform.matrix);
		return matrix;
	}

	public get originalId(): string {
		return this.#originalId;
	}

	public set originalId(value: string) {
		this.#originalId = value;
	}

	public get originalName(): string | undefined {
		return this.#originalName;
	}

	public set originalName(value: string | undefined) {
		this.#originalName = value;
	}

	public get parent(): ITreeNode | undefined {
		return this.#parent;
	}

	public set parent(value: ITreeNode | undefined) {
		// check if it was removed from previous parent
		if (this.#parent) this.#parent.removeChild(this);

		// check if it is in children of new parent
		if (value) value.addChild(this);

		this.#parent = value;
	}

	public get restrictViewports(): string[] {
		return this.#restrictViewports;
	}

	public set restrictViewports(value: string[]) {
		this.#restrictViewports = value;
	}

	/**
	 * The clock value of the node's version: of its last `updateVersion()`,
	 * own or from a descendant. `0` for a version set from outside that the
	 * clock did not make.
	 *
	 * @internal
	 */
	public get serial(): number {
		return this._serial;
	}

	public get structureVersion(): number {
		// Whoever reads a version compares it with a later read, so a
		// change from now on has to reach this node again.
		markTreeRead();
		return this._structureVersion;
	}

	public get transformations(): ITransformation[] {
		return this.#transformations;
	}

	public set transformations(value: ITransformation[]) {
		this.#transformations = value;
		this.noteChange("transformation");
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

	public set version(value: string) {
		this.#version = value;
		this._serial = serialOfVersion(value);
	}

	public get visible(): boolean {
		return this.#visible;
	}

	public set visible(value: boolean) {
		if (this.#visible === value) return;
		this.#visible = value;
		this.noteChange("visibility");
	}

	public get worldMatrix(): mat4 {
		const matrix: mat4 = mat4.create();

		for (const transform of this.#transformations)
			mat4.multiply(matrix, matrix, transform.matrix);

		// eslint-disable-next-line @typescript-eslint/no-this-alias
		let node: ITreeNode = this;
		while (node.parent) {
			mat4.multiply(matrix, node.parent.nodeMatrix, matrix);
			node = node.parent;
		}

		return matrix;
	}

	public addChild(child: ITreeNode | ITreeNode[]): boolean {
		if (Array.isArray(child)) {
			let allAdded = true;
			for (const c of child) {
				const added = this.addChild(c);
				if (!added) allAdded = false;
			}
			return allAdded;
		} else {
			if (this.hasChild(child)) return false;

			this.#children.push(child);
			if (child.parent) child.parent.removeChild(child);
			(<ITreeNode>child.parent) = this;
			this.logChild(child, this.structureChanged(), false);

			return true;
		}
	}

	public addData(data: ITreeNodeData | ITreeNodeData[]): boolean {
		const currentData = [...this.#dataProxy.value];
		if (Array.isArray(data)) {
			currentData.push(...data);
		} else {
			currentData.push(data);
		}
		this.#dataProxy.setData(currentData);
		return true;
	}

	public addTransformation(transformation: ITransformation): boolean {
		this.#transformations.push(transformation);
		this.noteChange("transformation");
		return true;
	}

	/**
	 * The kinds (bits, see SCENE_NODE_CHANGE_KINDS) that this node changed
	 * after the clock value `serial`.
	 *
	 * @internal
	 */
	public changedKindsSince(serial: number): number {
		const serials = this._changeSerials;
		if (!serials) return 0;
		let bits = 0;
		for (let i = 0; i < serials.length; i++)
			if (serials[i] > serial) bits |= 1 << i;
		return bits;
	}

	public clone(): ITreeNode {
		const clone = new (this.constructor as new () => ITreeNode)();
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		clone.name = this.name;
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		clone.originalId = this.originalId;
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		clone.originalName = this.originalName;
		clone.displayName = this.displayName;
		clone.excludeViewports = this.excludeViewports;
		clone.restrictViewports = this.restrictViewports;
		clone.intersectionTest = this.intersectionTest;
		clone.visible = this.visible;

		for (const child of this.#children) clone.addChild(child.clone());
		for (const data of this.#dataProxy.value) clone.data.push(data.clone());
		for (const transform of this.#transformations)
			clone.addTransformation({
				id: transform.id,
				matrix: mat4.clone(transform.matrix),
			});

		return clone;
	}

	public cloneInstance(): ITreeNode {
		const clone = new (this.constructor as new () => ITreeNode)();
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		clone.name = this.name;
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		clone.originalId = this.originalId;
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		clone.originalName = this.originalName;
		clone.displayName = this.displayName;
		clone.excludeViewports = this.excludeViewports;
		clone.restrictViewports = this.restrictViewports;
		clone.intersectionTest = this.intersectionTest;
		clone.visible = this.visible;
		for (const child of this.#children)
			clone.addChild(child.cloneInstance());
		for (const data of this.#dataProxy.value) clone.data.push(data);
		for (const transform of this.#transformations)
			clone.addTransformation({
				id: transform.id,
				matrix: mat4.clone(transform.matrix),
			});

		return clone;
	}

	/**
	 * Records a change of `kind` on this node at the current time of the
	 * clock. Nothing is recorded while nobody has read the node.
	 *
	 * @internal
	 */
	public noteChange(kind: SceneNodeChangeKind): void {
		const serial = nextSerialIfRead(this._createdAt);
		if (serial === 0) return;
		(this._changeSerials ??= new Float64Array(
			SCENE_NODE_CHANGE_KINDS.length,
		))[SCENE_NODE_CHANGE_KIND_INDEX[kind]] = serial;
	}

	public getChild(id: string): ITreeNode | undefined {
		for (let i = 0; i < this.#children.length; i++)
			if (this.#children[i].id === id) return this.#children[i];
		return;
	}

	public getData(id: string): ITreeNodeData | undefined {
		for (let i = 0; i < this.#dataProxy.value.length; i++)
			if (this.#dataProxy.value[i].id === id)
				return this.#dataProxy.value[i];
		return;
	}

	public getNodesByName(name: string): ITreeNode[] {
		const nodes: ITreeNode[] = [];
		if (name === this.name) nodes.push(<ITreeNode>(<unknown>this));
		this.traverse((n) => {
			if (name === n.name) nodes.push(n);
		});
		return nodes;
	}

	public getNodesByNameWithRegex(regex: RegExp): ITreeNode[] {
		const nodes: ITreeNode[] = [];
		if (regex.test(this.name)) nodes.push(<ITreeNode>(<unknown>this));
		this.traverse((n) => {
			if (regex.test(n.name)) nodes.push(n);
		});
		return nodes;
	}

	public getOriginalNamePath(): string {
		let path = this.originalName || "";
		let node: ITreeNode | undefined = this.parent;
		while (node) {
			path = (node.originalName || "") + "." + path;
			node = node.parent;
		}
		return path;
	}

	public getPath(): string {
		let path = this.name;
		let node: ITreeNode | undefined = this.parent;
		while (node) {
			path = node.name + "." + path;
			node = node.parent;
		}
		return path;
	}

	public getTransformation(id: string): ITransformation | undefined {
		for (let i = 0; i < this.#transformations.length; i++)
			if (this.#transformations[i].id === id)
				return this.#transformations[i];
		return;
	}

	public hasChild(child: ITreeNode): boolean {
		return this.#children.includes(child);
	}

	public hasData(data: ITreeNodeData): boolean {
		return this.#dataProxy.value.includes(data);
	}

	public hasTransformation(transformation: ITransformation): boolean {
		return this.#transformations.includes(transformation);
	}

	public removeChild(child: ITreeNode | ITreeNode[]): boolean {
		if (Array.isArray(child)) {
			let allRemoved = true;
			for (const c of child) {
				const removed = this.removeChild(c);
				if (!removed) allRemoved = false;
			}

			return allRemoved;
		} else {
			const index = this.#children.indexOf(child);
			if (index === -1) return false;
			this.#children.splice(index, 1);
			(<ITreeNode | undefined>child.parent) = undefined;
			this.logChild(child, this.structureChanged(), true);
			return true;
		}
	}

	/**
	 * Give this node and its ancestors a new structure version (see
	 * {@link structureVersion}).
	 *
	 * The walk stops at the first ancestor that got a version after the
	 * last read: its own ancestors got one with it. Children added to a
	 * tree that nobody has read since cost one step each.
	 *
	 * @returns the clock value of the change
	 */
	private structureChanged(): number {
		const version = nextSerial();
		const read = lastReadSerial();
		// The structure change of this node, at the same clock value.
		if (this._createdAt <= read)
			(this._changeSerials ??= new Float64Array(
				SCENE_NODE_CHANGE_KINDS.length,
			))[SCENE_NODE_CHANGE_KIND_INDEX.structure] = version;
		this._structureVersion = version;
		let node = this.parent;
		while (node instanceof TreeNode && node._structureVersion <= read) {
			node._structureVersion = version;
			node = node.parent;
		}
		// Each ancestor logs the branch it came from (SS-10564), so a scene
		// update reaches this node through the logs without an
		// `updateVersion()`, as it did through the structure version.
		let child: ITreeNode = this;
		let parent = this.#parent as TreeNode | undefined;
		while (parent) {
			parent.logChild?.(child, version, false);
			child = parent;
			parent = parent.parent as TreeNode | undefined;
		}
		return version;
	}

	/**
	 * Adds `child` to {@link changedChildren} with the clock value `serial`,
	 * which must be the latest value of the clock. The same child as the
	 * last entry updates that entry. An earlier entry of the child stays:
	 * finding it would cost the length of the list, and a reader takes the
	 * newest entry of each child.
	 *
	 * @internal
	 */
	public logChild(child: ITreeNode, serial: number, removed: boolean): void {
		// Nobody has read this node yet: its first reader looks at all
		// children. A tree being built logs nothing.
		const read = lastReadSerial();
		if (this._createdAt > read) return;
		const log = (this._changedChildren ??= []);
		let last: IChangedChild | undefined = log[log.length - 1];
		// Every entry is older than the last read of the tree: a viewport
		// that visited this node since applied them. Dropping them frees
		// removed children; a viewport that did not visit it reads all
		// children instead (changedChildrenReset).
		if (last !== undefined && last.serial <= read) {
			this._changedChildrenReset = Math.max(
				this._changedChildrenReset,
				last.serial,
			);
			log.length = 0;
			last = undefined;
		}
		if (last !== undefined && last.child === child) {
			last.serial = serial;
			last.removed = removed;
			return;
		}
		if (log.length > this.#children.length) {
			// Overflow: a reader that read the list before now looks at
			// all children.
			log.length = 0;
			this._changedChildrenReset = serial;
			return;
		}
		log.push({child, serial, removed});
	}

	public removeData(data: ITreeNodeData | ITreeNodeData[]): boolean {
		const currentData = [...this.#dataProxy.value];
		if (Array.isArray(data)) {
			let allRemoved = true;
			for (const d of data) {
				const index = currentData.indexOf(d);
				if (index === -1) {
					allRemoved = false;
					continue;
				}
				currentData.splice(index, 1);
			}
			this.#dataProxy.setData(currentData);
			return allRemoved;
		} else {
			const index = currentData.indexOf(data);
			if (index === -1) return false;
			currentData.splice(index, 1);
			this.#dataProxy.setData(currentData);
			return true;
		}
	}

	public removeTransformation(transformation: ITransformation): boolean {
		const index = this.#transformations.indexOf(transformation);
		if (index === -1) return false;
		this.#transformations.splice(index, 1);
		this.noteChange("transformation");

		return true;
	}

	public traverse(callback: (node: ITreeNode) => void): void {
		callback(<ITreeNode>(<unknown>this));

		for (let i = 0; i < this.children.length; i++)
			this.children[i].traverse(callback);
	}

	public traverseData(callback: (node: ITreeNodeData) => void): void {
		for (let j = 0; j < this.#dataProxy.value.length; j++)
			callback(<ITreeNodeData>this.#dataProxy.value[j]);

		for (let i = 0; i < this.children.length; i++)
			this.children[i].traverseData(
				<(data: ITreeNodeData) => void>callback,
			);
	}

	public updateVersion(
		parents: boolean = true,
		children: boolean = true,
	): void {
		// Each affected node changes exactly once: only this call walks the
		// ancestors, and the descendants do not walk back up.
		if (parents === true) {
			let node = <ITreeNode>this;
			while (node.parent) {
				node = node.parent;
				node.updateVersion(false, false);
			}
		}

		if (children === true) {
			for (let i = 0; i < this.#children.length; i++)
				this.#children[i].updateVersion(false, true);
		}

		const oldVersion = this.#version;
		// nextVersion(), with its number kept
		const serial = nextSerial();
		this._serial = serial;
		this.#version = "v" + serial;
		// The parent's log of changed children (each ancestor of a call with
		// `parents` logs itself in its own parent). Mostly the same child
		// again (a drag): the last entry is updated without a call.
		const parent = this.#parent as TreeNode | undefined;
		const log = parent?._changedChildren;
		const last = log?.[log.length - 1];
		if (last?.child === this && !last.removed) last.serial = serial;
		else parent?.logChild?.(this, serial, false);
		if (this.#updateCallback)
			this.#updateCallback(this.#version, oldVersion);
	}

	private onDataChanged(data: readonly ITreeNodeData[]) {
		const counts = DATA_KIND_SCRATCH.fill(0);
		let any = false;
		// ensure parent update versions are set
		data.forEach((d) => {
			const kind = dataChangeKind(d);
			if (kind) {
				counts[SCENE_NODE_CHANGE_KIND_INDEX[kind]]++;
				any = true;
			}
			if (d.parentsUpdateVersions[this.id] === undefined) {
				// Called by the data item: with no argument for a new version
				// of the item, with a kind for a change without a version
				// (AbstractTreeNodeData.noteParentsChange).
				const onChange = (changeOnly?: SceneNodeChangeKind) => {
					if (changeOnly) {
						this.noteChange(changeOnly);
						return;
					}
					if (kind) this.noteChange(kind);
					this.updateVersion(true, false);
				};
				d.parentsUpdateVersions[this.id] = onChange;
			}
		});
		// An item was added or removed: the kinds whose count changed.
		let before = this._dataKindCounts;
		if (!before) {
			if (!any) return;
			before = this._dataKindCounts = new Uint32Array(counts.length);
		}
		for (let i = 0; i < counts.length; i++) {
			if (counts[i] === before[i]) continue;
			before[i] = counts[i];
			this.noteChange(SCENE_NODE_CHANGE_KINDS[i]);
		}
	}
}

/**
 * An entry of `TreeNode.changedChildren`: a child that got a new version or
 * was added (`removed` false) or removed (`removed` true) at the clock value
 * `serial`.
 *
 * @internal
 */
export interface IChangedChild {
	readonly child: ITreeNode;
	serial: number;
	removed: boolean;
}

const NO_CHANGED_CHILDREN: readonly IChangedChild[] = Object.freeze([]);

/** Reused by `onDataChanged` for the new counts, by kind index. */
const DATA_KIND_SCRATCH = new Uint32Array(SCENE_NODE_CHANGE_KINDS.length);
