import { ITreeNode } from "../ITreeNode";
import { ITreeNodeDataThreeJs } from "./ITreeNodeDataThreeJs";

export interface ITreeNodeThreeJs extends ITreeNode<ITreeNodeThreeJs, ITreeNodeDataThreeJs> {
    // #region Properties (2)

    /**
     * The threeJs object that is created for each viewport as a representation of the tree node item.
     */
    threeJsObject: { [key:string]: THREE.Object3D };
    /**
     * The update callback that is called whenever the threeJs object is replaced internally.
     * Changes that were done to the object can be reapplied here.
     */
    updateCallbackThreeJsObject: ((newObj: THREE.Object3D, oldObj: THREE.Object3D, viewport: string) => void) | null;

    // #endregion Properties (2)
}