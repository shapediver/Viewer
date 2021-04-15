import { ISetting } from "./interfaces/interfaces";

export class Setting<T> implements ISetting<T> {
    // #region Constructors (1)

    constructor(private _value: T, private _type: string|Function, private _desc?: string, private _persistent: boolean = true) { }

    // #endregion Constructors (1)

    // #region Public Accessors (5)

    public get desc(): string|undefined {
        return this._desc;
    }

    public get persistent(): boolean {
        return this._persistent;
    }

    public get type(): string|Function {
        return this._type;
    }

    public get value(): T {
        return this._value;
    }

    public set value(v: T) {
        this._value = v;
    }

    // #endregion Public Accessors (5)
}