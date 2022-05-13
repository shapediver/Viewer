import { IParameterApi } from './IParameterApi'

/**
 * The api for a file parameter of the corresponding [session]{@link ISessionApi}.
 * The current value can be uploaded by calling the {@link upload} method.
 * This is done automatically when the session is customized.
 */
export interface IFileParameterApi extends IParameterApi<File | Blob | string> {
    // #region Public Methods (1)

    /**
     * Upload the file that is currently set to the value property.
     */
    upload(): Promise<string>;

    // #endregion Public Methods (1)
}
