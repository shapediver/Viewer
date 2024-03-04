import { IParameter } from './IParameter'

export interface IFileParameter extends IParameter<File | Blob | string> {
    // #region Public Methods (2)

    getFilename(fileId?: string): Promise<string | undefined>;
    upload(): Promise<string>;

    // #endregion Public Methods (2)
}
