import { SESSION_SETTINGS_MODE, VISIBILITY_MODE } from "@shapediver/viewer.rendering-engine.rendering-engine";
import { RenderingEngine, RenderingEngine as RenderingEngineThreeJs } from "@shapediver/viewer.rendering-engine-threejs.standard";
import { SessionEngine } from "@shapediver/viewer.session-engine.session-engine";
import { EventEngine, EVENTTYPE, EVENTTYPE_SCENE, HttpClient, InputValidator, Logger, LOGGING_TOPIC, ShapeDiverBackendError, ShapeDiverViewerError, StateEngine, StatePromise, UuidGenerator } from "@shapediver/viewer.shared.services";
import { EventResponseMapping, ITaskEvent, TASK_TYPE } from "@shapediver/viewer.shared.types";
import { container, singleton } from "tsyringe";
import { ICreationControlCenter } from "../interfaces/ICreationControlCenter";
import { build_data } from '@shapediver/viewer.shared.build-data'
import { CAMERA_TYPE } from "@shapediver/viewer.rendering-engine.camera-engine"
import { Box } from "@shapediver/viewer.shared.math";

@singleton()
export class CreationControlCenter implements ICreationControlCenter {
  // #region Properties (9)

  readonly #eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);
  readonly #httpClient: HttpClient = <HttpClient>container.resolve(HttpClient);
  readonly #logger: Logger = <Logger>container.resolve(Logger);
  readonly #stateEngine: StateEngine = <StateEngine>container.resolve(StateEngine);
  readonly #uuidGenerator: UuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);
  readonly renderingEngines: { [key: string]: RenderingEngineThreeJs } = {};
  readonly sessionEngines: { [key: string]: SessionEngine } = {};

  #firstSessionEngine?: SessionEngine;
  update?: (
    sessionEngines: { [key: string]: SessionEngine; },
    renderingEngines: { [key: string]: RenderingEngine; }
  ) => void;

  // #endregion Properties (9)

  // #region Public Methods (4)

