import { IParameter } from './IParameter'

export interface IFileParameter extends IParameter<File | Blob | string> {
    // #region Public Methods (1)

    upload(): Promise<string>;

    // #endregion Public Methods (1)
}
