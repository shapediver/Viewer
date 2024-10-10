import {
    addListener,
    generalOptions,
    IGeneralOptions,
    removeListener,
    sceneTree,
    version
} from '@shapediver/viewer.api.general';
import {
    AnimationData,
    AttributeData,
    CustomData,
    EventResponseMapping,
    GeometryData,
    HTMLElementAnchorCustomData,
    HTMLElementAnchorData,
    HTMLElementAnchorImageData,
    HTMLElementAnchorTextData,
    IAnchorDataImage,
    IAnchorDataText,
    IAnimationData,
    IAnimationTrack,
    IAttributeData,
    ICameraEvent,
    ICustomData,
    IGeometryData,
    IHTMLElementAnchorData,
    IMapData,
    IMapDataProperties,
    IMapDataPropertiesDefinition,
    IMaterialAbstractData,
    IMaterialAbstractDataProperties,
    IMaterialAbstractDataPropertiesDefinition,
    IMaterialBasicLineData,
    IMaterialBasicLineDataProperties,
    IMaterialBasicLineDataPropertiesDefinition,
    IMaterialGemData,
    IMaterialGemDataProperties,
    IMaterialGemDataPropertiesDefinition,
    IMaterialMultiPointData,
    IMaterialMultiPointDataProperties,
    IMaterialMultiPointDataPropertiesDefinition,
    IMaterialPointData,
    IMaterialPointDataProperties,
    IMaterialPointDataPropertiesDefinition,
    IMaterialShadowData,
    IMaterialShadowDataProperties,
    IMaterialShadowDataPropertiesDefinition,
    IMaterialSpecularGlossinessData,
    IMaterialSpecularGlossinessDataProperties,
    IMaterialSpecularGlossinessDataPropertiesDefinition,
    IMaterialStandardData,
    IMaterialStandardDataProperties,
    IMaterialStandardDataPropertiesDefinition,
    IMaterialUnlitData,
    IMaterialUnlitDataProperties,
    IMaterialUnlitDataPropertiesDefinition,
    IMaterialVariantsData,
    IOutputEvent,
    IParameterEvent,
    IPrimitiveData,
    IRenderingEvent,
    ISceneEvent,
    ISDTFAttributeData,
    ISDTFAttributesData,
    ISDTFAttributeVisualizationData,
    ISDTFItemData,
    ISDTFOverview,
    ISDTFOverviewData,
    ISessionEvent,
    ISessionSettingsSections,
    ISettingsSections,
    ITaskEvent,
    IViewportEvent,
    IViewportSettingsSections,
    MapData,
    MATERIAL_ALPHA,
    MATERIAL_SHADING,
    MATERIAL_SIDE,
    MATERIAL_TYPE,
    MaterialBasicLineData,
    MaterialGemData,
    MaterialMultiPointData,
    MaterialPointData,
    MaterialShadowData,
    MaterialSpecularGlossinessData,
    MaterialStandardData,
    MaterialUnlitData,
    MaterialVariantsData,
    PARAMETER_TYPE,
    PARAMETER_VISUALIZATION,
    PRIMITIVE_MODE,
    PrimitiveData,
    SDTF_TYPEHINT,
    SDTFAttributeData,
    SDTFAttributesData,
    SDTFItemData,
    SDTFOverviewData,
    SdtfPrimitiveTypeGuard,
    TASK_TYPE,
    TEXTURE_FILTERING,
    TEXTURE_WRAPPING
} from '@shapediver/viewer.shared.types';
import {
    ANTI_ALIASING_TECHNIQUE,
    BlendFunction,
    BloomEffect,
    ChromaticAberrationEffect,
    DepthOfFieldEffect,
    DotScreenEffect,
    Effect,
    EffectComposer,
    ENVIRONMENT_MAP,
    ENVIRONMENT_MAP_CUBE,
    ENVIRONMENT_MAP_EMPTY,
    GodRaysEffect,
    GridEffect,
    HueSaturationEffect,
    IBloomEffectDefinition,
    IChromaticAberrationEffectDefinition,
    IDepthOfFieldEffectDefinition,
    IDotScreenEffectDefinition,
    IGodRaysEffectDefinition,
    IGridEffectDefinition,
    IHBAOEffectDefinition,
    IHueSaturationEffectDefinition,
    INoiseEffectDefinition,
    IOutlineEffectDefinition,
    IPixelationEffectDefinition,
    IPostProcessingEffectDefinition,
    IScanlineEffectDefinition,
    ISelectiveBloomEffectDefinition,
    ISepiaEffectDefinition,
    ISSAOEffectDefinition,
    IThreejsData,
    ITiltShiftEffectDefinition,
    IVignetteEffectDefinition,
    KernelSize,
    NoiseEffect,
    OutlineEffect,
    PixelationEffect,
    POST_PROCESSING_EFFECT_TYPE,
    Resolution,
    ScanlineEffect,
    SelectiveBloomEffect,
    SepiaEffect,
    SSAOEffect,
    ThreejsData,
    TiltShiftEffect,
    VignetteEffect,
    VignetteTechnique
} from '@shapediver/viewer.rendering-engine.rendering-engine-threejs';
import {
    Box,
    IBox,
    IGeometry,
    ISphere,
    Sphere
} from '@shapediver/viewer.shared.math';
import {
    BUSY_MODE_DISPLAY,
    FLAG_TYPE,
    RENDERER_TYPE,
    SPINNER_POSITIONING,
    TEXTURE_ENCODING,
    TONE_MAPPING,
    VISIBILITY_MODE
} from '@shapediver/viewer.rendering-engine.rendering-engine';
import { CAMERA_TYPE, ICameraOptions, ORTHOGRAPHIC_CAMERA_DIRECTION } from '@shapediver/viewer.rendering-engine.camera-engine';
import { createViewport, viewports } from './main';
import { DataEngine } from '@shapediver/viewer.data-engine.data-engine';
import {
    EVENTTYPE,
    EVENTTYPE_CAMERA,
    EVENTTYPE_DRAWING_TOOLS,
    EVENTTYPE_GUMBALL,
    EVENTTYPE_INTERACTION,
    EVENTTYPE_OUTPUT,
    EVENTTYPE_PARAMETER,
    EVENTTYPE_RENDERING,
    EVENTTYPE_SCENE,
    EVENTTYPE_SESSION,
    EVENTTYPE_TASK,
    EVENTTYPE_VIEWPORT,
    IDomEventListener,
    IEvent,
    isARError,
    isValid,
    isViewerCameraError,
    isViewerDataProcessingError,
    isViewerDrawingToolsError,
    isViewerEnvironmentMapError,
    isViewerError,
    isViewerGeometryBackendError,
    isViewerGeometryBackendGenericError,
    isViewerGeometryBackendRequestError,
    isViewerGeometryBackendResponseError,
    isViewerInteractionError,
    isViewerLightError,
    isViewerSessionError,
    isViewerSettingsError,
    isViewerUnknownError,
    isViewerValidationError,
    isViewerViewportError,
    isViewerWebGLError,
    LOGGING_LEVEL,
    MainEventTypes,
    SESSION_SETTINGS_MODE,
    ShapeDiverGeometryBackendError,
    ShapeDiverGeometryBackendRequestError,
    ShapeDiverGeometryBackendResponseError,
    ShapeDiverGeometryBackendResponseErrorType,
    ShapeDiverViewerArError,
    ShapeDiverViewerCameraError,
    ShapeDiverViewerDataProcessingError,
    ShapeDiverViewerDrawingToolsError,
    ShapeDiverViewerEnvironmentMapError,
    ShapeDiverViewerError,
    ShapeDiverViewerErrorType,
    ShapeDiverViewerInteractionError,
    ShapeDiverViewerLightError,
    ShapeDiverViewerSessionError,
    ShapeDiverViewerSettingsError,
    ShapeDiverViewerUnknownError,
    ShapeDiverViewerValidationError,
    ShapeDiverViewerViewportError,
    ShapeDiverViewerWebGLError,
    stringify
} from '@shapediver/viewer.shared.services';
import { GeometryEngine } from '@shapediver/viewer.data-engine.geometry-engine';
import { IAmbientLightApi } from './interfaces/lights/types/IAmbientLightApi';
import {
    IAnchor,
    IMaterialContentData,
    IMaterialContentDataV1,
    IMaterialContentDataV2,
    IMaterialContentDataV3,
    ITag2D,
    ITag3D,
    ITexture,
    TAG3D_JUSTIFICATION
} from '@shapediver/viewer.data-engine.shared-types';
import { ICameraApi } from './interfaces/camera/ICameraApi';
import { IDirectionalLightApi } from './interfaces/lights/types/IDirectionalLightApi';
import { IHemisphereLightApi } from './interfaces/lights/types/IHemisphereLightApi';
import { ILightApi } from './interfaces/lights/ILightApi';
import { ILightSceneApi } from './interfaces/lights/ILightSceneApi';
import { IOrthographicCameraApi } from './interfaces/camera/IOrthographicCameraApi';
import { IPerspectiveCameraApi } from './interfaces/camera/IPerspectiveCameraApi';
import { IPointLightApi } from './interfaces/lights/types/IPointLightApi';
import { ISpotLightApi } from './interfaces/lights/types/ISpotLightApi';
import {
    ITransformation,
    ITree,
    ITreeNode,
    ITreeNodeData,
    Tree,
    TreeNode
} from '@shapediver/viewer.shared.node-tree';
import { IViewportApi } from './interfaces/IViewportApi';
import { LIGHT_TYPE } from '@shapediver/viewer.rendering-engine.light-engine';
import { MaterialEngine } from '@shapediver/viewer.data-engine.material-engine';
import { ViewportCreationDefinition } from '@shapediver/viewer.creation-control-center.viewport';
import {
    ShapeDiverResponseExportDefinitionType as EXPORT_TYPE,
    ShapeDiverResponseOutput,
    ShapeDiverResponseOutputChunk as ShapeDiverResponseOutputChunkBackend,
    ShapeDiverResponseOutputContent as ShapeDiverResponseOutputContentBackend,
    ShapeDiverResponseExport,
    ShapeDiverResponseExportContent,
    ShapeDiverResponseExportDefinitionGroup,
    ShapeDiverResponseExportResult,
    ShapeDiverResponseModelComputationStatus,
    ShapeDiverResponseParameter,
} from '@shapediver/sdk.geometry-api-sdk-v2';

