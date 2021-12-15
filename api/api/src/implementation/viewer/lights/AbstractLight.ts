import { LIGHTTYPE } from '@shapediver/viewer.rendering-engine.light-engine'
import { Converter, InputValidator, Logger, LOGGINGTOPIC, ShapeDiverBackendError, ShapeDiverViewerError } from '@shapediver/viewer.shared.services'
import { vec3 } from 'gl-matrix'
import { container } from 'tsyringe'

import { IViewer } from '../../../interfaces/viewer/IViewer'
import { ILight } from '../../../interfaces/viewer/lights/ILight'

export abstract class AbstractLight implements ILight {
    // #region Properties (5)

    readonly #converter: Converter = <Converter>container.resolve(Converter);
    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #light: ILight;
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #viewer: IViewer;

    // #endregion Properties (5)

    // #region Constructors (1)

    /**
     * @ignore
     * @param light 
     */
    constructor(light: ILight, viewer: IViewer) {
        this.#light = light;
        this.#viewer = viewer;
        this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Light(${this.id}).constructor: Light api created.`);
    }

    // #endregion Constructors (1)

    // #region Public Accessors (10)

    public get color(): string | number | vec3 {
        return this.#light.color;
    }

    public set color(value: string | number | vec3) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Light(${this.id}).color: Updating Color to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).color`, value, 'color');
            this.#light.color = this.#converter.toColor(value);
            this.#logger.info(LOGGINGTOPIC.LIGHT, `Light(${this.id}).color: color was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).color`, e);
        }
    }

    public get id(): string {
        return this.#light.id;
    }

    public get intensity(): number {
        return this.#light.intensity;
    }

    public set intensity(value: number) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Light(${this.id}).intensity: Updating Intensity to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).intensity`, value, 'positive');
            this.#light.intensity = value;
            this.#logger.info(LOGGINGTOPIC.LIGHT, `Light(${this.id}).intensity: intensity was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).intensity`, e);
        }
    }

    public get name(): string | undefined {
        return this.#light.name;
    }

    public set name(value: string | undefined) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Light(${this.id}).name: Updating Name to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).name`, value, 'string', false);
            this.#light.name = value;
            this.#logger.info(LOGGINGTOPIC.LIGHT, `Light(${this.id}).name: name was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).name`, e);
        }
    }

    public get order(): number | undefined {
        return this.#light.order;
    }

    public set order(value: number | undefined) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Light(${this.id}).order: Updating Order to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).order`, value, 'number', false);
            this.#light.order = value;
            this.#logger.info(LOGGINGTOPIC.LIGHT, `Light(${this.id}).order: order was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).order`, e);
        }
    }

    public get type(): LIGHTTYPE {
        return this.#light.type;
    }

    // #endregion Public Accessors (10)
}