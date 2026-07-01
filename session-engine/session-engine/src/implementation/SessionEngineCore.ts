import {
	Configuration,
	ResBase,
	ResModelState,
	SessionApi,
	UtilsApi,
} from "@shapediver/sdk.geometry-api-sdk-v2";
import {latestVersion} from "@shapediver/viewer.settings";
import {type ITreeNode, TreeNode} from "@shapediver/viewer.shared.node-tree";
import {
	EventEngine,
	EVENTTYPE,
	HttpClient,
	PerformanceEvaluator,
	ShapeDiverViewerSessionError,
	SystemInfo,
	UuidGenerator} from "@shapediver/viewer.shared.services";

import {type ISessionEngineCreationDefinition} from "../interfaces/ISessionEngine";
import {CustomizationManager} from "./managers/CustomizationManager";
import {ExportManager} from "./managers/ExportManager";
import {FileUploadManager} from "./managers/FileUploadManager";
import {ModelStateManager} from "./managers/ModelStateManager";
import {OutputManager} from "./managers/OutputManager";
import {ParameterManager} from "./managers/ParameterManager";
import {SettingsManager} from "./managers/SettingsManager";
import {UtilsManager} from "./managers/UtilsManager";

/**
 * Core class of the Session Engine.
 *
 * The SessionEngineCore is the main entry point to create and manage sessions.
 * The manager instances for parameters, outputs, exports, etc. can be accessed via their respective properties.
 */
export class SessionEngineCore {
	private readonly _customizationManager: CustomizationManager;
	private readonly _eventEngine = EventEngine.instance;
	private readonly _exportManager: ExportManager;
	private readonly _fileUploadManager: FileUploadManager;
	private readonly _guid?: string;
	private readonly _httpClient: HttpClient = HttpClient.instance;
	private readonly _id: string;
	private readonly _modelStateManager: ModelStateManager;
	private readonly _modelViewUrl: string;
	private readonly _outputManager: OutputManager;
	private readonly _parameterManager: ParameterManager;
	private readonly _performanceEvaluator = PerformanceEvaluator.instance;
	private readonly _sessionEngineId = UuidGenerator.instance.create();
	private readonly _settingsManager: SettingsManager;
	private readonly _ticket?: string;
	private readonly _utilsManager: UtilsManager;

	private _automaticSceneUpdate: boolean = true;
	private _closeOnFailure: () => Promise<void> = async () => {};
	private _closed: boolean = false;
	private _excludeViewports: string[] = [];
	private _headers = {
		"X-ShapeDiver-Origin": SystemInfo.instance.origin,
		"X-ShapeDiver-SessionEngineId": this._sessionEngineId,
		"X-ShapeDiver-BuildVersion": "",
		"X-ShapeDiver-BuildDate": "",
	};
	private _initialized: boolean = false;
	private _jwtToken?: string;
	private _loadSdtf: boolean = false;
	private _modelId?: string;
	private _node: ITreeNode;
	private _refreshJwtToken?: () => Promise<string>;
	private _responseDto?: ResBase;
	private _sdkConfig!: Configuration;
	private _sessionId?: string;
	private _updateCallback:
		| ((newNode?: ITreeNode, oldNode?: ITreeNode) => void)
		| null = null;

	/**
	 * Can be use to initialize a session with the ticket/guid and modelViewUrl and returns a scene graph node with the result.
	 * Can be use to customize the session with updated parameters to get the updated scene graph node.
	 */
	constructor(properties: ISessionEngineCreationDefinition) {
		this._utilsManager = new UtilsManager(this);
		this._settingsManager = new SettingsManager(this);
		this._outputManager = new OutputManager(this);
		this._exportManager = new ExportManager(this);
		this._fileUploadManager = new FileUploadManager(this);
		this._parameterManager = new ParameterManager(this);
		this._customizationManager = new CustomizationManager(this);
		this._modelStateManager = new ModelStateManager(this);

		this._id = properties.id;
		this._node = new TreeNode(properties.id);
		this._guid = properties.guid;
		this._ticket = properties.ticket;
		this._modelViewUrl = properties.modelViewUrl;
		this._excludeViewports = properties.excludeViewports || [];
		this._jwtToken = properties.jwtToken;
		this._outputManager.allowOutputLoading = properties.allowOutputLoading;
		this._parameterManager.ignoreUnknownParams =
			properties.ignoreUnknownParams;
		this._loadSdtf = properties.loadSdtf;
		this._modelStateManager.modelStateId = properties.modelStateId;
		this._modelStateManager.modelStateValidationMode =
			properties.modelStateValidationMode;
		this._customizationManager.throwOnCustomizationError =
			properties.throwOnCustomizationError !== undefined
				? properties.throwOnCustomizationError
				: false;

		this._headers["X-ShapeDiver-BuildDate"] = properties.buildDate;
		this._headers["X-ShapeDiver-BuildVersion"] = properties.buildVersion;

		try {
			this._sdkConfig = new Configuration({
				basePath: this._modelViewUrl,
				accessToken: this._jwtToken,
				baseOptions: {
					headers: this._headers,
				},
			});
		} catch (e) {
			this._utilsManager.handleError(e).then((convertedError) => {
				throw convertedError;
			});
		}
	}

