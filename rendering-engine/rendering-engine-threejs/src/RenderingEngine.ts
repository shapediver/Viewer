import * as THREE from "three";

import {AnimationEngine} from "@shapediver/viewer.rendering-engine.animation-engine";
import {CameraEngine} from "@shapediver/viewer.rendering-engine.camera-engine";
import {
	CanvasEngine,
	ICanvas,
} from "@shapediver/viewer.rendering-engine.canvas-engine";
import {LightEngine} from "@shapediver/viewer.rendering-engine.light-engine";
import {ITree, ITreeNode, Tree} from "@shapediver/viewer.shared.node-tree";
import {
	Converter,
	DomEventEngine,
	EventEngine,
	EVENTTYPE_VIEWPORT,
	Logger,
	SESSION_SETTINGS_MODE,
	SettingsEngine,
	ShapeDiverViewerEnvironmentMapError,
	StateEngine,
	SystemInfo,
	UuidGenerator,
} from "@shapediver/viewer.shared.services";
import {
	BUSY_MODE_DISPLAY,
	Color,
	FLAG_TYPE,
	IGeometryData,
	IIntersectionFilter,
	ISDTFAttributeVisualizationData,
	ISDTFItemData,
	ISDTFOverview,
	ISDTFOverviewData,
	IViewportEvent,
	IViewportSettingsSections,
	MaterialBasicLineData,
	MaterialPointData,
	MaterialStandardData,
	MATERIAL_TYPE,
	RENDERER_TYPE,
	SDTFOverviewData,
	SPINNER_POSITIONING,
	TEXTURE_ENCODING,
	TONE_MAPPING,
	ViewportCreationDefinition,
	VISIBILITY_MODE,
} from "@shapediver/viewer.shared.types";

import {quat, vec2, vec3} from "gl-matrix";

import {IRenderingEngineThreeJS} from "./interfaces/IRenderingEngine";
import {EnvironmentMapLoader} from "./loaders/EnvironmentMapLoader";
import {GeometryLoader} from "./loaders/GeometryLoader";
import {HTMLElementAnchorLoader} from "./loaders/HTMLElementAnchorLoader";
import {LightLoader} from "./loaders/LightLoader";
import {adaptShaders, MaterialLoader} from "./loaders/MaterialLoader";
import {ARManager} from "./managers/ARManager";
import {CameraManager} from "./managers/CameraManager";
import {EnvironmentGeometryManager} from "./managers/EnvironmentGeometryManager";
import {FlagManager} from "./managers/FlagManager";
import {PostProcessingManager} from "./managers/PostProcessingManager";
import {RenderingManager} from "./managers/RenderingManager";
import {SceneTracingManager} from "./managers/SceneTracingManager";
import {SceneTreeManager} from "./managers/SceneTreeManager";
import {SettingsManager} from "./managers/SettingsManager";
import {SDColor} from "./objects/SDColor";
import {css} from "./styling/viewport-css";

export class RenderingEngine implements IRenderingEngineThreeJS {
	private readonly _animationEngine: AnimationEngine =
		AnimationEngine.instance;
	private readonly _arManager: ARManager;

	// constructor properties
	private readonly _branding: {
		logo: string | null;
		backgroundColor: string;
		busyModeSpinner: string;
		busyModeDisplay: BUSY_MODE_DISPLAY;
		spinnerPositioning: SPINNER_POSITIONING;
	};

	// engines
	private readonly _cameraEngine: CameraEngine;
	private readonly _cameraManager: CameraManager;

	// viewer essentials
	private readonly _canvas: ICanvas;
	private readonly _canvasEngine: CanvasEngine = CanvasEngine.instance;
	private readonly _colorCache: SDColor[] = [];

	// utils
	private readonly _converter: Converter = Converter.instance;
	private readonly _domEventEngine: DomEventEngine;
	private readonly _environmentGeometryManager: EnvironmentGeometryManager;
	private readonly _logger: Logger = Logger.instance;

