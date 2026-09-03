import {
	OutputApi,
	ResBase,
	ResExport,
	ResGetCachedOutputs,
	ResOutput,
} from "@shapediver/sdk.geometry-api-sdk-v2";
import {type ITreeNode} from "@shapediver/viewer.shared.node-tree";
import {
	EventEngine,
	EVENTTYPE,
	Logger,
	StateEngine,
	UuidGenerator,
} from "@shapediver/viewer.shared.services";
import {
	type ITaskEvent,
	type ITaskEventDescription,
	TASK_TYPE,
} from "@shapediver/viewer.shared.types";

import {type IOutput} from "../../interfaces/dto/IOutput";
import {type ISessionTreeNode} from "../../interfaces/ISessionTreeNode";
import {Output} from "../dto/Output";
import {OutputDelayException} from "../OutputDelayException";
import {OutputLoader} from "../OutputLoader";
import {SessionData} from "../SessionData";
import {SessionEngineCore} from "../SessionEngineCore";
import {SessionTreeNode} from "../SessionTreeNode";

/**
 * Manager responsible for outputs.
 *
 * The manager is created by the SessionEngineCore and can be accessed
 * via the `outputManager` property.
 */
export class OutputManager {
	private readonly _eventEngine = EventEngine.instance;
	private readonly _logger: Logger = Logger.instance;
	private readonly _outputLoader: OutputLoader;
	private readonly _outputs: {[key: string]: IOutput} = {};
	private readonly _outputsFreeze: {[key: string]: boolean} = {};
	private readonly _sessionEngineCore: SessionEngineCore;
	private readonly _stateEngine: StateEngine = StateEngine.instance;
	private readonly _uuidGenerator = UuidGenerator.instance;

	private _allowOutputLoading: boolean = true;

	constructor(sessionEngineCore: SessionEngineCore) {
		this._outputLoader = new OutputLoader(this);
		this._sessionEngineCore = sessionEngineCore;
	}

	public init(): void {
		// Initialization logic here
	}

	public get allowOutputLoading(): boolean {
		return this._allowOutputLoading;
	}

	public set allowOutputLoading(value: boolean) {
		this._allowOutputLoading = value;
	}

	public get jwtToken(): string | undefined {
		return this._sessionEngineCore.jwtToken;
	}

	public get loadSdtf(): boolean {
		return this._sessionEngineCore.loadSdtf;
	}

	public get sessionId(): string | undefined {
		return this._sessionEngineCore.sessionId;
	}

	public get outputs(): {[key: string]: IOutput} {
		return this._outputs;
	}

	public get outputsFreeze(): {[key: string]: boolean} {
		return this._outputsFreeze;
	}

	public get reloadSdtf(): boolean {
		return this._outputLoader.reloadSdtf;
	}

	public set reloadSdtf(value: boolean) {
		this._outputLoader.reloadSdtf = value;
	}

	/**
	 * Create outputs from the response DTO.
	 */
	public createOutputsFromDto(): void {
		if (!this._sessionEngineCore.responseDto) return;

		for (const outputId in this._sessionEngineCore.responseDto.outputs) {
			if (!this.outputs[outputId]) {
				this._sessionEngineCore.responseDto.outputs[outputId].id =
					outputId;
				if (this.outputsFreeze[outputId] === undefined)
					this.outputsFreeze[outputId] = false;
				this.outputs[outputId] = new Output(
					this._sessionEngineCore.responseDto.outputs[
						outputId
					] as ResOutput,
					this._sessionEngineCore,
					this,
				);
			} else {
				this.outputs[outputId].updateOutputDefinition(
					<ResOutput>(
						this._sessionEngineCore.responseDto.outputs[outputId]
					),
				);
			}
		}
	}

	public getCurrentOutputVersions(): {[key: string]: string} {
		return this._outputLoader.getCurrentOutputVersions();
	}

