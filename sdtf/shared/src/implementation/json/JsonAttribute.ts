export interface JsonAttribute {
    // #region Public Indexers (1)

    [key: string]: {
        typeHint: number;
        accessor?: number;
        value?: any;
    }

    // #endregion Public Indexers (1)
}