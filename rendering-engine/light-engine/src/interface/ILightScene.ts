import { TreeNode } from "@shapediver/viewer.shared.node-tree";
import { ILight } from "./ILight";

export interface ILightScene {
    // #region Properties (3)

    id: string;
    lights: { [key: string]: ILight; };
    node: TreeNode;

    // #endregion Properties (3)

    // #region Public Methods (3)

    addLight(light: ILight): void;
    getLight(id: string): ILight;
    removeLight(light: ILight): boolean;

    // #endregion Public Methods (3)
}