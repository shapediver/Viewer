import { BUSY_MODE_DISPLAY, SESSION_SETTINGS_MODE, SPINNER_POSITIONING, VISIBILITY_MODE } from "@shapediver/viewer.rendering-engine.rendering-engine";
import { RenderingEngine, RenderingEngine as RenderingEngineThreeJs } from "@shapediver/viewer.rendering-engine-threejs.standard";
import { ISettingsSections, SessionEngine } from "@shapediver/viewer.session-engine.session-engine";
import { EventEngine, EVENTTYPE, EVENTTYPE_SCENE, HttpClient, InputValidator, Logger, LOGGING_TOPIC, SettingsEngine, ShapeDiverBackendError, ShapeDiverViewerError, ShapeDiverViewerSessionError, StateEngine, StatePromise, UuidGenerator } from "@shapediver/viewer.shared.services";
import { EventResponseMapping, ITaskEvent, TASK_TYPE } from "@shapediver/viewer.shared.types";
import { container, singleton } from "tsyringe";
import { ICreationControlCenter } from "../interfaces/ICreationControlCenter";
import { build_data } from '@shapediver/viewer.shared.build-data'
import { Box } from "@shapediver/viewer.shared.math";
import { ITree, Tree } from "@shapediver/viewer.shared.node-tree";
import { ShapeDiverResponseDto } from "@shapediver/api.geometry-api-dto-v2";
import { ISettingsV3_1 } from "@shapediver/viewer.settings";

@singleton()
export class CreationControlCenter implements ICreationControlCenter {
  // #region Properties (10)

  readonly #eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);
  readonly #logger: Logger = <Logger>container.resolve(Logger);
  readonly #sceneTree: ITree = <ITree>container.resolve(Tree);
  readonly #stateEngine: StateEngine = <StateEngine>container.resolve(StateEngine);
  readonly #uuidGenerator: UuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);
  readonly renderingEngines: { [key: string]: RenderingEngineThreeJs } = {};
  readonly sessionEngines: { [key: string]: SessionEngine } = {};

  #firstSessionEngine?: SessionEngine;
  update?: (
    sessionEngines: { [key: string]: SessionEngine; },
    renderingEngines: { [key: string]: RenderingEngine; }
  ) => void;

  // #endregion Properties (10)

  // #region Public Methods (6)

