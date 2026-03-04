import {Box, IBox} from "@shapediver/viewer.shared.math";
import {
	ObservableArray,
	UuidGenerator,
} from "@shapediver/viewer.shared.services";

import {mat4} from "gl-matrix";

import {ITransformation, ITreeNode} from "../interfaces/ITreeNode";
import {ITreeNodeData} from "../interfaces/ITreeNodeData";

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

	#convertedObject: {[key: string]: unknown} = {};
	#displayName: string | undefined;
	#excludeViewports: string[] = [];
	#intersectionTest: boolean = true;
	#name: string = "";
	#originalId: string;
	#originalName?: string;
	#parent?: ITreeNode;
	#restrictViewports: string[] = [];
	#transformations: ITransformation[] = [];
	#updateCallback: ((newVersion: string, oldVersion: string) => void) | null =
		null;
	#updateCallbackConvertedObject:
		| ((newObj: unknown, oldObj: unknown, viewport: string) => void)
		| null = null;
	#version: string;
	#visible: boolean = true;

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
		this.#version = this.#uuidGenerator.create();
		this.#parent?.addChild(this);
	}

	public get boundingBox(): IBox {
		return this.#boundingBox;
	}

	public get boundingBoxViewport(): {[key: string]: IBox} {
		return this.#boundingBoxViewport;
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

	public get transformations(): ITransformation[] {
		return this.#transformations;
	}

	public set transformations(value: ITransformation[]) {
		this.#transformations = value;
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
	}

	public get visible(): boolean {
		return this.#visible;
	}

	public set visible(value: boolean) {
		this.#visible = value;
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
		return true;
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
			return true;
		}
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
		if (parents === true) {
			let node = <ITreeNode>this;
			while (node.parent) {
				node = node.parent;
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				node.version = this.#uuidGenerator.create();
			}
		}

		if (children === true) {
			for (let i = 0; i < this.#children.length; i++)
				this.#children[i].updateVersion(parents, children);
		}

		const oldVersion = this.#version;
		this.#version = this.#uuidGenerator.create();
		if (this.#updateCallback)
			this.#updateCallback(this.#version, oldVersion);
	}

	private onDataChanged(data: readonly ITreeNodeData[]) {
		// ensure parent update versions are set
		data.forEach((d) => {
			if (d.parentsUpdateVersions[this.id] === undefined) {
				d.parentsUpdateVersions[this.id] = () => {
					this.updateVersion(true, false);
				};
			}
		});
	}
}
