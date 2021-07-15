import {
  ILight,
  ILightScene,
  ILightScene as LightSceneLogic,
  LightScene as LightSceneLogicImplementation,
} from '@shapediver/viewer.rendering-engine.light-engine'
import { vec3 } from 'gl-matrix'
import { InputValidator, SDError } from '@shapediver/viewer.shared.utils'
import { container } from 'tsyringe'
import { Logger, LOGGINGTOPIC } from '@shapediver/viewer.shared.utils'
import { TreeNode } from '@shapediver/viewer.shared.node-tree'
import {
  AbstractLight,
  AmbientLight as AmbientLightLogic,
  DirectionalLight as DirectionalLightLogic,
  HemisphereLight as HemisphereLightLogic,
  ILightEngine,
  LIGHTTYPE,
  PointLight as PointLightLogic,
  SpotLight as SpotLightLogic,
} from '@shapediver/viewer.rendering-engine.light-engine'

import { Light } from './Light'
import { Viewer } from '../Viewer'
import { AmbientLight } from '../lights/AmbientLight'
import { PointLight } from '../lights/PointLight'
import { SpotLight } from '../lights/SpotLight'
import { DirectionalLight } from '../lights/DirectionalLight'
import { HemisphereLight } from '../lights/HemisphereLight'

export class LightScene implements ILightScene {
    // #region Properties (8)

    readonly #lightSceneLogic: LightSceneLogic;
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #viewer: Viewer;
    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #updateCB = () => {
        (<any>this.id) = this.#lightSceneLogic.id;
        (<any>this.name) = this.#lightSceneLogic.name;

        const lightLogics = this.#lightSceneLogic.lights;
        for (let l in lightLogics) {
            if(this.lights[l]) continue;
            switch (lightLogics[l].type){
                case LIGHTTYPE.AMBIENT:
                    this.lights[l] = new AmbientLight(<AmbientLightLogic>lightLogics[l], this.#viewer);
                    break;
                case LIGHTTYPE.DIRECTIONAL:
                    this.lights[l] = new DirectionalLight(<DirectionalLightLogic>lightLogics[l], this.#viewer);
                    break;
                case LIGHTTYPE.HEMISPHERE:
                    this.lights[l] = new HemisphereLight(<HemisphereLightLogic>lightLogics[l], this.#viewer);
                    break;
                case LIGHTTYPE.POINT:
                    this.lights[l] = new PointLight(<PointLightLogic>lightLogics[l], this.#viewer);
                    break;
                case LIGHTTYPE.SPOT:
                    this.lights[l] = new SpotLight(<SpotLightLogic>lightLogics[l], this.#viewer);
                    break;
            }
        }

        for (let l in this.lights) {
            if(!lightLogics[l])
                delete this.lights[l];
        }

        (<any>this.name) = this.#lightSceneLogic.name;
        (<any>this.node) = this.#lightSceneLogic.node;
    }

    readonly id!: string;
    readonly lights: { [key: string]: Light; } = {};
    readonly name!: string | undefined;
    readonly node!: TreeNode;

    // #endregion Properties (8)

    // #region Constructors (1)

    /**
     * @ignore
     * @param light 
     */
    constructor(lightSceneLogic: LightSceneLogic, viewer: Viewer) {
        this.#lightSceneLogic = lightSceneLogic;
        this.#viewer = viewer;
        (<LightSceneLogicImplementation>this.#lightSceneLogic).addUpdateCB(this.#updateCB);
        this.#updateCB();
        this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `LightScene(${this.id}).constructor: LightScene api created.`);
    }

    /**
     * The name of the light scene
     */
    public updateName(value: string | undefined) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `LightScene(${this.id}).updateName: Updating Name to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `LightScene(${this.id}).updateName`, value, 'string', false);
            this.#lightSceneLogic.name = value;
            this.#logger.info(LOGGINGTOPIC.LIGHT, `LightScene(${this.id}).updateName: name was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.LIGHT, new SDError(e.message, e), `LightScene(${this.id}).updateName: Something unexpected happened.`, true)
        }
    }

    // #endregion Constructors (1)
}