export { ICameraApi, IOrthographicCameraApi, IPerspectiveCameraApi, IAmbientLightApi, IDirectionalLightApi, IHemisphereLightApi, IPointLightApi, ISpotLightApi, ILightApi, ILightSceneApi, IViewportApi };

export { createViewport, viewports };

export { addListener, removeListener, sceneTree, generalOptions, version, IGeneralOptions };

export { ViewportCreationDefinition };
export { ITree, Tree, ITreeNode, TreeNode, ITreeNodeData };
export { FLAG_TYPE, PARAMETER_TYPE, EXPORT_TYPE, PARAMETER_VISUALIZATION, TAG3D_JUSTIFICATION, CAMERA_TYPE, LIGHT_TYPE, RENDERER_TYPE, VISIBILITY_MODE, ORTHOGRAPHIC_CAMERA_DIRECTION, TEXTURE_ENCODING, TONE_MAPPING, ENVIRONMENT_MAP, ENVIRONMENT_MAP_CUBE, ENVIRONMENT_MAP_EMPTY, LOGGING_LEVEL, PRIMITIVE_MODE, MATERIAL_SIDE, MATERIAL_ALPHA, MATERIAL_SHADING, MATERIAL_TYPE, TEXTURE_WRAPPING, TEXTURE_FILTERING, SDTF_TYPEHINT, BUSY_MODE_DISPLAY, SESSION_SETTINGS_MODE, SPINNER_POSITIONING };
export { TASK_TYPE, MainEventTypes, EVENTTYPE, EVENTTYPE_CAMERA, EVENTTYPE_OUTPUT, EVENTTYPE_PARAMETER, EVENTTYPE_RENDERING, EVENTTYPE_SCENE, EVENTTYPE_SESSION, EVENTTYPE_VIEWPORT, EVENTTYPE_INTERACTION, EVENTTYPE_GUMBALL, EVENTTYPE_DRAWING_TOOLS, EVENTTYPE_TASK };
export { IBox, Box, ISphere, Sphere, IGeometry, ITransformation, ShapeDiverResponseOutput, ShapeDiverResponseOutputContentBackend, ShapeDiverResponseOutputChunkBackend, IDomEventListener, IEvent, IThreejsData, ThreejsData };
export { ShapeDiverResponseExport, ShapeDiverResponseExportContent, ShapeDiverResponseExportResult, ShapeDiverResponseModelComputationStatus, ShapeDiverResponseExportDefinitionGroup, ShapeDiverResponseParameter };

