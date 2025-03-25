import {vec2, vec3} from "gl-matrix";

export interface ICameraControlsLogic {
	// #region Public Methods (7)

	isWithinRestrictions(position: vec3, target: vec3): boolean;
	pan(x: number, y: number, active: boolean, touch: boolean): void;
	reset(): void;
	restrict(
		p: vec3,
		t: vec3,
		s?: vec2,
	): {position: vec3; target: vec3; sceneRotation?: vec2};
	rotate(x: number, y: number, active: boolean, touch: boolean): void;
	update(time: number, manualInteraction: boolean): void;
	zoom(x: number, y: number, active: boolean, touch: boolean): void;

	// #endregion Public Methods (7)
}
