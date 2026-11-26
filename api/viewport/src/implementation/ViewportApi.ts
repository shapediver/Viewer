import {QueryGltfConversion} from "@shapediver/sdk.geometry-api-sdk-v2";
import {sceneTree} from "@shapediver/viewer.api.general";
import {
	CreationControlCenterViewport,
	type ICreationControlCenterViewport,
} from "@shapediver/viewer.creation-control-center.viewport";
import {GeometryEngine} from "@shapediver/viewer.data-engine.geometry-engine";
import {GLTFConverter} from "@shapediver/viewer.data-engine.gltf-converter";
import {AnimationEngine} from "@shapediver/viewer.rendering-engine.animation-engine";
import {
	CAMERA_TYPE,
	type IOrthographicCamera,
	type IPerspectiveCamera,
	type OrthographicCameraProperties,
	type PerspectiveCameraProperties,
} from "@shapediver/viewer.rendering-engine.camera-engine";
import {type IConvert3Dto2DResult} from "@shapediver/viewer.rendering-engine.rendering-engine";
import {RenderingEngine as RenderingEngineThreeJs} from "@shapediver/viewer.rendering-engine.rendering-engine-threejs";
import {ISettings} from "@shapediver/viewer.settings";
import {build_data} from "@shapediver/viewer.shared.build-data";
import {
	GeometryData,
	type ITreeNode,
	MaterialBasicLineData,
	MaterialPointData,
	MaterialStandardData,
	TreeNode,
} from "@shapediver/viewer.shared.node-tree";
import {
	type IDomEventListener,
	InputValidator,
	Logger,
	SESSION_SETTINGS_MODE,
	ShapeDiverViewerArError,
	ShapeDiverViewerValidationError,
	StateEngine,
	SystemInfo,
} from "@shapediver/viewer.shared.services";
import {
	type Color,
	ENVIRONMENT_MAP_FILTERING,
	ENVIRONMENT_MAP_ORIENTATION,
	ENVIRONMENT_MAP_PBR_MODE,
	FLAG_TYPE,
	type IAnimationData,
	type IGeometryData,
	type IIntersectionFilter,
	type ISceneState,
	type ISDTFAttributeVisualizationData,
	type ISDTFItemData,
	type ISDTFOverview,
	MATERIAL_TYPE,
	RENDERER_TYPE,
	TEXTURE_ENCODING,
	TONE_MAPPING,
} from "@shapediver/viewer.shared.types";
import {mat4, quat, vec3} from "gl-matrix";
import * as QRCode from "qrcode";
import * as THREE from "three";
import {type ICameraApi} from "../interfaces/camera/ICameraApi";
import {type IOrthographicCameraApi} from "../interfaces/camera/IOrthographicCameraApi";
import {type IPerspectiveCameraApi} from "../interfaces/camera/IPerspectiveCameraApi";
import {type IPostProcessingApi} from "../interfaces/IPostProcessingApi";
import {type IViewportApi} from "../interfaces/IViewportApi";
import {type ILightSceneApi} from "../interfaces/lights/ILightSceneApi";
import {OrthographicCameraApi} from "./camera/OrthographicCameraApi";
import {PerspectiveCameraApi} from "./camera/PerspectiveCameraApi";
import {LightSceneApi} from "./lights/LightSceneApi";
import {PostProcessingApi} from "./PostProcessingApi";

export class ViewportApi implements IViewportApi {
	// #region Properties (11)

	readonly #animationEngine: AnimationEngine = AnimationEngine.instance;
	readonly #cameras: {[key: string]: ICameraApi} = {};
	readonly #creationControlCenterViewport: ICreationControlCenterViewport =
		CreationControlCenterViewport.instance;
	readonly #gltfConverter: GLTFConverter = GLTFConverter.instance;
	readonly #inputValidator: InputValidator = InputValidator.instance;
	readonly #lightScenes: {[key: string]: ILightSceneApi} = {};
	readonly #logger: Logger = Logger.instance;
	readonly #postProcessing: IPostProcessingApi;
	readonly #renderingEngine: RenderingEngineThreeJs;
	readonly #stateEngine: StateEngine = StateEngine.instance;
	readonly #systemInfo: SystemInfo = SystemInfo.instance;

	// #endregion Properties (11)

	// #region Constructors (1)

