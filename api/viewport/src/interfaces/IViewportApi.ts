import {
	OrthographicCameraProperties,
	PerspectiveCameraProperties,
} from "@shapediver/viewer.rendering-engine.camera-engine";
import {IConvert3Dto2DResult} from "@shapediver/viewer.rendering-engine.rendering-engine";
import {ISettings} from "@shapediver/viewer.settings";
import {ITreeNode} from "@shapediver/viewer.shared.node-tree";
import {
	IDomEventListener,
	SESSION_SETTINGS_MODE,
} from "@shapediver/viewer.shared.services";
import {
	Color,
	FLAG_TYPE,
	IAnimationData,
	IGeometryData,
	IIntersectionFilter,
	ISDTFAttributeVisualizationData,
	ISDTFItemData,
	ISDTFOverview,
	MaterialBasicLineData,
	MaterialPointData,
	MaterialStandardData,
	MATERIAL_TYPE,
	RENDERER_TYPE,
	TEXTURE_ENCODING,
	TONE_MAPPING,
} from "@shapediver/viewer.shared.types";
import {quat, vec3} from "gl-matrix";
import * as THREE from "three";
import {ICameraApi} from "./camera/ICameraApi";
import {IOrthographicCameraApi} from "./camera/IOrthographicCameraApi";
import {IPerspectiveCameraApi} from "./camera/IPerspectiveCameraApi";
import {IPostProcessingApi} from "./IPostProcessingApi";
import {ILightSceneApi} from "./lights/ILightSceneApi";

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
	// #region Properties (60)

	/**
	 * A dictionary of all animations that are currently present in the parts of
	 * the scene tree relevant to this viewport.
	 */
	readonly animations: {
		[key: string]: IAnimationData;
	};

	/**
	 * The current [camera]{@link ICameraApi}.
	 */
	readonly camera: ICameraApi | null;
	/**
	 * The [cameras]{@link ICameraApi} of the viewport.
	 */
	readonly cameras: {[key: string]: ICameraApi};
	/**
	 * The canvas that is used to render the viewport.
	 */
	readonly canvas: HTMLCanvasElement;
	/**
	 * The default line material that is used for line geometry without a specified material.
	 * Please use {@link updateDefaultLineMaterial} to update the material.
	 */
	readonly defaultLineMaterial: MaterialBasicLineData;
	/**
	 * The default material that is used for geometry without a specified material.
	 * Please use {@link updateDefaultMaterial} to update the material.
	 */
	readonly defaultMaterial: MaterialStandardData;
	/**
	 * The default point material that is used for point geometry without a specified material.
	 * Please use {@link updateDefaultPointMaterial} to update the material.
	 */
	readonly defaultPointMaterial: MaterialPointData;
	/**
	 * The id of the viewport.
	 */
	readonly id: string;
	/**
	 * If the viewer is currently busy.
	 * This is set by the viewer [addFlag]{@link addFlag} and [removeFlag]{@link removeFlag} methods.
	 */
	readonly isBusy: boolean;
	/**
	 * The current [light scene]{@link ILightSceneApi}.
	 */
	readonly lightScene: ILightSceneApi | null;
	/**
	 * The [light scenes]{@link ILightSceneApi} of the viewport.
	 */
	readonly lightScenes: {[key: string]: ILightSceneApi};
	/**
	 * The [post processing api]{@link IPostProcessingApi} of the viewport.
	 *
	 * Note: The post-processing API is still WIP. Breaking changes are to be expected.
	 */
	readonly postProcessing: IPostProcessingApi;
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
	 * The rotation factor that is used when exporting the scene for AR (Augmented Reality). The unit system used by AR is meter.
	 *
	 * @see {@link arScale}
	 * @see {@link arTranslation}
	 * @see {@link arRotation}
	 */
	arRotation: vec3;
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
	 * Option to enable / disable the automatic color space adaption. This converts all color inputs to the chosen {@link outputEncoding}. (default: true)
	 */
	automaticColorAdjustment: boolean;
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
	clearColor: Color;
	/**
	 * The maximum percentage of height that is still considered for the creation of the contact shadow. (default: 0.25)
	 * The maximum height is equal to the width and height of the ground plane.
	 */
	contactShadowHeight: number;
	/**
	 * Option to enable / disable the contact shadow. (default: false)
	 */
	contactShadowVisibility: boolean;
	/**
	 * The blur amount of the contact shadow. (default: 1.5)
	 */
	contactShadowBlur: number;
	/**
	 * The darkness of the contact shadow. (default: 2.5)
	 */
	contactShadowDarkness: number;
	/**
	 * The opacity of the contact shadow. (default: 1)
	 */
	contactShadowOpacity: number;
	/**
	 * The color that is used when no material is specified. (default: #199b9b)
	 */
	defaultMaterialColor: Color;
	/**
	 * Option to enable / disable the AR (Augmented Reality) functionality for this viewport. (default: true)
	 * This setting is used purely for UI purposes, it does not have any influence on the viewport itself.
	 */
	enableAR: boolean;
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
	 * The amount of which the environment map is blurred. (default: 0)
	 */
	environmentMapBlurriness: number;
	/**
	 * Option to set the environment map for unlit materials. (default: false)
	 * For unlit materials, which use the three.js MeshBasicMaterial, per default we don't set the environment map to keep the colors as realistic as possible.
	 */
	environmentMapForUnlitMaterials: boolean;
	/**
	 * Scales how much the environment map effects the materials. (default: 1)
	 */
	environmentMapIntensity: number;
	/**
	 * The environment map resolution that is used for preset cube maps.
	 * @see {@link environmentMap}
	 */
	environmentMapResolution: string;
	/**
	 * The rotation quaternion that is used on the environment map. (default: [0,0,0,1])
	 */
	environmentMapRotation: quat;
	/**
	 * The color of the grid.
	 */
	gridColor: Color;
	/**
	 * Option to enable / disable the grid. (default: true)
	 */
	gridVisibility: boolean;
	/**
	 * The color of the ground plane.
	 */
	groundPlaneColor: Color;
	/**
	 * The color of the ground plane shadow.
	 */
	groundPlaneShadowColor: Color;
	/**
	 * Option to enable / disable the ground plane shadow. (default: false)
	 */
	groundPlaneShadowVisibility: boolean;
	/**
	 * Option to enable / disable the ground plane. (default: true)
	 */
	groundPlaneVisibility: boolean;
	/**
	 * Option to enable / disable lights. (default: true)
	 */
	lights: boolean;
	/**
	 * Option to load the default cameras when the viewport is created. (default: true)
	 * This will create 6 orthographic cameras (top, bottom, left, right, front, back).
	 */
	loadDefaultCameras: boolean;
	/**
	 * The type of material that is used as an override for all materials in the scene.
	 * This can be used to enforce a specific material type for all materials in the scene.
	 *
	 * As point and line materials are not supported by all three.js materials, the override will be ignored for these materials.
	 *
	 * If no override is set, the materials will be used as they are.
	 */
	materialOverrideType: MATERIAL_TYPE | undefined;
	/**
	 * The maximum size of the renderings. The renderings will be upscaled to the actual resolution if these values are lower than the resolution of the canvas.
	 * This setting exists, as for higher resolutions the performance can drop due to the rendering effort. (default: { width: 1920, height: 1080 })
	 */
	maximumRenderingSize: {width: number; height: number};
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
	 * Optional callback that is called after the rendering of the scene.
	 */
	postRenderingCallback?: (
		renderer: THREE.WebGLRenderer,
		scene: THREE.Scene,
		camera: THREE.Camera,
	) => void;
	/**
	 * Optional callback that is called before the rendering of the scene.
	 */
	preRenderingCallback?: (renderer: THREE.WebGLRenderer) => void;
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
	 * Option if the soft shadows should be rendered when the camera is not moving. (default: true)
	 */
	softShadows: boolean;
	/**
	 * The encoding that is used for textures. (default: TEXTURE_ENCODING.SRGB)
	 *
	 * @see {@link outputEncoding}
	 */
	textureEncoding: TEXTURE_ENCODING;
	/**
	 * Some of the three.js core objects so that you are free to use and adjust them yourself.
	 *
	 * Please note that the camera will be replaced when you change it via the API.
	 * The same goes for the children in the scene tree that are auto-generated and properties of the renderer that are adjusted internally.
	 */
	threeJsCoreObjects: {
		scene: THREE.Scene;
		renderer: THREE.WebGLRenderer;
		camera: THREE.Camera;
	};
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
	visualizeAttributes:
		| ((
				overview: ISDTFOverview,
				itemData?: ISDTFItemData,
		  ) => ISDTFAttributeVisualizationData)
		| undefined;

	// #endregion Properties (60)

	// #region Public Methods (41)

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
	 * Add a token to the list of restricted canvas listener tokens.
	 * This can be used to restrict events for a viewport.
	 * Only listeners with a token in this list will receive events (if there is at least one item in the list).
	 *
	 * @param token
	 */
	addRestrictedCanvasListenerToken(token: string): void;
	/**
	 * Apply the settings of a viewport manually. You can get the settings via {@link getViewportSettings}.
	 * You can choose which sections will be applied, by default they are all set to false.
	 *
	 * @param settings
	 * @param sections
	 *
	 * @throws {@type ShapeDiverViewerError}
	 */
	applyViewportSettings(
		settings: ISettings,
		sections?: {
			ar?: boolean | undefined;
			scene?: boolean | undefined;
			camera?: boolean | undefined;
			light?: boolean | undefined;
			environment?: boolean | undefined;
			general?: boolean | undefined;
			postprocessing?: boolean | undefined;
		},
	): Promise<void>;
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
	 * Continue the rendering of the scene.
	 * Can be used with {@link pauseRendering} to continue/pause the rendering at will.
	 *
	 * @see {@link pauseRendering}
	 */
	continueRendering(): void;
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
	convert3Dto2D(p: vec3): IConvert3Dto2DResult;
	/**
	 * Convert the current visible elements (or just from the node specified) in the viewport into a glTF file.
	 *
	 * The ground plane and grid will not be included, as well as additionally added data that was added to the scene other than through a {@link GeometryData} property.
	 *
	 * @param node Optional node to provide to transform into a glTF. (default: scene tree)
	 * @param convertForAR Option to convert the scene for AR. In this case some specific use cases are target to ensure the best AR performance. (default: false)
	 *
	 * @throws {@type ShapeDiverViewerError}
	 */
	convertToGlTF(node?: ITreeNode, convertForAR?: boolean): Promise<Blob>;
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
	 *
	 * @throws {@type ShapeDiverViewerError}
	 */
	createArSessionLink(
		node?: ITreeNode,
		qrCode?: boolean,
		fallbackUrl?: string,
	): Promise<string>;
	/**
	 * Create a new light scene.
	 * An id can be provided. If not, a unique id will be created.
	 * If the standard option is chosen, the default lights will be added from the start.
	 *
	 * @param properties.id The id of the light scene.
	 * @param properties.standard The option to add the standard lights.
	 */
	createLightScene(properties?: {
		name?: string;
		standard?: boolean;
	}): ILightSceneApi;
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
	 * Create a screenshot for the requested type and options.
	 *
	 * @param type The type as string, default is 'image/png'.
	 * @param quality The quality of the screenshot, default is 1.
	 * @param resolution The resolution of the screenshot, default is the current canvas size.
	 * @param camera The camera that should be used for the screenshot, default is the current camera.
	 */
	getScreenshotAdvanced(
		type?: string,
		quality?: number,
		resolution?: {width: number; height: number},
		camera?: OrthographicCameraProperties | PerspectiveCameraProperties,
	): Promise<string>;
	/**
	 * Get the current settings object of this viewport.
	 * Can be re-applied at a later point with {@link applyViewportSettings}.
	 */
	getViewportSettings(): ISettings;
	/**
	 * Determines if the current device is a mobile device (or tablet) but still doesn't support to view the content in AR.
	 *
	 * Can be used in combination with {@link viewableInAR} to display a warning to use a different browser
	 * if {@link viewableInAR} is false and {@link isMobileDeviceWithoutBrowserARSupport} is true.
	 *
	 * Reasons for that can be:
	 *  - Firefox on Android
	 *  - Instagram in App browser
	 */
	isMobileDeviceWithoutBrowserARSupport(): boolean;
	/**
	 * Pause the rendering of the scene.
	 * Can be used with {@link continueRendering} to continue/pause the rendering at will.
	 *
	 * @see {@link continueRendering}
	 */
	pauseRendering(): void;
	/**
	 * Calculate the ray that is created by the pointer event and the camera.
	 *
	 * @param event
	 * @returns
	 */
	pointerEventToRay(event: PointerEvent): {origin: vec3; direction: vec3};

	/**
	 * From the provided origin and direction, trace the ray through the scene.
	 * The intersections with GeometryData will be returned including the corresponding nodes, sorted by their smallest distance.
	 *
	 * If you want to raytrace the scene from an interaction with the the canvas,
	 * please use {@link pointerEventToRay} to create a ray first.
	 *
	 * @param origin The origin of the ray.
	 * @param direction The direction of the ray.
	 * @param filterCriteria Optional filter criteria to filter the intersections.
	 */
	raytraceScene(
		origin: vec3,
		direction: vec3,
		filterCriteria?: IIntersectionFilter[],
	): {distance: number; node: ITreeNode; data?: IGeometryData}[];
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
	 * Remove the token from the list of restricted canvas listener tokens.
	 * Only listeners with a token in this list will receive events (if there is at least one item in the list).
	 */
	removeRestrictedCanvasListenerToken(token: string): void;
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
	 * Restrict events.
	 * This can be used to disable events for a viewport.
	 *
	 * Example use case: If you don't want to allow mouse wheel events for a specific viewport so that users can scroll past the viewport.
	 *
	 * Be aware that this might cause some issues with the the camera controls if the pointer events are disabled only partially.
	 *
	 * @param allowedListeners
	 */
	restrictEventListeners(allowedListeners: {
		mousewheel?: boolean;
		pointerdown?: boolean;
		pointermove?: boolean;
		pointerup?: boolean;
		pointerout?: boolean;
		keydown?: boolean;
		keyup?: boolean;
		contextmenu?: boolean;
	}): void;
	/**
	 * Update the viewport with the current changes of the complete scene tree.
	 * This carries out preparations for rendering. Call it after doing
	 * direct changes to the scene tree.
	 */
	update(): void;
	/**
	 * Update the default line material of the viewport.
	 *
	 * @param value The new default line material.
	 */
	updateDefaultLineMaterial(value: MaterialBasicLineData): void;
	/**
	 * Update the default materials of the viewport.
	 *
	 * @param value The new default material.
	 */
	updateDefaultMaterial(value: MaterialStandardData): void;
	/**
	 * Update the default point material of the viewport.
	 *
	 * @param value The new default point material.
	 */
	updateDefaultPointMaterial(value: MaterialPointData): void;
	/**
	 * Update the position of the environment geometry (grid, groundplane, etc) to the current viewport bounding box.
	 * Internally, this functions is called whenever a session is customized,
	 * but if you manually change parts of the scene, it might get necessary to call this function.
	 * Make sure to call {@link update} before, to apply the last changes.
	 */
	updateEnvironmentGeometry(): void;
	/**
	 * Update the viewport with the current changes of given scene tree node and its descendants.
	 * This carries out preparations for rendering. Call it after doing direct changes to the scene tree.
	 *
	 * @param node The node to update.
	 */
	updateNode(node: ITreeNode): void;
	/**
	 * Update the viewport with the current changes in transformation of given scene tree node and its descendants.
	 * This carries out preparations for rendering. Call it after doing direct changes to the scene tree transformations.
	 *
	 * @param node The node to update.
	 */
	updateNodeTransformation(node: ITreeNode): void;
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
	 *
	 * @throws {@type ShapeDiverViewerError}
	 */
	viewInAR(node?: ITreeNode): Promise<void>;
	/**
	 * Determines if the current device supports viewing in AR.
	 *
	 * Can be used in combination with {@link isMobileDeviceWithoutBrowserARSupport} to display a warning to use a different browser
	 * if {@link viewableInAR} is false and {@link isMobileDeviceWithoutBrowserARSupport} is true.
	 */
	viewableInAR(): boolean;

	// #endregion Public Methods (41)
}
