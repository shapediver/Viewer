import {Box, IBox} from "@shapediver/viewer.shared.math";
import {UuidGenerator} from "@shapediver/viewer.shared.services";
import {mat4} from "gl-matrix";
import {ITransformation, ITreeNode} from "../interfaces/ITreeNode";
import {ITreeNodeData} from "../interfaces/ITreeNodeData";

export class TreeNode implements ITreeNode {
	// #region Properties (19)

	readonly #boundingBox: IBox = new Box();
	readonly #boundingBoxViewport: {[key: string]: IBox} = {};
	readonly #children: ITreeNode[] = [];
	readonly #data: ITreeNodeData[] = [];
	readonly #id: string;
	readonly #uuidGenerator: UuidGenerator = UuidGenerator.instance;

	#boneInverses: mat4[] = [];
	#bones: ITreeNode[] = [];
	#convertedObject: {[key: string]: unknown} = {};
	#excludeViewports: string[] = [];
	#intersectionTest: boolean = true;
	#name: string = "";
	#originalId: string;
	#originalName?: string;
	#parent?: ITreeNode;
	#restrictViewports: string[] = [];
	#skinNode: boolean = false;
	#transformations: ITransformation[] = [];
	#updateCallbackConvertedObject:
		| ((newObj: unknown, oldObj: unknown, viewport: string) => void)
		| null = null;
	#version: string;
	#visible: boolean = true;

	// #endregion Properties (19)

	// #region Constructors (1)

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
		this.#data = data;
		this.#transformations = transformations;

		this.#id = this.#uuidGenerator.create();
		this.#originalId = this.#id;
		this.#version = this.#uuidGenerator.create();
		this.#parent?.addChild(this);
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (33)

	public get boneInverses(): mat4[] {
		return this.#boneInverses;
	}

	public set boneInverses(value: mat4[]) {
		this.#boneInverses = value;
	}

	public get bones(): ITreeNode[] {
		return this.#bones;
	}

	public set bones(value: ITreeNode[]) {
		this.#bones = value;
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
		return this.#data;
	}

	public get excludeViewports(): string[] {
		return this.#excludeViewports;
	}

	public set excludeViewports(value: string[]) {
		this.#excludeViewports = value;
	}

	public get intersectionTest(): boolean {
		return this.#intersectionTest;
	}

	public set intersectionTest(value: boolean) {
		this.#intersectionTest = value;
	}

	public get id(): string {
		return this.#id;
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

	public get skinNode(): boolean {
		return this.#skinNode;
	}

	public set skinNode(value: boolean) {
		this.#skinNode = value;
	}

	public get transformations(): ITransformation[] {
		return this.#transformations;
	}

	public set transformations(value: ITransformation[]) {
		this.#transformations = value;
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

	// #endregion Public Getters And Setters (33)

	// #region Public Methods (20)

	public addChild(child: ITreeNode): boolean {
		if (this.hasChild(child)) return false;

		this.#children.push(child);
		if (child.parent) child.parent.removeChild(child);
		(<ITreeNode>child.parent) = this;

		return true;
	}

	public addData(data: ITreeNodeData): boolean {
		this.#data.push(data);
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
		clone.visible = this.visible;
		clone.intersectionTest = this.intersectionTest;
		for (const child of this.#children) clone.addChild(child.clone());
		for (const data of this.#data) clone.data.push(data.clone());
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
		clone.visible = this.visible;
		clone.intersectionTest = this.intersectionTest;
		for (const child of this.#children)
			clone.addChild(child.cloneInstance());
		for (const data of this.#data) clone.data.push(data);
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
		for (let i = 0; i < this.#data.length; i++)
			if (this.#data[i].id === id) return this.#data[i];
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

	public getPath(): string {
		let path = this.name;
		let node: ITreeNode | undefined = this.parent;
		while (node) {
			path = node.name + "." + path;
			node = node.parent;
		}
		return path;
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
		return this.#data.includes(data);
	}

	public hasTransformation(transformation: ITransformation): boolean {
		return this.#transformations.includes(transformation);
	}

	public removeChild(child: ITreeNode): boolean {
		const index = this.#children.indexOf(child);
		if (index === -1) return false;
		this.#children.splice(index, 1);
		(<ITreeNode | undefined>child.parent) = undefined;

		return true;
	}

	public removeData(data: ITreeNodeData): boolean {
		const index = this.#data.indexOf(data);
		if (index === -1) return false;
		this.#data.splice(index, 1);

		return true;
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
		for (let j = 0; j < this.data.length; j++)
			callback(<ITreeNodeData>this.data[j]);

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

		this.#version = this.#uuidGenerator.create();
	}

	// #endregion Public Methods (20)
}
