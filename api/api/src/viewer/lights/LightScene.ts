import { Light } from "./Light";
import { ILight, ILightScene, ILightScene as LightSceneLogic } from "@shapediver/viewer.rendering-engine.light-engine";
import { vec3 } from "gl-matrix";
import { InputValidator } from "@shapediver/viewer.shared.utils";
import { container } from "tsyringe";
import { Logger } from "@shapediver/viewer.shared.monitoring";
import { TreeNode } from "@shapediver/viewer.shared.node-tree";
import { Viewer } from "../Viewer";
import { AmbientLight } from "../lights/AmbientLight";
import { PointLight } from "../lights/PointLight";
import { SpotLight } from "../lights/SpotLight";
import { DirectionalLight } from "../lights/DirectionalLight";
import { HemisphereLight } from "../lights/HemisphereLight";
import { AbstractLight, ILightEngine, AmbientLight as AmbientLightLogic, DirectionalLight as DirectionalLightLogic, HemisphereLight as HemisphereLightLogic, PointLight as PointLightLogic, SpotLight as SpotLightLogic, LIGHTTYPE } from "@shapediver/viewer.rendering-engine.light-engine";

export class LightScene implements ILightScene {
    // #region Properties (4)

    readonly #lightSceneLogic: LightSceneLogic;
    readonly #viewer: Viewer;
    readonly #lights: { [key: string]: Light } = {};

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

    public get name(): string | undefined {
        return this.#lightSceneLogic.name;
    }

    public get lights(): { [key: string]: Light; } {
        const lightLogics = this.#lightSceneLogic.lights;
        for (let l in lightLogics) {
            if(this.#lights[l]) continue;
            switch (lightLogics[l].type){
                case LIGHTTYPE.AMBIENT:
                    this.#lights[l] = new AmbientLight(<AmbientLightLogic>lightLogics[l]);
                    break;
                case LIGHTTYPE.DIRECTIONAL:
                    this.#lights[l] = new DirectionalLight(<DirectionalLightLogic>lightLogics[l]);
                    break;
                case LIGHTTYPE.HEMISPHERE:
                    this.#lights[l] = new HemisphereLight(<HemisphereLightLogic>lightLogics[l]);
                    break;
                case LIGHTTYPE.POINT:
                    this.#lights[l] = new PointLight(<PointLightLogic>lightLogics[l]);
                    break;
                case LIGHTTYPE.SPOT:
                    this.#lights[l] = new SpotLight(<SpotLightLogic>lightLogics[l]);
                    break;
            }
        }
        return this.#lights;
    }

    public get node(): TreeNode {
        return this.#lightSceneLogic.node;
    }

    // #endregion Public Accessors (3)
}