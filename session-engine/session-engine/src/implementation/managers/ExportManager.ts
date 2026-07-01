import {
	ExportApi,
	ReqCustomization,
	ReqExport,
	ResBase,
	ResExport,
	ResExportDefinitionType,
	UtilsApi,
} from "@shapediver/sdk.geometry-api-sdk-v2";
import {
	EventEngine,
	EVENTTYPE,
	UuidGenerator} from "@shapediver/viewer.shared.services";
import {TASK_CATEGORY, TASK_TYPE} from "@shapediver/viewer.shared.types";

import {type IExport} from "../../interfaces/dto/IExport";
import {Export} from "../dto/Export";
import {SessionEngineCore} from "../SessionEngineCore";

/**
 * Manager for exports and export related operations.
 *
 * The manager is created by the SessionEngineCore and can be accessed
 * via the `exportManager` property.
 */
export class ExportManager {
	private readonly _eventEngine = EventEngine.instance;
	private readonly _exports: {[key: string]: IExport} = {};
	private readonly _sessionEngineCore: SessionEngineCore;
	private readonly _uuidGenerator = UuidGenerator.instance;

	constructor(sessionEngineCore: SessionEngineCore) {
		this._sessionEngineCore = sessionEngineCore;
	}

	public get exports(): {[key: string]: IExport} {
		return this._exports;
	}

	/**
	 * Cleans the provided export parameters by converting names/displaynames to ids
	 * and filling in missing parameters with current session values.
	 *
	 * @param parameters The provided export parameters
	 * @returns The cleaned export parameters
	 */
	public cleanExportParameters(parameters: {
		[key: string]: unknown;
	}): ReqCustomization {
		const requestParameterSet: ReqCustomization = {};

		// first step, we convert all our names and displaynames to ids
		for (const parameterIdOrName in parameters) {
			// we prioritize id, then name and then displayname
			// if there are two parameters with the same name or displayname, we take the one that is found first (no way for us to evaluate which one the user meant)
			const parameterObject = Object.values(
				this._sessionEngineCore.parameterManager.parameters,
			).find(
				(p) =>
					p.id === parameterIdOrName ||
					p.name === parameterIdOrName ||
					p.displayname === parameterIdOrName,
			);

			// in case the key of the key value pair was neither the id, name or displayname, skip
			if (!parameterObject) continue;

			// copy into new dictionary
			requestParameterSet[parameterObject.id] = (
				" " + parameterObject.stringify(parameters[parameterIdOrName])
			).slice(1);
		}

		// seconds step, fill all other parameter values that are currently not set
		const currentParameters =
			this._sessionEngineCore.parameterManager.parameterValues;
		for (const parameterId in currentParameters) {
			// if already set by input values, skip
			if (requestParameterSet[parameterId] !== undefined) continue;

			// deep copy into new dictionary
			requestParameterSet[parameterId] = (
				" " + currentParameters[parameterId]
			).slice(1);
		}

		return requestParameterSet;
	}

	/**
	 * Creates export objects from the current response DTO.
	 *
	 * Called internally after each customization or export request to update the exports.
	 * Exports of type EMAIL and DOWNLOAD are created.
	 *
	 * Called by SessionEngineCore.updateResponseDto.
	 */
	public createExportsFromDto(): void {
		if (!this._sessionEngineCore.responseDto) return;

		for (const exportId in this._sessionEngineCore.responseDto.exports) {
			if (
				this._sessionEngineCore.responseDto.exports[exportId].type ===
					ResExportDefinitionType.EMAIL ||
				this._sessionEngineCore.responseDto.exports[exportId].type ===
					ResExportDefinitionType.DOWNLOAD
			) {
				if (!this.exports[exportId]) {
					this._sessionEngineCore.responseDto.exports[exportId].id =
						exportId;
					this.exports[exportId] = new Export(
						this._sessionEngineCore.responseDto.exports[
							exportId
						] as ResExport,
						this._sessionEngineCore,
						this,
					);
				} else {
					this.exports[exportId].updateExport(
						this._sessionEngineCore.responseDto.exports[
							exportId
						] as ResExport,
					);
				}
			}
		}
	}

	/**
	 * Requests an export.
	 *
	 * @param exportId The id of the export to request
	 * @param parameters The parameters to use for the export
	 * @param maxWaitTime The maximum time to wait for the export to complete
	 * @param retry Whether to retry the request in case of failure
	 * @returns Promise with the requested export
	 */
	public async requestExport(
		exportId: string,
		parameters: {[key: string]: unknown},
		maxWaitTime: number,
		retry = false,
	): Promise<ResExport> {
		this._sessionEngineCore.utilsManager.checkAvailability("export");
		try {
			await this._sessionEngineCore.fileUploadManager.uploadFileParameters(
				parameters,
			);
			const requestParameterSet = this.cleanExportParameters(parameters);
			const responseDto = await new UtilsApi(
				this._sessionEngineCore.sdkConfig,
			).submitAndWaitForExport(
				this._sessionEngineCore.sessionId!,
				{exports: [exportId], parameters: requestParameterSet},
				maxWaitTime,
				this._sessionEngineCore.parameterManager.ignoreUnknownParams,
			);
			this._sessionEngineCore.updateResponseDto(responseDto);
			return this.exports[exportId];
		} catch (e) {
			await this._sessionEngineCore.utilsManager.handleError(e, retry);
			return await this.requestExport(
				exportId,
				parameters,
				maxWaitTime,
				true,
			);
		}
	}

