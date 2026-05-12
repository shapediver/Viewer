import {
	processError,
	ReqFileDefinition,
	RequestError,
	ResComputationStatus,
	ResErrorType,
	ResExport,
	ResOutput,
	ResParameter,
	ResponseError,
	SdGeometryError,
	UtilsApi,
} from "@shapediver/sdk.geometry-api-sdk-v2";
import {GlobalAccessObjects} from "@shapediver/viewer.shared.global-access-objects";
import {ITree, ITreeNode, Tree} from "@shapediver/viewer.shared.node-tree";
import {
	Converter,
	EventEngine,
	EVENTTYPE,
	EVENTTYPE_SESSION,
	HttpClient,
	Logger,
	ShapeDiverViewerCustomizationError,
	ShapeDiverViewerError,
	ShapeDiverViewerSessionError,
	StateEngine,
} from "@shapediver/viewer.shared.services";
import {
	IInteractionParameterSettings,
	ISessionErrorEvent,
	ITaskEvent,
	validateInteractionParameterSettings,
} from "@shapediver/viewer.shared.types";

import {IParameter} from "../../interfaces/dto/IParameter";
import {DraggingParameter} from "../dto/interaction/DraggingParameter";
import {GumballTransformParameter} from "../dto/interaction/GumballTransformParameter";
import {RectangleTransformParameter} from "../dto/interaction/RectangleTransformParameter";
import {SelectionParameter} from "../dto/interaction/SelectionParameter";
import {Parameter} from "../dto/Parameter";
import {SessionEngineCore} from "../SessionEngineCore";
import {SessionTreeNode} from "../SessionTreeNode";

/**
 * Manager responsible for utility functions.
 * This is the manager for miscellaneous utility functions that do not fit into other managers.
 *
 * The manager is created by the SessionEngineCore and can be accessed
 * via the `utilsManager` property.
 */
export class UtilsManager {
	private readonly _converter = Converter.instance;
	private readonly _eventEngine = EventEngine.instance;
	private readonly _globalAccessObjects: GlobalAccessObjects =
		GlobalAccessObjects.instance;
	private readonly _httpClient: HttpClient = HttpClient.instance;
	private readonly _logger: Logger = Logger.instance;
	private readonly _sceneTree: ITree = Tree.instance;
	private readonly _sessionEngineCore: SessionEngineCore;
	private readonly _stateEngine: StateEngine = StateEngine.instance;

	private _retryCounter = 0;

	constructor(sessionEngineCore: SessionEngineCore) {
		this._sessionEngineCore = sessionEngineCore;
	}

	/**
	 * Add a busy mode to all viewport engines.
	 * To remove the busy mode, use `removeBusyMode`.
	 *
	 * @param busyId The ID of the busy mode to add
	 */
	public addBusyMode(busyId: string) {
		for (const r in this._stateEngine.viewportEngines) {
			if (
				this._stateEngine.viewportEngines[r] &&
				!this._sessionEngineCore.excludeViewports.includes(r)
			) {
				this._stateEngine.viewportEngines[r]!.busy.push(busyId);
				this._sessionEngineCore.customizationManager.customizationBusyModes.push(
					busyId,
				);
			}
		}
	}

	/**
	 * Adds a node to the scene tree and updates the root version.
	 *
	 * @param node The tree node to add
	 */
	public addToSceneTree(node: ITreeNode) {
		this._sceneTree.addNode(node);
		this._sceneTree.root.updateVersion();
	}

