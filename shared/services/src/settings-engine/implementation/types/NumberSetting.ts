import { AbstractSetting } from './AbstractSetting'
import { ISetting } from '../../interfaces/ISetting'

export class NumberSetting extends AbstractSetting implements ISetting<number> {
    // #region Properties (1)

    private _value: number;

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(
        private readonly _default: number,
        _note: string = "",
        private _check: (value: number) => boolean = () => true
    ) {
        super(_note)
        this._value = _default;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (3)

    /**
       * Getter default
       * @return {number}
       */
    public get default(): number {
        return this._default;
    }

    /**
       * Getter value
       * @return {number}
       */
    public get value(): number {
        return this._value;
    }

    /**
       * Setter value
       * @param {number} value
       */
    public set value(value: number) {
        this._value = value;
    }

    // #endregion Public Accessors (3)

    // #region Public Methods (1)

    /**
       * Check if the value is correct
       * @return {boolean}
       */
    public check(value: number): boolean {
        return this._check(value);
    }

    // #endregion Public Methods (1)
}
