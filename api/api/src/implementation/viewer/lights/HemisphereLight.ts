import { HemisphereLight as HemisphereLightLogic } from '@shapediver/viewer.rendering-engine.light-engine'
import { vec3 } from 'gl-matrix'
import { Converter, InputValidator, Logger, LOGGING_TOPIC, ShapeDiverBackendError, ShapeDiverViewerError } from '@shapediver/viewer.shared.services'
import { container } from 'tsyringe'

import { AbstractLight } from './AbstractLight'
import { IViewer } from '../../../interfaces/viewer/IViewer'
import { IHemisphereLight } from '../../../interfaces/viewer/lights/IHemisphereLight'

export class HemisphereLight extends AbstractLight implements IHemisphereLight {
    // #region Properties (6)

    readonly #converter: Converter = <Converter>container.resolve(Converter);
    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #light: HemisphereLightLogic;
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #viewer: IViewer;

    // #endregion Properties (6)

    // #region Constructors (1)

    /**
     * @ignore
     * @param light 
     */
    constructor(light: HemisphereLightLogic, viewer: IViewer) {
        super(light, viewer);
        this.#light = light;
        this.#viewer = viewer;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (2)

    public get groundColor(): string | number | vec3 {
        return this.#light.groundColor;
    }

    public set groundColor(value: string | number | vec3) {
        try {
            this.#logger.debugLow(LOGGING_TOPIC.LIGHT, `Light(${this.id}).groundColor: Updating GroundColor to ${value}.`);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.LIGHT, `Light(${this.id}).groundColor`, value, 'color');
            this.#light.groundColor = this.#converter.toColor(value);
            this.#logger.debug(LOGGING_TOPIC.LIGHT, `Light(${this.id}).groundColor: groundColor was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.LIGHT, `Light(${this.id}).groundColor`, e);
        }
    }

    // #endregion Public Accessors (2)
}