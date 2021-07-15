import { ICameraEngine } from '@shapediver/viewer.rendering-engine.camera-engine'
import { ILightEngine } from '@shapediver/viewer.rendering-engine.light-engine'
import { ICanvas } from '@shapediver/viewer.rendering-engine.canvas-engine'
import { vec3 } from 'gl-matrix'

export enum RENDERERTYPE {
    /** The standard rendering engine */
    STANDARD = 'standard',
    /** A basic version of the rendering engine */
    BASIC = 'basic'
  }

  export enum VISIBILITYMODE {
    /** The viewer shows the scene instantly */
    INSTANT = 'instant',
    /** The viewer shows the scene after the first session loading */
    SESSION = 'session',
    /** The viewer is shown once the 'show' property is set to true */
    MANUAL = 'manual'
  }
  
export interface IRenderingEngine {
    // #region Properties (2)

    ambientOcclusion: boolean;
    automaticResizing: boolean;
    beautyRenderDelay: number;
    blurSceneWhenBusy: boolean;
    clearAlpha: number;
    clearColor: string | number | vec3;
    environmentMap: string | string[];
    environmentMapAsBackground: boolean;
    environmentMapResolution: string;
    gridVisibility: boolean;
    groundPlaneVisibility: boolean;
    id: string;
    lightScene: string;
    pointSize: number;
    shadows: boolean;
    show: boolean;

    // #endregion Properties (2)

    // #region Public Methods (1)

    /**
     * Update the current tree with the provided node.
     * 
     * @param root the root node 
     */
    update(): void;
    reset(): void;
    resize(width: number, height: number): void;
    getScreenshot(type?: string, encoderOptions?: number): string;

    // #endregion Public Methods (1)
}