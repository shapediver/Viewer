import THREE from 'three';
import { DrawingToolsManager } from '../DrawingToolsManager';
import { IRestriction, RestrictionType } from '../../interfaces/IRestriction';
import { sceneTree, ThreejsData, TreeNode } from '@shapediver/viewer';

export abstract class AbstractRestriction implements IRestriction {
    // #region Properties (7)

    private readonly _id: string;
    private readonly _restrictionType: RestrictionType;
    private readonly _visualizationNode: TreeNode = new TreeNode();

    private _enabled: boolean = true;
    private _showVisualization: boolean = false;

    protected readonly _drawingToolsManager: DrawingToolsManager;

    protected _object3D!: THREE.Object3D;

    // #endregion Properties (7)

    // #region Constructors (1)

    constructor(drawingToolsManager: DrawingToolsManager, id: string, restrictionType: RestrictionType) {
        this._drawingToolsManager = drawingToolsManager;
        this._id = id;
        this._restrictionType = restrictionType;
        this.createGridHelperObject();
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (6)

    public get enabled(): boolean {
        return this._enabled;
    }

    public set enabled(value: boolean) {
        this._enabled = value;
        this._object3D.visible = value && this._showVisualization;
        this.visibilityChanged(this._object3D.visible);
    }

    public get id(): string {
        return this._id;
    }

    public get restrictionType(): RestrictionType {
        return this._restrictionType;
    }

    public get showVisualization(): boolean {
        return this._showVisualization;
    }

    public set showVisualization(value: boolean) {
        this._showVisualization = value;
        this._object3D.visible = value && this._enabled;
        this.visibilityChanged(this._object3D.visible);
    }

    // #endregion Public Getters And Setters (6)

    // #region Public Methods (1)

    public removeVisualization(): void {
        sceneTree.root.removeChild(this._visualizationNode);
        sceneTree.root.updateVersion();
    }

    // #endregion Public Methods (1)

    // #region Protected Abstract Methods (1)

    protected abstract visibilityChanged(visible: boolean): void;

    // #endregion Protected Abstract Methods (1)

    // #region Private Methods (1)

    private createGridHelperObject(): void {
        this._object3D = new THREE.Object3D();
        this._object3D.visible = false;

        const node = new TreeNode();

        const data = new ThreejsData(this._object3D);
        node.addData(data);

        this._visualizationNode.addChild(node);
        this._visualizationNode.updateVersion();
        sceneTree.root.addChild(this._visualizationNode);
        sceneTree.root.updateVersion();
    }

    // #endregion Private Methods (1)
}