import { mat4, vec2, vec3 } from "gl-matrix";
import { RenderingEngine as RenderingEngineThreeJs } from "@shapediver/viewer.rendering-engine-threejs.standard";
import { IViewportApi } from "../../interfaces/viewport/IViewportApi";
import { ICreationControlCenter, CreationControlCenter } from "@shapediver/viewer.main.creation-control-center";
import { Converter, IDomEventListener, InputValidator, Logger, ShapeDiverBackendError, ShapeDiverViewerArError, ShapeDiverViewerError, ShapeDiverViewerValidationError, SystemInfo } from "@shapediver/viewer.shared.services";
import { FLAG_TYPE, RENDERER_TYPE, SESSION_SETTINGS_MODE, TEXTURE_ENCODING, TONE_MAPPING } from "@shapediver/viewer.rendering-engine.rendering-engine";
import { CAMERA_TYPE, IOrthographicCamera, IPerspectiveCamera } from "@shapediver/viewer.rendering-engine.camera-engine";
import { PerspectiveCameraApi } from "./camera/PerspectiveCameraApi";
import { OrthographicCameraApi } from "./camera/OrthographicCameraApi";
import { LightSceneApi } from "./lights/LightSceneApi";
import { GLTFConverter } from "@shapediver/viewer.data-engine.gltf-converter";
import { ShapeDiverRequestGltfUploadQueryConversion } from "@shapediver/sdk.geometry-api-sdk-v2";
import { ICameraApi } from "../../interfaces/viewport/camera/ICameraApi";
import { ILightSceneApi } from "../../interfaces/viewport/lights/ILightSceneApi";
import { Color, IAnimationData, IGeometryData, ISDTFAttributeVisualizationData, ISDTFItemData, ISDTFOverview } from "@shapediver/viewer.shared.types";
import { ITreeNode, TreeNode } from "@shapediver/viewer.shared.node-tree";
import { sceneTree } from "../../main";
import { IOrthographicCameraApi } from "../../interfaces/viewport/camera/IOrthographicCameraApi";
import { IPerspectiveCameraApi } from "../../interfaces/viewport/camera/IPerspectiveCameraApi";
import { ISettingsV3_1 } from "@shapediver/viewer.settings";
import { build_data } from "@shapediver/viewer.shared.build-data";
import * as QRCode from "qrcode";
import { AnimationEngine } from "@shapediver/viewer.rendering-engine.animation-engine";

export class ViewportApi implements IViewportApi {
    // #region Properties (5)

    readonly #animationEngine: AnimationEngine = AnimationEngine.instance;
    readonly #renderingEngine: RenderingEngineThreeJs;
    readonly #creationControlCenter: ICreationControlCenter = CreationControlCenter.instance;
    readonly #converter: Converter = Converter.instance;
    readonly #gltfConverter: GLTFConverter = GLTFConverter.instance;
    readonly #inputValidator: InputValidator = InputValidator.instance;
    readonly #logger: Logger = Logger.instance;
    readonly #systemInfo: SystemInfo = SystemInfo.instance;

    readonly #cameras: { [key: string]: ICameraApi } = {};
    readonly #lightScenes: { [key: string]: ILightSceneApi } = {};

    // #endregion Properties (5)

    // #region Constructors (1)

    constructor(renderingEngine: RenderingEngineThreeJs) {
        this.#renderingEngine = renderingEngine;

        // Whenever a camera is added or removed from the camera engine, this update is called.
        this.#renderingEngine.cameraEngine.update = () => {
            for (let c in this.#renderingEngine.cameraEngine.cameras) {
                if (!this.#cameras[c]) {
                    if (this.#renderingEngine.cameraEngine.cameras[c].type === CAMERA_TYPE.PERSPECTIVE) {
                        this.#cameras[c] = new PerspectiveCameraApi(this, <IPerspectiveCamera>this.#renderingEngine.cameraEngine.cameras[c]);
                    } else {
                        this.#cameras[c] = new OrthographicCameraApi(this, <IOrthographicCamera>this.#renderingEngine.cameraEngine.cameras[c]);
                    }
                }
            }

            for (let c in this.#cameras) {
                if (!this.#renderingEngine.cameraEngine.cameras[c]) {
                    delete this.#cameras[c];
                }
            }
        }

        // We call it once in the beginning to get the current state.
        this.#renderingEngine.cameraEngine.update();

