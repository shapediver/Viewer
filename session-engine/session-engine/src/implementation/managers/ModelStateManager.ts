import {
	GltfApi,
	ModelStateApi,
	QueryGltfConversion,
	ReqFileDefinition,
	ResGetModelState,
	ResModelState,
	UtilsApi,
} from "@shapediver/sdk.geometry-api-sdk-v2";
import {type ITreeNode, TreeNode} from "@shapediver/viewer.shared.node-tree";
import {
	Converter,
	HttpClient,
	ShapeDiverViewerSessionError} from "@shapediver/viewer.shared.services";

import {SessionEngineCore} from "../SessionEngineCore";

/**
 * Manager responsible for model states.
 *
 * The manager is created by the SessionEngineCore and can be accessed
 * via the `modelStateManager` property.
 */
export class ModelStateManager {
	private readonly _converter = Converter.instance;
	private readonly _httpClient = HttpClient.instance;
	private readonly _sessionEngineCore: SessionEngineCore;

	private _modelState?: ResModelState;
	private _modelStateId?: string;
	private _modelStateValidationMode?: boolean;

	constructor(sessionEngineCore: SessionEngineCore) {
		this._sessionEngineCore = sessionEngineCore;
	}

	public get modelState(): ResModelState | undefined {
		return this._modelState;
	}

	public set modelState(value: ResModelState | undefined) {
		this._modelState = value;
		this._modelStateId = value?.id;
	}

	public get modelStateId(): string | undefined {
		return this._modelStateId;
	}

	public set modelStateId(value: string | undefined) {
		this._modelStateId = value;
	}

	public get modelStateValidationMode(): boolean | undefined {
		return this._modelStateValidationMode;
	}

	public set modelStateValidationMode(value: boolean | undefined) {
		this._modelStateValidationMode = value;
	}

	/**
	 * Creates a new model state with the given parameter values and optional image and data.
	 *
	 * @param parameterValues Key-value pairs of parameter IDs and their corresponding values
	 * @param omitSessionParameterValues Whether to omit parameters that have not been explicitly set in the session
	 * @param image Optional image to associate with the model state
	 * @param data Optional additional data to associate with the model state
	 * @param arScene Optional AR scene to associate with the model state
	 * @param retry Whether to retry the request in case of failure
	 * @returns Promise with the ID of the created model state
	 */
	public async createModelState(
		parameterValues: {[key: string]: unknown} = {},
		omitSessionParameterValues: boolean = false,
		image?:
			| (() => string)
			| (() => Promise<string>)
			| string
			| Promise<string>
			| Blob
			| File,
		data?: Record<string, any>,
		arScene?:
			| (() => Promise<ArrayBuffer>)
			| ArrayBuffer
			| (() => Promise<Blob>)
			| Blob
			| File,
		retry = false,
	): Promise<string> {
		this._sessionEngineCore.utilsManager.checkAvailability();

		try {
			const promises = [];

			// process the parameters
			const parameterSet: {
				[key: string]: string;
			} = {};
			promises.push(
				this._sessionEngineCore.fileUploadManager
					.uploadFileParameters(parameterValues)
					.then(() => {
						// create a set of the current validated parameter values
						for (const parameterId in this._sessionEngineCore
							.parameterManager.parameters) {
							// if the parameter has not been set, we do not include it in the parameter set if the omitSessionParameterValues flag is set
							if (
								!(
									omitSessionParameterValues === true &&
									parameterValues[parameterId] === undefined
								)
							) {
								parameterSet[parameterId] = (
									" " +
									this._sessionEngineCore.parameterManager.parameters[
										parameterId
									].stringify(parameterValues[parameterId])
								).slice(1);
							}
						}
					}),
			);

			// process the image input
			let imageData: ReqFileDefinition | undefined;
			let imageArrayBuffer: ArrayBuffer | undefined;
			if (image) {
				promises.push(
					this._sessionEngineCore.utilsManager
						.processImageInput(image)
						.then((result) => {
							imageData = result?.imageData;
							imageArrayBuffer = result?.arrayBuffer;
						}),
				);
			}

			// process the arScene input
			let arSceneId: string | undefined;
			if (arScene) {
				promises.push(
					this._converter
						.convertToBlob(arScene)
						.then((arSceneBlob) =>
							new GltfApi(
								this._sessionEngineCore.sdkConfig,
							).uploadGltf(
								this._sessionEngineCore.sessionId!,
								new File([arSceneBlob], "arScene.gltf", {
									type: "model/gltf-binary",
								}),
								QueryGltfConversion.SCENE,
							),
						)
						.then((arSceneResponseDto) => {
							arSceneId = arSceneResponseDto.data.gltf?.sceneId;
						}),
				);
			}

			// wait for all promises to resolve
			await Promise.all(promises);

			// create the model state
			const response = (
				await new ModelStateApi(
					this._sessionEngineCore.sdkConfig,
				).createModelState(this._sessionEngineCore.sessionId!, {
					parameters: parameterSet,
					data: data,
					image: imageData,
					arSceneId: arSceneId,
				})
			).data;

			if (imageData && imageArrayBuffer)
				await new UtilsApi(
					this._sessionEngineCore.sdkConfig,
				).uploadAsset(
					response.asset!.modelState!.href,
					imageArrayBuffer,
					response.asset!.modelState!.headers,
				);

			return response.modelState!.id!;
		} catch (e) {
			await this._sessionEngineCore.utilsManager.handleError(e, retry);
			return await this.createModelState(
				parameterValues,
				omitSessionParameterValues,
				image,
				data,
				arScene,
				true,
			);
		}
	}

	/**
	 * Customizes the session using the provided model state.
	 *
	 * @param modelState The model state ID or the model state response object
	 * @param retry Whether to retry the request in case of failure
	 * @returns Promise with the root tree node of the customized session
	 */
	public async customizeWithModelState(
		modelState: string | ResGetModelState,
		retry = false,
	): Promise<ITreeNode> {
		this._sessionEngineCore.utilsManager.checkAvailability();

		try {
			// get the model state if it is not already a response
			let response: ResGetModelState;
			if (typeof modelState === "string") {
				response = (
					await new ModelStateApi(
						this._sessionEngineCore.sdkConfig,
					).getModelState(modelState)
				).data;
			} else {
				response = modelState;
			}

			if (!response.modelState) return new TreeNode();

			// read out the parameter values from the model state
			for (const parameterId in response.modelState.parameters)
				this._sessionEngineCore.parameterManager.parameters[
					parameterId
				].value = response.modelState.parameters[parameterId];

			return this._sessionEngineCore.customizationManager.customize();
		} catch (e) {
			await this._sessionEngineCore.utilsManager.handleError(e, retry);
			return await this.customizeWithModelState(modelState, true);
		}
	}

	/**
	 * Retrieves a model state by its ID.
	 *
	 * @param modelStateId The ID of the model state to retrieve. If undefined, the current model state ID is used.
	 * @returns Promise with the model state information
	 */
	public async getModelState(
		modelStateId?: string,
	): Promise<ResGetModelState> {
		this._sessionEngineCore.utilsManager.checkAvailability();
		try {
			const id = modelStateId || this._modelStateId;
			if (!id)
				throw new ShapeDiverViewerSessionError(
					"Session.getModelState: No model state id available.",
				);

			const response: ResGetModelState = (
				await new ModelStateApi(
					this._sessionEngineCore.sdkConfig,
				).getModelState(id)
			).data;
			return response;
		} catch (e) {
			throw await this._httpClient.convertError(e);
		}
	}
}
