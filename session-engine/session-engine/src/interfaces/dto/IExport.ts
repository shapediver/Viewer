import {ResExport} from "@shapediver/sdk.geometry-api-sdk-v2";

export interface IExport extends ResExport {
	// #region Properties (1)

	maxWaitTime: number;

	// #endregion Properties (1)

	// #region Public Methods (3)

	request(parameters?: {[key: string]: unknown}): Promise<ResExport>;
	updateExport(e?: ResExport): void;
	updateExportDefinition(exportDef: ResExport): void;

	// #endregion Public Methods (3)
}
