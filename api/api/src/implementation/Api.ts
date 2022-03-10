import '@google/model-viewer/dist/model-viewer'

import { Tree, TreeNode } from '@shapediver/viewer.shared.node-tree'
import { container, singleton } from 'tsyringe'
import { GeometryEngine } from '@shapediver/viewer.data-engine.geometry-engine'
import { GLTFConverter } from '@shapediver/viewer.data-engine.gltf-converter'
import {
  EventEngine,
  EVENTTYPE,
  IEvent,
  InputValidator,
  Logger,
  LOGGINGLEVEL,
  LOGGINGTOPIC,
  MAINEVENTTYPE,
  SettingsEngine,
  ShapeDiverBackendError,
  ShapeDiverViewerArError,
  ShapeDiverViewerError,
  ShapeDiverViewerSettingsError,
  StateEngine,
  StatePromise,
  SystemInfo,
  UuidGenerator,
} from '@shapediver/viewer.shared.services'
import { VISIBILITYMODE } from '@shapediver/viewer.rendering-engine.rendering-engine'
import { build_data } from '@shapediver/viewer.shared.build-data'
import { convert, ISettingsV3, validate } from '@shapediver/viewer.settings'
import { mat4, vec3 } from 'gl-matrix'
import { ITaskEvent, SDTFAttributeOverview, SDTFOverview, TASKTYPE } from '@shapediver/viewer.shared.types'
import { ShapeDiverResponseBase } from '@shapediver/api.geometry-api-dto-v1'
import { ShapeDiverRequestGltfUploadQueryConversion, ShapeDiverResponseDto } from '@shapediver/sdk.geometry-api-sdk-v2'

import { IApi } from '../interfaces/IApi'
import { ISession } from '../interfaces/session/ISession'
import { IViewer } from '../interfaces/viewer/IViewer'
import { Session } from './session/Session'
import { Viewer } from './viewer/Viewer'

@singleton()
export class Api implements IApi {
  // #region Properties (13)

  readonly #defaultLogo: string = 'https://d2tuv7fwq0eipl.cloudfront.net/production/assets/img/icon_logo_white.png';
  readonly #eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);
  readonly #gltfConverter: GLTFConverter = <GLTFConverter>container.resolve(GLTFConverter);
  readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
  readonly #logger: Logger = <Logger>container.resolve(Logger);
  readonly #settingsEngine: SettingsEngine = <SettingsEngine>container.resolve(SettingsEngine);
  readonly #stateEngine: StateEngine = <StateEngine>container.resolve(StateEngine);
  readonly #systemInfo: SystemInfo = <SystemInfo>container.resolve(SystemInfo);
  readonly #uuidGenerator: UuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);
  readonly sceneTree: Tree = <Tree>container.resolve(Tree);
  readonly sessions: { [key: string]: ISession } = {};
  readonly viewers: { [key: string]: IViewer } = {};

  #automaticUpdate: boolean = true;

  // #endregion Properties (13)

  // #region Constructors (1)

