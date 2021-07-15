import { ISetting } from '../../interfaces/ISetting'
import { AbstractSetting } from './AbstractSetting'

export class StringSetting extends AbstractSetting implements ISetting<string> {
    // #region Properties (1)

    private _value: string;

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(
        private readonly _default: string,
        _note: string = "",
        private _check: (value: string) => boolean = () => true
    ) {
        super(_note);
        this._value = _default;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (3)

    /**
       * Getter default
       * @return {string}
       */
    public get default(): string {
        return this._default;
    }

    /**
       * Getter value
       * @return {string}
       */
    public get value(): string {
        return this._value;
    }

    /**
       * Setter value
       * @param {string} value
       */
    public set value(value: string) {
        this._value = value;
    }

    // #endregion Public Accessors (3)

    // #region Public Methods (1)

    /**
       * Check if the value is correct
       * @return {string}
       */
    public check(value: string): boolean {
        return this._check(value);
    }

    // #endregion Public Methods (1)
}