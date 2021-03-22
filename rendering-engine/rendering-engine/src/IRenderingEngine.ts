import { vec3 } from 'gl-matrix';

export enum RENDERERTYPE {
    /** The standard rendering engine */
    STANDARD = 'standard',
    /** A basic version of the rendering engine */
    BASIC = 'basic'
  }
  
export interface IRenderingEngine {
    // #region Properties (2)


    ambientOcclusion: boolean;
    beautyRenderDelay: number;
    blurSceneWhenBusy: boolean;
    clearAlpha: number;
    clearColor: vec3;
    duration: number;
    environmentMap: string | string[];
    environmentMapAsBackground: boolean;
    environmentMapResolution: string;
    fullscreen: boolean;
    gridVisibility: boolean;
    // groundPlaneReflectionThreshold: number;
    // groundPlaneReflectionVisibility: boolean;
    groundPlaneVisibility: boolean;
    id: string;
    lightHelper: boolean;
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

    // #endregion Public Methods (1)
}