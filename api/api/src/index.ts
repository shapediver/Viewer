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
import { CustomData, GeometryData, MaterialData, SessionData, SessionOutputData } from "@shapediver/viewer.shared.types";
import { LOGGINGLEVEL } from "@shapediver/viewer.shared.monitoring";
import { EVENTTYPE } from "@shapediver/viewer.shared.services";
import { FileParameter } from "./session/parameters/objects/FileParameter";
import { BooleanParameter } from "./session/parameters/objects/BooleanParameter";
import { NumberParameter } from "./session/parameters/objects/NumberParameter";
import { StringParameter } from "./session/parameters/objects/StringParameter";
import { IParameter as Parameter, PARAMETERTYPE, PARAMETERVISUALIZATION } from "@shapediver/viewer.session-engine.session-engine";

export const api: Api = <Api>container.resolve(Api);

export {
    RENDERERTYPE, CAMERATYPE, LIGHTTYPE, VISIBILITYMODE, LOGGINGLEVEL, EVENTTYPE, PARAMETERTYPE, PARAMETERVISUALIZATION
}

export {
    Api, Session, Viewer, Parameter, BooleanParameter, FileParameter, NumberParameter, StringParameter, Export, Output
}

export {
    Tree, TreeNode, ITransformation, ITreeNodeData, AbstractTreeNodeData, ThreejsData, CustomData, GeometryData, MaterialData, SessionData, SessionOutputData
}