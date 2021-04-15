import { AbstractSetting } from "./AbstractSetting";
import { ISetting } from "../../interfaces/ISetting";
import { vec3 } from "gl-matrix";

export class Vec3Setting extends AbstractSetting implements ISetting<vec3> {
    // #region Properties (1)

    private _value: vec3;

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(
        private readonly _default: vec3,
        _note: string = "",
        private _check: (value: vec3) => boolean = () => true
    ) {
        super(_note);
        this._value = vec3.clone(_default);
    }

    // #endregion Constructors (1)

    // #region Public Accessors (3)

    /**
     * Getter default
     * @return {vec3}
     */
    public get default(): vec3 {
        return this._default;
    }

    /**
     * Getter value
     * @return {vec3}
     */
    public get value(): vec3 {
        return this._value;
    }

    /**
     * Setter value
     * @param {vec3} value
     */
    public set value(value: vec3) {
        this._value = value;
    }

    // #endregion Public Accessors (3)

    // #region Public Methods (1)

    /**
       * Check if the value is correct
       * @return {boolean}
       */
    public check(value: vec3): boolean {
        return this._check(value);
    }

    // #endregion Public Methods (1)
}