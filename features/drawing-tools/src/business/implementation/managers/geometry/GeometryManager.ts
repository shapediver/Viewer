import { DrawingToolsManager, MATERIAL_INDEX } from '../../DrawingToolsManager';
import { GeometryManagerHelper } from './helpers/GeometryManagerHelper';
import { GeometryState } from './GeometryState';
import { IManager } from '../../../interfaces/IManager';
import { ITreeNode, TreeNode } from '@shapediver/viewer.shared.node-tree';
import { vec3 } from 'gl-matrix';

export class GeometryManager implements IManager {
    // #region Properties (4)

    readonly #geometryState: GeometryState;
    readonly #originalParentNode: ITreeNode;
    readonly #parentNode: ITreeNode;

    #geometryManagerHelper: GeometryManagerHelper;

    // #endregion Properties (4)

    // #region Constructors (1)

    constructor(drawingToolsManager: DrawingToolsManager) {
        this.#originalParentNode = drawingToolsManager.parentNode;

        // create a new node with the geometry data
        const parentNode = new TreeNode('DrawingToolsGeometry');
        this.#originalParentNode.addChild(parentNode);

        this.#parentNode = parentNode;

        this.#geometryState = new GeometryState(drawingToolsManager, this);
        this.#geometryManagerHelper = new GeometryManagerHelper(drawingToolsManager, this, this.#geometryState);
        this.#geometryState.init();
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (2)

    public get geometryState(): GeometryState {
        return this.#geometryState;
    }

    public get parentNode(): ITreeNode {
        return this.#parentNode;
    }

    // #endregion Public Getters And Setters (2)

    // #region Public Methods (10)

    public addPoint(index: number, position?: vec3, temporary = false): void {
        this.#geometryManagerHelper.addPoint(index, position, temporary);
    }

    public canAddPoint(): boolean {
        return this.#geometryState.canAddPoint();
    }

    public canRemovePoint(): boolean {
        return this.#geometryState.canRemovePoint();
    }

    public close(): void {
        this.#geometryState.close();
        this.#originalParentNode.removeChild(this.#parentNode);
        this.#originalParentNode.updateVersion();
    }

    public createLineIndices(loop: boolean): void {
        this.#geometryState.createLineIndices(loop);
    }

    public movePoint(index: number, position: vec3, temporary = false): void {
        this.#geometryManagerHelper.movePoint(index, position, temporary);
    }

    public removePoint(removalIndex: number, temporary = false): void {
        this.#geometryManagerHelper.removePoint(removalIndex, temporary);
    }

    public removePoints(removalIndices: number[]): void {
        this.#geometryManagerHelper.removePoints(removalIndices);
    }

    public resetMaterialIndices(): void {
        this.#geometryManagerHelper.resetMaterialIndices();
    }

    public updateMaterialIndex(index: number, materialIndex: MATERIAL_INDEX): void {
        this.#geometryManagerHelper.updateMaterialIndex(index, materialIndex);
    }

    // #endregion Public Methods (10)
}
