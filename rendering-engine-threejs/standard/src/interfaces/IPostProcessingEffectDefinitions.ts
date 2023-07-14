import { Color } from "@shapediver/viewer.shared.types"
import { vec2 } from "gl-matrix"
import { BlendFunction, KernelSize, VignetteTechnique } from "postprocessing"

export enum POST_PROCESSING_EFFECT_TYPE {
    BLOOM = "bloom",
    CHROMATIC_ABERRATION = "chromatic_aberration",
    DEPTH_OF_FIELD = "depth_of_field",
    DOT_SCREEN = "dot_screen",
    GOD_RAYS = "god_rays",
    GRID = "grid",
    HBAO = "hbao",
    HUE_SATURATION = "hue_saturation",
    NOISE = "noise",
    OUTLINE = "outline",
    PIXELATION = "pixelation",
    SSAO = "ssao",
    SCANLINE = "scanline",
    SELECTIVE_BLOOM = "selective_bloom",
    SEPIA = "sepia",
    TILT_SHIFT = "tilt_shift",
    VIGNETTE = "vignette"
}

export enum ANTI_ALIASING_TECHNIQUE {
    FXAA = "fxaa",
    NONE = "none",
    SMAA = "smaa",
    SSAA = "ssaa"
}

export interface IPostProcessingEffectDefinition {
    // #region Properties (1)

    /** The type of this effect. */
    type: POST_PROCESSING_EFFECT_TYPE,
    /** The token of the effect, is only returned by the viewer, but ignored as an input. */
    token?: string,
    properties?: any

    // #endregion Properties (1)
}

export interface IBloomEffectDefinition extends IPostProcessingEffectDefinition {
    // #region Properties (10)

    properties?: {
        /** The blend function of this effect. (default: BlendFunction.ADD) */
        blendFunction?: BlendFunction,
        /** The bloom intensity. (default: 1.0) */
        intensity?: number,
        /** The blur kernel size. (default: KernelSize.LARGE) */
        kernelSize?: KernelSize,
        /** Controls the smoothness of the luminance threshold. Range is [0, 1]. (default: 0.025) */
        luminanceSmoothing?: number,
        /** The luminance threshold. Raise this value to mask out darker elements in the scene. Range is [0, 1]. (default: 0.9) */
        luminanceThreshold?: number,
        /** Enables or disables mipmap blur. (default: false) */
        mipmapBlur?: boolean,
    }
    type: POST_PROCESSING_EFFECT_TYPE.BLOOM,

    // #endregion Properties (10)
}

export interface IChromaticAberrationEffectDefinition extends IPostProcessingEffectDefinition {
    // #region Properties (5)

    properties?: {
        /** The blend function of this effect. (default: BlendFunction.NORMAL) */
        blendFunction?: BlendFunction,
        /** The modulation offset. Only applies if `radialModulation` is enabled. (default: 0.15) */
        modulationOffset?: number,
        /** The color offset. (default: [0.001, 0.0005]) */
        offset?: vec2 | { x: number, y: number},
        /** Whether the effect should be modulated with a radial gradient. (default: false) */
        radialModulation?: boolean,
    }
    type: POST_PROCESSING_EFFECT_TYPE.CHROMATIC_ABERRATION

    // #endregion Properties (5)
}

export interface IDepthOfFieldEffectDefinition extends IPostProcessingEffectDefinition {
    // #region Properties (9)

    properties?: {
        /** The blend function of this effect. (default: BlendFunction.NORMAL) */
        blendFunction?: BlendFunction,
        /** The scale of the bokeh blur. (default: 1.0) */
        bokehScale?: number,
        /** The normalized focus distance. Range is [0.0, 1.0]. (default: 0.0) */
        focusDistance?: number,
        /** The focus range. Range is [0.0, 1.0]. (default: 0.1) */
        focusRange?: number,
    }
    type: POST_PROCESSING_EFFECT_TYPE.DEPTH_OF_FIELD

    // #endregion Properties (9)
}

