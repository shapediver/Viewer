import { ITreeNodeData } from "../ITreeNodeData";

export interface ITreeNodeDataThreeJs extends ITreeNodeData<ITreeNodeDataThreeJs> {    
    threeJsObject: { [key:string]: THREE.Object3D | THREE.BufferGeometry | THREE.Material | undefined };
    updateCallbackThreeJsObject: ((newObj: THREE.Object3D, oldObj: THREE.Object3D, viewport: string) => void) | null;
}