	// loaders
	private readonly _environmentMapLoader: EnvironmentMapLoader;
	private readonly _eventEngine: EventEngine = EventEngine.instance;
	private readonly _flagManager: FlagManager;
	private readonly _geometryLoader: GeometryLoader;
	private readonly _htmlElementAnchorLoader: HTMLElementAnchorLoader;
	private readonly _id: string;
	private readonly _lightEngine: LightEngine;
	private readonly _lightLoader: LightLoader;
	private readonly _materialLoader: MaterialLoader;
	private readonly _postProcessingManager: PostProcessingManager;
	private readonly _renderingManager: RenderingManager;
	private readonly _sceneTracingManager: SceneTracingManager;
	private readonly _sceneTreeManager: SceneTreeManager;
	private readonly _settingsManager: SettingsManager;
	private readonly _stateEngine: StateEngine = StateEngine.instance;
	private readonly _systemInfo: SystemInfo = SystemInfo.instance;
	private readonly _tree: ITree = Tree.instance;
	private readonly _visibility: VISIBILITY_MODE;
	private readonly _visibilitySessionIds?: string[];
	readonly #defaultLogo: string =
		"https://viewer.shapediver.com/v3/graphics/logo_animated_breath.svg";
	readonly #defaultSpinner: string =
		"https://viewer.shapediver.com/v3/graphics/spinner_ripple.svg";

	// settings
	private _arRotation: vec3 = vec3.create();
	private _arScale: vec3 = vec3.fromValues(1, 1, 1);
	private _arTranslation: vec3 = vec3.create();
	private _automaticColorAdjustment: boolean = true;
	private _automaticResizing: boolean = true;
	private _beautyRenderBlendingDuration: number = 1500;
	private _beautyRenderDelay: number = 50;
	private _busy: boolean = false;
	private _busyModeDisplay: BUSY_MODE_DISPLAY = BUSY_MODE_DISPLAY.SPINNER;
	private _clearAlpha: number = 1.0;
	private _clearColor: Color = "#ffffff";

	// viewer global vars
	private _closed: boolean = false;
	private _enableAR: boolean = true;
	private _environmentMap: string | string[] = "null";
	private _environmentMapAsBackground: boolean = false;
	private _environmentMapBlurriness: number = 0;
	private _environmentMapForUnlitMaterials: boolean = false;
	private _environmentMapIntensity: number = 1;
	private _environmentMapResolution: string = "1024";
	private _environmentMapRotation: quat = quat.create();
	private _gridVisibility: boolean = true;
	private _groundPlaneShadowVisibility: boolean = false;
	private _groundPlaneVisibility: boolean = true;
	private _lights: boolean = true;
	private _logoDivElement: HTMLDivElement;
	private _maximumRenderingSize: {width: number; height: number} = this
		._systemInfo.isMobile
		? {width: 1280, height: 720}
		: {width: 1920, height: 1080};
	private _pause: boolean = false;
	private _postRenderingCallback?:
		| ((
				renderer: THREE.WebGLRenderer,
				scene: THREE.Scene,
				camera: THREE.Camera,
		  ) => void)
		| undefined;
	private _preRenderingCallback?:
		| ((renderer: THREE.WebGLRenderer) => void)
		| undefined;
	private _renderer: THREE.WebGLRenderer;
	private _shadows: boolean = true;
	private _show: boolean = false;
	private _showStatistics: boolean = false;
	private _softShadows: boolean = true;
	private _spinnerDivElement: HTMLDivElement;
	private _toneMapping: TONE_MAPPING = TONE_MAPPING.NONE;
	private _type: RENDERER_TYPE = RENDERER_TYPE.STANDARD;
	private _useLegacyLights: boolean = false;
	private _visualizeAttributes:
		| ((
				overview: ISDTFOverview,
				itemData?: ISDTFItemData,
		  ) => ISDTFAttributeVisualizationData)
		| undefined;