export interface IDotScreenEffectDefinition extends IPostProcessingEffectDefinition {
    // #region Properties (4)

    properties?: {
        /** The angle of the dot pattern. (default: 1.57) */
        angle?: number,
        /** The blend function of this effect. (default: BlendFunction.NORMAL) */
        blendFunction?: BlendFunction,
        /** The scale of the dot pattern. (default: 1.0) */
        scale?: number,
    }
    type: POST_PROCESSING_EFFECT_TYPE.DOT_SCREEN

    // #endregion Properties (4)
}

export interface IGodRaysEffectDefinition extends IPostProcessingEffectDefinition {
    // #region Properties (13)

    properties?: {
        /** The blend function of this effect. (default: BlendFunction.SCREEN) */
        blendFunction?: BlendFunction,
        /** Whether the god rays should be blurred to reduce artifacts. (default: true) */
        blur?: boolean,
        /** An upper bound for the saturation of the overall effect. (default: 1.0) */
        clampMax?: number,
        /** An illumination decay factor. (default: 0.9) */
        decay?: number,
        /** The density of the light rays. (default: 0.96) */
        density?: number,
        /** A constant attenuation coefficient. (default: 0.6) */
        exposure?: number,
        /** The blur kernel size. Has no effect if blur is disabled. (default: KernelSize.SMALL) */
        kernelSize?: KernelSize,
        /** A light ray weight factor. (default: 0.4) */
        weight?: number,
    }
    type: POST_PROCESSING_EFFECT_TYPE.GOD_RAYS

    // #endregion Properties (13)
}

export interface IGridEffectDefinition extends IPostProcessingEffectDefinition {
    // #region Properties (4)

    properties?: {
        /** The blend function of this effect. (default: BlendFunction.MULTIPLY) */
        blendFunction?: BlendFunction,
        /** The scale of the grid pattern. (default: 1.0) */
        scale?: number,
    }
    type: POST_PROCESSING_EFFECT_TYPE.GRID

    // #endregion Properties (4)
}


export interface IHBAOEffectDefinition extends IPostProcessingEffectDefinition {
    // #region Properties (15)

    properties?: {
        /** The resolution scale of the ambient occlusion. (default: 1) */
        resolutionScale?: number,
        /** The samples that are taken per pixel to compute the ambient occlusion. (default: 8) */
        spp?: number,
        /** Controls the radius/size of the ambient occlusion in world units. (default: 2) */
        distance?: number,
        /** Controls how fast the ambient occlusion fades away with distance in world units. (default: 1) */
        distanceIntensity?: number,
        /** A purely artistic control for the intensity of the AO - runs the ao through the function pow(ao, intensity), which has the effect of darkening areas with more ambient occlusion. (default: 5) */
        intensity?: number,
        /** The color of the ambient occlusion. (default: black) */
        color?: Color,
        /** The bias that is used for the effect in world units. (default: 10) */
        bias?: number,
        /** The thickness if the ambient occlusion effect. (default: 0.5) */
        thickness?: number,

        /** The number of iterations of the denoising pass. (default: 1) */
        iterations?: number,
        /** The radius of the poisson disk. (default: 15) */
        radius?: number,
        /** The rings of the poisson disk. (default: 4) */
        rings?: number,
        /** Allows to adjust the influence of the luma difference in the denoising pass. (default: 10) */
        lumaPhi?: number,
        /** Allows to adjust the influence of the depth difference in the denoising pass. (default: 2) */
        depthPhi?: number,
        /** Allows to adjust the influence of the normal difference in the denoising pass. (default: 3.25) */
        normalPhi?: number,
        /** The samples that are used in the poisson disk. (default: 16) */
        samples?: number,
    }

    type: POST_PROCESSING_EFFECT_TYPE.HBAO

    // #endregion Properties (15)
}


export interface IHueSaturationEffectDefinition extends IPostProcessingEffectDefinition {
    // #region Properties (4)

