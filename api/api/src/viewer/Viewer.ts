import { RenderingEngine as RenderingEngineThreejs } from '@shapediver/viewer.rendering-engine-threejs.rendering-engine'
import {
  CAMERATYPE,
  ICameraEngine,
  OrthographicCamera as OrthographicCameraLogic,
  PerspectiveCamera as PerspectiveCameraLogic,
} from '@shapediver/viewer.rendering-engine.camera-engine'
import {
  AbstractLight,
  AmbientLight as AmbientLightLogic,
  DirectionalLight as DirectionalLightLogic,
  HemisphereLight as HemisphereLightLogic,
  ILightEngine,
  LIGHTTYPE,
  PointLight as PointLightLogic,
  SpotLight as SpotLightLogic,
} from '@shapediver/viewer.rendering-engine.light-engine'
import { IRenderingEngine, RENDERERTYPE, VISIBILITYMODE } from '@shapediver/viewer.rendering-engine.rendering-engine'
import { Logger, LOGGINGTOPIC, PerformanceEvaluator, EventEngine, EVENTTYPE, StateEngine, IViewerEvent, IEvent, Converter, InputValidator, UuidGenerator, SDError } from '@shapediver/viewer.shared.services'
import { vec3 } from 'gl-matrix'
import { container, injectable } from 'tsyringe'

import { Camera } from './camera/Camera'
import { OrthographicCamera } from './camera/OrthographicCamera'
import { PerspectiveCamera } from './camera/PerspectiveCamera'
import { AmbientLight } from './lights/AmbientLight'
import { DirectionalLight } from './lights/DirectionalLight'
import { HemisphereLight } from './lights/HemisphereLight'
import { Light } from './lights/Light'
import { LightScene } from './lights/LightScene'
import { PointLight } from './lights/PointLight'
import { SpotLight } from './lights/SpotLight'