  public applySettings(sessionId: string, response: ShapeDiverResponseDto, sections?: ISettingsSections): Promise<void> {
    sections = sections || {};
    this.sessionEngines[sessionId].applySettings(response, sections);

    const promises: Promise<any>[] = [];

    if (sections.session && sections.session.parameter && sections.session.parameter.value)
      promises.push(this.sessionEngines[sessionId].customize());

    for (let r in this.renderingEngines) {
      if ((this.renderingEngines[r].sessionSettingsMode === SESSION_SETTINGS_MODE.FIRST && this.#firstSessionEngine && sessionId === this.#firstSessionEngine.id) ||
        (this.renderingEngines[r].sessionSettingsMode === SESSION_SETTINGS_MODE.MANUAL && sessionId === this.renderingEngines[r].sessionSettingsId)) {
        this.#stateEngine.renderingEngines[r].settingsAssigned.reset();
        promises.push(new Promise<void>(resolve => {
          this.#stateEngine.renderingEngines[r].settingsAssigned.then(() => {
            resolve();
          })
        }));

        this.renderingEngines[r].applySettings(sections.viewport);
      }
    }
    return new Promise(resolve => Promise.all(promises).then(() => resolve()));
  }

  public getViewportSettings(viewportId: string): ISettingsV3_1 {
    let renderingEngine = this.renderingEngines[viewportId];
    if(!renderingEngine)
      throw this.#logger.error(LOGGING_TOPIC.VIEWPORT, new Error('Viewport with id ' + viewportId + ' could not be found.'), undefined, true, false);

    const settingsEngine: SettingsEngine = new SettingsEngine();
    renderingEngine.saveSettings(settingsEngine);
    return settingsEngine.convertToTargetVersion();
  }

  public applyViewportSettings(viewportId: string, settings: ISettingsV3_1, sections: { ar?: boolean | undefined; scene?: boolean | undefined; camera?: boolean | undefined; light?: boolean | undefined; environment?: boolean | undefined; general?: boolean | undefined; } = { ar: false, scene: false, camera: false, light: false, environment: false, general: false}): Promise<void> {
    sections = sections || {};

    const settingsEngine: SettingsEngine = new SettingsEngine();
    settingsEngine.loadSettings(settings);

    const promises: Promise<any>[] = [];
    this.#stateEngine.renderingEngines[viewportId].settingsAssigned.reset();
    promises.push(new Promise<void>(resolve => {
      this.#stateEngine.renderingEngines[viewportId].settingsAssigned.then(() => {
        resolve();
      })
    }));

    this.renderingEngines[viewportId].applySettings(sections, settingsEngine);
    return new Promise(resolve => Promise.all(promises).then(() => resolve()));
  }

  public async closeRenderingEngine(id: string): Promise<void> {
    try {
      if (!this.renderingEngines[id]) return;

      this.#logger.debugLow(LOGGING_TOPIC.VIEWPORT, `CreationControlCenter.closeRenderingEngine: Closing viewport ${id}.`);
      if (this.#stateEngine.renderingEngines[id].initialized.resolved === false)
        await new Promise<void>(resolve => { this.#stateEngine.renderingEngines[id].initialized.then(() => resolve()) })

      this.#stateEngine.renderingEngines[id].settingsAssigned.reset();
      this.#stateEngine.renderingEngines[id].environmentMapLoaded.reset();
      this.#stateEngine.renderingEngines[id].initialized.reset();

      await this.renderingEngines[id].close();
      this.#eventEngine.emitEvent(EVENTTYPE.VIEWPORT.VIEWPORT_CLOSED, { viewportId: id });

      (<any>this.renderingEngines[id]) = undefined;
      delete this.renderingEngines[id];
      delete this.#stateEngine.renderingEngines[id];

      this.#logger.debug(LOGGING_TOPIC.VIEWPORT, `CreationControlCenter.closeRenderingEngine: Viewport closed.`);
      if (this.update) this.update(this.sessionEngines, this.renderingEngines);
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGING_TOPIC.GENERAL, 'CreationControlCenter.closeRenderingEngine', e);
    }
  }

  public async closeSessionEngine(id: string): Promise<void> {
    try {
      if (!this.sessionEngines[id]) return;

      this.#logger.debugLow(LOGGING_TOPIC.SESSION, `CreationControlCenter.closeSession: Closing session ${id}.`);

      if (this.#stateEngine.sessionEngines[id].initialized.resolved === false)
        await new Promise<void>(resolve => { this.#stateEngine.sessionEngines[id].initialized.then(() => resolve()) })

      await this.sessionEngines[id].close();

      // remove from rendering engines (also directly assigned)
      for (let r in this.renderingEngines) {
        if ((this.renderingEngines[r].sessionSettingsMode === SESSION_SETTINGS_MODE.MANUAL && this.renderingEngines[r].sessionSettingsId === id) ||
          (this.renderingEngines[r].sessionSettingsMode === SESSION_SETTINGS_MODE.FIRST && this.#firstSessionEngine === this.sessionEngines[id])) {
          this.renderingEngines[r].reset();
        }
      }

      if (this.#firstSessionEngine === this.sessionEngines[id]) {
        const engines = Object.values(this.sessionEngines).filter(s => s.id !== id);
        this.#firstSessionEngine = engines.length === 0 ? undefined : engines[0];
        if (this.#firstSessionEngine) {
          let promises: StatePromise<boolean>[] = []

          for (let r in this.renderingEngines) {
            if (this.#stateEngine.renderingEngines[r].settingsAssigned.resolved === false) {
              if (this.renderingEngines[r].sessionSettingsMode === SESSION_SETTINGS_MODE.FIRST) {
                promises.push(this.#stateEngine.renderingEngines[r].settingsAssigned)
                this.assignSettings(this.renderingEngines[r], this.#firstSessionEngine?.id);
              }
            }
          }

          await Promise.all(promises)

          if (this.update) this.update(this.sessionEngines, this.renderingEngines);
        }
      }

      this.#eventEngine.emitEvent(EVENTTYPE.SESSION.SESSION_CLOSED, { sessionId: id });
      this.#stateEngine.sessionEngines[id].settingsRegistered.reset();

      (<any>this.sessionEngines[id]) = undefined;
      delete this.sessionEngines[id];
      delete this.#stateEngine.sessionEngines[id];

      this.#logger.debug(LOGGING_TOPIC.SESSION, `CreationControlCenter.closeSessionEngine: Session closed.`);
      for (let r in this.renderingEngines)
        this.renderingEngines[r].update('CreationControlCenter.closeSessionEngine')
      if (this.update) this.update(this.sessionEngines, this.renderingEngines);
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGING_TOPIC.GENERAL, 'CreationControlCenter.closeSession', e);
    }
  }

  public async createRenderingEngineThreeJs(properties: {
    canvas?: HTMLCanvasElement,
    id?: string,
    branding?: {
      logo?: string | null,
      backgroundColor?: string,
      busyModeSpinner?: string,
      busyModeDisplay?: BUSY_MODE_DISPLAY,
      spinnerPositioning?: SPINNER_POSITIONING
    },
    sessionSettingsId?: string,
    sessionSettingsMode?: SESSION_SETTINGS_MODE,
    visibility?: VISIBILITY_MODE,
  }): Promise<RenderingEngineThreeJs> {
    const eventId = this.#uuidGenerator.create();
    let renderingEngineId = properties.id || this.#uuidGenerator.create();
    properties.id = renderingEngineId;
    try {
      const eventStart: ITaskEvent = { type: TASK_TYPE.VIEWPORT_CREATION, id: eventId, progress: 0, status: 'Creating viewport' };
      this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_START, eventStart);

      // check if the given id is valid
      if (this.renderingEngines[renderingEngineId]) {
        const eventClose: ITaskEvent = { type: TASK_TYPE.VIEWPORT_CREATION, id: eventId, progress: 0.1, status: 'Closing viewport with same id' };
        this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_PROCESS, eventClose);

        this.#logger.warn(LOGGING_TOPIC.SESSION, `CreationControlCenter.createViewport: Viewer with this id (${renderingEngineId}) already exists. Closing initial instance.`);
        await this.closeRenderingEngine(renderingEngineId);
      }

      this.#stateEngine.renderingEngines[renderingEngineId] = {
        id: renderingEngineId,
        initialized: new StatePromise(),
        environmentMapLoaded: new StatePromise(),
        settingsAssigned: new StatePromise(),
        boundingBoxCreated: new StatePromise(),
        busy: []
      }

      const renderingEngine = new RenderingEngineThreeJs(properties);
      container.registerInstance('renderingEngine', renderingEngine);
      this.renderingEngines[renderingEngineId] = renderingEngine;

      renderingEngine.cameraEngine.createDefaultCameras();

      if (properties.sessionSettingsMode === SESSION_SETTINGS_MODE.MANUAL) {
        if (!properties.sessionSettingsId) 
          throw this.#logger.error(LOGGING_TOPIC.VIEWPORT, new Error('Session with sessionSettingsMode MANUAL needs to have a sessionSettingsId.'), undefined, true, true);
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
        if (this.#sceneTree.root.boundingBox.isEmpty()) {
          this.#eventEngine.addListener(EVENTTYPE.SCENE.SCENE_BOUNDING_BOX_CHANGE, (e) => {
            const event = e as EventResponseMapping[EVENTTYPE_SCENE.SCENE_BOUNDING_BOX_CHANGE];
            if (event.viewportId === renderingEngine.id) {
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

      this.#eventEngine.emitEvent(EVENTTYPE.VIEWPORT.VIEWPORT_CREATED, { viewportId: renderingEngineId });
      this.#stateEngine.renderingEngines[renderingEngineId].initialized.resolve(true);

      this.#logger.debug(LOGGING_TOPIC.VIEWPORT, `CreationControlCenter.createViewport: Viewport(${renderingEngineId}) created.`);

      const eventEnd: ITaskEvent = { type: TASK_TYPE.VIEWPORT_CREATION, id: eventId, progress: 1, status: 'Viewport created' };
      this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_END, eventEnd);

      if (this.update) this.update(this.sessionEngines, this.renderingEngines);
      return <RenderingEngineThreeJs>this.renderingEngines[renderingEngineId];
    } catch (e) {
      const eventCancel1: ITaskEvent = { type: TASK_TYPE.VIEWPORT_CREATION, id: eventId, progress: 0.9, status: 'Viewport created failed, closing viewport' };
      this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_PROCESS, eventCancel1);

      try { await this.closeRenderingEngine(renderingEngineId); } catch { }

      const eventCancel2: ITaskEvent = { type: TASK_TYPE.VIEWPORT_CREATION, id: eventId, progress: 1, status: 'Viewport created failed, exiting' };
      this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_CANCEL, eventCancel2);

      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGING_TOPIC.GENERAL, 'CreationControlCenter.createViewport', e);
    }
  }

  public async createSessionEngine(properties: {
    ticket: string,
    modelViewUrl: string,
    jwtToken?: string,
    id?: string,
    waitForOutputs?: boolean,
    loadOutputs?: boolean,
    excludeViewports?: string[],
    initialParameterValues?: { [key: string]: string }
  }): Promise<SessionEngine> {
    const eventId = this.#uuidGenerator.create();
    let sessionEngineId = properties.id || this.#uuidGenerator.create();
    properties.id = sessionEngineId;

    try {
      const eventStart: ITaskEvent = { type: TASK_TYPE.SESSION_CREATION, id: eventId, progress: 0, status: 'Creating session' };
      this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_START, eventStart);

      // check if the given id is valid
      if (this.sessionEngines[sessionEngineId]) {
        const eventClose: ITaskEvent = { type: TASK_TYPE.SESSION_CREATION, id: eventId, progress: 0.1, status: 'Closing session with same id' };
        this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_PROCESS, eventClose);

        this.#logger.warn(LOGGING_TOPIC.SESSION, `CreationControlCenter.createSession: Session with this id (${sessionEngineId}) already exists. Closing initial instance.`);
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
        excludeViewports: properties.excludeViewports,
        buildVersion: build_data.build_version,
        buildDate: build_data.build_date,
        bearerToken: properties.jwtToken
      });

      const eventInit: ITaskEvent = { type: TASK_TYPE.SESSION_CREATION, id: eventId, progress: 0.25, status: 'Initializing session' };
      this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_PROCESS, eventInit);

      await sessionEngine.init(properties.initialParameterValues);

      if (properties.loadOutputs !== false) {
        if (properties.waitForOutputs !== false) {
          await sessionEngine.updateOutputs();
          this.#eventEngine.emitEvent(EVENTTYPE.SESSION.SESSION_INITIAL_OUTPUTS_LOADED, { sessionId: sessionEngineId });

          const eventEnd: ITaskEvent = { type: TASK_TYPE.SESSION_INITIAL_OUTPUTS_LOADED, id: eventId, progress: 1, status: 'Initial outputs loaded' };
          this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_END, eventEnd);
          for (let r in this.renderingEngines)
            this.renderingEngines[r].update('CreationControlCenter.createSessionEngine.waitForOutputs=true')
        } else {
          sessionEngine.updateOutputs().then(() => {
            this.#eventEngine.emitEvent(EVENTTYPE.SESSION.SESSION_INITIAL_OUTPUTS_LOADED, { sessionId: sessionEngineId });

            const eventEnd: ITaskEvent = { type: TASK_TYPE.SESSION_INITIAL_OUTPUTS_LOADED, id: eventId, progress: 1, status: 'Initial outputs loaded' };
            this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_END, eventEnd);
            for (let r in this.renderingEngines)
              this.renderingEngines[r].update('CreationControlCenter.createSessionEngine.waitForOutputs=false')
          })
        }
      }
      
      // save the session
      this.sessionEngines[sessionEngineId] = sessionEngine;

      this.#eventEngine.emitEvent(EVENTTYPE.SESSION.SESSION_CREATED, { sessionEngineId });
      this.#stateEngine.sessionEngines[sessionEngineId].initialized.resolve(true);
      this.#logger.debug(LOGGING_TOPIC.SESSION, `CreationControlCenter.createSession: Session(${sessionEngine.id}) created.`);

      const eventEnd: ITaskEvent = { type: TASK_TYPE.SESSION_CREATION, id: eventId, progress: 1, status: 'Session created' };
      this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_END, eventEnd);

      if (!this.#firstSessionEngine) 
        this.#firstSessionEngine = sessionEngine;

      let promises: StatePromise<boolean>[] = []

      for (let r in this.renderingEngines) {
        if (this.#stateEngine.renderingEngines[r].settingsAssigned.resolved === false) {
          if (this.renderingEngines[r].sessionSettingsMode === SESSION_SETTINGS_MODE.FIRST || (this.renderingEngines[r].sessionSettingsMode === SESSION_SETTINGS_MODE.MANUAL && this.renderingEngines[r].sessionSettingsId === sessionEngineId)) {
            promises.push(this.#stateEngine.renderingEngines[r].settingsAssigned)
            this.assignSettings(this.renderingEngines[r], sessionEngineId);
          }
        }
      }

      await Promise.all(promises)

      for (let r in this.renderingEngines)
        this.renderingEngines[r].update('CreationControlCenter.createSessionEngine')

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
      throw this.#logger.handleError(LOGGING_TOPIC.GENERAL, 'CreationControlCenter.createSession', e);
    }
  }

  public getARSessionEngine(): SessionEngine | undefined {
    for (let s in this.sessionEngines) {
      if (this.sessionEngines[s].canUploadGLTF) {
        return this.sessionEngines[s];
      }
    }
  }

  public createSettingsObject(sessionId: string, viewportId?: string): any {
    try {
      const session = this.sessionEngines[sessionId];

      session.settingsEngine.settings.build_version = build_data.build_version;
      session.settingsEngine.settings.build_date = build_data.build_date;
      session.settingsEngine.settings.settings_version = '3.1';

      let renderingEngine;
      if(viewportId && this.renderingEngines[viewportId]) {
        renderingEngine = this.renderingEngines[viewportId];
      } else {
        for (let r in this.renderingEngines) {
          if ((this.renderingEngines[r].sessionSettingsMode === SESSION_SETTINGS_MODE.FIRST && this.#firstSessionEngine && sessionId === this.#firstSessionEngine.id) ||
            (this.renderingEngines[r].sessionSettingsMode === SESSION_SETTINGS_MODE.MANUAL && sessionId === this.renderingEngines[r].sessionSettingsId)) {
              renderingEngine = this.renderingEngines[r];
              continue;
          }
        }
      }

      if (renderingEngine)
        renderingEngine.saveSettings();
        
      return session.settingsEngine.convertToTargetVersion();
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGING_TOPIC.SESSION, `Session(${sessionId}).saveSettings`, e);
    }
  }

  resetSettings(sessionId: string, sections?: ISettingsSections): Promise<void> {
    sections = sections || {};
    this.sessionEngines[sessionId].resetSettings(sections);

    const promises: Promise<any>[] = [];

    if (sections.session && sections.session.parameter && sections.session.parameter.value)
      promises.push(this.sessionEngines[sessionId].customize());

    for (let r in this.renderingEngines) {
      if ((this.renderingEngines[r].sessionSettingsMode === SESSION_SETTINGS_MODE.FIRST && this.#firstSessionEngine && sessionId === this.#firstSessionEngine.id) ||
        (this.renderingEngines[r].sessionSettingsMode === SESSION_SETTINGS_MODE.MANUAL && sessionId === this.renderingEngines[r].sessionSettingsId)) {
        this.#stateEngine.renderingEngines[r].settingsAssigned.reset();
        promises.push(new Promise<void>(resolve => {
          this.#stateEngine.renderingEngines[r].settingsAssigned.then(() => {
            resolve();
          })
        }));

        this.renderingEngines[r].applySettings(sections.viewport);
      }
    }
    return new Promise(resolve => Promise.all(promises).then(() => resolve()));
  }

  public async saveSettings(sessionId: string, viewportId?: string): Promise<boolean> {
    try {
      const session = this.sessionEngines[sessionId];
      await session.saveUiProperties(false);

      const settingsObject = this.createSettingsObject(sessionId, viewportId);
      const response = await session.saveSettings(settingsObject);
      if (response) {
        this.#logger.debug(LOGGING_TOPIC.SESSION, `Session(${sessionId}).saveSettings: Saved settings.`);
      } else {
        const error = new ShapeDiverViewerSessionError(`Session(${sessionId}).saveSettings: Could not save settings.`);
        throw this.#logger.handleError(LOGGING_TOPIC.SESSION, `Session(${sessionId}).saveSettings`, error);
      }
      return response;
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGING_TOPIC.SESSION, `Session(${sessionId}).saveSettings`, e);
    }
  }

  // #endregion Public Methods (6)

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