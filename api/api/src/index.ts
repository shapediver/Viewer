import { CAMERATYPE } from "@shapediver/viewer.rendering-engine.camera-engine";
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
import { LOGGINGLEVEL } from "@shapediver/viewer.shared.monitoring";
import { EVENTTYPE } from "@shapediver/viewer.shared.services";
import { EXPORTTYPE, IParameter as Parameter, PARAMETERTYPE, PARAMETERVISUALIZATION, SessionData, SessionOutputData } from "@shapediver/viewer.session-engine.session-engine";
import { FileParameter } from "./session/parameters/objects/FileParameter";
import { BooleanParameter } from "./session/parameters/objects/BooleanParameter";
import { ColorParameter } from "./session/parameters/objects/ColorParameter";
import { EvenParameter } from "./session/parameters/objects/EvenParameter";
import { FloatParameter } from "./session/parameters/objects/FloatParameter";
import { IntParameter } from "./session/parameters/objects/IntParameter";
import { OddParameter } from "./session/parameters/objects/OddParameter";
import { StringListParameter } from "./session/parameters/objects/StringListParameter";
import { StringParameter } from "./session/parameters/objects/StringParameter";
import { TimeParameter } from "./session/parameters/objects/TimeParameter";
import { SBitmapParameter } from "./session/parameters/objects/SBitmapParameter";
import { SCurveParameter } from "./session/parameters/objects/SCurveParameter";
import { SIntegerParameter } from "./session/parameters/objects/SIntegerParameter";
import { SNumberParameter } from "./session/parameters/objects/SNumberParameter";
import { SStringParameter } from "./session/parameters/objects/SStringParameter";
import { SParameter } from "./session/parameters/objects/SParameter";
import { PerspectiveCameraControls } from "./viewer/camera/controls/PerspectiveCameraControls";
import { OrthographicCamera } from "./viewer/camera/OrthographicCamera";
import { PerspectiveCamera } from "./viewer/camera/PerspectiveCamera";
import { OrthographicCameraControls } from "./viewer/camera/controls/OrthographicCameraControls";

export const api: Api = <Api>container.resolve(Api);

export {
    RENDERERTYPE, CAMERATYPE, LIGHTTYPE, VISIBILITYMODE, LOGGINGLEVEL, EVENTTYPE, EXPORTTYPE, PARAMETERTYPE, PARAMETERVISUALIZATION
}

export {
    Api, Session, Viewer, Parameter, Export, Output,
    BooleanParameter, ColorParameter, EvenParameter, FileParameter, FloatParameter, IntParameter, OddParameter, StringListParameter, StringParameter, TimeParameter,
    SBitmapParameter, SCurveParameter, SIntegerParameter, SNumberParameter, SStringParameter, SParameter
}

export {
    Tree, TreeNode, ITransformation, ITreeNodeData, AbstractTreeNodeData, ThreejsData, CustomData, GeometryData, MaterialData, SessionData, SessionOutputData
}


export {
    PerspectiveCamera, PerspectiveCameraControls, OrthographicCamera, OrthographicCameraControls
}