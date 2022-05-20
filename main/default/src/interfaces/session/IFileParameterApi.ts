import { IParameterApi } from './IParameterApi'

/**
 * The api for a file parameter of a corresponding [session]{@link ISessionApi}.
 * 
 * File parameters accept {@link https://developer.mozilla.org/en-US/docs/Web/API/File|File} or
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/Blob|Blob} objects. The data 
 * gets uploaded to the Geometry Backend prior to sending a _customization_ request. 
 * This prior upload assigns a unique id to the data, which can be read from {@link IFileParameter.value}
 * once the upload completed. The unique id can be used to run further customizations 
 * using the same data, avoiding a further upload.
 * 
 * {@link upload} is used to trigger the prior upload, in case one is necessary. This
 * is taken care of automatically by {@link ISessionApi.customize} and
 * {@link ISessionApi.customizeParallel}, but can also be triggered separately
 * beforehand.
 */
export interface IFileParameterApi extends IParameterApi<File | Blob | string> {
    // #region Public Methods (1)

    /**
     * Upload the data (File, Blob) that is currently set to the {@link value} property.
     * This call returns immediately in case no data is waiting to be uploaded.
     */
    upload(): Promise<string>;

    // #endregion Public Methods (1)
}
