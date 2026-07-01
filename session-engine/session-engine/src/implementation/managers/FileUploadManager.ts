import {
	extractFileInfo,
	FileApi,
	GltfApi,
	QueryGltfConversion,
	ReqSdtfType,
	ResAssetDefinition,
	ResBase,
	ResFileInfo,
	SdtfApi,
	UtilsApi,
} from "@shapediver/sdk.geometry-api-sdk-v2";
import {ShapeDiverViewerSessionError} from "@shapediver/viewer.shared.services";

import {type IFileParameter} from "../../interfaces/dto/IFileParameter";
import {FileParameter} from "../dto/FileParameter";
import {SessionEngineCore} from "../SessionEngineCore";

/**
 * Manager responsible for file uploads.
 *
 * The manager is created by the SessionEngineCore and can be accessed
 * via the `fileUploadManager` property.
 */
export class FileUploadManager {
	private readonly _sessionEngineCore: SessionEngineCore;

	constructor(sessionEngineCore: SessionEngineCore) {
		this._sessionEngineCore = sessionEngineCore;
	}

	public get canUploadGLTF(): boolean {
		try {
			this._sessionEngineCore.utilsManager.checkAvailability(
				"gltf-upload",
			);
			return true;
		} catch (e) {
			return false;
		}
	}

	/**
	 * Retrieves file information for a given parameter and file ID.
	 *
	 * @param parameterId The ID of the parameter
	 * @param fileId The ID of the file
	 * @param retry Whether to retry the request in case of failure
	 * @returns Promise with the file information
	 */
	public async getFileInfo(
		parameterId: string,
		fileId: string,
		retry = false,
	): Promise<ResFileInfo> {
		this._sessionEngineCore.utilsManager.checkAvailability();
		try {
			const response = await new FileApi(
				this._sessionEngineCore.sdkConfig,
			).getFileMetadata(
				this._sessionEngineCore.sessionId!,
				parameterId,
				fileId,
			);

			const {size, filename} = extractFileInfo(response.headers);
			return {
				parameterId: parameterId,
				id: fileId,
				size: size!,
				filename: filename,
			};
		} catch (e) {
			await this._sessionEngineCore.utilsManager.handleError(e, retry);
			return await this.getFileInfo(parameterId, fileId, true);
		}
	}

	/**
	 * Get all file parameters from the parameter set.
	 * If the parameter is not set in the parameter set, the value from the parameter object is used.
	 *
	 * @param parameters
	 * @returns
	 */
	public getFileParameterSet(parameters: {[key: string]: unknown}): {
		[key: string]: string | File | Blob;
	} {
		const fileParameterSet: {[key: string]: string | File | Blob} = {};
		for (const parameterId in this._sessionEngineCore.parameterManager
			.parameters) {
			if (
				this._sessionEngineCore.parameterManager.parameters[
					parameterId
				] instanceof FileParameter
			) {
				fileParameterSet[parameterId] =
					parameters[parameterId] !== undefined
						? (parameters[parameterId] as string | File | Blob)
						: (
								this._sessionEngineCore.parameterManager
									.parameters[parameterId] as FileParameter
							).value;
			}
		}
		return fileParameterSet;
	}

	/**
	 * Uploads a file for a given parameter.
	 *
	 * @param parameterId The ID of the parameter
	 * @param data The file to upload
	 * @param type The MIME type of the file
	 * @param retry Whether to retry the request in case of failure
	 * @returns Promise with the file ID
	 */
	public async uploadFile(
		parameterId: string,
		data: File,
		type: string,
		retry = false,
	): Promise<string> {
		this._sessionEngineCore.utilsManager.checkAvailability("file-upload");
		try {
			const result = (
				await new FileApi(this._sessionEngineCore.sdkConfig).uploadFile(
					this._sessionEngineCore.sessionId!,
					{
						[parameterId]: {
							size: data.size,
							format: type,
							filename: data.name === "" ? undefined : data.name,
						},
					},
				)
			).data;

			if (
				result &&
				result.asset &&
				result.asset.file &&
				result.asset.file[parameterId]
			) {
				const fileAsset = result.asset.file[parameterId];
				await new UtilsApi(
					this._sessionEngineCore.sdkConfig,
				).uploadAsset(
					fileAsset.href,
					await data.arrayBuffer(),
					fileAsset.headers,
				);
				return fileAsset.id;
			} else {
				throw new ShapeDiverViewerSessionError(
					"Session.uploadFile: Upload reply has not the required format.",
				);
			}
		} catch (e) {
			await this._sessionEngineCore.utilsManager.handleError(e, retry);
			return await this.uploadFile(parameterId, data, type, true);
		}
	}

