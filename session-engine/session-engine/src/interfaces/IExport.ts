import { ShapeDiverResponseExport, ShapeDiverResponseExportDefinition } from "@shapediver/api.geometry-api-dto-v1";

export enum EXPORTTYPE {
    EMAIL = 'email',
    DOWNLOAD = 'download',
    SHAPEWAYS = 'shapeways'
}


export interface IExport {
    // #region Public Methods (1)

    request(parameters?: { [key: string]: string }): Promise<ShapeDiverResponseExport | ShapeDiverResponseExportDefinition | null>;

    // #endregion Public Methods (1)
}