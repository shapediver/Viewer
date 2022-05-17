import * as THREE from 'three'
import { AbstractTreeNodeData, ITreeNodeData } from '@shapediver/viewer.shared.node-tree'
import { IThreejsData } from './IThreejsData';

export class ThreejsData extends AbstractTreeNodeData implements IThreejsData {
    // #region Properties (1)

    #obj: THREE.Object3D;

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(
        obj: THREE.Object3D,
        id?: string
    ) {
        super(id);
        this.#obj = obj;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (2)

    public get obj(): THREE.Object3D {
		return this.#obj;
	}

    public set obj(value: THREE.Object3D) {
		this.#obj = value;
	}

    // #endregion Public Accessors (2)

    // #region Public Methods (1)

    public clone(): IThreejsData {
        return new ThreejsData(this.obj.clone(), this.id);
    }

    // #endregion Public Methods (1)
}