        // Whenever a camera is added or removed from the camera engine, this update is called.
        this.#renderingEngine.lightEngine.update = () => {
            for (let l in this.#renderingEngine.lightEngine.lightScenes) {
                if (!this.#lightScenes[l]) {
                    this.#lightScenes[l] = new LightSceneApi(this, this.#renderingEngine.lightEngine.lightScenes[l]);
                }
            }

            for (let l in this.#lightScenes) {
                if (!this.#renderingEngine.lightEngine.lightScenes[l]) {
                    delete this.#lightScenes[l];
                }
            }
        }

        // We call it once in the beginning to get the current state.
        this.#renderingEngine.lightEngine.update();
    }

    // #endregion Constructors (1)

    // #region Public Accessors (69)

    public get ambientOcclusion(): boolean {
        return this.#renderingEngine.ambientOcclusion;
    }

    public set ambientOcclusion(value: boolean) {
        const scope = 'ambientOcclusion';
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, value, 'boolean');
        this.#renderingEngine.ambientOcclusion = value;
        this.#logger.debug(`ViewportApi.${scope}: ${scope} was set to: ${value}`);
        this.update('ambientOcclusion');
    }

    public get ambientOcclusionIntensity(): number {
        return this.#renderingEngine.ambientOcclusionIntensity;
    }

    public set ambientOcclusionIntensity(value: number) {
        const scope = 'ambientOcclusionIntensity';
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, value, 'number');
        this.#renderingEngine.ambientOcclusionIntensity = value;
        this.#logger.debug(`ViewportApi.${scope}: ${scope} was set to: ${value}`);
        this.update('ambientOcclusionIntensity');
    }

    public get animations(): {
        [key: string]: IAnimationData
    } {
        return this.#animationEngine.animations;
    }

    public get arRotation(): vec3 {
        return this.#renderingEngine.arRotation;
    }

    public set arRotation(value: vec3) {
        const scope = 'arRotation';
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, value, 'vec3');
        this.#renderingEngine.arRotation = value;
        this.#logger.debug(`ViewportApi.${scope}: ${scope} was set to: ${value}`);
        this.update('arRotation');
    }

    public get arScale(): vec3 {
        return this.#renderingEngine.arScale;
    }

    public set arScale(value: vec3) {
        const scope = 'arScale';
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, value, 'vec3');
        this.#renderingEngine.arScale = vec3.max(vec3.create(), value, vec3.fromValues(0.001, 0.001, 0.001));
        this.#logger.debug(`ViewportApi.${scope}: ${scope} was set to: ${value}`);
        this.update('arScale');
    }

    public get arTranslation(): vec3 {
        return this.#renderingEngine.arTranslation;
    }

    public set arTranslation(value: vec3) {
        const scope = 'arTranslation';
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, value, 'vec3');
        this.#renderingEngine.arTranslation = value;
        this.#logger.debug(`ViewportApi.${scope}: ${scope} was set to: ${value}`);
        this.update('arTranslation');
    }

    public get automaticColorAdjustment(): boolean {
        return this.#renderingEngine.automaticColorAdjustment;
    }

    public set automaticColorAdjustment(value: boolean) {
        const scope = 'automaticColorAdjustment';
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, value, 'boolean');
        this.#renderingEngine.automaticColorAdjustment = value;
        this.#logger.debug(`ViewportApi.${scope}: ${scope} was set to: ${value}`);
        this.update('automaticColorAdjustment');
    }

    public get automaticResizing(): boolean {
        return this.#renderingEngine.automaticResizing;
    }

    public set automaticResizing(value: boolean) {
        const scope = 'automaticResizing';
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, value, 'boolean');
        this.#renderingEngine.automaticResizing = value;
        this.#logger.debug(`ViewportApi.${scope}: ${scope} was set to: ${value}`);
        this.update('automaticResizing');
    }

    public get beautyRenderBlendingDuration(): number {
        return this.#renderingEngine.beautyRenderBlendingDuration;
    }

    public set beautyRenderBlendingDuration(value: number) {
        const scope = 'beautyRenderBlendingDuration';
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, value, 'number');
        this.#renderingEngine.beautyRenderBlendingDuration = value;
        this.#logger.debug(`ViewportApi.${scope}: ${scope} was set to: ${value}`);
        this.update('beautyRenderBlendingDuration');
    }

    public get beautyRenderDelay(): number {
        return this.#renderingEngine.beautyRenderDelay;
    }

    public set beautyRenderDelay(value: number) {
        const scope = 'beautyRenderDelay';
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, value, 'number');
        this.#renderingEngine.beautyRenderDelay = value;
        this.#logger.debug(`ViewportApi.${scope}: ${scope} was set to: ${value}`);
        this.update('beautyRenderDelay');
    }

    public get camera(): ICameraApi | null {
        if (!this.#renderingEngine.cameraEngine.camera) return null;
        return this.#cameras[this.#renderingEngine.cameraEngine.camera.id];
    }

    public get cameras(): { [key: string]: ICameraApi; } {
        return this.#cameras;
    }

    public get canvas(): HTMLCanvasElement {
        return this.#renderingEngine.canvas;
    }

    public get clearAlpha(): number {
        return this.#renderingEngine.clearAlpha;
    }

    public set clearAlpha(value: number) {
        const scope = 'clearAlpha';
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, value, 'number');
        this.#renderingEngine.clearAlpha = value;
        this.#logger.debug(`ViewportApi.${scope}: ${scope} was set to: ${value}`);
        this.update('clearAlpha');
    }

    public get clearColor(): Color {
        return this.#renderingEngine.clearColor;
    }

    public set clearColor(value: Color) {
        const scope = 'clearColor';
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, value, 'color');
        this.#renderingEngine.clearColor = value;
        this.#logger.debug(`ViewportApi.${scope}: ${scope} was set to: ${value}`);
        this.update('clearColor');
    }

    public get enableAR(): boolean {
        return this.#renderingEngine.enableAR;
    }

    public set enableAR(value: boolean) {
        const scope = 'enableAR';
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, value, 'boolean');
        this.#renderingEngine.enableAR = value;
        this.#logger.debug(`ViewportApi.${scope}: ${scope} was set to: ${value}`);
        this.update('enableAR');
    }

    public get environmentMap(): string | string[] {
        return this.#renderingEngine.environmentMap;
    }

    public set environmentMap(value: string | string[]) {
        const scope = 'environmentMap';
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, value, 'cubeMap');
        this.#renderingEngine.environmentMap = value;
        this.#logger.debug(`ViewportApi.${scope}: ${scope} was set to: ${value}`);
        this.update('environmentMap');
    }

    public get environmentMapAsBackground(): boolean {
        return this.#renderingEngine.environmentMapAsBackground;
    }

    public set environmentMapAsBackground(value: boolean) {
        const scope = 'environmentMapAsBackground';
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, value, 'boolean');
        this.#renderingEngine.environmentMapAsBackground = value;
        this.#logger.debug(`ViewportApi.${scope}: ${scope} was set to: ${value}`);
        this.update('environmentMapAsBackground');
    }

    public get environmentMapResolution(): string {
        return this.#renderingEngine.environmentMapResolution;
    }

    public set environmentMapResolution(value: string) {
        const scope = 'environmentMapResolution';
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, value, 'string');
        this.#renderingEngine.environmentMapResolution = value;
        this.#logger.debug(`ViewportApi.${scope}: ${scope} was set to: ${value}`);
        this.update('environmentMapResolution');
    }

    public get environmentMapForUnlitMaterials(): boolean {
        return this.#renderingEngine.environmentMapForUnlitMaterials;
    }

    public set environmentMapForUnlitMaterials(value: boolean) {
        const scope = 'environmentMapForUnlitMaterials';
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, value, 'boolean');
        this.#renderingEngine.environmentMapForUnlitMaterials = value;
        this.#logger.debug(`ViewportApi.${scope}: ${scope} was set to: ${value}`);
        this.update('environmentMapForUnlitMaterials');
    }

    public get gridColor(): Color {
        return this.#renderingEngine.gridColor;
    }

    public set gridColor(value: Color) {
        const scope = 'gridColor';
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, value, 'color');
        this.#renderingEngine.gridColor = value;
        this.#logger.debug(`ViewportApi.${scope}: ${scope} was set to: ${value}`);
        this.update('gridColor');
    }

    public get gridVisibility(): boolean {
        return this.#renderingEngine.gridVisibility;
    }

    public set gridVisibility(value: boolean) {
        const scope = 'gridVisibility';
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, value, 'boolean');
        this.#renderingEngine.gridVisibility = value;
        this.#logger.debug(`ViewportApi.${scope}: ${scope} was set to: ${value}`);
        this.update('gridVisibility');
    }

    public get groundPlaneColor(): Color {
        return this.#renderingEngine.groundPlaneColor;
    }

    public set groundPlaneColor(value: Color) {
        const scope = 'groundPlaneColor';
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, value, 'color');
        this.#renderingEngine.groundPlaneColor = value;
        this.#logger.debug(`ViewportApi.${scope}: ${scope} was set to: ${value}`);
        this.update('groundPlaneColor');
    }

    public get groundPlaneVisibility(): boolean {
        return this.#renderingEngine.groundPlaneVisibility;
    }

    public set groundPlaneVisibility(value: boolean) {
        const scope = 'groundPlaneVisibility';
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, value, 'boolean');
        this.#renderingEngine.groundPlaneVisibility = value;
        this.#logger.debug(`ViewportApi.${scope}: ${scope} was set to: ${value}`);
        this.update('groundPlaneVisibility');
    }

    public get groundPlaneShadowColor(): Color {
        return this.#renderingEngine.groundPlaneShadowColor;
    }

    public set groundPlaneShadowColor(value: Color) {
        const scope = 'groundPlaneShadowColor';
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, value, 'color');
        this.#renderingEngine.groundPlaneShadowColor = value;
        this.#logger.debug(`ViewportApi.${scope}: ${scope} was set to: ${value}`);
        this.update('groundPlaneShadowColor');
    }

    public get groundPlaneShadowVisibility(): boolean {
        return this.#renderingEngine.groundPlaneShadowVisibility;
    }

    public set groundPlaneShadowVisibility(value: boolean) {
        const scope = 'groundPlaneShadowVisibility';
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, value, 'boolean');
        this.#renderingEngine.groundPlaneShadowVisibility = value;
        this.#logger.debug(`ViewportApi.${scope}: ${scope} was set to: ${value}`);
        this.update('groundPlaneShadowVisibility');
    }

    public get id(): string {
        return this.#renderingEngine.id;
    }

    public get lights(): boolean {
        return this.#renderingEngine.lights;
    }

    public set lights(value: boolean) {
        const scope = 'lights';
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, value, 'boolean');
        this.#renderingEngine.lights = value;
        this.#logger.debug(`ViewportApi.${scope}: ${scope} was set to: ${value}`);
        this.update('lights');
    }

    public get lightScene(): ILightSceneApi | null {
        if (!this.#renderingEngine.lightEngine.lightScene) return null;
        return this.#lightScenes[this.#renderingEngine.lightEngine.lightScene.id];
    }

    public get lightScenes(): { [key: string]: ILightSceneApi; } {
        return this.#lightScenes;
    }

    public get maximumRenderingSize(): {
        width: number,
        height: number
    } {
        return this.#renderingEngine.maximumRenderingSize;
    }

    public set maximumRenderingSize(value: {
        width: number,
        height: number
    }) {
        const scope = 'maximumRenderingSize';
        this.#inputValidator.validateAndError(`SessionApi.${scope}`, value, 'object');
        this.#inputValidator.validateAndError(`SessionApi.${scope}`, value.width, 'number');
        this.#inputValidator.validateAndError(`SessionApi.${scope}`, value.height, 'number');
        this.#renderingEngine.maximumRenderingSize = value;
        this.#logger.debug(`ViewportApi.${scope}: ${scope} was set to: ${value}`);
        this.update('maximumRenderingSize');
    }

    public get outputEncoding(): TEXTURE_ENCODING {
        return this.#renderingEngine.outputEncoding;
    }

    public set outputEncoding(value: TEXTURE_ENCODING) {
        const scope = 'outputEncoding';
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, value, 'enum', true, Object.values(TEXTURE_ENCODING));
        this.#renderingEngine.outputEncoding = value;
        this.#logger.debug(`ViewportApi.${scope}: ${scope} was set to: ${value}`);
        this.update('outputEncoding');
    }

    public get physicallyCorrectLights(): boolean {
        return this.#renderingEngine.physicallyCorrectLights;
    }

    public set physicallyCorrectLights(value: boolean) {
        const scope = 'physicallyCorrectLights';
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, value, 'boolean');
        this.#renderingEngine.physicallyCorrectLights = value;
        this.#logger.debug(`ViewportApi.${scope}: ${scope} was set to: ${value}`);
        this.update('physicallyCorrectLights');
    }

    public get pointSize(): number {
        return this.#renderingEngine.pointSize;
    }

    public set pointSize(value: number) {
        const scope = 'pointSize';
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, value, 'number');
        this.#renderingEngine.pointSize = value;
        this.#logger.debug(`ViewportApi.${scope}: ${scope} was set to: ${value}`);
        this.update('pointSize');
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
        const scope = 'shadows';
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, value, 'boolean');
        this.#renderingEngine.shadows = value;
        this.#logger.debug(`ViewportApi.${scope}: ${scope} was set to: ${value}`);
        this.update('shadows');
    }

    public get show(): boolean {
        return this.#renderingEngine.show;
    }

    public set show(value: boolean) {
        const scope = 'show';
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, value, 'boolean');
        this.#renderingEngine.show = value;
        this.#logger.debug(`ViewportApi.${scope}: ${scope} was set to: ${value}`);
        this.update('show');
    }

    public get showStatistics(): boolean {
        return this.#renderingEngine.showStatistics;
    }

    public set showStatistics(value: boolean) {
        const scope = 'showStatistics';
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, value, 'boolean');
        this.#renderingEngine.showStatistics = value;
        this.#logger.debug(`ViewportApi.${scope}: ${scope} was set to: ${value}`);
        this.update('showStatistics');
    }

    public get textureEncoding(): TEXTURE_ENCODING {
        return this.#renderingEngine.textureEncoding;
    }

    public set textureEncoding(value: TEXTURE_ENCODING) {
        const scope = 'textureEncoding';
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, value, 'enum', true, Object.values(TEXTURE_ENCODING));
        this.#renderingEngine.textureEncoding = value;
        this.#logger.debug(`ViewportApi.${scope}: ${scope} was set to: ${value}`);
        this.update('textureEncoding');
    }

    public get threeJsCoreObjects(): {
        scene: THREE.Scene,
        renderer: THREE.WebGLRenderer,
        camera: THREE.Camera
    } {
        return {
            scene: this.#renderingEngine.sceneTreeManager.scene,
            renderer: this.#renderingEngine.renderer,
            camera: this.#renderingEngine.cameraManager.camera
        };
    }

    public get toneMapping(): TONE_MAPPING {
        return this.#renderingEngine.toneMapping;
    }

    public set toneMapping(value: TONE_MAPPING) {
        const scope = 'toneMapping';
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, value, 'enum', true, Object.values(TONE_MAPPING));
        this.#renderingEngine.toneMapping = value;
        this.#logger.debug(`ViewportApi.${scope}: ${scope} was set to: ${value}`);
        this.update('toneMapping');
    }

    public get toneMappingExposure(): number {
        return this.#renderingEngine.toneMappingExposure;
    }

    public set toneMappingExposure(value: number) {
        const scope = 'toneMappingExposure';
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, value, 'number');
        this.#renderingEngine.toneMappingExposure = value;
        this.#logger.debug(`ViewportApi.${scope}: ${scope} was set to: ${value}`);
        this.update('toneMappingExposure');
    }

    public get type(): RENDERER_TYPE {
        return this.#renderingEngine.type;
    }

    public set type(value: RENDERER_TYPE) {
        const scope = 'type';
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, value, 'enum', true, Object.values(RENDERER_TYPE));
        this.#renderingEngine.type = value;
        this.#logger.debug(`ViewportApi.${scope}: ${scope} was set to: ${value}`);
        this.update('type');
    }

    public get visualizeAttributes(): ((overview: ISDTFOverview, itemData?: ISDTFItemData) => ISDTFAttributeVisualizationData) | undefined {
        return this.#renderingEngine.visualizeAttributes;
    }

    public set visualizeAttributes(value: ((overview: ISDTFOverview, itemData?: ISDTFItemData) => ISDTFAttributeVisualizationData) | undefined) {
        const scope = 'visualizeAttributes';
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, value, 'function', false);
        this.#renderingEngine.visualizeAttributes = value;
        this.#logger.debug(`ViewportApi.${scope}: ${scope} was set to: ${value}`);
        this.update('visualizeAttributes');
    }

    // #endregion Public Accessors (69)

    // #region Public Methods (23)

    public addCanvasEventListener(listener: IDomEventListener): string {
        const scope = 'addCanvasEventListener';
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, listener, 'object');
        return this.#renderingEngine.domEventEngine.addDomEventListener(listener);
    }

    public addFlag(flag: FLAG_TYPE): string {
        const scope = 'addFlag';
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, flag, 'enum', true, Object.values(FLAG_TYPE));
        const token = this.#renderingEngine.addFlag(flag);
        return token;
    }
    
    public restrictEventListeners(allowedListeners: {
        mousewheel?: boolean,
        mousedown?: boolean,
        mousemove?: boolean,
        mouseup?: boolean,
        mouseout?: boolean,
        touchstart?: boolean,
        touchmove?: boolean,
        touchend?: boolean,
        touchcancel?: boolean,
        keydown?: boolean,
        contextmenu?: boolean,
    }) {
        this.#renderingEngine.domEventEngine.allowEventListeners(allowedListeners);
    }

    public assignCamera(id: string): boolean {
        const scope = 'assignCamera';
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, id, 'string');
        const check = this.#renderingEngine.cameraEngine.assignCamera(id);
        this.update('assignCamera');
        return check;
    }

    public assignLightScene(id: string): boolean {
        const scope = 'assignLightScene';
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, id, 'string');
        const check = this.#renderingEngine.lightEngine.assignLightScene(id);
        this.update('assignLightScene');
        return check;
    }

    public applyViewportSettings(settings: ISettingsV3_1, sections?: { ar?: boolean | undefined; scene?: boolean | undefined; camera?: boolean | undefined; light?: boolean | undefined; environment?: boolean | undefined; general?: boolean | undefined; }) {
        const scope = 'applyViewportSettings';
        this.#inputValidator.validateAndError(`SessionApi.${scope}`, settings, 'object');
        this.#inputValidator.validateAndError(`SessionApi.${scope}`, sections, 'object', false);
        return this.#creationControlCenter.applyViewportSettings(this.id, settings, sections);
    }

    public async close(): Promise<void> {
        return await this.#creationControlCenter.closeRenderingEngine(this.id);
    }

    public convert3Dto2D(p: vec3): { container: vec2; client: vec2; page: vec2; hidden: boolean; } {
        const scope = 'convert3Dto2D';
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, p, 'vec3');
        return this.#renderingEngine.convert3Dto2D(p);
    }

    public async convertToGlTF(node: ITreeNode = sceneTree.root): Promise<Blob> {
        const scope = 'convertToGlTF';
        if (!(node instanceof TreeNode))
            throw new ShapeDiverViewerValidationError(`${scope}: Input could not be validated. ${node} is not of type node.`, node, 'node');

        this.update('convertToGlTF.start');
        const result = await this.#gltfConverter.convert(node, false, this.id);
        this.update('convertToGlTF.end');
        return new Blob([result], { type: 'application/octet-stream' });
    }

    public createLightScene(properties?: { name?: string | undefined; standard?: boolean | undefined; }): ILightSceneApi {
        const scope = 'createLightScene';
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, properties, 'object', false);
        const prop = Object.assign({}, properties);
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, prop.name, 'string', false);
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, prop.standard, 'boolean', false);
        const lightScene = this.#renderingEngine.lightEngine.createLightScene(properties || {});
        this.update('createLightScene');
        return this.#lightScenes[lightScene.id];
    }

    public createOrthographicCamera(id?: string): IOrthographicCameraApi {
        const scope = 'createOrthographicCamera';
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, id, 'string', false);
        const camera = this.#renderingEngine.cameraEngine.createCamera(CAMERA_TYPE.ORTHOGRAPHIC, id);
        this.update('createOrthographicCamera');
        return <IOrthographicCameraApi>this.#cameras[camera.id];
    }

    public createPerspectiveCamera(id?: string): IPerspectiveCameraApi {
        const scope = 'createPerspectiveCamera';
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, id, 'string', false);
        const camera = this.#renderingEngine.cameraEngine.createCamera(CAMERA_TYPE.PERSPECTIVE, id);
        this.update('createPerspectiveCamera');
        return <IPerspectiveCameraApi>this.#cameras[camera.id];
    }

    public createSDTFOverview(node: ITreeNode): ISDTFOverview {
        const scope = 'createSDTFOverview';
        if (!(node instanceof TreeNode))
            throw new ShapeDiverViewerValidationError(`${scope}: Input could not be validated. ${node} is not of type node.`, node, 'node');

        this.update('createSDTFOverview');
        return this.#renderingEngine.createSDTFOverview(node);
    }

    public displayErrorMessage(message: string): void {
        const scope = 'displayErrorMessage';
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, message, 'string');
        this.#renderingEngine.displayErrorMessage(message);
        this.update('displayErrorMessage');
    }

    public getEnvironmentMapImageUrl(): string {
        return this.#renderingEngine.getEnvironmentMapImageUrl();
    }

    public getScreenshot(type?: string, quality?: number): string {
        const scope = 'getScreenshot';
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, type, 'string', false);
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, quality, 'number', false);
        this.update('getScreenshot');
        return this.#renderingEngine.getScreenshot(type, quality);
    }

    public getViewportSettings(): ISettingsV3_1 {
        return this.#creationControlCenter.getViewportSettings(this.id);

    }

    public mouseEventToRay(event: MouseEvent): { origin: vec3; direction: vec3; } {
        return this.#renderingEngine.mouseEventToRay(event);
    }

    public raytraceScene(origin: vec3, direction: vec3, root?: ITreeNode): { distance: number, node: ITreeNode, data: IGeometryData; }[] {
        const scope = 'raytraceScene';
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, origin, 'vec3');
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, direction, 'vec3');
        return this.#renderingEngine.raytraceScene(origin, direction, root);
    }

    public removeCamera(id: string): boolean {
        const scope = 'removeCamera';
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, id, 'string');
        const check = this.#renderingEngine.cameraEngine.removeCamera(id);
        this.update('removeCamera');
        return check;
    }

    public removeCanvasEventListener(token: string): boolean {
        const scope = 'removeCanvasEventListener';
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, token, 'string');
        const check = this.#renderingEngine.domEventEngine.removeDomEventListener(token);
        return check;
    }

    public removeFlag(token: string): boolean {
        const scope = 'removeFlag';
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, token, 'string');
        const check = this.#renderingEngine.removeFlag(token)
        return check;
    }

    public removeLightScene(id: string): boolean {
        const scope = 'removeLightScene';
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, id, 'string');
        const check = this.#renderingEngine.lightEngine.removeLightScene(id);
        this.update('removeLightScene');
        return check;
    }

    public render(): void {
        this.#renderingEngine.renderingManager.render();
    }

    public resetToDefaultCameras(): void {
        for (let c in this.cameras)
            this.#renderingEngine.cameraEngine.removeCamera(c);
        this.#renderingEngine.cameraEngine.createDefaultCameras();
        this.update('resetToDefaultCameras');
    }

    public resize(width: number, height: number): void {
        const scope = 'resize';
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, width, 'number');
        this.#inputValidator.validateAndError(`ViewportApi.${scope}`, height, 'number');
        this.#renderingEngine.resize(width, height);
        this.update('resize');
    }

    public touchToRay(event: Touch): { origin: vec3; direction: vec3; } {
        return this.#renderingEngine.touchToRay(event);

    }

    public touchEventToRay(event: TouchEvent): { origin: vec3; direction: vec3; } {
        return this.#renderingEngine.touchEventToRay(event);

    }

    public update(id?: string): void {
        this.#renderingEngine.update(id || 'ViewportApi');
    }

    public updateNode(node: ITreeNode): void {
        const scope = 'updateNode';
        if (!(node instanceof TreeNode))
            throw new ShapeDiverViewerValidationError(`${scope}: Input could not be validated. ${node} is not of type node.`, node, 'node');

        this.#renderingEngine.sceneTreeManager.updateNode(node, node.threeJsObject[this.id], );
    }

    public updateNodeTransformation(node: ITreeNode): void {
        const scope = 'updateNodeTransformation';
        if (!(node instanceof TreeNode))
            throw new ShapeDiverViewerValidationError(`${scope}: Input could not be validated. ${node} is not of type node.`, node, 'node');

        this.#renderingEngine.sceneTreeManager.updateNode(node, node.threeJsObject[this.id], { transformationOnly: true });
    }

    public updateEnvironmentGeometry(): void {
        this.#renderingEngine.updateEnvironmentGeometry();
    }

    public async createArSessionLink(node?: ITreeNode, qrCode: boolean = true, fallbackUrl?: string): Promise<string> {
        const scope = 'createArSessionLink';
        if (node && !(node instanceof TreeNode))
            throw new ShapeDiverViewerValidationError(`${scope}: Input could not be validated. ${node} is not of type node.`, node, 'node');

        const arSessionEngine = this.#creationControlCenter.getARSessionEngine();
        if (!arSessionEngine)
            throw new ShapeDiverViewerArError('ViewportApi.createArSessionLink: None of the sessions that are registered are capable of using the AR feature.');

        const targetNode = node || sceneTree.root;

        let scalingMatrix: mat4 = mat4.fromScaling(mat4.create(), this.arScale);

        // add scaling matrix to scene tree node
        targetNode.transformations.push({ id: 'ar_scaling', matrix: scalingMatrix })

        // create the gltf
        this.update('createArSessionLink.start');
        const blob = await this.#gltfConverter.convert(targetNode, true);

        // remove scaling the matrix
        for (let i = 0; i < targetNode.transformations.length; i++)
            if (targetNode.transformations[i].id === 'ar_scaling')
                targetNode.transformations.splice(i, 1);

        this.update('createArSessionLink.end');

        const response = await arSessionEngine.uploadGLTF(new Blob([blob], { type: 'application/octet-stream' }), ShapeDiverRequestGltfUploadQueryConversion.SCENE);

        const backends: {
            [key: string]: string
        } = {
            "sddev3": "https://sddev3.eu-central-1.shapediver.com",
            "sddev2": "https://sddev2.eu-central-1.shapediver.com",
            "sddev": "https://sddev.eu-central-1.shapediver.com",
            "sdtest": "https://sdtest.us-east-1.shapediver.com",
            "sdeuc1": "https://sdeuc1.eu-central-1.shapediver.com",
            "sdr7euc1": "https://sdr7euc1.eu-central-1.shapediver.com",
            "sduse1": "https://model-view.shapediver.com",
        }

        let backendIdentifier = Object.keys(backends).find((key: string) => backends[key] === arSessionEngine.modelViewUrl);
        if (!backendIdentifier) {
            const modelViewUrl = arSessionEngine.modelViewUrl;
            backendIdentifier = modelViewUrl.replace("https://", "").replace(".shapediver.com", "");
        }

        let fallbackQueryParameter = fallbackUrl ? `fb=${encodeURIComponent(fallbackUrl)}&` : "";

        if (!response.gltf || !response.gltf.sceneId)
            throw new ShapeDiverViewerArError('ViewportApi.createArSessionLink: There was an unexpected error with the ar scene response. Please contact us if this happens again.');

        let sceneId = response.gltf!.sceneId!;

        const link = `https://viewer.shapediver.com/v3/${build_data.build_version.replace('3.', '')}/ar.html?${fallbackQueryParameter}b=${encodeURIComponent(backendIdentifier)}&id=${encodeURIComponent(sceneId)}`;
        if (qrCode === false) {
            return link;
        } else {
            let qrCodeLink = await new Promise<string>(resolve => {
                QRCode.toDataURL(link,
                    (error: Error | null | undefined, url: string) => {
                        resolve(url)
                    }
                )
            })
            return qrCodeLink;
        }
    }


    public async viewInAR(node?: ITreeNode): Promise<void> {
        const scope = 'viewInAR';
        if (node && !(node instanceof TreeNode))
            throw new ShapeDiverViewerValidationError(`${scope}: Input could not be validated. ${node} is not of type node.`, node, 'node');

        const arSessionEngine = this.#creationControlCenter.getARSessionEngine();
        if (!arSessionEngine)
            throw new ShapeDiverViewerArError('Api.viewInAR: None of the sessions that are registered are capable of using the AR feature.');

        const targetNode = node || sceneTree.root;

        let scalingMatrix: mat4 = mat4.fromScaling(mat4.create(), this.arScale);

        // add scaling matrix to scene tree node
        targetNode.transformations.push({ id: 'ar_scaling', matrix: scalingMatrix })

        // create the gltf
        this.update('viewInAR.start');
        const blob = await this.#gltfConverter.convert(targetNode, true);

        // remove scaling the matrix
        for (let i = 0; i < targetNode.transformations.length; i++)
            if (targetNode.transformations[i].id === 'ar_scaling')
                targetNode.transformations.splice(i, 1);

        this.update('viewInAR.end');

        const response = await arSessionEngine.uploadGLTF(new Blob([blob], { type: 'application/octet-stream' }), this.#systemInfo.isIOS ? ShapeDiverRequestGltfUploadQueryConversion.USDZ : ShapeDiverRequestGltfUploadQueryConversion.NONE);
        return this.#renderingEngine.viewInAR(response.gltf!.href)
    }

    public viewableInAR(): boolean {
        return this.#renderingEngine.viewableInAR();
    }
    // #endregion Public Methods (23)
}