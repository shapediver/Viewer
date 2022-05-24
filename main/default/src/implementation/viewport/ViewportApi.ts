import { vec3 } from "gl-matrix";
import { ICameraApi, ILightSceneApi, IAnimationData, BUSY_MODE_DISPLAY, TEXTURE_ENCODING, TONE_MAPPING, ISDTFOverview, ISDTFItemData, ISDTFAttributeVisualizationData, IDomEventListener, FLAG_TYPE, IOrthographicCameraApi, IPerspectiveCameraApi, ITreeNode } from "../..";
import { RenderingEngine as RenderingEngineThreeJs } from "@shapediver/viewer.rendering-engine-threejs.standard";
import { IViewportApi } from "../../interfaces/viewport/IViewportApi";
import { container } from "tsyringe";
import { ICreationControlCenter, CreationControlCenter } from "@shapediver/viewer.main.creation-control-center";

export class ViewportApi implements IViewportApi {
    // #region Properties (2)

    readonly #renderingEngine: RenderingEngineThreeJs;
    readonly #creationControlCenter: ICreationControlCenter = <ICreationControlCenter>container.resolve(CreationControlCenter);

    // #endregion Properties (2)

    // #region Constructors (1)

    constructor(renderingEngine: RenderingEngineThreeJs) {
        this.#renderingEngine = renderingEngine;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (66)

    public get visualizeAttributes(): ((overview: ISDTFOverview, itemData?: ISDTFItemData | undefined) => ISDTFAttributeVisualizationData) {
        throw new Error('Missing impl')
        //return this.#renderingEngine.visualizeAttributes;
    }

    public set visualizeAttributes(value: ((overview: ISDTFOverview, itemData?: ISDTFItemData | undefined) => ISDTFAttributeVisualizationData)) {
        this.#renderingEngine.visualizeAttributes = value;
    }

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

    public set animations(value: IAnimationData[]) {
        //this.#renderingEngine.animations = value;
    }

    public get arScale(): vec3 {
        throw new Error('Missing impl')
        //return this.#renderingEngine.arScale;
    }

    public set arScale(value: vec3) {
        //this.#renderingEngine.arScale = value;
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

    public get busyModeDisplay(): BUSY_MODE_DISPLAY {
        throw new Error('Missing impl')
        //return this.#renderingEngine.busyModeDisplay;
    }

    public set busyModeDisplay(value: BUSY_MODE_DISPLAY) {
        //this.#renderingEngine.busyModeDisplay = value;
    }

    public get camera(): ICameraApi | null {
        throw new Error('Missing impl')
        //return this.#renderingEngine.camera;
    }

    public set camera(value: ICameraApi | null) {
        //this.#renderingEngine.camera = value;
    }

    public get cameras(): { [key: string]: ICameraApi; } {
        throw new Error('Missing impl')
        //return this.#renderingEngine.cameras;
    }

    public set cameras(value: { [key: string]: ICameraApi; }) {
        //this.#renderingEngine.cameras = value;
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
        //this.#renderingEngine.clearColor = value;
    }

    public get enableAR(): boolean {
        throw new Error('Missing impl')
        //return this.#renderingEngine.enableAR;
    }

    public set enableAR(value: boolean) {
        //this.#renderingEngine.enableAR = value;
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
        //this.#renderingEngine.gridColor = value;
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
        //this.#renderingEngine.groundPlaneColor = value;
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
        throw new Error('Missing impl')
        //return this.#renderingEngine.lightScene;
    }

    public set lightScene(value: ILightSceneApi | null) {
        //this.#renderingEngine.lightScene = value;
    }

    public get lightScenes(): { [key: string]: ILightSceneApi; } {
        throw new Error('Missing impl')
        //return this.#renderingEngine.lightScenes;
    }

    public set lightScenes(value: { [key: string]: ILightSceneApi; }) {
        //this.#renderingEngine.lightScenes = value;
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

    public get sessionSettingsId(): string {
        throw new Error('Missing impl')
        //return this.#renderingEngine.sessionSettingsId;
    }

    public set sessionSettingsId(value: string) {
        //this.#renderingEngine.sessionSettingsId = value;
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

    // #endregion Public Accessors (66)

    // #region Public Methods (25)

    public addCanvasEventListener(listener: IDomEventListener): string {
        throw new Error("Method not implemented.");
    }

    public addFlag(flag: FLAG_TYPE): string {
        throw new Error("Method not implemented.");
    }

    public assignCamera(id: string): void {
        throw new Error("Method not implemented.");
    }

    public assignLightScene(id: string): boolean {
        throw new Error("Method not implemented.");
    }

    public async close(): Promise<void> {
        await this.#creationControlCenter.closeRenderingEngine(this.id);
    }

    public createLightScene(properties?: { name?: string | undefined; standard?: boolean | undefined; }): ILightSceneApi {
        throw new Error("Method not implemented.");
    }

    public createOrthographicCamera(id?: string): IOrthographicCameraApi {
        throw new Error("Method not implemented.");
    }

    public createPerspectiveCamera(id?: string): IPerspectiveCameraApi {
        throw new Error("Method not implemented.");
    }

    public createSDTFOverview(node: ITreeNode): ISDTFOverview {
        throw new Error("Method not implemented.");
    }

    public deregisterBusyMode(value: string): boolean {
        throw new Error("Method not implemented.");
    }

    public displayErrorMessage(message: string): void {
        throw new Error("Method not implemented.");
    }

    public getEnvironmentMapImageUrl(): string {
        throw new Error("Method not implemented.");
    }

    public getScreenshot(type?: string, quality?: number): string {
        throw new Error("Method not implemented.");
    }

    public registerBusyMode(value: string): boolean {
        throw new Error("Method not implemented.");
    }

    public removeCamera(id: string): boolean {
        throw new Error("Method not implemented.");
    }

    public removeCanvasEventListener(token: string): boolean {
        throw new Error("Method not implemented.");
    }

    public removeFlag(token: string): boolean {
        throw new Error("Method not implemented.");
    }

    public removeLightScene(id: string): boolean {
        throw new Error("Method not implemented.");
    }

    public render(): void {
        throw new Error("Method not implemented.");
    }
    
    public resize(width: number, height: number): void {
        throw new Error("Method not implemented.");
    }

    public update(): void {
        throw new Error("Method not implemented.");
    }

    public updateNode(node: ITreeNode): void {
        throw new Error("Method not implemented.");
    }

    public viewInAR(options?: { arScale?: "auto" | "fixed" | undefined; arPlacement?: "floor" | "wall" | undefined; xrEnvironment?: boolean | undefined; }): Promise<void> {
        throw new Error("Method not implemented.");
    }

    public viewableInAR(): boolean {
        throw new Error("Method not implemented.");
    }

    // #endregion Public Methods (25)
}