import { SpotLight as SpotLightLogic } from '@shapediver/viewer.rendering-engine.light-engine'
import { vec3 } from 'gl-matrix'
import { InputValidator, SDError, Logger, LOGGINGTOPIC } from '@shapediver/viewer.shared.services'
import { container } from 'tsyringe'

import { Light } from './Light'
import { Viewer } from '../Viewer'

export class SpotLight extends Light {
    // #region Properties (4)

    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #light: SpotLightLogic;
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #viewer: Viewer;

    // #endregion Properties (4)

    // #region Constructors (1)

    /**
     * @ignore
     * @param light 
     */
    constructor(light: SpotLightLogic, viewer: Viewer) {
        super(light, viewer);
        this.#light = light;
        this.#viewer = viewer;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (12)

    /**
     * Setter position
     */
    public set Position(value: vec3) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Light(${this.id}).position: Updating Position to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).position`, value, 'vec3');
            this.#light.position = value;
            this.#logger.info(LOGGINGTOPIC.LIGHT, `Light(${this.id}).position: position was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.LIGHT, e, `Light(${this.id}).position: Something unexpected happened.`, true)
        }
    }

    /**
     * Getter angle
     */
    public get angle(): number {
        return this.#light.angle;
    }

    /**
     * Setter angle
     */
    public set angle(value: number) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Light(${this.id}).angle: Updating Angle to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).angle`, value, 'positive');
            this.#light.angle = value;
            this.#logger.info(LOGGINGTOPIC.LIGHT, `Light(${this.id}).angle: angle was set to: ${value}`);
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.LIGHT, e, `Light(${this.id}).angle: Something unexpected happened.`, true)
        }
    }

    /**
     * Getter decay
     */
    public get decay(): number {
        return this.#light.decay;
    }

    /**
     * Setter decay
     */
    public set decay(value: number) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Light(${this.id}).decay: Updating Decay to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).decay`, value, 'positive');
            this.#light.decay = value;
            this.#logger.info(LOGGINGTOPIC.LIGHT, `Light(${this.id}).decay: decay was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.LIGHT, e, `Light(${this.id}).decay: Something unexpected happened.`, true)
        }
    }

    /**
     * Getter distance
     */
    public get distance(): number {
        return this.#light.distance;
    }

    /**
     * Setter distance
     */
    public set distance(value: number) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Light(${this.id}).distance: Updating Distance to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).distance`, value, 'positive');
            this.#light.distance = value;
            this.#logger.info(LOGGINGTOPIC.LIGHT, `Light(${this.id}).distance: distance was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.LIGHT, e, `Light(${this.id}).distance: Something unexpected happened.`, true)
        }
    }

    /**
     * Getter penumbra
     */
    public get penumbra(): number {
        return this.#light.penumbra;
    }

    /**
     * Setter penumbra
     */
    public set penumbra(value: number) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Light(${this.id}).penumbra: Updating Penumbra to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).penumbra`, value, 'positive');
            this.#light.penumbra = value;
            this.#logger.info(LOGGINGTOPIC.LIGHT, `Light(${this.id}).penumbra: penumbra was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.LIGHT, e, `Light(${this.id}).penumbra: Something unexpected happened.`, true)
        }
    }

    /**
     * Getter position
     */
    public get position(): vec3 {
        return this.#light.position;
    }

    /**
     * Getter target
     */
    public get target(): vec3 {
        return this.#light.target;
    }

    /**
     * Setter target
     */
    public set target(value: vec3) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Light(${this.id}).target: Updating Target to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).target`, value, 'vec3');
            this.#light.target = value;
            this.#logger.info(LOGGINGTOPIC.LIGHT, `Light(${this.id}).target: target was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.LIGHT, e, `Light(${this.id}).target: Something unexpected happened.`, true)
        }
    }

    // #endregion Public Accessors (12)
}