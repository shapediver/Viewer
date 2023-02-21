import { ITreeNodeThreeJs } from "../../interfaces/three/ITreeNodeThreeJs";
import { ITreeThreeJs } from "../../interfaces/three/ITreeThreeJs";
import { AbstractTree } from "../AbstractTree";
import { TreeNodeThreeJs } from "./TreeNodeThreejs";

export class Tree extends AbstractTree<ITreeNodeThreeJs> implements ITreeThreeJs {
    // #region Properties (1)

    private static _instance: Tree;

    // #endregion Properties (1)

    // #region Constructors (1)

    private constructor() {
        super(new TreeNodeThreeJs('root'))
    }

    // #endregion Constructors (1)

    // #region Public Static Accessors (1)

    public static get instance() {
        return this._instance || (this._instance = new this());
    }

    // #endregion Public Static Accessors (1)
}