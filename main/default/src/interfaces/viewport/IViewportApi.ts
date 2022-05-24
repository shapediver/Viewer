import { vec3 } from 'gl-matrix'
import { TEXTURE_ENCODING, TONE_MAPPING, BUSY_MODE_DISPLAY, FLAG_TYPE, SESSION_SETTINGS_MODE } from '@shapediver/viewer.rendering-engine.rendering-engine'
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
 * The api for viewports.
 * 
 * Viewports are created by calling the {@link createViewport} method.
 * 
 * Each viewport has corresponding [cameras]{@link ICameraApi} and [lights]{@link ILightApi}.
 * 
 * Additionally, there are various other settings to adjust the behavior and rendering of the viewport.
 * 
 * By default a new viewport displays the complete scene tree. Viewports can be excluded from 
 * displaying geometry for specific sessions by using the {@link excludeViewports} property of
 * {@link ISessionApi}.
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
   * Option to enable / disable the AR (Augmented Reality) functionality for this viewport. (default: true)
   * This setting is used purely for UI purposes, it does not have any influence on the viewport itself.
   */
  enableAR: boolean;

  /**
   * The scaling factor that is used when exporting the scene for AR (Augmented Reality).
   * 
   * The unit system used by AR is meter, therefore this scaling factor needs to be chosen
   * such that scene coordinates are transformed to meters.
   * 
   * ATOM: Please link to the corresponding arTranslation and arRotation properties, and explain in which order they get applied. 
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
   * An array of all animations that are currently present in the parts of
   * the scene tree relevant to this viewport.
   */
  animations: IAnimationData[];

  /**
   * Option to enable / disable the automatic resizing of the viewport to changes of the {@link canvas}. (default: true)
   */
  automaticResizing: boolean;

  /**
   * The duration used by the beauty rendering to blend in (milliseconds).
   */
  beautyRenderBlendingDuration: number;

  /**
   * The delay after which the beauty rendering starts (milliseconds).
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
   * ATOM: Let's add detailed requirements here (image types, when do we need a single image, how many images if not a single, preset envmaps)
   */
  environmentMap: string | string[];

  /**
   * Option to set the environment map as the background of the viewport. (default: false)
   */
  environmentMapAsBackground: boolean;

  /**
   * The environment map resolution that is used for preset cube maps.
   * @see {@link environmentMap}
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
   * 
   * ATOM: Please link to {@link textureEncoding} and explain the difference.
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
   * Optional identifier of the session to be used for loading / persisting settings of the viewport.
   * This is ignored in case {@link sessionSettingsMode} is not {@link SESSION_SETTINGS_MODE.CUSTOM}.
   */
  sessionSettingsId: string;

  /**
   * Allows to control which session to use for loading / persisting settings of the viewport. 
   * (default: {@link SESSION_SETTINGS_MODE.FIRST}).
   * @see {@link sessionSettingsId} 
   */
  sessionSettingsMode?: SESSION_SETTINGS_MODE;

  /**
   * Option to enable / disable rendering of shadows. (default: true)
   */
  shadows: boolean;

  /**
   * Option to show / hide the viewport.
   * ATOM: Let's add some details here. This will disable rendering, and hide the canvas behind a div, etc
   */
  show: boolean;

  /**
   * Option to show / hide rendering statistics overlayed to the viewport. (default: false)
   */
  showStatistics: boolean;

  /**
   * The encoding that is used for textures. (default: TEXTURE_ENCODING.SRGB)
   * 
   * ATOM: Please link to {@link outputEncoding} and explain the difference.
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
   * 
   * ATOM: I guess this will be partially updated as part of https://shapediver.atlassian.net/browse/SS-5174
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
   * This will make the given camera the current one. 
   * 
   * @see {@link camera}
   * 
   * @param id The id of the camera.
   */
  assignCamera(id: string): void;

  /**
   * Assign the light scene with the current id to the viewport.
   * This will make the given light scene the current one.
   * 
   * @see {@link lightScene}
   * 
   * @param id The id of the light scene.
   */
  assignLightScene(id: string): boolean;

  /**
   * Closes the viewport.
   * ATOM: Please add some details. Will this remove all traces of the viewport on the canvas element?
   */
  close(): Promise<void>;

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
   * ATOM: I guess this will be partially updated as part of https://shapediver.atlassian.net/browse/SS-5174
   * 
   * @param node The node for which the overview is created.
   */
  createSDTFOverview(node: ITreeNode): ISDTFOverview;

  /**
   * Display an error message on the canvas.
   * 
   * @param message The message to display.
   */
  displayErrorMessage(message: string): void;

  /**
   * Get the complete URL of the current environment map, if it is a single file.
   * This can be used in case {@link environmentMap} is set to a preset environment map.
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
   * If the {@link automaticResizing} is option is set to `false`, this function resizes the Viewport.
   * @param width The new width of the Viewport.
   * @param height The new height of the Viewport.
   */
  resize(width: number, height: number): void;

  /**
   * Update the viewport with the current changes of the complete scene tree.
   * This carries out preparations for rendering. Call it after doing 
   * direct changes to the scene tree. 
   */
  update(): void;

  /**
   * Update the viewport with the current changes of given scene tree node and its descendants.
   * This carries out preparations for rendering. Call it after doing 
   * direct changes to the scene tree. 
   * 
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
   * Determines if the current device supports viewing in AR.
   */
  viewableInAR(): boolean;

  // #endregion Public Methods (30)
}