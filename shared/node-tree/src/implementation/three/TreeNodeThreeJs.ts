import { ITreeNodeDataThreeJs } from "../../interfaces/three/ITreeNodeDataThreeJs";
import { ITreeNodeThreeJs } from "../../interfaces/three/ITreeNodeThreeJs";
import { AbstractTreeNode } from "../AbstractTreeNode";

export class TreeNodeThreeJs extends AbstractTreeNode<ITreeNodeThreeJs, ITreeNodeDataThreeJs> implements ITreeNodeThreeJs {
    #threeJsObject: { [key: string]: THREE.Object3D } = {};
    #updateCallbackThreeJsObject: ((newObj: THREE.Object3D, oldObj: THREE.Object3D, viewport: string) => void) | null = null;

    public get threeJsObject(): { [key: string]: THREE.Object3D } {
        return this.#threeJsObject;
    }

    public get updateCallbackThreeJsObject(): ((newObj: THREE.Object3D, oldObj: THREE.Object3D, viewport: string) => void) | null {
        return this.#updateCallbackThreeJsObject;
    }

    public set updateCallbackThreeJsObject(value: ((newObj: THREE.Object3D, oldObj: THREE.Object3D, viewport: string) => void) | null) {
        this.#updateCallbackThreeJsObject = value;
    }
}