@injectable()
export class Viewer implements ILightEngine, ICameraEngine, IRenderingEngine {
  // #region Properties (28)
  readonly #converter: Converter = <Converter>container.resolve(Converter);
  readonly #eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);
  readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
  readonly #logger: Logger = <Logger>container.resolve(Logger);
  readonly #performanceEvaluator: PerformanceEvaluator = <PerformanceEvaluator>container.resolve(PerformanceEvaluator);
  readonly #stateEngine: StateEngine = <StateEngine>container.resolve(StateEngine);
  readonly ambientOcclusion!: boolean;
  readonly automaticResizing!: boolean;
  readonly beautyRenderBlendingDuration!: number
  readonly beautyRenderDelay!: number;
  readonly blur!: boolean;
  readonly blurSceneWhenBusy!: boolean;
  readonly camera: Camera | null = null;
  readonly cameras: {
    [key: string]: Camera
  } = {};
  readonly clearAlpha!: number;
  readonly clearColor!: string | number | vec3;
  readonly environmentMap!: string | string[];
  readonly environmentMapAsBackground!: boolean;
  readonly environmentMapResolution!: string;
  readonly gridVisibility!: boolean;
  readonly groundPlaneVisibility!: boolean;
  readonly id!: string;
  readonly initialized: boolean = false;
  readonly lightScene: LightScene | null = null;
  readonly lightSceneId!: string;
  readonly lightScenes: {
    [key: string]: LightScene
  } = {};
  readonly pointSize!: number;
  readonly renderingSettings!: {
    physicallyCorrectLights: boolean,
    textureEncoding: number,
    outputEncoding: number
  };
  readonly shadows!: boolean;
  readonly show!: boolean;
  readonly showStatistics!: boolean;
  readonly #updateCB = () => {
    if (!this.#renderingEngine) return;

    // add new cameras
    for(let c in this.#renderingEngine.cameraEngine.cameras) {
      if(!this.cameras[c]) 
        this.cameras[c] = this.#renderingEngine.cameraEngine.cameras[c].type === CAMERATYPE.ORTHOGRAPHIC ? new OrthographicCamera(<OrthographicCameraLogic>this.#renderingEngine.cameraEngine.cameras[c], this) : new PerspectiveCamera(<PerspectiveCameraLogic>this.#renderingEngine.cameraEngine.cameras[c], this);
    }

    // delete cameras that don't exist
    for(let c in this.cameras) {
      if(!this.#renderingEngine.cameraEngine.cameras) 
        delete this.cameras[c];
    }

    if(this.#renderingEngine.cameraEngine.camera)
      (<any>this.camera) = this.cameras[this.#renderingEngine.cameraEngine.camera.id];

    // add new lightScenes
    for(let l in this.#renderingEngine.lightEngine.lightScenes) {
      if(!this.lightScenes[l]) 
        this.lightScenes[l] = new LightScene(this.#renderingEngine.lightEngine.lightScenes[l], this);
    }

    // delete lightScenes that don't exist
    for(let l in this.lightScenes) {
      if(!this.#renderingEngine.lightEngine.lightScenes[l]) 
        delete this.lightScenes[l];
    }

    if(this.#renderingEngine.lightEngine.lightScene) {
      (<any>this.lightScene) = this.lightScenes[this.#renderingEngine.lightEngine.lightScene.id];
      (<any>this.lightSceneId) = this.#renderingEngine.lightEngine.lightScene.id;
    }

    (<any>this.ambientOcclusion) = this.#renderingEngine.ambientOcclusion;
    (<any>this.automaticResizing) = this.#renderingEngine.automaticResizing;
    (<any>this.beautyRenderBlendingDuration) = this.#renderingEngine.beautyRenderBlendingDuration;
    (<any>this.beautyRenderDelay) = this.#renderingEngine.beautyRenderDelay;
    (<any>this.blur) = this.#renderingEngine.blur;
    (<any>this.blurSceneWhenBusy) = this.#renderingEngine.blurSceneWhenBusy;
    (<any>this.clearAlpha) = this.#renderingEngine.clearAlpha;
    (<any>this.clearColor) = this.#renderingEngine.clearColor;
    (<any>this.environmentMap) = this.#renderingEngine.environmentMap;
    (<any>this.environmentMapAsBackground) = this.#renderingEngine.environmentMapAsBackground;
    (<any>this.environmentMapResolution) = this.#renderingEngine.environmentMapResolution;
    (<any>this.gridVisibility) = this.#renderingEngine.gridVisibility;
    (<any>this.groundPlaneVisibility) = this.#renderingEngine.groundPlaneVisibility;
    (<any>this.id) = this.#renderingEngine.id;
    (<any>this.pointSize) = this.#renderingEngine.pointSize;
    (<any>this.renderingSettings) = this.#renderingEngine.renderingSettings;
    (<any>this.shadows) = this.#renderingEngine.shadows;
    (<any>this.show) = this.#renderingEngine.show;
    (<any>this.showStatistics) = this.#renderingEngine.showStatistics;
  }

  #busyModeIDs: string[] = [];
  #properties: { id: string, canvas?: HTMLCanvasElement, type: RENDERERTYPE, visibility: VISIBILITYMODE, logo: string };
  #renderingEngine!: RenderingEngineThreejs;


  // #endregion Properties (28)

  // #region Constructors (1)

  /**
   * @ignore
   * @param id 
   * @param type 
   * @param canvas 
   */
  constructor(properties: { id: string, canvas?: HTMLCanvasElement, type: RENDERERTYPE, visibility: VISIBILITYMODE, logo: string }, callbacks: any) {
    try {
      this.#properties = properties;
      callbacks.close = async (): Promise<boolean> => {
        const closeResult = await this.#renderingEngine.close();
        this.#eventEngine.emitEvent(EVENTTYPE.VIEWER.VIEWER_CLOSED, { viewerId: this.id });

        if (!closeResult) this.#logger.warn(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}): Was not able to close viewer completely, please disregard this viewer.`);
        return closeResult;
      }
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).constructor: Viewer api created.`);
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Viewer(${this.id}).constructor: Something unexpected happened.`, true)
    }
  }

  // #endregion Constructors (1)

  // #region Public Accessors (16)

  /**
   * Enable / Disable the ambient occlusion
   * @param {boolean} value
   */
  public updateAmbientOcclusion(value: boolean) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updateAmbientOcclusion: Updating AmbientOcclusion to ${value}.`);
      this.isInitialized();
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updateAmbientOcclusion`, value, 'boolean');
      this.#renderingEngine.ambientOcclusion = value;
      this.#logger.info(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updateAmbientOcclusion: ambientOcclusion was set to: ${value}`);
      this.update();
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Viewer(${this.id}).updateAmbientOcclusion: Something unexpected happened.`, true)
    }
  }

  /**
   * If the canvas should be automatically resized
   * @param {boolean} value
   */
  public updateAutomaticResizing(value: boolean) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updateAutomaticResizing: Updating AutomaticResizing to ${value}.`);
      this.isInitialized();
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updateAutomaticResizing`, value, 'boolean');
      this.#renderingEngine.automaticResizing = value;
      this.#logger.info(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updateAutomaticResizing: automaticResizing was set to: ${value}`);
      this.update();
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Viewer(${this.id}).updateAutomaticResizing: Something unexpected happened.`, true)
    }
  }

  /**
   * Time to blend the beauty rendering
   * @param {number} value
   */
  public updateBeautyRenderBlendingDuration(value: number) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updateBeautyRenderBlendingDuration: Updating RenderBlendingDuration to ${value}.`);
      this.isInitialized();
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updateBeautyRenderBlendingDuration`, value, 'positive');
      this.#renderingEngine.beautyRenderBlendingDuration = value;
      this.#logger.info(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updateBeautyRenderBlendingDuration: beautyRenderBlendingDuration was set to: ${value}`);
      this.update();
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Viewer(${this.id}).updateBeautyRenderBlendingDuration: Something unexpected happened.`, true)
    }
  }

  /**
   * Time to delay the beauty rendering
   * @param {number} value
   */
  public updateBeautyRenderDelay(value: number) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updateBeautyBeautyRenderDelay: Updating BeautyRenderDelay to ${value}.`);
      this.isInitialized();
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updateBeautyRenderDelay`, value, 'positive');
      this.#renderingEngine.beautyRenderDelay = value;
      this.#logger.info(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updateBeautyBeautyRenderDelay: beautyRenderDelay was set to: ${value}`);
      this.update();
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Viewer(${this.id}).updateBeautyBeautyRenderDelay: Something unexpected happened.`, true)
    }
  }

  /**
   * Activate or de-active the blur.
   * @param {boolean} value
   */
  public updateBlur(value: boolean) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updateBlur: Updating Blur to ${value}.`);
      this.isInitialized();
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updateBlur`, value, 'boolean');
      this.#renderingEngine.blur = value;
      this.#logger.info(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updateBlur: blur was set to: ${value}`);
      this.update();
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Viewer(${this.id}).updateBlur: Something unexpected happened.`, true)
    }
  }

  /**
   * Blur or don't blur the scene while a session is busy
   * @param {boolean} value
   */
  public updateBlurSceneWhenBusy(value: boolean) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updateBlurSceneWhenBusy: Updating BlurSceneWhenBusy to ${value}.`);
      this.isInitialized();
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updateBlurSceneWhenBusy`, value, 'boolean');
      this.#renderingEngine.blurSceneWhenBusy = value;
      this.#logger.info(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updateBlurSceneWhenBusy: blurSceneWhenBusy was set to: ${value}`);
      this.update();
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Viewer(${this.id}).updateBlurSceneWhenBusy: Something unexpected happened.`, true)
    }
  }

  /**
   * Background alpha value
   * @param {number} value
   */
  public updateClearAlpha(value: number) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updateClearAlpha: Updating ClearAlpha to ${value}.`);
      this.isInitialized();
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updateClearAlpha`, value, 'factor');
      this.#renderingEngine.clearAlpha = value;
      this.#logger.info(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updateClearAlpha: clearAlpha was set to: ${value}`);
      this.update();
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Viewer(${this.id}).updateClearAlpha: Something unexpected happened.`, true)
    }
  }

  /**
   * Background color value
   * @param {string | number | vec3} value
   */
  public updateClearColor(value: string | number | vec3) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updateClearColor: Updating ClearColor to ${value}.`);
      this.isInitialized();
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updateClearColor`, value, 'color');
      this.#renderingEngine.clearColor = this.#converter.toColor(value);
      this.#logger.info(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updateClearColor: clearColor was set to: ${value}`);
      this.update();
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Viewer(${this.id}).updateClearColor: Something unexpected happened.`, true)
    }
  }

  /**
   * Name of the environment map to use, or an array of 6 image URLs making up the cube mapped environment map (px, nx, pz, nz, py, ny)
   * @param {string | string[]} value
   */
  public async updateEnvironmentMap(value: string | string[]) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updateEnvironmentMap: Updating EnvironmentMap to ${value}.`);
      this.isInitialized();
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updateEnvironmentMap`, value, 'cubeMap');

      await new Promise<void>(resolve => {
        const token = this.#eventEngine.addListener(EVENTTYPE.ENVIRONMENTMAP.ENVIRONMENTMAP_LOADED, (e: IEvent) => {
          if((<IViewerEvent>e).viewerId === this.id) {
            this.#eventEngine.removeListener(token);
            resolve();
          }
        });
        this.#renderingEngine.environmentMap = value;
      })
      
      this.#logger.info(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updateEnvironmentMap: environmentMap was set to: ${value}`);
      this.update();
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Viewer(${this.id}).updateEnvironmentMap: Something unexpected happened.`, true)
    }
  }

  /**
   * Show / Hide the environment map in the background
   * @param {boolean} value
   */
  public updateEnvironmentMapAsBackground(value: boolean) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updateEnvironmentMapAsBackground: Updating EnvironmentMapAsBackground to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updateEnvironmentMapAsBackground`, value, 'boolean');
      this.#renderingEngine.environmentMapAsBackground = value;
      this.#logger.info(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updateEnvironmentMapAsBackground: environmentMapAsBackground was set to: ${value}`);
      this.update();
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Viewer(${this.id}).updateEnvironmentMapAsBackground: Something unexpected happened.`, true)
    }
  }

  /**
   * Image resolution to be used for the named environment maps (available resolutions: 256, 512, 1024)
   * @param {string} value
   */
  public updateEnvironmentMapResolution(value: string) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updateEnvironmentMapResolution: Updating EnvironmentMapResolution to ${value}.`);
      this.isInitialized();
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updateEnvironmentMapResolution`, value, 'string');
      this.#renderingEngine.environmentMapResolution = value;
      this.#logger.info(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updateEnvironmentMapResolution: environmentMapResolution was set to: ${value}`);
      this.update();
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Viewer(${this.id}).updateEnvironmentMapResolution: Something unexpected happened.`, true)
    }
  }

  /**
   * Show / Hide the grid
   * @param {boolean} value
   */
  public updateGridVisibility(value: boolean) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updateGridVisibility: Updating GridVisibility to ${value}.`);
      this.isInitialized();
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updateGridVisibility`, value, 'boolean');
      this.#renderingEngine.gridVisibility = value;
      this.#logger.info(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updateGridVisibility: gridVisibility was set to: ${value}`);
      this.update();
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Viewer(${this.id}).updateGridVisibility: Something unexpected happened.`, true)
    }
  }

  /**
   * Show / Hide the ground plane
   * @param {boolean} value
   */
  public updateGroundPlaneVisibility(value: boolean) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updateGroundPlaneVisibility: Updating GroundPlaneVisibility to ${value}.`);
      this.isInitialized();
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updateGroundPlaneVisibility`, value, 'boolean');
      this.#renderingEngine.groundPlaneVisibility = value;
      this.#logger.info(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updateGroundPlaneVisibility: groundPlaneVisibility was set to: ${value}`);
      this.update();
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Viewer(${this.id}).updateGroundPlaneVisibility: Something unexpected happened.`, true)
    }
  }

  /**
   * Setter lightScene
   * @param {string} value
   */
  public updateLightScene(value: string) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).updateLightScene: Updating LightScene to ${value}.`);
      this.isInitialized();
      this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).updateLightScene`, value, 'string');
      if (this.assignLightScene(value)) {
        this.#renderingEngine.lightScene = value;
        this.#logger.info(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).updateLightScene: lightScene was set to: ${value}`);
      }
      this.update();
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.LIGHT, e, `Viewer(${this.id}).updateLightScene: Something unexpected happened.`, true)
    }
  }

  /**
   * Size of points
   * @param {number} value
   */
  public updatePointSize(value: number) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updatePointSize: Updating PointSize to ${value}.`);
      this.isInitialized();
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updatePointSize`, value, 'positive');
      this.#renderingEngine.pointSize = value;
      this.#logger.info(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updatePointSize: pointSize was set to: ${value}`);
      this.update();
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Viewer(${this.id}).updatePointSize: Something unexpected happened.`, true)
    }
  }

  /**
   * Rendering Settings
   * @param {any} value
   */
  public updateRenderingSettings(value: {
    physicallyCorrectLights: boolean,
    envMapIntensity: number,
    envMapIntensityGroundPlane: number,
    groundPlaneColor: string,
    toneMapping: 0 | 1 | 2 | 3 | 4,
    toneMappingExposure: number,
    textureEncoding: 3000 | 3001 | 3002 | 3003 | 3004 | 3005 | 3006 | 3007,
    outputEncoding: 3000 | 3001 | 3002 | 3003 | 3004 | 3005 | 3006 | 3007,
  }) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updateRenderingSettings: Rendering settings were set to ${JSON.stringify(value)}.`);
      this.isInitialized();
      this.#renderingEngine.renderingSettings = value;
      this.#logger.info(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updateRenderingSettings: rendering settings were set to: ${JSON.stringify(value)}`);
      this.update();
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Viewer(${this.id}).updateRenderingSettings: Something unexpected happened.`, true)
    }
  }

  /**
   * Enable / Disable shadows
   * @param {boolean} value
   */
  public updateShadows(value: boolean) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updateShadows: Updating Shadows to ${value}.`);
      this.isInitialized();
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updateShadows`, value, 'boolean');
      this.#renderingEngine.shadows = value;
      this.#logger.info(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updateShadows: shadows was set to: ${value}`);
      this.update();
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Viewer(${this.id}).updateShadows: Something unexpected happened.`, true)
    }
  }

  /**
   * Show / Hide the scene
   * @param {boolean} value
   */
  public updateShow(value: boolean) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updateShow: Updating Show to ${value}.`);
      this.isInitialized();
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updateShow`, value, 'boolean');
      this.#renderingEngine.show = value;
      this.#logger.info(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updateShow: show was set to: ${value}`);
      this.update();
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Viewer(${this.id}).updateShow: Something unexpected happened.`, true)
    }
  }

  /**
   * Show / Hide the statistics
   * @param {boolean} value
   */
  public updateShowStatistics(value: boolean) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updateShowStatistics: Updating ShowStatistics to ${value}.`);
      this.isInitialized();
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updateShowStatistics`, value, 'boolean');
      this.#renderingEngine.showStatistics = value;
      this.#logger.info(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).updateShowStatistics: showStatistics was set to: ${value}`);
      this.update();
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Viewer(${this.id}).updateShowStatistics: Something unexpected happened.`, true)
    }
  }

  // #endregion Public Accessors (16)

  // #region Public Methods (26)

  /**
   * Add an ambient light with the specified properties to the current light scene.
   * An id can be provided. If not, a unique id will be created.
   * 
   * @param properties.color the color of the light
   * @param properties.intensity the intensity of the light
   * @returns 
   */
  public addAmbientLight(properties: { color?: string | number | vec3, intensity?: number, name?: string }): AmbientLight {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addAmbientLight: Adding light with properties ${properties}.`);
      this.isInitialized();
      this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addAmbientLight`, properties, 'object', false);
      const props = Object.assign({}, properties);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addAmbientLight`, props.color, 'color', false);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addAmbientLight`, props.intensity, 'positive', false);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addAmbientLight`, props.name, 'string', false);
      if (props.color !== undefined) props.color = this.#converter.toColor(props.color);
      const lightLogic = this.#renderingEngine.lightEngine.addAmbientLight(<any>props);
      const light = this.lightScene!.lights[lightLogic.id];
      this.#logger.info(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addAmbientLight: Ambient light with id ${light.id} created.`);
      this.update();
      return <AmbientLight>light;
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.LIGHT, e, `Viewer(${this.id}).addAmbientLight: Something unexpected happened.`, true)
    }
  }

  /**
   * Add a directional light with the specified properties to the current light scene.
   * An id can be provided. If not, a unique id will be created.
   * 
   * @param properties.color the color of the light
   * @param properties.intensity the intensity of the light
   * @param properties.direction the directional of the light
   * @param properties.castShadow the option to cast shadow
   * @param properties.shadowMapResolution the resolution of the shadow map
   * @param properties.shadowMapBias the bias of the shadow map
   * @returns 
   */
  public addDirectionalLight(properties: { color?: string | number | vec3, intensity?: number, direction?: vec3, castShadow?: boolean, shadowMapResolution?: number, shadowMapBias?: number, name?: string }): DirectionalLight {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addDirectionalLight: Adding light with properties ${properties}.`);
      this.isInitialized();
      this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addDirectionalLight`, properties, 'object', false);
      const props = Object.assign({}, properties);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addDirectionalLight`, props.color, 'color', false);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addDirectionalLight`, props.intensity, 'positive', false);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addDirectionalLight`, props.direction, 'vec3', false);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addDirectionalLight`, props.castShadow, 'boolean', false);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addDirectionalLight`, props.shadowMapResolution, 'positive', false);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addDirectionalLight`, props.shadowMapBias, 'number', false);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addDirectionalLight`, props.name, 'string', false);
      if (props.color !== undefined) props.color = this.#converter.toColor(props.color);
      const lightLogic = this.#renderingEngine.lightEngine.addDirectionalLight(<any>props);
      const light = this.lightScene!.lights[lightLogic.id];
      this.#logger.info(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addDirectionalLight: Directional light with id ${light.id} created.`);
      this.update();
      return <DirectionalLight>light;
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.LIGHT, e, `Viewer(${this.id}).addDirectionalLight: Something unexpected happened.`, true)
    }
  }

  /**
   * Add a hemisphere light with the specified properties to the current light scene.
   * An id can be provided. If not, a unique id will be created.
   * 
   * @param properties.color the color of the light
   * @param properties.intensity the intensity of the light
   * @param properties.groundColor the ground color of the light
   * @returns 
   */
  public addHemisphereLight(properties: { color?: string | number | vec3, intensity?: number, groundColor?: string | number | vec3, name?: string }): HemisphereLight {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addHemisphereLight: Adding light with properties ${properties}.`);
      this.isInitialized();
      this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addHemisphereLight`, properties, 'object', false);
      const props = Object.assign({}, properties);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addHemisphereLight`, props.color, 'color', false);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addHemisphereLight`, props.groundColor, 'color', false);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addHemisphereLight`, props.intensity, 'positive', false);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addHemisphereLight`, props.name, 'string', false);
      if (props.color !== undefined) props.color = this.#converter.toColor(props.color);
      if (props.groundColor !== undefined) props.groundColor = this.#converter.toColor(props.groundColor);
      const lightLogic = this.#renderingEngine.lightEngine.addHemisphereLight(<any>props);
      const light = this.lightScene!.lights[lightLogic.id];
      this.#logger.info(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addHemisphereLight: Hemisphere light with id ${light.id} created.`);
      this.update();
      return <HemisphereLight>light;
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.LIGHT, e, `Viewer(${this.id}).addHemisphereLight: Something unexpected happened.`, true)
    }
  }

  /**
   * Add a point light with the specified properties to the current light scene.
   * An id can be provided. If not, a unique id will be created.
   * 
   * @param properties.color the color of the light
   * @param properties.intensity the intensity of the light
   * @param properties.position the position of the light
   * @param properties.distance the distance of the light radiance
   * @param properties.decay the decay of the light radiance
   * @returns 
   */
  public addPointLight(properties: { color?: string | number | vec3, intensity?: number, position?: vec3, distance?: number, decay?: number, name?: string }): PointLight {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addPointLight: Adding light with properties ${properties}.`);
      this.isInitialized();
      this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addPointLight`, properties, 'object', false);
      const props = Object.assign({}, properties);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addPointLight`, props.color, 'color', false);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addPointLight`, props.intensity, 'positive', false);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addPointLight`, props.position, 'vec3', false);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addPointLight`, props.distance, 'positive', false);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addPointLight`, props.decay, 'positive', false);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addPointLight`, props.name, 'string', false);
      if (props.color !== undefined) props.color = this.#converter.toColor(props.color);
      const lightLogic = this.#renderingEngine.lightEngine.addPointLight(<any>props);
      const light = this.lightScene!.lights[lightLogic.id];
      this.#logger.info(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addPointLight: Point light with id ${light.id} created.`);
      this.update();
      return <PointLight>light;
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.LIGHT, e, `Viewer(${this.id}).addPointLight: Something unexpected happened.`, true)
    }
  }

  /**
   * Add a spot light with the specified properties to the current light scene.
   * An id can be provided. If not, a unique id will be created.
   * 
   * @param properties.color the color of the light
   * @param properties.intensity the intensity of the light
   * @param properties.position the position of the light
   * @param properties.target the target of the light
   * @param properties.distance the distance of the light radiance
   * @param properties.decay the decay of the light radiance
   * @param properties.angle the angle of the light cone
   * @param properties.penumbra the percentage of the cone that is part of the penumbra
   * @returns 
   */
  public addSpotLight(properties?: { color?: string | number | vec3, intensity?: number, position?: vec3, target?: vec3, distance?: number, decay?: number, angle?: number, penumbra?: number, name?: string }): SpotLight {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addSpotLight: Adding light with properties ${properties}.`);
      this.isInitialized();
      this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addSpotLight`, properties, 'object', false);
      const props = Object.assign({}, properties);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addSpotLight`, props.color, 'color', false);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addSpotLight`, props.intensity, 'positive', false);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addSpotLight`, props.position, 'vec3', false);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addSpotLight`, props.target, 'vec3', false);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addSpotLight`, props.distance, 'positive', false);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addSpotLight`, props.decay, 'positive', false);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addSpotLight`, props.angle, 'positive', false);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addSpotLight`, props.penumbra, 'positive', false);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addSpotLight`, props.name, 'string', false);
      if (props.color !== undefined) props.color = this.#converter.toColor(props.color);

      const lightLogic = this.#renderingEngine.lightEngine.addSpotLight(<any>props);
      const light = this.lightScene!.lights[lightLogic.id];

      this.#logger.info(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).addSpotLight: Spot light with id ${light.id} created.`);
      this.update();
      return <SpotLight>light;
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.LIGHT, e, `Viewer(${this.id}).addSpotLight: Something unexpected happened.`, true)
    }
  }

  /**
   * Assign the camera with the specified id to the viewer.
   * 
   * @param id the id of the camera
   */
  public assignCamera(id: string): void {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.CAMERA, `Viewer(${this.id}).assignCamera: Assigning Camera with id ${id}.`);
      this.isInitialized();
      this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Viewer(${this.id}).assignCamera`, id, 'string');
      this.#renderingEngine.cameraEngine.assignCamera(id);
      this.#logger.info(LOGGINGTOPIC.CAMERA, `Viewer(${this.id}).assignCamera: Camera with id ${id} assigned.`);
      this.update();
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.CAMERA, e, `Viewer(${this.id}).assignCamera: Something unexpected happened.`, true)
    }
  }

  /**
   * Assign the light scene with the current id to the viewer.
   * 
   * @param id the id of the light scene 
   * @returns 
   */
  public assignLightScene(id: string): boolean {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).assignLightScene: Assigning LightScene with id ${id}.`);
      this.isInitialized();
      this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).assignLightScene`, id, 'string');
      if (this.lightScene && this.lightScene.id === id) {
        this.#logger.warn(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).assignLightScene: The light scene with id ${id} was already assigned.`);
        return true;
      }
      const r = this.#renderingEngine.lightEngine.assignLightScene(id);
      if (r) this.#renderingEngine.lightScene = id;
      if (r) this.#logger.info(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).assignLightScene: Assigned light scene with id ${id}.`);
      if (!r) this.#logger.error(LOGGINGTOPIC.LIGHT, new SDError(`Viewer(${this.id}).assignLightScene: Could not assign light scene with id ${id}.`));
      this.update();
      return r;
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.LIGHT, e, `Viewer(${this.id}).assignLightScene: Something unexpected happened.`, true)
    }
  }

  /**
   * Create a camera with the specified type.
   * An id can be provided. If not, a unique id will be created.
   * 
   * @param type the type of the camera
   * @param id the id of the camera
   * @returns 
   */
  public createCamera(type: CAMERATYPE, id?: string): Camera {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.CAMERA, `Viewer(${this.id}).createCamera: Creating Camera with id ${id} and type ${type}.`);
      this.isInitialized();
      this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Viewer(${this.id}).createCamera`, type, 'enum', true, Object.values(CAMERATYPE));
      this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Viewer(${this.id}).createCamera`, id, 'string', false);
      const cameraLogic = this.#renderingEngine.cameraEngine.createCamera(type, id);
      this.#logger.info(LOGGINGTOPIC.CAMERA, `Viewer(${this.id}).createCamera: ${cameraLogic.type === CAMERATYPE.ORTHOGRAPHIC ? 'Orthographic' : 'Perspective'} camera with id ${id} created.`);
      this.assignCamera(cameraLogic.id);
      return this.cameras[cameraLogic.id];
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.CAMERA, e, `Viewer(${this.id}).createCamera: Something unexpected happened.`, true)
    }
  }

  /**
   * Create a new light scene.
   * An id can be provided. If not, a unique id will be created.
   * If the standard option is chosen, the default lights will be added from the start.
   * 
   * @param properties.id the id of the light scene
   * @param properties.standard the option to add the standard lights
   * @returns 
   */
  public createLightScene(properties?: { name?: string, standard?: boolean }): LightScene {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).createLightScene: Creating LightScene with properties ${properties}.`);
      this.isInitialized();
      this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).createLightScene`, properties, 'object', false);
      const props = Object.assign({}, properties);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).createLightScene`, props.name, 'string', false);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).createLightScene`, props.standard, 'boolean', false);
      const lightSceneLogic = this.#renderingEngine.lightEngine.createLightScene(props);
      this.#logger.info(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).createLightScene: New light scene with id ${lightSceneLogic.id} created.`);
      if (lightSceneLogic.id) this.assignLightScene(lightSceneLogic.id);
      this.update();
      return this.lightScenes[lightSceneLogic.id];
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.LIGHT, e, `Viewer(${this.id}).createLightScene: Something unexpected happened.`, true)
    }
  }

  /**
   * Create an orthographic camera.
   * An id can be provided. If not, a unique id will be created.
   * 
   * @param id the id of the camera
   * @returns 
   */
  public createOrthographicCamera(id?: string): OrthographicCamera {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.CAMERA, `Viewer(${this.id}).createOrthographicCamera: Creating OrthographicCamera with id ${id}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Viewer(${this.id}).createOrthographicCamera`, id, 'string', false);
      this.#logger.info(LOGGINGTOPIC.CAMERA, `Viewer(${this.id}).createOrthographicCamera: Orthographic camera with id ${id} created.`);
      return <OrthographicCamera>this.createCamera(CAMERATYPE.ORTHOGRAPHIC, id);
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.CAMERA, e, `Viewer(${this.id}).createOrthographicCamera: Something unexpected happened.`, true)
    }
  }

  /**
   * Create a perspective camera.
   * An id can be provided. If not, a unique id will be created.
   * 
   * @param id the id of the camera
   * @returns 
   */
  public createPerspectiveCamera(id?: string): PerspectiveCamera {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.CAMERA, `Viewer(${this.id}).createPerspectiveCamera: Creating PerspectiveCamera with id ${id}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Viewer(${this.id}).createPerspectiveCamera`, id, 'string', false);
      this.#logger.info(LOGGINGTOPIC.CAMERA, `Viewer(${this.id}).createPerspectiveCamera: Perspective camera with id ${id} created.`);
      return <PerspectiveCamera>this.createCamera(CAMERATYPE.PERSPECTIVE, id);
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.CAMERA, e, `Viewer(${this.id}).createPerspectiveCamera: Something unexpected happened.`, true)
    }
  }

  /**
   * Create a screenshot for the requested type and options.
   * 
   * @param type the type as string, default is 'image/png'
   * @param quality the quality of the screenshot, default is 1
   * @returns 
   */
  public getScreenshot(type?: string, quality?: number): string {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).getScreenshot: Getting getScreenshot with type ${type} and quality ${quality}.`);
      this.isInitialized();
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).getScreenshot`, type, 'string', false);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).getScreenshot`, quality, 'factor', false);
      this.#logger.info(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).getScreenshot: screenshot was requested`);
      return this.#renderingEngine.getScreenshot(type, quality);
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Viewer(${this.id}).getScreenshot: Something unexpected happened.`, true)
    }
  }

  /**
   * Initialize the viewer.
   * Normally, there is no need to call this function.
   * The initialization is done on creation via the api.
   * 
   * @param properties.type the type of the viewer
   * @param properties.visibility the visibility of the viewer
   * @param properties.canvas the canvas that the viewer should use
   * @param properties.id the unique id the session should have 
   * @param properties.logo an optional logo while the viewer is hidden
   */
  public async init(properties?: { type?: RENDERERTYPE, visibility?: VISIBILITYMODE, canvas?: HTMLCanvasElement, id?: string, logo?: string }): Promise<void> {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).init: Initializing Viewer with properties ${JSON.stringify(properties)}.`);
      // input validation
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).init`, properties, 'object', false);
      const props = Object.assign({}, properties);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).init`, props.type, 'enum', false, Object.values(RENDERERTYPE));
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).init`, props.visibility, 'enum', false, Object.values(VISIBILITYMODE));
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).init`, props.canvas, 'HTMLCanvasElement', false);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).init`, props.id, 'string', false);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).init`, props.logo, 'string', false);

      const viewerId = (props && props.id) ? props.id : (<UuidGenerator>container.resolve(UuidGenerator)).create();
      props.visibility = props.visibility || VISIBILITYMODE.SESSION;
      if (props) this.#properties = { id: viewerId || this.#properties.id, canvas: props.canvas || this.#properties.canvas, visibility: props.visibility || this.#properties.visibility, type: props.type || RENDERERTYPE.STANDARD, logo: props.logo || this.#properties.logo };

      this.#renderingEngine = new RenderingEngineThreejs(this.#properties);
      this.#renderingEngine.addUpdateCB(this.#updateCB);
      this.#updateCB();
      container.registerInstance('renderingEngine', this.#renderingEngine);

      if(!this.camera)
        this.createCamera(CAMERATYPE.PERSPECTIVE, 'standard');

      if (props.visibility === VISIBILITYMODE.SESSION && this.#stateEngine.primarySessionLoaded.resolved === true) {
        await new Promise<void>(resolve => {
          this.#stateEngine.getCustomState(this.id + '_settings_loaded').then(() => resolve())
        })
      }

      this.#eventEngine.emitEvent(EVENTTYPE.VIEWER.VIEWER_INITIALIZED, { viewerId: this.id });
      (<any>this.initialized) = true;
      this.#logger.info(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).init: Viewer initialized.`);
      this.update();
      return Promise.resolve();
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Viewer(${this.id}).init: Something unexpected happened.`, true)
    }
  }
  

  /**
   * Remove the camera with the specified id.
   * 
   * @param id the id of the camera
   * @returns 
   */
   public removeCamera(id: string): boolean {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.CAMERA, `Viewer(${this.id}).removeCamera: Removing Camera with id ${id}.`);
      this.isInitialized();
      this.#inputValidator.validateAndError(LOGGINGTOPIC.CAMERA, `Viewer(${this.id}).removeCamera`, id, 'string');
      const r = this.#renderingEngine.cameraEngine.removeCamera(id);
      if (r) this.#logger.info(LOGGINGTOPIC.CAMERA, `Viewer(${this.id}).removeCamera: Camera with id ${id} removed.`);
      if (!r) this.#logger.info(LOGGINGTOPIC.CAMERA, `Viewer(${this.id}).removeCamera: Could not remove camera with id ${id}.`);
      this.update();
      return r;
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.CAMERA, e, `Viewer(${this.id}).removeCamera: Something unexpected happened.`, true)
    }
  }

  /**
   * Remove the light with the specified id from the current light scene.
   * 
   * @param id the id of the light
   * @returns 
   */
  public removeLight(id: string): boolean {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).removeLight: Removing Light with id ${id}.`);
      this.isInitialized();
      this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).removeLight`, id, 'string');
      const r = this.#renderingEngine.lightEngine.removeLight(id);
      if (r) this.#logger.info(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).removeLight: Light with id ${id} removed.`);
      if (!r) this.#logger.info(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).removeLight: Could not remove light with id ${id}.`);
      this.update();
      return r;
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.LIGHT, e, `Viewer(${this.id}).removeLight: Something unexpected happened.`, true)
    }
  }

  /**
   * Remove the light scene with the specified id.
   * 
   * @param id the id of the light scene
   * @returns 
   */
  public removeLightScene(id: string): boolean {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).removeLightScene: Removing LightScene with id ${id}.`);
      this.isInitialized();
      this.#inputValidator.validateAndError(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).removeLightScene`, id, 'string');
      const r = this.#renderingEngine.lightEngine.removeLightScene(id);
      if (r) this.#logger.info(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).removeLightScene: Light scene with id ${id} removed.`);
      if (!r) this.#logger.info(LOGGINGTOPIC.LIGHT, `Viewer(${this.id}).removeLightScene: Could not remove light scene with id ${id}.`);
      this.update();
      return r;
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.LIGHT, e, `Viewer(${this.id}).removeLightScene: Something unexpected happened.`, true)
    }
  }

  public reset(): void {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).reset: Resetting Viewer.`);
      this.isInitialized();
      this.#renderingEngine.reset();
      this.update();
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Viewer(${this.id}).reset: Something unexpected happened.`, true)
    }
  }

  public resize(width: number, height: number): void {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).resize: Resizing Viewer to ${width} / ${height}.`);
      this.isInitialized();
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).resize`, width, 'number');
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).resize`, height, 'number');
      this.#logger.info(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).resize: Resized Viewer to ${width} / ${height}.`);
      this.#renderingEngine.resize(width, height);
      this.update();
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Viewer(${this.id}).resize: Something unexpected happened.`, true)
    }
  }

  /**
   * Update the viewer with the current changes of the scene tree.
   */
  public update(): void {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).update: Updating Viewer.`);
      if (!this.#renderingEngine) return;
      this.#renderingEngine.update();
      this.#logger.info(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).update: Updated viewer.`);
      this.#eventEngine.emitEvent(EVENTTYPE.VIEWER.VIEWER_UPDATED, { viewerId: this.id });
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Viewer(${this.id}).update: Something unexpected happened.`, true)
    }
  }

  public registerBusyMode(value: string): boolean {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).registerBusyMode: Registering busy mode for id ${value}.`);
      this.isInitialized();
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).registerBusyMode`, value, 'string');

      if(this.#busyModeIDs.includes(value)) return false;
      this.#busyModeIDs.push(value);

      if(this.blurSceneWhenBusy === true)
        this.#renderingEngine.busy = true;
      this.#logger.info(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).registerBusyMode: Busy mode was registered for id: ${value}`);
      this.update();
      return true;
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Viewer(${this.id}).registerBusyMode: Something unexpected happened.`, true)
    }
  }

  public deregisterBusyMode(value: string): boolean {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).deregisterBusyMode: Deregistering busy mode for id ${value}.`);
      this.isInitialized();
      this.#inputValidator.validateAndError(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).deregisterBusyMode`, value, 'string');

      if(!this.#busyModeIDs.includes(value)) return false;
      this.#busyModeIDs.splice(this.#busyModeIDs.indexOf(value), 1);

      if(this.#busyModeIDs.length === 0)
        this.#renderingEngine.busy = false;
      this.#logger.info(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).deregisterBusyMode: Busy mode was deregistered for id: ${value}`);
      this.update();
      return true;
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Viewer(${this.id}).deregisterBusyMode: Something unexpected happened.`, true)
    }
  }

  // #endregion Public Methods (26)

  // #region Private Methods (1)

  private isInitialized() {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.VIEWER, `Viewer(${this.id}).isInitialized: Checking if Viewer was initialized.`);
      if (!this.#renderingEngine) {
        const error = new SDError(`Viewer has not been initialized. Please initialize it first.`);
        this.#logger.warn(LOGGINGTOPIC.VIEWER, error.message);
        throw error;
      }
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.VIEWER, e, `Viewer(${this.id}).isInitialized: Something unexpected happened.`, true)
    }
  }

  // #endregion Private Methods (1)
}