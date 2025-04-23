import {AnimationEngine} from "@shapediver/viewer.rendering-engine.animation-engine";
import {CameraEngine} from "@shapediver/viewer.rendering-engine.camera-engine";
import {
	CanvasEngine,
	ICanvas,
} from "@shapediver/viewer.rendering-engine.canvas-engine";
import {IntersectionEngine} from "@shapediver/viewer.rendering-engine.intersection-engine";
import {LightEngine} from "@shapediver/viewer.rendering-engine.light-engine";
import {ITree, ITreeNode, Tree} from "@shapediver/viewer.shared.node-tree";
import {
	Converter,
	DomEventEngine,
	EventEngine,
	EVENTTYPE,
	EVENTTYPE_VIEWPORT,
	Logger,
	SESSION_SETTINGS_MODE,
	SettingsEngine,
	ShapeDiverViewerArError,
	StateEngine,
	SystemInfo,
	UuidGenerator,
} from "@shapediver/viewer.shared.services";
import {
	BUSY_MODE_DISPLAY,
	Color,
	FLAG_TYPE,
	IAnimationData,
	IGeometryData,
	IIntersectionFilter,
	ISDTFAttributeVisualizationData,
	ISDTFItemData,
	ISDTFOverview,
	ISDTFOverviewData,
	ITaskEvent,
	IViewportEvent,
	IViewportSettingsSections,
	MaterialBasicLineData,
	MaterialPointData,
	MaterialStandardData,
	MATERIAL_TYPE,
	RENDERER_TYPE,
	SDTFOverviewData,
	SPINNER_POSITIONING,
	TASK_TYPE,
	TEXTURE_ENCODING,
	TONE_MAPPING,
	ViewportCreationDefinition,
	VISIBILITY_MODE,
} from "@shapediver/viewer.shared.types";
import {quat, vec2, vec3} from "gl-matrix";
import * as THREE from "three";
import {IRenderingEngineThreeJS} from "./interfaces/IRenderingEngine";
import {EnvironmentMapLoader} from "./loaders/EnvironmentMapLoader";
import {GeometryLoader} from "./loaders/GeometryLoader";
import {HTMLElementAnchorLoader} from "./loaders/HTMLElementAnchorLoader";
import {LightLoader} from "./loaders/LightLoader";
import {adaptShaders, MaterialLoader} from "./loaders/MaterialLoader";
import {CameraManager} from "./managers/CameraManager";
import {EnvironmentGeometryManager} from "./managers/EnvironmentGeometryManager";
import {PostProcessingManager} from "./managers/PostProcessingManager";
import {RenderingManager} from "./managers/RenderingManager";
import {SceneTracingManager} from "./managers/SceneTracingManager";
import {SceneTreeManager} from "./managers/SceneTreeManager";
import {SDColor} from "./objects/SDColor";
import {css} from "./styling/viewport-css";

export class RenderingEngine implements IRenderingEngineThreeJS {
	// #region Properties (76)

	readonly #defaultLogo: string =
		"https://viewer.shapediver.com/v3/graphics/logo_animated_breath.svg";
	readonly #defaultLogoStatic: string =
		"https://viewer.shapediver.com/v3/graphics/logo.png";
	readonly #defaultSpinner: string =
		"https://viewer.shapediver.com/v3/graphics/spinner_ripple.svg";
	private readonly _animationEngine: AnimationEngine =
		AnimationEngine.instance;
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
	// loaders
	private readonly _environmentMapLoader: EnvironmentMapLoader;
	private readonly _eventEngine: EventEngine = EventEngine.instance;
	private readonly _geometryLoader: GeometryLoader;
	private readonly _htmlElementAnchorLoader: HTMLElementAnchorLoader;
	private readonly _id: string;
	private readonly _visibilitySessionIds?: string[];
	private readonly _intersectionManager: IntersectionEngine =
		IntersectionEngine.instance;
	private readonly _lightEngine: LightEngine;
	private readonly _lightLoader: LightLoader;
	private readonly _logger: Logger = Logger.instance;
	private readonly _materialLoader: MaterialLoader;
	private readonly _postProcessingManager: PostProcessingManager;
	private readonly _renderingManager: RenderingManager;
	private readonly _sceneTracingManager: SceneTracingManager;
	private readonly _sceneTreeManager: SceneTreeManager;
	private readonly _stateEngine: StateEngine = StateEngine.instance;
	private readonly _systemInfo: SystemInfo = SystemInfo.instance;
	private readonly _tree: ITree = Tree.instance;
	private readonly _uuidGenerator: UuidGenerator = UuidGenerator.instance;
	private readonly _visibility: VISIBILITY_MODE;

