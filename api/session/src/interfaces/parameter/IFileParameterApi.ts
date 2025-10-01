import {IParameterApi} from "./IParameterApi";

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
	// #region Public Methods (2)

	/**
	 * Get the filename of the file with the given id. If no id is given, the filename of the current value is returned (if available).
	 *
	 * @param fileId - The id of the file to get the filename for.
	 * @returns The filename of the file with the given id, or the filename of the current value if no id is given. If the filename is not available, `undefined` is returned.
	 * @throws {@type ShapeDiverViewerError}
	 */
	getFilename(fileId?: string): Promise<string | undefined>;
	/**
	 * Upload the data (File, Blob) that is currently set to the {@link value} property.
	 * You can then use the returned id to either set it as the value of the parameter or use it in a subsequent customization.
	 * This call returns immediately in case no data is waiting to be uploaded.
	 *
	 * @param v - Optionally, the data (File, Blob, or string id) to upload. If not provided, the current {@link value} is used.
	 * @returns The id of the uploaded file, or the current value if no upload was necessary.
	 * @throws {@type ShapeDiverViewerError}
	 */
	upload(v?: File | Blob | string): Promise<string>;

	// #endregion Public Methods (2)
}