	constructor(properties: Partial<ViewportCreationDefinition>) {
		// THREE object has default Y, we change that (although it doesn't work everywhere)
		THREE.Object3D.DEFAULT_UP = new THREE.Vector3(0, 0, 1);
		THREE.ColorManagement.enabled = false;

		// adapt some of the three.js shaders according to our needs
		adaptShaders();

		// add css to the document
		const style = document.createElement("style");
		style.innerHTML = css;
		document.head.appendChild(style);

		const prop = Object.assign({}, properties);
		const branding = Object.assign({}, prop.branding);

		// setting some of the provided properties
		this._id = prop.id || UuidGenerator.instance.create();
		this._visibilitySessionIds = prop.visibilitySessionIds;
		this._visibility = prop.visibility || VISIBILITY_MODE.SESSION;
		this._branding = {
			logo:
				branding.logo === undefined ? this.#defaultLogo : branding.logo,
			backgroundColor: branding.backgroundColor || "#393a45FF",
			busyModeSpinner:
				branding.busyModeSpinner === undefined
					? this.#defaultSpinner
					: branding.busyModeSpinner,
			busyModeDisplay:
				branding.busyModeDisplay || BUSY_MODE_DISPLAY.SPINNER,
			spinnerPositioning:
				branding.spinnerPositioning || SPINNER_POSITIONING.BOTTOM_RIGHT,
		};

		// creation of viewer essentials
		this._canvas = this._canvasEngine.getCanvas(
			this._canvasEngine.createCanvasObject(prop.canvas),
		);

		// creation of the engines (all singleton engines were created already)
		this._domEventEngine = new DomEventEngine(this._canvas.canvasElement);
		this._cameraEngine = new CameraEngine(this);
		this._lightEngine = new LightEngine(this);

		// creation of the managers (all singleton engines were created already)
		this._cameraManager = new CameraManager(this);
		this._environmentGeometryManager = new EnvironmentGeometryManager(this);
		this._sceneTracingManager = new SceneTracingManager(this);
		this._sceneTreeManager = new SceneTreeManager(this);
		this._renderingManager = new RenderingManager(this);
		this._postProcessingManager = new PostProcessingManager(this);
		this._settingsManager = new SettingsManager(this, {
			sessionSettingsMode:
				prop.sessionSettingsMode || SESSION_SETTINGS_MODE.FIRST,
			sessionSettingsId: prop.sessionSettingsId,
		});
		this._arManager = new ARManager(this);
		this._flagManager = new FlagManager(this, {
			flags: prop.flags,
		});

		// loaders
		this._environmentMapLoader = new EnvironmentMapLoader(this);
		this._materialLoader = new MaterialLoader(this);
		this._geometryLoader = new GeometryLoader(this);
		this._htmlElementAnchorLoader = new HTMLElementAnchorLoader(this);
		this._lightLoader = new LightLoader(this);

		// start the creation and initialization process
		this._renderer = this.renderingManager.createRenderer(
			this._canvas.canvasElement,
		);
		this._spinnerDivElement = this.renderingManager.addSpinner(
			this._canvas.canvasElement,
			this._branding,
		);
		this._logoDivElement = this.renderingManager.addLogo(
			this._canvas.canvasElement,
			this._branding,
		);

		// creation of the managers (all singleton engines were created already)
		this._cameraManager.init();
		this._environmentGeometryManager.init();
		this._sceneTracingManager.init();
		this._sceneTreeManager.init();
		this._renderingManager.init();
		this._postProcessingManager.init();
		this._settingsManager.init();
		this._arManager.init();

		// loaders
		this._environmentMapLoader.init();
		this._materialLoader.init();
		this._geometryLoader.init();
		this._htmlElementAnchorLoader.init();
		this._lightLoader.init();
	}

	public get arRotation(): vec3 {
		return this._arRotation;
	}

	public set arRotation(value: vec3) {
		this._arRotation = value;
	}

	public get arScale(): vec3 {
		return this._arScale;
	}

	public set arScale(value: vec3) {
		this._arScale = value;
	}

	public get arTranslation(): vec3 {
		return this._arTranslation;
	}

	public set arTranslation(value: vec3) {
		this._arTranslation = value;
	}

	public get automaticColorAdjustment(): boolean {
		return this._automaticColorAdjustment;
	}

	public set automaticColorAdjustment(value: boolean) {
		if (this._automaticColorAdjustment === value) return;
		this._automaticColorAdjustment = value;
		this._colorCache.forEach((c) => c.colorCorrection(value));
		this._materialLoader.assignColorCorrection(value);
	}

	public get automaticResizing(): boolean {
		return this._automaticResizing;
	}

	public set automaticResizing(value: boolean) {
		this._automaticResizing = value;
	}

	public get beautyRenderBlendingDuration(): number {
		return this._beautyRenderBlendingDuration;
	}

	public set beautyRenderBlendingDuration(value: number) {
		this._beautyRenderBlendingDuration = value;
	}

	public get beautyRenderDelay(): number {
		return this._beautyRenderDelay;
	}

	public set beautyRenderDelay(value: number) {
		this._beautyRenderDelay = value;
	}

	public get branding(): {
		logo: string | null;
		backgroundColor: string;
		busyModeSpinner: string;
		busyModeDisplay: BUSY_MODE_DISPLAY;
		spinnerPositioning: SPINNER_POSITIONING;
	} {
		return this._branding;
	}

	public get busy(): boolean {
		return this._busy;
	}

	public set busy(value: boolean) {
		this._busy = value;
	}

	public get busyModeDisplay(): BUSY_MODE_DISPLAY {
		return this._busyModeDisplay;
	}

	public set busyModeDisplay(value: BUSY_MODE_DISPLAY) {
		this._busyModeDisplay = value;
	}

	public get camera(): THREE.Camera {
		return this._cameraManager.camera;
	}

