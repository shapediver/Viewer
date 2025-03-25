import {Color} from "@shapediver/viewer.shared.types";
import {vec3} from "gl-matrix";

export interface IEnvironmentGeometry {
	// #region Properties (2)

	color?: Color;
	visible: boolean;

	// #endregion Properties (2)

	// #region Public Methods (2)

	changeSceneExtents(
		position: vec3,
		divisions: number,
		gridExtents: number,
	): void;
	updatePosition(position: vec3): void;

	// #endregion Public Methods (2)
}
