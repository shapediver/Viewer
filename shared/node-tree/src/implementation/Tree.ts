import {ITree} from "../interfaces/ITree";
import {ITreeNode} from "../interfaces/ITreeNode";
import {TreeNode} from "./TreeNode";

export class Tree implements ITree {
	// #region Properties (2)

	readonly #root: ITreeNode;

	private static _instance: Tree;

	// #endregion Properties (2)

	// #region Constructors (1)

	private constructor() {
		this.#root = new TreeNode("root");
	}

	// #endregion Constructors (1)

	// #region Public Static Getters And Setters (1)

	public static get instance() {
		return this._instance || (this._instance = new this());
	}

	// #endregion Public Static Getters And Setters (1)

	// #region Public Getters And Setters (1)

	public get root(): ITreeNode {
		return this.#root;
	}

	// #endregion Public Getters And Setters (1)

	// #region Public Methods (5)

	public addNode(
		node: ITreeNode,
		parent: ITreeNode = this.#root,
		root: ITreeNode = this.#root,
	): boolean {
		if (root === parent) {
			root.addChild(node);
			return true;
		}

		for (let i = 0; i < root.children.length; i++) {
			const child = root.children[i];
			if (child && this.addNode(node, parent, child)) {
				return true;
			}
		}
		return false;
	}

	public addNodeAtPath(
		node: ITreeNode,
		path: string = this.root.getPath(),
		root: ITreeNode = this.#root,
	): boolean {
		if (root.name === path) {
			root.addChild(node);
			return true;
		}

		const pathStart = path.substr(0, path.indexOf("."));
		if (root.name === pathStart) {
			const shortenedPath = path.substr(
				pathStart.length + 1,
				path.length,
			);

			for (let i = 0; i < root.children.length; i++) {
				const child = root.children[i];
				if (child && this.addNodeAtPath(node, shortenedPath, child)) {
					return true;
				}
			}
		}
		return false;
	}

	public getNodeAtPath(
		path: string = this.root.getPath(),
		root: ITreeNode = this.#root,
	): ITreeNode | null {
		if (root.name === path) return root;

		const pathStart = path.substr(0, path.indexOf("."));
		if (root.name === pathStart) {
			const shortenedPath = path.substr(
				pathStart.length + 1,
				path.length,
			);

			for (let i = 0; i < root.children.length; i++) {
				const child = root.children[i];
				const res = this.getNodeAtPath(shortenedPath, child);
				if (res) return res;
			}
		}
		return null;
	}

	public removeNode(node: ITreeNode, root: ITreeNode = this.#root): boolean {
		if (root.hasChild(node)) {
			root.removeChild(node);
			return true;
		}

		for (let i = 0; i < root.children.length; i++) {
			const child = root.children[i];
			if (child && this.removeNode(node, child)) {
				return true;
			}
		}

		return false;
	}

	public removeNodeAtPath(
		path: string,
		root: ITreeNode = this.#root,
	): boolean {
		if (root.name === path) {
			root.parent?.removeChild(root);
			return true;
		}

		const pathStart = path.substr(0, path.indexOf("."));
		if (root.name === pathStart) {
			const shortenedPath = path.substr(
				pathStart.length + 1,
				path.length,
			);

			for (let i = 0; i < root.children.length; i++) {
				const child = root.children[i];
				if (child && this.removeNodeAtPath(shortenedPath, child)) {
					return true;
				}
			}
		}
		return false;
	}

	// #endregion Public Methods (5)
}