	public get cameraEngine(): CameraEngine {
		return this._cameraEngine;
	}

	public get cameraManager(): CameraManager {
		return this._cameraManager;
	}

	public get canvas(): HTMLCanvasElement {
		return this._canvas.canvasElement;
	}

	public get clearAlpha(): number {
		return this._clearAlpha;
	}

	public set clearAlpha(value: number) {
		this._clearAlpha = value;
	}

	public get clearColor(): Color {
		return this._clearColor;
	}

	public set clearColor(value: Color) {
		this._clearColor = value;
	}

	public get closed(): boolean {
		return this._closed;
	}

	public get colorCache(): SDColor[] {
		return this._colorCache;
	}

	public get contactShadowBlur(): number {
		return this._environmentGeometryManager.contactShadow.blur;
	}

	public set contactShadowBlur(value: number) {
		this._environmentGeometryManager.contactShadow.blur = value;
	}

	public get contactShadowDarkness(): number {
		return this._environmentGeometryManager.contactShadow.darkness;
	}

	public set contactShadowDarkness(value: number) {
		this._environmentGeometryManager.contactShadow.darkness = value;
	}

	public get contactShadowHeight(): number {
		return this._environmentGeometryManager.contactShadow.height;
	}

	public set contactShadowHeight(value: number) {
		this._environmentGeometryManager.contactShadow.height = value;
	}

	public get contactShadowOpacity(): number {
		return this._environmentGeometryManager.contactShadow.opacity;
	}

	public set contactShadowOpacity(value: number) {
		this._environmentGeometryManager.contactShadow.opacity = value;
	}

	public get contactShadowVisibility(): boolean {
		return this._environmentGeometryManager.contactShadow.visible;
	}

	public set contactShadowVisibility(value: boolean) {
		this._environmentGeometryManager.contactShadow.visible = value;
	}

	public get continuousRendering(): boolean {
		return this._renderingManager.continuousRendering;
	}

	public set continuousRendering(value: boolean) {
		this._renderingManager.continuousRendering = value;
	}

	public get continuousShadowMapUpdate(): boolean {
		return this._renderingManager.continuousShadowMapUpdate;
	}

	public set continuousShadowMapUpdate(value: boolean) {
		this._renderingManager.continuousShadowMapUpdate = value;
	}

	public get defaultLineMaterial(): MaterialBasicLineData {
		return this.materialLoader.defaultLineMaterialData;
	}

	public set defaultLineMaterial(value: MaterialBasicLineData) {
		this.materialLoader.defaultLineMaterialData = value;
	}

	public get defaultMaterial(): MaterialStandardData {
		return this.materialLoader.defaultMaterialData;
	}

	public set defaultMaterial(value: MaterialStandardData) {
		this.materialLoader.defaultMaterialData = value;
	}

	public get defaultMaterialColor(): Color {
		return this.materialLoader.defaultMaterialData.color;
	}

	public set defaultMaterialColor(value: Color) {
		this.materialLoader.defaultMaterialData.color = value;
		this.materialLoader.assignDefaultMaterial();
		this.materialLoader.defaultLineMaterialData.color = value;
		this.materialLoader.assignDefaultLineMaterial();
		this.materialLoader.defaultPointMaterialData.color = value;
		this.materialLoader.assignDefaultPointMaterial();
	}

	public get defaultPointMaterial(): MaterialPointData {
		return this.materialLoader.defaultPointMaterialData;
	}

	public set defaultPointMaterial(value: MaterialPointData) {
		this.materialLoader.defaultPointMaterialData = value;
	}

	public get domEventEngine(): DomEventEngine {
		return this._domEventEngine;
	}

	public get enableAR(): boolean {
		return this._enableAR;
	}

	public set enableAR(value: boolean) {
		this._enableAR = value;
	}

	public get environmentGeometryManager(): EnvironmentGeometryManager {
		return this._environmentGeometryManager;
	}

	public get environmentMap(): string | string[] {
		return this._environmentMap;
	}

	public set environmentMap(value: string | string[]) {
		const previous = this._environmentMap;
		this._environmentMap = value;
		this._environmentMapLoader.load(this.environmentMap).catch((error) => {
			if (error instanceof ShapeDiverViewerEnvironmentMapError) {
				this._logger.error(error.message);
			} else {
				this._logger.error(
					`RenderingEngine.environmentMap: Error while loading environment map ${value}: ${error}`,
				);
			}

			this._environmentMap = previous;
			this._environmentMapLoader.load(this.environmentMap);
		});
	}

	public get environmentMapAsBackground(): boolean {
		return this._environmentMapAsBackground;
	}