  public async closeRenderingEngine(id: string): Promise<void> {
    try {
      this.#logger.debugLow(LOGGING_TOPIC.VIEWER, `Api.closeRenderingEngine: Closing viewer ${id}.`);

      if (this.#stateEngine.renderingEngines[id].initialized.resolved === false)
        await new Promise<void>(resolve => { this.#stateEngine.renderingEngines[id].initialized.then(() => resolve()) })

      this.#stateEngine.renderingEngines[id].settingsAssigned.reset();
      this.#stateEngine.renderingEngines[id].environmentMapLoaded.reset();
      this.#stateEngine.renderingEngines[id].initialized.reset();

      await this.renderingEngines[id].close();
      this.#eventEngine.emitEvent(EVENTTYPE.VIEWER.VIEWER_CLOSED, { viewerId: id });

      (<any>this.renderingEngines[id]) = undefined;
      delete this.renderingEngines[id];

      delete this.#stateEngine.renderingEngines[id];
      this.#logger.debug(LOGGING_TOPIC.VIEWER, `Viewer(${id}): Viewer closed.`);
      if (this.update) this.update(this.sessionEngines, this.renderingEngines);
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGING_TOPIC.GENERAL, 'Api.closeRenderingEngine', e);
    }
  }

  public async closeSessionEngine(id: string): Promise<void> {
    try {
      this.#logger.debugLow(LOGGING_TOPIC.SESSION, `Api.closeSession: Closing session ${id}.`);

      if (this.#stateEngine.sessionEngines[id].initialized.resolved === false)
        await new Promise<void>(resolve => { this.#stateEngine.sessionEngines[id].initialized.then(() => resolve()) })

      await this.sessionEngines[id].close();

      if (this.#firstSessionEngine == this.sessionEngines[id])
        this.#httpClient.removeDataLoading()

      this.#eventEngine.emitEvent(EVENTTYPE.SESSION.SESSION_CLOSED, { sessionId: id });
      this.#stateEngine.sessionEngines[id].settingsRegistered.reset();

      // reset settings of viewers that used this session?
      // keep using?

      (<any>this.sessionEngines[id]) = undefined;
      delete this.sessionEngines[id];
      delete this.#stateEngine.sessionEngines[id];

      this.#logger.debug(LOGGING_TOPIC.SESSION, `Session(${id}): Session closed.`);

      for (let r in this.renderingEngines)
        this.renderingEngines[r].update()

      if (this.update) this.update(this.sessionEngines, this.renderingEngines);
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGING_TOPIC.GENERAL, 'Api.closeSession', e);
    }
  }

  public async createRenderingEngineThreeJs(properties: {
    canvas?: HTMLCanvasElement,
    id?: string,
    branding?: {
      logo?: string | null,
      backgroundColor?: string,
      spinner?: string,
    },
    sessionSettingsId?: string,
    sessionSettingsMode?: SESSION_SETTINGS_MODE,
    visibility?: VISIBILITY_MODE,
  }): Promise<RenderingEngineThreeJs> {
    const eventId = this.#uuidGenerator.create();
    let renderingEngineId = properties.id || this.#uuidGenerator.create();
    try {
      const eventStart: ITaskEvent = { type: TASK_TYPE.VIEWER_CREATION, id: eventId, progress: 0, status: 'Creating viewer' };
      this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_START, eventStart);

      // check if the given id is valid
      if (this.renderingEngines[renderingEngineId]) {
        const eventClose: ITaskEvent = { type: TASK_TYPE.VIEWER_CREATION, id: eventId, progress: 0.1, status: 'Closing viewer with same id' };
        this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_PROCESS, eventClose);

        this.#logger.warn(LOGGING_TOPIC.SESSION, `Api.createViewer: Viewer with this id (${renderingEngineId}) already exists. Closing initial instance.`);
        await this.closeRenderingEngine(renderingEngineId);
      }

      this.#stateEngine.renderingEngines[renderingEngineId] = {
        id: renderingEngineId,
        initialized: new StatePromise(),
        environmentMapLoaded: new StatePromise(),
        settingsAssigned: new StatePromise(),
        boundingBoxCreated: new StatePromise()
      }

      const renderingEngine = new RenderingEngineThreeJs(properties);
      container.registerInstance('renderingEngine', renderingEngine);
      this.renderingEngines[renderingEngineId] = renderingEngine;

      // TODO camera

      const camera = renderingEngine.cameraEngine.createCamera(CAMERA_TYPE.PERSPECTIVE);
      renderingEngine.cameraEngine.assignCamera(camera.id);

      // this.stateEngine.primarySessionAvailable.then(() => {
      //   this.stateEngine.primarySession?.settingsRegistered.then(() => {
      //     if (this._closed) return;
      //     this.applySettings()
      //   })
      // })

      if (properties.sessionSettingsMode === SESSION_SETTINGS_MODE.CUSTOM) {
        if (!properties.sessionSettingsId) throw new Error();
        const sessionSettingsId = properties.sessionSettingsId;
        if (this.sessionEngines[sessionSettingsId]) {
          this.assignSettings(renderingEngine, sessionSettingsId)
        } else {
          // in createSession
        }
      } else if (properties.sessionSettingsMode === SESSION_SETTINGS_MODE.FIRST) {
        if (this.#firstSessionEngine) {
          this.assignSettings(renderingEngine, this.#firstSessionEngine.id)
        } else {
          // in createSession
        }
      }

      if (renderingEngine.sessionSettingsMode === SESSION_SETTINGS_MODE.NONE &&
        renderingEngine.visibility === VISIBILITY_MODE.SESSION) {
        renderingEngine.show = true;
      } else if (renderingEngine.visibility === VISIBILITY_MODE.INSTANT) {
        renderingEngine.show = true;
      } else if (renderingEngine.visibility === VISIBILITY_MODE.SESSION) {
        // wait for settings to load before showing the scene

        this.#eventEngine.addListener(EVENTTYPE.SCENE.SCENE_BOUNDING_BOX_CHANGE, (e) => {
          const event = e as EventResponseMapping[EVENTTYPE_SCENE.SCENE_BOUNDING_BOX_CHANGE];
          if (event.viewerId === renderingEngine.id) {
            const boundingBox = new Box(event.boundingBox!.min, event.boundingBox!.max);
            if (boundingBox.isEmpty()) {
              renderingEngine.show = false;
            } else {
              if (this.#stateEngine.renderingEngines[renderingEngineId].settingsAssigned.resolved) {
                renderingEngine.show = true;
              } else {
                this.#stateEngine.renderingEngines[renderingEngineId].settingsAssigned.then(() => {
                  renderingEngine.show = true;
                })
              }
            }

          }
        })
      }

      // TODO waiting for settings
      //   if ((prop.visibility || VISIBILITY_MODE.SESSION) === VISIBILITY_MODE.SESSION && this.#stateEngine.primarySession && this.#stateEngine.primarySession.initialized.resolved === true) {
      //     const eventEnd: ITaskEvent = { type: TASK_TYPE.VIEWER_CREATION, id: eventId, progress: 0.75, status: 'Waiting for primary session settings' };
      //     this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_PROCESS, eventEnd);

      //     await new Promise<void>(resolve => {
      //       this.#stateEngine.renderingEngines[renderingEngineId].settingsAssigned.then(() => resolve())
      //     })
      //   }

      this.#eventEngine.emitEvent(EVENTTYPE.VIEWER.VIEWER_CREATED, { viewerId: renderingEngineId });
      this.#stateEngine.renderingEngines[renderingEngineId].initialized.resolve(true);

      this.#logger.debug(LOGGING_TOPIC.VIEWER, `Api.createViewer: Viewer(${renderingEngineId}) created.`);

      const eventEnd: ITaskEvent = { type: TASK_TYPE.VIEWER_CREATION, id: eventId, progress: 1, status: 'Viewer created' };
      this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_END, eventEnd);

