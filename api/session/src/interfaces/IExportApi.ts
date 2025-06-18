import {ResExport} from "@shapediver/sdk.geometry-api-sdk-v2";

/**
 * The api for an export of a corresponding [session]{@link ISessionApi}.
 *
 * Exports are used for outputting data which should not be visualized in the scene,
 * or which should not be accessible via the viewport.
 *
 * Exports are NOT computed as part of customizations (see {@link customize}).
 * The export can be requested by calling its {@link request} method.
 *
 * Only the properties of {@link ResExportDefinition} will stay constant over the lifetime of a session.
 * All additional properties that are added via the extension to {@link ResExport} can change according to
 * the last export request.
 */
export interface IExportApi extends ResExport {
	// #region Public Methods (1)

	/**
	 * Request the export.
	 *
	 * @param parameters Parameter values to be used for this export request. Map from parameter id to parameter value. The current value will be used for any parameter not specified.
	 *
	 * @throws {@type ShapeDiverViewerError}
	 */
	request(parameters?: {[key: string]: unknown}): Promise<ResExport>;

	// #endregion Public Methods (1)
}
