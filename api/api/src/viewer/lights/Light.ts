import { AbstractLight, ILight, LIGHTTYPE } from "@shapediver/viewer.rendering-engine.light-engine";
import { Logger, LOGGINGTOPIC } from "@shapediver/viewer.shared.monitoring";
import { ITreeNodeData } from "@shapediver/viewer.shared.node-tree";
import { Converter, InputValidator } from "@shapediver/viewer.shared.utils";
import { vec3 } from "gl-matrix";
import { container } from "tsyringe";

export abstract class Light implements ILight {
    // #region Properties (10)

    readonly #converter: Converter = <Converter>container.resolve(Converter);
    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #light: ILight;
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #updateCB = () => {
        (<any>this.color) = this.#light.color;
        (<any>this.id) = this.#light.id;
        (<any>this.intensity) = this.#light.intensity;
        (<any>this.name) = this.#light.name;
        (<any>this.type) = this.#light.type;
    }

    readonly color!: string | number | vec3;
    readonly id!: string;
    readonly intensity!: number;
    readonly name!: string | undefined;
    readonly type!: LIGHTTYPE;

    // #endregion Properties (10)

    // #region Constructors (1)

    /**
     * @ignore
     * @param light 
     */
    constructor(light: ILight) {
        this.#light = light;
        (<AbstractLight>this.#light).addUpdateCB(this.#updateCB);
        this.#updateCB();
        this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Light(${this.id}).constructor: Light api created.`);
    }

    // #endregion Constructors (1)

    // #region Public Methods (3)

    /**
     * The color of the light
     */
    public updateColor(value: string | number | vec3) {
        this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Light(${this.id}).updateColor: Updating Color to ${value}.`);
        this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).updateColor`, value, 'color');
        this.#light.color = this.#converter.toColor(value);
        this.#logger.info(LOGGINGTOPIC.LIGHT, `Light(${this.id}).updateColor: color was set to: ${value}`);
    }

    /**
     * The intensity of the light
     */
    public updateIntensity(value: number) {
        this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Light(${this.id}).updateIntensity: Updating Intensity to ${value}.`);
        this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).updateIntensity`, value, 'positive');
        this.#light.intensity = value;
        this.#logger.info(LOGGINGTOPIC.LIGHT, `Light(${this.id}).updateIntensity: intensity was set to: ${value}`);
    }

    /**
     * The name of the light
     */
    public updateName(value: string | undefined) {
        this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Light(${this.id}).updateName: Updating Name to ${value}.`);
        this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Light(${this.id}).updateName`, value, 'string', false);
        this.#light.name = value;
        this.#logger.info(LOGGINGTOPIC.LIGHT, `Light(${this.id}).updateName: name was set to: ${value}`);
    }

    // #endregion Public Methods (3)
}