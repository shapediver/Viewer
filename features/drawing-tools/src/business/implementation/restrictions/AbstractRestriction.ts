import THREE from 'three';
import { DrawingToolsManager } from '../DrawingToolsManager';
import { IRestrictionBase } from '../../interfaces/IRestrictionBase';
import { ThreejsData, TreeNode } from '@shapediver/viewer';

export abstract class AbstractRestriction implements IRestrictionBase {
    // #region Properties (7)

    readonly #id: string;
    readonly #visualizationNode: TreeNode = new TreeNode('RestrictionVisualizationNode');

    #available: boolean = true;
    #enabled: boolean = true;
    #showVisualization: boolean = false;

    protected readonly drawingToolsManager: DrawingToolsManager;

    protected object3D!: THREE.Object3D;

    // #endregion Properties (7)

    // #region Constructors (1)

    constructor(drawingToolsManager: DrawingToolsManager, id: string) {
        this.drawingToolsManager = drawingToolsManager;
        this.#id = id;
        this.createGridHelperObject();
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (7)

    public get available(): boolean {
        return this.#available;
    }

    public set available(value: boolean) {
        this.#available = value;
        this.object3D.visible = this.isVisible();
        this.visibilityChanged(this.object3D.visible);
    }

    public get enabled(): boolean {
        return this.#enabled;
    }

    public set enabled(value: boolean) {
        this.#enabled = value;
        this.object3D.visible = this.isVisible();
        this.visibilityChanged(this.object3D.visible);
    }

    public get id(): string {
        return this.#id;
    }

    public get showVisualization(): boolean {
        return this.#showVisualization;
    }

    public set showVisualization(value: boolean) {
        this.#showVisualization = value;
        this.object3D.visible = this.isVisible();
        this.visibilityChanged(this.object3D.visible);
    }

    // #endregion Public Getters And Setters (7)

    // #region Public Methods (1)

    public removeVisualization(): void {
        this.drawingToolsManager.parentNode.removeChild(this.#visualizationNode);
        this.drawingToolsManager.parentNode.updateVersion(false, false);
        this.drawingToolsManager.viewport.updateNode(this.drawingToolsManager.parentNode);
    }

    // #endregion Public Methods (1)

    // #region Protected Methods (1)

    protected canBeActive(): boolean {
        return this.#available && this.#enabled;
    }

    // #endregion Protected Methods (1)

    // #region Protected Abstract Methods (1)

    protected abstract visibilityChanged(visible: boolean): void;

    // #endregion Protected Abstract Methods (1)

    // #region Private Methods (2)

    private createGridHelperObject(): void {
        this.object3D = new THREE.Object3D();
        this.object3D.visible = false;

        const node = new TreeNode('ThreeJsDataNode');

        const data = new ThreejsData(this.object3D);
        node.addData(data);

        this.#visualizationNode.addChild(node);
        this.#visualizationNode.updateVersion();
        this.drawingToolsManager.parentNode.addChild(this.#visualizationNode);
        this.drawingToolsManager.parentNode.updateVersion(false, false);
        this.drawingToolsManager.viewport.updateNode(this.drawingToolsManager.parentNode);
    }

    private isVisible(): boolean {
        return this.#available && this.#enabled && this.#showVisualization;
    }

    // #endregion Private Methods (2)
}