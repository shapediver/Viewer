import THREE from 'three';
import { DrawingToolsManager } from '../DrawingToolsManager';
import { IRestrictionBase } from '../../interfaces/IRestrictionBase';
import { ThreejsData, TreeNode } from '@shapediver/viewer';

export abstract class AbstractRestriction implements IRestrictionBase {
    // #region Properties (7)

    readonly #id: string;
    readonly #visualizationNode: TreeNode = new TreeNode('RestrictionVisualizationNode');

    #showVisualization: boolean = false;

    protected readonly drawingToolsManager: DrawingToolsManager;

    protected _enabled: boolean = true;
    protected _enabledEditable: boolean = true;
    protected _object3D!: THREE.Object3D;

    // #endregion Properties (7)

    // #region Constructors (1)

    constructor(drawingToolsManager: DrawingToolsManager, id: string) {
        this.drawingToolsManager = drawingToolsManager;
        this.#id = id;
        this.createGridHelperObject();
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (5)

    public get enabled(): boolean {
        return this._enabled;
    }

    public set enabled(value: boolean) {
        if(this._enabledEditable === false) return;

        this._enabled = value;
        this._object3D.visible = this.isVisible();
        this.visibilityChanged(this._object3D.visible);
    }

    public get id(): string {
        return this.#id;
    }

    public get showVisualization(): boolean {
        return this.#showVisualization;
    }

    public set showVisualization(value: boolean) {
        this.#showVisualization = value;
        this._object3D.visible = this.isVisible();
        this.visibilityChanged(this._object3D.visible);
    }

    // #endregion Public Getters And Setters (5)

    // #region Public Methods (1)

    public removeVisualization(): void {
        this.drawingToolsManager.parentNode.removeChild(this.#visualizationNode);
        this.drawingToolsManager.parentNode.updateVersion(false, false);
        this.drawingToolsManager.viewport.updateNode(this.drawingToolsManager.parentNode);
    }

    // #endregion Public Methods (1)

    // #region Protected Abstract Methods (1)

    protected abstract visibilityChanged(visible: boolean): void;

    // #endregion Protected Abstract Methods (1)

    // #region Private Methods (2)

    private createGridHelperObject(): void {
        this._object3D = new THREE.Object3D();
        this._object3D.visible = false;

        const node = new TreeNode('ThreeJsDataNode');

        const data = new ThreejsData(this._object3D);
        node.addData(data);

        this.#visualizationNode.addChild(node);
        this.#visualizationNode.updateVersion();
        this.drawingToolsManager.parentNode.addChild(this.#visualizationNode);
        this.drawingToolsManager.parentNode.updateVersion(false, false);
        this.drawingToolsManager.viewport.updateNode(this.drawingToolsManager.parentNode);
    }

    private isVisible(): boolean {
        return this._enabled && this.#showVisualization;
    }

    // #endregion Private Methods (2)
}