export { EventResponseMapping, IViewportEvent, ISessionEvent, IOutputEvent, ICameraEvent, ISceneEvent, ITaskEvent, IRenderingEvent, IParameterEvent, ISettingsSections, IViewportSettingsSections, ISessionSettingsSections };
export { IMaterialStandardData, MaterialStandardData, IMaterialStandardDataProperties, IMaterialStandardDataPropertiesDefinition, IMaterialAbstractData, IMaterialAbstractDataProperties, IMaterialAbstractDataPropertiesDefinition, IMaterialUnlitData, MaterialUnlitData, IMaterialUnlitDataProperties, IMaterialUnlitDataPropertiesDefinition, IMaterialShadowData, MaterialShadowData, IMaterialShadowDataProperties, IMaterialShadowDataPropertiesDefinition, IMaterialSpecularGlossinessData, MaterialSpecularGlossinessData, IMaterialSpecularGlossinessDataProperties, IMaterialSpecularGlossinessDataPropertiesDefinition, IMaterialGemData, MaterialGemData, IMaterialGemDataProperties, IMaterialGemDataPropertiesDefinition, IMaterialPointData, MaterialPointData, IMaterialPointDataProperties, IMaterialPointDataPropertiesDefinition, IMaterialMultiPointData, MaterialMultiPointData, IMaterialMultiPointDataProperties, IMaterialMultiPointDataPropertiesDefinition, IMaterialBasicLineData, MaterialBasicLineData, IMaterialBasicLineDataProperties, IMaterialBasicLineDataPropertiesDefinition, IMapData, IMapDataProperties, IMapDataPropertiesDefinition, MapData };
export { IAnimationData, AnimationData, IAnimationTrack, IGeometryData, IAttributeData, IPrimitiveData, IMaterialVariantsData, GeometryData, AttributeData, PrimitiveData, MaterialVariantsData };
export { IAnchorDataImage, IAnchorDataText, ITag2D, ITag3D, ITexture, IHTMLElementAnchorData, HTMLElementAnchorCustomData, HTMLElementAnchorTextData, HTMLElementAnchorImageData, HTMLElementAnchorData };
export { ICustomData, CustomData, ICameraOptions };
export { ISDTFOverviewData, SDTFOverviewData, ISDTFOverview, SDTFAttributesData, ISDTFAttributesData, ISDTFAttributeData, SDTFAttributeData, SDTFItemData, ISDTFItemData, ISDTFAttributeVisualizationData, SdtfPrimitiveTypeGuard };
export { DataEngine, GeometryEngine, MaterialEngine };
export { ShapeDiverViewerErrorType, ShapeDiverViewerError, ShapeDiverViewerDataProcessingError, ShapeDiverViewerEnvironmentMapError, ShapeDiverViewerWebGLError, ShapeDiverViewerSettingsError, ShapeDiverViewerSessionError, ShapeDiverViewerViewportError, ShapeDiverViewerUnknownError, ShapeDiverViewerArError, ShapeDiverViewerLightError, ShapeDiverViewerCameraError, ShapeDiverViewerValidationError, ShapeDiverViewerInteractionError, ShapeDiverViewerDrawingToolsError, ShapeDiverGeometryBackendError, ShapeDiverGeometryBackendRequestError, ShapeDiverGeometryBackendResponseError, ShapeDiverGeometryBackendResponseErrorType };
export { isViewerError, isViewerUnknownError, isViewerDataProcessingError, isViewerEnvironmentMapError, isViewerWebGLError, isViewerSettingsError, isViewerSessionError, isViewerViewportError, isViewerLightError, isViewerCameraError, isARError, isViewerValidationError, isViewerInteractionError, isViewerDrawingToolsError, isViewerGeometryBackendError, isViewerGeometryBackendGenericError, isViewerGeometryBackendRequestError, isViewerGeometryBackendResponseError };
export { ANTI_ALIASING_TECHNIQUE, POST_PROCESSING_EFFECT_TYPE, IPostProcessingEffectDefinition, IBloomEffectDefinition, IChromaticAberrationEffectDefinition, IDepthOfFieldEffectDefinition, IDotScreenEffectDefinition, IGodRaysEffectDefinition, IGridEffectDefinition, IHBAOEffectDefinition, IHueSaturationEffectDefinition, INoiseEffectDefinition, IOutlineEffectDefinition, IPixelationEffectDefinition, ISSAOEffectDefinition, IScanlineEffectDefinition, ISelectiveBloomEffectDefinition, ISepiaEffectDefinition, ITiltShiftEffectDefinition, IVignetteEffectDefinition, BloomEffect, ChromaticAberrationEffect, DepthOfFieldEffect, DotScreenEffect, GodRaysEffect, GridEffect, HueSaturationEffect, NoiseEffect, OutlineEffect, PixelationEffect, SSAOEffect, ScanlineEffect, SelectiveBloomEffect, SepiaEffect, TiltShiftEffect, VignetteEffect, Effect, EffectComposer, BlendFunction, VignetteTechnique, KernelSize, Resolution };
export { isValid, stringify };

export interface ShapeDiverResponseOutputContent extends ShapeDiverResponseOutputContentBackend {
    // #region Properties (1)

    data?: ITag2D[] | ITag3D[] | IAnchor[] | IMaterialContentData | IMaterialContentDataV1 | IMaterialContentDataV2 | IMaterialContentDataV3 | unknown;

    // #endregion Properties (1)
}
export interface ShapeDiverResponseOutputChunk extends ShapeDiverResponseOutputChunkBackend {
    // #region Properties (1)

    node?: ITreeNode;

    // #endregion Properties (1)
}