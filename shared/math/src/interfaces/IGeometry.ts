import { mat4, vec3 } from 'gl-matrix'

export interface IGeometry {
    applyMatrix(matrix: mat4): IGeometry;
    clone(): IGeometry;
    reset(): void;
}