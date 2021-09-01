import { PointLight as PointLightLogic } from '@shapediver/viewer.rendering-engine.light-engine'
import { vec3 } from 'gl-matrix'
import { InputValidator, SDError } from '@shapediver/viewer.shared.utils'
import { container } from 'tsyringe'
import { Logger, LOGGINGTOPIC } from '@shapediver/viewer.shared.utils'

import { Light } from './Light'
import { Viewer } from '../Viewer'

export class PointLight extends Light {
    // #region Properties (7)

    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #light: PointLightLogic;
    readonly #viewer: Viewer;
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #updateCB = () => {
        (<any>this.decay) = this.#light.decay;
        (<any>this.distance) = this.#light.distance;
        (<any>this.position) = this.#light.position;
    }

    readonly decay!: number;
    readonly distance!: number;
    readonly position!: vec3;

    // #endregion Properties (7)

    // #region Constructors (1)

    /**
     * @ignore
     * @param light 
     */
    constructor(light: PointLightLogic, viewer: Viewer) {
        super(light, viewer);
        this.#light = light;
        this.#viewer = viewer;
        (<PointLightLogic>this.#light).addUpdateCB(this.#updateCB);
        this.#updateCB();
    }

    // #endregion Constructors (1)

    // #region Public Methods (3)

    /**
     * The decay of the light radiance
     * @param {number} value
     */
    public updateDecay(value: number) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Light(${this.id}).updateDecay: Updating Decay to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).updateDecay`, value, 'positive');
            this.#light.decay = value;
            this.#logger.info(LOGGINGTOPIC.LIGHT, `Light(${this.id}).updateDecay: decay was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.LIGHT, e, `Light(${this.id}).updateDecay: Something unexpected happened.`, true)
        }
    }

    /**
     * The distance of the light radiance
     * @param {number} value
     */
    public updateDistance(value: number) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Light(${this.id}).updateDistance: Updating Distance to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).updateDistance`, value, 'positive');
            this.#light.distance = value;
            this.#logger.info(LOGGINGTOPIC.LIGHT, `Light(${this.id}).updateDistance: distance was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.LIGHT, e, `Light(${this.id}).updateDistance: Something unexpected happened.`, true)
        }
    }

    /**
     * The position of the light
     * @param {vec3} value
     */
    public updatePosition(value: vec3) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Light(${this.id}).updatePosition: Updating Position to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).updatePosition`, value, 'vec3');
            this.#light.position = value;
            this.#logger.info(LOGGINGTOPIC.LIGHT, `Light(${this.id}).updatePosition: position was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.LIGHT, e, `Light(${this.id}).updatePosition: Something unexpected happened.`, true)
        }
    }

    // #endregion Public Methods (3)
}