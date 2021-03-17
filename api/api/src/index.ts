import { CAMERATYPE } from "@shapediver/viewer.rendering-engine.camera-engine";
import { container } from "tsyringe";
import { LIGHTTYPE } from "@shapediver/viewer.rendering-engine.light-engine";
import { Api } from "./Api";
import { RENDERERTYPE, Viewer } from "./viewer/Viewer";
import { Output } from "./session/Output";
import { Export } from "./session/Export";
import { Parameter } from "./session/Parameter";
import { Session } from "./session/Session";

export const api = <Api>container.resolve(Api);

export {
    RENDERERTYPE, CAMERATYPE, LIGHTTYPE
}

export {
    Session, Viewer, Parameter, Export, Output
}