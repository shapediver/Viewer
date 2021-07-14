import { CAMERATYPE, ORTHOGRAPHIC_CAMERA_DIRECTION } from "@shapediver/viewer.rendering-engine.camera-engine";
import { container } from "tsyringe";
import { LIGHTTYPE } from "@shapediver/viewer.rendering-engine.light-engine";
import { RENDERERTYPE, VISIBILITYMODE } from "@shapediver/viewer.rendering-engine.rendering-engine";
import { Api } from "./Api";
import { Viewer } from "./viewer/Viewer";
import { Output } from "./session/Output";
import { Export } from "./session/Export";
import { Session } from "./session/Session";
import { AbstractTreeNodeData, ITransformation, ITreeNodeData, Tree, TreeNode } from "@shapediver/viewer.shared.node-tree";
import { ThreejsData } from "@shapediver/viewer.rendering-engine-threejs.rendering-engine";
import { CustomData, GeometryData, MaterialData } from "@shapediver/viewer.shared.types";
import { LOGGINGLEVEL } from "@shapediver/viewer.shared.utils";
import { EVENTTYPE } from "@shapediver/viewer.shared.services";
import { SessionData, SessionOutputData } from "@shapediver/viewer.session-engine.session-engine";
import { PerspectiveCameraControls } from "./viewer/camera/controls/PerspectiveCameraControls";
import { OrthographicCamera } from "./viewer/camera/OrthographicCamera";
import { PerspectiveCamera } from "./viewer/camera/PerspectiveCamera";
import { OrthographicCameraControls } from "./viewer/camera/controls/OrthographicCameraControls";
import { AmbientLight } from "./viewer/lights/AmbientLight";
import { DirectionalLight } from "./viewer/lights/DirectionalLight";
import { HemisphereLight } from "./viewer/lights/HemisphereLight";
import { PointLight } from "./viewer/lights/PointLight";
import { SpotLight } from "./viewer/lights/SpotLight";
import { LightScene } from "./viewer/lights/LightScene";
import { Parameter, PARAMETERTYPE, PARAMETERVISUALIZATION } from "./session/Parameter";
import { FileParameter } from "./session/FileParameter";
import { ShapeDiverResponseExportDefinitionType as EXPORTTYPE } from "@shapediver/api.geometry-api-dto-v1";
import { Light } from "./viewer/lights/Light";
import { Camera } from "./viewer/camera/Camera";

export const api: Api = <Api>container.resolve(Api);

export {
    RENDERERTYPE, CAMERATYPE, ORTHOGRAPHIC_CAMERA_DIRECTION, LIGHTTYPE, VISIBILITYMODE, LOGGINGLEVEL, EVENTTYPE, EXPORTTYPE, PARAMETERTYPE, PARAMETERVISUALIZATION
}

export {
    Api, Session, Viewer, Parameter, Export, Output, FileParameter
}

export {
    Tree, TreeNode, ITransformation, ITreeNodeData, AbstractTreeNodeData, ThreejsData, CustomData, GeometryData, MaterialData, SessionData, SessionOutputData
}

export {
    Camera, PerspectiveCamera, PerspectiveCameraControls, OrthographicCamera, OrthographicCameraControls
}

export {
    AmbientLight, DirectionalLight, HemisphereLight, PointLight, SpotLight, LightScene, Light
}