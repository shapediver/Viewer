import { vec3 } from 'gl-matrix'
import { TEXTURE_ENCODING, TONE_MAPPING } from '@shapediver/viewer.rendering-engine.rendering-engine'
import { IDomEventListener } from '@shapediver/viewer.shared.services'
import { ITreeNode } from '@shapediver/viewer.shared.node-tree'
import {
  IAnimationData,
  ISDTFAttributeVisualizationData,
  SDTFItemData,
  ISDTFOverview,
  ISDTFItemData,
} from '@shapediver/viewer.shared.types'
import { IOrthographicCameraApi } from './camera/IOrthographicCameraApi'
import { IPerspectiveCameraApi } from './camera/IPerspectiveCameraApi'
import { ICameraApi } from './camera/ICameraApi'
import { ILightSceneApi } from './lights/ILightSceneApi'

/**
 * Modes used to indicate that a viewport is busy.
 */
export enum BUSY_MODE_DISPLAY {
  /** The viewport will be blurred when a session is busy. */
  BLUR = 'blur',
  /** A spinner will be shown when a session is busy. */
  SPINNER = 'spinner',
  /** Nothing happens when a session is busy. */
  NONE = 'none'
};

/**
 * Session settings to be used by a viewport.
 */
export enum SESSION_SETTINGS_MODE {
  /** No settings of a session will be used. */
  NONE = 'none',
  /** 
   * The first created session will be used for the settings of the viewport. 
   * ATOM: It's not totally clear what this means.
   */
  FIRST = 'first',
  /** 
   * The next created session will be used for the settings of the viewport. 
   * ATOM: It's not totally clear what this means.
   */
  NEXT = 'next',
  /** 
   * The previous created session will be used for the settings of the viewport. 
   * ATOM: It's not totally clear what this means.
   */
  PREVIOUS = 'previous',
};

/**
 * Types of flags used to influence the render loop.
 */
export enum FLAG_TYPE {
  /** The flag to freeze the camera. */
  CAMERA_FREEZE = 'camera_freeze',
  /** The flag to continuously render the scene. */
  CONTINUOUS_RENDERING = 'continuous_rendering',
  /** The flag to continuously update the shadow map. */
  CONTINUOUS_SHADOW_MAP_UPDATE = 'continuous_shadow_map_update',
}

/**
 * The api for a viewport.
 * Viewports are created by calling the {@link createViewport} method.
 * 
 * Each viewport has corresponding [cameras]{@link ICameraApi} and [lights]{@link ILightApi}.
 * 
 * Additionally, there are various other settings to adjust the behavior and rendering of the viewport.
 * 
 * ATOM: By default a new viewport displays the complete scene tree, is this so? Let's add more details here.
 */
export interface IViewportApi {
  // #region Properties (34)

  /**
   * The canvas that is used to render the viewport.
   */
  readonly canvas: HTMLCanvasElement;

  /**
   * The id of the viewport.
   */
  readonly id: string;

  
  /**
   * The current [camera]{@link ICameraApi}. 
   */
  readonly camera: ICameraApi | null;

  /**
   * The [cameras]{@link ICameraApi} of the viewport.
   */
  readonly cameras: { [key: string]: ICameraApi };

  /**
   * The current [light scene]{@link ILightSceneApi}. 
   */
  readonly lightScene: ILightSceneApi | null;

  /**
   * The [light scenes]{@link ILightSceneApi} of the viewport.
   */
  readonly lightScenes: { [key: string]: ILightSceneApi };

  /**
   * Option to enable / disable the AR (Augmented Reality) function for this viewport. (default: true)
   * ATOM: let's be more specific: what exactly is this used for?
   */
  enableAR: boolean;

  /**
   * The scaling factor that is used to export the scene for AR (Augmented Reality).
   * The unit system used by AR is meter, therefore this scaling factor needs to be chosen
   * such that scene coordinates are transformed to meters.
   * ATOM: is there a corresponding "arOrigin" property? 
   */
  arScale: vec3;

  /**
   * Option to enable / disable the ambient occlusion post-processing. (default: false)
   */
  ambientOcclusion: boolean;

  /**
   * The ambient occlusion intensity.
   */
  ambientOcclusionIntensity: number;

  /**
   * An array of all animations that are currently present in the viewport.
   * ATOM: "active" instead of "present"? Are animations controlled by setting this property?
   */
  animations: IAnimationData[];

  /**
   * Option to enable / disable the automatic resizing. (default: true)
   * ATOM: what exactly is automatic resizing?
   */
  automaticResizing: boolean;

  /**
   * The duration that the beauty rendering blends in.
   * ATOM: please specify the unit
   */
  beautyRenderBlendingDuration: number;