	constructor(renderingEngine: RenderingEngineThreeJs) {
		this.#renderingEngine = renderingEngine;

		// Whenever a camera is added or removed from the camera engine, this update is called.
		this.#renderingEngine.cameraEngine.update = () => {
			for (const c in this.#renderingEngine.cameraEngine.cameras) {
				if (!this.#cameras[c]) {
					if (
						this.#renderingEngine.cameraEngine.cameras[c].type ===
						CAMERA_TYPE.PERSPECTIVE
					) {
						this.#cameras[c] = new PerspectiveCameraApi(
							this,
							<IPerspectiveCamera>(
								this.#renderingEngine.cameraEngine.cameras[c]
							),
						);
					} else {
						this.#cameras[c] = new OrthographicCameraApi(
							this,
							<IOrthographicCamera>(
								this.#renderingEngine.cameraEngine.cameras[c]
							),
						);
					}
				}
			}

			for (const c in this.#cameras) {
				if (!this.#renderingEngine.cameraEngine.cameras[c]) {
					delete this.#cameras[c];
				}
			}
		};

		// We call it once in the beginning to get the current state.
		this.#renderingEngine.cameraEngine.update();

		// Whenever a camera is added or removed from the camera engine, this update is called.
		this.#renderingEngine.lightEngine.update = () => {
			for (const l in this.#renderingEngine.lightEngine.lightScenes) {
				if (!this.#lightScenes[l]) {
					this.#lightScenes[l] = new LightSceneApi(
						this,
						this.#renderingEngine.lightEngine.lightScenes[l],
					);
				}
			}

			for (const l in this.#lightScenes) {
				if (!this.#renderingEngine.lightEngine.lightScenes[l]) {
					delete this.#lightScenes[l];
				}
			}
		};

		// We call it once in the beginning to get the current state.
		this.#renderingEngine.lightEngine.update();

		// We create the post processing api
		this.#postProcessing = new PostProcessingApi(
			this,
			this.#renderingEngine,
		);
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (106)

	public get animations(): {
		[key: string]: IAnimationData;
	} {
		return this.#animationEngine.animations;
	}

	public get arRotation(): vec3 {
		return this.#renderingEngine.arRotation;
	}

	public set arRotation(value: vec3) {
		const scope = "arRotation";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"vec3",
		);
		this.#renderingEngine.arRotation = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("arRotation");
	}

	public get arScale(): vec3 {
		return this.#renderingEngine.arScale;
	}

	public set arScale(value: vec3) {
		const scope = "arScale";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"vec3",
		);
		this.#renderingEngine.arScale = vec3.max(
			vec3.create(),
			value,
			vec3.fromValues(0.001, 0.001, 0.001),
		);
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("arScale");
	}

	public get arTranslation(): vec3 {
		return this.#renderingEngine.arTranslation;
	}

	public set arTranslation(value: vec3) {
		const scope = "arTranslation";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"vec3",
		);
		this.#renderingEngine.arTranslation = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("arTranslation");
	}

	public get accumulationFrames(): number {
		return this.#renderingEngine.accumulationFrames;
	}

	public set accumulationFrames(value: number) {
		const scope = "accumulationFrames";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"number",
		);
		this.#renderingEngine.accumulationFrames = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("accumulationFrames");
	}

	public get accumulationFramesMobile(): number {
		return this.#renderingEngine.accumulationFramesMobile;
	}

	public set accumulationFramesMobile(value: number) {
		const scope = "accumulationFramesMobile";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"number",
		);
		this.#renderingEngine.accumulationFramesMobile = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("accumulationFramesMobile");
	}

	public get accumulationMode(): "display" | "hdr" {
		return this.#renderingEngine.accumulationMode;
	}

	public set accumulationMode(value: "display" | "hdr") {
		const scope = "accumulationMode";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"enum",
			true,
			["display", "hdr"],
		);
		this.#renderingEngine.accumulationMode = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("accumulationMode");
	}

	public get automaticColorAdjustment(): boolean {
		return this.#renderingEngine.automaticColorAdjustment;
	}

	public set automaticColorAdjustment(value: boolean) {
		const scope = "automaticColorAdjustment";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"boolean",
		);
		this.#renderingEngine.automaticColorAdjustment = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("automaticColorAdjustment");
	}

	public get automaticResizing(): boolean {
		return this.#renderingEngine.automaticResizing;
	}

	public set automaticResizing(value: boolean) {
		const scope = "automaticResizing";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"boolean",
		);
		this.#renderingEngine.automaticResizing = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("automaticResizing");
	}

	public get beautyRenderBlendingDuration(): number {
		return this.#renderingEngine.beautyRenderBlendingDuration;
	}

	public set beautyRenderBlendingDuration(value: number) {
		const scope = "beautyRenderBlendingDuration";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"number",
		);
		this.#renderingEngine.beautyRenderBlendingDuration = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("beautyRenderBlendingDuration");
	}

	public get beautyRenderDelay(): number {
		return this.#renderingEngine.beautyRenderDelay;
	}

	public set beautyRenderDelay(value: number) {
		const scope = "beautyRenderDelay";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"number",
		);
		this.#renderingEngine.beautyRenderDelay = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("beautyRenderDelay");
	}

	public get camera(): ICameraApi | null {
		if (!this.#renderingEngine.cameraEngine.camera) return null;
		return this.#cameras[this.#renderingEngine.cameraEngine.camera.id];
	}

	public get cameras(): {[key: string]: ICameraApi} {
		return this.#cameras;
	}

	public get canvas(): HTMLCanvasElement {
		return this.#renderingEngine.canvas;
	}

	public get clearAlpha(): number {
		return this.#renderingEngine.clearAlpha;
	}

	public set clearAlpha(value: number) {
		const scope = "clearAlpha";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"number",
		);
		this.#renderingEngine.clearAlpha = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("clearAlpha");
	}

	public get clearColor(): Color {
		return this.#renderingEngine.clearColor;
	}

	public set clearColor(value: Color) {
		const scope = "clearColor";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"color",
		);
		this.#renderingEngine.clearColor = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("clearColor");
	}

	public get contactShadowBlur(): number {
		return this.#renderingEngine.contactShadowBlur;
	}

	public set contactShadowBlur(value: number) {
		const scope = "contactShadowBlur";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"number",
		);
		this.#renderingEngine.contactShadowBlur = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("contactShadowBlur");
	}

	public get contactShadowDarkness(): number {
		return this.#renderingEngine.contactShadowDarkness;
	}

	public set contactShadowDarkness(value: number) {
		const scope = "contactShadowDarkness";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"number",
		);
		this.#renderingEngine.contactShadowDarkness = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("contactShadowDarkness");
	}

	public get contactShadowHeight(): number {
		return this.#renderingEngine.contactShadowHeight;
	}

	public set contactShadowHeight(value: number) {
		const scope = "contactShadowHeight";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"number",
		);
		this.#renderingEngine.contactShadowHeight = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("contactShadowHeight");
	}

	public get contactShadowOpacity(): number {
		return this.#renderingEngine.contactShadowOpacity;
	}

	public set contactShadowOpacity(value: number) {
		const scope = "contactShadowOpacity";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"number",
		);
		this.#renderingEngine.contactShadowOpacity = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("contactShadowOpacity");
	}

	public get contactShadowVisibility(): boolean {
		return this.#renderingEngine.contactShadowVisibility;
	}

	public set contactShadowVisibility(value: boolean) {
		const scope = "contactShadowVisibility";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"boolean",
		);
		this.#renderingEngine.contactShadowVisibility = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("contactShadowVisibility");
	}

	public get defaultLineMaterial(): MaterialBasicLineData {
		return this.#renderingEngine.defaultLineMaterial;
	}

	public get defaultMaterial(): MaterialStandardData {
		return this.#renderingEngine.defaultMaterial;
	}

	public get defaultMaterialColor(): Color {
		return this.#renderingEngine.defaultMaterialColor;
	}

	public set defaultMaterialColor(value: Color) {
		const scope = "defaultMaterialColor";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"color",
		);
		this.#renderingEngine.defaultMaterialColor = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("defaultMaterialColor");
	}

	public get defaultPointMaterial(): MaterialPointData {
		return this.#renderingEngine.defaultPointMaterial;
	}

	public get enableAR(): boolean {
		return this.#renderingEngine.enableAR;
	}

	public set enableAR(value: boolean) {
		const scope = "enableAR";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"boolean",
		);
		this.#renderingEngine.enableAR = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("enableAR");
	}

	public get environmentMap(): string | string[] {
		return this.#renderingEngine.environmentMap;
	}

	public set environmentMap(value: string | string[]) {
		const scope = "environmentMap";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"cubeMap",
		);
		this.#renderingEngine.environmentMap = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("environmentMap");
	}

	public get environmentMapAnalyticDfg(): boolean {
		return this.#renderingEngine.environmentMapAnalyticDfg;
	}

	public set environmentMapAnalyticDfg(value: boolean) {
		const scope = "environmentMapAnalyticDfg";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"boolean",
		);
		this.#renderingEngine.environmentMapAnalyticDfg = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("environmentMapAnalyticDfg");
	}

	public get environmentMapAsBackground(): boolean {
		return this.#renderingEngine.environmentMapAsBackground;
	}

	public set environmentMapAsBackground(value: boolean) {
		const scope = "environmentMapAsBackground";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"boolean",
		);
		this.#renderingEngine.environmentMapAsBackground = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("environmentMapAsBackground");
	}

	public get environmentMapBlurriness(): number {
		return this.#renderingEngine.environmentMapBlurriness;
	}

	public set environmentMapBlurriness(value: number) {
		const scope = "environmentMapBlurriness";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"number",
		);
		this.#renderingEngine.environmentMapBlurriness = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("environmentMapBlurriness");
	}

	public get environmentMapFiltering(): ENVIRONMENT_MAP_FILTERING {
		return this.#renderingEngine.environmentMapFiltering;
	}

	public set environmentMapFiltering(value: ENVIRONMENT_MAP_FILTERING) {
		const scope = "environmentMapFiltering";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"enum",
			true,
			Object.values(ENVIRONMENT_MAP_FILTERING),
		);
		this.#renderingEngine.environmentMapFiltering = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("environmentMapFiltering");
	}

	public get environmentMapForUnlitMaterials(): boolean {
		return this.#renderingEngine.environmentMapForUnlitMaterials;
	}

	public set environmentMapForUnlitMaterials(value: boolean) {
		const scope = "environmentMapForUnlitMaterials";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"boolean",
		);
		this.#renderingEngine.environmentMapForUnlitMaterials = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("environmentMapForUnlitMaterials");
	}

	public get environmentMapIntensity(): number {
		return this.#renderingEngine.environmentMapIntensity;
	}

	public set environmentMapIntensity(value: number) {
		const scope = "environmentMapIntensity";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"number",
		);
		this.#renderingEngine.environmentMapIntensity = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("environmentMapIntensity");
	}

	public get environmentMapOrientation(): ENVIRONMENT_MAP_ORIENTATION {
		return (
			this.#renderingEngine.environmentMapOrientation ||
			ENVIRONMENT_MAP_ORIENTATION.LEGACY
		);
	}

	public set environmentMapOrientation(value: ENVIRONMENT_MAP_ORIENTATION) {
		const scope = "environmentMapOrientation";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"enum",
			true,
			Object.values(ENVIRONMENT_MAP_ORIENTATION),
		);
		this.#renderingEngine.environmentMapOrientation = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("environmentMapOrientation");
	}

	public get environmentMapPbrMode(): ENVIRONMENT_MAP_PBR_MODE {
		return (
			this.#renderingEngine.environmentMapPbrMode ||
			ENVIRONMENT_MAP_PBR_MODE.LEGACY
		);
	}

	public set environmentMapPbrMode(value: ENVIRONMENT_MAP_PBR_MODE) {
		const scope = "environmentMapPbrMode";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"enum",
			true,
			Object.values(ENVIRONMENT_MAP_PBR_MODE),
		);
		this.#renderingEngine.environmentMapPbrMode = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("environmentMapPbrMode");
	}

	public get environmentMapResolution(): string {
		return this.#renderingEngine.environmentMapResolution;
	}

	public set environmentMapResolution(value: string) {
		const scope = "environmentMapResolution";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"string",
		);
		this.#renderingEngine.environmentMapResolution = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("environmentMapResolution");
	}

	public get environmentMapRotation(): quat {
		return this.#renderingEngine.environmentMapRotation;
	}

	public set environmentMapRotation(value: quat) {
		const scope = "environmentMapRotation";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"quat",
		);
		this.#renderingEngine.environmentMapRotation = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("environmentMapRotation");
	}

	public get environmentMapSquaredRoughnessBend(): boolean {
		return this.#renderingEngine.environmentMapSquaredRoughnessBend;
	}

	public set environmentMapSquaredRoughnessBend(value: boolean) {
		const scope = "environmentMapSquaredRoughnessBend";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"boolean",
		);
		this.#renderingEngine.environmentMapSquaredRoughnessBend = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("environmentMapSquaredRoughnessBend");
	}

	public get gemEnvironmentMapIntensity(): number {
		return this.#renderingEngine.gemEnvironmentMapIntensity;
	}

	public set gemEnvironmentMapIntensity(value: number) {
		const scope = "gemEnvironmentMapIntensity";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"positive",
		);
		this.#renderingEngine.gemEnvironmentMapIntensity = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("gemEnvironmentMapIntensity");
	}

	public get gemClampColor(): boolean {
		return this.#renderingEngine.gemClampColor;
	}

	public set gemClampColor(value: boolean) {
		const scope = "gemClampColor";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"boolean",
		);
		this.#renderingEngine.gemClampColor = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("gemClampColor");
	}

	public get gemNormalMapResolution(): number {
		return this.#renderingEngine.gemNormalMapResolution;
	}

	public set gemNormalMapResolution(value: number) {
		const scope = "gemNormalMapResolution";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"number",
		);
		if (![256, 512, 1024].includes(value))
			throw new ShapeDiverViewerValidationError(
				`ViewportApi.${scope}: Input could not be validated. ${value} is not one of 256, 512 or 1024.`,
				value,
				"number",
			);
		this.#renderingEngine.gemNormalMapResolution = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("gemNormalMapResolution");
	}

	public get gemLighting(): "all" | "firstSurface" | "environment" {
		return this.#renderingEngine.gemLighting;
	}

	public set gemLighting(value: "all" | "firstSurface" | "environment") {
		const scope = "gemLighting";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"enum",
			true,
			["all", "firstSurface", "environment"],
		);
		this.#renderingEngine.gemLighting = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("gemLighting");
	}

	public get gemTracing(): "sphere" | "facets" {
		return this.#renderingEngine.gemTracing;
	}

	public set gemTracing(value: "sphere" | "facets") {
		const scope = "gemTracing";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"enum",
			true,
			["sphere", "facets"],
		);
		this.#renderingEngine.gemTracing = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("gemTracing");
	}

	/**
	 * @internal
	 * Cut branches whose meshes are all drawn by batches or instance groups
	 * from the render-list walk of three.js (SS-10606). On by default; off
	 * walks every object, as before. For tests that compare both. Not part
	 * of the public API and subject to change without notice.
	 */
	public get renderListCut(): boolean {
		return this.#renderingEngine.renderListCut;
	}

	public set renderListCut(value: boolean) {
		this.#renderingEngine.renderListCut = value;
	}

	/**
	 * @internal
	 * GPU instancing for this viewport. On by default. Turning it back on scans
	 * already-loaded geometry so a later conversion can batch it. Not part of
	 * the public API and subject to change without notice.
	 */
	public get gpuInstancing(): {
		enabled: boolean;
		stats: {
			groupCount: number;
			instanceCount: number;
			effectMeshCount: number;
			drawCallCount: number;
		};
	} {
		const manager = this.#renderingEngine.instanceGroupManager;
		const viewport = this;
		return {
			get enabled() {
				return manager.enabled;
			},
			set enabled(value: boolean) {
				if (value === manager.enabled) return;
				if (value)
					GeometryEngine.instance.applyGpuInstancing(sceneTree.root);
				manager.enabled = value;
				viewport.update("gpuInstancing");
			},
			get stats() {
				return manager.stats;
			},
		};
	}

	public get gridColor(): Color {
		return this.#renderingEngine.gridColor;
	}

	public set gridColor(value: Color) {
		const scope = "gridColor";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"color",
		);
		this.#renderingEngine.gridColor = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("gridColor");
	}

	public get gridVisibility(): boolean {
		return this.#renderingEngine.gridVisibility;
	}

	public set gridVisibility(value: boolean) {
		const scope = "gridVisibility";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"boolean",
		);
		this.#renderingEngine.gridVisibility = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("gridVisibility");
	}

	public get groundPlaneColor(): Color {
		return this.#renderingEngine.groundPlaneColor;
	}

	public set groundPlaneColor(value: Color) {
		const scope = "groundPlaneColor";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"color",
		);
		this.#renderingEngine.groundPlaneColor = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("groundPlaneColor");
	}

	public get groundPlaneShadowColor(): Color {
		return this.#renderingEngine.groundPlaneShadowColor;
	}

	public set groundPlaneShadowColor(value: Color) {
		const scope = "groundPlaneShadowColor";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"color",
		);
		this.#renderingEngine.groundPlaneShadowColor = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("groundPlaneShadowColor");
	}

	public get groundPlaneShadowVisibility(): boolean {
		return this.#renderingEngine.groundPlaneShadowVisibility;
	}

	public set groundPlaneShadowVisibility(value: boolean) {
		const scope = "groundPlaneShadowVisibility";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"boolean",
		);
		this.#renderingEngine.groundPlaneShadowVisibility = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("groundPlaneShadowVisibility");
	}

	public get groundPlaneVisibility(): boolean {
		return this.#renderingEngine.groundPlaneVisibility;
	}

	public set groundPlaneVisibility(value: boolean) {
		const scope = "groundPlaneVisibility";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"boolean",
		);
		this.#renderingEngine.groundPlaneVisibility = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("groundPlaneVisibility");
	}

	public get id(): string {
		return this.#renderingEngine.id;
	}

	public get isBusy(): boolean {
		return this.#renderingEngine.busy;
	}

	public get lightScene(): ILightSceneApi | null {
		if (!this.#renderingEngine.lightEngine.lightScene) return null;
		return this.#lightScenes[
			this.#renderingEngine.lightEngine.lightScene.id
		];
	}

	public get lightScenes(): {[key: string]: ILightSceneApi} {
		return this.#lightScenes;
	}

	public get lights(): boolean {
		return this.#renderingEngine.lights;
	}

	public set lights(value: boolean) {
		const scope = "lights";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"boolean",
		);
		this.#renderingEngine.lights = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("lights");
	}

	public get loadDefaultCameras(): boolean {
		return this.#renderingEngine.loadDefaultCameras;
	}

	public set loadDefaultCameras(value: boolean) {
		const scope = "loadDefaultCameras";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"boolean",
		);
		this.#renderingEngine.loadDefaultCameras = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("loadDefaultCameras");
	}

	public get materialOverrideType(): MATERIAL_TYPE | undefined {
		return this.#renderingEngine.materialOverrideType;
	}

	public set materialOverrideType(value: MATERIAL_TYPE | undefined) {
		const scope = "materialOverrideType";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"enum",
			false,
			Object.values(MATERIAL_TYPE),
		);
		this.#renderingEngine.materialOverrideType = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("materialOverrideType");
	}

	public get maximumRenderingSize(): {
		width: number;
		height: number;
	} {
		return this.#renderingEngine.maximumRenderingSize;
	}

	public set maximumRenderingSize(value: {width: number; height: number}) {
		const scope = "maximumRenderingSize";
		this.#inputValidator.validateAndError(
			`SessionApi.${scope}`,
			value,
			"object",
		);
		this.#inputValidator.validateAndError(
			`SessionApi.${scope}`,
			value.width,
			"number",
		);
		this.#inputValidator.validateAndError(
			`SessionApi.${scope}`,
			value.height,
			"number",
		);
		this.#renderingEngine.maximumRenderingSize = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("maximumRenderingSize");
	}

	public get outputEncoding(): TEXTURE_ENCODING {
		return this.#renderingEngine.outputEncoding;
	}

	public set outputEncoding(value: TEXTURE_ENCODING) {
		const scope = "outputEncoding";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"enum",
			true,
			Object.values(TEXTURE_ENCODING),
		);
		this.#renderingEngine.outputEncoding = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("outputEncoding");
	}

	public get physicalGemDispersion(): boolean {
		return this.#renderingEngine.physicalGemDispersion;
	}

	public set physicalGemDispersion(value: boolean) {
		const scope = "physicalGemDispersion";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"boolean",
		);
		this.#renderingEngine.physicalGemDispersion = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("physicalGemDispersion");
	}

	public get physicalGemFresnel(): boolean {
		return this.#renderingEngine.physicalGemFresnel;
	}

	public set physicalGemFresnel(value: boolean) {
		const scope = "physicalGemFresnel";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"boolean",
		);
		this.#renderingEngine.physicalGemFresnel = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("physicalGemFresnel");
	}

	public get physicallyCorrectLights(): boolean {
		return this.#renderingEngine.physicallyCorrectLights;
	}

	public set physicallyCorrectLights(value: boolean) {
		const scope = "physicallyCorrectLights";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"boolean",
		);
		this.#renderingEngine.physicallyCorrectLights = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("physicallyCorrectLights");
	}

	public get pointSize(): number {
		return this.#renderingEngine.pointSize;
	}

	public set pointSize(value: number) {
		const scope = "pointSize";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"number",
		);
		this.#renderingEngine.pointSize = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("pointSize");
	}

	public get postProcessing(): IPostProcessingApi {
		return this.#postProcessing;
	}

	public get postRenderingCallback():
		| ((
				renderer: THREE.WebGLRenderer,
				scene: THREE.Scene,
				camera: THREE.Camera,
		  ) => void)
		| undefined {
		return this.#renderingEngine.postRenderingCallback;
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
		const scope = "postRenderingCallback";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"function",
			false,
		);
		this.#renderingEngine.postRenderingCallback = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("postRenderingCallback");
	}

	public get preRenderingCallback():
		| ((renderer: THREE.WebGLRenderer) => void)
		| undefined {
		return this.#renderingEngine.preRenderingCallback;
	}

	public set preRenderingCallback(
		value: ((renderer: THREE.WebGLRenderer) => void) | undefined,
	) {
		const scope = "preRenderingCallback";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"function",
			false,
		);
		this.#renderingEngine.preRenderingCallback = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("preRenderingCallback");
	}

	public get sessionSettingsId(): string | undefined {
		return this.#renderingEngine.sessionSettingsId;
	}

	public get sessionSettingsMode(): SESSION_SETTINGS_MODE {
		return this.#renderingEngine.sessionSettingsMode;
	}

	public get shadows(): boolean {
		return this.#renderingEngine.shadows;
	}

	public set shadows(value: boolean) {
		const scope = "shadows";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"boolean",
		);
		this.#renderingEngine.shadows = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("shadows");
	}

	public get sceneState(): ISceneState {
		return this.#renderingEngine.sceneState;
	}

	public get show(): boolean {
		return this.#renderingEngine.show;
	}

	public set show(value: boolean) {
		const scope = "show";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"boolean",
		);
		this.#renderingEngine.show = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("show");
	}

	public get showStatistics(): boolean {
		return this.#renderingEngine.showStatistics;
	}

	public set showStatistics(value: boolean) {
		const scope = "showStatistics";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"boolean",
		);
		this.#renderingEngine.showStatistics = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("showStatistics");
	}

	public get softShadows(): boolean {
		return this.#renderingEngine.softShadows;
	}

	public set softShadows(value: boolean) {
		const scope = "softShadows";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"boolean",
		);
		this.#renderingEngine.softShadows = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("softShadows");
	}

	public get textureEncoding(): TEXTURE_ENCODING {
		return this.#renderingEngine.textureEncoding;
	}

	public set textureEncoding(value: TEXTURE_ENCODING) {
		const scope = "textureEncoding";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"enum",
			true,
			Object.values(TEXTURE_ENCODING),
		);
		this.#renderingEngine.textureEncoding = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("textureEncoding");
	}

	public get threeJsCoreObjects(): {
		scene: THREE.Scene;
		renderer: THREE.WebGLRenderer;
		camera: THREE.Camera;
	} {
		return {
			scene: this.#renderingEngine.sceneTreeManager.scene,
			renderer: this.#renderingEngine.renderer,
			camera: this.#renderingEngine.cameraManager.camera,
		};
	}

	public get toneMapping(): TONE_MAPPING {
		return this.#renderingEngine.toneMapping;
	}

	public set toneMapping(value: TONE_MAPPING) {
		const scope = "toneMapping";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"enum",
			true,
			Object.values(TONE_MAPPING),
		);
		this.#renderingEngine.toneMapping = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("toneMapping");
	}

	public get toneMappingExposure(): number {
		return this.#renderingEngine.toneMappingExposure;
	}

	public set toneMappingExposure(value: number) {
		const scope = "toneMappingExposure";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"number",
		);
		this.#renderingEngine.toneMappingExposure = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("toneMappingExposure");
	}

	public get type(): RENDERER_TYPE {
		return this.#renderingEngine.type;
	}

	public set type(value: RENDERER_TYPE) {
		const scope = "type";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"enum",
			true,
			Object.values(RENDERER_TYPE),
		);
		this.#renderingEngine.type = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("type");
	}

	public get visualizeAttributes():
		| ((
				overview: ISDTFOverview,
				itemData?: ISDTFItemData,
		  ) => ISDTFAttributeVisualizationData)
		| undefined {
		return this.#renderingEngine.visualizeAttributes;
	}

	public set visualizeAttributes(
		value:
			| ((
					overview: ISDTFOverview,
					itemData?: ISDTFItemData,
			  ) => ISDTFAttributeVisualizationData)
			| undefined,
	) {
		const scope = "visualizeAttributes";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"function",
			false,
		);
		this.#renderingEngine.visualizeAttributes = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.render();
	}

	// #endregion Public Getters And Setters (106)

	// #region Public Methods (41)

	public addCanvasEventListener(listener: IDomEventListener): string {
		const scope = "addCanvasEventListener";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			listener,
			"object",
		);
		return this.#renderingEngine.domEventEngine.addDomEventListener(
			listener,
		);
	}

	public addFlag(flag: FLAG_TYPE): string {
		const scope = "addFlag";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			flag,
			"enum",
			true,
			Object.values(FLAG_TYPE),
		);
		const token = this.#renderingEngine.addFlag(flag);
		return token;
	}

	public addRestrictedCanvasListenerToken(token: string): void {
		this.#renderingEngine.domEventEngine.addRestrictedListenerToken(token);
	}

	public applyViewportSettings(
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
	) {
		const scope = "applyViewportSettings";
		this.#inputValidator.validateAndError(
			`SessionApi.${scope}`,
			settings,
			"object",
		);
		this.#inputValidator.validateAndError(
			`SessionApi.${scope}`,
			sections,
			"object",
			false,
		);
		return this.#creationControlCenterViewport.applyViewportSettings(
			this.id,
			settings,
			sections,
		);
	}

	public assignCamera(id: string): boolean {
		const scope = "assignCamera";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			id,
			"string",
		);
		const check = this.#renderingEngine.cameraEngine.assignCamera(id);
		this.#applyUpdate("assignCamera");
		return check;
	}

	public assignLightScene(id: string): boolean {
		const scope = "assignLightScene";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			id,
			"string",
		);
		const check = this.#renderingEngine.lightEngine.assignLightScene(id);
		this.#applyUpdate("assignLightScene");
		return check;
	}

	public async close(): Promise<void> {
		return await this.#creationControlCenterViewport.closeViewportEngine(
			this.id,
		);
	}

	public continueRendering(): void {
		this.#renderingEngine.continueRendering();
	}

	public convert3Dto2D(p: vec3): IConvert3Dto2DResult {
		const scope = "convert3Dto2D";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			p,
			"vec3",
		);
		return this.#renderingEngine.convert3Dto2D(p);
	}

	public async convertToGlTF(
		node: ITreeNode = sceneTree.root,
		convertForAr: boolean = false,
	): Promise<Blob> {
		const scope = "convertToGlTF";
		if (!(node instanceof TreeNode))
			throw new ShapeDiverViewerValidationError(
				`${scope}: Input could not be validated. ${node} is not of type node.`,
				node,
				"node",
			);

		this.#applyUpdate("convertToGlTF.start");
		const result = await this.#gltfConverter.convert(
			node,
			convertForAr,
			this.id,
		);
		this.#applyUpdate("convertToGlTF.end");
		return new Blob([result], {type: "application/octet-stream"});
	}

	public async createArSessionLink(
		node?: ITreeNode,
		qrCode: boolean = true,
		fallbackUrl?: string,
	): Promise<string> {
		const scope = "createArSessionLink";
		if (node && !(node instanceof TreeNode))
			throw new ShapeDiverViewerValidationError(
				`${scope}: Input could not be validated. ${node} is not of type node.`,
				node,
				"node",
			);

		let sessionEngineId: string | undefined = undefined;
		for (const s in this.#stateEngine.sessionEngines) {
			const state = this.#stateEngine.sessionEngines[s];
			if (state !== undefined && state.canUploadGLTF) {
				sessionEngineId = s;
				break;
			}
		}

		if (!sessionEngineId)
			throw new ShapeDiverViewerArError(
				"ViewportApi.createArSessionLink: None of the sessions that are registered are capable of using the AR feature.",
			);

		const targetNode = node || sceneTree.root;

		const scalingMatrix: mat4 = mat4.fromScaling(
			mat4.create(),
			this.arScale,
		);

		// add scaling matrix to scene tree node
		targetNode.transformations.push({
			id: "ar_scaling",
			matrix: scalingMatrix,
		});

		// create the gltf
		this.#applyUpdate("createArSessionLink.start");
		const blob = await this.#gltfConverter.convert(
			targetNode,
			true,
			this.id,
		);

		// remove scaling the matrix
		for (let i = 0; i < targetNode.transformations.length; i++)
			if (targetNode.transformations[i].id === "ar_scaling")
				targetNode.transformations.splice(i, 1);

		this.#applyUpdate("createArSessionLink.end");

		const response = await this.#stateEngine.sessionEngines[
			sessionEngineId!
		]?.uploadGLTF(
			new Blob([blob], {type: "application/octet-stream"}),
			QueryGltfConversion.SCENE,
		);

		const backends: {
			[key: string]: string;
		} = {
			sddev3: "https://sddev3.eu-central-1.shapediver.com",
			sddev2: "https://sddev2.eu-central-1.shapediver.com",
			sddev: "https://sddev.eu-central-1.shapediver.com",
			sdtest: "https://sdtest.us-east-1.shapediver.com",
			sdeuc1: "https://sdeuc1.eu-central-1.shapediver.com",
			sdr7euc1: "https://sdr7euc1.eu-central-1.shapediver.com",
			sduse1: "https://model-view.shapediver.com",
		};

		let backendIdentifier = Object.keys(backends).find(
			(key: string) =>
				backends[key] ===
				this.#stateEngine.sessionEngines[sessionEngineId!]
					?.modelViewUrl,
		);
		if (!backendIdentifier) {
			const modelViewUrl =
				this.#stateEngine.sessionEngines[sessionEngineId!]
					?.modelViewUrl;
			backendIdentifier = modelViewUrl
				?.replace("https://", "")
				.replace(".shapediver.com", "");
		}

		const fallbackQueryParameter = fallbackUrl
			? `fb=${encodeURIComponent(fallbackUrl)}&`
			: "";

		if (!response || !response.gltf || !response.gltf.sceneId)
			throw new ShapeDiverViewerArError(
				"ViewportApi.createArSessionLink: There was an unexpected error with the ar scene response. Please contact us if this happens again.",
			);

		const sceneId = response.gltf!.sceneId!;

		const link = `https://viewer.shapediver.com/v3/${build_data.build_version}/ar.html?${fallbackQueryParameter}b=${encodeURIComponent(backendIdentifier!)}&id=${encodeURIComponent(sceneId)}`;
		if (qrCode === false) {
			return link;
		} else {
			const qrCodeLink = await new Promise<string>((resolve, reject) => {
				QRCode.toDataURL(
					link,
					(error: Error | null | undefined, url: string) => {
						if (error) {
							reject(error);
						} else {
							resolve(url);
						}
					},
				);
			});
			return qrCodeLink;
		}
	}

	public createLightScene(properties?: {
		name?: string | undefined;
		standard?: boolean | undefined;
	}): ILightSceneApi {
		const scope = "createLightScene";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			properties,
			"object",
			false,
		);
		const prop = Object.assign({}, properties);
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			prop.name,
			"string",
			false,
		);
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			prop.standard,
			"boolean",
			false,
		);
		const lightScene = this.#renderingEngine.lightEngine.createLightScene(
			properties || {},
		);
		this.#applyUpdate("createLightScene");
		return this.#lightScenes[lightScene.id];
	}

	public createOrthographicCamera(id?: string): IOrthographicCameraApi {
		const scope = "createOrthographicCamera";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			id,
			"string",
			false,
		);
		const camera = this.#renderingEngine.cameraEngine.createCamera(
			CAMERA_TYPE.ORTHOGRAPHIC,
			id,
		);
		this.#applyUpdate("createOrthographicCamera");
		return <IOrthographicCameraApi>this.#cameras[camera.id];
	}

	public createPerspectiveCamera(id?: string): IPerspectiveCameraApi {
		const scope = "createPerspectiveCamera";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			id,
			"string",
			false,
		);
		const camera = this.#renderingEngine.cameraEngine.createCamera(
			CAMERA_TYPE.PERSPECTIVE,
			id,
		);
		this.#applyUpdate("createPerspectiveCamera");
		return <IPerspectiveCameraApi>this.#cameras[camera.id];
	}

	public createSDTFOverview(node: ITreeNode): ISDTFOverview {
		const scope = "createSDTFOverview";
		if (!(node instanceof TreeNode))
			throw new ShapeDiverViewerValidationError(
				`${scope}: Input could not be validated. ${node} is not of type node.`,
				node,
				"node",
			);

		return this.#renderingEngine.createSDTFOverview(node);
	}

	public displayErrorMessage(message: string): void {
		const scope = "displayErrorMessage";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			message,
			"string",
		);
		this.#renderingEngine.displayErrorMessage(message);
		this.#applyUpdate("displayErrorMessage");
	}

	public getEnvironmentMapImageUrl(): string {
		return this.#renderingEngine.getEnvironmentMapImageUrl();
	}

	public getScreenshot(type?: string, quality?: number): string {
		const scope = "getScreenshot";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			type,
			"string",
			false,
		);
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			quality,
			"number",
			false,
		);
		this.#applyUpdate("getScreenshot");
		return this.#renderingEngine.getScreenshot(type, quality);
	}

	public async getSettledScreenshot(
		type?: string,
		quality?: number,
	): Promise<string> {
		const scope = "getSettledScreenshot";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			type,
			"string",
			false,
		);
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			quality,
			"number",
			false,
		);
		this.#applyUpdate("getSettledScreenshot");
		return await this.#renderingEngine.getSettledScreenshot(type, quality);
	}

	public getScreenshotAdvanced(
		type?: string,
		quality?: number,
		resolution?: {width: number; height: number},
		camera?: OrthographicCameraProperties | PerspectiveCameraProperties,
		includeHtml?: boolean,
	): Promise<string> {
		const scope = "getScreenshotAdvanced";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			type,
			"string",
			false,
		);
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			quality,
			"number",
			false,
		);
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			resolution,
			"object",
			false,
		);
		if (resolution) {
			this.#inputValidator.validateAndError(
				`ViewportApi.${scope}`,
				resolution.width,
				"number",
			);
			this.#inputValidator.validateAndError(
				`ViewportApi.${scope}`,
				resolution.height,
				"number",
			);
		}
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			camera,
			"object",
			false,
		);
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			includeHtml,
			"boolean",
			false,
		);
		this.#applyUpdate("getScreenshotAdvanced");
		return (this.#renderingEngine.getScreenshotAdvanced as any)(
			type,
			quality,
			resolution,
			camera,
			includeHtml,
		);
	}

	public getViewportSettings(): ISettings {
		return this.#creationControlCenterViewport.getViewportSettings(this.id);
	}

	public isMobileDeviceWithoutBrowserARSupport(): boolean {
		return this.#renderingEngine.isMobileDeviceWithoutBrowserARSupport();
	}

	public pauseRendering(): void {
		this.#renderingEngine.pauseRendering();
	}

	public pointerEventToRay(event: PointerEvent): {
		origin: vec3;
		direction: vec3;
	} {
		return this.#renderingEngine.pointerEventToRay(event);
	}

	public raytraceScene(
		origin: vec3,
		direction: vec3,
		filterCriteria?: IIntersectionFilter[],
	): {
		distance: number;
		node: ITreeNode;
		data?: IGeometryData;
		normal?: vec3;
	}[] {
		const scope = "raytraceScene";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			origin,
			"vec3",
		);
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			direction,
			"vec3",
		);
		return this.#renderingEngine.raytraceScene(
			origin,
			direction,
			filterCriteria,
		);
	}

	public removeCamera(id: string): boolean {
		const scope = "removeCamera";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			id,
			"string",
		);
		const check = this.#renderingEngine.cameraEngine.removeCamera(id);
		this.#applyUpdate("removeCamera");
		return check;
	}

	public removeCanvasEventListener(token: string): boolean {
		const scope = "removeCanvasEventListener";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			token,
			"string",
		);
		const check =
			this.#renderingEngine.domEventEngine.removeDomEventListener(token);
		return check;
	}

	public removeFlag(token: string): boolean {
		const scope = "removeFlag";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			token,
			"string",
		);
		const check = this.#renderingEngine.removeFlag(token);
		return check;
	}

	public removeLightScene(id: string): boolean {
		const scope = "removeLightScene";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			id,
			"string",
		);
		const check = this.#renderingEngine.lightEngine.removeLightScene(id);
		this.#applyUpdate("removeLightScene");
		return check;
	}

	public removeRestrictedCanvasListenerToken(token: string): void {
		this.#renderingEngine.domEventEngine.removeRestrictedListenerToken(
			token,
		);
	}

	public render(): void {
		this.#renderingEngine.renderingManager.render();
	}

	public resetToDefaultCameras(): void {
		for (const c in this.cameras)
			this.#renderingEngine.cameraEngine.removeCamera(c);
		this.#renderingEngine.cameraEngine.createDefaultCameras();
		this.#applyUpdate("resetToDefaultCameras");
	}

	public resize(width: number, height: number): void {
		const scope = "resize";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			width,
			"number",
		);
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			height,
			"number",
		);
		this.#renderingEngine.resize(width, height);
		this.#applyUpdate("resize");
	}

	public restrictEventListeners(allowedListeners: {
		mousewheel?: boolean;
		pointerdown?: boolean;
		pointermove?: boolean;
		pointerup?: boolean;
		pointerout?: boolean;
		keydown?: boolean;
		keyup?: boolean;
		contextmenu?: boolean;
	}) {
		this.#renderingEngine.domEventEngine.allowEventListeners(
			allowedListeners,
		);
	}

	public update(id?: string): void {
		this.#renderingEngine.update(id || "ViewportApi");
	}

	/**
	 * The update that a setter or method of this viewport runs to apply its
	 * own change. Unlike {@link update}, it does not mark everything as
	 * changed in the scene state (channel `unknown`) when no scene update
	 * ran: a setting records its own channel.
	 */
	#applyUpdate(id: string): void {
		this.#renderingEngine.update(id, false);
	}

	public updateDefaultLineMaterial(value: MaterialBasicLineData) {
		const scope = "updateDefaultLineMaterial";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"object",
		);
		this.#renderingEngine.defaultLineMaterial = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("updateDefaultLineMaterial");
	}

	public updateDefaultMaterial(value: MaterialStandardData) {
		const scope = "updateDefaultMaterial";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"object",
		);
		this.#renderingEngine.defaultMaterial = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("updateDefaultMaterial");
	}

	public updateDefaultPointMaterial(value: MaterialPointData) {
		const scope = "updateDefaultPointMaterial";
		this.#inputValidator.validateAndError(
			`ViewportApi.${scope}`,
			value,
			"object",
		);
		this.#renderingEngine.defaultPointMaterial = value;
		this.#logger.debug(
			`ViewportApi.${scope}: ${scope} was set to: ${value}`,
		);
		this.#applyUpdate("updateDefaultPointMaterial");
	}

	public updateEnvironmentGeometry(): void {
		this.#renderingEngine.updateEnvironmentGeometry();
	}

	public updateGeometryData(geometryData: IGeometryData): void {
		// The nodes that hold the data record a material change, without a
		// new version: the material is swapped here, not converted again.
		(geometryData as GeometryData).noteParentsChange?.("material");
		this.#renderingEngine.sceneTreeManager.recordChannel("material");
		this.#renderingEngine.geometryLoader.updateGeometryMaterial(
			geometryData as GeometryData,
		);
	}

	public updateNode(node: ITreeNode): void {
		const scope = "updateNode";
		if (!(node instanceof TreeNode))
			throw new ShapeDiverViewerValidationError(
				`${scope}: Input could not be validated. ${node} is not of type node.`,
				node,
				"node",
			);

		this.#renderingEngine.sceneTreeManager.updateNode(
			node,
			node.convertedObject[this.id] as THREE.Object3D,
		);
	}

	public updateNodes(nodes: ITreeNode[]): void {
		const scope = "updateNodes";
		// Validate every entry before anything is updated.
		for (const node of nodes)
			if (!(node instanceof TreeNode))
				throw new ShapeDiverViewerValidationError(
					`${scope}: Input could not be validated. ${node} is not of type node.`,
					node,
					"nodes",
				);

		this.#renderingEngine.sceneTreeManager.updateNodes(nodes);
	}

	public updateNodeTransformation(node: ITreeNode): void {
		const scope = "updateNodeTransformation";
		if (!(node instanceof TreeNode))
			throw new ShapeDiverViewerValidationError(
				`${scope}: Input could not be validated. ${node} is not of type node.`,
				node,
				"node",
			);

		this.#renderingEngine.sceneTreeManager.updateNode(
			node,
			node.convertedObject[this.id] as THREE.Object3D,
			{transformationOnly: true},
		);
	}

	public async viewInAR(node?: ITreeNode): Promise<void> {
		const scope = "viewInAR";
		if (node && !(node instanceof TreeNode))
			throw new ShapeDiverViewerValidationError(
				`${scope}: Input could not be validated. ${node} is not of type node.`,
				node,
				"node",
			);

		let sessionEngineId: string | undefined = undefined;
		for (const s in this.#stateEngine.sessionEngines) {
			const state = this.#stateEngine.sessionEngines[s];
			if (state !== undefined && state.canUploadGLTF) {
				sessionEngineId = s;
				break;
			}
		}

		if (!sessionEngineId)
			throw new ShapeDiverViewerArError(
				"Api.viewInAR: None of the sessions that are registered are capable of using the AR feature.",
			);

		const targetNode = node || sceneTree.root;

		const scalingMatrix: mat4 = mat4.fromScaling(
			mat4.create(),
			this.arScale,
		);

		// add scaling matrix to scene tree node
		targetNode.transformations.push({
			id: "ar_scaling",
			matrix: scalingMatrix,
		});

		// create the gltf
		this.#applyUpdate("viewInAR.start");
		const blob = await this.#gltfConverter.convert(
			targetNode,
			true,
			this.id,
		);

		// remove scaling the matrix
		for (let i = 0; i < targetNode.transformations.length; i++)
			if (targetNode.transformations[i].id === "ar_scaling")
				targetNode.transformations.splice(i, 1);

		this.#applyUpdate("viewInAR.end");

		const response = await this.#stateEngine.sessionEngines[
			sessionEngineId!
		]?.uploadGLTF(
			new Blob([blob], {type: "application/octet-stream"}),
			this.#systemInfo.isIOS
				? QueryGltfConversion.USDZ
				: QueryGltfConversion.NONE,
		);
		const href = response?.gltf?.href;
		if (href) this.#renderingEngine.viewInAR(href);
	}

	public viewableInAR(): boolean {
		return this.#renderingEngine.viewableInAR();
	}

	// #endregion Public Methods (41)
}
