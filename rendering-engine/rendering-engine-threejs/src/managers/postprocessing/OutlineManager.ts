import { ITreeNode } from "@shapediver/viewer.shared.node-tree";
import { OutlineEffect } from "postprocessing";
import * as THREE from "three";
import { RenderingEngine } from "../../RenderingEngine";

export class OutlineManager {
    // #region Properties (2)

    private _outlineEffect!: OutlineEffect;
    private _outlineNodes: ITreeNode[] = [];

    // #endregion Properties (2)

    // #region Constructors (1)

    constructor(private readonly _renderingEngine: RenderingEngine) { }

    // #endregion Constructors (1)

    // #region Public Methods (5)

    public addSelection(node: ITreeNode): void {
        this._outlineNodes.push(node);
        this.updateOutlineEffectObjects();
    }

    public clearSelection(): void {
        this._outlineNodes = [];
        this.updateOutlineEffectObjects();
    }

    public removeSelection(node: ITreeNode): boolean {
        const index = this._outlineNodes.indexOf(node);
        if (index !== -1)
            this._outlineNodes.splice(index, 1);

        this.updateOutlineEffectObjects();
        return index !== -1;
    }

    public setEffect(outlineEffect: OutlineEffect) {
        this._outlineEffect = outlineEffect;
        this.updateOutlineEffectObjects();
    }

    public updateOutlineEffectObjects() {
        this._outlineEffect.selection.clear();

        for (let i = 0; i < this._outlineNodes.length; i++) {
            this._outlineNodes[i].threeJsObject[this._renderingEngine.id].traverse(o => {
                if (o instanceof THREE.Mesh)
                    this._outlineEffect.selection.add(o);
            })
        }
    }

    // #endregion Public Methods (5)
}