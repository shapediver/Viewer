import { vec3 } from "gl-matrix";

export interface ILayer {
    // #region Properties (2)

    enabled: boolean;
    opacity: number;
    color: string | vec3 | number[]

    // #endregion Properties (2)
}