  /**
   * The delay with which the beauty rendering starts.
   * ATOM: please specify the unit
   */
  beautyRenderDelay: number;

  /**
   * The mode used to indicate that the viewport is busy. (default: BUSY_MODE_DISPLAY.SPINNER)
   * ATOM: in case this is set to NONE, are there events which can be reacted upon to do sth custom? Let's mention them here.
   */
  busyModeDisplay: BUSY_MODE_DISPLAY;

  /**
   * The clear alpha value of the viewport. 
   * Use this to influence the background appearance of the viewport.
   */
  clearAlpha: number;

  /**
   * The clear color value of the viewport.
   * Use this to influence the background appearance of the viewport.
   */
  clearColor: string | number | vec3;

  /**
   * The environment map used by the viewport.
   * ATOM: Let's add detailed requirements here (image types, when do we need a single image, how many images if not a single)
   */
  environmentMap: string | string[];

  /**
   * Option to set the environment map as the background of the viewport. (default: false)
   */
  environmentMapAsBackground: boolean;

  /**
   * The environment map resolution that is used for our deprecated cube maps.
   * ATOM: are they really deprecated?
   */
  environmentMapResolution: string;

  /**
   * The color of the grid.
   */
  gridColor: string | number | vec3;

  /**
   * Option to enable / disable the grid. (default: true)
   */
  gridVisibility: boolean;

  /**
   * The color of the ground plane.
   */
  groundPlaneColor: string | number | vec3;

  /**
   * Option to enable / disable the ground plane. (default: true)
   */
  groundPlaneVisibility: boolean;

  /**
   * The encoding that is used for the output texture. (default: TEXTURE_ENCODING.SRGB)
   * ATOM: What is the "output texture"? :-)
   */
  outputEncoding: TEXTURE_ENCODING;

  /**
   * Option to enable / disable the physically correct lights. (default: true)
   */
  physicallyCorrectLights: boolean;

  /**
   * The point size that is used for rendering point data.
   */
  pointSize: number;

  /**
   * Optional id of the session to be used for persisting / loading settings of the viewport.
   * ATOM: Let's add details on what this exactly means.
   */
  sessionSettingsId: string;

  /**
   * The mode in which the session settings should be loaded. (default: {@link SESSION_SETTINGS_MODE.FIRST}).
   * ATOM: Let's add details on what this exactly means. Does this matter only on creation of the viewport? 
   */
  sessionSettingsMode?: SESSION_SETTINGS_MODE

  /**
   * Option to enable / disable rendering of shadows. (default: true)
   */
  shadows: boolean;

  /**
   * Option to show / hide the viewport.
   * ATOM: Let's add some details here. This will disable rendering, but not hide the canvas, correct?
   */
  show: boolean;

  /**
   * Option to show / hide the statistics. (default: false)
   * ATOM: Let's be more specific here. Where do we show statistics?
   */
  showStatistics: boolean;

  /**
   * The encoding that is used for textures. (default: TEXTURE_ENCODING.SRGB)
   */
  textureEncoding: TEXTURE_ENCODING;
  
  /**
   * The tone mapping that is used. (default: TONE_MAPPING.NONE)
   */
  toneMapping: TONE_MAPPING;

  /**
   * The intensity of the tone mapping.
   */
  toneMappingExposure: number;

  /**
   * A possibility to visualize the attributes of the scene in any way you want. 
   * Please have a look at the {@link https://help.shapediver.com/doc/Attribute-Visualization.1856733198.html|help desk} documentation for more information.
   * 
   * Provide a callback that transforms a {@link ISDTFItemData} to a {@link ISDTFAttributeVisualizationData}.
   * The {@link ISDTFOverview} provides general information like min and max values for numbers or the available options for strings.
   */
  visualizeAttributes: ((overview: ISDTFOverview, itemData?: ISDTFItemData) => ISDTFAttributeVisualizationData) | undefined;

  // #endregion Properties (34)

  // #region Public Methods (30)

  /**
   * Add an event listener that receives all canvas events.
   * 
   * @param listener The listener that is called when the events occur.
   */
  addCanvasEventListener(listener: IDomEventListener): string;

  /**
   * Add a flag for this viewport. Adding/removing flags allows to influence the render loop.
   * If you want to stop this again call {@link removeFlag} with the returned token.
   */
  addFlag(flag: FLAG_TYPE): string;

  /**
   * Assign the camera with the specified id to the viewport.
   * ATOM: What exactly does this do? Will this camera become the current one?
   * 
   * @param id The id of the camera.
   */
  assignCamera(id: string): void;

  /**
   * Assign the light scene with the current id to the viewport.
   * ATOM: What exactly does this do? Will this light scene become the current one?
   * 
   * @param id The id of the light scene.
   */
  assignLightScene(id: string): boolean;

