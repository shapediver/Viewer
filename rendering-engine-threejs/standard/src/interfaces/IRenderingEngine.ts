import { IRenderingEngine, TEXTURE_ENCODING, TONE_MAPPING } from "@shapediver/viewer.rendering-engine.rendering-engine";
import { vec3 } from "gl-matrix";
import { AnimationData, SDTFItemData, ISDTFOverview, ISDTFAttributeVisualizationData, IAnimationData, Color } from "@shapediver/viewer.shared.types";
import { TreeNode } from "@shapediver/viewer.shared.node-tree";

export interface IRenderingEngineThreeJS extends IRenderingEngine {
    // #region Properties (17)

    ambientOcclusion: boolean;
    ambientOcclusionIntensity: number;
    beautyRenderBlendingDuration: number;
    beautyRenderDelay: number;
    clearAlpha: number;
    clearColor: Color;
    visualizeAttributes: ((overview: ISDTFOverview, itemData?: SDTFItemData) => ISDTFAttributeVisualizationData) | undefined;
    environmentMap: string | string[];
    environmentMapAsBackground: boolean;
    environmentMapResolution: string;
    environmentMapForUnlitMaterials: boolean;
    gridColor: Color; 
    gridVisibility: boolean;
    groundPlaneColor: Color; 
    groundPlaneVisibility: boolean;
    groundPlaneShadowColor: Color; 
    groundPlaneShadowVisibility: boolean;
    lights: boolean;
    lightSceneId: string;
    maximumRenderingSize: {
        width: number,
        height: number
    }
    outputEncoding: TEXTURE_ENCODING; 
    physicallyCorrectLights: boolean;
    shadows: boolean;
    textureEncoding: TEXTURE_ENCODING; 
    toneMapping: TONE_MAPPING; 
    toneMappingExposure: number; 
    automaticColorAdjustment: boolean;

    updateEnvironmentGeometry(): void;

    // #endregion Properties (17)
}