	/**
	 * Cancels the current process if a new customization request has been made or if the session was closed.
	 * If the process is cancelled, a TASK_CANCEL event is emitted and the busy mode is removed.
	 *
	 * @param eventInfo The task event information
	 * @param customizationId The ID of the customization process
	 * @param newNode The new tree node to return if the process is cancelled
	 * @returns The new tree node if the process was cancelled, otherwise undefined
	 */
	public cancelProcess(
		eventInfo: ITaskEvent,
		customizationId: string,
		newNode: ITreeNode = new SessionTreeNode(),
	): ITreeNode | undefined {
		if (
			this._sessionEngineCore.customizationManager
				.customizationProcess !== customizationId
		) {
			this.removeBusyMode(customizationId);

			this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_CANCEL, {
				...eventInfo,
				status: "The request was exceeded by another customization request",
			});
			this._logger.debug(
				`Session(${this._sessionEngineCore.id}).cancelProcess: The request was was exceeded by another request.`,
			);
			return newNode;
		} else if ((this._sessionEngineCore.closed as boolean) === true) {
			this.removeBusyMode(customizationId);

			this._logger.debug(
				`Session(${this._sessionEngineCore.id}).cancelProcess: The session was closed during the request.`,
			);

			this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_CANCEL, {
				...eventInfo,
				progress: 1,
				status: "The session was closed during the request.",
			});
			return new SessionTreeNode();
		}
	}

	/**
	 * Checks the availability of the session and optionally a specific action.
	 *
	 * @param action The action to check for availability
	 * @param checkForModelId Whether to check for the model ID availability
	 * @throws ShapeDiverViewerSessionError if the session or action is not available
	 */
	public checkAvailability(action?: string, checkForModelId = false) {
		if (!this._sessionEngineCore.responseDto)
			throw new ShapeDiverViewerSessionError(
				"Session.checkAvailability: responseDto not available.",
			);

		if (!this._sessionEngineCore.sessionId)
			throw new ShapeDiverViewerSessionError(
				"Session.checkAvailability: sessionId not available.",
			);

		if (checkForModelId && !this._sessionEngineCore.modelId)
			throw new ShapeDiverViewerSessionError(
				"Session.checkAvailability: modelId not available.",
			);

		if (action && !this._sessionEngineCore.responseDto.actions)
			throw new ShapeDiverViewerSessionError(
				"Session.checkAvailability: actions not available.",
			);

		const responseDtoAction =
			this._sessionEngineCore.responseDto.actions?.find(
				(a) => a.name === action,
			);
		if (action && !responseDtoAction)
			throw new ShapeDiverViewerSessionError(
				`Session.checkAvailability: action ${action} not available.`,
			);
	}

	/**
	 * Create an interaction parameter based on the parameter definition.
	 *
	 * @param parameter
	 * @returns
	 */
	public createInteractionParameter(
		parameter: ResParameter,
	): IParameter<unknown> {
		const result = validateInteractionParameterSettings(parameter.settings);
		if (result.success) {
			switch (
				(parameter.settings as IInteractionParameterSettings).type
			) {
				case "selection":
					return new SelectionParameter(
						parameter,
						this._sessionEngineCore,
						this._sessionEngineCore.parameterManager,
					);
				case "gumball":
					return new GumballTransformParameter(
						parameter,
						this._sessionEngineCore,
						this._sessionEngineCore.parameterManager,
					);
				case "dragging":
					return new DraggingParameter(
						parameter,
						this._sessionEngineCore,
						this._sessionEngineCore.parameterManager,
					);
				case "rectangleTransform":
					return new RectangleTransformParameter(
						parameter,
						this._sessionEngineCore,
						this._sessionEngineCore.parameterManager,
					);
			}
		} else {
			this._logger.warn(
				`SessionEngine.createInteractionParameter: The value ${parameter.settings} is not a valid InteractionParameter: ${result.error.message}`,
			);
		}
		return new Parameter<string>(
			parameter,
			this._sessionEngineCore,
			this._sessionEngineCore.parameterManager,
		);
	}

	/**
	 * Handles errors that occur during session operations.
	 *
	 * @param err The error to handle
	 * @param retry Whether to retry the operation
	 * @returns A promise that resolves when the error has been handled
	 */
	public async handleError(
		err: SdGeometryError | ShapeDiverViewerError | Error | unknown,
		retry = false,
	) {
		if (!(err instanceof Error))
			throw await this._httpClient.convertError(err);

		// Process the error
		const e = await processError(err);
		// emit event
		this._eventEngine.emitEvent(EVENTTYPE_SESSION.SESSION_ERROR, <
			ISessionErrorEvent
		>{
			sessionId: this._sessionEngineCore.sessionId!,
			error: e,
		});

		if (e instanceof ResponseError) {
			if (e.type === ResErrorType.SESSION_GONE_ERROR) {
				// case 1: the session is no longer available
				// we try to re-initialize the session 3 times, if that does not work, we close it

				this._logger.warn(
					"The session has been closed, trying to re-initialize.",
				);
				if (this._sessionEngineCore.sessionId)
					this._httpClient.removeDataLoading(
						this._sessionEngineCore.sessionId,
					);

				if (this._retryCounter < 3) {
					// we retry this 3 times, the `retry` option in the init function is set to true and passed on
					this._retryCounter = retry ? this._retryCounter + 1 : 1;
					this._sessionEngineCore.initialized = false;
					await this._sessionEngineCore.init(
						this._sessionEngineCore.parameterManager
							.parameterValues,
						true,
					);
				} else {
					// the retries were exceeded, we close the session
					this._logger.warn(
						"Tried to retry the connect multiple times, bearer token still not valid. Closing Session.",
					);
					// eslint-disable-next-line no-empty
					try {
						await this._sessionEngineCore.closeOnFailure();
					} catch (e) {
						/* empty */
					}
					throw await this._httpClient.convertError(e);
				}
			} else if (e.type === ResErrorType.JWT_VALIDATION_ERROR) {
				// if any of the above errors occur, we try to get a new bearer token
				// if we get a new one, we retry 3 times (by requiring new bearer tokens every time)
				if (this._retryCounter < 3) {
					if (this._sessionEngineCore.refreshJwtToken) {
						await this._sessionEngineCore.setJwtToken(
							await this._sessionEngineCore.refreshJwtToken(),
						);
						this._retryCounter = retry ? this._retryCounter + 1 : 1;
						this._logger.warn("Re-trying with new bearer token.");
					} else {
						// no bearer tokens are supplied, we close the session
						this._logger.warn(
							"No retry possible, no new bearer token was supplied. Closing Session.",
						);
						// eslint-disable-next-line no-empty
						try {
							await this._sessionEngineCore.closeOnFailure();
						} catch (e) {
							/* empty */
						}
						throw await this._httpClient.convertError(e);
					}
				} else {
					// the retries were exceeded, we close the session
					this._logger.warn(
						"Tried to retry the connect multiple times, bearer token still not valid. Closing Session.",
					);
					// eslint-disable-next-line no-empty
					try {
						await this._sessionEngineCore.closeOnFailure();
					} catch (e) {
						/* empty */
					}
					throw await this._httpClient.convertError(e);
				}
			} else {
				this._logger.error(
					`\nResponseError:\n\t- type: ${e.type}\n\t- message: ${e.message}\n\t- description: ${e.description}\n\t- status: ${e.status}\n`,
				);
				throw await this._httpClient.convertError(e);
			}
		} else if (e instanceof RequestError) {
			this._logger.error(`\nRequestError:\n\t- message: ${e.message}\n`);
			throw await this._httpClient.convertError(e);
		} else {
			throw await this._httpClient.convertError(e);
		}
	}

	/**
	 * Process the image input and return the image data and array buffer.
	 *
	 * In the case of the image being a Blob or File, the image data is constructed from the Blob or File.
	 * In the case of the image being a string, we check if it is a data URL or a URL.
	 * If it is a data URL, we convert it to a Blob and construct the image data from the Blob.
	 * If it is a URL, we download the image and return the image data and array buffer.
	 *
	 * @param image
	 * @returns
	 */
	public async processImageInput(
		image:
			| (() => string)
			| (() => Promise<string>)
			| string
			| Promise<string>
			| Blob
			| File,
	): Promise<{
		imageData: ReqFileDefinition;
		arrayBuffer: ArrayBuffer;
	}> {
		if (image instanceof File || image instanceof Blob)
			return this._converter.constructImageData(image);

		let imageString: string;

		if (image instanceof Promise) {
			imageString = await image;
		} else if (typeof image === "function") {
			const result = image();
			if (result instanceof Promise) {
				imageString = await result;
			} else {
				imageString = result;
			}
		} else {
			imageString = image;
		}

		if (imageString.startsWith("data:")) {
			// case where the image is a data URL
			const {blob, arrayBuffer} =
				this._converter.dataURLtoBlob(imageString);
			return {
				imageData: {
					format: blob.type,
					size: blob.size,
				},
				arrayBuffer: arrayBuffer as ArrayBuffer,
			};
		} else {
			// case where the image is a URL
			const response = await new UtilsApi(
				this._sessionEngineCore.sdkConfig,
			).downloadImage(this._sessionEngineCore.sessionId!, imageString, {
				responseType: "arraybuffer",
			});

			const arrayBuffer = response.data as unknown as ArrayBuffer;
			return {
				imageData: {
					format: response.headers["content-type"] as string,
					size: arrayBuffer.byteLength,
				},
				arrayBuffer,
			};
		}
	}

	public removeBusyMode(busyId: string) {
		for (const r in this._stateEngine.viewportEngines) {
			if (
				this._stateEngine.viewportEngines[r] &&
				this._stateEngine.viewportEngines[r]!.busy.includes(busyId)
			)
				this._stateEngine.viewportEngines[r]!.busy.splice(
					this._stateEngine.viewportEngines[r]!.busy.indexOf(busyId),
					1,
				);

			if (
				this._sessionEngineCore.customizationManager.customizationBusyModes.includes(
					busyId,
				)
			)
				this._sessionEngineCore.customizationManager.customizationBusyModes.splice(
					this._sessionEngineCore.customizationManager.customizationBusyModes.indexOf(
						busyId,
					),
					1,
				);
		}
	}

	/**
	 * Removes a node from the scene tree and updates the root version.
	 *
	 * @param node The tree node to remove
	 */
	public removeFromSceneTree(node: ITreeNode) {
		this._sceneTree.removeNode(node);
		this._sceneTree.root.updateVersion();
	}

	/**
	 * Returns a promise that resolves after the amount of milliseconds provided.
	 *
	 * @param ms the milliseconds
	 * @returns promise that resolve after specified milliseconds
	 */
	public async timeout(ms: number): Promise<unknown> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	/**
	 * Waits for all update callbacks to finish.
	 *
	 * @param newOutputVersions The new output versions
	 * @param oldOutputVersions The old output versions
	 * @param newNode The new tree node
	 * @param oldNode The old tree node
	 */
	public async waitForUpdateCallbacks(
		newOutputVersions: {[key: string]: string},
		oldOutputVersions: {[key: string]: string},
		newNode: ITreeNode,
		oldNode: ITreeNode,
	) {
		// call the update callback function on the session
		if (this._sessionEngineCore.updateCallback)
			await Promise.resolve(
				this._sessionEngineCore.updateCallback(newNode, oldNode),
			);

		const promises = [];
		// call the update callback functions on the outputs
		for (const outputId in this._sessionEngineCore.outputManager.outputs) {
			if (oldOutputVersions[outputId] !== newOutputVersions[outputId]) {
				promises.push(
					this._sessionEngineCore.outputManager.outputs[
						outputId
					].triggerUpdateCallback(
						newNode.children.find((c) => c.name === outputId)!,
						oldNode.children.find((c) => c.name === outputId)!,
					),
				);
			}
		}
		await Promise.all(promises);
	}

	/**
	 * Creates warnings for outputs and exports with issues.
	 * If `throwError` is true, a ShapeDiverViewerCustomizationError is thrown instead.
	 *
	 * @param outputs The outputs to check for issues
	 * @param exports The exports to check for issues
	 * @param throwError Whether to throw an error instead of creating warnings
	 */
	public warningCreator(
		outputs: {[id: string]: ResOutput} | undefined,
		exports: {[key: string]: ResExport},
		throwError = false,
	) {
		const outputsWithIssues: {[key: string]: ResOutput} = {};
		const exportsWithIssues: {[key: string]: ResExport} = {};

		for (const outputId in outputs) {
			const outputObj = outputs[outputId];
			if (
				(throwError === false && outputObj.msg !== undefined) ||
				(outputObj.status_collect &&
					outputObj.status_collect !==
						ResComputationStatus.SUCCESS) ||
				(outputObj.status_computation &&
					outputObj.status_computation !==
						ResComputationStatus.SUCCESS)
			) {
				outputsWithIssues[outputId] = outputObj;
			}
		}

		for (const exportId in exports) {
			const exportObj = exports[exportId];

			if (
				(throwError === false && exportObj.msg !== undefined) ||
				(exportObj.status_collect &&
					exportObj.status_collect !==
						ResComputationStatus.SUCCESS) ||
				(exportObj.status_computation &&
					exportObj.status_computation !==
						ResComputationStatus.SUCCESS)
			) {
				exportsWithIssues[exportId] = exportObj;
			}
		}

		if (
			Object.keys(outputsWithIssues).length > 0 ||
			Object.keys(exportsWithIssues).length > 0
		) {
			if (throwError) {
				throw new ShapeDiverViewerCustomizationError(
					"There was at least one output or export with issues.",
					{outputs: outputsWithIssues, exports: exportsWithIssues},
				);
			} else {
				// create warning messages for outputs
				for (const outputId in outputsWithIssues) {
					let warning: string = "";
					if (outputsWithIssues[outputId].msg)
						warning += `\n\t- ${outputsWithIssues[outputId].msg}`;
					if (
						outputsWithIssues[outputId].status_collect &&
						outputsWithIssues[outputId].status_collect !==
							ResComputationStatus.SUCCESS
					)
						warning += `\n\t- status_collect is ${outputsWithIssues[outputId].status_collect}`;
					if (
						outputsWithIssues[outputId].status_computation &&
						outputsWithIssues[outputId].status_computation !==
							ResComputationStatus.SUCCESS
					)
						warning += `\n\t- status_computation is ${outputsWithIssues[outputId].status_computation}`;
					if (warning)
						this._logger.warn(`\nOutput(${outputId}):${warning}`);
				}

				// create warning messages for exports
				for (const exportId in exportsWithIssues) {
					let warning: string = "";
					if (exportsWithIssues[exportId].msg)
						warning += `\n\t- ${exportsWithIssues[exportId].msg}`;
					if (
						exportsWithIssues[exportId].status_collect &&
						exportsWithIssues[exportId].status_collect !==
							ResComputationStatus.SUCCESS
					)
						warning += `\n\t- status_collect is ${exportsWithIssues[exportId].status_collect}`;
					if (
						exportsWithIssues[exportId].status_computation &&
						exportsWithIssues[exportId].status_computation !==
							ResComputationStatus.SUCCESS
					)
						warning += `\n\t- status_computation is ${exportsWithIssues[exportId].status_computation}`;
					if (warning)
						this._logger.warn(`\nExport(${exportId}):${warning}`);
				}
			}
		}
	}
}
