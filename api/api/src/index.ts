import { CAMERATYPE, ORTHOGRAPHIC_CAMERA_DIRECTION } from '@shapediver/viewer.rendering-engine.camera-engine'
import { container } from 'tsyringe'
import { LIGHTTYPE } from '@shapediver/viewer.rendering-engine.light-engine'
import { RENDERERTYPE, VISIBILITYMODE } from '@shapediver/viewer.rendering-engine.rendering-engine'
import {
  AbstractTreeNodeData,
  ITransformation,
  ITreeNodeData,
  Tree,
  TreeNode,
} from '@shapediver/viewer.shared.node-tree'
import {
  ENVIRONMENTMAP,
  ENVIRONMENTMAP_CUBE,
  ThreejsData,
} from '@shapediver/viewer.rendering-engine-threejs.standard'
import { CustomData, GeometryData, MaterialData, SDTFAttributeData, SDTFAttributeOverview, SDTFItemData, SDTFAttributesData, PRIMITIVETYPEHINT, GEOMETRYTYPEHINT, SDTFOverview, SDTFAttributeVisualization, ATTRIBUTEVISUALIZATION, AnimationTrack, AnimationData, MATERIAL_ALPHA } from '@shapediver/viewer.shared.types'
import { EVENTTYPE, LOGGINGLEVEL, SettingsEngine } from '@shapediver/viewer.shared.services'
import { SessionData, SessionOutputData } from '@shapediver/viewer.session-engine.session-engine'
import { ShapeDiverResponseExportDefinitionType as EXPORTTYPE } from '@shapediver/api.geometry-api-dto-v1'

import { Api } from './implementation/Api'
import { Output } from './implementation/session/Output'
import { Export } from './implementation/session/Export'
import { Session } from './implementation/session/Session'
import { PerspectiveCameraControls } from './implementation/viewer/camera/controls/PerspectiveCameraControls'
import { OrthographicCamera } from './implementation/viewer/camera/OrthographicCamera'
import { PerspectiveCamera } from './implementation/viewer/camera/PerspectiveCamera'
import { OrthographicCameraControls } from './implementation/viewer/camera/controls/OrthographicCameraControls'
import { AmbientLight } from './implementation/viewer/lights/AmbientLight'
import { DirectionalLight } from './implementation/viewer/lights/DirectionalLight'
import { HemisphereLight } from './implementation/viewer/lights/HemisphereLight'
import { PointLight } from './implementation/viewer/lights/PointLight'
import { SpotLight } from './implementation/viewer/lights/SpotLight'
import { LightScene } from './implementation/viewer/lights/LightScene'
import { Parameter, PARAMETERTYPE, PARAMETERVISUALIZATION } from './implementation/session/Parameter'
import { FileParameter } from './implementation/session/FileParameter'
import { AbstractLight } from './implementation/viewer/lights/AbstractLight'
import { AbstractCamera } from './implementation/viewer/camera/AbstractCamera'
import { IApi } from './interfaces/IApi'
import { IExport } from './interfaces/session/IExport'
import { IFileParameter } from './interfaces/session/IFileParameter'
import { IOutput } from './interfaces/session/IOutput'
import { IParameter } from './interfaces/session/IParameter'
import { IViewer } from './interfaces/viewer/IViewer'
import { IAmbientLight } from './interfaces/viewer/lights/IAmbientLight'
import { IDirectionalLight } from './interfaces/viewer/lights/IDirectionalLight'
import { IHemisphereLight } from './interfaces/viewer/lights/IHemisphereLight'
import { IPointLight } from './interfaces/viewer/lights/IPointLight'
import { ISpotLight } from './interfaces/viewer/lights/ISpotLight'
import { ISession } from './interfaces/session/ISession'
import { IOrthographicCameraControls } from './interfaces/viewer/camera/controls/IOrthographicCameraControls'
import { IOrthographicCamera } from './interfaces/viewer/camera/IOrthographicCamera'
import { IPerspectiveCameraControls } from './interfaces/viewer/camera/controls/IPerspectiveCameraControls'
import { IPerspectiveCamera } from './interfaces/viewer/camera/IPerspectiveCamera'
import { ICamera } from './interfaces/viewer/camera/ICamera'
import { ILightScene } from './interfaces/viewer/lights/ILightScene'
import { ILight } from './interfaces/viewer/lights/ILight'

export const api: Api = <Api>container.resolve(Api);
export const settingsEngine: SettingsEngine = <SettingsEngine>container.resolve(SettingsEngine);

export {
    RENDERERTYPE, CAMERATYPE, ORTHOGRAPHIC_CAMERA_DIRECTION, LIGHTTYPE, VISIBILITYMODE, LOGGINGLEVEL, MATERIAL_ALPHA, EVENTTYPE, EXPORTTYPE, PARAMETERTYPE, PARAMETERVISUALIZATION, ENVIRONMENTMAP, ENVIRONMENTMAP_CUBE
}

export {
    Session, Parameter, Export, Output, FileParameter
}

export {
    IApi, ISession, IViewer, IParameter, IExport, IOutput, IFileParameter
}

export {
    Tree, TreeNode, ITransformation, ITreeNodeData, AbstractTreeNodeData, ThreejsData, CustomData, GeometryData, AnimationData, AnimationTrack, MaterialData, SessionData, SessionOutputData
}

export {
    AbstractCamera, PerspectiveCamera, PerspectiveCameraControls, OrthographicCamera, OrthographicCameraControls
}

export {
    AmbientLight, DirectionalLight, HemisphereLight, PointLight, SpotLight, LightScene, AbstractLight
}

export {
    ICamera, IPerspectiveCamera, IPerspectiveCameraControls, IOrthographicCamera, IOrthographicCameraControls
}

export {
    IAmbientLight, IDirectionalLight, IHemisphereLight, IPointLight, ISpotLight, ILightScene, ILight
}

export {
    SDTFAttributeData, SDTFAttributeOverview, SDTFOverview, SDTFItemData, SDTFAttributesData, PRIMITIVETYPEHINT, GEOMETRYTYPEHINT, SDTFAttributeVisualization, ATTRIBUTEVISUALIZATION
}