	/**
	 * Load cached outputs in parallel.
	 *
	 * @param outputMapping mapping of output ids to their versions
	 * @param taskEventInfo optional task event info
	 * @param retry whether to retry the request in case of failure
	 * @returns promise with a mapping of output ids to their scene graph nodes
	 */
	public async loadCachedOutputsParallel(
		outputMapping: {[key: string]: string},
		taskEventInfo?: ITaskEventDescription,
		retry = false,
	): Promise<{[key: string]: ITreeNode | undefined}> {
		this._sessionEngineCore.utilsManager.checkAvailability();

		// if there is already task event info, use it
		// this happens after a retry
		const eventInfo = {
			type: taskEventInfo
				? taskEventInfo.type
				: TASK_TYPE.SESSION_OUTPUTS_LOADING,
			category: taskEventInfo ? taskEventInfo.category : undefined,
			id: taskEventInfo ? taskEventInfo.id : this._uuidGenerator.create(),
			data: taskEventInfo
				? taskEventInfo.data
				: {sessionId: this._sessionEngineCore.id},
			progressRange: {
				min: 0,
				max: 1,
			},
		};

		try {
			// send start event if this function was called initially
			if (!taskEventInfo) {
				this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_START, {
					...eventInfo,
					progress: 0,
					status: "Loading cached outputs",
				});
			}

			// get the cached outputs
			const responseDto: ResGetCachedOutputs = await new OutputApi(
				this._sessionEngineCore.sdkConfig,
			).getCachedOutputs(
				this._sessionEngineCore.sessionId!,
				outputMapping,
			);

			// create atomic output api objects for them
			const outputs: {
				[key: string]: IOutput;
			} = {};
			for (const outputId in responseDto.outputs) {
				responseDto.outputs[outputId].id = outputId;
				outputs[outputId] = new Output(
					<ResOutput>responseDto.outputs[outputId],
					this._sessionEngineCore,
					this,
				);
			}

			// process the output data
			const node = await this._outputLoader.loadOutputs(
				this._sessionEngineCore.responseDto!.model?.name || "model",
				outputs,
				{},
				eventInfo,
				false,
			);

			// send the end event once done
			this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_END, {
				...eventInfo,
				progress: 1,
				status: "Loaded cached outputs",
			});

			// create a mapping with a dictionary for the id of the outputs
			const outputNodeMapping: {[key: string]: ITreeNode | undefined} =
				{};
			for (const outputId in outputMapping)
				outputNodeMapping[outputId] = node.children.find(
					(n) => n.name === outputId,
				);