	#animations: {
		[key: string]: IAnimationData;
	} = {};
	#flags: {[key: string]: string[]} = {
		[FLAG_TYPE.CAMERA_FREEZE]: [],
		[FLAG_TYPE.CONTINUOUS_RENDERING]: [],
		[FLAG_TYPE.CONTINUOUS_SHADOW_MAP_UPDATE]: [],
		[FLAG_TYPE.SUSPEND_SCENE_UPDATES]: [],
	};
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
	private _sessionSettingsId?: string;
	private _sessionSettingsMode: SESSION_SETTINGS_MODE;
	private _settingsEngine?: SettingsEngine;
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

	// #endregion Properties (76)

	// #region Constructors (1)

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
		this._sessionSettingsMode =
			prop.sessionSettingsMode || SESSION_SETTINGS_MODE.FIRST;
		this._sessionSettingsId = prop.sessionSettingsId;
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

		// loaders
		this._environmentMapLoader.init();
		this._materialLoader.init();
		this._geometryLoader.init();
		this._htmlElementAnchorLoader.init();
		this._lightLoader.init();

		for (const token in prop.flags) {
			this.addFlag(prop.flags[token], token);
		}
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (146)

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

	public get canvasEngine(): CanvasEngine {
		return this._canvasEngine;
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

	public get suspendSceneUpdates(): boolean {
		return this._sceneTreeManager.suspendSceneUpdates;
	}

	public set suspendSceneUpdates(value: boolean) {
		this._sceneTreeManager.suspendSceneUpdates = value;
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
		this._environmentMap = value;
		this._environmentMapLoader.load(this.environmentMap);
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

	public get eventEngine(): EventEngine {
		return this._eventEngine;
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

	public get visibilitySessionIds(): string[] | undefined {
		return this._visibilitySessionIds;
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
		return this._sessionSettingsId;
	}

	public set sessionSettingsId(value: string | undefined) {
		this._sessionSettingsId = value;
	}

	public get sessionSettingsMode(): SESSION_SETTINGS_MODE {
		return this._sessionSettingsMode;
	}

	public set sessionSettingsMode(value: SESSION_SETTINGS_MODE) {
		this._sessionSettingsMode = value;
	}

	public get settingsEngine(): SettingsEngine | undefined {
		return this._settingsEngine;
	}

	public set settingsEngine(value: SettingsEngine | undefined) {
		this._settingsEngine = value;
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

	public get stateEngine(): StateEngine {
		return this._stateEngine;
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

	// #endregion Public Getters And Setters (146)

	// #region Public Methods (25)

	public addFlag(flag: FLAG_TYPE, inputToken?: string): string {
		const token = inputToken || this._uuidGenerator.create();
		if (flag === FLAG_TYPE.BUSY_MODE) {
			this.stateEngine.viewportEngines[this.id]?.busy.push(token);
		} else {
			this.#flags[flag].push(token);
		}
		this.evaluateFlagState();
		return token;
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
		settingsEngine = settingsEngine || this._settingsEngine;
		if (!settingsEngine) return;

		if (sections.environment) {
			const promises = [];

			promises.push(this._postProcessingManager.initialize());

			// as the environment map is the only thing that needs time to load, load it first
			promises.push(
				new Promise<void>((resolve, reject) => {
					this._stateEngine.viewportEngines[
						this.id
					]?.environmentMapLoaded
						.then(() => {
							try {
								if (!settingsEngine) return;
								this.environmentMapAsBackground =
									settingsEngine.environment.mapAsBackground;
								this.clearAlpha =
									settingsEngine.environment.clearAlpha;
								this.clearColor = this._converter.toHexColor(
									settingsEngine.environment.clearColor,
								);
								this.environmentMapRotation = [
									settingsEngine.environment.rotation.x,
									settingsEngine.environment.rotation.y,
									settingsEngine.environment.rotation.z,
									settingsEngine.environment.rotation.w,
								];
								this.environmentMapBlurriness =
									settingsEngine.environment.blurriness;
								this.environmentMapIntensity =
									settingsEngine.environment.intensity;
								this.applySyncSettings(
									sections,
									settingsEngine,
									updateViewport,
								);

								this._eventEngine.emitEvent(
									EVENTTYPE_VIEWPORT.VIEWPORT_SETTINGS_LOADED,
									<IViewportEvent>{viewportId: this.id},
								);
								resolve();
							} catch (e) {
								reject(e);
							}
						})
						.catch((e) => reject(e));

					// set it like this to not trigger the loading
					this.environmentMap =
						this.environmentMapLoader.reconstructSavedEnvironmentMapContent(
							settingsEngine!.environment.map,
						);
				}),
			);

			await Promise.all(promises);
		} else {
			this.applySyncSettings(sections, settingsEngine, updateViewport);
			this._eventEngine.emitEvent(
				EVENTTYPE_VIEWPORT.VIEWPORT_SETTINGS_LOADED,
				<IViewportEvent>{viewportId: this.id},
			);
		}
	}

	public assignSettingsEngine(settingsEngine: SettingsEngine): void {
		this._settingsEngine = settingsEngine;
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

	public evaluateFlagState() {
		// busy
		{
			const currentBusyState = this.busy;
			if (
				this.stateEngine.viewportEngines[this.id] &&
				this.stateEngine.viewportEngines[this.id]!.busy.length > 0
			) {
				if (!currentBusyState) {
					this.busy = true;
					this._renderingManager.render();
					this._eventEngine.emitEvent(
						EVENTTYPE.VIEWPORT.BUSY_MODE_ON,
						{viewportId: this.id},
					);
				}
			} else {
				if (currentBusyState) {
					this.busy = false;
					this._renderingManager.render();
					this._eventEngine.emitEvent(
						EVENTTYPE.VIEWPORT.BUSY_MODE_OFF,
						{viewportId: this.id},
					);
				}
			}
		}

		// camera freeze
		{
			if (this.#flags[FLAG_TYPE.CAMERA_FREEZE].length > 0) {
				this.cameraEngine.deactivateCameraEvents();
			} else {
				this.cameraEngine.activateCameraEvents();
			}
		}

		// continuous rendering
		{
			const currentContinuousRenderingState = this.continuousRendering;
			if (this.#flags[FLAG_TYPE.CONTINUOUS_RENDERING].length > 0) {
				if (!currentContinuousRenderingState) {
					this.continuousRendering = true;
					this._renderingManager.render();
				}
			} else {
				if (currentContinuousRenderingState) {
					this.continuousRendering = false;
				}
			}
		}

		// continuous shadow map update
		{
			const currentShadowMapUpdateState = this.continuousShadowMapUpdate;
			if (
				this.#flags[FLAG_TYPE.CONTINUOUS_SHADOW_MAP_UPDATE].length > 0
			) {
				if (!currentShadowMapUpdateState) {
					this.continuousShadowMapUpdate = true;
					this._renderingManager.render();
				}
			} else {
				if (currentShadowMapUpdateState) {
					this.continuousShadowMapUpdate = false;
				}
			}
		}

		// suspend scene updates
		{
			const currentSuspendSceneUpdatesState = this.suspendSceneUpdates;
			if (currentSuspendSceneUpdatesState) {
				if (this.#flags[FLAG_TYPE.SUSPEND_SCENE_UPDATES].length === 0) {
					this.suspendSceneUpdates = false;
					this.update("suspendSceneUpdates: false");
					this._renderingManager.render();
				}
			} else {
				if (this.#flags[FLAG_TYPE.SUSPEND_SCENE_UPDATES].length > 0) {
					this.suspendSceneUpdates = true;
				}
			}
		}
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
		// has to be a mobile device (duh)
		if (
			this._systemInfo.isIOS === false &&
			this._systemInfo.isAndroid === false
		)
			return false;

		// no Firefox on Android
		if (
			this._systemInfo.isAndroid === true &&
			this._systemInfo.isFirefox === true
		)
			return true;

		// no Instagram on iOS
		if (
			this._systemInfo.isIOS === true &&
			this._systemInfo.isInstagram === true
		)
			return true;

		return false;
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
		const intersect = this._intersectionManager.intersect(
			{origin, direction},
			this.id,
			filterCriteria,
		);
		return intersect.map((i) => {
			return {
				distance: i.distance,
				node: i.node,
				data: i.geometryData,
			};
		});
	}

	public removeFlag(token: string): boolean {
		let success = false;
		const Flags = Object.values(FLAG_TYPE);
		for (const f of Flags) {
			if (f === FLAG_TYPE.BUSY_MODE) {
				if (
					this.stateEngine.viewportEngines[this.id] &&
					this.stateEngine.viewportEngines[this.id]!.busy.includes(
						token,
					)
				) {
					this.stateEngine.viewportEngines[this.id]!.busy.splice(
						this.stateEngine.viewportEngines[this.id]!.busy.indexOf(
							token,
						),
						1,
					);
					success = true;
					break;
				}
			} else {
				if (this.#flags[f].includes(token)) {
					this.#flags[f].splice(this.#flags[f].indexOf(token), 1);
					success = true;
					break;
				}
			}
		}
		this.evaluateFlagState();
		return success;
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
		settingsEngine = settingsEngine || this._settingsEngine;
		if (!settingsEngine) return;

		(<LightEngine>this.lightEngine).saveSettings(settingsEngine);
		(<CameraEngine>this.cameraEngine).saveSettings(settingsEngine);
		(<PostProcessingManager>this.postProcessingManager).saveSettings(
			settingsEngine,
		);

		settingsEngine.ar.enable = this.enableAR;

		settingsEngine.environment.mapResolution =
			this.environmentMapResolution;
		settingsEngine.environment.map =
			this._environmentMapLoader.createSaveableEnvironmentMapContent(
				this.environmentMap,
			);
		settingsEngine.environment.mapAsBackground =
			this.environmentMapAsBackground;
		settingsEngine.environment.clearAlpha = this.clearAlpha;
		settingsEngine.environment.clearColor = this._converter.toHexColor(
			this.clearColor,
		);
		settingsEngine.environment.rotation = {
			x: this.environmentMapRotation[0],
			y: this.environmentMapRotation[1],
			z: this.environmentMapRotation[2],
			w: this.environmentMapRotation[3],
		};
		settingsEngine.environment.blurriness = this.environmentMapBlurriness;
		settingsEngine.environment.intensity = this.environmentMapIntensity;

		settingsEngine.environmentGeometry.gridVisibility = this.gridVisibility;
		settingsEngine.environmentGeometry.groundPlaneVisibility =
			this.groundPlaneVisibility;
		settingsEngine.environmentGeometry.groundPlaneShadowVisibility =
			this.groundPlaneShadowVisibility;
		settingsEngine.environmentGeometry.gridColor =
			this._converter.toHexColor(this.gridColor);
		settingsEngine.environmentGeometry.groundPlaneColor =
			this._converter.toHexColor(this.groundPlaneColor);
		settingsEngine.environmentGeometry.groundPlaneShadowColor =
			this._converter.toHexColor(this.groundPlaneShadowColor);
		settingsEngine.environmentGeometry.contactShadowBlur =
			this.contactShadowBlur;
		settingsEngine.environmentGeometry.contactShadowDarkness =
			this.contactShadowDarkness;
		settingsEngine.environmentGeometry.contactShadowHeight =
			this.contactShadowHeight;
		settingsEngine.environmentGeometry.contactShadowOpacity =
			this.contactShadowOpacity;
		settingsEngine.environmentGeometry.contactShadowVisibility =
			this.contactShadowVisibility;

		settingsEngine.general.pointSize = this.pointSize;
		settingsEngine.general.transformation.rotation = {
			x: this.arRotation[0],
			y: this.arRotation[1],
			z: this.arRotation[2],
		};
		settingsEngine.general.transformation.translation = {
			x: this.arTranslation[0],
			y: this.arTranslation[1],
			z: this.arTranslation[2],
		};
		settingsEngine.general.transformation.scale = {
			x: this.arScale[0],
			y: this.arScale[1],
			z: this.arScale[2],
		};

		settingsEngine.material.defaultMaterialColor =
			this._converter.toHexColor(this.defaultMaterialColor);
		settingsEngine.material.materialOverrideType =
			this.materialOverrideType;

		settingsEngine.rendering.automaticColorAdjustment =
			this.automaticColorAdjustment;
		settingsEngine.rendering.lights = this.lights;
		settingsEngine.rendering.outputEncoding = this.outputEncoding;
		settingsEngine.rendering.physicallyCorrectLights =
			this.physicallyCorrectLights;
		settingsEngine.rendering.textureEncoding = this.textureEncoding;
		settingsEngine.rendering.toneMapping = this.toneMapping;
		settingsEngine.rendering.toneMappingExposure = this.toneMappingExposure;
		settingsEngine.rendering.beautyRenderBlendingDuration =
			this.beautyRenderBlendingDuration;
		settingsEngine.rendering.beautyRenderDelay = this.beautyRenderDelay;
		settingsEngine.rendering.shadows = this.shadows;
		settingsEngine.rendering.softShadows = this.softShadows;
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

		if (this._sessionSettingsMode === SESSION_SETTINGS_MODE.NONE) {
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
		this._eventEngine.emitEvent(EVENTTYPE_VIEWPORT.VIEWPORT_UPDATED, <
			IViewportEvent
		>{viewportId: this.id});
	}

	public updateEnvironmentGeometry(): void {
		this._environmentGeometryManager.updateEnvironmentGeometryPosition();
	}

	public async viewInAR(
		file: string,
		options: {
			arScale?: "auto" | "fixed";
			arPlacement?: "floor" | "wall";
			xrEnvironment?: boolean;
		} = {arScale: "auto", arPlacement: "floor", xrEnvironment: false},
	): Promise<void> {
		const eventId = this._uuidGenerator.create();
		const event: ITaskEvent = {
			type: TASK_TYPE.AR_LOADING,
			id: eventId,
			progress: 0,
			status: "Loading AR scene",
		};
		this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_START, event);

		// if this is not a supported device, throw an error
		if (this.viewableInAR() === false) {
			const event: ITaskEvent = {
				type: TASK_TYPE.AR_LOADING,
				id: eventId,
				progress: 1,
				status: "Stopped AR loading due to an error",
			};
			this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_CANCEL, event);
			throw new ShapeDiverViewerArError(
				'Api.viewInAR: The device or browser is not supported for this functionality, please call "viewableInAR" for more information.',
			);
		}

		const arScale = options.arScale !== "auto" ? "fixed" : "auto";
		// const arPlacement = options.arPlacement !== 'wall' ? 'floor' : 'wall';
		// const xrEnvironment = options.xrEnvironment !== true ? false : true;

		// let arEnvironment = '';
		// const envMapUrl = this.getEnvironmentMapImageUrl();
		// if (envMapUrl !== '') {
		//   if (envMapUrl.endsWith('.hdr')) {
		//     arEnvironment = 'skybox-image=' + envMapUrl;
		//   } else {
		//     arEnvironment = 'environment-image=' + envMapUrl;
		//   }
		// }

		if (this._systemInfo.isIOS) {
			// create the link and click it
			const a = document.createElement("a");
			a.href =
				file +
				(arScale === "fixed"
					? ".usdz_allowsContentScaling=0"
					: ".usdz");
			a.rel = "ar";
			const img = document.createElement("img");
			img.src = this.#defaultLogoStatic;
			a.appendChild(img);
			a.click();
		} else {
			const a = document.createElement("a");
			a.href = `intent://arvr.google.com/scene-viewer/1.0?resizable=${arScale === "fixed" ? "false" : "true"}&file=${file}&mode=ar_only#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;end;`;
			a.click();
		}

		const event2: ITaskEvent = {
			type: TASK_TYPE.AR_LOADING,
			id: eventId,
			progress: 1,
			status: "Done loading AR scene, launching AR",
		};
		this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_END, event2);
	}

	public viewableInAR(): boolean {
		// has to be a mobile device (duh)
		if (
			this._systemInfo.isIOS === false &&
			this._systemInfo.isAndroid === false
		)
			return false;

		// no Firefox on Android
		if (
			this._systemInfo.isAndroid === true &&
			this._systemInfo.isFirefox === true
		)
			return false;

		// no Firefox on iOS
		if (
			this._systemInfo.isIOS === true &&
			this._systemInfo.isFirefox === true
		)
			return false;

		// no Instagram on iOS
		if (
			this._systemInfo.isIOS === true &&
			this._systemInfo.isInstagram === true
		)
			return false;

		return true;
	}

	// #endregion Public Methods (25)

	// #region Private Methods (1)

	private applySyncSettings(
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
	) {
		settingsEngine = settingsEngine || this._settingsEngine;
		if (!settingsEngine) return;

		if (sections.ar) {
			this.enableAR = settingsEngine.ar.enable;
			this.arScale = [
				settingsEngine.general.transformation.scale.x,
				settingsEngine.general.transformation.scale.y,
				settingsEngine.general.transformation.scale.z,
			];
			this.arTranslation = [
				settingsEngine.general.transformation.translation.x,
				settingsEngine.general.transformation.translation.y,
				settingsEngine.general.transformation.translation.z,
			];
			this.arRotation = [
				settingsEngine.general.transformation.rotation.x,
				settingsEngine.general.transformation.rotation.y,
				settingsEngine.general.transformation.rotation.z,
			];
		}

		if (sections.scene) {
			this.gridColor = settingsEngine.environmentGeometry.gridColor;
			this.gridVisibility =
				settingsEngine.environmentGeometry.gridVisibility;
			this.groundPlaneColor =
				settingsEngine.environmentGeometry.groundPlaneColor;
			this.groundPlaneVisibility =
				settingsEngine.environmentGeometry.groundPlaneVisibility;
			this.groundPlaneShadowColor =
				settingsEngine.environmentGeometry.groundPlaneShadowColor;
			this.groundPlaneShadowVisibility =
				settingsEngine.environmentGeometry.groundPlaneShadowVisibility;
			this.contactShadowBlur =
				settingsEngine.environmentGeometry.contactShadowBlur;
			this.contactShadowDarkness =
				settingsEngine.environmentGeometry.contactShadowDarkness;
			this.contactShadowHeight =
				settingsEngine.environmentGeometry.contactShadowHeight;
			this.contactShadowOpacity =
				settingsEngine.environmentGeometry.contactShadowOpacity;
			this.contactShadowVisibility =
				settingsEngine.environmentGeometry.contactShadowVisibility;

			this.shadows = settingsEngine.rendering.shadows;
			this.softShadows = settingsEngine.rendering.softShadows;
			this.lights = settingsEngine.rendering.lights;

			this.automaticColorAdjustment =
				settingsEngine.rendering.automaticColorAdjustment;
			this.textureEncoding = <TEXTURE_ENCODING>(
				settingsEngine.rendering.textureEncoding
			);
			this.outputEncoding = <TEXTURE_ENCODING>(
				settingsEngine.rendering.outputEncoding
			);
			this.physicallyCorrectLights =
				settingsEngine.rendering.physicallyCorrectLights;
			this.toneMapping = <TONE_MAPPING>(
				settingsEngine.rendering.toneMapping
			);
			this.toneMappingExposure =
				settingsEngine.rendering.toneMappingExposure;
		}

		if (sections.general) {
			this.defaultMaterialColor =
				settingsEngine.material.defaultMaterialColor;
			this.materialOverrideType = settingsEngine.material
				.materialOverrideType as MATERIAL_TYPE;
			this.pointSize = settingsEngine.general.pointSize;
		}

		if (sections.light)
			(<LightEngine>this.lightEngine).applySettings(settingsEngine);
		if (sections.camera)
			(<CameraEngine>this.cameraEngine).applySettings(settingsEngine);
		if (sections.postprocessing)
			(<PostProcessingManager>this.postProcessingManager).applySettings(
				settingsEngine,
			);

		// call adjust camera to load the three.js camera objects
		this.cameraManager.adjustCamera(1);

		this._stateEngine.viewportEngines[this.id]?.settingsAssigned.resolve(
			true,
		);
		if (updateViewport) this.update("RenderingEngine.applySyncSettings");
	}

	// #endregion Private Methods (1)
}
