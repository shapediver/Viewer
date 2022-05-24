import "reflect-metadata"
import { ISDObject, ITransformation, ITree, ITreeNode, ITreeNodeData } from "@shapediver/viewer.shared.node-tree";
import { TAG3D_JUSTIFICATION } from "@shapediver/viewer.data-engine.shared-types";
import { CAMERA_TYPE, ORTHOGRAPHIC_CAMERA_DIRECTION } from "@shapediver/viewer.rendering-engine.camera-engine";
import { LIGHT_TYPE } from "@shapediver/viewer.rendering-engine.light-engine";
import { RENDERER_TYPE, VISIBILITY_MODE, TEXTURE_ENCODING, TONE_MAPPING, FLAG_TYPE, BUSY_MODE_DISPLAY, SESSION_SETTINGS_MODE } from "@shapediver/viewer.rendering-engine.rendering-engine";
import { MainEventTypes, EVENTTYPE, LOGGING_LEVEL, LOGGING_TOPIC, IDomEventListener, IEvent, EVENTTYPE_CAMERA, EVENTTYPE_RENDERING, EVENTTYPE_SCENE, EVENTTYPE_SESSION, EVENTTYPE_VIEWER, EVENTTYPE_INTERACTION, EVENTTYPE_TASK } from "@shapediver/viewer.shared.services";
import { PRIMITIVE_MODE, MATERIAL_SIDE, MATERIAL_ALPHA, MATERIAL_SHADING, TEXTURE_WRAPPING, TEXTURE_FILTERING, PRIMITIVE_TYPEHINT, GEOMETRY_TYPEHINT, TASK_TYPE, ISDTFAttributeVisualizationData, ISDTFOverview, IMaterialData, IAnimationTrack, IMaterialDataProperties, IMapData, IAnimationData, ISDTFItemData, ISDTFAttributeData, ISDTFAttributesData, IViewerEvent, ICameraEvent, ISceneEvent, ISessionEvent, ITaskEvent, EventResponseMapping, IDragEvent, IHoverEvent, ISelectEvent } from "@shapediver/viewer.shared.types";
import { ENVIRONMENT_MAP, ENVIRONMENT_MAP_CUBE, IThreejsData } from '@shapediver/viewer.rendering-engine-threejs.standard'
import { IExportApi } from "./interfaces/session/IExportApi";
import { IFileParameterApi } from "./interfaces/session/IFileParameterApi";
import { IOutputApi, ShapeDiverResponseOutputContent } from "./interfaces/session/IOutputApi";
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
import { addListener, createSession, createViewport, loggingLevel, removeListener, sceneTree, sessions, showMessages, viewports } from "./main";
import { IBox, ISphere, IGeometry } from "@shapediver/viewer.shared.math";
import { ISessionData, ISessionOutputData, PARAMETER_TYPE, PARAMETER_VISUALIZATION } from "@shapediver/viewer.session-engine.session-engine";

export {
    createViewport, createSession, addListener, removeListener,
    sessions, viewports, 
    sceneTree,
    loggingLevel, showMessages
}

export { IExportApi, IFileParameterApi, IOutputApi, IParameterApi, ISessionApi }
export { ICameraApi, IOrthographicCameraApi, IPerspectiveCameraApi, IAmbientLightApi, IDirectionalLightApi, IHemisphereLightApi, IPointLightApi, ISpotLightApi, ILightApi, ILightSceneApi, IViewportApi }
export { ITree, ITreeNode, ITreeNodeData }
export { FLAG_TYPE, PARAMETER_TYPE, PARAMETER_VISUALIZATION, TAG3D_JUSTIFICATION, CAMERA_TYPE, LIGHT_TYPE, RENDERER_TYPE, VISIBILITY_MODE, ORTHOGRAPHIC_CAMERA_DIRECTION, TEXTURE_ENCODING, TONE_MAPPING, ENVIRONMENT_MAP, ENVIRONMENT_MAP_CUBE, LOGGING_LEVEL, LOGGING_TOPIC, PRIMITIVE_MODE, MATERIAL_SIDE, MATERIAL_ALPHA, MATERIAL_SHADING, TEXTURE_WRAPPING, TEXTURE_FILTERING, PRIMITIVE_TYPEHINT, GEOMETRY_TYPEHINT, BUSY_MODE_DISPLAY, SESSION_SETTINGS_MODE }
export { EventResponseMapping, IViewerEvent, ISessionEvent, ICameraEvent, IDragEvent, IHoverEvent, ISelectEvent, ISceneEvent, ITaskEvent, TASK_TYPE, MainEventTypes, EVENTTYPE, EVENTTYPE_CAMERA, EVENTTYPE_RENDERING, EVENTTYPE_SCENE, EVENTTYPE_SESSION, EVENTTYPE_VIEWER, EVENTTYPE_INTERACTION, EVENTTYPE_TASK }
export { IBox, ISphere, IGeometry, ITransformation, IMaterialData, IMaterialDataProperties, IMapData, IAnimationTrack, ISDTFAttributeData, ISDTFAttributesData, ISDTFItemData, IAnimationData, ISDTFOverview, ShapeDiverResponseOutputContent, ISDObject, ISDTFAttributeVisualizationData, IDomEventListener, IEvent, IThreejsData, ISessionData, ISessionOutputData }