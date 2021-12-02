import { vec3 } from 'gl-matrix'
import { CAMERATYPE } from '@shapediver/viewer.rendering-engine.camera-engine'

import { ICamera } from './camera/ICamera'
import { ILightScene } from './lights/ILightScene'
import { IOrthographicCamera } from './camera/IOrthographicCamera'
import { IPerspectiveCamera } from './camera/IPerspectiveCamera'
import { IRenderingEngine, TEXTUREENCODING, TONEMAPPING } from '@shapediver/viewer.rendering-engine.rendering-engine'
import { IDomEventListener } from '@shapediver/viewer.shared.services'
import { TreeNode } from '@shapediver/viewer.shared.node-tree'
import { AnimationData, SDTFAttributeVisualizationData, SDTFItemData, SDTFOverview } from '@shapediver/viewer.shared.types'

export interface IViewer extends IRenderingEngine {
    // #region Properties (29)

    readonly camera: ICamera | null;
    readonly cameras: { [key: string]: ICamera };
    readonly canvas: HTMLCanvasElement;
    readonly id: string;
    readonly lightScene: ILightScene | null;
    readonly lightScenes: { [key: string]: ILightScene };

    ambientOcclusion: boolean;
    ambientOcclusionIntensity: number;
    animations: AnimationData[];
    automaticResizing: boolean;
    beautyRenderBlendingDuration: number;
    beautyRenderDelay: number;
    blur: boolean;
    blurSceneWhenBusy: boolean;
    clearAlpha: number;
    clearColor: string | number | vec3;
    /**
     * Provide a callback that transforms a {@link SDTFItemData} to a {@link SDTFAttributeVisualizationData}.
     * The {@link SDTFOverview} provides general information like min and max values for numbers or the available options for strings.
     */
    convertSDTFItemToVisualizationData: ((itemData: SDTFItemData, overview: SDTFOverview) => SDTFAttributeVisualizationData) | undefined;
    environmentMap: string | string[];
    environmentMapAsBackground: boolean;
    environmentMapResolution: string;
    gridColor: string | number | vec3; 
    gridVisibility: boolean;
    groundPlaneColor: string | number | vec3; 
    groundPlaneVisibility: boolean;
    lightSceneId: string;
    outputEncoding: TEXTUREENCODING; 
    physicallyCorrectLights: boolean;
    pointSize: number;
    shadows: boolean;
    show: boolean;
    showStatistics: boolean;
    textureEncoding: TEXTUREENCODING; 
    toneMapping: TONEMAPPING; 
    toneMappingExposure: number;

    // #endregion Properties (29)

    // #region Public Methods (25)

    /**
     * Add a flag to freeze the camera.
     * If you want to stop this again call {@link removeCameraFreezeFlag} with the returned token.
     */
    addCameraFreezeFlag(): string;
    /**
     * Add an event listener that receives all canvas events.
     * 
     * @param listener 
     */
    addCanvasEventListener(listener: IDomEventListener): string;
    /**
     * Add a flag to continuously render the scene.
     * If you want to stop this again call {@link removeContinuousRenderingFlag} with the returned token.
     */
    addContinuousRenderingFlag(): string;
    /**
     * Add a flag to continuously update the shadow map.
     * If you want to stop this again call {@link removeShadowMapUpdateFlag} with the returned token.
     */
    addShadowMapUpdateFlag(): string;
    /**
     * Assign the camera with the specified id to the viewer.
     * 
     * @param id the id of the camera
     */
    assignCamera(id: string): void;
    /**
     * Assign the light scene with the current id to the viewer.
     * 
     * @param id the id of the light scene 
     * @returns 
     */
    assignLightScene(id: string): boolean;
    /**
     * Create a camera with the specified type.
     * An id can be provided. If not, a unique id will be created.
     * 
     * @param type the type of the camera
     * @param id the id of the camera
     * @returns 
     */
    createCamera(type: CAMERATYPE, id?: string): ICamera;
    /**
     * Create a new light scene.
     * An id can be provided. If not, a unique id will be created.
     * If the standard option is chosen, the default lights will be added from the start.
     * 
     * @param properties.id the id of the light scene
     * @param properties.standard the option to add the standard lights
     * @returns 
     */
    createLightScene(properties?: { name?: string, standard?: boolean }): ILightScene;
    /**
     * Create an orthographic camera.
     * An id can be provided. If not, a unique id will be created.
     * 
     * @param id the id of the camera
     * @returns 
     */
    createOrthographicCamera(id?: string): IOrthographicCamera;
    /**
     * Create a perspective camera.
     * An id can be provided. If not, a unique id will be created.
     * 
     * @param id the id of the camera
     * @returns 
     */
    createPerspectiveCamera(id?: string): IPerspectiveCamera;
    /**
     * Deregister the busy mode with the specified ID.
     * 
     * @param value 
     */
    deregisterBusyMode(value: string): boolean;
    /**
     * Create a screenshot for the requested type and options.
     * 
     * @param type the type as string, default is 'image/png'
     * @param quality the quality of the screenshot, default is 1
     * @returns 
     */
    getScreenshot(type?: string, quality?: number): string;
    /**
     * Register the busy mode with the specified ID.
     * @param value 
     */
    registerBusyMode(value: string): boolean;
    /**
     * Remove the camera with the specified id.
     * 
     * @param id the id of the camera
     * @returns 
     */
    removeCamera(id: string): boolean;
    /**
     * Removes the registered flag for freezing the camera.
     * 
     * @param token 
     */
    removeCameraFreezeFlag(token: string): boolean;
    /**
     * Remove an event listener that received all canvas events.
     * 
     * @param token 
     */
    removeCanvasEventListener(token: string): boolean;
    /**
     * Removes the registered flag for continuous rendering.
     * 
     * @param token 
     */
    removeContinuousRenderingFlag(token: string): boolean;
    /**
     * Remove the light scene with the specified id.
     * 
     * @param id the id of the light scene
     * @returns 
     */
    removeLightScene(id: string): boolean;
    /**
     * Removes the registered flag for continuous shadow map updates.
     * 
     * @param token 
     */
    removeShadowMapUpdateFlag(token: string): boolean;
    /**
     * Manual call to render the scene.
     */
    render(): void;
    /**
     * Reset the viewer.
     * Sets the {@link show}-value to false and waits for new settings to be registered.
     */
    reset(): void;
    /**
     * If the {@link automaticResizing} is option is set to `false`, this function resizes the Viewer.
     * @param width 
     * @param height 
     */
    resize(width: number, height: number): void;
    /**
     * Update the viewer with the current changes of the scene tree.
     */
    update(): void;
    /**
     * Update the current node and all descendants in the scene tree.
     * @param node 
     */
    updateNode(node: TreeNode): void;

    // #endregion Public Methods (25)
}