import { ITreeNodeData } from "../ITreeNodeData";

export interface ITreeNodeDataThreeJs extends ITreeNodeData<ITreeNodeDataThreeJs> {    
    threeJsObject: { [key:string]: THREE.Object3D | THREE.BufferGeometry | THREE.Material | undefined };
}