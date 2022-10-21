import "reflect-metadata"
import { ITransformation, ITree, Tree, ITreeNode, TreeNode, ITreeNodeData } from "@shapediver/viewer.shared.node-tree";
import { IMaterialContentDataV1, IMaterialContentDataV2, IMaterialContentDataV3, ITexture, TAG3D_JUSTIFICATION } from "@shapediver/viewer.data-engine.shared-types";
import { CAMERA_TYPE, ORTHOGRAPHIC_CAMERA_DIRECTION, ICameraOptions } from "@shapediver/viewer.rendering-engine.camera-engine";
import { LIGHT_TYPE } from "@shapediver/viewer.rendering-engine.light-engine";
import { RENDERER_TYPE, VISIBILITY_MODE, TEXTURE_ENCODING, TONE_MAPPING, FLAG_TYPE, BUSY_MODE_DISPLAY, SESSION_SETTINGS_MODE, SPINNER_POSITIONING } from "@shapediver/viewer.rendering-engine.rendering-engine";
import { MainEventTypes, EVENTTYPE, LOGGING_LEVEL, LOGGING_TOPIC, IDomEventListener, IEvent, EVENTTYPE_CAMERA, EVENTTYPE_RENDERING, EVENTTYPE_SCENE, EVENTTYPE_SESSION, EVENTTYPE_VIEWPORT, EVENTTYPE_INTERACTION, EVENTTYPE_TASK } from "@shapediver/viewer.shared.services";
import { PRIMITIVE_MODE, MATERIAL_SIDE, MATERIAL_ALPHA, MATERIAL_SHADING, TEXTURE_WRAPPING, TEXTURE_FILTERING, SDTF_TYPEHINT, TASK_TYPE, ISDTFAttributeVisualizationData, ISDTFOverview, IAnimationTrack, IMapData, IAnimationData, ISDTFItemData, ISDTFAttributeData, ISDTFAttributesData, IViewportEvent, ICameraEvent, ISceneEvent, ISessionEvent, ITaskEvent, EventResponseMapping, AnimationData, MaterialStandardData, MaterialUnlitData, MaterialSpecularGlossinessData, SdtfPrimitiveTypeGuard, AttributeData, CustomData, GeometryData, HTMLElementAnchorCustomData, HTMLElementAnchorData, HTMLElementAnchorImageData, HTMLElementAnchorTextData, IAttributeData, ICustomData, IGeometryData, IHTMLElementAnchorData, IMaterialSpecularGlossinessData, IMaterialSpecularGlossinessDataProperties, IMaterialStandardData, IMaterialStandardDataProperties, IMaterialUnlitData, IMaterialUnlitDataProperties, IMaterialVariantsData, IPrimitiveData, ISDTFOverviewData, MapData, MaterialVariantsData, PrimitiveData, SDTFAttributeData, SDTFAttributesData, SDTFItemData, SDTFOverviewData, IAnchorDataText, IAnchorDataImage, IMaterialAbstractData, IMaterialGemData, IMaterialGemDataProperties, MaterialGemData } from "@shapediver/viewer.shared.types";
import { ENVIRONMENT_MAP, ENVIRONMENT_MAP_CUBE, IThreejsData, ThreejsData } from '@shapediver/viewer.rendering-engine-threejs.standard'
import { IExportApi } from "./interfaces/session/IExportApi";
import { IFileParameterApi } from "./interfaces/session/IFileParameterApi";
import { IOutputApi } from "./interfaces/session/IOutputApi";
import { IParameterApi } from "./interfaces/session/IParameterApi";
import { ISessionApi } from "./interfaces/session/ISessionApi";
import { ICameraApi } from "./interfaces/viewport/camera/ICameraApi";
import { IOrthographicCameraApi } from "./interfaces/viewport/camera/IOrthographicCameraApi";
import { IPerspectiveCameraApi } from "./interfaces/viewport/camera/IPerspectiveCameraApi";
import { IViewportApi } from "./interfaces/viewport/IViewportApi";
import { ILightApi } from "./interfaces/viewport/lights/ILightApi";
import { ILightSceneApi } from "./interfaces/viewport/lights/ILightSceneApi";
import { IAmbientLightApi } from "./interfaces/viewport/lights/types/IAmbientLightApi";
import { IDirectionalLightApi } from "./interfaces/viewport/lights/types/IDirectionalLightApi";
import { IHemisphereLightApi } from "./interfaces/viewport/lights/types/IHemisphereLightApi";
import { IPointLightApi } from "./interfaces/viewport/lights/types/IPointLightApi";
import { ISpotLightApi } from "./interfaces/viewport/lights/types/ISpotLightApi";
import { addListener, createSession, createViewport, generalOptions, IGeneralOptions, removeListener, sceneTree, sessions, viewports } from "./main";
import { IBox, ISphere, IGeometry, Box, Sphere } from "@shapediver/viewer.shared.math";
import { ISessionData, ISessionOutputData, PARAMETER_TYPE, PARAMETER_VISUALIZATION, SessionData, SessionOutputData, ShapeDiverResponseOutputContent, ShapeDiverResponseOutputChunk, ISettingsSections } from "@shapediver/viewer.session-engine.session-engine";
import { ShapeDiverResponseOutput, ShapeDiverResponseOutputContent as ShapeDiverResponseOutputContentBackend, ShapeDiverResponseOutputChunk as ShapeDiverResponseOutputChunkBackend } from '@shapediver/sdk.geometry-api-sdk-v2';
import { DataEngine } from "@shapediver/viewer.data-engine.data-engine";
import { GeometryEngine } from "@shapediver/viewer.data-engine.geometry-engine";
import { MaterialEngine } from "@shapediver/viewer.data-engine.material-engine";
import { OutputApiData } from "./implementation/session/data/OutputApiData";
import { SessionApiData } from "./implementation/session/data/SessionApiData";
import { IOutputApiData } from "./interfaces/session/data/IOutputApiData";
import { ISessionApiData } from "./interfaces/session/data/ISessionApiData";
import { NodeTreeUtils } from "@shapediver/viewer.shared.node-tree-utils";

