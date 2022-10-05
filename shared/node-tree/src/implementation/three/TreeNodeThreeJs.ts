import { ITreeNodeThreeJs } from "../../interfaces/three/ITreeNodeThreeJs";
import { AbstractTreeNode } from "../AbstractTreeNode";

export class TreeNodeThreeJs extends AbstractTreeNode<ITreeNodeThreeJs> implements ITreeNodeThreeJs {
    #threeJsObject: { [key: string]: THREE.Object3D } = {};

    public get threeJsObject(): { [key: string]: THREE.Object3D } {
        return this.#threeJsObject;
    }
}