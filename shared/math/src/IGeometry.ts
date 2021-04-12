import { mat4, vec3 } from "gl-matrix";

export interface IGeometry {
    containsPoint(point: vec3): boolean;
    clampPoint(point: vec3): vec3;
    applyMatrix(matrix: mat4): IGeometry;
    clone(): IGeometry;
}