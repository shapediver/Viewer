import * as THREE from 'three'
import { AbstractTreeNodeData, ITreeNodeData } from '@shapediver/viewer.shared.node-tree'

export class ThreejsData extends AbstractTreeNodeData {
    // #region Constructors (1)

    constructor(
        private _obj: THREE.Object3D,
        id?: string
    ) {
        super(id);
    }

    // #endregion Constructors (1)

    // #region Public Accessors (2)

    public get obj(): THREE.Object3D {
		return this._obj;
	}

    public set obj(value: THREE.Object3D) {
		this._obj = value;
	}

    // #endregion Public Accessors (2)

    // #region Public Methods (1)

    public clone(): ITreeNodeData {
        return new ThreejsData(this.obj.clone(), this._id);
    }

    // #endregion Public Methods (1)
}