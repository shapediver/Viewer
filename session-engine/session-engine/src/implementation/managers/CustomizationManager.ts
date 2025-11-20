import {
	ResBase,
	ResExport,
	ResOutput,
	UtilsApi,
} from "@shapediver/sdk.geometry-api-sdk-v2";
import {ITreeNode} from "@shapediver/viewer.shared.node-tree";
import {
	EventEngine,
	EVENTTYPE,
	HttpClient,
	Logger,
	PerformanceEvaluator,
	StateEngine,
	UuidGenerator,
} from "@shapediver/viewer.shared.services";
import {
	IOutputEvent,
	ITaskEvent,
	ITaskEventDescription,
	TASK_CATEGORY,
	TASK_TYPE,
} from "@shapediver/viewer.shared.types";

import {ISessionTreeNode} from "../../interfaces/ISessionTreeNode";
import {SessionData} from "../SessionData";
import {SessionEngineCore} from "../SessionEngineCore";
import {SessionTreeNode} from "../SessionTreeNode";

/**
 * Manager responsible for for various customization tasks within the session engine.
 *
 * The manager is created by the SessionEngineCore and can be accessed
 * via the `customizationManager` property.
 */
export class CustomizationManager {
	private readonly _eventEngine = EventEngine.instance;
	private readonly _httpClient = HttpClient.instance;
	private readonly _logger = Logger.instance;
	private readonly _performanceEvaluator = PerformanceEvaluator.instance;
	private readonly _sessionEngineCore: SessionEngineCore;
	private readonly _stateEngine = StateEngine.instance;
	private readonly _uuidGenerator = UuidGenerator.instance;

	private _customizationBusyModes: string[] = [];
	private _customizationProcess?: string;
	private _customizeOnParameterChange: boolean = false;
	private _throwOnCustomizationError: boolean = false;

	constructor(sessionEngineCore: SessionEngineCore) {
		this._sessionEngineCore = sessionEngineCore;
	}

	public get customizationBusyModes(): string[] {
		return this._customizationBusyModes;
	}

	public set customizationBusyModes(value: string[]) {
		this._customizationBusyModes = value;
	}

	public get customizationProcess(): string | undefined {
		return this._customizationProcess;
	}

	public set customizationProcess(value: string | undefined) {
		this._customizationProcess = value;
	}

	public get customizeOnParameterChange(): boolean {
		return this._customizeOnParameterChange;
	}

	public set customizeOnParameterChange(value: boolean) {
		this._customizeOnParameterChange = value;
	}

	public get throwOnCustomizationError(): boolean {
		return this._throwOnCustomizationError;
	}

	public set throwOnCustomizationError(value: boolean) {
		this._throwOnCustomizationError = value;
	}

	/**
	 * Cancels the ongoing customization process, if any.
	 *
	 * This method removes the busy mode associated with the current customization process
	 * and clears any customization busy modes.
	 */
	public cancelCustomization() {
		if (this._customizationProcess)
			this._sessionEngineCore.utilsManager.removeBusyMode(
				this._customizationProcess,
			);

		for (const busyId of this._customizationBusyModes) {
			for (const r in this._stateEngine.viewportEngines) {
				if (
					this._stateEngine.viewportEngines[r] &&
					this._stateEngine.viewportEngines[r]!.busy.includes(busyId)
				)
					this._stateEngine.viewportEngines[r]!.busy.splice(
						this._stateEngine.viewportEngines[r]!.busy.indexOf(
							busyId,
						),
						1,
					);
			}
		}

		this._customizationBusyModes = [];
		this._customizationProcess = undefined;
	}

