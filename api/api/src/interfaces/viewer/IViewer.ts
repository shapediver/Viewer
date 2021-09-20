import { vec3 } from 'gl-matrix'
import { CAMERATYPE } from '@shapediver/viewer.rendering-engine.camera-engine'

import { ICamera } from './camera/ICamera'
import { ILightScene } from './lights/ILightScene'
import { IOrthographicCamera } from './camera/IOrthographicCamera'
import { IPerspectiveCamera } from './camera/IPerspectiveCamera'
import { IRenderingEngine } from '@shapediver/viewer.rendering-engine.rendering-engine'

export interface IViewer extends IRenderingEngine {
    // #region Properties (24)

    readonly camera: ICamera | null;
    readonly cameras: { [key: string]: ICamera };
    readonly id: string;
    readonly lightScene: ILightScene | null;
    readonly lightScenes: { [key: string]: ILightScene };

    // #endregion Properties (24)

    // #region Public Methods (14)

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
     * Remove the light scene with the specified id.
     * 
     * @param id the id of the light scene
     * @returns 
     */
    removeLightScene(id: string): boolean;

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

    // #endregion Public Methods (14)
}