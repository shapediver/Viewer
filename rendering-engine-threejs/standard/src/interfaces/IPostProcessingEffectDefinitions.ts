import { Color } from "@shapediver/viewer.shared.types"
import { vec2 } from "gl-matrix"
import { EdgeDetectionMode, PredicationMode, SMAAPreset, BlendFunction, KernelSize, VignetteTechnique } from "postprocessing"

export enum POST_PROCESSING_EFFECT_TYPE {
    BLOOM = "bloom",
    CHROMATIC_ABERRATION = "chromatic_aberration",
    DEPTH_OF_FIELD = "depth_of_field",
    DOT_SCREEN = "dot_screen",
    FXAA = "fxaa",
    GOD_RAYS = "god_rays",
    GRID = "grid",
    HUE_SATURATION = "hue_saturation",
    NOISE = "noise",
    OUTLINE = "outline",
    PIXELATION = "pixelation",
    SMAA = "smaa",
    SSAO = "ssao",
    SCANLINE = "scanline",
    SELECTIVE_BLOOM = "selective_bloom",
    SEPIA = "sepia",
    TILT_SHIFT = "tilt_shift",
    VIGNETTE = "vignette"
}

export interface IPostProcessingEffectDefinition {
    // #region Properties (1)

    /** The type of this effect. */
    type: POST_PROCESSING_EFFECT_TYPE

    // #endregion Properties (1)
}

export interface IBloomEffectDefinition extends IPostProcessingEffectDefinition {
    // #region Properties (10)

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
    type: POST_PROCESSING_EFFECT_TYPE.BLOOM,

    // #endregion Properties (10)
}

export interface IChromaticAberrationEffectDefinition extends IPostProcessingEffectDefinition {
    // #region Properties (5)

    /** The blend function of this effect. (default: BlendFunction.NORMAL) */
    blendFunction?: BlendFunction,
    /** The modulation offset. Only applies if `radialModulation` is enabled. (default: 0.15) */
    modulationOffset?: number,
    /** The color offset. (default: [0.001, 0.0005]) */
    offset?: vec2,
    /** Whether the effect should be modulated with a radial gradient. (default: false) */
    radialModulation?: boolean,
    type: POST_PROCESSING_EFFECT_TYPE.CHROMATIC_ABERRATION

    // #endregion Properties (5)
}

export interface IDepthOfFieldEffectDefinition extends IPostProcessingEffectDefinition {
    // #region Properties (9)

    /** The blend function of this effect. (default: BlendFunction.NORMAL) */
    blendFunction?: BlendFunction,
    /** The scale of the bokeh blur. (default: 1.0) */
    bokehScale?: number,
    /** The focal length. Range is [0.0, 1.0]. (default: 0.1) */
    focalLength?: number,
    /** The normalized focus distance. Range is [0.0, 1.0]. (default: 0.0) */
    focusDistance?: number,
    /** The focus range. Range is [0.0, 1.0]. (default: 0.1) */
    focusRange?: number,
    type: POST_PROCESSING_EFFECT_TYPE.DEPTH_OF_FIELD

    // #endregion Properties (9)
}

export interface IDotScreenEffectDefinition extends IPostProcessingEffectDefinition {
    // #region Properties (4)

    /** The angle of the dot pattern. (default: 1.57) */
    angle?: number,
    /** The blend function of this effect. (default: BlendFunction.NORMAL) */
    blendFunction?: BlendFunction,
    /** The scale of the dot pattern. (default: 1.0) */
    scale?: number,
    type: POST_PROCESSING_EFFECT_TYPE.DOT_SCREEN

    // #endregion Properties (4)
}

export interface IFXAAEffectDefinition extends IPostProcessingEffectDefinition {
    // #region Properties (2)

    /** The blend function of this effect. (default: BlendFunction.SRC) */
    blendFunction?: BlendFunction,
    type: POST_PROCESSING_EFFECT_TYPE.FXAA

    // #endregion Properties (2)
}

export interface IGodRaysEffectDefinition extends IPostProcessingEffectDefinition {
    // #region Properties (13)

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
    type: POST_PROCESSING_EFFECT_TYPE.GOD_RAYS
    /** A light ray weight factor. (default: 0.4) */
    weight?: number,

    // #endregion Properties (13)
}

export interface IGridEffectDefinition extends IPostProcessingEffectDefinition {
    // #region Properties (4)

    /** The blend function of this effect. (default: BlendFunction.OVERLAY) */
    blendFunction?: BlendFunction,
    /** The line width of the grid pattern. (default: 0.0) */
    lineWidth?: number,
    /** The scale of the grid pattern. (default: 1.0) */
    scale?: number,
    type: POST_PROCESSING_EFFECT_TYPE.GRID

    // #endregion Properties (4)
}

export interface IHueSaturationEffectDefinition extends IPostProcessingEffectDefinition {
    // #region Properties (4)

    /** The blend function of this effect. (default: BlendFunction.NORMAL) */
    blendFunction?: BlendFunction,
    /** The hue in radians. (default: 0.0) */
    hue?: number,
    /** The saturation factor, ranging from -1 to 1, where 0 means no change. (default: 0.0) */
    saturation?: number,
    type: POST_PROCESSING_EFFECT_TYPE.HUE_SATURATION