	/**
	 * Customizes the session with updated parameters to get the updated scene graph node.
	 *
	 * @param parameters the parameter set to update the session
	 * @returns promise with a scene graph node
	 */
	public async customize(
		force: boolean = false,
		waitForViewportUpdate: boolean = false,
	): Promise<ITreeNode> {
		const eventInfo: ITaskEvent = {
			type: TASK_TYPE.SESSION_CUSTOMIZATION,
			category: TASK_CATEGORY.SESSION_CUSTOMIZATION.CUSTOMIZE,
			id: this._uuidGenerator.create(),
			data: {sessionId: this._sessionEngineCore.id},
			progress: 0,
		};

		const customizationId = this._uuidGenerator.create();

		try {
			// we check if something changed
			if (force === false) {
				let changes = false;
				for (const parameterId in this._sessionEngineCore
					.parameterManager.parameters)
					if (
						this._sessionEngineCore.parameterManager.parameters[
							parameterId
						].sessionValue !==
						this._sessionEngineCore.parameterManager.parameters[
							parameterId
						].value
					)
						changes = true;
				if (changes === false) return this._sessionEngineCore.node;
			}

			this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_START, {
				...eventInfo,
				progress: 0,
				status: "Customizing session",
			});

			const oldNode = this._sessionEngineCore.node;
			this._customizationProcess = customizationId;

			this._logger.debugLow(
				`Session(${this._sessionEngineCore.id}).customize: Customizing session.`,
			);

			this._sessionEngineCore.utilsManager.addBusyMode(customizationId);

			this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_PROCESS, {
				...eventInfo,
				progress: 0.1,
				status: "Uploading file parameters",
			});

			// upload file parameters
			await this._sessionEngineCore.fileUploadManager.uploadFileParameters();

			// OPTION TO SKIP - PART 1b
			const cancelResult =
				this._sessionEngineCore.utilsManager.cancelProcess(
					{...eventInfo, progress: 1},
					customizationId,
				);
			if (cancelResult) return cancelResult;

			const parameterSet: {
				[key: string]: {
					value: unknown;
					valueString: string;
				};
			} = {};

			// create a set of the current validated parameter values
			for (const parameterId in this._sessionEngineCore.parameterManager
				.parameters) {
				parameterSet[parameterId] = {
					value: this._sessionEngineCore.parameterManager.parameters[
						parameterId
					].value,
					valueString:
						this._sessionEngineCore.parameterManager.parameters[
							parameterId
						].stringify(),
				};
			}

			// update the session engine parameter values if everything succeeded
			for (const parameterId in this._sessionEngineCore.parameterManager
				.parameters)
				this._sessionEngineCore.parameterManager.parameterValues[
					parameterId
				] = parameterSet[parameterId].valueString;
			this._logger.info(
				`Session(${this._sessionEngineCore.id}).customize: Customizing session with parameters ${JSON.stringify(this._sessionEngineCore.parameterManager.parameterValues)}.`,
			);