export {
    createViewport, createSession, addListener, removeListener,
    sessions, viewports, 
    sceneTree,
    generalOptions
}

export { IGeneralOptions, IExportApi, IFileParameterApi, IOutputApi, IParameterApi, ISessionApi }
export { ICameraApi, IOrthographicCameraApi, IPerspectiveCameraApi, IAmbientLightApi, IDirectionalLightApi, IHemisphereLightApi, IPointLightApi, ISpotLightApi, ILightApi, ILightSceneApi, IViewportApi }
export { ITree, Tree, ITreeNode, TreeNode, ITreeNodeData }
export { FLAG_TYPE, PARAMETER_TYPE, PARAMETER_VISUALIZATION, TAG3D_JUSTIFICATION, CAMERA_TYPE, LIGHT_TYPE, RENDERER_TYPE, VISIBILITY_MODE, ORTHOGRAPHIC_CAMERA_DIRECTION, TEXTURE_ENCODING, TONE_MAPPING, ENVIRONMENT_MAP, ENVIRONMENT_MAP_CUBE, LOGGING_LEVEL, LOGGING_TOPIC, PRIMITIVE_MODE, MATERIAL_SIDE, MATERIAL_ALPHA, MATERIAL_SHADING, TEXTURE_WRAPPING, TEXTURE_FILTERING, SDTF_TYPEHINT, BUSY_MODE_DISPLAY, SESSION_SETTINGS_MODE, SPINNER_POSITIONING }
export { TASK_TYPE, MainEventTypes, EVENTTYPE, EVENTTYPE_CAMERA, EVENTTYPE_RENDERING, EVENTTYPE_SCENE, EVENTTYPE_SESSION, EVENTTYPE_VIEWPORT, EVENTTYPE_INTERACTION, EVENTTYPE_TASK }
export { IBox, Box, ISphere, Sphere, IGeometry, ITransformation, ShapeDiverResponseOutput, ShapeDiverResponseOutputContentBackend, ShapeDiverResponseOutputChunkBackend, ShapeDiverResponseOutputContent, ShapeDiverResponseOutputChunk, IDomEventListener, IEvent, IThreejsData, ThreejsData }

export { EventResponseMapping, IViewportEvent, ISessionEvent, ICameraEvent, ISceneEvent, ITaskEvent, ISettingsSections }
export { IMaterialAbstractData, IMaterialStandardData, MaterialStandardData, IMaterialStandardDataProperties, IMaterialUnlitData, MaterialUnlitData, IMaterialUnlitDataProperties, IMaterialSpecularGlossinessData, MaterialSpecularGlossinessData, IMaterialSpecularGlossinessDataProperties, IMaterialGemData, MaterialGemData, IMaterialGemDataProperties, IMapData, MapData, ITexture, IMaterialContentDataV1, IMaterialContentDataV2, IMaterialContentDataV3 }
export { IAnimationData, AnimationData, IAnimationTrack, IGeometryData, IAttributeData, IPrimitiveData, IMaterialVariantsData, GeometryData, AttributeData, PrimitiveData, MaterialVariantsData }
export { IAnchorDataImage, IAnchorDataText, IHTMLElementAnchorData, HTMLElementAnchorCustomData, HTMLElementAnchorTextData, HTMLElementAnchorImageData, HTMLElementAnchorData }
export { ICustomData, CustomData, ICameraOptions }
export { ISDTFOverviewData, SDTFOverviewData, ISDTFOverview, SDTFAttributesData, ISDTFAttributesData, ISDTFAttributeData, SDTFAttributeData, SDTFItemData, ISDTFItemData, ISDTFAttributeVisualizationData, SdtfPrimitiveTypeGuard }
export { DataEngine, GeometryEngine, MaterialEngine }
export { ISessionData, SessionData, ISessionOutputData, SessionOutputData }
export { ISessionApiData, SessionApiData, IOutputApiData, OutputApiData }
export { NodeTreeUtils }