    // #endregion Properties (4)
}

export interface INoiseEffectDefinition extends IPostProcessingEffectDefinition {
    // #region Properties (3)

    /** The blend function of this effect. (default: BlendFunction.SCREEN) */
    blendFunction?: BlendFunction,
    /** Whether the noise should be multiplied with the input colors prior to blending. (default: false) */
    premultiply?: boolean,
    type: POST_PROCESSING_EFFECT_TYPE.NOISE

    // #endregion Properties (3)
}

export interface IOutlineEffectDefinition extends IPostProcessingEffectDefinition {
    // #region Properties (15)

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
    type: POST_PROCESSING_EFFECT_TYPE.OUTLINE,
    /** The color of visible edges. (default: #ffffff) */
    visibleEdgeColor?: Color,
    /** Whether occluded parts of selected objects should be visible. (default: true) */
    xRay?: boolean,

    // #endregion Properties (15)
}

export interface IPixelationEffectDefinition extends IPostProcessingEffectDefinition {
    // #region Properties (2)

    /** The pixel granularity. (default: 30.0) */
    granularity?: number,
    type: POST_PROCESSING_EFFECT_TYPE.PIXELATION

    // #endregion Properties (2)
}

export interface ISMAAEffectDefinition extends IPostProcessingEffectDefinition {
    // #region Properties (4)

    /** The edge detection mode. (default: EdgeDetectionMode.COLOR) */
    edgeDetectionMode?: EdgeDetectionMode,
    /** The predication mode. (default: PredicationMode.DISABLED) */
    predicationMode?: PredicationMode,
    /** The quality preset. (default: SMAAPreset.MEDIUM) */
    preset?: SMAAPreset,
    type: POST_PROCESSING_EFFECT_TYPE.SMAA,

    // #endregion Properties (4)
}

export interface ISSAOEffectDefinition extends IPostProcessingEffectDefinition {
    // #region Properties (15)

    /** An occlusion bias. Eliminates artifacts caused by depth discontinuities. (default: 0.025) */
    bias?: number,
    /** The blend function of this effect. (default: BlendFunction.MULTIPLY) */
    blendFunction?: BlendFunction,
    /** The color of the ambient occlusion. (default: #000000) */
    color?: Color,
    /** Enables or disables depth-aware upsampling. Has no effect if WebGL 2 is not supported. (default: true) */
    depthAwareUpsampling?: boolean,
    /** Influences the smoothness of the shadows. A lower value results in higher contrast. (default: 0.01) */
    fade?: number,
    /** The intensity of the ambient occlusion. (default: 1.0) */
    intensity?: number,
    /** Determines how much the luminance of the scene influences the ambient occlusion. (default: 0.7) */
    luminanceInfluence?: number,
    /** The minimum radius scale. (default: 0.1) */
    minRadiusScale?: number,
    /** The occlusion sampling radius, expressed as a scale relative to the resolution. Range [1e-6, 1.0]. (default: 0.1825) */
    radius?: number,
    /** The amount of spiral turns in the occlusion sampling pattern. Should be a prime number. (default: 7) */
    rings?: number,
    /** The amount of samples per pixel. Should not be a multiple of the ring count. (default: 9) */
    samples?: number,
    type: POST_PROCESSING_EFFECT_TYPE.SSAO

    // #endregion Properties (15)
}

export interface IScanlineEffectDefinition extends IPostProcessingEffectDefinition {
    // #region Properties (3)

    /** The blend function of this effect. (default: BlendFunction.OVERLAY) */
    blendFunction?: BlendFunction,
    /** The scanline density. (default: 1.25) */
    density?: number,
    type: POST_PROCESSING_EFFECT_TYPE.SCANLINE,

    // #endregion Properties (3)
}

export interface ISelectiveBloomEffectDefinition extends IPostProcessingEffectDefinition {
    // #region Properties (10)

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
    type: POST_PROCESSING_EFFECT_TYPE.SELECTIVE_BLOOM,

    // #endregion Properties (10)
}

export interface ISepiaEffectDefinition extends IPostProcessingEffectDefinition {
    // #region Properties (3)

    /** The blend function of this effect. (default: BlendFunction.NORMAL) */
    blendFunction?: BlendFunction,
    /** The intensity of the effect. (default: 1.0) */
    intensity?: number,
    type: POST_PROCESSING_EFFECT_TYPE.SEPIA,

    // #endregion Properties (3)
}

export interface ITiltShiftEffectDefinition extends IPostProcessingEffectDefinition {
    // #region Properties (10)

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
    type: POST_PROCESSING_EFFECT_TYPE.TILT_SHIFT,

    // #endregion Properties (10)
}

export interface IVignetteEffectDefinition extends IPostProcessingEffectDefinition {
    // #region Properties (5)

    /** The blend function of this effect. (default: BlendFunction.NORMAL) */
    blendFunction?: BlendFunction,
    /** The Vignette darkness. (default: 0.5) */
    darkness?: number,
    /** The Vignette offset. (default: 0.5) */
    offset?: number,
    /** The Vignette technique. (default: VignetteTechnique.DEFAULT) */
    technique?: VignetteTechnique,
    type: POST_PROCESSING_EFFECT_TYPE.VIGNETTE,

    // #endregion Properties (5)
}