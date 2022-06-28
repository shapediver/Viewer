import { mat4, vec3 } from "gl-matrix";
import { ICameraApi, ILightSceneApi, IAnimationData, BUSY_MODE_DISPLAY, TEXTURE_ENCODING, TONE_MAPPING, ISDTFOverview, ISDTFItemData, ISDTFAttributeVisualizationData, IDomEventListener, FLAG_TYPE, IOrthographicCameraApi, IPerspectiveCameraApi, ITreeNode, sceneTree } from "../..";
import { RenderingEngine as RenderingEngineThreeJs } from "@shapediver/viewer.rendering-engine-threejs.standard";
import { IViewportApi } from "../../interfaces/viewport/IViewportApi";
import { container } from "tsyringe";
import { ICreationControlCenter, CreationControlCenter } from "@shapediver/viewer.main.creation-control-center";
import { Converter, Logger, LOGGING_TOPIC, ShapeDiverViewerArError, SystemInfo } from "@shapediver/viewer.shared.services";
import { RENDERER_TYPE, SESSION_SETTINGS_MODE } from "@shapediver/viewer.rendering-engine.rendering-engine";
import { CAMERA_TYPE, IOrthographicCamera, IPerspectiveCamera } from "@shapediver/viewer.rendering-engine.camera-engine";
import { PerspectiveCameraApi } from "./camera/PerspectiveCameraApi";
import { OrthographicCameraApi } from "./camera/OrthographicCameraApi";
import { LightSceneApi } from "./lights/LightSceneApi";
import { GLTFConverter } from "@shapediver/viewer.data-engine.gltf-converter";
import { ShapeDiverRequestGltfUploadQueryConversion } from "@shapediver/sdk.geometry-api-sdk-v2";

export class ViewportApi implements IViewportApi {
    // #region Properties (5)

    readonly #renderingEngine: RenderingEngineThreeJs;
    readonly #creationControlCenter: ICreationControlCenter = <ICreationControlCenter>container.resolve(CreationControlCenter);
    readonly #converter: Converter = <Converter>container.resolve(Converter);
    readonly #gltfConverter: GLTFConverter = <GLTFConverter>container.resolve(GLTFConverter);
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
                    if(this.#renderingEngine.cameraEngine.cameras[c].type === CAMERA_TYPE.PERSPECTIVE) {
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
        this.#renderingEngine.ambientOcclusion = value;
    }

    public get ambientOcclusionIntensity(): number {
        return this.#renderingEngine.ambientOcclusionIntensity;
    }

    public set ambientOcclusionIntensity(value: number) {
        this.#renderingEngine.ambientOcclusionIntensity = value;
    }

    public get animations(): IAnimationData[] {
        return this.#renderingEngine.animations;
    }

    public get arRotation(): vec3 {
        return this.#renderingEngine.arRotation;
    }

    public set arRotation(value: vec3) {
        this.#renderingEngine.arRotation = value;
    }

    public get arScale(): vec3 {
        return this.#renderingEngine.arScale;
    }

    public set arScale(value: vec3) {
        this.#renderingEngine.arScale = value;
    }

    public get arTranslation(): vec3 {
        return this.#renderingEngine.arTranslation;
    }

    public set arTranslation(value: vec3) {
        this.#renderingEngine.arTranslation = value;
    }

    public get automaticResizing(): boolean {
        return this.#renderingEngine.automaticResizing;
    }

    public set automaticResizing(value: boolean) {
        this.#renderingEngine.automaticResizing = value;
    }

    public get beautyRenderBlendingDuration(): number {
        return this.#renderingEngine.beautyRenderBlendingDuration;
    }

    public set beautyRenderBlendingDuration(value: number) {
        this.#renderingEngine.beautyRenderBlendingDuration = value;
    }

    public get beautyRenderDelay(): number {
        return this.#renderingEngine.beautyRenderDelay;
    }

    public set beautyRenderDelay(value: number) {
        this.#renderingEngine.beautyRenderDelay = value;
    }

