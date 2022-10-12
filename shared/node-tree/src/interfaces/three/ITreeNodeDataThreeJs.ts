import { ITreeNodeData } from "../ITreeNodeData";

export interface ITreeNodeDataThreeJs extends ITreeNodeData<ITreeNodeDataThreeJs> {
    // #region Properties (1)

    /**
     * The threeJs object that is created for each viewport as a representation of the tree node data item.
     */
    threeJsObject: { [key:string]: THREE.Object3D | THREE.BufferGeometry | THREE.Material | undefined };

    // #endregion Properties (1)
}