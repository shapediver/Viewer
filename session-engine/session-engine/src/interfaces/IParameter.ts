export interface IParameter<T> {
    // #region Properties (12)

    readonly choices?: string[];
    readonly decimalplaces?: string;
    readonly defval: string;
    readonly format?: string[];
    readonly id: string;
    readonly max?: string;
    readonly min?: string;
    readonly name?: string;
    readonly note?: string;
    readonly type: string;
    readonly visualization?: string;

    value: T;

    // #endregion Properties (12)
}