	public set environmentMapAsBackground(value: boolean) {
		this._environmentMapAsBackground = value;
	}

	public get environmentMapBlurriness(): number {
		return this._environmentMapBlurriness;
	}

	public set environmentMapBlurriness(value: number) {
		this._environmentMapBlurriness = value;
		this._sceneTreeManager.scene.backgroundBlurriness =
			this._environmentMapBlurriness;
	}

	public get environmentMapForUnlitMaterials(): boolean {
		return this._environmentMapForUnlitMaterials;
	}

	public set environmentMapForUnlitMaterials(value: boolean) {
		this._environmentMapForUnlitMaterials = value;
		this._materialLoader.assignEnvironmentMapForUnlitMaterials(value);
	}

	public get environmentMapIntensity(): number {
		return this._environmentMapIntensity;
	}

	public set environmentMapIntensity(value: number) {
		this._environmentMapIntensity = value;
		this._sceneTreeManager.scene.backgroundIntensity = value;
		this._materialLoader.assignEnvironmentMapIntensity(value);
	}

	public get environmentMapLoader(): EnvironmentMapLoader {
		return this._environmentMapLoader;
	}

	public get environmentMapResolution(): string {
		return this._environmentMapResolution;
	}

	public set environmentMapResolution(value: string) {
		this._environmentMapResolution = value;
		this._environmentMapLoader.load(this.environmentMap);
	}

	public get environmentMapRotation(): quat {
		return this._environmentMapRotation;
	}

	public set environmentMapRotation(value: quat) {
		this._environmentMapRotation = value;
		this._materialLoader.assignEnvironmentMapRotation(value);
	}

	public get geometryLoader(): GeometryLoader {
		return this._geometryLoader;
	}

	public get gridColor(): Color {
		return this._environmentGeometryManager.grid.color;
	}

	public set gridColor(value: Color) {
		this._environmentGeometryManager.grid.color = value;
	}

	public get gridVisibility(): boolean {
		return this._gridVisibility;
	}

	public set gridVisibility(value: boolean) {
		this._environmentGeometryManager.grid.visible = value;
		this._gridVisibility = value;
	}

	public get groundPlaneColor(): Color {
		return this._environmentGeometryManager.groundPlane?.color;
	}

	public set groundPlaneColor(value: Color) {
		this._environmentGeometryManager.groundPlane.color = value;
	}

	public get groundPlaneShadowColor(): Color {
		return this._environmentGeometryManager.groundPlaneShadow.color;
	}

	public set groundPlaneShadowColor(value: Color) {
		this._environmentGeometryManager.groundPlaneShadow.color = value;
	}

	public get groundPlaneShadowVisibility(): boolean {
		return this._groundPlaneShadowVisibility;
	}

	public set groundPlaneShadowVisibility(value: boolean) {
		this._environmentGeometryManager.groundPlaneShadow.visible = value;
		this._groundPlaneShadowVisibility = value;
	}

	public get groundPlaneVisibility(): boolean {
		return this._groundPlaneVisibility;
	}

	public set groundPlaneVisibility(value: boolean) {
		this._environmentGeometryManager.groundPlane.visible = value;
		this._groundPlaneVisibility = value;
	}

	public get htmlElementAnchorLoader(): HTMLElementAnchorLoader {
		return this._htmlElementAnchorLoader;
	}

	public get id(): string {
		return this._id;
	}

	public get lightEngine(): LightEngine {
		return this._lightEngine;
	}

	public get lightLoader(): LightLoader {
		return this._lightLoader;
	}

	public get lightScene(): string {
		return this.lightEngine.lightScene
			? this.lightEngine.lightScene.id
			: "";
	}

	public get lightSceneId(): string {
		return this.lightEngine.lightScene
			? this.lightEngine.lightScene.id
			: "";
	}

	public get lights(): boolean {
		return this._lights;
	}

	public set lights(value: boolean) {
		this._lights = value;
	}

	public get loadDefaultCameras(): boolean {
		return this._cameraEngine.loadDefaultCameras;
	}

	public set loadDefaultCameras(value: boolean) {
		this._cameraEngine.loadDefaultCameras = value;
	}

	public get logoDivElement(): HTMLDivElement {
		return this._logoDivElement;
	}

	public get materialLoader(): MaterialLoader {
		return this._materialLoader;
	}

	public get materialOverrideType(): MATERIAL_TYPE | undefined {
		return this.materialLoader.materialOverrideType;
	}

	public set materialOverrideType(value: MATERIAL_TYPE | undefined) {
		this.materialLoader.materialOverrideType = value;
	}