	public get automaticSceneUpdate(): boolean {
		return this._automaticSceneUpdate;
	}

	public set automaticSceneUpdate(value: boolean) {
		this._automaticSceneUpdate = value;
		value && this._closed === false
			? this._utilsManager.addToSceneTree(this._node)
			: this._utilsManager.removeFromSceneTree(this._node);
	}

	public get closeOnFailure(): () => Promise<void> {
		return this._closeOnFailure;
	}

	public get closed(): boolean {
		return this._closed;
	}

	public get customizationManager(): CustomizationManager {
		return this._customizationManager;
	}

	public get excludeViewports(): string[] {
		return this._excludeViewports;
	}

	public set excludeViewports(value: string[]) {
		this._excludeViewports = JSON.parse(JSON.stringify(value));
		this._node.excludeViewports = JSON.parse(JSON.stringify(value));
	}

	public get exportManager(): ExportManager {
		return this._exportManager;
	}

	public get fileUploadManager(): FileUploadManager {
		return this._fileUploadManager;
	}

	public get guid(): string | undefined {
		return this._guid;
	}

	public get id(): string {
		return this._id;
	}

	public get initialized(): boolean {
		return this._initialized;
	}

	public set initialized(value: boolean) {
		this._initialized = value;
	}

	public get jwtToken(): string | undefined {
		return this._jwtToken;
	}

	public get loadSdtf(): boolean {
		return this._loadSdtf;
	}

	public set loadSdtf(value: boolean) {
		this._loadSdtf = value;
		if (this._initialized === true && this._loadSdtf === true) {
			(async () => {
				this._outputManager.reloadSdtf = true;
				await this._outputManager.updateOutputs();
				this._outputManager.reloadSdtf = false;
				this._eventEngine.emitEvent(
					EVENTTYPE.SESSION.SESSION_SDTF_DELAYED_LOADED,
					{sessionId: this.id},
				);
			})();
		}
	}

	public get modelId(): string | undefined {
		return this._modelId;
	}

	public get modelStateManager(): ModelStateManager {
		return this._modelStateManager;
	}

	public get modelViewUrl(): string {
		return this._modelViewUrl;
	}

	public get node(): ITreeNode {
		return this._node;
	}

	public set node(value: ITreeNode) {
		this._node = value;
	}

	public get outputManager(): OutputManager {
		return this._outputManager;
	}

	public get parameterManager(): ParameterManager {
		return this._parameterManager;
	}

	public get refreshJwtToken(): (() => Promise<string>) | undefined {
		return this._refreshJwtToken;
	}

	public set refreshJwtToken(value: (() => Promise<string>) | undefined) {
		this._refreshJwtToken = value;
	}

	public get responseDto(): ResBase | undefined {
		return this._responseDto;
	}

	public get sdkConfig(): Configuration {
		return this._sdkConfig;
	}

	public get sessionId(): string | undefined {
		return this._sessionId;
	}

	public get settingsManager(): SettingsManager {
		return this._settingsManager;
	}

	public get ticket(): string | undefined {
		return this._ticket;
	}

	public get updateCallback():
		| ((newNode?: ITreeNode, oldNode?: ITreeNode) => void)
		| null {
		return this._updateCallback;
	}

	public set updateCallback(
		value: ((newNode?: ITreeNode, oldNode?: ITreeNode) => void) | null,
	) {
		this._updateCallback = value;
	}

	public get utilsManager(): UtilsManager {
		return this._utilsManager;
	}

	/**
	 * Closes the session.
	 *
	 * @param retry whether to retry closing the session in case of failure
	 */
	public async close(retry = false): Promise<void> {
		this._utilsManager.checkAvailability("close");

		try {
			this._httpClient.removeDataLoading(this._sessionId!);
			await new SessionApi(this._sdkConfig).closeSession(
				this._sessionId!,
			);
			if (this._automaticSceneUpdate)
				this._utilsManager.removeFromSceneTree(this._node);

			this._closed = true;
		} catch (e) {
			await this._utilsManager.handleError(e, retry);
			return await this.close(true);
		}
	}

