import { ILight, LIGHTTYPE } from "@shapediver/viewer.rendering-engine.light-engine";
import { vec3 } from "gl-matrix";

export abstract class Light implements ILight {
    // #region Properties (1)

    readonly #light: ILight;

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
        this.#light.color = value;
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
        this.#light.intensity = value;
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
        this.#light.name = value;
    }

    /**
     * The type of the light
     */
    public get type(): LIGHTTYPE {
        return this.#light.type;
    }

    // #endregion Public Accessors (7)
}