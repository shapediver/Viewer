import { IParameterApi } from './IParameterApi'

/**
 * The api for a file parameter of a corresponding [session]{@link ISessionApi}.
 * 
 * TODO Alex add description of file parameters
 * 
 * The current value can be uploaded by calling the {@link upload} method.
 * This is done automatically when the session is customized.
 */
export interface IFileParameterApi extends IParameterApi<File | Blob | string> {
    // #region Public Methods (1)

    /**
     * Upload the file that is currently set to the value property.
     * ATOM: Will this be called by the session on customize? 
     */
    upload(): Promise<string>;

    // #endregion Public Methods (1)
}
