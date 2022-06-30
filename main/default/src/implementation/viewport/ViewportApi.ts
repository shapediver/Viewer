import { mat4, vec3 } from "gl-matrix";
import { RenderingEngine as RenderingEngineThreeJs } from "@shapediver/viewer.rendering-engine-threejs.standard";
import { IViewportApi } from "../../interfaces/viewport/IViewportApi";
import { container } from "tsyringe";
import { ICreationControlCenter, CreationControlCenter } from "@shapediver/viewer.main.creation-control-center";
import { Converter, IDomEventListener, InputValidator, Logger, LOGGING_TOPIC, ShapeDiverBackendError, ShapeDiverViewerArError, ShapeDiverViewerError, ShapeDiverViewerValidationError, SystemInfo } from "@shapediver/viewer.shared.services";
import { FLAG_TYPE, RENDERER_TYPE, SESSION_SETTINGS_MODE, TEXTURE_ENCODING, TONE_MAPPING } from "@shapediver/viewer.rendering-engine.rendering-engine";
import { CAMERA_TYPE, IOrthographicCamera, IPerspectiveCamera } from "@shapediver/viewer.rendering-engine.camera-engine";
import { PerspectiveCameraApi } from "./camera/PerspectiveCameraApi";
import { OrthographicCameraApi } from "./camera/OrthographicCameraApi";
import { LightSceneApi } from "./lights/LightSceneApi";
import { GLTFConverter } from "@shapediver/viewer.data-engine.gltf-converter";
import { ShapeDiverRequestGltfUploadQueryConversion } from "@shapediver/sdk.geometry-api-sdk-v2";
import { ICameraApi } from "../../interfaces/viewport/camera/ICameraApi";
import { ILightSceneApi } from "../../interfaces/viewport/lights/ILightSceneApi";
import { IAnimationData, ISDTFAttributeVisualizationData, ISDTFItemData, ISDTFOverview } from "@shapediver/viewer.shared.types";
import { ITreeNode, TreeNode } from "@shapediver/viewer.shared.node-tree";
import { sceneTree } from "../../main";
import { IOrthographicCameraApi } from "../../interfaces/viewport/camera/IOrthographicCameraApi";
import { IPerspectiveCameraApi } from "../../interfaces/viewport/camera/IPerspectiveCameraApi";

export class ViewportApi implements IViewportApi {
    // #region Properties (5)