			return outputNodeMapping;
		} catch (e) {
			await this._sessionEngineCore.utilsManager.handleError(e, retry);
			return await this.loadCachedOutputsParallel(
				outputMapping,
				eventInfo,
				true,
			);
		}
	}

	/**
	 * Load the outputs and return the scene graph node of the result.
	 * In case the outputs have a delay property, another customization request with the parameter set is sent.
	 *
	 * @param parameters the parameter set to update the session
	 * @param outputs the outputs to load
	 * @returns promise with a scene graph node
	 */
	public async loadOutputs(
		cancelRequest: () => boolean = () => false,
		taskEventInfo: ITaskEventDescription,
		retry = false,
	): Promise<ISessionTreeNode> {
		this._sessionEngineCore.utilsManager.checkAvailability();

		const o = Object.assign({}, this.outputs);
		const of = Object.assign({}, this.outputsFreeze);
		try {
			const node = await this._outputLoader.loadOutputs(
				this._sessionEngineCore.responseDto!.model?.name || "model",
				o,
				of,
				taskEventInfo,
			);
			node.data.push(
				new SessionData(this._sessionEngineCore.responseDto!),
			);
			if (cancelRequest()) return node;
			node.excludeViewports = JSON.parse(
				JSON.stringify(this._sessionEngineCore.excludeViewports),
			);
			return node;
		} catch (e) {
			if (e instanceof OutputDelayException) {
				await this._sessionEngineCore.utilsManager.timeout(e.delay);
			} else {
				await this._sessionEngineCore.utilsManager.handleError(
					e,
					retry,
				);
				if (cancelRequest()) return new SessionTreeNode();
				return await this.loadOutputs(
					cancelRequest,
					taskEventInfo,
					true,
				);
			}

			if (cancelRequest()) return new SessionTreeNode();
			const outputMapping: {[key: string]: string} = {};
			for (const output in o) outputMapping[output] = o[output].version;

			try {
				const responseDto = await new OutputApi(
					this._sessionEngineCore.sdkConfig,
				).getCachedOutputs(
					this._sessionEngineCore.sessionId!,
					outputMapping,
				);
				if (cancelRequest()) return new SessionTreeNode();
				this._sessionEngineCore.updateResponseDto(responseDto);
				return await this.loadOutputs(cancelRequest, taskEventInfo);
			} catch (e) {
				await this._sessionEngineCore.utilsManager.handleError(
					e,
					retry,
				);
				if (cancelRequest()) return new SessionTreeNode();
				return await this.loadOutputs(
					cancelRequest,
					taskEventInfo,
					true,
				);
			}
		}
	}

	/**
	 * Load the outputs and return the scene graph node of the result.
	 * In case the outputs have a delay property, another customization request with the parameter set is sent.
	 *
	 * @param parameters the parameter set to update the session
	 * @param outputs the outputs to load
	 * @returns promise with a scene graph node
	 */
	public async loadOutputsParallel(
		responseDto: ResBase,
		cancelRequest: () => boolean = () => false,
		taskEventInfo: ITaskEventDescription,
		retry = false,
	): Promise<ISessionTreeNode> {
		this._sessionEngineCore.utilsManager.checkAvailability();

		const outputs: {
			[key: string]: IOutput;
		} = {};
		const outputsFreeze: {
			[key: string]: boolean;
		} = {};

		for (const outputId in responseDto.outputs) {
			responseDto.outputs[outputId].id = outputId;
			if (this.outputsFreeze[outputId] === undefined)
				outputsFreeze[outputId] = false;
			outputs[outputId] = new Output(
				<ResOutput>responseDto.outputs[outputId],
				this._sessionEngineCore,
				this,
			);
		}

		try {
			const node = await this._outputLoader.loadOutputs(
				this._sessionEngineCore.responseDto!.model?.name || "model",
				outputs,
				outputsFreeze,
				taskEventInfo,
				true,
				true,
			);
			node.data.push(new SessionData(responseDto));
			return node;
		} catch (e) {
			if (e instanceof OutputDelayException) {
				await this._sessionEngineCore.utilsManager.timeout(e.delay);
			} else {
				await this._sessionEngineCore.utilsManager.handleError(
					e,
					retry,
				);
				if (cancelRequest()) return new SessionTreeNode();
				return await this.loadOutputsParallel(
					responseDto,
					cancelRequest,
					taskEventInfo,
					true,
				);
			}

			if (cancelRequest()) return new SessionTreeNode();
			const outputMapping: {[key: string]: string} = {};
			for (const output in outputs)
				outputMapping[output] = outputs[output].version;

			try {
				const responseDto = await new OutputApi(
					this._sessionEngineCore.sdkConfig,
				).getCachedOutputs(
					this._sessionEngineCore.sessionId!,
					outputMapping,
				);
				if (cancelRequest()) return new SessionTreeNode();
				this._sessionEngineCore.updateResponseDto(responseDto);
				return await this.loadOutputsParallel(
					responseDto,
					cancelRequest,
					taskEventInfo,
				);
			} catch (e) {
				await this._sessionEngineCore.utilsManager.handleError(
					e,
					retry,
				);
				if (cancelRequest()) return new SessionTreeNode();
				return await this.loadOutputsParallel(
					responseDto,
					cancelRequest,
					taskEventInfo,
					true,
				);
			}
		}
	}

	/**
	 * Save the output properties for displayname, order, tooltip and hidden
	 *
	 * @param outputs
	 * @returns
	 */
	public async saveOutputProperties(
		outputs: {
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
			"output-definition",
			true,
		);
		try {
			await new OutputApi(
				this._sessionEngineCore.sdkConfig,
			).updateOutputDefinitions(
				this._sessionEngineCore.modelId!,
				outputs,
			);
			return true;
		} catch (e) {
			await this._sessionEngineCore.utilsManager.handleError(e, retry);
			return await this.saveOutputProperties(outputs, true);
		}
	}

	/**
	 * Update the outputs and return the scene graph node of the result.
	 * In case the outputs have a delay property, another customization request with the parameter set is sent.
	 *
	 * @param taskEventInfo optional task event info
	 * @param waitForViewportUpdate whether to wait for the viewport update callbacks before returning
	 * @returns promise with a scene graph node
	 */
	public async updateOutputs(
		taskEventInfo?: ITaskEventDescription,
		waitForViewportUpdate: boolean = false,
	): Promise<ITreeNode> {
		const eventInfo: ITaskEvent = {
			type: taskEventInfo
				? taskEventInfo.type
				: TASK_TYPE.SESSION_OUTPUTS_UPDATE,
			category: taskEventInfo ? taskEventInfo.category : undefined,
			id: taskEventInfo ? taskEventInfo.id : this._uuidGenerator.create(),
			data: taskEventInfo
				? taskEventInfo.data
				: {sessionId: this._sessionEngineCore.id},
			progress: 0,
		};

		const customizationId = this._uuidGenerator.create();

		if (!taskEventInfo) {
			this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_START, {
				...eventInfo,
				progress: 0,
				status: "Updating outputs",
			});
		}

		const oldNode = this._sessionEngineCore.node;
		this._sessionEngineCore.customizationManager.customizationProcess =
			customizationId;

		this._logger.debugLow(
			`Session(${this._sessionEngineCore.id}).updateOutputs: Updating Outputs.`,
		);

		this._sessionEngineCore.utilsManager.addBusyMode(customizationId);

		this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_PROCESS, {
			...eventInfo,
			progress: taskEventInfo
				? (taskEventInfo.progressRange.max -
						taskEventInfo.progressRange.min) *
						0.1 +
					taskEventInfo.progressRange.min
				: 0.1,
			status: "Loading outputs",
		});

		const oldOutputVersions = this._outputLoader.getCurrentOutputVersions();

		const newNode = await this.loadOutputs(
			() =>
				this._sessionEngineCore.customizationManager
					.customizationProcess !== customizationId,
			{
				...eventInfo,
				progressRange: {
					min: taskEventInfo
						? (taskEventInfo.progressRange.max -
								taskEventInfo.progressRange.min) *
								0.1 +
							taskEventInfo.progressRange.min
						: 0.1,
					max: taskEventInfo
						? (taskEventInfo.progressRange.max -
								taskEventInfo.progressRange.min) *
								0.9 +
							taskEventInfo.progressRange.min
						: 0.9,
				},
			},
		);

		this._sessionEngineCore.utilsManager.warningCreator(
			this._sessionEngineCore.responseDto!.outputs as {
				[key: string]: ResOutput;
			},
			this._sessionEngineCore.responseDto!.exports as {
				[key: string]: ResExport;
			},
			this._sessionEngineCore.customizationManager
				.throwOnCustomizationError,
		);

		const newOutputVersions = this._outputLoader.getCurrentOutputVersions();

		this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_PROCESS, {
			...eventInfo,
			progress: taskEventInfo
				? (taskEventInfo.progressRange.max -
						taskEventInfo.progressRange.min) *
						0.9 +
					taskEventInfo.progressRange.min
				: 0.9,
			status: "Updating scene",
		});

		// OPTION TO SKIP - PART 1
		const cancelResult = this._sessionEngineCore.utilsManager.cancelProcess(
			{
				...eventInfo,
				progress: taskEventInfo
					? (taskEventInfo.progressRange.max -
							taskEventInfo.progressRange.min) *
							1 +
						taskEventInfo.progressRange.min
					: 1,
			},
			customizationId,
			newNode,
		);
		if (cancelResult) return cancelResult;

		// call the update callbacks
		if (waitForViewportUpdate === false) {
			for (const outputId in this.outputs) {
				if (
					oldOutputVersions[outputId] !== newOutputVersions[outputId]
				) {
					this._eventEngine.emitEvent(
						EVENTTYPE.OUTPUT.OUTPUT_UPDATED,
						{
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

			// OPTION TO SKIP - PART 2
			const cancelResult =
				this._sessionEngineCore.utilsManager.cancelProcess(
					{
						...eventInfo,
						progress: taskEventInfo
							? (taskEventInfo.progressRange.max -
									taskEventInfo.progressRange.min) *
									1 +
								taskEventInfo.progressRange.min
							: 1,
					},
					customizationId,
					newNode,
				);
			if (cancelResult) return cancelResult;
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
			`Session(${this._sessionEngineCore.id}).updateOutputs: Updating outputs finished, updating geometry.`,
		);

		// set the output content to what has been updated
		for (const outputId in this.outputs) {
			this.outputs[outputId].updateOutput(
				newNode.children.find((c) => c.name === outputId)!,
				oldNode.children.find((c) => c.name === outputId)!,
			);
		}

		// set the export definitions
		for (const exportId in this._sessionEngineCore.exportManager.exports)
			this._sessionEngineCore.exportManager.exports[
				exportId
			].updateExport();
		this._sessionEngineCore.node.excludeViewports = JSON.parse(
			JSON.stringify(this._sessionEngineCore.excludeViewports),
		);

		this._sessionEngineCore.utilsManager.removeBusyMode(customizationId);

		this._logger.debug(
			`Session(${this._sessionEngineCore.id}).updateOutputs: Updated outputs.`,
		);

		if (!taskEventInfo) {
			this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_END, {
				...eventInfo,
				progress: 1,
				status: "Outputs updated",
			});
		}

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
						`SessionEngine(${this._sessionEngineCore.id}).updateOutputs`,
					);

			for (const outputId in this.outputs) {
				if (
					oldOutputVersions[outputId] !== newOutputVersions[outputId]
				) {
					this._eventEngine.emitEvent(
						EVENTTYPE.OUTPUT.OUTPUT_UPDATED,
						{
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

			// OPTION TO SKIP - PART 3
			const cancelResult =
				this._sessionEngineCore.utilsManager.cancelProcess(
					{
						...eventInfo,
						progress: taskEventInfo
							? (taskEventInfo.progressRange.max -
									taskEventInfo.progressRange.min) *
									1 +
								taskEventInfo.progressRange.min
							: 1,
					},
					customizationId,
					newNode,
				);
			if (cancelResult) return cancelResult;
		}

		return this._sessionEngineCore.node;
	}
}
