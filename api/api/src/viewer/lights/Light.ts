import { ILight, LIGHTTYPE } from "@shapediver/viewer.rendering-engine.light-engine";
import { Logger } from "@shapediver/viewer.shared.monitoring";
import { ITreeNodeData } from "@shapediver/viewer.shared.node-tree";
import { InputValidator } from "@shapediver/viewer.shared.utils";
import { vec3 } from "gl-matrix";
import { container } from "tsyringe";

export abstract class Light implements ILight {
    // #region Properties (1)

    readonly #light: ILight;
    readonly #inputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #logger: Logger = <Logger>container.resolve(Logger);

    // #endregion Properties (1)

    // #region Constructors (1)

    /**
     * @ignore
     * @param light 
     */
    constructor(light: ILight) {
        this.#light = light;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (7)

    /**
     * The color of the light
     */
    public get color(): vec3 {
        return this.#light.color;
    }

    /**
     * The color of the light
     */
    public set color(value: vec3) {
        this.#inputValidator.validate(value, 'vec3');
        this.#light.color = value;
        this.#logger.info(`Light (${(<ITreeNodeData><unknown>this.#light).id}): color was set to: ${value}`);
    }

    /**
     * The intensity of the light
     */
    public get intensity(): number {
        return this.#light.intensity;
    }

    /**
     * The intensity of the light
     */
    public set intensity(value: number) {
        this.#inputValidator.validate(value, 'positive');
        this.#light.intensity = value;
        this.#logger.info(`Light (${(<ITreeNodeData><unknown>this.#light).id}): intensity was set to: ${value}`);
    }

    /**
     * The name of the light
     */
    public get name(): string | undefined {
        return this.#light.name;
    }

    /**
     * The name of the light
     */
    public set name(value: string | undefined) {
        this.#inputValidator.validate(value, 'string', false);
        this.#light.name = value;
        this.#logger.info(`Light (${(<ITreeNodeData><unknown>this.#light).id}): name was set to: ${value}`);
    }

    /**
     * The type of the light
     */
    public get type(): LIGHTTYPE {
        return this.#light.type;
    }

    // #endregion Public Accessors (7)
}