	/**
	 * Requests multiple exports.
	 *
	 * @param body The export request body
	 * @param loadOutputs Whether to load outputs as part of the export request
	 * @param maxWaitMsec The maximum time to wait for the export to complete
	 * @param retry Whether to retry the request in case of failure
	 * @returns Promise with the response DTO
	 */
	public async requestExports(
		body: ReqExport,
		loadOutputs: boolean = false,
		maxWaitMsec?: number,
		retry = false,
	): Promise<ResBase> {
		let processId;
		const eventId = this._uuidGenerator.create();
		// if the outputs are loaded, we treat this as a customization by sending the same events
		const treatInternallyAsCustomization =
			loadOutputs === true &&
			this._sessionEngineCore.outputManager.allowOutputLoading === true;

		const eventInfo = {
			type: TASK_TYPE.SESSION_CUSTOMIZATION,
			category: TASK_CATEGORY.SESSION_CUSTOMIZATION.CUSTOMIZE_VIA_EXPORTS,
			id: eventId,
			data: {sessionId: this._sessionEngineCore.id},
		};

		this._sessionEngineCore.utilsManager.checkAvailability("export");
		try {
			if (treatInternallyAsCustomization) {
				this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_START, {
					...eventInfo,
					progress: 0,
					status: "Customizing session",
				});
			}

			// activate the busy mode if outputs are loaded
			if (
				loadOutputs === true &&
				this._sessionEngineCore.outputManager.allowOutputLoading ===
					true &&
				body.outputs &&
				Object.keys(body.outputs).length > 0
			) {
				processId = this._uuidGenerator.create();
				this._sessionEngineCore.utilsManager.addBusyMode(processId);
			}

			if (treatInternallyAsCustomization) {
				this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_PROCESS, {
					...eventInfo,
					progress: 0.1,
					status: "Uploading file parameters",
				});
			}

			await this._sessionEngineCore.fileUploadManager.uploadFileParameters(
				body.parameters as {[key: string]: string | File | Blob},
			);
			const requestParameterSet = this.cleanExportParameters(
				body.parameters,
			);

			if (treatInternallyAsCustomization) {
				this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_PROCESS, {
					...eventInfo,
					progress: 0.1,
					status: "Sending customization request",
				});
			}

			const responseDto = await new UtilsApi(
				this._sessionEngineCore.sdkConfig,
			).submitAndWaitForExport(
				this._sessionEngineCore.sessionId!,
				{
					exports: body.exports,
					parameters: requestParameterSet,
					outputs: body.outputs,
					max_wait_time: body.max_wait_time,
				},
				maxWaitMsec,
				this._sessionEngineCore.parameterManager.ignoreUnknownParams,
			);
			this._sessionEngineCore.updateResponseDto(responseDto);

			if (treatInternallyAsCustomization) {
				await this._sessionEngineCore.outputManager.updateOutputs({
					...eventInfo,
					progressRange: {
						min: 0.1,
						max: 0.9,
					},
				});
				this._eventEngine.emitEvent(
					EVENTTYPE.SESSION.SESSION_CUSTOMIZED,
					{sessionId: this._sessionEngineCore.id},
				);

				this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_END, {
					...eventInfo,
					progress: 1,
					status: "Session customized",
				});
			}

			if (processId)
				this._sessionEngineCore.utilsManager.removeBusyMode(processId);
			return responseDto;
		} catch (e) {
			if (treatInternallyAsCustomization) {
				this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_CANCEL, {
					...eventInfo,
					progress: 1,
					status: "Session customization failed",
				});
			}

			if (processId)
				this._sessionEngineCore.utilsManager.removeBusyMode(processId);
			await this._sessionEngineCore.utilsManager.handleError(e, retry);
			return await this.requestExports(
				body,
				loadOutputs,
				maxWaitMsec,
				true,
			);
		}
	}

	/**
	 * Save the export properties for displayname, order, tooltip and hidden
	 *
	 * @param exports
	 * @returns
	 */
	public async saveExportProperties(
		exports: {
			[key: string]: {
				displayname: string;
				hidden: boolean;
				order: number;
				tooltip: string;
			};
		},
		retry = false,
	): Promise<boolean> {
		this._sessionEngineCore.utilsManager.checkAvailability(
			"export-definition",
			true,
		);
		try {
			await new ExportApi(
				this._sessionEngineCore.sdkConfig,
			).updateExportDefinitions(
				this._sessionEngineCore.modelId!,
				exports,
			);
			return true;
		} catch (e) {
			await this._sessionEngineCore.utilsManager.handleError(e, retry);
			return await this.saveExportProperties(exports, true);
		}
	}
}
