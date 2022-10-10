import { ITreeNode } from "../ITreeNode";
import { ITreeNodeDataThreeJs } from "./ITreeNodeDataThreeJs";

export interface ITreeNodeThreeJs extends ITreeNode<ITreeNodeThreeJs, ITreeNodeDataThreeJs> {    
    threeJsObject: { [key:string]: THREE.Object3D };
    updateCallbackThreeJsObject: ((newObj: THREE.Object3D, oldObj: THREE.Object3D, viewport: string) => void) | null;
}