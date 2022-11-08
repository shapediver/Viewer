import { vec2, vec3 } from 'gl-matrix'
import { TEXTURE_ENCODING, TONE_MAPPING, BUSY_MODE_DISPLAY, FLAG_TYPE, SESSION_SETTINGS_MODE, RENDERER_TYPE } from '@shapediver/viewer.rendering-engine.rendering-engine'
import { IDomEventListener } from '@shapediver/viewer.shared.services'
import { ITreeNode } from '@shapediver/viewer.shared.node-tree'
import {
  IAnimationData,
  ISDTFAttributeVisualizationData,
  SDTFItemData,
  ISDTFOverview,
  ISDTFItemData,
  IGeometryData,
} from '@shapediver/viewer.shared.types'
import { IOrthographicCameraApi } from './camera/IOrthographicCameraApi'
import { IPerspectiveCameraApi } from './camera/IPerspectiveCameraApi'
import { ICameraApi } from './camera/ICameraApi'
import { ILightSceneApi } from './lights/ILightSceneApi'
import { ISettingsV3_1 } from '@shapediver/viewer.settings'

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
   * A dictionary of all animations that are currently present in the parts of
   * the scene tree relevant to this viewport.
   */
  readonly animations: {
    [key: string]: IAnimationData
  }

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
   * Optional identifier of the session to be used for loading / persisting settings of the viewport.
   * This is ignored in case {@link sessionSettingsMode} is not {@link SESSION_SETTINGS_MODE.MANUAL}.
   */
  readonly sessionSettingsId?: string;

  /**
   * Allows to control which session to use for loading / persisting settings of the viewport. 
   * (default: {@link SESSION_SETTINGS_MODE.FIRST}).
   * @see {@link sessionSettingsId} 
   */
  readonly sessionSettingsMode?: SESSION_SETTINGS_MODE;

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
   * @see {@link arScale}
   * @see {@link arTranslation}
   * @see {@link arRotation}
   */
  arScale: vec3;
  
  /**
   * The translation factor that is used when exporting the scene for AR (Augmented Reality). The unit system used by AR is meter.
   * 
   * @see {@link arScale}
   * @see {@link arTranslation}
   * @see {@link arRotation}
   */
  arTranslation: vec3;
  
  /**
   * The rotation factor that is used when exporting the scene for AR (Augmented Reality). The unit system used by AR is meter.
   * 
   * @see {@link arScale}
   * @see {@link arTranslation}
   * @see {@link arRotation}
   */
  arRotation: vec3;

  /**
   * Option to enable / disable the ambient occlusion post-processing. (default: false)
   */
  ambientOcclusion: boolean;

  /**
   * The ambient occlusion intensity.
   */
  ambientOcclusionIntensity: number;

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
   * You can either use the HDR maps at {@link ENVIRONMENT_MAP} or the LDR legacy maps at {@link ENVIRONMENT_MAP_CUBE}.
   * Additionally, you can specify your own maps. For HDR maps, provide a link to a .hdr file, for LDR provide the folder where the six cube map images are located.
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
   * The color of the ground plane shadow.
   */
  groundPlaneShadowColor: string | number | vec3;

  /**
   * Option to enable / disable the ground plane shadow. (default: false)
   */
  groundPlaneShadowVisibility: boolean;

  /**
   * Option to enable / disable lights. (default: true)
   */
  lights: boolean;

  /**
   * The encoding that is used for the output texture. (default: TEXTURE_ENCODING.SRGB)
   * This is the texture that is rendered to the screen.
   * 
   * @see {@link textureEncoding}
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
   * Option to enable / disable rendering of shadows. (default: true)
   */
  shadows: boolean;

  /**
   * Option to show / hide the viewport.
   * This will disable rendering, and hide the canvas behind the logo.
   * Using this setting especially makes sense with {@link VISIBILITY_MODE.MANUAL} where you can decide at what point you first want to show the scene.
   */
  show: boolean;

  /**
   * Option to show / hide rendering statistics overlayed to the viewport. (default: false)
   */
  showStatistics: boolean;

  /**
   * The encoding that is used for textures. (default: TEXTURE_ENCODING.SRGB)
   * 
   * @see {@link outputEncoding}
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
   * The type of rendering of this viewport.
   */
  type: RENDERER_TYPE;

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
   * Apply the settings of a viewport manually. You can get the settings via {@link getViewportSettings}.
   * You can choose which sections will be applied, by default they are all set to false.
   * 
   * @param settings 
   * @param sections 
   */
  applyViewportSettings(settings: ISettingsV3_1, sections?: { ar?: boolean | undefined; scene?: boolean | undefined; camera?: boolean | undefined; light?: boolean | undefined; environment?: boolean | undefined; general?: boolean | undefined; }): Promise<void>;

  /**
   * Assign the camera with the specified id to the viewport.
   * This will make the given camera the current one. 
   * 
   * @see {@link camera}
   * 
   * @param id The id of the camera.
   */
  assignCamera(id: string): boolean;

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
   * Closes the viewport and will remove all traces of the canvas element.
   */
  close(): Promise<void>;

  /**
   * Convert the given 3D position to different 2D coordinates of HTML Elements.
   * If the point is hidden by geometry, the hidden property will be set to true.
   * 
   * The returned coordinates all have their origin in the top left corner of the element.
   * For container, the position is relative to the canvas element.
   * For client, the position is relative to the canvas element, including the results of {@link https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect|getBoundingClientRect}.
   * For page, the position is relative to the whole page.
   * 
   * @param p 
   */
  convert3Dto2D(p: vec3): { container: vec2, client: vec2, page: vec2, hidden: boolean };

  /**
   * Convert the current visible elements (or just from the node specified) in the viewport into a glTF file.
   * 
   * The gound plane and grid will not be included, as well as additionally added data that was added to the scene other than through a {@link GeometryData} property.
   * 
   * @param node Optional node to provide to transform into a glTF. (default: scene tree)
   */
  convertToGlTF(node?: ITreeNode): Promise<Blob>;

  /**
   * Create a link / QRCode that can be opened by mobile devices to display in AR.
   * 
   * As some models might have a different scale then the AR apps (meters), the scaling can be chosen freely {@link arScale}.
   * 
   * Internally, the scene will first be converted into a glTF. This glTF will be uploaded to our backend and converted into a USDZ to be able to start AR on iOS and Android.
   * 
   * @param node Optional node to display in AR. (default: scene tree)
   * @param qrCode Option to receive a QR Code instead of a link (default: true)
   * @param fallbackUrl Optional fallback url if the link was opened by an unsupported device or an error occurred. If none was provided, the user will be redirected to shapediver.com/app
   */
  createArSessionLink(node?: ITreeNode, qrCode?: boolean, fallbackUrl?: string): Promise<string>;

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
   * Get the current settings object of this viewport.
   * Can be re-applied at a later point with {@link applyViewportSettings}.
   */
  getViewportSettings(): ISettingsV3_1;
  
  /**
   * Calculate the ray that is created by the mouse event and the camera.
   * 
   * @see {@link touchToRay}
   * @see {@link touchEventToRay}
   * @param event 
   * @returns 
   */
  mouseEventToRay(event: MouseEvent): { origin: vec3, direction: vec3 }

  /**
   * From the provided origin and direction, trace the ray through the scene.
   * The intersections with GeometryData will be returned including the corresponding nodes, sorted by their smallest distance.
   * 
   * If you want to raytrace the scene from an interaction with the the canvas, 
   * please use {@link mouseEventToRay}, {@link touchEventToRay} or {@link touchToRay} to create a ray first.
   * 
   * An optional root node can be provided to intersect. Per default, the whole scene tree will be intersected.
   * 
   * @param origin 
   * @param direction 
   * @param root 
   */
  raytraceScene(origin: vec3, direction: vec3, root?: ITreeNode): { distance: number, node: ITreeNode, data: IGeometryData }[]; 

  /**
   * Remove the camera with the specified id and destroys it.
   * If you remove the current active camera, the rendering will be stopped until a new camera is assigned.
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
   * If you remove the current active light scene, no lights will be shown.
   * 
   * @param id The id of the light scene.
   */
  removeLightScene(id: string): boolean;

  /**
   * Manual call to render the scene.
   */
  render(): void;

  /**
   * Delete all current cameras and create our 7 default cameras.
   * 
   * A perspective one (default) and 6 orthographic ones (top, bottom, left, right, front, back).
   */
  resetToDefaultCameras(): void;

  /**
   * If the {@link automaticResizing} is option is set to `false`, this function resizes the Viewport.
   * @param width The new width of the Viewport.
   * @param height The new height of the Viewport.
   */
  resize(width: number, height: number): void;

  /**
   * Create the ray that is created by the touch and the camera.
   * 
   * @see {@link mouseEventToRay}
   * @see {@link touchEventToRay}
   * @param event 
   * @returns 
   */
  touchToRay(event: Touch): { origin: vec3, direction: vec3 }

  /**
   * Create the ray that is created by the touch event and the camera.
   * 
   * @see {@link mouseEventToRay}
   * @see {@link touchToRay}
   * @param event 
   * @returns 
   */
  touchEventToRay(event: TouchEvent): { origin: vec3, direction: vec3 }

  /**
   * Update the viewport with the current changes of the complete scene tree.
   * This carries out preparations for rendering. Call it after doing 
   * direct changes to the scene tree. 
   */
  update(): void;

  /**
   * Update the position of the environment geometry (grid, groundplane, etc) to the current viewport bounding box.
   * Internally, this functions is called whenever a session is customized, 
   * but if you manually change parts of the scene, it might get necessary to call this function.
   * Make sure to call {@link update} before, to apply the last changes.
   */
  updateEnvironmentGeometry(): void;

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
   * As some models might have a different scale then the AR apps (meters), the scaling can be chosen freely {@link arScale}.
   * 
   * Internally, the scene will first be converted into a glTF. This glTF will be uploaded to our backend to be able to start AR.
   * 
   * @param node Optional node to display in AR. (default: scene tree)
   * @param androidOptions 
   */
  viewInAR(node?: ITreeNode): Promise<void>;
  
  /**
   * Determines if the current device supports viewing in AR.
   */
  viewableInAR(): boolean;

  // #endregion Public Methods (30)
}
