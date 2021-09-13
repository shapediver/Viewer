import { Tree } from '@shapediver/viewer.shared.node-tree'
import { container, singleton } from 'tsyringe'
import { GeometryEngine } from '@shapediver/viewer.data-engine.geometry-engine'
import {
  EventEngine,
  EVENTTYPE,
  IEvent,
  InputValidator,
  ISessionEvent,
  IViewerEvent,
  Logger,
  LOGGINGLEVEL,
  LOGGINGTOPIC,
  MAINEVENTTYPE,
  SDError,
  SettingsEngine,
  StateEngine,
  SystemInfo,
  UuidGenerator,
} from '@shapediver/viewer.shared.services'
import { RENDERERTYPE } from '@shapediver/viewer.rendering-engine.rendering-engine'
import { VISIBILITYMODE } from '@shapediver/viewer.rendering-engine.rendering-engine'
import { build_data } from '@shapediver/viewer.shared.build-data'
import { ShapeDiverResponseBase } from '@shapediver/api.geometry-api-dto-v1'
import { convert, ISettingsV3, validate } from '@shapediver/viewer.settings'
import { mat4, vec3 } from 'gl-matrix'

import { IApi } from '../interfaces/IApi'
import { ISession } from '../interfaces/session/ISession'
import { IViewer } from '../interfaces/viewer/IViewer'
import { Viewer } from './viewer/Viewer'
import { Session } from './session/Session'

@singleton()
export class Api implements IApi {
  // #region Properties (13)

  readonly #defaultLogo: string = 'https://d2tuv7fwq0eipl.cloudfront.net/production/assets/img/icon_logo_white.png';
  readonly #eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);
  readonly #geometryEngine: GeometryEngine = <GeometryEngine>container.resolve(GeometryEngine);
  readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
  readonly #logger: Logger = <Logger>container.resolve(Logger);
  readonly #sessionCallbacks: { [key: string]: { [key: string]: () => any } } = {};
  readonly #settingsEngine: SettingsEngine = <SettingsEngine>container.resolve(SettingsEngine);
  readonly #stateEngine: StateEngine = <StateEngine>container.resolve(StateEngine);
  readonly #systemInfo: SystemInfo = <SystemInfo>container.resolve(SystemInfo);
  readonly #uuidGenerator: UuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);
  readonly #viewerCallbacks: { [key: string]: { [key: string]: () => any } } = {};
  readonly sceneTree: Tree = <Tree>container.resolve(Tree);
  readonly sessions: { [key: string]: ISession } = {};
  readonly viewers: { [key: string]: IViewer } = {};

  // #endregion Properties (13)

  // #region Constructors (1)

  /**
   * @ignore
   */
  constructor() {
    try {
      this.#stateEngine.primarySettingsRegistered.then(() => {
        this.showMessages = this.#settingsEngine.general.showMessages;
      })
      this.#logger.info(LOGGINGTOPIC.GENERAL, `Viewer version: ${build_data.build_version}`);

