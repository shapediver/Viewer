import { DirectionalLight as DirectionalLightLogic } from '@shapediver/viewer.rendering-engine.light-engine'
import { vec3 } from 'gl-matrix'
import { InputValidator, Logger, LOGGINGTOPIC, ShapeDiverBackendError, ShapeDiverViewerError } from '@shapediver/viewer.shared.services'
import { container } from 'tsyringe'

import { AbstractLight } from './AbstractLight'
import { IDirectionalLight } from '../../../interfaces/viewer/lights/IDirectionalLight'
import { IViewer } from '../../../interfaces/viewer/IViewer'

export class DirectionalLight extends AbstractLight implements IDirectionalLight {
    // #region Properties (4)

    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #light: DirectionalLightLogic;
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #viewer: IViewer;

    // #endregion Properties (4)

    // #region Constructors (1)

    /**
     * @ignore
     * @param light 
     */
    constructor(light: DirectionalLightLogic, viewer: IViewer) {
        super(light, viewer);
        this.#light = light;
        this.#viewer = viewer;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (8)

    public get castShadow(): boolean {
        return this.#light.castShadow;
    }

    public set castShadow(value: boolean) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Light(${this.id}).castShadow: Updating CastShadow to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).castShadow`, value, 'boolean');
            this.#light.castShadow = value;
            this.#(LOGGINGTOPIC.LIGHT, `Light(${this.id}).castShadow: castShadow was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).castShadow`, e);
        }
    }

    public get direction(): vec3 {
        return this.#light.direction;
    }

    public set direction(value: vec3) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Light(${this.id}).direction: Updating Direction to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).direction`, value, 'vec3');
            this.#light.direction = value;
            this.#(LOGGINGTOPIC.LIGHT, `Light(${this.id}).direction: direction was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).direction`, e);
        }
    }

    public get shadowMapBias(): number {
        return this.#light.shadowMapBias;
    }

    public set shadowMapBias(value: number) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Light(${this.id}).shadowMapBias: Updating ShadowMapBias to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).shadowMapBias`, value, 'number');
            this.#light.shadowMapBias = value;
            this.#(LOGGINGTOPIC.LIGHT, `Light(${this.id}).shadowMapBias: shadowMapBias was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).shadowMapBias`, e);
        }
    }

    public get shadowMapResolution(): number {
        return this.#light.shadowMapResolution;
    }

    public set shadowMapResolution(value: number) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Light(${this.id}).shadowMapResolution: Updating ShadowMapResolution to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).shadowMapResolution`, value, 'number');
            this.#light.shadowMapResolution = value;
            this.#(LOGGINGTOPIC.LIGHT, `Light(${this.id}).shadowMapResolution: shadowMapResolution was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).shadowMapResolution`, e);
        }
    }

    // #endregion Public Accessors (8)
}