	/**
	 * Initializes the session with the ticket and modelViewUrl.
	 *
	 * @returns promise with a scene graph node
	 */
	public async init(
		parameterValues?: {
			[key: string]: string;
		},
		retry = false,
	): Promise<void> {
		if (this._initialized === true)
			throw new ShapeDiverViewerSessionError(
				"Session.init: Session already initialized.",
			);

		try {
			this._performanceEvaluator.startSection("sessionResponse.init");

			const parameterSet: {[key: string]: string} = {};
			// the slice here is done as a way for deep copying the string values
			for (const parameterNameOrId in parameterValues)
				parameterSet[parameterNameOrId] = (
					" " + parameterValues[parameterNameOrId]
				).slice(1);

			if (this._ticket) {
				this._responseDto = (
					await new SessionApi(this._sdkConfig).createSessionByTicket(
						this._ticket,
						this._modelStateManager.modelStateId,
						this._parameterManager.ignoreUnknownParams,
						this._modelStateManager.modelStateValidationMode,
						parameterSet,
					)
				).data;
			} else if (this._guid) {
				this._responseDto = (
					await new SessionApi(this._sdkConfig).createSessionByModel(
						this._guid,
						this._modelStateManager.modelStateId,
						this._parameterManager.ignoreUnknownParams,
						this._modelStateManager.modelStateValidationMode,
						parameterSet,
					)
				).data;
			} else {
				// we should never get here
				throw new ShapeDiverViewerSessionError(
					"Session.init: Initialization of session failed. Neither a ticket nor a guid are available.",
				);
			}
			this._performanceEvaluator.endSection("sessionResponse.init");
			this._settingsManager.viewerSettings =
				this._responseDto.viewer?.config;
			this._settingsManager.viewerSettingsVersionBackend =
				this._responseDto.viewerSettingsVersion || latestVersion;
			this._sessionId = this._responseDto.sessionId;
			this._modelId = this._responseDto.model?.id;
			this._modelStateManager.modelState = this._responseDto
				.modelState as ResModelState;

			this._httpClient.addDataLoading(this._sessionId!, {
				getAsset: async (url: string) => {
					const response = await new UtilsApi(
						this._sdkConfig,
					).downloadAsset(url, {
						responseType: "arraybuffer",
					})[0];
					return [
						response.data as unknown as ArrayBuffer,
						response.headers["content-type"] as string,
					];
				},
				downloadTexture: async (
					url: string,
				): Promise<[ArrayBuffer, string]> => {
					try {
						const response = await new UtilsApi(
							this._sdkConfig,
						).downloadImage(this._sessionId!, url, {
							responseType: "arraybuffer",
						});

						return [
							response.data as unknown as ArrayBuffer,
							response.headers["content-type"] as string,
						];
					} catch (e) {
						throw await this._utilsManager.handleError(e);
					}
				},
			});

			this._settingsManager.settingsEngine.loadSettings(
				this._settingsManager.viewerSettings,
			);

			if (!this._sessionId)
				throw new ShapeDiverViewerSessionError(
					"Session.init: Initialization of session failed. ResponseDto did not have a sessionId.",
				);
			if (!this._modelId)
				throw new ShapeDiverViewerSessionError(
					"Session.init: Initialization of session failed. ResponseDto did not have a model.id.",
				);

			this.updateResponseDto(this._responseDto, parameterSet);
			this._initialized = true;
		} catch (e) {
			await this._utilsManager.handleError(e, retry);
			return await this.init(parameterValues, true);
		}
	}

	/**
	 * Sets the JWT token for the session.
	 *
	 * @param value the JWT token
	 * @param retry whether to retry setting the token in case of failure
	 */
	public async setJwtToken(value: string, retry = false) {
		this._utilsManager.checkAvailability();

		this._jwtToken = value;
		try {
			this._sdkConfig.accessToken = value;
			const responseDto = (
				await new SessionApi(this._sdkConfig).getSessionDefaults(
					this._sessionId!,
				)
			).data;
			if (this._responseDto)
				this._responseDto.actions = responseDto.actions;
		} catch (e) {
			await this._utilsManager.handleError(e, retry);
			await this.setJwtToken(value, true);
		}
	}

	/**
	 * Updates the response DTO of the session engine core.
	 *
	 * @param responseDto The new response DTO
	 * @param initialParameters Optional initial parameters to consider when updating
	 */
	public updateResponseDto(
		responseDto: ResBase,
		initialParameters?: {
			[key: string]: string;
		},
	) {
		if (!this._responseDto) {
			this._responseDto = responseDto;
			return;
		}

		// convert parameters
		if (responseDto.parameters) {
			for (const parameterId in responseDto.parameters) {
				this._responseDto.parameters =
					this._responseDto.parameters || {};
				this._responseDto.parameters[parameterId] =
					this._responseDto.parameters[parameterId] ||
					responseDto.parameters[parameterId];
			}
		}

		// convert outputs
		if (responseDto.outputs) {
			for (const outputId in responseDto.outputs) {
				this._responseDto.outputs = this._responseDto.outputs || {};
				if (
					"version" in responseDto.outputs[outputId] ||
					!(
						this._responseDto.outputs[outputId] &&
						"version" in this._responseDto.outputs[outputId]
					)
				)
					this._responseDto.outputs[outputId] =
						responseDto.outputs[outputId];
			}
		}

		// convert exports
		if (responseDto.exports) {
			for (const exportId in responseDto.exports) {
				this._responseDto.exports = this._responseDto.exports || {};
				if (
					"version" in responseDto.exports[exportId] ||
					!(
						this._responseDto.exports[exportId] &&
						"version" in this._responseDto.exports[exportId]
					)
				)
					this._responseDto.exports[exportId] =
						responseDto.exports[exportId];
			}
		}

		this._parameterManager.createParametersFromDto(initialParameters);
		this._exportManager.createExportsFromDto();
		this._outputManager.createOutputsFromDto();
	}
}
