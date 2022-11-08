import { IRenderingEngine, TEXTURE_ENCODING, TONE_MAPPING } from "@shapediver/viewer.rendering-engine.rendering-engine";
import { vec3 } from "gl-matrix";
import { AnimationData, SDTFItemData, ISDTFOverview, ISDTFAttributeVisualizationData, IAnimationData } from "@shapediver/viewer.shared.types";
import { TreeNode } from "@shapediver/viewer.shared.node-tree";

export interface IRenderingEngineThreeJS extends IRenderingEngine {
    // #region Properties (17)

    ambientOcclusion: boolean;
    ambientOcclusionIntensity: number;
    animations: {
        [key: string]: IAnimationData
    };
    beautyRenderBlendingDuration: number;
    beautyRenderDelay: number;
    clearAlpha: number;
    clearColor: string | number | vec3;
    visualizeAttributes: ((overview: ISDTFOverview, itemData?: SDTFItemData) => ISDTFAttributeVisualizationData) | undefined;
    environmentMap: string | string[];
    environmentMapAsBackground: boolean;
    environmentMapResolution: string;
    gridColor: string | number | vec3; 
    gridVisibility: boolean;
    groundPlaneColor: string | number | vec3; 
    groundPlaneVisibility: boolean;
    groundPlaneShadowColor: string | number | vec3; 
    groundPlaneShadowVisibility: boolean;
    lights: boolean;
    lightSceneId: string;
    outputEncoding: TEXTURE_ENCODING; 
    physicallyCorrectLights: boolean;
    shadows: boolean;
    textureEncoding: TEXTURE_ENCODING; 
    toneMapping: TONE_MAPPING; 
    toneMappingExposure: number; 

    updateEnvironmentGeometry(): void;

    // #endregion Properties (17)
}