    properties?: {
        /** The blend function of this effect. (default: BlendFunction.NORMAL) */
        blendFunction?: BlendFunction,
        /** The hue in radians. (default: 0.0) */
        hue?: number,
        /** The saturation factor, ranging from -1 to 1, where 0 means no change. (default: 0.0) */
        saturation?: number,
    }
    type: POST_PROCESSING_EFFECT_TYPE.HUE_SATURATION

    // #endregion Properties (4)
}

export interface INoiseEffectDefinition extends IPostProcessingEffectDefinition {
    // #region Properties (3)

    properties?: {
        /** The blend function of this effect. (default: BlendFunction.SCREEN) */
        blendFunction?: BlendFunction,
        /** Whether the noise should be multiplied with the input colors prior to blending. (default: false) */
        premultiply?: boolean,
    }
    type: POST_PROCESSING_EFFECT_TYPE.NOISE

    // #endregion Properties (3)
}

export interface IOutlineEffectDefinition extends IPostProcessingEffectDefinition {
    // #region Properties (15)

    properties?: {
        /** The blend function of this effect. (default: BlendFunction.SCREEN) */
        blendFunction?: BlendFunction,
        /** Whether the outline should be blurred. (default: false) */
        blur?: boolean,
        /** The edge strength. (default: 1.0) */
        edgeStrength?: number,
        /** The color of hidden edges. (default: #22090a) */
        hiddenEdgeColor?: Color,
        /** The blur kernel size. (default: KernelSize.VERY_SMALL) */
        kernelSize?: KernelSize,
        /** The number of samples used for multisample antialiasing. Requires WebGL 2. (default: 0) */
        multisampling?: number,
        /** The pulse speed. A value of zero disables the pulse effect. (default: 0.0) */
        pulseSpeed?: number,
        /** The resolution that is used for the effect. (default: 480) */
        resolution?: number,
        /** The color of visible edges. (default: #ffffff) */
        visibleEdgeColor?: Color,
        /** Whether occluded parts of selected objects should be visible. (default: true) */
        xRay?: boolean,
    },

    type: POST_PROCESSING_EFFECT_TYPE.OUTLINE,
    // #endregion Properties (15)
}

export interface IPixelationEffectDefinition extends IPostProcessingEffectDefinition {
    // #region Properties (2)

    properties?: {
        /** The pixel granularity. (default: 30.0) */
        granularity?: number,
    }
    type: POST_PROCESSING_EFFECT_TYPE.PIXELATION

    // #endregion Properties (2)
}

export interface ISSAOEffectDefinition extends IPostProcessingEffectDefinition {
    // #region Properties (15)

    properties?: {
        /** The resolution scale of the ambient occlusion. (default: 1) */
        resolutionScale?: number,
        /** The samples that are taken per pixel to compute the ambient occlusion. (default: 8) */
        spp?: number,
        /** Controls the radius/size of the ambient occlusion in world units. (default: 3) */
        distance?: number,
        /** Controls how fast the ambient occlusion fades away with distance in world units. (default: 0.5) */
        distanceIntensity?: number,
        /** A purely artistic control for the intensity of the AO - runs the ao through the function pow(ao, intensity), which has the effect of darkening areas with more ambient occlusion. (default: 10) */
        intensity?: number,
        /** The color of the ambient occlusion. (default: black) */
        color?: Color,

        /** The number of iterations of the denoising pass. (default: 1) */
        iterations?: number,
        /** The radius of the poisson disk. (default: 15) */
        radius?: number,
        /** The rings of the poisson disk. (default: 4) */
        rings?: number,
        /** Allows to adjust the influence of the luma difference in the denoising pass. (default: 10) */
        lumaPhi?: number,
        /** Allows to adjust the influence of the depth difference in the denoising pass. (default: 2) */
        depthPhi?: number,
        /** Allows to adjust the influence of the normal difference in the denoising pass. (default: 3.25) */
        normalPhi?: number,
        /** The samples that are used in the poisson disk. (default: 16) */
        samples?: number,
    },

