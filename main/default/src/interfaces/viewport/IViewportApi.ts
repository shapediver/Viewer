import { vec3 } from 'gl-matrix'
import { TEXTURE_ENCODING, TONE_MAPPING } from '@shapediver/viewer.rendering-engine.rendering-engine'
import { IDomEventListener } from '@shapediver/viewer.shared.services'
import { ITreeNode } from '@shapediver/viewer.shared.node-tree'
import {
  AnimationData,
  SDTFAttributeVisualizationData,
  SDTFItemData,
  SDTFOverview,
} from '@shapediver/viewer.shared.types'
import { IOrthographicCameraApi } from './camera/IOrthographicCameraApi'
import { IPerspectiveCameraApi } from './camera/IPerspectiveCameraApi'
import { ICameraApi } from './camera/ICameraApi'
import { ILightSceneApi } from './lights/ILightSceneApi'

export enum BUSY_MODE_DISPLAY {
  /** The viewport will be blurred when a session is busy. */
  BLUR = 'blur',
  /** A spinner will be shown when a session is busy. */
  SPINNER = 'spinner',
  /** Nothing happens when a session is busy. */
  NONE = 'none'
};

export enum SESSION_SETTINGS_MODE {
  /** No settings of a session will be used. */
  NONE = 'none',
  /** The first created session will be used for the settings of the viewport. */
  FIRST = 'first',
  /** The next created session will be used for the settings of the viewport. */
  NEXT = 'next',
  /** The previous created session will be used for the settings of the viewport. */
  PREVIOUS = 'previous',
};

/**
 * The api for a viewport.
 * A viewport can be started by calling the {@link createViewport} method.
 * 
 * Inside a session are the corresponding [cameras]{@link ICameraApi} and [lights]{@link ILightApi}.
 * Additionally, there are various other settings to adjust the behavior and rendering of the viewport.
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
   */
  enableAR: boolean;

  /**
   * The scaling factor that is used to display the scene in AR (Augmented Reality).
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
   */
  animations: AnimationData[];

  /**
   * Option to enable / disable the automatic resizing. (default: true)
   */
  automaticResizing: boolean;

  /**
   * The duration that the beauty rendering blends in.
   */
  beautyRenderBlendingDuration: number;

  /**
   * The delay with which the beauty rendering starts.
   */
  beautyRenderDelay: number;

  /**
   * The mode with which to indicate that the viewport is busy. (default: BUSY_MODE_DISPLAY.SPINNER)
   */
  busyModeDisplay: BUSY_MODE_DISPLAY;

  /**
   * The clear alpha value of the viewport.
   */
  clearAlpha: number;

  /**
   * The clear color value of the viewport.
   */
  clearColor: string | number | vec3;

  /**
   * The environment map of the viewport.
   */
  environmentMap: string | string[];

  /**
   * Option to set the environment map as the background of the viewport. (default: false)
   */
  environmentMapAsBackground: boolean;

  /**
   * The environment map resolution that is used for our deprecated cube maps.
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
   * Option to enable / disable the shadows of the viewport. (default: true)
   */
  shadows: boolean;

  /**
   * Option to show / hide the viewport.
   */
  show: boolean;

  /**
   * Option to show / hide the statistics. (default: false)
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
   * Provide a callback that transforms a {@link SDTFItemData} to a {@link SDTFAttributeVisualizationData}.
   * The {@link SDTFOverview} provides general information like min and max values for numbers or the available options for strings.
   */
  visualizeAttributes: ((overview: SDTFOverview, itemData?: SDTFItemData) => SDTFAttributeVisualizationData) | undefined;

  // #endregion Properties (34)

  // #region Public Methods (30)

  /**
   * Add a flag to freeze the camera.
   * If you want to stop this again call {@link removeCameraFreezeFlag} with the returned token.
   */
  addCameraFreezeFlag(): string;

  /**
   * Add an event listener that receives all canvas events.
   * 
   * @param listener The listener that is called when the events occur.
   */
  addCanvasEventListener(listener: IDomEventListener): string;

  /**
   * Add a flag to continuously render the scene.
   * If you want to stop this again call {@link removeContinuousRenderingFlag} with the returned token.
   */
  addContinuousRenderingFlag(): string;

  /**
   * Add a flag to continuously update the shadow map.
   * If you want to stop this again call {@link removeShadowMapUpdateFlag} with the returned token.
   */
  addShadowMapUpdateFlag(): string;

  /**
   * Assign the camera with the specified id to the viewport.
   * 
   * @param id The id of the camera.
   */
  assignCamera(id: string): void;

  /**
   * Assign the light scene with the current id to the viewport.
   * 
   * @param id The id of the light scene.
   */
  assignLightScene(id: string): boolean;

  /**
   * Closes the viewport.
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
   * Create the {@link SDTFOverview} for the provided node.
   * If no node was provided, the scene root is used instead.
   * 
   * @param node The node for which the overview is created.
   */
  createSDTFOverview(node: ITreeNode): SDTFOverview;

  /**
   * Deregister the busy mode with the specified id.
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
   * @param value The id of the busy mode.
   */
  registerBusyMode(value: string): boolean;

  /**
   * Remove the camera with the specified id.
   * 
   * @param id The id of the camera.
   */
  removeCamera(id: string): boolean;

  /**
   * Removes the registered flag for freezing the camera.
   * 
   * @param token The token that was returned by {@link addCameraFreezeFlag}.
   */
  removeCameraFreezeFlag(token: string): boolean;

  /**
   * Remove an event listener that received all canvas events.
   * 
   * @param token The token that was returned by {@link addCanvasEventListener}.
   */
  removeCanvasEventListener(token: string): boolean;

  /**
   * Removes the registered flag for continuous rendering.
   * 
   * @param token The token that was returned by {@link addContinuousRenderingFlag}.
   */
  removeContinuousRenderingFlag(token: string): boolean;

  /**
   * Remove the light scene with the specified id.
   * 
   * @param id The id of the light scene.
   */
  removeLightScene(id: string): boolean;

  /**
   * Removes the registered flag for continuous shadow map updates.
   * 
   * @param token The token that was returned by {@link addShadowMapUpdateFlag}.
   */
  removeShadowMapUpdateFlag(token: string): boolean;

  /**
   * Manual call to render the scene.
   */
  render(): void;

  /**
   * Reset the viewport.
   * Sets the {@link show}-value to false and waits for new settings to be registered.
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
   */
  update(): void;

  /**
   * Update the current node and all descendants in the scene tree.
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
   * @param androidOptions 
   */
  viewInAR(options?: { arScale?: 'auto' | 'fixed', arPlacement?: 'floor' | 'wall', xrEnvironment?: boolean }): Promise<void>;
  
  /**
   * Determines if the current devices supports the viewing in AR.
   */
  viewableInAR(): boolean;

  // #endregion Public Methods (30)
}