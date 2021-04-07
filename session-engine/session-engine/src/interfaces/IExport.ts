export interface IExport {
    // #region Properties (3)

    readonly id: string;
    readonly name?: string;
    readonly type?: string;

    request(parameters?: { [key: string]: string }): Promise<{ href: string, format: string, size: number } | null>;

    // #endregion Properties (3)
}