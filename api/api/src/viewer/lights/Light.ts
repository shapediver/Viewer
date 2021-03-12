import { ILight, LIGHTTYPE } from "@shapediver/viewer.rendering-engine.light-engine";
import { vec3 } from "gl-matrix";

export abstract class Light implements ILight {
    // #region Properties (1)

    readonly #light: ILight;

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(light: ILight) {
        this.#light = light;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (7)

    public get color(): vec3 {
        return this.#light.color;
    }

    public set color(value: vec3) {
        this.#light.color = value;
    }

    public get intensity(): number {
        return this.#light.intensity;
    }

    public set intensity(value: number) {
        this.#light.intensity = value;
    }

    public get name(): string | undefined {
        return this.#light.name;
    }

    public set name(value: string | undefined) {
        this.#light.name = value;
    }

    public get type(): LIGHTTYPE {
        return this.#light.type;
    }

    // #endregion Public Accessors (7)
}