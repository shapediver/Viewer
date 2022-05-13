import { vec3 } from "gl-matrix";
import { IGeometry } from "./IGeometry";

export interface ITriangle extends IGeometry {
    intersect(origin: vec3, direction: vec3): vec3 | null;
}