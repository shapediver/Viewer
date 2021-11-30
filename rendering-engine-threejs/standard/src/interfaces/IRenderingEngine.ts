import { IRenderingEngine } from "@shapediver/viewer.rendering-engine.rendering-engine";
import { vec3 } from "gl-matrix";
import { AnimationData, SDTFAttributeVisualizationData, SDTFItemData, SDTFOverview } from "@shapediver/viewer.shared.types";
import { TreeNode } from "@shapediver/viewer.shared.node-tree";

export interface IRenderingEngineThreeJS extends IRenderingEngine {
    // #region Properties (17)

    ambientOcclusion: boolean;
    ambientOcclusionIntensity: number;
    animations: AnimationData[];
    beautyRenderBlendingDuration: number;
    beautyRenderDelay: number;
    clearAlpha: number;
    clearColor: string | number | vec3;
    convertSDTFItemToVisualizationData: ((itemData: SDTFItemData, overview: SDTFOverview) => SDTFAttributeVisualizationData) | undefined;
    environmentMap: string | string[];
    environmentMapAsBackground: boolean;
    environmentMapResolution: string;
    gridVisibility: boolean;
    groundPlaneVisibility: boolean;
    lightSceneId: string;
    renderingSettings: { physicallyCorrectLights: boolean, envMapIntensity: number, envMapIntensityGroundPlane: number, groundPlaneColor: string, toneMapping: 0 | 1 | 2 | 3 | 4, toneMappingExposure: number, textureEncoding: 3000 | 3001 | 3002 | 3003 | 3004 | 3005 | 3006 | 3007, outputEncoding: 3000 | 3001 | 3002 | 3003 | 3004 | 3005 | 3006 | 3007, };
    shadows: boolean;

    // #endregion Properties (17)
}