import {IViewportApi} from "@shapediver/viewer";
import {ThreejsData} from "@shapediver/viewer.rendering-engine.rendering-engine-threejs";
import {ITreeNode, TreeNode} from "@shapediver/viewer.shared.node-tree";
import {IRay} from "@shapediver/viewer.shared.types";
import {vec3} from "gl-matrix";
import * as THREE from "three";
import {
	IRestriction,
	RestrictionMetaData,
	RestrictionProperties,
	RestrictionResult,
	RESTRICTION_TYPE,
} from "../../interfaces/IRestriction";
import {ISnapRestriction} from "../../interfaces/ISnapRestriction";

export abstract class AbstractRestriction implements IRestriction {
	// #region Properties (12)

	readonly #id: string;
	readonly #parentNode: ITreeNode;
	readonly #type: RESTRICTION_TYPE;
	readonly #viewport: IViewportApi;
	readonly #visualizationNode: TreeNode = new TreeNode(
		"RestrictionVisualizationNode",
	);

	#hideable: boolean = false;
	#priority: number;
	#rotation: {axis: vec3; angle: number};
	#showVisualization: boolean = false;

	protected _enabled: boolean = true;
	protected _enabledEditable: boolean = true;
	protected _object3D!: THREE.Object3D;
	protected _snapRestrictions: {[key: string]: ISnapRestriction} = {};

	// #endregion Properties (12)

	// #region Constructors (1)

	constructor(
		viewport: IViewportApi,
		parentNode: ITreeNode,
		id: string,
		properties: RestrictionProperties,
	) {
		this.#parentNode = parentNode;
		this.#viewport = viewport;
		this.#id = id;
		this.#type = properties.type;
		this.#rotation = properties.rotation || {
			axis: vec3.fromValues(0, 0, 1),
			angle: 0,
		};
		this.#priority = properties.priority || -1;
		this.#hideable = properties.hideable || false;
		this.createGridHelperObject();
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (11)

	public get enabled(): boolean {
		return this._enabled;
	}

	public set enabled(value: boolean) {
		if (this._enabledEditable === false) return;

		this._enabled = value;
		this.visibilityChanged(this._object3D.visible);
	}

	public get hideable(): boolean {
		return this.#hideable;
	}

	public set hideable(value: boolean) {
		this.#hideable = value;
	}

	public get id(): string {
		return this.#id;
	}

	public get priority(): number {
		return this.#priority;
	}

	public set priority(value: number) {
		this.#priority = value;
	}

	public get rotation(): {axis: vec3; angle: number} {
		return this.#rotation;
	}

	public set rotation(value: {axis: vec3; angle: number}) {
		this.#rotation = value;
	}

	public get showVisualization(): boolean {
		return this.#showVisualization;
	}

	public set showVisualization(value: boolean) {
		this.#showVisualization = value;
		this._object3D.visible = value;
		this.visibilityChanged(this._object3D.visible);
	}

	public get snapRestrictions(): {[key: string]: ISnapRestriction} {
		return this._snapRestrictions;
	}

	public get type(): RESTRICTION_TYPE {
		return this.#type;
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

	public abstract rayTrace(
		ray: IRay,
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
