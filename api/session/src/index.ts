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
    DrawingParameterValue,
    EventResponseMapping,
    GeometryData,
    GumballParameterValue,
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
    IDrawingParameterJsonSchema,
    IDrawingParameterSettings,
    IGeometryData,
    IGumballParameterJsonSchema,
    IGumballParameterProps,
    IHTMLElementAnchorData,
    IInteractionParameterJsonSchema,
    IInteractionParameterProps,
    IInteractionParameterSettings,
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
    InteractionParameterSettingsType,
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
    ISelectionParameterJsonSchema,
    ISelectionParameterProps,
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
    SelectionParameterValue,
    TASK_TYPE,
    TEXTURE_FILTERING,
    TEXTURE_WRAPPING
} from '@shapediver/viewer.shared.types';
import {
    Box,
    IBox,
    IGeometry,
    ISphere,
    Sphere
} from '@shapediver/viewer.shared.math';
import { createSession, sessions } from './main';
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
import { IDrawingParameterApi } from './interfaces/parameter/IDrawingParameterApi';
import { IExportApi } from './interfaces/IExportApi';
import { IFileParameterApi } from './interfaces/parameter/IFileParameterApi';
import { IGumballParameterApi } from './interfaces/parameter/IGumballParameterApi';
import {
    IMaterialContentDataV1,
    IMaterialContentDataV2,
    IMaterialContentDataV3,
    ITag2D,
    ITag3D,
    ITexture,
    TAG3D_JUSTIFICATION
} from '@shapediver/viewer.data-engine.shared-types';
import { IOutputApi } from './interfaces/IOutputApi';
import { IOutputApiData } from './interfaces/data/IOutputApiData';
import { IParameterApi } from './interfaces/parameter/IParameterApi';
import { ISelectionParameterApi } from './interfaces/parameter/ISelectionParameterApi';
import { ISessionApi } from './interfaces/ISessionApi';
import { ISessionApiData } from './interfaces/data/ISessionApiData';
import {
    ISessionData,
    ISessionOutputData,
    SessionData,
    SessionOutputData,
    ShapeDiverResponseOutputChunk,
    ShapeDiverResponseOutputContent
} from '@shapediver/viewer.session-engine.session-engine';
import {
    ITransformation,
    ITree,
    ITreeNode,
    ITreeNodeData,
    Tree,
    TreeNode
} from '@shapediver/viewer.shared.node-tree';
import { OutputApiData } from './implementation/data/OutputApiData';
import { SessionApiData } from './implementation/data/SessionApiData';
import { SessionCreationDefinition } from '@shapediver/viewer.creation-control-center.session';
import {
    ShapeDiverResponseExport,
    ShapeDiverResponseExportContent,
    ShapeDiverResponseExportDefinitionGroup,
    ShapeDiverResponseExportResult,
    ShapeDiverResponseModelComputationStatus,
    ShapeDiverResponseParameter
} from '@shapediver/sdk.geometry-api-sdk-v2';
import {
    ShapeDiverResponseExportDefinitionType as EXPORT_TYPE,
    ShapeDiverResponseOutput,
    ShapeDiverResponseOutputChunk as ShapeDiverResponseOutputChunkBackend,
    ShapeDiverResponseOutputContent as ShapeDiverResponseOutputContentBackend
} from '@shapediver/sdk.geometry-api-sdk-v2';

export { IExportApi, IFileParameterApi, IOutputApi, IParameterApi, ISessionApi, ISelectionParameterApi, IGumballParameterApi, IDrawingParameterApi };
export { InteractionParameterSettingsType, IInteractionParameterProps, IInteractionParameterSettings, IInteractionParameterJsonSchema, ISelectionParameterProps, SelectionParameterValue, ISelectionParameterJsonSchema, IGumballParameterProps, GumballParameterValue, IGumballParameterJsonSchema, DrawingParameterValue, IDrawingParameterSettings, IDrawingParameterJsonSchema };
export { ISessionApiData, SessionApiData, IOutputApiData, OutputApiData };

export { createSession, sessions };

export { addListener, removeListener, sceneTree, generalOptions, version, IGeneralOptions };