    readonly #renderingEngine: RenderingEngineThreeJs;
    readonly #creationControlCenter: ICreationControlCenter = <ICreationControlCenter>container.resolve(CreationControlCenter);
    readonly #converter: Converter = <Converter>container.resolve(Converter);
    readonly #gltfConverter: GLTFConverter = <GLTFConverter>container.resolve(GLTFConverter);
    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #systemInfo: SystemInfo = <SystemInfo>container.resolve(SystemInfo);

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
                        this.#cameras[c] = new PerspectiveCameraApi(<IPerspectiveCamera>this.#renderingEngine.cameraEngine.cameras[c]);
                    } else {
                        this.#cameras[c] = new OrthographicCameraApi(<IOrthographicCamera>this.#renderingEngine.cameraEngine.cameras[c]);
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
                    this.#lightScenes[l] = new LightSceneApi(this.#renderingEngine.lightEngine.lightScenes[l]);
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
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, value, 'boolean');
            this.#renderingEngine.ambientOcclusion = value;
            this.#logger.debug(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}: ${scope} was set to: ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, e);
        }
    }

    public get ambientOcclusionIntensity(): number {
        return this.#renderingEngine.ambientOcclusionIntensity;
    }

    public set ambientOcclusionIntensity(value: number) {
        const scope = 'ambientOcclusionIntensity';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, value, 'number');
            this.#renderingEngine.ambientOcclusionIntensity = value;
            this.#logger.debug(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}: ${scope} was set to: ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, e);
        }
    }

    public get animations(): IAnimationData[] {
        return this.#renderingEngine.animations;
    }

    public get arRotation(): vec3 {
        return this.#renderingEngine.arRotation;
    }

    public set arRotation(value: vec3) {
        const scope = 'arRotation';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, value, 'vec3');
            this.#renderingEngine.arRotation = value;
            this.#logger.debug(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}: ${scope} was set to: ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, e);
        }
    }

    public get arScale(): vec3 {
        return this.#renderingEngine.arScale;
    }

    public set arScale(value: vec3) {
        const scope = 'arScale';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, value, 'vec3');
            this.#renderingEngine.arScale = value;
            this.#logger.debug(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}: ${scope} was set to: ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, e);
        }
    }

    public get arTranslation(): vec3 {
        return this.#renderingEngine.arTranslation;
    }

    public set arTranslation(value: vec3) {
        const scope = 'arTranslation';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, value, 'vec3');
            this.#renderingEngine.arTranslation = value;
            this.#logger.debug(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}: ${scope} was set to: ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, e);
        }
    }

    public get automaticResizing(): boolean {
        return this.#renderingEngine.automaticResizing;
    }

    public set automaticResizing(value: boolean) {
        const scope = 'automaticResizing';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, value, 'boolean');
            this.#renderingEngine.automaticResizing = value;
            this.#logger.debug(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}: ${scope} was set to: ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, e);
        }
    }

    public get beautyRenderBlendingDuration(): number {
        return this.#renderingEngine.beautyRenderBlendingDuration;
    }

    public set beautyRenderBlendingDuration(value: number) {
        const scope = 'beautyRenderBlendingDuration';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, value, 'number');
            this.#renderingEngine.beautyRenderBlendingDuration = value;
            this.#logger.debug(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}: ${scope} was set to: ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, e);
        }
    }

    public get beautyRenderDelay(): number {
        return this.#renderingEngine.beautyRenderDelay;
    }

    public set beautyRenderDelay(value: number) {
        const scope = 'beautyRenderDelay';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, value, 'number');
            this.#renderingEngine.beautyRenderDelay = value;
            this.#logger.debug(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}: ${scope} was set to: ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, e);
        }
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
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, value, 'number');
            this.#renderingEngine.clearAlpha = value;
            this.#logger.debug(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}: ${scope} was set to: ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, e);
        }
    }

    public get clearColor(): string | number | vec3 {
        return this.#renderingEngine.clearColor;
    }

    public set clearColor(value: string | number | vec3) {
        const scope = 'clearColor';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, value, 'color');
            this.#renderingEngine.clearColor = this.#converter.toColor(value);
            this.#logger.debug(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}: ${scope} was set to: ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, e);
        }
    }

    public get enableAR(): boolean {
        return this.#renderingEngine.enableAR;
    }

    public set enableAR(value: boolean) {
        const scope = 'enableAR';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, value, 'boolean');
            this.#renderingEngine.enableAR = value;
            this.#logger.debug(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}: ${scope} was set to: ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, e);
        }
    }

    public get environmentMap(): string | string[] {
        return this.#renderingEngine.environmentMap;
    }

    public set environmentMap(value: string | string[]) {
        const scope = 'environmentMap';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, value, 'cubeMap');
            this.#renderingEngine.environmentMap = value;
            this.#logger.debug(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}: ${scope} was set to: ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, e);
        }
    }

    public get environmentMapAsBackground(): boolean {
        return this.#renderingEngine.environmentMapAsBackground;
    }

    public set environmentMapAsBackground(value: boolean) {
        const scope = 'environmentMapAsBackground';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, value, 'boolean');
            this.#renderingEngine.environmentMapAsBackground = value;
            this.#logger.debug(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}: ${scope} was set to: ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, e);
        }
    }

    public get environmentMapResolution(): string {
        return this.#renderingEngine.environmentMapResolution;
    }

    public set environmentMapResolution(value: string) {
        const scope = 'environmentMapResolution';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, value, 'string');
            this.#renderingEngine.environmentMapResolution = value;
            this.#logger.debug(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}: ${scope} was set to: ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, e);
        }
    }

    public get gridColor(): string | number | vec3 {
        return this.#renderingEngine.gridColor;
    }

    public set gridColor(value: string | number | vec3) {
        const scope = 'gridColor';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, value, 'color');
            this.#renderingEngine.gridColor = this.#converter.toColor(value);
            this.#logger.debug(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}: ${scope} was set to: ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, e);
        }
    }

    public get gridVisibility(): boolean {
        return this.#renderingEngine.gridVisibility;
    }

    public set gridVisibility(value: boolean) {
        const scope = 'gridVisibility';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, value, 'boolean');
            this.#renderingEngine.gridVisibility = value;
            this.#logger.debug(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}: ${scope} was set to: ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, e);
        }
    }

    public get groundPlaneColor(): string | number | vec3 {
        return this.#renderingEngine.groundPlaneColor;
    }

    public set groundPlaneColor(value: string | number | vec3) {
        const scope = 'groundPlaneColor';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, value, 'color');
            this.#renderingEngine.groundPlaneColor = this.#converter.toColor(value);
            this.#logger.debug(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}: ${scope} was set to: ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, e);
        }
    }

    public get groundPlaneVisibility(): boolean {
        return this.#renderingEngine.groundPlaneVisibility;
    }

    public set groundPlaneVisibility(value: boolean) {
        const scope = 'groundPlaneVisibility';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, value, 'boolean');
            this.#renderingEngine.groundPlaneVisibility = value;
            this.#logger.debug(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}: ${scope} was set to: ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, e);
        }
    }

    public get id(): string {
        return this.#renderingEngine.id;
    }

    public get lightScene(): ILightSceneApi | null {
        if (!this.#renderingEngine.lightEngine.lightScene) return null;
        return this.#lightScenes[this.#renderingEngine.lightEngine.lightScene.id];
    }

    public get lightScenes(): { [key: string]: ILightSceneApi; } {
        return this.#lightScenes;
    }

    public get outputEncoding(): TEXTURE_ENCODING {
        return this.#renderingEngine.outputEncoding;
    }

    public set outputEncoding(value: TEXTURE_ENCODING) {
        const scope = 'outputEncoding';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, value, 'enum', true, Object.values(TEXTURE_ENCODING));
            this.#renderingEngine.outputEncoding = value;
            this.#logger.debug(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}: ${scope} was set to: ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, e);
        }
    }

    public get physicallyCorrectLights(): boolean {
        return this.#renderingEngine.physicallyCorrectLights;
    }

    public set physicallyCorrectLights(value: boolean) {
        const scope = 'physicallyCorrectLights';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, value, 'boolean');
            this.#renderingEngine.physicallyCorrectLights = value;
            this.#logger.debug(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}: ${scope} was set to: ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, e);
        }
    }

    public get pointSize(): number {
        return this.#renderingEngine.pointSize;
    }

    public set pointSize(value: number) {
        const scope = 'pointSize';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, value, 'number');
            this.#renderingEngine.pointSize = value;
            this.#logger.debug(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}: ${scope} was set to: ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, e);
        }
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
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, value, 'boolean');
            this.#renderingEngine.shadows = value;
            this.#logger.debug(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}: ${scope} was set to: ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, e);
        }
    }

    public get show(): boolean {
        return this.#renderingEngine.show;
    }

    public set show(value: boolean) {
        const scope = 'show';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, value, 'boolean');
            this.#renderingEngine.show = value;
            this.#logger.debug(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}: ${scope} was set to: ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, e);
        }
    }

    public get showStatistics(): boolean {
        return this.#renderingEngine.showStatistics;
    }

    public set showStatistics(value: boolean) {
        const scope = 'showStatistics';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, value, 'boolean');
            this.#renderingEngine.showStatistics = value;
            this.#logger.debug(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}: ${scope} was set to: ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, e);
        }
    }

    public get textureEncoding(): TEXTURE_ENCODING {
        return this.#renderingEngine.textureEncoding;
    }

    public set textureEncoding(value: TEXTURE_ENCODING) {
        const scope = 'textureEncoding';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, value, 'enum', true, Object.values(TEXTURE_ENCODING));
            this.#renderingEngine.textureEncoding = value;
            this.#logger.debug(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}: ${scope} was set to: ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, e);
        }
    }

    public get toneMapping(): TONE_MAPPING {
        return this.#renderingEngine.toneMapping;
    }

    public set toneMapping(value: TONE_MAPPING) {
        const scope = 'toneMapping';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, value, 'enum', true, Object.values(TONE_MAPPING));
            this.#renderingEngine.toneMapping = value;
            this.#logger.debug(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}: ${scope} was set to: ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, e);
        }
    }

    public get toneMappingExposure(): number {
        return this.#renderingEngine.toneMappingExposure;
    }

    public set toneMappingExposure(value: number) {
        const scope = 'toneMappingExposure';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, value, 'number');
            this.#renderingEngine.toneMappingExposure = value;
            this.#logger.debug(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}: ${scope} was set to: ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, e);
        }
    }

    public get type(): RENDERER_TYPE {
        return this.#renderingEngine.type;
    }

    public set type(value: RENDERER_TYPE) {
        const scope = 'type';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, value, 'enum', true, Object.values(RENDERER_TYPE));
            this.#renderingEngine.type = value;
            this.#logger.debug(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}: ${scope} was set to: ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, e);
        }
    }

    public get visualizeAttributes(): ((overview: ISDTFOverview, itemData?: ISDTFItemData) => ISDTFAttributeVisualizationData) | undefined {
        return this.#renderingEngine.visualizeAttributes;
    }

    public set visualizeAttributes(value: ((overview: ISDTFOverview, itemData?: ISDTFItemData) => ISDTFAttributeVisualizationData) | undefined) {
        const scope = 'visualizeAttributes';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, value, 'function', false);
            this.#renderingEngine.visualizeAttributes = value;
            this.#logger.debug(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}: ${scope} was set to: ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, e);
        }
    }

    // #endregion Public Accessors (69)

    // #region Public Methods (23)

    public addCanvasEventListener(listener: IDomEventListener): string {
        const scope = 'addCanvasEventListener';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, listener, 'object');
            return this.#renderingEngine.domEventEngine.addDomEventListener(listener);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, e);
        }
    }

    public addFlag(flag: FLAG_TYPE): string {
        const scope = 'addFlag';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, flag, 'enum', true, Object.values(FLAG_TYPE));
            return this.#renderingEngine.addFlag(flag)
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, e);
        }
    }

    public assignCamera(id: string): boolean {
        const scope = 'assignCamera';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, id, 'string');
            return this.#renderingEngine.cameraEngine.assignCamera(id);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, e);
        }
    }

    public assignLightScene(id: string): boolean {
        const scope = 'assignLightScene';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, id, 'string');
            return this.#renderingEngine.lightEngine.assignLightScene(id);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, e);
        }
    }

    public async close(): Promise<void> {
        const scope = 'close';
        try {
            return await this.#creationControlCenter.closeRenderingEngine(this.id);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, e);
        }
    }

    public async convertToGlTF(node: ITreeNode = sceneTree.root): Promise<Blob> {
        const scope = 'convertToGlTF';
        try {
            if (!(node instanceof TreeNode)) {
                const error = new ShapeDiverViewerValidationError(`${scope}: Input could not be validated. ${node} is not of type node.`, node, 'node');
                throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, 'InputValidator.validateAndError', error, false);
            }
            this.update();
            const result = await this.#gltfConverter.convert(node, false, this.id);
            return new Blob([result], { type: 'application/octet-stream' });
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, e);
        }
    }

    public createLightScene(properties?: { name?: string | undefined; standard?: boolean | undefined; }): ILightSceneApi {
        const scope = 'createLightScene';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, properties, 'object', false);
            const prop = Object.assign({}, properties);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, prop.name, 'string', false);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, prop.standard, 'boolean', false);
            const lightScene = this.#renderingEngine.lightEngine.createLightScene(properties || {});
            return this.#lightScenes[lightScene.id];
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, e);
        }
    }

    public createOrthographicCamera(id?: string): IOrthographicCameraApi {
        const scope = 'createOrthographicCamera';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, id, 'string', false);
            const camera = this.#renderingEngine.cameraEngine.createCamera(CAMERA_TYPE.ORTHOGRAPHIC, id);
            return <IOrthographicCameraApi>this.#cameras[camera.id];
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, e);
        }
    }

    public createPerspectiveCamera(id?: string): IPerspectiveCameraApi {
        const scope = 'createPerspectiveCamera';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, id, 'string', false);
            const camera = this.#renderingEngine.cameraEngine.createCamera(CAMERA_TYPE.PERSPECTIVE, id);
            return <IPerspectiveCameraApi>this.#cameras[camera.id];
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, e);
        }
    }

    public createSDTFOverview(node: ITreeNode): ISDTFOverview {
        const scope = 'createSDTFOverview';
        try {
            if (!(node instanceof TreeNode)) {
                const error = new ShapeDiverViewerValidationError(`${scope}: Input could not be validated. ${node} is not of type node.`, node, 'node');
                throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, 'InputValidator.validateAndError', error, false);
            }
            return this.#renderingEngine.createSDTFOverview(node);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, e);
        }
    }

    public displayErrorMessage(message: string): void {
        const scope = 'displayErrorMessage';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, message, 'string');
            this.#renderingEngine.displayErrorMessage(message);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, e);
        }
    }

    public getEnvironmentMapImageUrl(): string {
        const scope = 'getEnvironmentMapImageUrl';
        try {
            return this.#renderingEngine.getEnvironmentMapImageUrl();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, e);
        }
    }

    public getScreenshot(type?: string, quality?: number): string {
        const scope = 'getScreenshot';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, type, 'string', false);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, quality, 'number', false);
            return this.#renderingEngine.getScreenshot(type, quality);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, e);
        }
    }

    public removeCamera(id: string): boolean {
        const scope = 'removeCamera';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, id, 'string');
            return this.#renderingEngine.cameraEngine.removeCamera(id);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, e);
        }
    }

    public removeCanvasEventListener(token: string): boolean {
        const scope = 'removeCanvasEventListener';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, token, 'string');
            return this.#renderingEngine.domEventEngine.removeDomEventListener(token);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, e);
        }
    }

    public removeFlag(token: string): boolean {
        const scope = 'removeFlag';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, token, 'string');
            return this.#renderingEngine.removeFlag(token)
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, e);
        }
    }

    public removeLightScene(id: string): boolean {
        const scope = 'removeLightScene';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, id, 'string');
            return this.#renderingEngine.lightEngine.removeLightScene(id);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, e);
        }
    }

    public render(): void {
        const scope = 'render';
        try {
            this.#renderingEngine.renderingManager.render();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, e);
        }
    }

    public resize(width: number, height: number): void {
        const scope = 'resize';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, width, 'number');
            this.#inputValidator.validateAndError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, height, 'number');
            this.#renderingEngine.resize(width, height);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, e);
        }
    }

    public update(): void {
        const scope = 'update';
        try {
            this.#renderingEngine.update('ViewportApi');
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, e);
        }
    }

    public updateNode(node: ITreeNode): void {
        const scope = 'updateNode';
        try {
            if (!(node instanceof TreeNode)) {
                const error = new ShapeDiverViewerValidationError(`${scope}: Input could not be validated. ${node} is not of type node.`, node, 'node');
                throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, 'InputValidator.validateAndError', error, false);
            }
            this.#renderingEngine.sceneTreeManager.updateNode(node, node.transformedNodes[this.id]);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, e);
        }
    }

    public async viewInAR(node?: ITreeNode): Promise<void> {
        const scope = 'viewInAR';
        try {
            if (!(node instanceof TreeNode)) {
                const error = new ShapeDiverViewerValidationError(`${scope}: Input could not be validated. ${node} is not of type node.`, node, 'node');
                throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, 'InputValidator.validateAndError', error, false);
            }
            const arSessionEngine = this.#creationControlCenter.getARSessionEngine();
            if (!arSessionEngine) {
                const error = new ShapeDiverViewerArError('Api.viewInAR: None of the sessions that are registered are capable of using the AR feature.');
                throw this.#logger.handleError(LOGGING_TOPIC.AR, 'Api.viewInAR', error, false);
            }
            const targetNode = node || sceneTree.root;

            let scalingMatrix: mat4 = mat4.fromScaling(mat4.create(), this.arScale);

            // add scaling matrix to scene tree node
            targetNode.transformations.push({ id: 'ar_scaling', matrix: scalingMatrix })

            // create the gltf
            this.update();
            const blob = await this.#gltfConverter.convert(targetNode, true);

            // remove scaling the matrix
            for (let i = 0; i < targetNode.transformations.length; i++)
                if (targetNode.transformations[i].id === 'ar_scaling')
                    targetNode.transformations.splice(i, 1);

            this.update();

            const file = await arSessionEngine.uploadGLTF(new Blob([blob], { type: 'application/octet-stream' }), this.#systemInfo.isIOS ? ShapeDiverRequestGltfUploadQueryConversion.USDZ : ShapeDiverRequestGltfUploadQueryConversion.NONE);
            return this.#renderingEngine.viewInAR(file)
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, e);
        }
    }

    public viewableInAR(): boolean {
        const scope = 'viewableInAR';
        try {
            return this.#renderingEngine.viewableInAR();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.VIEWER, `ViewportApi.${scope}`, e);
        }
    }
    // #endregion Public Methods (23)
}