	/**
	 * Uploads all file parameters and returns the file parameter values.
	 * If parameterValues is provided, the file parameter values are added to it.
	 *
	 * @param parameterValues
	 * @returns
	 */
	public async uploadFileParameters(parameterValues?: {
		[key: string]: unknown;
	}): Promise<{[key: string]: string}> {
		const parameterValueSet =
			parameterValues !== undefined
				? this.getFileParameterSet(parameterValues)
				: undefined;

		const fileParameterValues: {[key: string]: string} = {};
		// load file parameter first
		for (const parameterId in this._sessionEngineCore.parameterManager
			.parameters) {
			if (
				this._sessionEngineCore.parameterManager.parameters[
					parameterId
				] instanceof FileParameter
			) {
				fileParameterValues[parameterId] = await (<IFileParameter>(
					this._sessionEngineCore.parameterManager.parameters[
						parameterId
					]
				)).upload(
					parameterValueSet
						? parameterValueSet[parameterId]
						: undefined,
				);
				if (
					parameterValues &&
					parameterValues[parameterId] !== undefined
				) {
					// if a value was provided, we replace it with the returned id
					parameterValues[parameterId] =
						fileParameterValues[parameterId];

					// if the parameter value of the file parameter was used, set the value to the parameter
					if (
						this._sessionEngineCore.parameterManager.parameters[
							parameterId
						].value !== fileParameterValues[parameterId]
					)
						this._sessionEngineCore.parameterManager.parameters[
							parameterId
						].value = fileParameterValues[parameterId];
				} else if (
					this._sessionEngineCore.parameterManager.parameters[
						parameterId
					].value !== fileParameterValues[parameterId]
				) {
					this._sessionEngineCore.parameterManager.parameters[
						parameterId
					].value = fileParameterValues[parameterId];
				}
			}
		}

		return fileParameterValues;
	}

	/**
	 * Uploads a GLTF file to the session.
	 *
	 * @param blob The GLTF file as a Blob
	 * @param conversion The type of conversion to apply
	 * @param retry Whether to retry the request in case of failure
	 * @returns Promise with the response data
	 */
	public async uploadGLTF(
		blob: Blob,
		conversion: QueryGltfConversion = QueryGltfConversion.NONE,
		retry = false,
	): Promise<ResBase> {
		this._sessionEngineCore.utilsManager.checkAvailability("gltf-upload");
		try {
			const responseDto = (
				await new GltfApi(this._sessionEngineCore.sdkConfig).uploadGltf(
					this._sessionEngineCore.sessionId!,
					new File([blob], "model.gltf", {
						type: "model/gltf-binary",
					}),
					conversion,
				)
			).data;
			if (!responseDto || !responseDto.gltf || !responseDto.gltf.href)
				throw new ShapeDiverViewerSessionError(
					"Session.uploadGLTF: Upload reply has not the required format.",
				);
			return responseDto;
		} catch (e) {
			await this._sessionEngineCore.utilsManager.handleError(e, retry);
			return await this.uploadGLTF(blob, conversion, true);
		}
	}

	/**
	 * Uploads SDTF files to the session.
	 *
	 * @param arrayBuffers The SDTF files as ArrayBuffers
	 * @param retry Whether to retry the request in case of failure
	 * @returns Promise with the response data
	 */
	public async uploadSDTF(
		arrayBuffers: ArrayBuffer[],
		retry = false,
	): Promise<ResAssetDefinition[]> {
		this._sessionEngineCore.utilsManager.checkAvailability("file-upload");

		try {
			const responseDto = (
				await new SdtfApi(this._sessionEngineCore.sdkConfig).uploadSdtf(
					this._sessionEngineCore.sessionId!,
					arrayBuffers.map((arrayBuffer) => {
						return {
							namespace: "pub",
							content_length: arrayBuffer.byteLength,
							content_type: ReqSdtfType.MODEL_SDTF,
						};
					}),
				)
			).data;
			if (
				!responseDto ||
				!responseDto.asset ||
				!responseDto.asset.sdtf ||
				responseDto.asset.sdtf.length !== arrayBuffers.length
			)
				throw new ShapeDiverViewerSessionError(
					"Session.uploadSDTF: Upload reply has not the required format.",
				);

			const promises = arrayBuffers.map((buffer, index) => {
				const url = responseDto.asset.sdtf[index].href;
				return new UtilsApi(this._sessionEngineCore.sdkConfig).upload(
					url,
					buffer,
					ReqSdtfType.MODEL_SDTF,
				);
			});
			await Promise.all(promises);

			return responseDto.asset.sdtf;
		} catch (e) {
			await this._sessionEngineCore.utilsManager.handleError(e, retry);
			return await this.uploadSDTF(arrayBuffers, true);
		}
	}
}