	public get maximumRenderingSize(): {
		width: number;
		height: number;
	} {
		return this._maximumRenderingSize;
	}

	public set maximumRenderingSize(value: {width: number; height: number}) {
		this._maximumRenderingSize = value;
	}

	public get minimalRendering(): boolean {
		return this.renderingManager.minimalRendering;
	}

	public get outputEncoding(): TEXTURE_ENCODING {
		switch (this._renderer.outputColorSpace) {
			case THREE.SRGBColorSpace:
				return TEXTURE_ENCODING.SRGB;
			case THREE.LinearSRGBColorSpace:
			default:
				return TEXTURE_ENCODING.LINEAR;
		}
	}

	public set outputEncoding(value: TEXTURE_ENCODING) {
		switch (value) {
			case TEXTURE_ENCODING.SRGB:
				this._renderer.outputColorSpace = THREE.SRGBColorSpace;
				break;
			case TEXTURE_ENCODING.LINEAR:
			default:
				this._renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
				break;
		}
	}

	public get pause(): boolean {
		return this._pause;
	}

	public set pause(value: boolean) {
		this._pause = value;
	}

	public get physicallyCorrectLights(): boolean {
		return !this._useLegacyLights;
	}

	public set physicallyCorrectLights(value: boolean) {
		this._useLegacyLights = !value;
	}

	public get pointSize(): number {
		return this.materialLoader.defaultPointMaterialData.size || 1;
	}

	public set pointSize(value: number) {
		this.materialLoader.defaultPointMaterialData.size = value;
		this.materialLoader.assignDefaultPointMaterial();
	}

	public get postProcessingManager(): PostProcessingManager {
		return this._postProcessingManager;
	}

	public get postRenderingCallback():
		| ((
				renderer: THREE.WebGLRenderer,
				scene: THREE.Scene,
				camera: THREE.Camera,
		  ) => void)
		| undefined {
		return this._postRenderingCallback;
	}

	public set postRenderingCallback(
		value:
			| ((
					renderer: THREE.WebGLRenderer,
					scene: THREE.Scene,
					camera: THREE.Camera,
			  ) => void)
			| undefined,
	) {
		this._postRenderingCallback = value;
	}

	public get preRenderingCallback():
		| ((renderer: THREE.WebGLRenderer) => void)
		| undefined {
		return this._preRenderingCallback;
	}

	public set preRenderingCallback(
		value: ((renderer: THREE.WebGLRenderer) => void) | undefined,
	) {
		this._preRenderingCallback = value;
	}

	public get renderer(): THREE.WebGLRenderer {
		return this._renderer;
	}

	public get renderingManager(): RenderingManager {
		return this._renderingManager;
	}

	public get scene(): THREE.Scene {
		return this._sceneTreeManager.scene;
	}

	public get sceneTracingManager(): SceneTracingManager {
		return this._sceneTracingManager;
	}

	public get sceneTreeManager(): SceneTreeManager {
		return this._sceneTreeManager;
	}

	public get sessionSettingsId(): string | undefined {
		return this._settingsManager.sessionSettingsId;
	}

	public get sessionSettingsMode(): SESSION_SETTINGS_MODE {
		return this._settingsManager.sessionSettingsMode;
	}

	public get settingsEngine(): SettingsEngine | undefined {
		return this._settingsManager.settingsEngine;
	}

	public get shadows(): boolean {
		return this._shadows;
	}

	public set shadows(value: boolean) {
		this._shadows = value;
	}

	public get show(): boolean {
		return this._show;
	}

	public set show(value: boolean) {
		this._show = value;
	}

	public get showStatistics(): boolean {
		return this._showStatistics;
	}

	public set showStatistics(value: boolean) {
		this._showStatistics = value;
	}

	public get softShadows(): boolean {
		return this._softShadows;
	}

	public set softShadows(value: boolean) {
		this._softShadows = value;
	}

	public get spinnerDivElement(): HTMLDivElement {
		return this._spinnerDivElement;
	}

	public get suspendSceneUpdates(): boolean {
		return this._sceneTreeManager.suspendSceneUpdates;
	}

	public set suspendSceneUpdates(value: boolean) {
		this._sceneTreeManager.suspendSceneUpdates = value;
	}

	public get textureEncoding(): TEXTURE_ENCODING {
		switch (this.materialLoader.textureEncoding) {
			case THREE.SRGBColorSpace:
				return TEXTURE_ENCODING.SRGB;
			case THREE.LinearSRGBColorSpace:
			default:
				return TEXTURE_ENCODING.LINEAR;
		}
	}

