import { AbstractSetting } from './AbstractSetting'
import { ISetting } from '../../interfaces/ISetting'

export class CustomSetting extends AbstractSetting implements ISetting<any> {
    // #region Properties (1)

    private _value: any;

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(
        private readonly _default: any,
        _note: string = "",
        private _check: (value: any) => boolean = () => true
    ) {
        super(_note);
        this._value = _default;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (3)

    /**
       * Getter default
       * @return {any}
       */
    public get default(): any {
        return this._default;
    }

    /**
       * Getter value
       * @return {any}
       */
    public get value(): any {
        return this._value;
    }

    /**
       * Setter value
       * @param {any} value
       */
    public set value(value: any) {
        this._value = value;
    }

    // #endregion Public Accessors (3)

    // #region Public Methods (1)

    /**
       * Check if the value is correct
       * @return {boolean}
       */
    public check(value: any): boolean {
        return this._check(value);
    }

    // #endregion Public Methods (1)
}
