import { HemisphereLight as HemisphereLightLogic } from '@shapediver/viewer.rendering-engine.light-engine'
import { vec3 } from 'gl-matrix'
import { Converter, InputValidator, SDError } from '@shapediver/viewer.shared.utils'
import { container } from 'tsyringe'
import { Logger, LOGGINGTOPIC } from '@shapediver/viewer.shared.utils'

import { Light } from './Light'
import { Viewer } from '../Viewer'

export class HemisphereLight extends Light {
    // #region Properties (1)

    readonly #light: HemisphereLightLogic;
    readonly #viewer: Viewer;
    readonly #converter: Converter = <Converter>container.resolve(Converter);
    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #updateCB = () => {
        (<any>this.groundColor) = this.#light.groundColor;
    }

    readonly groundColor!: string | number | vec3;

    // #endregion Properties (1)

    // #region Constructors (1)

    /**
     * @ignore
     * @param light 
     */
    constructor(light: HemisphereLightLogic, viewer: Viewer) {
        super(light, viewer);
        this.#light = light;
        this.#viewer = viewer;
        (<HemisphereLightLogic>this.#light).addUpdateCB(this.#updateCB);
        this.#updateCB();
    }

    // #endregion Constructors (1)

    // #region Public Accessors (2)

    /**
     * The ground color of the light
     * @param {string | number | vec3} value
     */
    public updateGroundColor(value: string | number | vec3) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Light(${this.id}).updateGroundColor: Updating GroundColor to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).updateGroundColor`, value, 'color');
            this.#light.groundColor = this.#converter.toColor(value);
            this.#logger.info(LOGGINGTOPIC.LIGHT, `Light(${this.id}).updateGroundColor: groundColor was set to: ${value}`);
            this.#viewer.update();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.LIGHT, e, `Light(${this.id}).updateGroundColor: Something unexpected happened.`, true)
        }
    }

    // #endregion Public Accessors (2)
}