	public set textureEncoding(value: TEXTURE_ENCODING) {
		switch (value) {
			case TEXTURE_ENCODING.SRGB:
				this.environmentMapLoader.textureEncoding =
					THREE.SRGBColorSpace;
				this.materialLoader.textureEncoding = THREE.SRGBColorSpace;
				break;
			case TEXTURE_ENCODING.LINEAR:
			default:
				this.environmentMapLoader.textureEncoding =
					THREE.LinearSRGBColorSpace;
				this.materialLoader.textureEncoding =
					THREE.LinearSRGBColorSpace;
		}
	}

	public get toneMapping(): TONE_MAPPING {
		return this._toneMapping;
	}

	public set toneMapping(value: TONE_MAPPING) {
		this._toneMapping = value;
		switch (value) {
			case TONE_MAPPING.LINEAR:
				this._renderer.toneMapping = THREE.LinearToneMapping;
				break;
			case TONE_MAPPING.REINHARD:
				this._renderer.toneMapping = THREE.ReinhardToneMapping;
				break;
			case TONE_MAPPING.CINEON:
				this._renderer.toneMapping = THREE.CineonToneMapping;
				break;
			case TONE_MAPPING.ACES_FILMIC:
				this._renderer.toneMapping = THREE.ACESFilmicToneMapping;
				break;
			case TONE_MAPPING.NONE:
			default:
				this._renderer.toneMapping = THREE.NoToneMapping;
		}
		this.materialLoader.updateMaterials();
		this.postProcessingManager.changeEffectPass();
	}

	public get toneMappingExposure(): number {
		return this._renderer.toneMappingExposure;
	}

	public set toneMappingExposure(value: number) {
		this._renderer.toneMappingExposure = value;
	}

	public get type(): RENDERER_TYPE {
		return this._type;
	}

	public set type(value: RENDERER_TYPE) {
		this._type = value;
	}

	public get usingSwiftShader(): boolean {
		return this.renderingManager.usingSwiftShader;
	}

	public get visibility(): VISIBILITY_MODE {
		return this._visibility;
	}

	public get visibilitySessionIds(): string[] | undefined {
		return this._visibilitySessionIds;
	}

	public get visualizeAttributes():
		| ((
				overview: ISDTFOverview,
				itemData?: ISDTFItemData,
		  ) => ISDTFAttributeVisualizationData)
		| undefined {
		return this._visualizeAttributes;
	}

	public set visualizeAttributes(
		value:
			| ((
					overview: ISDTFOverview,
					itemData?: ISDTFItemData,
			  ) => ISDTFAttributeVisualizationData)
			| undefined,
	) {
		this._visualizeAttributes = value;
	}

	public addFlag(flag: FLAG_TYPE, inputToken?: string): string {
		return this._flagManager.addFlag(flag, inputToken);
	}

	public async applySettings(
		sections: IViewportSettingsSections = {
			ar: true,
			scene: true,
			camera: true,
			light: true,
			environment: true,
			general: true,
			postprocessing: true,
		},
		settingsEngine?: SettingsEngine,
		updateViewport: boolean = true,
	): Promise<void> {
		return this._settingsManager.applySettings(
			sections,
			settingsEngine,
			updateViewport,
		);
	}

	public assignSettingsEngine(settingsEngine: SettingsEngine): void {
		this._settingsManager.assignSettingsEngine(settingsEngine);
	}

	public async close(): Promise<void> {
		this._closed = true;
		this._lightEngine.close();
		this._cameraEngine.close();
		this._renderer.clear(true, true, true);
		this._renderer.dispose();
		this._domEventEngine.removeAllDomEventListener();
		this._domEventEngine.dispose();
		this._canvas.canvasElement.parentElement?.removeChild(
			this._logoDivElement,
		);
		this._canvas.canvasElement.parentElement?.removeChild(
			this._spinnerDivElement,
		);
		this._canvas.canvasElement.parentNode?.removeChild(
			this._htmlElementAnchorLoader.parentDiv,
		);
		this._canvas.reset();
	}

	public continueRendering(): void {
		this._pause = false;
	}

	public convert3Dto2D(p: vec3): {
		container: vec2;
		client: vec2;
		page: vec2;
		hidden: boolean;
		distance: number;
	} {
		return this.sceneTracingManager.convert3Dto2D(p);
	}

	public createSDTFOverview(node: ITreeNode): ISDTFOverview {
		const out: ISDTFOverviewData = new SDTFOverviewData({});
		for (let i = 0, len = node.data.length; i < len; i++)
			if (node.data[i] instanceof SDTFOverviewData)
				out.merge(<ISDTFOverviewData>node.data[i]);

		for (let i = 0, len = node.children.length; i < len; i++)
			out.merge(
				new SDTFOverviewData(this.createSDTFOverview(node.children[i])),
			);

		return out.overview;
	}

