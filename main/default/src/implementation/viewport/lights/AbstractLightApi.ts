import { vec3 } from "gl-matrix";
import { LIGHT_TYPE } from "../../..";
import { ILight } from "@shapediver/viewer.rendering-engine.light-engine";
import { ILightApi } from "../../../interfaces/viewport/lights/ILightApi";

export abstract class AbstractLightApi implements ILightApi {
    // #region Properties (15)

    readonly #light: ILight;

    // #endregion Properties (15)

    // #region Constructors (1)

    constructor(light: ILight) {
        this.#light = light;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (12)

    public get color(): string | number | vec3 {
        return this.#light.color;
    }

    public set color(value: string | number | vec3) {
        this.#light.color = value;
    }

    public get id(): string {
        return this.#light.id;
    }

    public set id(value: string) {
        this.#light.id = value;
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

    public get order(): number | undefined {
        return this.#light.order;
    }

    public set order(value: number | undefined) {
        this.#light.order = value;
    }

    public get type(): LIGHT_TYPE {
        return this.#light.type;
    }

    public set type(value: LIGHT_TYPE) {
        this.#light.type = value;
    }

    // #endregion Public Accessors (12)
}