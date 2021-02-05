import { AbstractTreeNodeData, ITreeNodeData } from "@shapediver/viewer.node-tree.tree-node-data";
import * as BABYLON from 'babylonjs'

export class BabylonjsData extends AbstractTreeNodeData {
    // #region Constructors (1)

    constructor(
        private _obj: BABYLON.Mesh,
        id?: string
    ) {
        super(id);
    }

    // #endregion Constructors (1)

    // #region Public Accessors (2)

    /**
     * Getter obj
     * @return {BABYLON.Mesh}
     */
    public get obj(): BABYLON.Mesh {
		return this._obj;
	}

    /**
     * Setter obj
     * @param {BABYLON.Mesh} value
     */
    public set obj(value: BABYLON.Mesh) {
		this._obj = value;
	}

    // #endregion Public Accessors (2)

    // #region Public Methods (1)

    public clone(): ITreeNodeData {
        return new BabylonjsData(this.obj.clone(), this._id);
    }

    // #endregion Public Methods (1)
}