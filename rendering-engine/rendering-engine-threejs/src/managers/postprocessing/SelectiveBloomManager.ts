import * as THREE from 'three';
import { ITreeNode } from '@shapediver/viewer.shared.node-tree';
import { RenderingEngine } from '../../RenderingEngine';
import { SelectiveBloomEffect } from 'postprocessing';

export class SelectiveBloomManager {
    // #region Properties (2)

    private _selectiveBloomEffect!: SelectiveBloomEffect;
    private _selectiveBloomNodes: ITreeNode[] = [];

    // #endregion Properties (2)

    // #region Constructors (1)

    constructor(private readonly _renderingEngine: RenderingEngine) { }

    // #endregion Constructors (1)

    // #region Public Methods (5)

    public addSelection(node: ITreeNode): void {
        this._selectiveBloomNodes.push(node);
        this.updateSelectiveBloomEffectObjects();
    }

    public clearSelection(): void {
        this._selectiveBloomNodes = [];
        this.updateSelectiveBloomEffectObjects();
    }

    public removeSelection(node: ITreeNode): boolean {
        const index = this._selectiveBloomNodes.indexOf(node);
        if (index !== -1)
            this._selectiveBloomNodes.splice(index, 1);

        this.updateSelectiveBloomEffectObjects();
        return index !== -1;
    }

    public setEffect(selectiveBloomEffect: SelectiveBloomEffect) {
        this._selectiveBloomEffect = selectiveBloomEffect;
        this.updateSelectiveBloomEffectObjects();
    }

    public updateSelectiveBloomEffectObjects() {
        this._selectiveBloomEffect.selection.clear();

        for (let i = 0; i < this._selectiveBloomNodes.length; i++) {
            (this._selectiveBloomNodes[i].convertedObject[this._renderingEngine.id] as THREE.Object3D).traverse(o => {
                if (o instanceof THREE.Mesh)
                    this._selectiveBloomEffect.selection.add(o);
            });
        }
    }

    // #endregion Public Methods (5)
}