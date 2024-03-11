import THREE from 'three';
import { DrawingToolsManager } from '../DrawingToolsManager';
import { IRestrictionBase } from '../../interfaces/IRestrictionBase';
import { sceneTree, ThreejsData, TreeNode } from '@shapediver/viewer';

export abstract class AbstractRestriction implements IRestrictionBase {
    // #region Properties (6)

    readonly #id: string;
    readonly #visualizationNode: TreeNode = new TreeNode();

    #enabled: boolean = true;
    #showVisualization: boolean = false;

    protected readonly drawingToolsManager: DrawingToolsManager;

    protected object3D!: THREE.Object3D;

    // #endregion Properties (6)

    // #region Constructors (1)

    constructor(drawingToolsManager: DrawingToolsManager, id: string) {
        this.drawingToolsManager = drawingToolsManager;
        this.#id = id;
        this.createGridHelperObject();
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (5)

    public get enabled(): boolean {
        return this.#enabled;
    }

    public set enabled(value: boolean) {
        this.#enabled = value;
        this.object3D.visible = value && this.#showVisualization;
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
        this.object3D.visible = value && this.#enabled;
        this.visibilityChanged(this.object3D.visible);
    }

    // #endregion Public Getters And Setters (5)

    // #region Public Methods (1)

    public removeVisualization(): void {
        sceneTree.root.removeChild(this.#visualizationNode);
        sceneTree.root.updateVersion();
    }

    // #endregion Public Methods (1)

    // #region Protected Abstract Methods (1)

    protected abstract visibilityChanged(visible: boolean): void;

    // #endregion Protected Abstract Methods (1)

    // #region Private Methods (1)

    private createGridHelperObject(): void {
        this.object3D = new THREE.Object3D();
        this.object3D.visible = false;

        const node = new TreeNode();

        const data = new ThreejsData(this.object3D);
        node.addData(data);

        this.#visualizationNode.addChild(node);
        this.#visualizationNode.updateVersion();
        sceneTree.root.addChild(this.#visualizationNode);
        sceneTree.root.updateVersion();
    }

    // #endregion Private Methods (1)
}