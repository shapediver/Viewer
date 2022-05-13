import { ShapeDiverResponseExport } from "@shapediver/sdk.geometry-api-sdk-v2";

/**
 * The api for an export of the corresponding [session]{@link ISessionApi}.
 * An export can be requested by calling the {@link request} method.
 * Additional properties of the export can be evaluated as well.
 */
export interface IExportApi extends ShapeDiverResponseExport {
    // #region Public Methods (1)

    /**
     * Request the export.
     * 
     * @param parameters Optional parameter values that are used for this export request. (default: the current parameter values)
     */
    request(parameters?: { [key: string]: string }): Promise<ShapeDiverResponseExport>;

    // #endregion Public Methods (1)
}