			this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_PROCESS, {
				...eventInfo,
				progress: 0.1,
				status: "Sending customization request",
			});

			const oldOutputVersions =
				this._sessionEngineCore.outputManager.getCurrentOutputVersions();

			const newNode = await this.customizeSession(
				this._sessionEngineCore.parameterManager.parameterValues,
				() => this._customizationProcess !== customizationId,
				{
					...eventInfo,
					progressRange: {
						min: 0.1,
						max: 0.9,
					},
				},
			);

			// OPTION TO SKIP - PART 2
			const cancelResult2 =
				this._sessionEngineCore.utilsManager.cancelProcess(
					{...eventInfo, progress: 1},
					customizationId,
				);
			if (cancelResult2) return cancelResult2;

			this._sessionEngineCore.utilsManager.warningCreator(
				this._sessionEngineCore.responseDto!.outputs as {
					[key: string]: ResOutput;
				},
				this._sessionEngineCore.responseDto!.exports as {
					[key: string]: ResExport;
				},
				this._throwOnCustomizationError,
			);

			const newOutputVersions =
				this._sessionEngineCore.outputManager.getCurrentOutputVersions();

			this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_PROCESS, {
				...eventInfo,
				progress: 0.9,
				status: "Updating scene",
			});

			// call the update callbacks
			if (waitForViewportUpdate === false) {
				for (const outputId in this._sessionEngineCore.outputManager
					.outputs) {
					if (
						oldOutputVersions[outputId] !==
						newOutputVersions[outputId]
					) {
						this._eventEngine.emitEvent(
							EVENTTYPE.OUTPUT.OUTPUT_UPDATED,
							<IOutputEvent>{
								outputId: outputId,
								outputVersion: newOutputVersions[outputId],
								newNode: newNode.children.find(
									(c) => c.name === outputId,
								)!,
								oldNode: oldNode.children.find(
									(c) => c.name === outputId,
								)!,
							},
						);
					}
				}

				await this._sessionEngineCore.utilsManager.waitForUpdateCallbacks(
					newOutputVersions,
					oldOutputVersions,
					newNode,
					oldNode,
				);

				const cancelResult =
					this._sessionEngineCore.utilsManager.cancelProcess(
						{...eventInfo, progress: 1},
						customizationId,
					);
				if (cancelResult) return cancelResult;
			}

			// if this is not a call by the goBack or goForward functions, add the parameter values to the history and delete the forward history
			if (
				!this._sessionEngineCore.parameterManager.parameterHistoryCall
			) {
				this._sessionEngineCore.parameterManager.parameterHistory.push(
					parameterSet,
				);
				this._sessionEngineCore.parameterManager.parameterHistoryForward =
					[];
			}

			if (this._sessionEngineCore.automaticSceneUpdate)
				this._sessionEngineCore.utilsManager.removeFromSceneTree(
					this._sessionEngineCore.node,
				);
			this._sessionEngineCore.node = newNode;
			if (
				this._sessionEngineCore.automaticSceneUpdate &&
				this._sessionEngineCore.closed === false
			)
				this._sessionEngineCore.utilsManager.addToSceneTree(
					this._sessionEngineCore.node,
				);

			this._logger.debug(
				`Session(${this._sessionEngineCore.id}).customize: Customization request finished, updating geometry.`,
			);

			// set the session values to the current ones in all parameters
			for (const parameterId in this._sessionEngineCore.parameterManager
				.parameters)
				(<unknown>(
					this._sessionEngineCore.parameterManager.parameters[
						parameterId
					].sessionValue
				)) = parameterSet[parameterId].value;

			// set the output content to what has been updated
			for (const outputId in this._sessionEngineCore.outputManager
				.outputs)
				this._sessionEngineCore.outputManager.outputs[
					outputId
				].updateOutput(
					newNode.children.find((c) => c.name === outputId)!,
					oldNode.children.find((c) => c.name === outputId)!,
				);

			// set the export definitions
			for (const exportId in this._sessionEngineCore.exportManager
				.exports)
				this._sessionEngineCore.exportManager.exports[
					exportId
				].updateExport();

			this._sessionEngineCore.node.excludeViewports = JSON.parse(
				JSON.stringify(this._sessionEngineCore.excludeViewports),
			);

			this._sessionEngineCore.utilsManager.removeBusyMode(
				customizationId,
			);

			this._logger.debug(
				`Session(${this._sessionEngineCore.id}).customize: Session customized.`,
			);

			this._eventEngine.emitEvent(EVENTTYPE.SESSION.SESSION_CUSTOMIZED, {
				sessionId: this._sessionEngineCore.id,
			});

			this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_END, {
				...eventInfo,
				progress: 1,
				status: "Session customized",
			});

			// update the viewports
			if (waitForViewportUpdate) {
				for (const r in this._stateEngine.viewportEngines)
					if (
						this._stateEngine.viewportEngines[r] &&
						!this._sessionEngineCore.excludeViewports.includes(
							this._stateEngine.viewportEngines[r]!.id,
						)
					)
						this._stateEngine.viewportEngines[r]!.update(
							`SessionEngine(${this._sessionEngineCore.id}).customize`,
						);

				for (const outputId in this._sessionEngineCore.outputManager
					.outputs) {
					if (
						oldOutputVersions[outputId] !==
						newOutputVersions[outputId]
					) {
						this._eventEngine.emitEvent(
							EVENTTYPE.OUTPUT.OUTPUT_UPDATED,
							<IOutputEvent>{
								outputId: outputId,
								outputVersion: newOutputVersions[outputId],
								newNode: newNode.children.find(
									(c) => c.name === outputId,
								)!,
								oldNode: oldNode.children.find(
									(c) => c.name === outputId,
								)!,
							},
						);
					}
				}

				// call the update callbacks
				await this._sessionEngineCore.utilsManager.waitForUpdateCallbacks(
					newOutputVersions,
					oldOutputVersions,
					newNode,
					oldNode,
				);

				const cancelResult =
					this._sessionEngineCore.utilsManager.cancelProcess(
						{...eventInfo, progress: 1},
						customizationId,
					);
				if (cancelResult) return cancelResult;
			}

			if (!waitForViewportUpdate) {
				setTimeout(() => {
					for (const r in this._stateEngine.viewportEngines)
						if (
							this._stateEngine.viewportEngines[r] &&
							!this._sessionEngineCore.excludeViewports.includes(
								this._stateEngine.viewportEngines[r]!.id,
							)
						)
							this._stateEngine.viewportEngines[r]!.update(
								`SessionEngine(${this._sessionEngineCore.id}).customize`,
							);
				}, 0);
			}

			return this._sessionEngineCore.node;
		} catch (e) {
			this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_CANCEL, {
				...eventInfo,
				progress: 1,
				status: "Session customization failed",
			});

			this._sessionEngineCore.utilsManager.removeBusyMode(
				customizationId,
			);

			throw this._httpClient.convertError(e);
		}
	}

	/**
	 * Customizes the session in parallel with updated parameters to get the updated scene graph node.
	 *
	 * @param parameterValues the parameter set to update the session
	 * @returns promise with a scene graph node
	 */
	public async customizeParallel(
		parameterValues: {[key: string]: unknown},
		loadOutputs = true,
	): Promise<ISessionTreeNode | ResBase> {
		const eventInfo = {
			type: TASK_TYPE.SESSION_CUSTOMIZATION,
			category: TASK_CATEGORY.SESSION_CUSTOMIZATION.CUSTOMIZE_PARALLEL,
			id: this._uuidGenerator.create(),
			data: {sessionId: this._sessionEngineCore.id},
		};

		this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_START, {
			...eventInfo,
			progress: 0,
			status: "Customizing session",
		});

		// upload file parameters
		await this._sessionEngineCore.fileUploadManager.uploadFileParameters(
			parameterValues,
		);

		const parameterSet: {
			[key: string]: string;
		} = {};

		// create a set of the current validated parameter values
		for (const parameterId in this._sessionEngineCore.parameterManager
			.parameters)
			parameterSet[parameterId] = (
				" " +
				this._sessionEngineCore.parameterManager.parameters[
					parameterId
				].stringify(parameterValues[parameterId])
			).slice(1);

		const result = await this.customizeSession(
			parameterSet,
			() => false,
			{
				...eventInfo,
				progressRange: {
					min: 0.0,
					max: 1,
				},
			},
			true,
			loadOutputs,
		);

		if (result instanceof SessionTreeNode) {
			result.excludeViewports = JSON.parse(
				JSON.stringify(this._sessionEngineCore.excludeViewports),
			);

			// mark all session data as instance data if they are part of a parallel customization
			result.traverseData((data) => {
				if (data instanceof SessionData) data.instance = true;
			});
		}

		this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_END, {
			...eventInfo,
			progress: 1,
			status: "Session customized",
		});
		return result;
	}

	/**
	 * Customizes the session.
	 * Called by customize and customizeParallel.
	 *
	 * @param cancelRequest function to check if the customization should be cancelled
	 * @returns promise with a scene graph node
	 */
	public async customizeSession(
		parameters: {[key: string]: string},
		cancelRequest: () => boolean,
		taskEventInfo: ITaskEventDescription,
		parallel = false,
		loadOutputs = true,
		retry = false,
	): Promise<ISessionTreeNode> {
		this._sessionEngineCore.utilsManager.checkAvailability("customize");
		try {
			this._performanceEvaluator.startSection("sessionResponse");
			const responseDto = await new UtilsApi(
				this._sessionEngineCore.sdkConfig,
			).submitAndWaitForOutput(
				this._sessionEngineCore.sessionId!,
				parameters,
				undefined,
				this._sessionEngineCore.parameterManager.ignoreUnknownParams,
			);
			this._performanceEvaluator.endSection("sessionResponse");
			if (
				loadOutputs === true &&
				this._sessionEngineCore.outputManager.allowOutputLoading ===
					true
			) {
				if (cancelRequest()) return new SessionTreeNode();
				if (parallel === true) {
					// special case, we load the outputs put don't add them to the scene
					return this._sessionEngineCore.outputManager.loadOutputsParallel(
						responseDto,
						cancelRequest,
						taskEventInfo,
					);
				} else {
					// default case, we load the outputs and return the nodes
					this._sessionEngineCore.updateResponseDto(responseDto);
					return this._sessionEngineCore.outputManager.loadOutputs(
						cancelRequest,
						taskEventInfo,
					);
				}
			} else {
				// special case, we don't load the outputs and only return the responseDto
				const node = new SessionTreeNode();
				node.data.push(new SessionData(responseDto));
				return node;
			}
		} catch (e) {
			await this._sessionEngineCore.utilsManager.handleError(e, retry);
			if (cancelRequest()) return new SessionTreeNode();
			return await this.customizeSession(
				parameters,
				cancelRequest,
				taskEventInfo,
				parallel,
				loadOutputs,
				true,
			);
		}
	}
}
