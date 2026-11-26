import {vec2, vec3} from "gl-matrix";

export interface ICameraControlsLogic {
	// #region Public Methods (16)

	/**
	 * End one kind of movement of the current gesture without inertia and
	 * drop the motion it still had to do. The gesture goes on.
	 */
	cancel(channel: "rotation" | "pan" | "zoom"): void;
	/**
	 * If input arrived since the last call. Input interrupts a camera animation.
	 */
	consumeInput(): boolean;
	/**
	 * End the current gesture without inertia.
	 */
	endGesture(): void;
	/**
	 * If the camera is dragged, has not reached its goal yet or rotates automatically.
	 */
	isMoving(): boolean;
	isWithinRestrictions(position: vec3, target: vec3): boolean;
	/**
	 * Pan with a pointer. A call with `active` false starts the gesture.
	 *
	 * @param time The time stamp of the event in milliseconds.
	 */
	pan(
		x: number,
		y: number,
		active: boolean,
		touch: boolean,
		time?: number,
	): void;
	/**
	 * Pan by one step of a key press.
	 */
	panStep(x: number, y: number): void;
	/**
	 * End the current gesture. The camera keeps the speed of the pointer and slows down.
	 *
	 * @param time The time stamp of the event in milliseconds.
	 */
	release(time?: number): void;
	reset(): void;
	restrict(
		p: vec3,
		t: vec3,
		s?: vec2,
	): {position: vec3; target: vec3; sceneRotation?: vec2};
	/**
	 * Rotate with a pointer. A call with `active` false starts the gesture.
	 *
	 * @param time The time stamp of the event in milliseconds.
	 */
	rotate(
		x: number,
		y: number,
		active: boolean,
		touch: boolean,
		time?: number,
	): void;
	/**
	 * Drop the motion that is still to be done. The camera stays where it is.
	 */
	stop(): void;
	/**
	 * Move the camera towards its goal.
	 *
	 * @param time The time since the last frame in milliseconds.
	 * @param animating If a camera animation is running. It replaces the motion of the input.
	 */
	update(time: number, animating: boolean): void;
	/**
	 * Zoom with a pointer. A call with `active` false starts the gesture.
	 *
	 * @param time The time stamp of the event in milliseconds.
	 */
	zoom(
		x: number,
		y: number,
		active: boolean,
		touch: boolean,
		time?: number,
	): void;
	/**
	 * Zoom by wheel notches. Positive values zoom in.
	 */
	zoomStep(steps: number): void;

	// #endregion Public Methods (16)
}
