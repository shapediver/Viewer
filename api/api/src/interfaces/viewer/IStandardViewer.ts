import { vec3 } from "gl-matrix";
import { AnimationData } from "@shapediver/viewer.shared.types";
import { IViewer } from "./IViewer";

export interface IStandardViewer extends IViewer {
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
    environmentMap: string | string[];
    environmentMapAsBackground: boolean;
    environmentMapResolution: string;
    gridVisibility: boolean;
    groundPlaneVisibility: boolean;
    lightSceneId: string;
    pointSize: number;
    renderingSettings: { physicallyCorrectLights: boolean, envMapIntensity: number, envMapIntensityGroundPlane: number, groundPlaneColor: string, toneMapping: 0 | 1 | 2 | 3 | 4, toneMappingExposure: number, textureEncoding: 3000 | 3001 | 3002 | 3003 | 3004 | 3005 | 3006 | 3007, outputEncoding: 3000 | 3001 | 3002 | 3003 | 3004 | 3005 | 3006 | 3007, };
    shadows: boolean;
    show: boolean;
    showStatistics: boolean;
}
