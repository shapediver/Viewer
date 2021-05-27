import { Light } from "./Light";
import { ILight, ILightScene, ILightScene as LightSceneLogic } from "@shapediver/viewer.rendering-engine.light-engine";
import { vec3 } from "gl-matrix";
import { InputValidator } from "@shapediver/viewer.shared.utils";
import { container } from "tsyringe";
import { Logger } from "@shapediver/viewer.shared.monitoring";
import { TreeNode } from "@shapediver/viewer.shared.node-tree";
import { Viewer } from "../Viewer";

export class LightScene implements ILightScene {
    // #region Properties (4)

    readonly #lightSceneLogic: LightSceneLogic;
    readonly #viewer: Viewer;

    // #endregion Properties (4)

    // #region Constructors (1)

    /**
     * @ignore
     * @param light 
     */
    constructor(viewer: Viewer, lightSceneLogic: LightSceneLogic) {
        this.#viewer = viewer;
        this.#lightSceneLogic = lightSceneLogic;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (3)

    public get id(): string {
        return this.#lightSceneLogic.id;
    }

    public get lights(): { [key: string]: Light; } {
        const lightLogic = this.#lightSceneLogic.lights;
        const lights: { [key: string]: Light } = {};
        for (let l in lightLogic)
            lights[l] = this.#viewer.getLight(l);
        return lights;
    }

    public get node(): TreeNode {
        return this.#lightSceneLogic.node;
    }

    // #endregion Public Accessors (3)
}