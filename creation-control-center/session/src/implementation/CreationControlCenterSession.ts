import {ShapeDiverResponseDto} from "@shapediver/sdk.geometry-api-sdk-v2";
import {SessionEngine} from "@shapediver/viewer.session-engine.session-engine";
import {ISettings, latestVersion} from "@shapediver/viewer.settings";
import {build_data} from "@shapediver/viewer.shared.build-data";
import {
	EventEngine,
	EVENTTYPE,
	isViewerError,
	Logger,
	SESSION_SETTINGS_MODE,
	ShapeDiverViewerSessionError,
	StateEngine,
	StatePromise,
	UuidGenerator,
} from "@shapediver/viewer.shared.services";
import {
	ISettingsSections,
	ITaskEvent,
	SessionCreationDefinition,
	TASK_TYPE,
} from "@shapediver/viewer.shared.types";
import {ICreationControlCenterSession} from "../interfaces/ICreationControlCenterSession";
import {SessionGlobalAccessObject} from "./SessionGlobalAccessObject";

export class CreationControlCenterSession
	implements ICreationControlCenterSession
{
	// #region Properties (8)

	readonly #eventEngine: EventEngine = EventEngine.instance;
	readonly #logger: Logger = Logger.instance;
	readonly #stateEngine: StateEngine = StateEngine.instance;
	readonly #uuidGenerator: UuidGenerator = UuidGenerator.instance;

	private static _instance: CreationControlCenterSession;

	#firstSessionEngine?: SessionEngine;

	public readonly sessionEngines: {[key: string]: SessionEngine} = {};

	public updateSessions?: (sessionEngines: {
		[key: string]: SessionEngine;
	}) => void;

	// #endregion Properties (8)

	// #region Public Static Getters And Setters (1)

	public static get instance() {
		return this._instance || (this._instance = new this());
	}

	// #endregion Public Static Getters And Setters (1)

	// #region Public Methods (5)

	public applySettings(
		sessionId: string,
		response: ShapeDiverResponseDto,
		sections?: ISettingsSections,
	): Promise<void> {
		sections = sections || {};
		this.sessionEngines[sessionId].applySettings(response, sections);

		const promises: Promise<unknown>[] = [];

		if (
			sections.session &&
			sections.session.parameter &&
			sections.session.parameter.value
		)
			promises.push(this.sessionEngines[sessionId].customize());

		for (const r in this.#stateEngine.viewportEngines) {
			const viewportEngineState = this.#stateEngine.viewportEngines[r];
			if (
				(viewportEngineState &&
					viewportEngineState.sessionSettingsMode ===
						SESSION_SETTINGS_MODE.FIRST &&
					this.#firstSessionEngine &&
					sessionId === this.#firstSessionEngine.id) ||
				(viewportEngineState &&
					viewportEngineState.sessionSettingsMode ===
						SESSION_SETTINGS_MODE.MANUAL &&
					sessionId === viewportEngineState.sessionSettingsId)
			) {
				viewportEngineState.settingsAssigned.reset();
				promises.push(
					new Promise<void>((resolve) => {
						this.#stateEngine.viewportEngines[
							r
						]?.settingsAssigned.then(() => {
							resolve();
						});
					}),
				);

				viewportEngineState.applySettings(sections.viewport);
			}
		}
		return new Promise((resolve) =>
			Promise.all(promises).then(() => resolve()),
		);
	}

	public async closeSessionEngine(id: string): Promise<void> {
		if (!this.sessionEngines[id]) return;

		this.#logger.debugLow(
			`CreationControlCenter.closeSession: Closing session ${id}.`,
		);

		if (
			this.#stateEngine.sessionEngines[id]?.initialized.resolved === false
		)
			await new Promise<void>((resolve) => {
				this.#stateEngine.sessionEngines[id]?.initialized.then(() =>
					resolve(),
				);
			});

		await this.sessionEngines[id].close();

		// remove from rendering engines (also directly assigned)
		for (const r in this.#stateEngine.viewportEngines) {
			const viewportEngineState = this.#stateEngine.viewportEngines[r];
			if (
				(viewportEngineState &&
					viewportEngineState.sessionSettingsMode ===
						SESSION_SETTINGS_MODE.MANUAL &&
					viewportEngineState.sessionSettingsId === id) ||
				(viewportEngineState &&
					viewportEngineState.sessionSettingsMode ===
						SESSION_SETTINGS_MODE.FIRST &&
					this.#firstSessionEngine === this.sessionEngines[id])
			) {
				viewportEngineState.reset();
			}
		}

		if (this.#firstSessionEngine === this.sessionEngines[id]) {
			const engines = Object.values(this.sessionEngines).filter(
				(s) => s.id !== id,
			);
			this.#firstSessionEngine =
				engines.length === 0 ? undefined : engines[0];
			if (this.#firstSessionEngine) {
				if (
					!this.#stateEngine.sessionEngines[
						this.#firstSessionEngine.id
					]
				)
					return;
				Object.values(this.#stateEngine.sessionEngines).forEach((s) => {
					if (s) s.isFirstSession = false;
				});
				this.#stateEngine.sessionEngines[
					this.#firstSessionEngine.id
				]!.isFirstSession = true;

				const promises: StatePromise<boolean>[] = [];

				for (const r in this.#stateEngine.viewportEngines) {
					const viewportEngineState =
						this.#stateEngine.viewportEngines[r];
					if (
						this.#stateEngine.viewportEngines[r]?.settingsAssigned
							.resolved === false
					) {
						if (
							viewportEngineState &&
							viewportEngineState.sessionSettingsMode ===
								SESSION_SETTINGS_MODE.FIRST
						) {
							promises.push(viewportEngineState.settingsAssigned);
							this.assignSettings(
								viewportEngineState.id,
								this.#firstSessionEngine?.id,
							);
						}
					}
				}

				await Promise.all(promises);

				if (this.updateSessions)
					this.updateSessions(this.sessionEngines);
			}
		}

		this.#stateEngine.sessionEngines[id]?.settingsRegistered.reset();

		(<unknown>this.sessionEngines[id]) = undefined;
		delete this.sessionEngines[id];
		delete this.#stateEngine.sessionEngines[id];

		this.#logger.debug(
			"CreationControlCenter.closeSessionEngine: Session closed.",
		);
		for (const r in this.#stateEngine.viewportEngines)
			this.#stateEngine.viewportEngines[r]?.update(
				"CreationControlCenter.closeSessionEngine",
			);
		if (this.updateSessions) this.updateSessions(this.sessionEngines);
		this.#eventEngine.emitEvent(EVENTTYPE.SESSION.SESSION_CLOSED, {
			sessionId: id,
		});
	}

	public async createSessionEngine(
		properties: SessionCreationDefinition,
	): Promise<SessionEngine> {
		const eventId = this.#uuidGenerator.create();
		const sessionEngineId = properties.id || this.#uuidGenerator.create();
		properties.id = sessionEngineId;
		properties.loadOutputs =
			properties.allowOutputLoading === false
				? false
				: properties.loadOutputs;

		try {
			const eventStart: ITaskEvent = {
				type: TASK_TYPE.SESSION_CREATION,
				id: eventId,
				progress: 0,
				status: "Creating session",
				data: {sessionId: sessionEngineId},
			};
			this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_START, eventStart);

			// check if the given id is valid
			if (this.sessionEngines[sessionEngineId]) {
				const eventClose: ITaskEvent = {
					type: TASK_TYPE.SESSION_CREATION,
					id: eventId,
					progress: 0.1,
					status: "Closing session with same id",
					data: {sessionId: sessionEngineId},
				};
				this.#eventEngine.emitEvent(
					EVENTTYPE.TASK.TASK_PROCESS,
					eventClose,
				);

				this.#logger.warn(
					`CreationControlCenter.createSession: Session with this id (${sessionEngineId}) already exists. Closing initial instance.`,
				);
				await this.closeSessionEngine(sessionEngineId);
			}

			// create the actual session
			const sessionEngine = new SessionEngine({
				id: sessionEngineId,
				guid: properties.guid,
				ticket: properties.ticket,
				modelViewUrl: properties.modelViewUrl,
				excludeViewports: properties.excludeViewports,
				buildVersion: build_data.build_version,
				buildDate: build_data.build_date,
				jwtToken: properties.jwtToken,
				allowOutputLoading:
					properties.allowOutputLoading === undefined
						? true
						: properties.allowOutputLoading,
				loadSdtf:
					properties.loadSdtf === undefined
						? false
						: properties.loadSdtf,
				modelStateId: properties.modelStateId,
				throwOnCustomizationError: properties.throwOnCustomizationError,
			});

			this.#stateEngine.sessionEngines[sessionEngineId] =
				new SessionGlobalAccessObject(sessionEngine);

			const eventInit: ITaskEvent = {
				type: TASK_TYPE.SESSION_CREATION,
				id: eventId,
				progress: 0.25,
				status: "Initializing session.",
				data: {sessionId: sessionEngineId},
			};
			this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_PROCESS, eventInit);

			await sessionEngine.init(properties.initialParameterValues);

			if (properties.loadOutputs !== false) {
				if (properties.waitForOutputs !== false) {
					await sessionEngine.updateOutputs({
						eventId,
						type: TASK_TYPE.SESSION_CREATION,
						progressRange: {
							min: 0.25,
							max: 0.9,
						},
						data: {sessionId: sessionEngineId},
					});
					this.#stateEngine.sessionEngines[
						sessionEngineId
					]?.initialOutputsLoaded.resolve(true);
					this.#eventEngine.emitEvent(
						EVENTTYPE.SESSION.SESSION_INITIAL_OUTPUTS_LOADED,
						{sessionId: sessionEngineId},
					);
				} else {
					sessionEngine
						.updateOutputs({
							eventId,
							type: TASK_TYPE.SESSION_CREATION,
							progressRange: {
								min: 0.25,
								max: 0.9,
							},
							data: {sessionId: sessionEngineId},
						})
						.then(() => {
							this.#stateEngine.sessionEngines[
								sessionEngineId
							]?.initialOutputsLoaded.resolve(true);
							this.#eventEngine.emitEvent(
								EVENTTYPE.SESSION
									.SESSION_INITIAL_OUTPUTS_LOADED,
								{sessionId: sessionEngineId},
							);

							for (const r in this.#stateEngine.viewportEngines)
								this.#stateEngine.viewportEngines[r]?.update(
									"CreationControlCenter.createSessionEngine.waitForOutputs=false",
								);
						});
				}
			}

			// save the session
			this.sessionEngines[sessionEngineId] = sessionEngine;

			this.#stateEngine.sessionEngines[
				sessionEngineId
			]?.initialized.resolve(true);
			this.#logger.debug(
				`CreationControlCenter.createSession: Session(${sessionEngine.id}) created.`,
			);

			if (!this.#firstSessionEngine) {
				if (this.#stateEngine.sessionEngines[sessionEngine.id]) {
					this.#firstSessionEngine = sessionEngine;
					Object.values(this.#stateEngine.sessionEngines).forEach(
						(s) => {
							if (s) s.isFirstSession = false;
						},
					);
					this.#stateEngine.sessionEngines[
						this.#firstSessionEngine.id
					]!.isFirstSession = true;
				}
			}

			const promises: StatePromise<boolean>[] = [];

			for (const r in this.#stateEngine.viewportEngines) {
				const viewportEngine = this.#stateEngine.viewportEngines[r];
				if (
					this.#stateEngine.viewportEngines[r]?.settingsAssigned
						.resolved === false
				) {
					if (
						(viewportEngine &&
							viewportEngine.sessionSettingsMode ===
								SESSION_SETTINGS_MODE.FIRST) ||
						(viewportEngine &&
							viewportEngine.sessionSettingsMode ===
								SESSION_SETTINGS_MODE.MANUAL &&
							viewportEngine.sessionSettingsId ===
								sessionEngineId)
					) {
						promises.push(viewportEngine.settingsAssigned);
						this.assignSettings(viewportEngine.id, sessionEngineId);
					}
				}
			}

			await Promise.all(promises);

			this.#stateEngine.sessionEngines[
				sessionEngineId
			]?.settingsRegistered.resolve(true);

			for (const r in this.#stateEngine.viewportEngines)
				this.#stateEngine.viewportEngines[r]?.update(
					"CreationControlCenter.createSessionEngine",
				);

			if (this.updateSessions) this.updateSessions(this.sessionEngines);

			const eventEnd: ITaskEvent = {
				type: TASK_TYPE.SESSION_CREATION,
				id: eventId,
				progress: 1,
				status: "Session created",
				data: {sessionId: sessionEngineId},
			};
			this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_END, eventEnd);
			this.#eventEngine.emitEvent(EVENTTYPE.SESSION.SESSION_CREATED, {
				sessionId: sessionEngineId,
			});
			return sessionEngine;
		} catch (e) {
			// special behavior, if this was the only session, display the error on the logo screen
			if (isViewerError(e)) {
				if (
					(this.sessionEngines[sessionEngineId] &&
						Object.values(this.sessionEngines).length === 1) ||
					(!this.sessionEngines[sessionEngineId] &&
						Object.values(this.sessionEngines).length === 0)
				) {
					for (const r in this.#stateEngine.viewportEngines)
						this.#stateEngine.viewportEngines[
							r
						]?.displayErrorMessage((e as Error).message);
				}
			}

			const eventCancel1: ITaskEvent = {
				type: TASK_TYPE.SESSION_CREATION,
				id: eventId,
				progress: 0.9,
				status: "Session created failed, closing session",
				data: {sessionId: sessionEngineId},
			};
			this.#eventEngine.emitEvent(
				EVENTTYPE.TASK.TASK_PROCESS,
				eventCancel1,
			);

			await this.closeSessionEngine(sessionEngineId);

			const eventCancel2: ITaskEvent = {
				type: TASK_TYPE.SESSION_CREATION,
				id: eventId,
				progress: 1,
				status: "Session created failed",
				data: {sessionId: sessionEngineId},
			};
			this.#eventEngine.emitEvent(
				EVENTTYPE.TASK.TASK_CANCEL,
				eventCancel2,
			);

			throw e;
		}
	}

	public resetSettings(
		sessionId: string,
		sections?: ISettingsSections,
	): Promise<void> {
		sections = sections || {};
		this.sessionEngines[sessionId].resetSettings(sections);

		const promises: Promise<unknown>[] = [];

		if (
			sections.session &&
			sections.session.parameter &&
			sections.session.parameter.value
		)
			promises.push(this.sessionEngines[sessionId].customize());

		for (const r in this.#stateEngine.viewportEngines) {
			const viewportEngine = this.#stateEngine.viewportEngines[r];
			if (
				(viewportEngine &&
					viewportEngine.sessionSettingsMode ===
						SESSION_SETTINGS_MODE.FIRST &&
					this.#firstSessionEngine &&
					sessionId === this.#firstSessionEngine.id) ||
				(viewportEngine &&
					viewportEngine.sessionSettingsMode ===
						SESSION_SETTINGS_MODE.MANUAL &&
					sessionId === viewportEngine.sessionSettingsId)
			) {
				this.#stateEngine.viewportEngines[r]?.settingsAssigned.reset();
				promises.push(
					new Promise<void>((resolve) => {
						this.#stateEngine.viewportEngines[
							r
						]?.settingsAssigned.then(() => {
							resolve();
						});
					}),
				);

				viewportEngine.applySettings(sections.viewport);
			}
		}
		return new Promise((resolve) =>
			Promise.all(promises).then(() => resolve()),
		);
	}

	public async saveSettings(
		sessionId: string,
		viewportId?: string,
	): Promise<boolean> {
		const session = this.sessionEngines[sessionId];
		await session.saveUiProperties(false);

		const settingsObject = this.createSettingsObject(sessionId, viewportId);
		const response = await session.saveSettings(settingsObject);
		if (response) {
			this.#logger.debug(
				`Session(${sessionId}).saveSettings: Saved settings.`,
			);
		} else {
			throw new ShapeDiverViewerSessionError(
				`Session(${sessionId}).saveSettings: Could not save settings.`,
			);
		}
		return response;
	}

	// #endregion Public Methods (5)

	// #region Private Methods (2)

	private async assignSettings(
		viewportEngineId: string,
		sessionId: string,
		updateViewport: boolean = false,
	) {
		const viewportEngine =
			this.#stateEngine.viewportEngines[viewportEngineId];
		if (!viewportEngine) return;

		if (
			this.#stateEngine.sessionEngines[sessionId]?.initialized
				.resolved === true
		) {
			// immediate
			viewportEngine.assignSettingsEngine(
				this.sessionEngines[sessionId].settingsEngine,
			);
			await viewportEngine.applySettings(
				undefined,
				undefined,
				updateViewport,
			);
		} else {
			await new Promise<void>((resolve) => {
				this.#stateEngine.sessionEngines[sessionId]?.initialized.then(
					async () => {
						viewportEngine.assignSettingsEngine(
							this.sessionEngines[sessionId].settingsEngine,
						);
						await viewportEngine.applySettings(
							undefined,
							undefined,
							updateViewport,
						);
						resolve();
					},
				);
			});
		}
	}

	private createSettingsObject(
		sessionId: string,
		viewportId?: string,
	): ISettings {
		const session = this.sessionEngines[sessionId];

		session.settingsEngine.settings.build_version =
			build_data.build_version;
		session.settingsEngine.settings.build_date = build_data.build_date;
		session.settingsEngine.settings.settings_version = latestVersion;

		let viewportEngine;
		if (viewportId && this.#stateEngine.viewportEngines[viewportId]) {
			viewportEngine = this.#stateEngine.viewportEngines[viewportId];
		} else {
			for (const r in this.#stateEngine.viewportEngines) {
				const viewportEngineToCheck =
					this.#stateEngine.viewportEngines[r];
				if (
					(viewportEngineToCheck &&
						viewportEngineToCheck.sessionSettingsMode ===
							SESSION_SETTINGS_MODE.FIRST &&
						this.#firstSessionEngine &&
						sessionId === this.#firstSessionEngine.id) ||
					(viewportEngineToCheck &&
						viewportEngineToCheck.sessionSettingsMode ===
							SESSION_SETTINGS_MODE.MANUAL &&
						sessionId === viewportEngineToCheck.sessionSettingsId)
				) {
					viewportEngine = viewportEngineToCheck;
					continue;
				}
			}
		}

		if (viewportEngine) viewportEngine.saveSettings();

		return session.settingsEngine.settings;
	}

	// #endregion Private Methods (2)
}