      this.#eventEngine.addListener(EVENTTYPE.SETTINGS.SETTINGS_REGISTERED, (e) => { 
        const sessionEvent: ISessionEvent = <ISessionEvent>e;
        if(sessionEvent.sessionId)
          if(this.sessions[sessionEvent.sessionId].primarySession)
            this.#stateEngine.primarySettingsRegistered.resolve(true);
        if(sessionEvent.sessionId) 
          this.#stateEngine.getCustomState((<any>e).sessionId + '_settings_registered').resolve(true);
      })
      this.#eventEngine.addListener(EVENTTYPE.SESSION.SESSION_INITIALIZED, (e) => { 
        const sessionEvent: ISessionEvent = <ISessionEvent>e;
        if(sessionEvent.sessionId)
          if(this.sessions[sessionEvent.sessionId].primarySession) this.#stateEngine.primarySessionLoaded.resolve(true);
      })

      this.#logger.debugLow(LOGGINGTOPIC.GENERAL, `Api.constructor: Api created.`);
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.GENERAL, e, `Api.constructor: Something unexpected happened.`, true)
    }
  }

  // #endregion Constructors (1)

  // #region Public Accessors (14)

  /**
   * Getter autoScaling
   */
  public get autoScaling(): boolean {
    return this.#settingsEngine.ar.autoScaling;
  }

  /**
   * Setter autoScaling
   */
  public set autoScaling(value: boolean) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.GENERAL, `Api.autoScaling: Updating autoScaling to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.GENERAL, 'Api.autoScaling', value, 'boolean');
      this.#settingsEngine.ar.autoScaling = value;
      this.#logger.info(LOGGINGTOPIC.GENERAL, `Api.autoScaling: autoScaling was set to: ${value}`);
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.GENERAL, e, `Api.autoScaling: Something unexpected happened.`, true)
    }
  }

  /**
   * Getter enableAR
   */
  public get enableAR(): boolean {
    return this.#settingsEngine.ar.enable;
  }

  /**
   * Setter enableAR
   */
  public set enableAR(value: boolean) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.GENERAL, `Api.enableAR: Updating enableAR to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.GENERAL, 'Api.enableAR', value, 'boolean');
      this.#settingsEngine.ar.enable = value;
      this.#logger.info(LOGGINGTOPIC.GENERAL, `Api.enableAR: enableAR was set to: ${value}`);
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.GENERAL, e, `Api.enableAR: Something unexpected happened.`, true)
    }
  }

  /**
   * Getter globalRotation
   */
  public get globalRotation(): vec3 {
    return vec3.fromValues(
      this.#settingsEngine.general.transformation.rotation.x,
      this.#settingsEngine.general.transformation.rotation.y,
      this.#settingsEngine.general.transformation.rotation.z
    )
  }

  /**
   * Setter globalRotation
   */
  public set globalRotation(value: vec3) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.GENERAL, `Api.globalRotation: Updating globalRotation to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.GENERAL, 'Api.globalRotation', value, 'vec3');
      this.#settingsEngine.general.transformation.rotation = { x: value[0], y: value[1], z: value[2] };
      this.#logger.info(LOGGINGTOPIC.GENERAL, `Api.globalRotation: globalRotation was set to: ${value}`);
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.GENERAL, e, `Api.globalRotation: Something unexpected happened.`, true)
    }
  }

  /**
   * Getter globalScale
   */
  public get globalScale(): vec3 {
    return vec3.fromValues(
      this.#settingsEngine.general.transformation.scale.x,
      this.#settingsEngine.general.transformation.scale.y,
      this.#settingsEngine.general.transformation.scale.z
    )
  }

  /**
   * Setter globalScale
   */
  public set globalScale(value: vec3) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.GENERAL, `Api.globalScale: Updating globalScale to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.GENERAL, 'Api.globalScale', value, 'vec3');
      this.#settingsEngine.general.transformation.scale = { x: value[0], y: value[1], z: value[2] };
      this.#logger.info(LOGGINGTOPIC.GENERAL, `Api.globalScale: globalScale was set to: ${value}`);
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.GENERAL, e, `Api.globalScale: Something unexpected happened.`, true)
    }
  }

  /**
   * Getter globalTranslation
   */
  public get globalTranslation(): vec3 {
    return vec3.fromValues(
      this.#settingsEngine.general.transformation.translation.x,
      this.#settingsEngine.general.transformation.translation.y,
      this.#settingsEngine.general.transformation.translation.z
    )
  }

  /**
   * Setter globalTranslation
   */
  public set globalTranslation(value: vec3) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.GENERAL, `Api.globalTranslation: Updating globalTranslation to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.GENERAL, 'Api.globalTranslation', value, 'vec3');
      this.#settingsEngine.general.transformation.translation = { x: value[0], y: value[1], z: value[2] };
      this.#logger.info(LOGGINGTOPIC.GENERAL, `Api.globalTranslation: globalTranslation was set to: ${value}`);
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.GENERAL, e, `Api.globalTranslation: Something unexpected happened.`, true)
    }
  }

  /**
   * Getter loggingLevel
   */
  public get loggingLevel(): LOGGINGLEVEL {
    return this.#logger.loggingLevel;
  }

  /**
   * Setter loggingLevel
   */
  public set loggingLevel(value: LOGGINGLEVEL) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.GENERAL, `Api.loggingLevel: Updating LoggingLevel to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.GENERAL, 'Api.loggingLevel', value, 'enum', true, Object.values(LOGGINGLEVEL));
      this.#logger.loggingLevel = value;
      this.#logger.info(LOGGINGTOPIC.GENERAL, `Api.loggingLevel: LoggingLevel was set to: ${value}`);
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.GENERAL, e, `Api.loggingLevel: Something unexpected happened.`, true)
    }
  }

  /**
   * Getter showMessages
   */
  public get showMessages(): boolean {
    return this.#logger.showMessages;
  }

  /**
   * Setter showMessages
   */
  public set showMessages(value: boolean) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.GENERAL, `Api.showMessages: Updating ShowMessages to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.GENERAL, 'Api.showMessages', value, 'boolean');
      this.#logger.showMessages = value;
      this.#settingsEngine.general.showMessages = this.#logger.showMessages;
      this.#logger.info(LOGGINGTOPIC.GENERAL, `Api.showMessages: ShowMessages was set to: ${value}`);
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.GENERAL, e, `Api.showMessages: Something unexpected happened.`, true)
    }
  }

  // #endregion Public Accessors (14)

  // #region Public Methods (10)

  public addListener(type: string | MAINEVENTTYPE, cb: (event: IEvent) => void): string {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.GENERAL, `Api.addListener: Event Listener was registered for ${type}.`);
      this.#logger.info(LOGGINGTOPIC.GENERAL, `Api.addListener: Event Listener was registered for ${type}.`);
      return this.#eventEngine.addListener(type, cb);
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.GENERAL, e, `Api.addListener: Something unexpected happened.`, true)
    }
  }

  public async applySettings( 
    response: ShapeDiverResponseBase, 
    sections: { 
      session: { 
        parameter: { displayname: boolean, order: boolean, hidden: boolean },
        export: { displayname: boolean, order: boolean, hidden: boolean }
      },
      viewer: { scene: boolean, camera: boolean, light: boolean, environment: boolean }
    } = 
    {
      session: {
        parameter: { displayname: true, order: true, hidden: true },
        export: { displayname: true, order: true, hidden: true }
      },
      viewer: { scene: true, camera: true, light: true, environment: true }
    }
  ): Promise<void> {
    try {
      if(!response.config) throw new SDError('Api.applySettings: No config object available.')
      try {
        validate(response.config)
      } catch(e) {
        throw new SDError('Api.applySettings: Was not able to validate config object.')
      }

      const settings = <ISettingsV3>convert(response.config, '3.0');

      const exportMappingUid: { [key: string]: string | undefined } = {};
      if(sections.session.export.displayname || sections.session.export.order || sections.session.export.hidden)
        if (response.exports) 
          for (let exportId in response.exports) 
            if(response.exports[exportId].uid !== undefined)
              exportMappingUid[response.exports[exportId].uid!] = exportId;

      const session = Object.values(this.sessions).filter((s: ISession) => { return s.primarySession; })[0];
      if(!session) throw new SDError('Api.applySettings: No primary session defined.');
    
      const currentSettings = this.#settingsEngine.settings;

      // apply parameter settings
      if (sections.session.parameter.displayname || sections.session.parameter.order || sections.session.parameter.hidden) {
        for (let p in session.parameters) {
          if (settings.session[p]) {
            if (sections.session.parameter.displayname) session.parameters[p].displayname = settings.session[p].displayname;
            if (sections.session.parameter.order) session.parameters[p].order = settings.session[p].order;
            if (sections.session.parameter.hidden) session.parameters[p].hidden = settings.session[p].hidden;
          }
        }
      }

      // apply export settings
      if (sections.session.export.displayname || sections.session.export.order || sections.session.export.hidden) {
        for (let p in session.exports) {
          let idForSettings = '';
          if(settings.session[p]) {
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
            if (sections.session.parameter.hidden) session.exports[p].hidden = settings.session[idForSettings].hidden;
          }
        }
      }

      // apply camera settings
      if(sections.viewer.camera)
        currentSettings.camera = settings.camera;

      // apply light settings
      if(sections.viewer.light)
        currentSettings.light = settings.light;
        
      // apply scene settings
      if(sections.viewer.scene) {
        currentSettings.rendering.shadows = settings.rendering.shadows;
        currentSettings.rendering.ambientOcclusion = settings.rendering.ambientOcclusion;
        currentSettings.environmentGeometry.gridVisibility = settings.environmentGeometry.gridVisibility;
        currentSettings.environmentGeometry.groundPlaneVisibility = settings.environmentGeometry.groundPlaneVisibility;
        currentSettings.general.commitParameters = settings.general.commitParameters;
        currentSettings.general.pointSize = settings.general.pointSize;
      }

      // apply environment settings
      if(sections.viewer.environment) {
        currentSettings.environment.clearAlpha = settings.environment.clearAlpha;
        currentSettings.environment.clearColor = settings.environment.clearColor;
        currentSettings.environment.map = settings.environment.map;
        currentSettings.environment.mapAsBackground = settings.environment.mapAsBackground;
      }

      const promises: Promise<void>[] = [];
      for(let v in this.viewers) {
        this.#stateEngine.getCustomState(v + '_settings_loaded').reset();
        promises.push(new Promise<void>(resolve => {
          this.#stateEngine.getCustomState(v + '_settings_loaded').then(() => {
            resolve();
          })
        }));
      }
      this.#eventEngine.emitEvent(EVENTTYPE.SETTINGS.SETTINGS_REGISTERED_EXTERNAL, { sessionId: '' });
      return new Promise(resolve => Promise.all(promises).then(() => resolve()));
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.GENERAL, e, `Api.applySettings: Something unexpected happened.`, true)
    }
  }

  public async closeSession(id: string): Promise<boolean> {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.SESSION, `Api.closeSession: Closing session ${id}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.SESSION, 'Api.closeSession', id, 'string');
      if (!this.sessions[id]){
        this.#logger.warn(LOGGINGTOPIC.SESSION, `Api.closeSession: Session with id ${id} was not registered.`);
        return false;
      }

      const result = await this.#sessionCallbacks[id].close();
      if(this.#stateEngine.getCustomState(id + '_settings_registered'))
        this.#stateEngine.getCustomState(id + '_settings_registered').reset();

      if (this.sessions[id].primarySession) {
        this.#stateEngine.primarySessionLoaded.reset();
        this.#stateEngine.primarySettingsRegistered.reset();
        this.#stateEngine.boundingBoxCreated.reset();
        for (let v in this.viewers)
          this.viewers[v].reset();
      }

      (<any>this.#sessionCallbacks[id]) = undefined;
      delete this.#sessionCallbacks[id];
      (<any>this.sessions[id]) = undefined;
      delete this.sessions[id];

      this.#logger.info(LOGGINGTOPIC.SESSION, `Session(${id}): Session closed.`);

      for (let s in this.sessions) {
        const session = this.sessions[s];
        if (session.primarySessionRequest) {
          await this.#sessionCallbacks[s].setAsPrimary();
          this.#logger.info(LOGGINGTOPIC.SESSION, `Session(${s}): Initializing settings.`);
          break;
        }
      }

      return result;
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.SESSION, e, `Api.closeSession: Something unexpected happened.`, true)
    }
  }

  public async closeViewer(id: string): Promise<boolean> {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Api.closeViewer: Closing viewer ${id}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, 'Api.closeViewer', id, 'string');
      if (!this.viewers[id]) {
        this.#logger.info(LOGGINGTOPIC.VIEWER, `Api.closeViewer: Viewer with id ${id} was not registered`);
        return false;
      }

      if(this.#stateEngine.getCustomState(id + '_settings_loaded'))
        this.#stateEngine.getCustomState(id + '_settings_loaded').reset();
      this.#stateEngine.firstViewerShown.reset();
      const result = await this.#viewerCallbacks[id].close();
      (<any>this.#viewerCallbacks[id]) = undefined;
      delete this.#viewerCallbacks[id];
      (<any>this.viewers[id]) = undefined;
      delete this.viewers[id];

      this.#logger.info(LOGGINGTOPIC.VIEWER, `Viewer(${id}): Viewer closed.`);
      return result;
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Api.closeViewer: Something unexpected happened.`, true)
    }
  }

  public async convertSceneToGLTF(): Promise<Blob> {
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
      const result = await this.#geometryEngine.convertSceneToGLTF(this.sceneTree.root);

      // remove the matrix
      for(let i = 0; i < this.sceneTree.root.transformations.length; i++)
        if(this.sceneTree.root.transformations[i].id === scalingMatrixID)
          this.sceneTree.root.transformations.splice(i, 1);

      return new Blob([result], { type: 'application/octet-stream' });
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Api.convertSceneToGLTF: Something unexpected happened.`, true)
    }
  }

  public async createSession(properties: { ticket: string, modelViewUrl: string, bearerToken?: string, primarySession?: boolean, id?: string, excludeViewers?: string[] }): Promise<ISession> {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.SESSION, `Api.createSession: Creating and initializing session with properties ${JSON.stringify(properties)}.`);
      // input validation
      this.#inputValidator.validateAndError(LOGGINGTOPIC.SESSION, `Api.createSession`, properties, 'object');
      this.#inputValidator.validateAndError(LOGGINGTOPIC.SESSION, `Api.createSession`, properties.ticket, 'string');
      this.#inputValidator.validateAndError(LOGGINGTOPIC.SESSION, `Api.createSession`, properties.modelViewUrl, 'string');
      this.#inputValidator.validateAndError(LOGGINGTOPIC.SESSION, `Api.createSession`, properties.bearerToken, 'string', false);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.SESSION, `Api.createSession`, properties.primarySession, 'boolean', false);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.SESSION, `Api.createSession`, properties.excludeViewers, 'stringArray', false);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.SESSION, `Api.createSession`, properties.id, 'string', false);

      // check if the given id is valid
      const sessionId = properties.id || (<UuidGenerator>container.resolve(UuidGenerator)).create();
      if (this.sessions[sessionId]) {
        const error = new SDError(`Api.createSession: Session with this id (${sessionId}) already exists.`);
        this.#logger.warn(LOGGINGTOPIC.SESSION, error.message);
        throw error;
      }

      // create the actual session 
      let sessionCallbacks = {};
      const session = new Session(Object.assign({}, properties, { id: sessionId }), sessionCallbacks);
      this.#eventEngine.emitEvent(EVENTTYPE.SESSION.SESSION_CREATED, { sessionId });

      // save the session
      this.sessions[sessionId] = session;
      this.#sessionCallbacks[sessionId] = sessionCallbacks;

      await session.init();
      this.#logger.info(LOGGINGTOPIC.SESSION, `Api.createSession: Session(${session.id}) created.`);
      return session;
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.SESSION, e, `Api.createSession: Something unexpected happened.`, true)
    }
  }

  public async createViewer(properties?: { type?: RENDERERTYPE, visibility?: VISIBILITYMODE, canvas?: HTMLCanvasElement, id?: string, logo?: string }): Promise<IViewer> {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Api.createViewer: Creating and initializing viewer with properties ${JSON.stringify(properties)}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, 'Api.createViewer', properties, 'object', false);
      const prop = Object.assign({}, properties);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Api.createViewer`, prop.type, 'enum', false, Object.values(RENDERERTYPE));
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Api.createViewer`, prop.visibility, 'enum', false, Object.values(VISIBILITYMODE));
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Api.createViewer`, prop.canvas, 'HTMLCanvasElement', false);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Api.createViewer`, prop.id, 'string', false);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Api.createViewer`, prop.logo, 'string', false);

      // check if the given id is valid
      const viewerId = prop.id || (<UuidGenerator>container.resolve(UuidGenerator)).create();
      if (this.viewers[viewerId]) {
        const error = new SDError(`Api.createViewer: Viewer with this id (${viewerId}) already exists.`);
        this.#logger.warn(LOGGINGTOPIC.SESSION, error.message);
        throw error;
      }

      // create the actual viewer
      let viewerCallbacks = {};
      const viewer = new Viewer({ id: viewerId, canvas: prop.canvas, visibility: prop.visibility || VISIBILITYMODE.SESSION, type: prop.type || RENDERERTYPE.STANDARD, logo: prop.logo || this.#defaultLogo }, viewerCallbacks);
      this.#eventEngine.emitEvent(EVENTTYPE.VIEWER.VIEWER_CREATED, { viewerId });

      if (prop.visibility === VISIBILITYMODE.SESSION && this.#stateEngine.primarySessionLoaded.resolved === true) {
        await new Promise<void>(resolve => {
          this.#stateEngine.getCustomState(viewerId + '_settings_loaded').then(() => resolve())
        })
      }

      // save the viewer
      this.viewers[viewerId] = viewer;
      this.#viewerCallbacks[viewerId] = viewerCallbacks;

      viewer.update();
      this.#eventEngine.emitEvent(EVENTTYPE.VIEWER.VIEWER_INITIALIZED, { viewerId });

      this.#logger.info(LOGGINGTOPIC.VIEWER, `Api.createViewer: Viewer(${viewer.id}) created.`);
      return this.viewers[viewerId];
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Api.createViewer: Something unexpected happened.`, true)
    }
  }

  public removeListener(id: string): boolean {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.GENERAL, `Api.removeListener: Removing event listener with id ${id}.`);
      return this.#eventEngine.removeListener(id);
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.GENERAL, e, `Api.removeListener: Something unexpected happened.`, true)
    }
  }

  public update(): void {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Api.update: Updating all viewers.`);
      for (let v in this.viewers)
        this.viewers[v].update();
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Api.update: Something unexpected happened.`, true)
    }
  }

  public viewableInAR(): boolean {
    try {
      const isIOSSafari = this.#systemInfo.isIOS && this.#systemInfo.isSafari;
      const isAndroidChrome = this.#systemInfo.isAndroid && this.#systemInfo.isChrome;

      // if this is a supported device, return true
      if(isIOSSafari || isAndroidChrome)
        return true;

      if(this.#systemInfo.isIOS)
        throw new SDError(`Api.viewableInAR: The AR feature on iOS is only supported in Safari. Please open this page again in Safari.`);
        
      if(this.#systemInfo.isSafari)
        throw new SDError(`Api.viewableInAR: The AR feature in Safari is only supported on iOS devices. Please open this page again on an iOS device.`);
        
      if(this.#systemInfo.isAndroid)
        throw new SDError(`Api.viewableInAR: The AR feature on Android is only supported in Chrome. Please open this page again in Chrome.`);
      
      if(this.#systemInfo.isChrome)
        throw new SDError(`Api.viewableInAR: The AR feature in Chrome is only supported on Android devices. Please open this page again on an Android device.`);

      throw new SDError(`Api.viewableInAR: The AR feature is only available on Android with Chrome, or on iOS with Safari.`);
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Api.viewableInAR: Something unexpected happened.`, true)
    }
  }

  public async viewInAR(androidOptions: { title?: string, resizable?: boolean, fallback_url?: string } = { title: '', resizable: true, fallback_url: 'https://shapediver.com/' }): Promise<void> {
    try {
      const isIOSSafari = this.#systemInfo.isIOS && this.#systemInfo.isSafari;
      const isAndroidChrome = this.#systemInfo.isAndroid && this.#systemInfo.isChrome;

      // if this is not a supported device, throw an error
      if(!isIOSSafari && !isAndroidChrome)
        throw new SDError('Api.viewInAR: The device or browser is not supported for this functionality, please call "viewableInAR" for more information.');
      
      // try to find a session that is "AR-ready"
      // as a backend might be used that does not support uploading the gltf (and conversion)
      // we have to do this check and abort if none is found
      let arSession;
      for(let s in this.sessions)
        if(this.sessions[s].canUploadGLTF)
          arSession = this.sessions[s];
      if(!arSession) {
        const error = new SDError('Api.viewInAR: None of the sessions that are registered are capable of using the AR feature.');
        this.#logger.warn(LOGGINGTOPIC.AR, error.message);
        throw error;
      }
      
      // register the busy mode to blur the scene and create a visual feedback
      const busyModeID = this.#uuidGenerator.create();
      for(let v in this.viewers)
        this.viewers[v].registerBusyMode(busyModeID)

      // convert and upload (and maybe convert to usdz) the file
      const file = await arSession.uploadGLTF(isIOSSafari ? 'usdz' : 'gltf');

      // separation between Android-Chrome and iOS-Safari
      if(isAndroidChrome) {
        // check the incoming properties
        this.#logger.debugLow(LOGGINGTOPIC.AR, `Api.viewInAR: Viewing in AR with properties ${JSON.stringify(androidOptions)}.`);
        this.#inputValidator.validateAndError(LOGGINGTOPIC.AR, 'Api.viewInAR', androidOptions, 'object', false);
        const prop = Object.assign({}, androidOptions);
        this.#inputValidator.validateAndError(LOGGINGTOPIC.AR, `Api.viewInAR`, prop.title, 'string', false);
        this.#inputValidator.validateAndError(LOGGINGTOPIC.AR, `Api.viewInAR`, prop.resizable, 'boolean', false);
        this.#inputValidator.validateAndError(LOGGINGTOPIC.AR, `Api.viewInAR`, prop.fallback_url, 'string', false);

        // create the link and click it
        const a = document.createElement('a');
        a.href = `intent://arvr.google.com/scene-viewer/1.0?resizable=${androidOptions.resizable}&title=${androidOptions.title}&file=${file}&mode=ar_only#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;S.browser_fallback_url=${androidOptions.fallback_url};end;`
        document.body.appendChild(a);
        a.click();
      } else {
        // create the link and click it
        const a = document.createElement('a');
        document.body.appendChild(a);
        a.href = file;
        a.rel = 'ar';
        const img = document.createElement('img');
        img.src = this.#defaultLogo;
        a.appendChild(img);
        a.click();
      }

      // deregister the busy mod
      for(let v in this.viewers)
        this.viewers[v].deregisterBusyMode(busyModeID)
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.AR, e, `Api.viewInAR: Something unexpected happened.`, true)
    }
  }

  // #endregion Public Methods (10)
}