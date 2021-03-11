import { ICamera, ICameraEngine } from '@shapediver/viewer.rendering-engine.camera-engine';
import { Canvas } from '@shapediver/viewer.rendering-engine.canvas-engine';
import { ILightEngine } from '@shapediver/viewer.rendering-engine.light-engine';

export interface IRenderingEngine {
    // #region Properties (2)


    ambientOcclusion: boolean;
    beautyRenderDelay: number;
    blurSceneWhenBusy: boolean;
    clearAlpha: number;
    clearColor: string;
    duration: number;
    environmentMap: string;
    environmentMapAsBackground: boolean;
    environmentMapResolution: string;
    fullscreen: boolean;
    gridVisibility: boolean;
    groundPlaneReflectionThreshold: number;
    groundPlaneReflectionVisibility: boolean;
    groundPlaneVisibility: boolean;
    lightHelper: boolean;
    lightScene: string;
    pointSize: number;
    shadows: boolean;
    show: boolean;
    showSceneTransition: number;


    cameraEngine: ICameraEngine;
    lightEngine: ILightEngine;
    canvas: Canvas;

    // #endregion Properties (2)

    // #region Public Methods (1)

    /**
     * Update the current tree with the provided node.
     * 
     * @param root the root node 
     */
    updateSceneTree(): void;

    // #endregion Public Methods (1)
}