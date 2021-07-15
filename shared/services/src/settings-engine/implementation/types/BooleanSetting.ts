import { ISetting } from '../../interfaces/ISetting'
import { AbstractSetting } from './AbstractSetting'

export class BooleanSetting extends AbstractSetting implements ISetting<boolean> {
    // #region Properties (1)

    private _value: boolean;

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(
        private readonly _default: boolean,
        _note: string = "",
        private _check: (value: boolean) => boolean = () => true
    ) {
        super(_note);
        this._value = _default;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (3)

    /**
       * Getter default
       * @return {boolean}
       */
    public get default(): boolean {
        return this._default;
    }

    /**
       * Getter value
       * @return {boolean}
       */
    public get value(): boolean {
        return this._value;
    }

    /**
       * Setter value
       * @param {boolean} value
       */
    public set value(value: boolean) {
        this._value = value;
    }

    // #endregion Public Accessors (3)

    // #region Public Methods (1)

    /**
       * Check if the value is correct
       * @return {boolean}
       */
    public check(value: boolean): boolean {
        return this._check(value);
    }

    // #endregion Public Methods (1)
}