    type: POST_PROCESSING_EFFECT_TYPE.SSAO

    // #endregion Properties (15)
}

export interface IScanlineEffectDefinition extends IPostProcessingEffectDefinition {
    // #region Properties (3)

    properties?: {
        /** The blend function of this effect. (default: BlendFunction.OVERLAY) */
        blendFunction?: BlendFunction,
        /** The scanline density. (default: 1.25) */
        density?: number,
    }
    type: POST_PROCESSING_EFFECT_TYPE.SCANLINE,

    // #endregion Properties (3)
}

export interface ISelectiveBloomEffectDefinition extends IPostProcessingEffectDefinition {
    // #region Properties (10)

    properties?: {
        /** The blend function of this effect. (default: BlendFunction.ADD) */
        blendFunction?: BlendFunction,
        /** The bloom intensity. (default: 1.0) */
        intensity?: number,
        /** The blur kernel size. (default: KernelSize.LARGE) */
        kernelSize?: KernelSize,
        /** Controls the smoothness of the luminance threshold. Range is [0, 1]. (default: 0.025) */
        luminanceSmoothing?: number,
        /** The luminance threshold. Raise this value to mask out darker elements in the scene. Range is [0, 1]. (default: 0.9) */
        luminanceThreshold?: number,
        /** Enables or disables mipmap blur. (default: false) */
        mipmapBlur?: boolean,
        /** Enables or disables if the background is evaluated for the bloom calculation. (default: true) */
        ignoreBackground?: boolean,
    }
    type: POST_PROCESSING_EFFECT_TYPE.SELECTIVE_BLOOM,

    // #endregion Properties (10)
}

export interface ISepiaEffectDefinition extends IPostProcessingEffectDefinition {
    // #region Properties (3)

    properties?: {
        /** The blend function of this effect. (default: BlendFunction.NORMAL) */
        blendFunction?: BlendFunction,
    }
    type: POST_PROCESSING_EFFECT_TYPE.SEPIA,

    // #endregion Properties (3)
}

export interface ITiltShiftEffectDefinition extends IPostProcessingEffectDefinition {
    // #region Properties (10)

    properties?: {
        /** The blend function of this effect. (default: BlendFunction.NORMAL) */
        blendFunction?: BlendFunction,
        /** The softness of the focus area edges. (default: 0.3) */
        feather?: number,
        /** The relative size of the focus area. (default: 0.4) */
        focusArea?: number,
        /** The blur kernel size. (default: KernelSize.MEDIUM) */
        kernelSize?: KernelSize,
        /** The relative offset of the focus area. (default: 0.0) */
        offset?: number,
        /** The rotation of the focus area in radians. (default: 0.0) */
        rotation?: number,
    }
    type: POST_PROCESSING_EFFECT_TYPE.TILT_SHIFT,

    // #endregion Properties (10)
}

export interface IVignetteEffectDefinition extends IPostProcessingEffectDefinition {
    // #region Properties (5)

    properties?: {
        /** The blend function of this effect. (default: BlendFunction.NORMAL) */
        blendFunction?: BlendFunction,
        /** The Vignette darkness. (default: 0.5) */
        darkness?: number,
        /** The Vignette offset. (default: 0.5) */
        offset?: number,
        /** The Vignette technique. (default: VignetteTechnique.DEFAULT) */
        technique?: VignetteTechnique,
    }
    type: POST_PROCESSING_EFFECT_TYPE.VIGNETTE,

    // #endregion Properties (5)
}

export type IPostProcessingEffectsArray = (IBloomEffectDefinition | IChromaticAberrationEffectDefinition | IDepthOfFieldEffectDefinition | IDotScreenEffectDefinition | IGridEffectDefinition | IHBAOEffectDefinition | IHueSaturationEffectDefinition | INoiseEffectDefinition | IPixelationEffectDefinition | ISSAOEffectDefinition | IScanlineEffectDefinition | ISepiaEffectDefinition | ITiltShiftEffectDefinition | IVignetteEffectDefinition)[];