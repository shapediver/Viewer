import { ShapeDiverResponseExport, ShapeDiverResponseExportDefinition } from "@shapediver/sdk.geometry-api-sdk-v2";

export interface IExport extends ShapeDiverResponseExportDefinition {
    
    /**
     * Request the export with an optional additional parameter set.
     * 
     * @param parameters 
     * @returns 
     */
    request(parameters?: { [key: string]: string }): Promise<ShapeDiverResponseExport>;
}