  /**
   * @ignore
   */
  constructor() {
    try {
      this.#stateEngine.primarySessionAvailable.then(() => {
        this.#stateEngine.primarySession?.settingsRegistered.then(() => {
          this.showMessages = this.#settingsEngine.general.showMessages;
        })
      })
      console.log(`ShapeDiver-Viewer version: ${build_data.build_version}`);

      this.#logger.debugLow(LOGGINGTOPIC.GENERAL, `Api.constructor: Api created.`);
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.GENERAL, 'Api.constructor', e);
    }
  }

  // #endregion Constructors (1)

  // #region Public Accessors (16)

  public get autoScaling(): boolean {
    return this.#settingsEngine.ar.autoScaling;
  }

  public set autoScaling(value: boolean) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.GENERAL, `Api.autoScaling: Updating autoScaling to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.GENERAL, 'Api.autoScaling', value, 'boolean');
      this.#settingsEngine.ar.autoScaling = value;
      this.#logger.debug(LOGGINGTOPIC.GENERAL, `Api.autoScaling: autoScaling was set to: ${value}`);
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.GENERAL, 'Api.autoScaling', e);
    }
  }

  public get automaticUpdate(): boolean {
    return this.#automaticUpdate;
  }

  public set automaticUpdate(value: boolean) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.GENERAL, `Api.automaticUpdate: Updating automaticUpdate to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.GENERAL, 'Api.automaticUpdate', value, 'boolean');
      this.#automaticUpdate = value;

      for (let s in this.sessions)
        this.#automaticUpdate ? this.sceneTree.addNode(this.sessions[s].node) : this.sceneTree.removeNode(this.sessions[s].node)

      this.#logger.debug(LOGGINGTOPIC.GENERAL, `Api.automaticUpdate: automaticUpdate was set to: ${value}`);
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.GENERAL, 'Api.automaticUpdate', e);
    }
  }

  public get enableAR(): boolean {
    return this.#settingsEngine.ar.enable;
  }

  public set enableAR(value: boolean) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.GENERAL, `Api.enableAR: Updating enableAR to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.GENERAL, 'Api.enableAR', value, 'boolean');
      this.#settingsEngine.ar.enable = value;
      this.#logger.debug(LOGGINGTOPIC.GENERAL, `Api.enableAR: enableAR was set to: ${value}`);
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.GENERAL, 'Api.enableAR', e);
    }
  }

  public get globalRotation(): vec3 {
    return vec3.fromValues(
      this.#settingsEngine.general.transformation.rotation.x,
      this.#settingsEngine.general.transformation.rotation.y,
      this.#settingsEngine.general.transformation.rotation.z
    )
  }

  public set globalRotation(value: vec3) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.GENERAL, `Api.globalRotation: Updating globalRotation to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.GENERAL, 'Api.globalRotation', value, 'vec3');
      this.#settingsEngine.general.transformation.rotation = { x: value[0], y: value[1], z: value[2] };
      this.#logger.debug(LOGGINGTOPIC.GENERAL, `Api.globalRotation: globalRotation was set to: ${value}`);
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.GENERAL, 'Api.globalRotation', e);
    }
  }

  public get globalScale(): vec3 {
    return vec3.fromValues(
      this.#settingsEngine.general.transformation.scale.x,
      this.#settingsEngine.general.transformation.scale.y,
      this.#settingsEngine.general.transformation.scale.z
    )
  }

  public set globalScale(value: vec3) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.GENERAL, `Api.globalScale: Updating globalScale to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.GENERAL, 'Api.globalScale', value, 'vec3');
      this.#settingsEngine.general.transformation.scale = { x: value[0], y: value[1], z: value[2] };
      this.#logger.debug(LOGGINGTOPIC.GENERAL, `Api.globalScale: globalScale was set to: ${value}`);
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.GENERAL, 'Api.globalScale', e);
    }
  }

  public get globalTranslation(): vec3 {
    return vec3.fromValues(
      this.#settingsEngine.general.transformation.translation.x,
      this.#settingsEngine.general.transformation.translation.y,
      this.#settingsEngine.general.transformation.translation.z
    )
  }

  public set globalTranslation(value: vec3) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.GENERAL, `Api.globalTranslation: Updating globalTranslation to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.GENERAL, 'Api.globalTranslation', value, 'vec3');
      this.#settingsEngine.general.transformation.translation = { x: value[0], y: value[1], z: value[2] };
      this.#logger.debug(LOGGINGTOPIC.GENERAL, `Api.globalTranslation: globalTranslation was set to: ${value}`);
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.GENERAL, 'Api.globalTranslation', e);
    }
  }

  public get loggingLevel(): LOGGINGLEVEL {
    return this.#logger.loggingLevel;
  }

  public set loggingLevel(value: LOGGINGLEVEL) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.GENERAL, `Api.loggingLevel: Updating LoggingLevel to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.GENERAL, 'Api.loggingLevel', value, 'enum', true, Object.values(LOGGINGLEVEL));
      this.#logger.loggingLevel = value;
      this.#logger.debug(LOGGINGTOPIC.GENERAL, `Api.loggingLevel: LoggingLevel was set to: ${value}`);
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.GENERAL, 'Api.loggingLevel', e);
    }
  }

  public get showMessages(): boolean {
    return this.#logger.showMessages;
  }

  public set showMessages(value: boolean) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.GENERAL, `Api.showMessages: Updating ShowMessages to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.GENERAL, 'Api.showMessages', value, 'boolean');
      this.#logger.showMessages = value;
      this.#settingsEngine.general.showMessages = this.#logger.showMessages;
      this.#logger.debug(LOGGINGTOPIC.GENERAL, `Api.showMessages: ShowMessages was set to: ${value}`);
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.GENERAL, 'Api.showMessages', e);
    }
  }

  // #endregion Public Accessors (16)

  // #region Public Methods (12)

  public addListener(type: string | MAINEVENTTYPE, cb: (event: IEvent) => void): string {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.GENERAL, `Api.addListener: Event Listener was registered for ${type}.`);
      this.#logger.debug(LOGGINGTOPIC.GENERAL, `Api.addListener: Event Listener was registered for ${type}.`);
      return this.#eventEngine.addListener(type, cb);
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.GENERAL, 'Api.addListener', e);
    }
  }

  public async applySettings(
    response: ShapeDiverResponseBase | ShapeDiverResponseDto,
    sections: {
      session?: {
        parameter?: { displayname?: boolean, order?: boolean, hidden?: boolean },
        export?: { displayname?: boolean, order?: boolean, hidden?: boolean }
      },
      viewer?: { scene?: boolean, camera?: boolean, light?: boolean, environment?: boolean }
    } =
      {
        session: {
          parameter: { displayname: false, order: false, hidden: false },
          export: { displayname: false, order: false, hidden: false }
        },
        viewer: { scene: false, camera: false, light: false, environment: false }
      }
  ): Promise<void> {
    try {
      if (sections.session === undefined) {
        sections.session = {
          parameter: { displayname: false, order: false, hidden: false },
          export: { displayname: false, order: false, hidden: false }
        };
      }
      if (sections.session.parameter === undefined)
        sections.session.parameter = { displayname: false, order: false, hidden: false };
      if (sections.session.export === undefined)
        sections.session.export = { displayname: false, order: false, hidden: false };
      if (sections.viewer === undefined)
        sections.viewer = { scene: false, camera: false, light: false, environment: false };

      let config: object;
      if ((<ShapeDiverResponseBase>response).config !== undefined) {
        config = (<ShapeDiverResponseBase>response).config!;
      } else if ((<ShapeDiverResponseDto>response).viewer !== undefined) {
        config = (<ShapeDiverResponseDto>response).viewer!.config;
      } else {
        const error = new ShapeDiverViewerSettingsError('Api.applySettings: No config object available.');
        throw this.#logger.handleError(LOGGINGTOPIC.SETTINGS, 'Api.applySettings', error);
      }

      try {
        validate(config)
      } catch (e) {
        const error = new ShapeDiverViewerSettingsError('Api.applySettings: Was not able to validate config object.');
        throw this.#logger.handleError(LOGGINGTOPIC.SETTINGS, 'Api.applySettings', error);
      }

      const settings = <ISettingsV3>convert(config, '3.0');

      const exportMappingUid: { [key: string]: string | undefined } = {};
      if (sections.session.export.displayname || sections.session.export.order || sections.session.export.hidden)
        if (response.exports)
          for (let exportId in response.exports)
            if (response.exports[exportId].uid !== undefined)
              exportMappingUid[response.exports[exportId].uid!] = exportId;

      const session = Object.values(this.sessions).filter((s: ISession) => { return s.primarySession; })[0];
      if (!session) {
        const error = new ShapeDiverViewerSettingsError('Api.applySettings: No primary session defined.');
        throw this.#logger.handleError(LOGGINGTOPIC.SETTINGS, 'Api.applySettings', error);
      }

      const currentSettings = this.#settingsEngine.settings;

      // apply parameter settings
      if (sections.session.parameter.displayname || sections.session.parameter.order || sections.session.parameter.hidden) {
        for (let p in session.parameters) {
          if (settings.session[p]) {
            if (sections.session.parameter.displayname) session.parameters[p].displayname = settings.session[p].displayname;
            if (sections.session.parameter.order) session.parameters[p].order = settings.session[p].order;
            if (sections.session.parameter.hidden) session.parameters[p].hidden = settings.session[p].hidden || false;
          }
        }
      }

      // apply export settings
      if (sections.session.export.displayname || sections.session.export.order || sections.session.export.hidden) {
        for (let p in session.exports) {
          let idForSettings = '';
          if (settings.session[p]) {
            idForSettings = p;
          } else {
            const uid = session.exports[p].uid;
            if (!uid) continue;
            if (!exportMappingUid[uid]) continue;
            idForSettings = exportMappingUid[uid]!;
          }
          if (settings.session[idForSettings]) {
            if (sections.session.parameter.displayname) session.exports[p].displayname = settings.session[idForSettings].displayname;
            if (sections.session.parameter.order) session.exports[p].order = settings.session[idForSettings].order;
            if (sections.session.parameter.hidden) session.exports[p].hidden = settings.session[idForSettings].hidden || false;
          }
        }
      }

      // apply camera settings
      if (sections.viewer.camera)
        currentSettings.camera = settings.camera;

      // apply light settings
      if (sections.viewer.light)
        currentSettings.light = settings.light;

      // apply scene settings
      if (sections.viewer.scene) {
        currentSettings.rendering.shadows = settings.rendering.shadows;
        currentSettings.rendering.ambientOcclusion = settings.rendering.ambientOcclusion;
        currentSettings.rendering.ambientOcclusionIntensity = settings.rendering.ambientOcclusionIntensity;
        currentSettings.environmentGeometry.gridVisibility = settings.environmentGeometry.gridVisibility;
        currentSettings.environmentGeometry.groundPlaneVisibility = settings.environmentGeometry.groundPlaneVisibility;
        currentSettings.general.commitParameters = settings.general.commitParameters;
        currentSettings.general.pointSize = settings.general.pointSize;
      }

      // apply environment settings
      if (sections.viewer.environment) {
        currentSettings.environment.clearAlpha = settings.environment.clearAlpha;
        currentSettings.environment.clearColor = settings.environment.clearColor;
        currentSettings.environment.map = settings.environment.map;
        currentSettings.environment.mapAsBackground = settings.environment.mapAsBackground;
      }

      const promises: Promise<void>[] = [];
      for (let v in this.viewers) {
        this.#stateEngine.viewers[v].settingsLoaded.reset();
        promises.push(new Promise<void>(resolve => {
          this.#stateEngine.viewers[v].settingsLoaded.then(() => {
            resolve();
          })
        }));

        (<Viewer>this.viewers[v]).applySettings(sections.viewer);
      }
      return new Promise(resolve => Promise.all(promises).then(() => resolve()));
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.GENERAL, 'Api.applySettings', e);
    }
  }

  public async closeSession(id: string, force = false): Promise<boolean> {
    return this._closeSession(id, force);
  }

  public async closeViewer(id: string): Promise<boolean> {
    return this._closeViewer(id);
  }

  public async convertSceneToGLTF(convertForAR = false): Promise<Blob> {
    try {
      let scalingMatrix: mat4;
      if (this.autoScaling) {
        const min = vec3.clone(this.sceneTree.root.boundingBox.min);
        const max = vec3.clone(this.sceneTree.root.boundingBox.max);
        const size = vec3.fromValues(max[0] - min[0], max[1] - min[1], max[2] - min[2]);
        const maxDimension = Math.max(size[0], Math.max(size[1], size[2]));
        scalingMatrix = mat4.fromScaling(mat4.create(), vec3.fromValues(1.0 / maxDimension, 1.0 / maxDimension, 1.0 / maxDimension));
      } else {
        scalingMatrix = mat4.fromScaling(mat4.create(), this.globalScale);
      }

      // add scaling matrix to scene tree node
      const scalingMatrixID = this.#uuidGenerator.create();
      this.sceneTree.root.transformations.push({ id: scalingMatrixID, matrix: scalingMatrix })

      // create the gltf
      const result = await this.#gltfConverter.convert(this.sceneTree.root, convertForAR);

      // remove the matrix
      for (let i = 0; i < this.sceneTree.root.transformations.length; i++)
        if (this.sceneTree.root.transformations[i].id === scalingMatrixID)
          this.sceneTree.root.transformations.splice(i, 1);

      return new Blob([result], { type: 'application/octet-stream' });
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.GENERAL, 'Api.convertSceneToGLTF', e);
    }
  }

  public createSDTFOverview(node: TreeNode = this.sceneTree.root): SDTFOverview {
    try {
      const out: SDTFAttributeOverview = new SDTFAttributeOverview({});
      for (let i = 0, len = node.data.length; i < len; i++)
        if (node.data[i] instanceof SDTFAttributeOverview)
          out.merge(<SDTFAttributeOverview>node.data[i])

      for (let i = 0, len = node.children.length; i < len; i++)
        out.merge(new SDTFAttributeOverview(this.createSDTFOverview(node.children[i])));

      return out.overview;
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.GENERAL, 'Api.createSDTFOverview', e);
    }
  }

  public async createSession(properties: { ticket: string, modelViewUrl: string, bearerToken?: string, primarySession?: boolean, id?: string, excludeViewers?: string[], waitForOutputs?: boolean, loadOutputs?: boolean, initialParameters?: { [key: string]: string } }): Promise<ISession> {
    let sessionId: string = '';
    const eventId = this.#uuidGenerator.create();
    try {
      const eventStart: ITaskEvent = { type: TASKTYPE.SESSION_CREATION, id: eventId, progress: 0, status: 'Creating session' };
      this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_START, eventStart);

      this.#logger.info(LOGGINGTOPIC.SESSION, `Api.createSession: Creating and initializing session with properties ${JSON.stringify(properties)}.`);
      // input validation
      this.#inputValidator.validateAndError(LOGGINGTOPIC.SESSION, `Api.createSession`, properties, 'object');
      this.#inputValidator.validateAndError(LOGGINGTOPIC.SESSION, `Api.createSession`, properties.ticket, 'string');
      this.#inputValidator.validateAndError(LOGGINGTOPIC.SESSION, `Api.createSession`, properties.modelViewUrl, 'string');
      this.#inputValidator.validateAndError(LOGGINGTOPIC.SESSION, `Api.createSession`, properties.bearerToken, 'string', false);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.SESSION, `Api.createSession`, properties.primarySession, 'boolean', false);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.SESSION, `Api.createSession`, properties.excludeViewers, 'stringArray', false);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.SESSION, `Api.createSession`, properties.id, 'string', false);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.SESSION, `Api.createSession`, properties.waitForOutputs, 'boolean', false);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.SESSION, `Api.createSession`, properties.loadOutputs, 'boolean', false);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.SESSION, `Api.createSession`, properties.initialParameters, 'object', false);
      if (properties.initialParameters)
        for (let p in properties.initialParameters)
          this.#inputValidator.validateAndError(LOGGINGTOPIC.SESSION, `Api.createSession`, properties.initialParameters[p], 'string');

      // check if the given id is valid
      sessionId = properties.id || (<UuidGenerator>container.resolve(UuidGenerator)).create();
      if (this.sessions[sessionId]) {
        const eventClose: ITaskEvent = { type: TASKTYPE.SESSION_CREATION, id: eventId, progress: 0.1, status: 'Closing session with same id' };
        this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_PROCESS, eventClose);

        this.#logger.warn(LOGGINGTOPIC.SESSION, `Api.createSession: Session with this id (${sessionId}) already exists. Closing initial instance.`);
        await this._closeSession(sessionId, true);
      }

      let noPrimarySession = true;
      for (let s in this.sessions)
        if (this.sessions[s].primarySession)
          noPrimarySession = false;

      let primarySessionRequest = properties.primarySession !== false;
      this.#stateEngine.sessions[sessionId] = {
        id: sessionId,
        primary: !!(primarySessionRequest && noPrimarySession),
        initialized: new StatePromise(),
        settingsRegistered: new StatePromise()
      }

      if (!!(primarySessionRequest && noPrimarySession)) this.#stateEngine.primarySessionAvailable.resolve(true);

      // create the actual session 
      let sessionCallbacks = {};
      const session = new Session(Object.assign({}, properties, { id: sessionId }));

      // save the session
      this.sessions[sessionId] = session;

      const eventInit: ITaskEvent = { type: TASKTYPE.SESSION_CREATION, id: eventId, progress: 0.25, status: 'Initializing session' };
      this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_PROCESS, eventInit);

      await session.init(properties.waitForOutputs, properties.loadOutputs, properties.initialParameters);

      this.#eventEngine.emitEvent(EVENTTYPE.SESSION.SESSION_CREATED, { sessionId });
      this.#stateEngine.sessions[sessionId].initialized.resolve(true);
      this.#logger.debug(LOGGINGTOPIC.SESSION, `Api.createSession: Session(${session.id}) created.`);

      const eventEnd: ITaskEvent = { type: TASKTYPE.SESSION_CREATION, id: eventId, progress: 1, status: 'Session created' };
      this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_END, eventEnd);

      return session;
    } catch (e) {
      // special behavior, if this was the only session, display the error on the logo screen
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) {
        if ((this.sessions[sessionId] && Object.values(this.sessions).length === 1) || (!this.sessions[sessionId] && Object.values(this.sessions).length === 0)) {
          for (let v in this.viewers)
            this.viewers[v].displayErrorMessage(e.message);
        }
      }

      const eventCancel1: ITaskEvent = { type: TASKTYPE.SESSION_CREATION, id: eventId, progress: 0.9, status: 'Session created failed, closing session' };
      this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_PROCESS, eventCancel1);

      await this._closeSession(sessionId, true);

      const eventCancel2: ITaskEvent = { type: TASKTYPE.SESSION_CREATION, id: eventId, progress: 1, status: 'Session created failed' };
      this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_CANCEL, eventCancel2);

      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.GENERAL, 'Api.createSession', e);
    }
  }

  public async createViewer(properties?: { visibility?: VISIBILITYMODE, canvas?: HTMLCanvasElement, id?: string, branding?: { logo?: string | null, backgroundColor?: string } }): Promise<IViewer> {
    let viewerId: string = '';
    const eventId = this.#uuidGenerator.create();
    try {
      const eventStart: ITaskEvent = { type: TASKTYPE.VIEWER_CREATION, id: eventId, progress: 0, status: 'Creating viewer' };
      this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_START, eventStart);

      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, 'Api.createViewer', properties, 'object', false);
      const prop = Object.assign({}, properties);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Api.createViewer`, prop.visibility, 'enum', false, Object.values(VISIBILITYMODE));
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Api.createViewer`, prop.canvas, 'HTMLCanvasElement', false);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Api.createViewer`, prop.id, 'string', false);

      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, 'Api.createViewer', prop.branding, 'object', false);
      const branding = Object.assign({}, prop.branding);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Api.createViewer`, branding.backgroundColor, 'string', false);

      // check if the given id is valid
      const viewerId = prop.id || (<UuidGenerator>container.resolve(UuidGenerator)).create();
      if (this.viewers[viewerId]) {
        const eventClose: ITaskEvent = { type: TASKTYPE.VIEWER_CREATION, id: eventId, progress: 0.1, status: 'Closing viewer with same id' };
        this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_PROCESS, eventClose);

        this.#logger.warn(LOGGINGTOPIC.SESSION, `Api.createViewer: Viewer with this id (${viewerId}) already exists. Closing initial instance.`);
        await this._closeViewer(viewerId, true);
      }

      this.#stateEngine.viewers[viewerId] = {
        id: viewerId,
        initialized: new StatePromise(),
        environmentMapLoaded: new StatePromise(),
        settingsLoaded: new StatePromise()
      }

      // create the actual viewer
      let viewer: IViewer = new Viewer({
        id: viewerId,
        canvas: prop.canvas,
        visibility: prop.visibility || VISIBILITYMODE.SESSION,
        branding: {
          logo: branding.logo === undefined ? this.#defaultLogo : branding.logo,
          backgroundColor: branding.backgroundColor || '#030531FF'
        }
      });

      if ((prop.visibility || VISIBILITYMODE.SESSION) === VISIBILITYMODE.SESSION && this.#stateEngine.primarySession && this.#stateEngine.primarySession.initialized.resolved === true) {
        const eventEnd: ITaskEvent = { type: TASKTYPE.VIEWER_CREATION, id: eventId, progress: 0.75, status: 'Waiting for primary session settings' };
        this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_PROCESS, eventEnd);

        await new Promise<void>(resolve => {
          this.#stateEngine.viewers[viewerId].settingsLoaded.then(() => resolve())
        })
      }

      // save the viewer
      this.viewers[viewerId] = viewer;

      viewer.update();

      this.#eventEngine.emitEvent(EVENTTYPE.VIEWER.VIEWER_CREATED, { viewerId });
      this.#stateEngine.viewers[viewerId].initialized.resolve(true);

      this.#logger.debug(LOGGINGTOPIC.VIEWER, `Api.createViewer: Viewer(${viewer.id}) created.`);

      const eventEnd: ITaskEvent = { type: TASKTYPE.VIEWER_CREATION, id: eventId, progress: 1, status: 'Viewer created' };
      this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_END, eventEnd);

      return this.viewers[viewerId];
    } catch (e) {
      const eventCancel1: ITaskEvent = { type: TASKTYPE.VIEWER_CREATION, id: eventId, progress: 0.9, status: 'Viewer created failed, closing viewer' };
      this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_PROCESS, eventCancel1);

      try { await this._closeViewer(viewerId, true); } catch { }

      const eventCancel2: ITaskEvent = { type: TASKTYPE.VIEWER_CREATION, id: eventId, progress: 1, status: 'Viewer created failed, exiting' };
      this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_CANCEL, eventCancel2);

      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.GENERAL, 'Api.createViewer', e);
    }
  }

  public removeListener(id: string): boolean {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.GENERAL, `Api.removeListener: Removing event listener with id ${id}.`);
      return this.#eventEngine.removeListener(id);
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.GENERAL, 'Api.removeListener', e);
    }
  }

  public update(): void {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Api.update: Updating all viewers.`);
      for (let v in this.viewers)
        this.viewers[v].update();
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.GENERAL, 'Api.update', e);
    }
  }

  public async viewInAR(options: { arScale?: 'auto' | 'fixed', arPlacement?: 'floor' | 'wall', xrEnvironment?: boolean } = { arScale: 'fixed', arPlacement: 'floor', xrEnvironment: false }): Promise<void> {
    const eventId = this.#uuidGenerator.create();
    try {
      const event: ITaskEvent = { type: TASKTYPE.AR_LOADING, id: eventId, progress: 0, status: 'Loading AR scene' };
      this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_START, event);

      // if this is not a supported device, throw an error
      if (this.viewableInAR() === false) {
        const event: ITaskEvent = { type: TASKTYPE.AR_LOADING, id: eventId, progress: 1, status: 'Stopped AR loading due to an error' };
        this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_CANCEL, event);
        const error = new ShapeDiverViewerArError('Api.viewInAR: The device or browser is not supported for this functionality, please call "viewableInAR" for more information.');
        throw this.#logger.handleError(LOGGINGTOPIC.AR, 'Api.viewInAR', error, false);
      }

      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, 'Api.viewInAR', options, 'object', false);
      const arScale = options.arScale !== 'auto' ? 'fixed' : 'auto';
      const arPlacement = options.arPlacement !== 'wall' ? 'floor' : 'wall';
      const xrEnvironment = options.xrEnvironment !== true ? false : true;

      // try to find a session that is "AR-ready"
      // as a backend might be used that does not support uploading the gltf (and conversion)
      // we have to do this check and abort if none is found
      let arSession;
      for (let s in this.sessions) {
        if (this.sessions[s].canUploadGLTF) {
          arSession = this.sessions[s];
          break;
        }
      }

      if (!arSession) {
        const event: ITaskEvent = { type: TASKTYPE.AR_LOADING, id: eventId, progress: 1, status: 'Stopped AR loading due to an error' };
        this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_CANCEL, event);
        const error = new ShapeDiverViewerArError('Api.viewInAR: None of the sessions that are registered are capable of using the AR feature.');
        throw this.#logger.handleError(LOGGINGTOPIC.AR, 'Api.viewInAR', error, false);
      }

      let arEnvironment = '';
      for (let v in this.viewers) {
        if (!arSession.node.excludeViewers.includes(this.viewers[v].id)) {
          const envMapUrl = this.viewers[v].getEnvironmentMapImageUrl();
          if (envMapUrl !== '') {
            if (envMapUrl.endsWith('.hdr')) {
              arEnvironment = 'skybox-image=' + envMapUrl;
            } else {
              arEnvironment = 'environment-image=' + envMapUrl;
            }
          }
          break;
        }
      }

      // register the busy mode to blur the scene and create a visual feedback
      const busyModeID = this.#uuidGenerator.create();
      for (let v in this.viewers)
        this.viewers[v].registerBusyMode(busyModeID)

      // convert and upload (and maybe convert to usdz) the file
      const file = await arSession.uploadGLTF(this.#systemInfo.isIOS ? ShapeDiverRequestGltfUploadQueryConversion.USDZ : ShapeDiverRequestGltfUploadQueryConversion.NONE, eventId);

      if (this.#systemInfo.isIOS) {
        // create the link and click it
        const a = document.createElement('a');
        a.href = file + (arScale === 'fixed' ? '.usdz#allowsContentScaling=0' : '.usdz')
        a.rel = 'ar';
        const img = document.createElement('img');
        img.src = this.#defaultLogo;
        a.appendChild(img);
        a.click();
      } else {
        const a = document.createElement('a');
        a.href = `intent://arvr.google.com/scene-viewer/1.0?resizable=${arScale === 'fixed' ? 'false' : 'true'}&file=${file}&mode=ar_only#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;end;`
        a.click();
      }

      for (let v in this.viewers)
        this.viewers[v].deregisterBusyMode(busyModeID)

      const event2: ITaskEvent = { type: TASKTYPE.AR_LOADING, id: eventId, progress: 1, status: 'Done loading AR scene, launching AR' };
      this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_END, event2);

    } catch (e) {
      const event: ITaskEvent = { type: TASKTYPE.AR_LOADING, id: eventId, progress: 1, status: 'Stopped AR loading due to an error' };
      this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_CANCEL, event);

      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.GENERAL, 'Api.viewInAR', e);
    }
  }

  public viewableInAR(): boolean {
    try {
      // has to be a mobile device (duh)
      if (this.#systemInfo.isIOS === false && this.#systemInfo.isAndroid === false)
        return false;

      // no Firefox on Android
      if (this.#systemInfo.isAndroid === true && this.#systemInfo.isFirefox === true)
        return false;

      // no Firefox on iOS
      if (this.#systemInfo.isIOS === true && this.#systemInfo.isFirefox === true)
        return false;

      return true;
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.GENERAL, 'Api.viewableInAR', e);
    }
  }

  // #endregion Public Methods (12)

  // #region Private Methods (2)

  private async _closeSession(id: string, force = false): Promise<boolean> {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.SESSION, `Api.closeSession: Closing session ${id}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.SESSION, 'Api.closeSession', id, 'string');
      if (!this.sessions[id]) {
        this.#logger.warn(LOGGINGTOPIC.SESSION, `Api.closeSession: Session with id ${id} was not registered.`);
        return false;
      }

      if (force === false && this.#stateEngine.sessions[id].initialized.resolved === false)
        await new Promise<void>(resolve => { this.#stateEngine.sessions[id].initialized.then(() => resolve()) })

      let result = false;
      if (force === false) {
        result = await this.sessions[id].close();
      } else {
        try { result = await this.sessions[id].close(); } catch { }
      }

      this.#stateEngine.sessions[id].settingsRegistered.reset();

      if (this.sessions[id].primarySession) {
        this.#stateEngine.primarySessionAvailable.reset();
        this.#stateEngine.boundingBoxCreated.reset();
        for (let v in this.viewers)
          this.viewers[v].reset();
      }

      (<any>this.sessions[id]) = undefined;
      delete this.sessions[id];
      delete this.#stateEngine.sessions[id];

      this.#logger.debug(LOGGINGTOPIC.SESSION, `Session(${id}): Session closed.`);

      for (let s in this.sessions) {
        const session = this.sessions[s];
        if (session.primarySessionRequest) {
          await this.sessions[s].setAsPrimary();
          this.#stateEngine.primarySessionAvailable.resolve(true);
          this.#logger.debug(LOGGINGTOPIC.SESSION, `Session(${s}): Initializing settings.`);
          break;
        }
      }

      return result;
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.GENERAL, 'Api.closeSession', e);
    }
  }

  private async _closeViewer(id: string, force = false): Promise<boolean> {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Api.closeViewer: Closing viewer ${id}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, 'Api.closeViewer', id, 'string');
      if (!this.viewers[id]) {
        this.#logger.warn(LOGGINGTOPIC.VIEWER, `Api.closeViewer: Viewer with id ${id} was not registered`);
        return false;
      }

      if (force === false && this.#stateEngine.viewers[id].initialized.resolved === false)
        await new Promise<void>(resolve => { this.#stateEngine.viewers[id].initialized.then(() => resolve()) })

      this.#stateEngine.viewers[id].settingsLoaded.reset();
      let result = false;
      if (force === false) {
        result = await this.viewers[id].close();
      } else {
        try { result = await this.viewers[id].close(); } catch { }
      }
      (<any>this.viewers[id]) = undefined;
      delete this.viewers[id];

      delete this.#stateEngine.viewers[id];
      this.#logger.debug(LOGGINGTOPIC.VIEWER, `Viewer(${id}): Viewer closed.`);
      return result;
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.GENERAL, 'Api.closeViewer', e);
    }
  }

  // #endregion Private Methods (2)
}