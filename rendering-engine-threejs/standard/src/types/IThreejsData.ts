import * as THREE from 'three'
import { ITreeNodeData } from '@shapediver/viewer.shared.node-tree'

export interface IThreejsData extends ITreeNodeData {
    // #region Properties (1)

    obj: THREE.Object3D;

    // #endregion Properties (1)

    // #region Public Methods (1)

    clone(): IThreejsData;

    // #endregion Public Methods (1)
}