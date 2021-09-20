import { IRenderingEngine } from "@shapediver/viewer.rendering-engine.rendering-engine";
import { vec3 } from "gl-matrix";

export interface IRenderingEngineThreeJS extends IRenderingEngine {
    
    ambientOcclusion: boolean;
    ambientOcclusionIntensity: number;
    beautyRenderBlendingDuration: number;
    beautyRenderDelay: number;
    clearAlpha: number;
    clearColor: string | number | vec3;
    environmentMap: string | string[];
    environmentMapAsBackground: boolean;
    environmentMapResolution: string;
    gridVisibility: boolean;
    groundPlaneVisibility: boolean;
    lightSceneId: string;
    shadows: boolean;
    renderingSettings: { physicallyCorrectLights: boolean, envMapIntensity: number, envMapIntensityGroundPlane: number, groundPlaneColor: string, toneMapping: 0 | 1 | 2 | 3 | 4, toneMappingExposure: number, textureEncoding: 3000 | 3001 | 3002 | 3003 | 3004 | 3005 | 3006 | 3007, outputEncoding: 3000 | 3001 | 3002 | 3003 | 3004 | 3005 | 3006 | 3007, };

}