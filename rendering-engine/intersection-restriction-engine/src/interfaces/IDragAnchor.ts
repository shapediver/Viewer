import {vec3} from "gl-matrix";

export interface IDragAnchor {
	// #region Properties (2)

	position: vec3;
	rotation?: {
		axis: vec3;
		angle: number;
	};

	// #endregion Properties (2)
}
