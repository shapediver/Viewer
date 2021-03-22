import { CAMERATYPE } from "@shapediver/viewer.rendering-engine.camera-engine";
import { container } from "tsyringe";
import { LIGHTTYPE } from "@shapediver/viewer.rendering-engine.light-engine";
import { RENDERERTYPE } from "@shapediver/viewer.rendering-engine.rendering-engine";
import { Api } from "./Api";
import { Viewer } from "./viewer/Viewer";
import { Output } from "./session/Output";
import { Export } from "./session/Export";
import { Parameter } from "./session/Parameter";
import { Session } from "./session/Session";
import { AbstractTreeNodeData, ITransformation, ITreeNodeData, Tree, TreeNode } from "@shapediver/viewer.shared.node-tree";
import { ThreejsData } from "@shapediver/viewer.rendering-engine-threejs.rendering-engine";
import { CustomData, GeometryData, MaterialData, SessionData, SessionOutputData } from "@shapediver/viewer.shared.types";

export const api = <Api>container.resolve(Api);

export {
    RENDERERTYPE, CAMERATYPE, LIGHTTYPE
}

export {
    Api, Session, Viewer, Parameter, Export, Output
}

// export {
//     Tree, TreeNode, ITransformation, ITreeNodeData, AbstractTreeNodeData, ThreejsData, CustomData, GeometryData, MaterialData, SessionData, SessionOutputData
// }