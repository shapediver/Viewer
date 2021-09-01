import { DirectionalLight as DirectionalLightLogic } from '@shapediver/viewer.rendering-engine.light-engine'
import { vec3 } from 'gl-matrix'
import { InputValidator, SDError } from '@shapediver/viewer.shared.utils'
import { container } from 'tsyringe'
import { Logger, LOGGINGTOPIC } from '@shapediver/viewer.shared.utils'

import { Light } from './Light'
import { Viewer } from '../Viewer'

export class DirectionalLight extends Light {
    // #region Properties (8)

    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #light: DirectionalLightLogic;
    readonly #viewer: Viewer;
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #updateCB = () => {
        (<any>this.castShadow) = this.#light.castShadow;
        (<any>this.direction) = this.#light.direction;
        (<any>this.shadowMapBias) = this.#light.shadowMapBias;
        (<any>this.shadowMapResolution) = this.#light.shadowMapResolution;
    }

    readonly castShadow!: boolean
    readonly direction!: vec3
    readonly shadowMapBias!: number
    readonly shadowMapResolution!: number;

    // #endregion Properties (8)

    // #region Constructors (1)

    /**
     * @ignore
     * @param light 
     */
    constructor(light: DirectionalLightLogic, viewer: Viewer) {
        super(light, viewer);
        this.#light = light;
        this.#viewer = viewer;
        (<DirectionalLightLogic>this.#light).addUpdateCB(this.#updateCB);
        this.#updateCB();
    }

    // #endregion Constructors (1)

    // #region Public Methods (4)

    /**
     * The option to cast shadow
     * @param {boolean} value
     */
    public updateCastShadow(value: boolean) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Light(${this.id}).updateCastShadow: Updating CastShadow to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).updateCastShadow`, value, 'boolean');
            this.#light.castShadow = value;
            this.#logger.info(LOGGINGTOPIC.LIGHT, `Light(${this.id}).updateCastShadow: castShadow was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.LIGHT, e, `Light(${this.id}).updateCastShadow: Something unexpected happened.`, true)
        }
    }

    /**
     * The directional of the light
     * @param {vec3} value
     */
    public updateDirection(value: vec3) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Light(${this.id}).updateDirection: Updating Direction to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).updateDirection`, value, 'vec3');
            this.#light.direction = value;
            this.#logger.info(LOGGINGTOPIC.LIGHT, `Light(${this.id}).updateDirection: direction was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.LIGHT, e, `Light(${this.id}).updateDirection: Something unexpected happened.`, true)
        }
    }

    /**
     * The bias of the shadow map
     * @param {number} value
     */
    public updateShadowMapBias(value: number) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Light(${this.id}).updateShadowMapBias: Updating ShadowMapBias to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).updateShadowMapBias`, value, 'number');
            this.#light.shadowMapBias = value;
            this.#logger.info(LOGGINGTOPIC.LIGHT, `Light(${this.id}).updateShadowMapBias: shadowMapBias was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.LIGHT, e, `Light(${this.id}).updateShadowMapBias: Something unexpected happened.`, true)
        }
    }

    /**
     * The resolution of the shadow map
     * @param {number} value
     */
    public updateShadowMapResolution(value: number) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Light(${this.id}).updateShadowMapResolution: Updating ShadowMapResolution to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).updateShadowMapResolution`, value, 'number');
            this.#light.shadowMapResolution = value;
            this.#logger.info(LOGGINGTOPIC.LIGHT, `Light(${this.id}).updateShadowMapResolution: shadowMapResolution was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.LIGHT, e, `Light(${this.id}).updateShadowMapResolution: Something unexpected happened.`, true)
        }
    }

    // #endregion Public Methods (4)
}