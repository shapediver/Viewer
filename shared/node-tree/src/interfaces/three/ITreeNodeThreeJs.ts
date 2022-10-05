import { ITreeNode } from "../ITreeNode";

export interface ITreeNodeThreeJs extends ITreeNode<ITreeNodeThreeJs> {    
    threeJsObject: { [key:string]: THREE.Object3D };
}