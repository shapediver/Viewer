import { vec3 } from "gl-matrix";
import { IViewerEvent } from "./IViewerEvent";

export interface ISceneEvent extends IViewerEvent {
    boundingBox: { min: vec3, max: vec3}
}