      this.renderingEngines[renderingEngineId].update();
      if (this.update) this.update(this.sessionEngines, this.renderingEngines);
      return <RenderingEngineThreeJs>this.renderingEngines[renderingEngineId];
    } catch (e) {
      const eventCancel1: ITaskEvent = { type: TASK_TYPE.VIEWER_CREATION, id: eventId, progress: 0.9, status: 'Viewer created failed, closing viewer' };
      this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_PROCESS, eventCancel1);

      try { await this.closeRenderingEngine(renderingEngineId); } catch { }

      const eventCancel2: ITaskEvent = { type: TASK_TYPE.VIEWER_CREATION, id: eventId, progress: 1, status: 'Viewer created failed, exiting' };
      this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_CANCEL, eventCancel2);

      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGING_TOPIC.GENERAL, 'Api.createViewer', e);
    }
  }

  public async createSessionEngine(properties: {
    ticket: string,
    modelViewUrl: string,
    jwtToken?: string,
    id?: string,
    waitForOutputs?: boolean,
    loadOutputs?: boolean,
    initialParameterValues?: { [key: string]: string }
  }): Promise<SessionEngine> {
    const eventId = this.#uuidGenerator.create();
    let sessionEngineId = properties.id || this.#uuidGenerator.create();

    try {
      const eventStart: ITaskEvent = { type: TASK_TYPE.SESSION_CREATION, id: eventId, progress: 0, status: 'Creating session' };
      this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_START, eventStart);

      // check if the given id is valid
      if (this.sessionEngines[sessionEngineId]) {
        const eventClose: ITaskEvent = { type: TASK_TYPE.SESSION_CREATION, id: eventId, progress: 0.1, status: 'Closing session with same id' };
        this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_PROCESS, eventClose);

        this.#logger.warn(LOGGING_TOPIC.SESSION, `Api.createSession: Session with this id (${sessionEngineId}) already exists. Closing initial instance.`);
        await this.closeSessionEngine(sessionEngineId);
      }

      this.#stateEngine.sessionEngines[sessionEngineId] = {
        id: sessionEngineId,
        initialized: new StatePromise(),
        settingsRegistered: new StatePromise()
      }

      // create the actual session 
      const sessionEngine = new SessionEngine({
        id: sessionEngineId,
        ticket: properties.ticket,
        modelViewUrl: properties.modelViewUrl,
        buildVersion: build_data.build_version,
        buildDate: build_data.build_date,
        bearerToken: properties.jwtToken,
      });

      // save the session
      this.sessionEngines[sessionEngineId] = sessionEngine;

      const eventInit: ITaskEvent = { type: TASK_TYPE.SESSION_CREATION, id: eventId, progress: 0.25, status: 'Initializing session' };
      this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_PROCESS, eventInit);

      await sessionEngine.init(properties.initialParameterValues);

      if (properties.loadOutputs !== false) {
        if (properties.waitForOutputs === true) {
          await sessionEngine.loadOutputs();
          this.#eventEngine.emitEvent(EVENTTYPE.SESSION.SESSION_INITIAL_OUTPUTS_LOADED, { sessionId: sessionEngineId });

          const eventEnd: ITaskEvent = { type: TASK_TYPE.SESSION_INITIAL_OUTPUTS_LOADED, id: eventId, progress: 1, status: 'Initial outputs loaded' };
          this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_END, eventEnd);
          for (let r in this.renderingEngines)
            this.renderingEngines[r].update()
        } else {
          sessionEngine.loadOutputs().then(() => {
            this.#eventEngine.emitEvent(EVENTTYPE.SESSION.SESSION_INITIAL_OUTPUTS_LOADED, { sessionId: sessionEngineId });

            const eventEnd: ITaskEvent = { type: TASK_TYPE.SESSION_INITIAL_OUTPUTS_LOADED, id: eventId, progress: 1, status: 'Initial outputs loaded' };
            this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_END, eventEnd);
            for (let r in this.renderingEngines)
              this.renderingEngines[r].update()
          })
        }
      }

      this.#eventEngine.emitEvent(EVENTTYPE.SESSION.SESSION_CREATED, { sessionEngineId });
      this.#stateEngine.sessionEngines[sessionEngineId].initialized.resolve(true);
      this.#logger.debug(LOGGING_TOPIC.SESSION, `Api.createSession: Session(${sessionEngine.id}) created.`);

      const eventEnd: ITaskEvent = { type: TASK_TYPE.SESSION_CREATION, id: eventId, progress: 1, status: 'Session created' };
      this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_END, eventEnd);

      if (!this.#firstSessionEngine) {
        this.#firstSessionEngine = sessionEngine;
        this.#httpClient.addDataLoading(sessionEngine.loadData.bind(sessionEngine));

        for (let r in this.renderingEngines) {
          if (this.#stateEngine.renderingEngines[r].settingsAssigned.resolved === false) {
            if (this.renderingEngines[r].sessionSettingsMode === SESSION_SETTINGS_MODE.FIRST || (this.renderingEngines[r].sessionSettingsMode === SESSION_SETTINGS_MODE.CUSTOM && this.renderingEngines[r].sessionSettingsId === sessionEngineId)) {
              this.assignSettings(this.renderingEngines[r], sessionEngineId)
            }
          }
        }
      }

      for (let r in this.renderingEngines)
        this.renderingEngines[r].update()

      if (this.update) this.update(this.sessionEngines, this.renderingEngines);
      return sessionEngine;
    } catch (e) {
      // special behavior, if this was the only session, display the error on the logo screen
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) {
        if ((this.sessionEngines[sessionEngineId] && Object.values(this.sessionEngines).length === 1) || (!this.sessionEngines[sessionEngineId] && Object.values(this.sessionEngines).length === 0)) {
          for (let v in this.renderingEngines)
            this.renderingEngines[v].displayErrorMessage(e.message);
        }
      }

      const eventCancel1: ITaskEvent = { type: TASK_TYPE.SESSION_CREATION, id: eventId, progress: 0.9, status: 'Session created failed, closing session' };
      this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_PROCESS, eventCancel1);

      await this.closeSessionEngine(sessionEngineId);

      const eventCancel2: ITaskEvent = { type: TASK_TYPE.SESSION_CREATION, id: eventId, progress: 1, status: 'Session created failed' };
      this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_CANCEL, eventCancel2);

      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGING_TOPIC.GENERAL, 'Api.createSession', e);
    }
  }

  // #endregion Public Methods (4)

  // #region Private Methods (1)

  private assignSettings(renderingEngine: RenderingEngineThreeJs, sessionId: string) {
    if (this.#stateEngine.sessionEngines[sessionId].initialized.resolved === true) {
      // immediate
      renderingEngine.settingsEngine = this.sessionEngines[sessionId].settingsEngine;
      renderingEngine.applySettings()
    } else {
      this.#stateEngine.sessionEngines[sessionId].initialized.then(() => {
        renderingEngine.settingsEngine = this.sessionEngines[sessionId].settingsEngine;
        renderingEngine.applySettings()
      })
    }
  }

  // #endregion Private Methods (1)
}