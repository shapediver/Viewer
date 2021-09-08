import { DirectionalLight as DirectionalLightLogic } from '@shapediver/viewer.rendering-engine.light-engine'
import { vec3 } from 'gl-matrix'
import { InputValidator, SDError, Logger, LOGGINGTOPIC } from '@shapediver/viewer.shared.services'
import { container } from 'tsyringe'

import { Light } from './Light'
import { Viewer } from '../Viewer'

export class DirectionalLight extends Light {
    // #region Properties (4)

    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #light: DirectionalLightLogic;
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #viewer: Viewer;

    // #endregion Properties (4)

    // #region Constructors (1)

    /**
     * @ignore
     * @param light 
     */
    constructor(light: DirectionalLightLogic, viewer: Viewer) {
        super(light, viewer);
        this.#light = light;
        this.#viewer = viewer;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (8)

    /**
     * Getter castShadow
     */
    public get castShadow(): boolean {
        return this.#light.castShadow;
    }

    /**
     * Setter castShadow
     */
    public set castShadow(value: boolean) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Light(${this.id}).castShadow: Updating CastShadow to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).castShadow`, value, 'boolean');
            this.#light.castShadow = value;
            this.#logger.info(LOGGINGTOPIC.LIGHT, `Light(${this.id}).castShadow: castShadow was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.LIGHT, e, `Light(${this.id}).castShadow: Something unexpected happened.`, true)
        }
    }

    /**
     * Getter direction
     */
    public get direction(): vec3 {
        return this.#light.direction;
    }

    /**
     * Setter direction
     */
    public set direction(value: vec3) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Light(${this.id}).direction: Updating Direction to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).direction`, value, 'vec3');
            this.#light.direction = value;
            this.#logger.info(LOGGINGTOPIC.LIGHT, `Light(${this.id}).direction: direction was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.LIGHT, e, `Light(${this.id}).direction: Something unexpected happened.`, true)
        }
    }

    /**
     * Getter shadowMapBias
     */
    public get shadowMapBias(): number {
        return this.#light.shadowMapBias;
    }

    /**
     * Setter shadowMapBias
     */
    public set shadowMapBias(value: number) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Light(${this.id}).shadowMapBias: Updating ShadowMapBias to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).shadowMapBias`, value, 'number');
            this.#light.shadowMapBias = value;
            this.#logger.info(LOGGINGTOPIC.LIGHT, `Light(${this.id}).shadowMapBias: shadowMapBias was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.LIGHT, e, `Light(${this.id}).shadowMapBias: Something unexpected happened.`, true)
        }
    }

    /**
     * Getter shadowMapResolution
     */
    public get shadowMapResolution(): number {
        return this.#light.shadowMapResolution;
    }

    /**
     * Setter shadowMapResolution
     */
    public set shadowMapResolution(value: number) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Light(${this.id}).shadowMapResolution: Updating ShadowMapResolution to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).shadowMapResolution`, value, 'number');
            this.#light.shadowMapResolution = value;
            this.#logger.info(LOGGINGTOPIC.LIGHT, `Light(${this.id}).shadowMapResolution: shadowMapResolution was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.LIGHT, e, `Light(${this.id}).shadowMapResolution: Something unexpected happened.`, true)
        }
    }

    // #endregion Public Accessors (8)
}