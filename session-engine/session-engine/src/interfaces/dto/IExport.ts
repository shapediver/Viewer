import { ShapeDiverResponseExport } from "@shapediver/sdk.geometry-api-sdk-v2";

export interface IExport extends ShapeDiverResponseExport {
    // #region Properties (1)

    maxWaitTime: number;

    // #endregion Properties (1)

    // #region Public Methods (2)

    request(parameters?: { [key: string]: string }): Promise<ShapeDiverResponseExport>;
    updateExport(): void;
    updateExportDefinition(exportDef: ShapeDiverResponseExport): void;

    // #endregion Public Methods (2)
}