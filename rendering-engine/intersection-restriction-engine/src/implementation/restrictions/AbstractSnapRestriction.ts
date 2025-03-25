import {IViewportApi} from "@shapediver/viewer";
import {ThreejsData} from "@shapediver/viewer.rendering-engine.rendering-engine-threejs";
import {ITreeNode, TreeNode} from "@shapediver/viewer.shared.node-tree";
import {IRay} from "@shapediver/viewer.shared.types";
import {vec3} from "gl-matrix";
import * as THREE from "three";
import {
	RestrictionMetaData,
	RestrictionResult,
} from "../../interfaces/IRestriction";
import {ISnapRestriction} from "../../interfaces/ISnapRestriction";

export abstract class AbstractSnapRestriction implements ISnapRestriction {
	// #region Properties (10)

	readonly #id: string;
	readonly #parentNode: ITreeNode;
	readonly #viewport: IViewportApi;
	readonly #visualizationNode: TreeNode = new TreeNode(
		"RestrictionVisualizationNode",
	);

	#showVisualization: boolean = false;

	protected _active: boolean = false;
	protected _enabled: boolean = true;
	protected _enabledEditable: boolean = true;
	protected _object3D!: THREE.Object3D;
	protected _priority: number = 0;

	// #endregion Properties (10)

	// #region Constructors (1)

	constructor(viewport: IViewportApi, parentNode: ITreeNode, id: string) {
		this.#parentNode = parentNode;
		this.#viewport = viewport;
		this.#id = id;
		this.createGridHelperObject();
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (11)

	public get active(): boolean {
		return this._active;
	}

	public set active(value: boolean) {
		this._active = value;
	}

	public get enabled(): boolean {
		return this._enabled;
	}

	public set enabled(value: boolean) {
		if (this._enabledEditable === false) return;

		this._enabled = value;
		this.visibilityChanged(this._object3D.visible);
	}

	public get enabledEditable(): boolean {
		return this._enabledEditable;
	}

	public set enabledEditable(value: boolean) {
		this._enabledEditable = value;
	}

	public get id(): string {
		return this.#id;
	}

	public get priority(): number {
		return this._priority;
	}

	public set priority(value: number) {
		this._priority = value;
	}

	public get showVisualization(): boolean {
		return this.#showVisualization;
	}

	public set showVisualization(value: boolean) {
		this.#showVisualization = value;
		this._object3D.visible = value;
		this.visibilityChanged(this._object3D.visible);
	}

	// #endregion Public Getters And Setters (11)

	// #region Public Methods (1)

	public removeVisualization(): void {
		this.#parentNode.removeChild(this.#visualizationNode);
		this.#parentNode.updateVersion(false, false);
		this.#viewport.updateNode(this.#parentNode);
	}

	// #endregion Public Methods (1)

	// #region Public Abstract Methods (1)

	public abstract snap(
		ray: IRay,
		point: vec3,
		distance: number,
		metaData?: RestrictionMetaData,
	): RestrictionResult | undefined;

	// #endregion Public Abstract Methods (1)

	// #region Protected Abstract Methods (1)

	protected abstract visibilityChanged(visible: boolean): void;

	// #endregion Protected Abstract Methods (1)

	// #region Private Methods (1)

	private createGridHelperObject(): void {
		this._object3D = new THREE.Object3D();
		this._object3D.visible = false;

		const node = new TreeNode("ThreeJsDataNode");

		const data = new ThreejsData(this._object3D);
		node.addData(data);

		this.#visualizationNode.addChild(node);
		this.#visualizationNode.updateVersion();
		this.#parentNode.addChild(this.#visualizationNode);
		this.#parentNode.updateVersion(false, false);
		this.#viewport.updateNode(this.#parentNode);
	}

	// #endregion Private Methods (1)
}