  /**
   * Closes the viewport.
   * ATOM: Please add some details. Will this remove all traces of the viewport on the canvas element?
   */
  close(): Promise<boolean>;

  /**
   * Create a new light scene.
   * An id can be provided. If not, a unique id will be created.
   * If the standard option is chosen, the default lights will be added from the start.
   * 
   * @param properties.id The id of the light scene.
   * @param properties.standard The option to add the standard lights.
   */
  createLightScene(properties?: { name?: string, standard?: boolean }): ILightSceneApi;

  /**
   * Create an orthographic camera.
   * An id can be provided. If not, a unique id will be created.
   * 
   * @param id The id of the camera.
   */
  createOrthographicCamera(id?: string): IOrthographicCameraApi;

  /**
   * Create a perspective camera.
   * An id can be provided. If not, a unique id will be created.
   * 
   * @param id The id of the camera.
   */
  createPerspectiveCamera(id?: string): IPerspectiveCameraApi;

  /**
   * Create the {@link ISDTFOverview} for the provided node.
   * If no node was provided, the scene root is used instead.
   * 
   * @param node The node for which the overview is created.
   */
  createSDTFOverview(node: ITreeNode): ISDTFOverview;

  /**
   * Deregister the busy mode with the specified id.
   * ATOM: Please explain what this is used for. 
   * 
   * @param value The id of the busy mode.
   */
  deregisterBusyMode(value: string): boolean;

  /**
   * Display an error message on the canvas.
   * 
   * @param message The message to display.
   */
  displayErrorMessage(message: string): void;

  /**
   * Get the complete URL of the current environment map, if it is a single file.
   * ATOM: What's the difference to environmentMap?
   */
  getEnvironmentMapImageUrl(): string;

  /**
   * Create a screenshot for the requested type and options.
   * 
   * @param type The type as string, default is 'image/png'.
   * @param quality The quality of the screenshot, default is 1.
   */
  getScreenshot(type?: string, quality?: number): string;

  /**
   * Register the busy mode with the specified id.
   * ATOM: Please explain what this is used for. 
   * 
   * @param value The id of the busy mode.
   */
  registerBusyMode(value: string): boolean;

  /**
   * Remove the camera with the specified id.
   * ATOM: Please explain what happens if the current camera is removed.
   * 
   * @param id The id of the camera.
   */
  removeCamera(id: string): boolean;

  /**
   * Remove an event listener that received all canvas events.
   * 
   * @param token The token that was returned by {@link addCanvasEventListener}.
   */
  removeCanvasEventListener(token: string): boolean;

  /**
   * Removes the registered flag. Adding/removing flags allows to influence the render loop.
   * 
   * @param token The token that was returned by {@link addFlag}.
   */
  removeFlag(token: string): boolean;

  /**
   * Remove the light scene with the specified id.
   * ATOM: Please explain what happens if the current light scene is removed.
   * 
   * @param id The id of the light scene.
   */
  removeLightScene(id: string): boolean;

  /**
   * Manual call to render the scene.
   */
  render(): void;

  /**
   * Reset the viewport.
   * Sets the {@link show}-value to false and waits for new settings to be registered.
   * ATOM: what does "waiting for new settings mean"? Please explain it here.
   */
  reset(): void;

  /**
   * If the {@link automaticResizing} is option is set to `false`, this function resizes the Viewport.
   * @param width The new width of the Viewport.
   * @param height The new height of the Viewport.
   */
  resize(width: number, height: number): void;

  /**
   * Update the viewport with the current changes of the scene tree.
   * ATOM: What exactly does this do? Is this like "render"?
   */
  update(): void;

  /**
   * Update the current node and all descendants in the scene tree.
   * ATOM: Please add some details here.
   * @param node The node to update.
   */
  updateNode(node: ITreeNode): void;

  /**
   * View the current scene in AR.
   * 
   * Please check first if the device supports the viewing of models in AR, see {@link viewableInAR}.
   * 
   * As some models might have a different scale then the AR apps (meters), the scaling can be chosen freely.
   * 
   * ATOM: How does this related to arScale? Let's also explain the process here to some extent, i.e. 
   *   * export to glTF
   *   * backend upload (which requires a session), and conversion for iOS
   *   * opening the AR asset 
   * Also: Does it make sense to expose the glTF exporting functionality?
   * 
   * @param androidOptions 
   */
  viewInAR(options?: { arScale?: 'auto' | 'fixed', arPlacement?: 'floor' | 'wall', xrEnvironment?: boolean }): Promise<void>;
  
  /**
   * Determines if the current devices supports the viewing in AR.
   */
  viewableInAR(): boolean;

  // #endregion Public Methods (30)
}