    public get camera(): ICameraApi | null {
        if(!this.#renderingEngine.cameraEngine.camera) return null;
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
        this.#renderingEngine.clearAlpha = value;
    }

    public get clearColor(): string | number | vec3 {
        return this.#renderingEngine.clearColor;
    }

    public set clearColor(value: string | number | vec3) {
        this.#renderingEngine.clearColor = this.#converter.toColor(value);
    }

    public get enableAR(): boolean {
        return this.#renderingEngine.enableAR;
    }

    public set enableAR(value: boolean) {
        this.#renderingEngine.enableAR = value;
    }

    public get environmentMap(): string | string[] {
        return this.#renderingEngine.environmentMap;
    }

    public set environmentMap(value: string | string[]) {
        this.#renderingEngine.environmentMap = value;
    }

    public get environmentMapAsBackground(): boolean {
        return this.#renderingEngine.environmentMapAsBackground;
    }

    public set environmentMapAsBackground(value: boolean) {
        this.#renderingEngine.environmentMapAsBackground = value;
    }

    public get environmentMapResolution(): string {
        return this.#renderingEngine.environmentMapResolution;
    }

    public set environmentMapResolution(value: string) {
        this.#renderingEngine.environmentMapResolution = value;
    }

    public get gridColor(): string | number | vec3 {
        return this.#renderingEngine.gridColor;
    }

    public set gridColor(value: string | number | vec3) {
        this.#renderingEngine.gridColor = this.#converter.toColor(value);
    }

    public get gridVisibility(): boolean {
        return this.#renderingEngine.gridVisibility;
    }

    public set gridVisibility(value: boolean) {
        this.#renderingEngine.gridVisibility = value;
    }

    public get groundPlaneColor(): string | number | vec3 {
        return this.#renderingEngine.groundPlaneColor;
    }

    public set groundPlaneColor(value: string | number | vec3) {
        this.#renderingEngine.groundPlaneColor = this.#converter.toColor(value);
    }

    public get groundPlaneVisibility(): boolean {
        return this.#renderingEngine.groundPlaneVisibility;
    }

    public set groundPlaneVisibility(value: boolean) {
        this.#renderingEngine.groundPlaneVisibility = value;
    }

    public get id(): string {
        return this.#renderingEngine.id;
    }

    public get lightScene(): ILightSceneApi | null {
        if(!this.#renderingEngine.lightEngine.lightScene) return null;
        return this.#lightScenes[this.#renderingEngine.lightEngine.lightScene.id];
    }

    public get lightScenes(): { [key: string]: ILightSceneApi; } {
        return this.#lightScenes;
    }

    public get outputEncoding(): TEXTURE_ENCODING {
        return this.#renderingEngine.outputEncoding;
    }

    public set outputEncoding(value: TEXTURE_ENCODING) {
        this.#renderingEngine.outputEncoding = value;
    }

    public get physicallyCorrectLights(): boolean {
        return this.#renderingEngine.physicallyCorrectLights;
    }

    public set physicallyCorrectLights(value: boolean) {
        this.#renderingEngine.physicallyCorrectLights = value;
    }

    public get pointSize(): number {
        return this.#renderingEngine.pointSize;
    }

    public set pointSize(value: number) {
        this.#renderingEngine.pointSize = value;
    }

    public get sessionSettingsId(): string | undefined {
        return this.#renderingEngine.sessionSettingsId;
    }

    public set sessionSettingsId(value: string | undefined) {
        this.#renderingEngine.sessionSettingsId = value;
    }

    public get sessionSettingsMode(): SESSION_SETTINGS_MODE {
        return this.#renderingEngine.sessionSettingsMode;
    }

    public set sessionSettingsMode(value: SESSION_SETTINGS_MODE) {
        this.#renderingEngine.sessionSettingsMode = value;
    }

    public get shadows(): boolean {
        return this.#renderingEngine.shadows;
    }

    public set shadows(value: boolean) {
        this.#renderingEngine.shadows = value;
    }

    public get show(): boolean {
        return this.#renderingEngine.show;
    }

    public set show(value: boolean) {
        this.#renderingEngine.show = value;
    }

    public get showStatistics(): boolean {
        return this.#renderingEngine.showStatistics;
    }

    public set showStatistics(value: boolean) {
        this.#renderingEngine.showStatistics = value;
    }

    public get textureEncoding(): TEXTURE_ENCODING {
        return this.#renderingEngine.textureEncoding;
    }

    public set textureEncoding(value: TEXTURE_ENCODING) {
        this.#renderingEngine.textureEncoding = value;
    }

    public get toneMapping(): TONE_MAPPING {
        return this.#renderingEngine.toneMapping;
    }

    public set toneMapping(value: TONE_MAPPING) {
        this.#renderingEngine.toneMapping = value;
    }

    public get toneMappingExposure(): number {
        return this.#renderingEngine.toneMappingExposure;
    }

    public set toneMappingExposure(value: number) {
        this.#renderingEngine.toneMappingExposure = value;
    }

    public get type(): RENDERER_TYPE {
        return this.#renderingEngine.type;
    }

    public set type(value: RENDERER_TYPE) {
        this.#renderingEngine.type = value;
    }

    public get visualizeAttributes(): ((overview: ISDTFOverview, itemData?: ISDTFItemData) => ISDTFAttributeVisualizationData) | undefined {
        return this.#renderingEngine.visualizeAttributes;
    }

    public set visualizeAttributes(value: ((overview: ISDTFOverview, itemData?: ISDTFItemData) => ISDTFAttributeVisualizationData) | undefined) {
        this.#renderingEngine.visualizeAttributes = value;
    }

    // #endregion Public Accessors (69)

    // #region Public Methods (23)

    public addCanvasEventListener(listener: IDomEventListener): string {
        return this.#renderingEngine.domEventEngine.addDomEventListener(listener);
    }

    public addFlag(flag: FLAG_TYPE): string {
        return this.#renderingEngine.addFlag(flag)
    }

    public assignCamera(id: string): boolean {
        return this.#renderingEngine.cameraEngine.assignCamera(id);
    }

    public assignLightScene(id: string): boolean {
        return this.#renderingEngine.lightEngine.assignLightScene(id);
    }

    public async close(): Promise<void> {
        return await this.#creationControlCenter.closeRenderingEngine(this.id);
    }

    public async convertToGlTF(node: ITreeNode = sceneTree.root): Promise<Blob> {
        this.update();
        const result = await this.#gltfConverter.convert(node, false, this.id);
        return new Blob([result], { type: 'application/octet-stream' });
    }

    public createLightScene(properties?: { name?: string | undefined; standard?: boolean | undefined; }): ILightSceneApi {
        // TODO input sanitation 
        const lightScene = this.#renderingEngine.lightEngine.createLightScene(properties || {});
        return this.#lightScenes[lightScene.id];
    }

    public createOrthographicCamera(id?: string): IOrthographicCameraApi {
        const camera = this.#renderingEngine.cameraEngine.createCamera(CAMERA_TYPE.ORTHOGRAPHIC, id);
        return <IOrthographicCameraApi>this.#cameras[camera.id];
    }

    public createPerspectiveCamera(id?: string): IPerspectiveCameraApi {
        const camera = this.#renderingEngine.cameraEngine.createCamera(CAMERA_TYPE.PERSPECTIVE, id);
        return <IPerspectiveCameraApi>this.#cameras[camera.id];
    }

    public createSDTFOverview(node: ITreeNode): ISDTFOverview {
        return this.#renderingEngine.createSDTFOverview(node);
    }

    public displayErrorMessage(message: string): void {
        this.#renderingEngine.displayErrorMessage(message);
    }

    public getEnvironmentMapImageUrl(): string {
        return this.#renderingEngine.getEnvironmentMapImageUrl();
    }

    public getScreenshot(type?: string, quality?: number): string {
        return this.#renderingEngine.getScreenshot(type, quality);
    }

    public removeCamera(id: string): boolean {
        return this.#renderingEngine.cameraEngine.removeCamera(id);
    }

    public removeCanvasEventListener(token: string): boolean {
        return this.#renderingEngine.domEventEngine.removeDomEventListener(token);
    }

    public removeFlag(token: string): boolean {
        return this.#renderingEngine.removeFlag(token)
    }

    public removeLightScene(id: string): boolean {
        return this.#renderingEngine.lightEngine.removeLightScene(id);
    }

    public render(): void {
        this.#renderingEngine.renderingManager.render();
    }

    public resize(width: number, height: number): void {
        this.#renderingEngine.resize(width, height);
    }

    public update(): void {
        this.#renderingEngine.update('ViewportApi');
    }

    public updateNode(node: ITreeNode): void {
        this.#renderingEngine.sceneTreeManager.updateNode(node, node.transformedNodes[this.id]);
    }

    public async viewInAR(node?: ITreeNode): Promise<void> {
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
    }

    public viewableInAR(): boolean {
        return this.#renderingEngine.viewableInAR();
    }
    // #endregion Public Methods (23)
}