	public createThreeJsColor(color: Color): THREE.Color {
		const sdColor = new SDColor(
			this._converter.toThreeJsColorInput(color),
			color,
		);
		sdColor.colorCorrection(this.automaticColorAdjustment);
		this._colorCache.push(sdColor);
		return sdColor;
	}

	public displayErrorMessage(message: string) {
		for (let i = 0; i < this.logoDivElement.children.length; i++)
			(<HTMLElement>this.logoDivElement.children[i]).style.visibility =
				"hidden";

		const d = <HTMLDivElement>document.createElement("div");
		d.classList.add("sdv-error-message-container");
		this.logoDivElement.appendChild(d);

		const p = <HTMLParagraphElement>document.createElement("p");
		p.textContent = message;
		p.classList.add("sdv-error-message");
		p.style.color = this.logoDivElement.style.backgroundColor;
		d.appendChild(p);
	}

	public evaluateFlagState(): void {
		this._flagManager.evaluateFlagState();
	}

	public getEnvironmentMapImageUrl() {
		return this._environmentMapLoader.getEnvironmentMapImageUrl(
			this.environmentMap,
		);
	}

	public getScreenshot(type?: string, encoderOptions?: number): string {
		return this._renderingManager.getScreenshot(type, encoderOptions);
	}

	public isMobileDeviceWithoutBrowserARSupport(): boolean {
		return this._arManager.isMobileDeviceWithoutBrowserARSupport();
	}

	public pauseRendering(): void {
		this._pause = true;
	}

	public pointerEventToRay(event: PointerEvent): {
		origin: vec3;
		direction: vec3;
	} {
		return this._sceneTracingManager.pointerEventToRay(event);
	}

	public raytraceScene(
		origin: vec3,
		direction: vec3,
		filterCriteria?: IIntersectionFilter[],
	): {distance: number; node: ITreeNode; data?: IGeometryData}[] {
		return this._sceneTracingManager.raytraceScene(
			origin,
			direction,
			filterCriteria,
		);
	}

	public removeFlag(token: string): boolean {
		return this._flagManager.removeFlag(token);
	}

	public reset() {
		this._stateEngine.viewportEngines[this.id]?.settingsAssigned.reset();
		this._stateEngine.viewportEngines[this.id]?.boundingBoxCreated.reset();
		this._stateEngine.viewportEngines[
			this.id
		]?.environmentMapLoaded.reset();

		this._stateEngine.viewportEngines[this.id]?.boundingBoxCreated.then(
			() => {
				this._environmentGeometryManager.changeSceneExtents(
					this._sceneTreeManager.boundingBox,
				);
			},
		);
	}

	public resize(width: number, height: number): void {
		this._renderingManager.resize(width, height);
		this._renderingManager.render();
	}

	public saveSettings(settingsEngine?: SettingsEngine) {
		this._settingsManager.saveSettings(settingsEngine);
	}

	public start() {
		this._renderingManager.start();

		this._stateEngine.viewportEngines[this.id]?.boundingBoxCreated.then(
			() => {
				this._environmentGeometryManager.changeSceneExtents(
					this._sceneTreeManager.boundingBox,
				);
			},
		);

		if (
			this._settingsManager.sessionSettingsMode ===
			SESSION_SETTINGS_MODE.NONE
		) {
			this.environmentMap = "photo_studio";
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public update(id: string): void {
		if (this.closed) return;
		if (this.sceneTreeManager.suspendSceneUpdates === true) return;
		this._sceneTreeManager.updateSceneTree(this._tree.root);
		this._renderingManager.updateShadowMap();
		this._animationEngine.updateAnimationData();
		this._renderingManager.render();
		this._eventEngine.emitEvent(EVENTTYPE_VIEWPORT.VIEWPORT_UPDATED, {
			viewportId: this.id,
		} as IViewportEvent);
	}

	public updateEnvironmentGeometry(): void {
		this._environmentGeometryManager.updateEnvironmentGeometryPosition();
	}

	public viewInAR(
		file: string,
		options?: {
			arScale?: "auto" | "fixed";
			arPlacement?: "floor" | "wall";
			xrEnvironment?: boolean;
		},
	): Promise<void> {
		return this._arManager.viewInAR(file, options);
	}

	public viewableInAR(): boolean {
		return this._arManager.viewableInAR();
	}
}
