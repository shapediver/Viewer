import { ITreeNodeDataThreeJs } from "../../interfaces/three/ITreeNodeDataThreeJs";
import { AbstractTreeNodeData } from "../AbstractTreeNodeData";

export abstract class AbstractTreeNodeDataThreeJs extends AbstractTreeNodeData<ITreeNodeDataThreeJs> implements ITreeNodeDataThreeJs {
    #threeJsObject: { [key: string]: THREE.Object3D | THREE.BufferGeometry | THREE.Material | undefined } = {};
    #updateCallbackThreeJsObject: ((newObj: THREE.Object3D | THREE.BufferGeometry | THREE.Material | undefined, oldObj: THREE.Object3D | THREE.BufferGeometry | THREE.Material | undefined, viewport: string) => void) | null = null;

    public get threeJsObject(): { [key: string]: THREE.Object3D | THREE.BufferGeometry | THREE.Material | undefined } {
        return this.#threeJsObject;
    }
}