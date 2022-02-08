import { SpotLight as SpotLightLogic } from '@shapediver/viewer.rendering-engine.light-engine'
import { vec3 } from 'gl-matrix'
import { InputValidator, Logger, LOGGINGTOPIC, ShapeDiverBackendError, ShapeDiverViewerError } from '@shapediver/viewer.shared.services'
import { container } from 'tsyringe'

import { AbstractLight } from './AbstractLight'
import { ISpotLight } from '../../../interfaces/viewer/lights/ISpotLight'
import { IViewer } from '../../../interfaces/viewer/IViewer'

export class SpotLight extends AbstractLight implements ISpotLight {
    // #region Properties (4)

    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #light: SpotLightLogic;
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #viewer: IViewer;

    // #endregion Properties (4)

    // #region Constructors (1)

    /**
     * @ignore
     * @param light 
     */
    constructor(light: SpotLightLogic, viewer: IViewer) {
        super(light, viewer);
        this.#light = light;
        this.#viewer = viewer;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (12)

    public get angle(): number {
        return this.#light.angle;
    }

    public set angle(value: number) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Light(${this.id}).angle: Updating Angle to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).angle`, value, 'positive');
            this.#light.angle = value;
            this.#(LOGGINGTOPIC.LIGHT, `Light(${this.id}).angle: angle was set to: ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).angle`, e);
        }
    }

    public get decay(): number {
        return this.#light.decay;
    }

    public set decay(value: number) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Light(${this.id}).decay: Updating Decay to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).decay`, value, 'positive');
            this.#light.decay = value;
            this.#(LOGGINGTOPIC.LIGHT, `Light(${this.id}).decay: decay was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).decay`, e);
        }
    }

    public get distance(): number {
        return this.#light.distance;
    }

    public set distance(value: number) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Light(${this.id}).distance: Updating Distance to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).distance`, value, 'positive');
            this.#light.distance = value;
            this.#(LOGGINGTOPIC.LIGHT, `Light(${this.id}).distance: distance was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).distance`, e);
        }
    }

    public get penumbra(): number {
        return this.#light.penumbra;
    }

    public set penumbra(value: number) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Light(${this.id}).penumbra: Updating Penumbra to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).penumbra`, value, 'positive');
            this.#light.penumbra = value;
            this.#(LOGGINGTOPIC.LIGHT, `Light(${this.id}).penumbra: penumbra was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).penumbra`, e);
        }
    }

    public get position(): vec3 {
        return this.#light.position;
    }

    public set position(value: vec3) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Light(${this.id}).position: Updating Position to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).position`, value, 'vec3');
            this.#light.position = value;
            this.#(LOGGINGTOPIC.LIGHT, `Light(${this.id}).position: position was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).position`, e);
        }
    }

    public get target(): vec3 {
        return this.#light.target;
    }

    public set target(value: vec3) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Light(${this.id}).target: Updating Target to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).target`, value, 'vec3');
            this.#light.target = value;
            this.#(LOGGINGTOPIC.LIGHT, `Light(${this.id}).target: target was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).target`, e);
        }
    }

    // #endregion Public Accessors (12)
}