import { ShapeDiverResponseExport, ShapeDiverResponseExportDefinition } from '@shapediver/api.geometry-api-dto-v1'

export interface IExport extends ShapeDiverResponseExportDefinition {
    
    /**
     * Request the export with an optional additional parameter set.
     * 
     * @param parameters 
     * @returns 
     */
    request(parameters?: { [key: string]: string }): Promise<ShapeDiverResponseExport>;
}