export interface IExport {
    // #region Properties (3)

    readonly id: string;
    readonly name?: string;
    readonly type?: string;

    request(): Promise<any>;

    // #endregion Properties (3)
}