export { SessionCreationDefinition };
export { ITree, Tree, ITreeNode, TreeNode, ITreeNodeData };
export { PARAMETER_TYPE, EXPORT_TYPE, PARAMETER_VISUALIZATION, TAG3D_JUSTIFICATION, LOGGING_LEVEL, PRIMITIVE_MODE, MATERIAL_SIDE, MATERIAL_ALPHA, MATERIAL_SHADING, MATERIAL_TYPE, TEXTURE_WRAPPING, TEXTURE_FILTERING, SDTF_TYPEHINT, SESSION_SETTINGS_MODE };
export { TASK_TYPE, MainEventTypes, EVENTTYPE, EVENTTYPE_CAMERA, EVENTTYPE_OUTPUT, EVENTTYPE_PARAMETER, EVENTTYPE_RENDERING, EVENTTYPE_SCENE, EVENTTYPE_SESSION, EVENTTYPE_VIEWPORT, EVENTTYPE_INTERACTION, EVENTTYPE_GUMBALL, EVENTTYPE_DRAWING_TOOLS, EVENTTYPE_TASK };
export { IBox, Box, ISphere, Sphere, IGeometry, ITransformation, ShapeDiverResponseOutput, ShapeDiverResponseOutputContentBackend, ShapeDiverResponseOutputChunkBackend, ShapeDiverResponseOutputContent, ShapeDiverResponseOutputChunk, IDomEventListener, IEvent };
export { ShapeDiverResponseExport, ShapeDiverResponseExportContent, ShapeDiverResponseExportResult, ShapeDiverResponseModelComputationStatus, ShapeDiverResponseExportDefinitionGroup, ShapeDiverResponseParameter };

export { EventResponseMapping, IViewportEvent, ISessionEvent, IOutputEvent, ICameraEvent, ISceneEvent, ITaskEvent, IRenderingEvent, IParameterEvent, ISettingsSections, IViewportSettingsSections, ISessionSettingsSections };
export { IMaterialStandardData, MaterialStandardData, IMaterialStandardDataProperties, IMaterialStandardDataPropertiesDefinition, IMaterialAbstractData, IMaterialAbstractDataProperties, IMaterialAbstractDataPropertiesDefinition, IMaterialUnlitData, MaterialUnlitData, IMaterialUnlitDataProperties, IMaterialUnlitDataPropertiesDefinition, IMaterialShadowData, MaterialShadowData, IMaterialShadowDataProperties, IMaterialShadowDataPropertiesDefinition, IMaterialSpecularGlossinessData, MaterialSpecularGlossinessData, IMaterialSpecularGlossinessDataProperties, IMaterialSpecularGlossinessDataPropertiesDefinition, IMaterialGemData, MaterialGemData, IMaterialGemDataProperties, IMaterialGemDataPropertiesDefinition, IMaterialPointData, MaterialPointData, IMaterialPointDataProperties, IMaterialPointDataPropertiesDefinition, IMaterialMultiPointData, MaterialMultiPointData, IMaterialMultiPointDataProperties, IMaterialMultiPointDataPropertiesDefinition, IMaterialBasicLineData, MaterialBasicLineData, IMaterialBasicLineDataProperties, IMaterialBasicLineDataPropertiesDefinition, IMapData, IMapDataProperties, IMapDataPropertiesDefinition, MapData };
export { IAnimationData, AnimationData, IAnimationTrack, IGeometryData, IAttributeData, IPrimitiveData, IMaterialVariantsData, GeometryData, AttributeData, PrimitiveData, MaterialVariantsData };
export { IAnchorDataImage, IAnchorDataText, ITag2D, ITag3D, IHTMLElementAnchorData, HTMLElementAnchorCustomData, HTMLElementAnchorTextData, HTMLElementAnchorImageData, HTMLElementAnchorData, IMaterialContentDataV1, IMaterialContentDataV2, IMaterialContentDataV3, ITexture };
export { ICustomData, CustomData };
export { ISDTFOverviewData, SDTFOverviewData, ISDTFOverview, SDTFAttributesData, ISDTFAttributesData, ISDTFAttributeData, SDTFAttributeData, SDTFItemData, ISDTFItemData, ISDTFAttributeVisualizationData, SdtfPrimitiveTypeGuard };
export { ISessionData, SessionData, ISessionOutputData, SessionOutputData };
export { ShapeDiverViewerErrorType, ShapeDiverViewerError, ShapeDiverViewerDataProcessingError, ShapeDiverViewerEnvironmentMapError, ShapeDiverViewerWebGLError, ShapeDiverViewerSettingsError, ShapeDiverViewerSessionError, ShapeDiverViewerViewportError, ShapeDiverViewerUnknownError, ShapeDiverViewerArError, ShapeDiverViewerLightError, ShapeDiverViewerCameraError, ShapeDiverViewerValidationError, ShapeDiverViewerInteractionError, ShapeDiverViewerDrawingToolsError, ShapeDiverGeometryBackendError, ShapeDiverGeometryBackendRequestError, ShapeDiverGeometryBackendResponseError, ShapeDiverGeometryBackendResponseErrorType };
export { isViewerError, isViewerUnknownError, isViewerDataProcessingError, isViewerEnvironmentMapError, isViewerWebGLError, isViewerSettingsError, isViewerSessionError, isViewerViewportError, isViewerLightError, isViewerCameraError, isARError, isViewerValidationError, isViewerInteractionError, isViewerDrawingToolsError, isViewerGeometryBackendError, isViewerGeometryBackendGenericError, isViewerGeometryBackendRequestError, isViewerGeometryBackendResponseError };
export { isValid, stringify };