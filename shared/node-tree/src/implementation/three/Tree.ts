import { singleton } from "tsyringe";
import { ITreeNodeThreeJs } from "../../interfaces/three/ITreeNodeThreeJs";
import { ITreeThreeJs } from "../../interfaces/three/ITreeThreeJs";
import { AbstractTree } from "../AbstractTree";
import { TreeNodeThreeJs } from "./TreeNodeThreejs";

@singleton()
export class Tree extends AbstractTree<ITreeNodeThreeJs> implements ITreeThreeJs {
    constructor() {
        super(new TreeNodeThreeJs('root'))
    }
}