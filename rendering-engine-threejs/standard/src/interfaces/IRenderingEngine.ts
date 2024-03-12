import { IRenderingEngine, TEXTURE_ENCODING, TONE_MAPPING } from "@shapediver/viewer.rendering-engine.rendering-engine";
import { quat } from "gl-matrix";
import { AnimationData, SDTFItemData, ISDTFOverview, ISDTFAttributeVisualizationData, IAnimationData, Color } from "@shapediver/viewer.shared.types";
import { TreeNode } from "@shapediver/viewer.shared.node-tree";

export interface IRenderingEngineThreeJS extends IRenderingEngine {
    // #region Properties (17)

    beautyRenderBlendingDuration: number;
    beautyRenderDelay: number;
    clearAlpha: number;
    clearColor: Color;
    defaultMaterialColor: Color;
    visualizeAttributes: ((overview: ISDTFOverview, itemData?: SDTFItemData) => ISDTFAttributeVisualizationData) | undefined;
    environmentMap: string | string[];
    environmentMapAsBackground: boolean;
    environmentMapBlurriness: number;
    environmentMapIntensity: number;
    environmentMapResolution: string;
    environmentMapForUnlitMaterials: boolean;
    environmentMapRotation: quat;
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
    preRenderCallback?: ((renderer: THREE.WebGLRenderer) => void);
    postRenderCallback?: ((renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) => void);
    shadows: boolean;
    softShadows: boolean;
    textureEncoding: TEXTURE_ENCODING; 
    toneMapping: TONE_MAPPING; 
    toneMappingExposure: number; 
    automaticColorAdjustment: boolean;

    updateEnvironmentGeometry(): void;

    // #endregion Properties (17)
}