import { vec3 } from "gl-matrix";
import { IViewportEvent } from "./IViewportEvent";

export interface ISceneEvent extends IViewportEvent {
    boundingBox: { min: vec3, max: vec3}
}