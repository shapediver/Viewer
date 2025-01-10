import { ISettings as ISettingsV3 } from "../v3/ISettings";

export interface ISettings extends ISettingsV3 {
    environmentGeometry: {
        gridColor: string, 
        gridVisibility: boolean,
        groundPlaneColor: string, 
        groundPlaneVisibility: boolean,
    },
    rendering: {
        ambientOcclusion: boolean,
        ambientOcclusionIntensity: number,
        beautyRenderDelay: number,
        beautyRenderBlendingDuration: number,
        outputEncoding: string, 
        physicallyCorrectLights: boolean,
        shadows: boolean,
        textureEncoding: string, 
        toneMapping: string, 
        toneMappingExposure: number,
    }
}