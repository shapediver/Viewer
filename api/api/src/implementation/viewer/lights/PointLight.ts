import { PointLight as PointLightLogic } from '@shapediver/viewer.rendering-engine.light-engine'
import { vec3 } from 'gl-matrix'
import { InputValidator, Logger, LOGGINGTOPIC, SDError } from '@shapediver/viewer.shared.services'
import { container } from 'tsyringe'

import { AbstractLight } from './AbstractLight'
import { IViewer } from '../../../interfaces/viewer/IViewer'
import { IPointLight } from '../../../interfaces/viewer/lights/IPointLight'

export class PointLight extends AbstractLight implements IPointLight {
    // #region Properties (4)

    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #light: PointLightLogic;
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #viewer: IViewer;

    // #endregion Properties (4)

    // #region Constructors (1)

    /**
     * @ignore
     * @param light 
     */
    constructor(light: PointLightLogic, viewer: IViewer) {
        super(light, viewer);
        this.#light = light;
        this.#viewer = viewer;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (6)

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
     * Getter position
     */
    public get position(): vec3 {
        return this.#light.position;
    }

    /**
     * Setter position
     */
    public set position(value: vec3) {
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

    // #endregion Public Accessors (6)
}