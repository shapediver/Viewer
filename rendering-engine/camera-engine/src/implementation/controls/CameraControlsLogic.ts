import {Box, Sphere, Spherical} from "@shapediver/viewer.shared.math";
import {
	CAMERA_TYPE,
	ORTHOGRAPHIC_CAMERA_DIRECTION,
} from "@shapediver/viewer.shared.types";
import {mat4, quat, vec2, vec3} from "gl-matrix";
import {
	type Adjustments,
	type ICameraControls,
} from "../../interfaces/controls/ICameraControls";
import {type ICameraControlsLogic} from "../../interfaces/controls/ICameraControlsLogic";
import {OrthographicCamera} from "../camera/OrthographicCamera";
import {PerspectiveCamera} from "../camera/PerspectiveCamera";
import {Damper} from "./Damper";
import {VelocityTracker} from "./VelocityTracker";

/**
 * The frame length in milliseconds that the damping setting refers to.
 */
const REFERENCE_FRAME = 1000 / 60;
/**
 * The time in milliseconds that a movementSmoothness of 1 stands for.
 */
const SMOOTHNESS_TIME = 100;
/**
 * Factor between the step of a wheel notch or key press and the step of a
 * drag event. It keeps the distance of one notch or key press that the
 * former damping gave at its default of 0.1 on a 60 Hz display.
 */
const IMPULSE_GAIN = 10;
/**
 * Below these distances to the goal the camera is put onto the goal.
 * Angles in radians, zoom as logarithm of the distance, pan relative to the
 * distance between position and target.
 */
const ANGLE_EPSILON = 1e-5;
const PAN_EPSILON = 1e-5;
const ZOOM_EPSILON = 1e-5;
/**
 * The polar angle stays this far away from the poles.
 */
const POLE_EPSILON = 0.000001;

export class CameraControlsLogic implements ICameraControlsLogic {
	// #region Properties (22)

	private _adjustedSettings = {
		autoRotationSpeed: () =>
			this._controls.autoRotationSpeed *
			this._settingsAdjustments.autoRotationSpeed,
		damping: () =>
			this._controls.damping * this._settingsAdjustments.damping,
		movementSmoothness: () =>
			this._controls.movementSmoothness *
			this._settingsAdjustments.movementSmoothness,
		panSpeed: () =>
			this._controls.panSpeed * this._settingsAdjustments.panSpeed,
		rotationSpeed: () =>
			this._controls.rotationSpeed *
			this._settingsAdjustments.rotationSpeed,
		zoomSpeed: () =>
			this._controls.zoomSpeed * this._settingsAdjustments.zoomSpeed,
	};
	private _dollyDelta = 0;
	private _dollyEnd = 0;
	private _dollyStart = 0;
	/**
	 * If the current gesture has moved the camera. A pointer that is only
	 * pressed does not count as camera movement.
	 */
	private _dragging = false;
	/**
	 * If input arrived since the last call of {@link consumeInput}.
	 */
	private _input = false;
	private _panDelta = vec2.create();
	/**
	 * The pan that is still to be done, in world coordinates.
	 */
	private _panDampers = [new Damper(), new Damper(), new Damper()];
	private _panEnd = vec2.create();
	private _panStart = vec2.create();
	private _panTracker = new VelocityTracker(3);
	/**
	 * The polar rotation that is still to be done, in radians.
	 */
	private _phiDamper = new Damper();
	/**
	 * If a mouse button or a finger is down.
	 */
	private _pointerDown = false;
	private _quat: quat;
	private _quatInverse: quat;
	private _rotateDelta = vec2.create();
	private _rotateEnd = vec2.create();
	private _rotateStart = vec2.create();
	private _rotationTracker = new VelocityTracker(2);
	/**
	 * The azimuth rotation that is still to be done, in radians.
	 */
	private _thetaDamper = new Damper();
	/**
	 * The zoom that is still to be done, as the change of the logarithm of
	 * the distance between position and target.
	 */
	private _zoomDamper = new Damper();
	private _zoomTracker = new VelocityTracker(1);

	// #endregion Properties (22)

	// #region Constructors (1)

	constructor(
		private readonly _controls: ICameraControls,
		private readonly _settingsAdjustments: Adjustments,
		private readonly _touchAdjustments: Adjustments,
	) {
		this._quat = quat.fromValues(
			-Math.sin(Math.PI / 4),
			0,
			0,
			Math.sin(Math.PI / 4),
		);
		this._quatInverse = quat.fromValues(
			Math.sin(Math.PI / 4),
			0,
			0,
			Math.sin(Math.PI / 4),
		);
	}

	// #endregion Constructors (1)

	// #region Public Methods (15)

	public isWithinRestrictions(position: vec3, target: vec3): boolean {
		const pBox = new Box(
				this._controls.cubePositionRestriction.min,
				this._controls.cubePositionRestriction.max,
			),
			pSphere = new Sphere(
				this._controls.spherePositionRestriction.center,
				this._controls.spherePositionRestriction.radius,
			),
			tBox = new Box(
				this._controls.cubeTargetRestriction.min,
				this._controls.cubeTargetRestriction.max,
			),
			tSphere = new Sphere(
				this._controls.sphereTargetRestriction.center,
				this._controls.sphereTargetRestriction.radius,
			);

		if (!(pBox.containsPoint(position) && pSphere.containsPoint(position)))
			return false;
		if (!(tBox.containsPoint(target) && tSphere.containsPoint(target)))
			return false;

		const currentDistance = vec3.distance(position, target);
		if (
			currentDistance > this._controls.zoomRestriction.maxDistance ||
			currentDistance < this._controls.zoomRestriction.minDistance
		)
			return false;

		const minPolarAngle =
				this._controls.rotationRestriction.minPolarAngle *
				(Math.PI / 180),
			maxPolarAngle =
				this._controls.rotationRestriction.maxPolarAngle *
				(Math.PI / 180),
			minAzimuthAngle =
				this._controls.rotationRestriction.minAzimuthAngle *
				(Math.PI / 180),
			maxAzimuthAngle =
				this._controls.rotationRestriction.maxAzimuthAngle *
				(Math.PI / 180);

		if (
			minAzimuthAngle !== -Infinity ||
			maxAzimuthAngle !== Infinity ||
			minPolarAngle !== 0 ||
			maxPolarAngle !== 180
		) {
			const offset = vec3.sub(vec3.create(), position, target);
			vec3.transformQuat(offset, offset, this._quat);
			const spherical = new Spherical().fromVec3(offset);

			if (
				spherical.theta < minAzimuthAngle ||
				spherical.theta > maxAzimuthAngle ||
				spherical.phi < minPolarAngle ||
				spherical.phi > maxPolarAngle
			) {
				return false;
			}
		}

		return true;
	}

	public consumeInput(): boolean {
		const input = this._input;
		this._input = false;
		return input;
	}

	public endGesture(): void {
		this._pointerDown = false;
		this._dragging = false;
		this._rotationTracker.reset();
		this._panTracker.reset();
		this._zoomTracker.reset();
	}

	public isMoving(): boolean {
		return (
			this._dragging ||
			!this._thetaDamper.isSettled() ||
			!this._phiDamper.isSettled() ||
			!this._zoomDamper.isSettled() ||
			this._panDampers.some((d) => !d.isSettled()) ||
			(this._controls.enableAutoRotation &&
				this._adjustedSettings.autoRotationSpeed() !== 0)
		);
	}

	public pan(
		x: number,
		y: number,
		active: boolean,
		touch: boolean,
		time: number = performance.now(),
	): void {
		if (!active) {
			this._panStart = vec2.fromValues(x, y);
			this._panTracker.start(time);
			this.startGesture();
		} else {
			this._panEnd = vec2.fromValues(x, y);
			vec2.sub(this._panDelta, this._panEnd, this._panStart);
			if (this._panDelta[0] === 0 && this._panDelta[1] === 0) return;
			vec2.copy(this._panStart, this._panEnd);

			const adjustedPanSpeed =
				this._adjustedSettings.panSpeed() *
				(touch ? this._touchAdjustments.panSpeed : 1.0);
			const offset = this.panDeltaToOffset(
				vec2.mul(
					vec2.create(),
					this._panDelta,
					vec2.fromValues(adjustedPanSpeed, adjustedPanSpeed),
				),
			);

			this.addPan(offset);
			this._panTracker.add(time, [offset[0], offset[1], offset[2]]);
			this._dragging = true;
			this._input = true;
		}
	}

	public panStep(x: number, y: number): void {
		const speed = this._adjustedSettings.panSpeed() * IMPULSE_GAIN;
		this.addPan(
			this.panDeltaToOffset(vec2.fromValues(x * speed, y * speed)),
		);
		this._input = true;
	}

	public release(time: number = performance.now()): void {
		if (this._pointerDown) {
			// The camera keeps the speed of the pointer and loses it with the
			// time constant of the damping setting. Following the goal that is
			// moved here gives exactly that motion.
			const tau = this.releaseTau();
			const snap = !(this.dragTau() > 0);
			const coast = (damper: Damper, velocity: number) => {
				if (velocity === 0) return;
				damper.add(velocity * tau);
				// without smoothing the damper stands still between events
				if (snap) damper.velocity = velocity;
			};

			const rotation = this._rotationTracker.velocity(time);
			coast(this._thetaDamper, rotation[0]);
			coast(this._phiDamper, rotation[1]);
			const pan = this._panTracker.velocity(time);
			for (let i = 0; i < 3; i++) coast(this._panDampers[i], pan[i]);
			coast(this._zoomDamper, this._zoomTracker.velocity(time)[0]);
		}
		this.endGesture();
	}

	public reset() {
		this.stop();
		this.endGesture();
		this._input = false;
		this._dollyDelta = 0;
		this._dollyEnd = 0;
		this._dollyStart = 0;
		this._panDelta = vec2.create();
		this._panEnd = vec2.create();
		this._panStart = vec2.create();
		this._rotateDelta = vec2.create();
		this._rotateEnd = vec2.create();
		this._rotateStart = vec2.create();
	}

	public restrict(
		position: vec3,
		target: vec3,
		sceneRotation: vec2,
	): {position: vec3; target: vec3; sceneRotation: vec2} {
		const pBox = new Box(
				this._controls.cubePositionRestriction.min,
				this._controls.cubePositionRestriction.max,
			),
			pSphere = new Sphere(
				this._controls.spherePositionRestriction.center,
				this._controls.spherePositionRestriction.radius,
			),
			tBox = new Box(
				this._controls.cubeTargetRestriction.min,
				this._controls.cubeTargetRestriction.max,
			),
			tSphere = new Sphere(
				this._controls.sphereTargetRestriction.center,
				this._controls.sphereTargetRestriction.radius,
			);

		if (!pBox.containsPoint(position)) position = pBox.clampPoint(position);

		if (!pSphere.containsPoint(position))
			position = pSphere.clampPoint(position);

		if (!tBox.containsPoint(target)) target = tBox.clampPoint(target);

		if (!tSphere.containsPoint(target)) target = tSphere.clampPoint(target);

		// zoom restrictions
		const currentDistance = vec3.distance(position, target);
		if (
			currentDistance > this._controls.zoomRestriction.maxDistance ||
			currentDistance < this._controls.zoomRestriction.minDistance
		) {
			const direction = vec3.normalize(
				vec3.create(),
				vec3.subtract(vec3.create(), position, target),
			);
			const distance = Math.max(
				this._controls.zoomRestriction.minDistance,
				Math.min(
					this._controls.zoomRestriction.maxDistance,
					currentDistance,
				),
			);
			vec3.add(
				position,
				vec3.multiply(
					position,
					direction,
					vec3.fromValues(distance, distance, distance),
				),
				target,
			);
		}

		// angle restrictions
		const minPolarAngle =
				this._controls.rotationRestriction.minPolarAngle *
				(Math.PI / 180),
			maxPolarAngle =
				this._controls.rotationRestriction.maxPolarAngle *
				(Math.PI / 180),
			minAzimuthAngle =
				this._controls.rotationRestriction.minAzimuthAngle *
				(Math.PI / 180),
			maxAzimuthAngle =
				this._controls.rotationRestriction.maxAzimuthAngle *
				(Math.PI / 180);

		if (
			minAzimuthAngle !== -Infinity ||
			maxAzimuthAngle !== Infinity ||
			minPolarAngle !== 0 ||
			maxPolarAngle !== 180 ||
			this._controls.enableAzimuthRotation === false ||
			this._controls.enablePolarRotation === false ||
			this._controls.enableObjectControls === true
		) {
			let offset = vec3.subtract(vec3.create(), position, target);
			vec3.transformQuat(offset, offset, this._quat);

			const spherical = new Spherical().fromVec3(offset);

			if (
				spherical.theta < minAzimuthAngle ||
				spherical.theta > maxAzimuthAngle ||
				spherical.phi < minPolarAngle ||
				spherical.phi > maxPolarAngle ||
				this._controls.enableAzimuthRotation === false ||
				this._controls.enablePolarRotation === false ||
				this._controls.enableObjectControls === true
			) {
				spherical.theta = Math.max(
					minAzimuthAngle,
					Math.min(maxAzimuthAngle, spherical.theta),
				);
				spherical.phi = Math.max(
					minPolarAngle,
					Math.min(maxPolarAngle, spherical.phi),
				);

				if (
					this._controls.enableAzimuthRotation === false ||
					this._controls.enablePolarRotation === false ||
					this._controls.enableObjectControls === true
				) {
					const defaultOffset = vec3.subtract(
						vec3.create(),
						this._controls.camera.defaultPosition,
						this._controls.camera.defaultTarget,
					);
					vec3.transformQuat(
						defaultOffset,
						defaultOffset,
						this._quat,
					);

					const defaultSpherical = new Spherical().fromVec3(
						defaultOffset,
					);
					if (this._controls.enableAzimuthRotation === false)
						spherical.theta = defaultSpherical.theta;
					if (this._controls.enablePolarRotation === false)
						spherical.phi = defaultSpherical.phi;

					if (this._controls.enableObjectControls) {
						spherical.theta = defaultSpherical.theta;
						spherical.phi = defaultSpherical.phi;
					}
				}

				spherical.makeSafe();
				offset = spherical.toVec3();
				vec3.transformQuat(offset, offset, this._quatInverse);
				vec3.add(position, offset, target);
			}

			if (
				(sceneRotation[1] < minAzimuthAngle ||
					sceneRotation[1] > maxAzimuthAngle ||
					sceneRotation[0] < minPolarAngle ||
					sceneRotation[0] > maxPolarAngle ||
					this._controls.enableAzimuthRotation === false ||
					this._controls.enablePolarRotation === false) &&
				this._controls.enableObjectControls === false
			) {
				sceneRotation[1] =
					this._controls.enableAzimuthRotation === false
						? 0
						: Math.max(
								minAzimuthAngle,
								Math.min(maxAzimuthAngle, sceneRotation[1]),
							);
				sceneRotation[0] =
					this._controls.enablePolarRotation === false
						? 0
						: Math.max(
								minPolarAngle,
								Math.min(maxPolarAngle, sceneRotation[0]),
							);
			}
		}

		return {position, target, sceneRotation};
	}

	public rotate(
		x: number,
		y: number,
		active: boolean,
		touch: boolean,
		time: number = performance.now(),
	): void {
		if (
			this._controls.camera.type === CAMERA_TYPE.ORTHOGRAPHIC &&
			(this._controls.camera as OrthographicCamera).direction !==
				ORTHOGRAPHIC_CAMERA_DIRECTION.CUSTOM
		)
			return;

		if (!active) {
			this._rotateStart = vec2.fromValues(x, y);
			this._rotationTracker.start(time);
			this.startGesture();
		} else {
			this._rotateEnd = vec2.fromValues(x, y);
			vec2.subtract(
				this._rotateDelta,
				this._rotateEnd,
				this._rotateStart,
			);
			vec2.copy(this._rotateStart, this._rotateEnd);

			if (!this._controls.canvas) return;
			if (
				this._controls.canvas.clientWidth == 0 ||
				this._controls.canvas.clientHeight == 0
			)
				return;

			const rotationSpeed =
				this._adjustedSettings.rotationSpeed() *
				(touch ? this._touchAdjustments.rotationSpeed : 1.0);
			const theta =
				-(rotationSpeed * this._rotateDelta[0]) /
				this._controls.canvas.clientHeight;
			const phi =
				-(rotationSpeed * this._rotateDelta[1]) /
				this._controls.canvas.clientHeight;
			if (theta === 0 && phi === 0) return;

			this._thetaDamper.add(theta);
			this._phiDamper.add(phi);
			this._rotationTracker.add(time, [theta, phi]);
			this._dragging = true;
			this._input = true;
		}
	}

	public stop(): void {
		this._thetaDamper.reset();
		this._phiDamper.reset();
		this._zoomDamper.reset();
		for (const damper of this._panDampers) damper.reset();
	}

	public update(time: number, animating: boolean): void {
		// a camera animation replaces whatever the input still had to do
		if (animating === true) this.stop();

		const position = this._controls.getPositionWithManualUpdates();
		const target = this._controls.getTargetWithManualUpdates();
		const offset = vec3.subtract(vec3.create(), position, target);
		vec3.transformQuat(offset, offset, this._quat);
		const spherical = new Spherical();
		spherical.fromVec3(offset);
		const distance = spherical.radius;

		const tau = this._pointerDown ? this.dragTau() : this.releaseTau();
		this.restrictGoal(spherical, tau);

		let theta = this._thetaDamper.step(time, tau, ANGLE_EPSILON);
		const phi = this._phiDamper.step(time, tau, ANGLE_EPSILON);
		const zoom = this._zoomDamper.step(time, tau, ZOOM_EPSILON);
		const panEpsilon = PAN_EPSILON * (distance > 0 ? distance : 1);
		const pan = vec3.fromValues(
			this._panDampers[0].step(time, tau, panEpsilon),
			this._panDampers[1].step(time, tau, panEpsilon),
			this._panDampers[2].step(time, tau, panEpsilon),
		);

		if (this._controls.enableAutoRotation)
			theta -= this._adjustedSettings.autoRotationSpeed() * time;

		// with turntable controls the scene turns instead of the camera
		const cameraTheta = this._controls.enableTurntableControls ? 0 : theta;

		const newTarget = vec3.add(vec3.create(), target, pan);
		let newPosition = vec3.add(vec3.create(), position, pan);
		if (distance > 0 && (cameraTheta !== 0 || phi !== 0 || zoom !== 0)) {
			spherical.theta += cameraTheta;
			spherical.phi += phi;
			spherical.radius = distance * Math.exp(zoom);

			const minAzimuthAngle =
					this._controls.rotationRestriction.minAzimuthAngle *
					(Math.PI / 180),
				maxAzimuthAngle =
					this._controls.rotationRestriction.maxAzimuthAngle *
					(Math.PI / 180);

			if (spherical.theta > Math.PI) {
				spherical.theta -= 2 * Math.PI;
				if (minAzimuthAngle > spherical.theta) {
					spherical.theta += 2 * Math.PI;
				}
			} else if (spherical.theta < -Math.PI) {
				spherical.theta += 2 * Math.PI;
				if (maxAzimuthAngle < spherical.theta) {
					spherical.theta -= 2 * Math.PI;
				}
			}

			spherical.makeSafe();
			const newOffset = vec3.transformQuat(
				vec3.create(),
				spherical.toVec3(),
				this._quatInverse,
			);
			newPosition = vec3.add(vec3.create(), newTarget, newOffset);
		}

		if (!vec3.exactEquals(newTarget, target))
			this._controls.applyTargetVector(
				vec3.subtract(vec3.create(), newTarget, target),
			);
		if (!vec3.exactEquals(newPosition, position))
			this._controls.applyPositionVector(
				vec3.subtract(vec3.create(), newPosition, position),
			);

		if (theta !== 0 || phi !== 0) {
			if (this._controls.enableTurntableControls)
				this._controls.applyRotation([0, theta]);
			if (this._controls.enableObjectControls)
				this._controls.applyRotation([phi, theta]);
		}
	}

	public zoom(
		x: number,
		y: number,
		active: boolean,
		touch: boolean,
		time: number = performance.now(),
	): void {
		const distance = Math.sqrt(x * x + y * y);

		if (!active) {
			this._dollyStart = distance;
			this._zoomTracker.start(time);
			this.startGesture();
		} else {
			this._dollyEnd = distance;
			this._dollyDelta = this._dollyEnd - this._dollyStart;
			this._dollyStart = this._dollyEnd;
			if (this._dollyDelta === 0) return;

			const delta =
				-this._dollyDelta *
				this._adjustedSettings.zoomSpeed() *
				(touch ? this._touchAdjustments.zoomSpeed : 1.0);

			this._zoomDamper.add(delta);
			this._zoomTracker.add(time, [delta]);
			this._dragging = true;
			this._input = true;
		}
	}

	public zoomStep(steps: number): void {
		this._zoomDamper.add(
			-steps * this._adjustedSettings.zoomSpeed() * IMPULSE_GAIN,
		);
		this._input = true;
	}

	// #endregion Public Methods (15)

	// #region Private Methods (7)

	private addPan(offset: vec3): void {
		for (let i = 0; i < 3; i++) this._panDampers[i].add(offset[i]);
	}

	/**
	 * The time constant in milliseconds while a pointer is down.
	 */
	private dragTau(): number {
		return (
			Math.max(0, this._adjustedSettings.movementSmoothness()) *
			SMOOTHNESS_TIME
		);
	}

	/**
	 * The time constant in milliseconds of the inertia: the remaining motion
	 * shrinks by the damping setting every {@link REFERENCE_FRAME}.
	 */
	private releaseTau(): number {
		const damping = this._adjustedSettings.damping();
		// 1 and anything that is not a number: no inertia
		if (!(damping < 1)) return 0;
		return -REFERENCE_FRAME / Math.log(1 - Math.max(0.01, damping));
	}

	/**
	 * A mouse button or a finger went down. It catches a camera that still
	 * moves from an earlier input.
	 */
	private startGesture(): void {
		if (!this._pointerDown) this.stop();
		this._pointerDown = true;
	}

	/**
	 * Keep the goals of the rotation and the zoom within the restrictions,
	 * so the camera stops at a limit instead of pushing into it.
	 */
	private restrictGoal(spherical: Spherical, tau: number): void {
		const clamp = (damper: Damper, min: number, max: number) => {
			// A camera outside of the limits is put back by restrict(), that
			// is no way the camera still has to go.
			min = Math.min(0, min);
			max = Math.max(0, max);
			if (!(min <= max)) return;
			const remaining = Math.max(min, Math.min(max, damper.remaining));
			if (remaining === damper.remaining) return;
			damper.remaining = remaining;
			// do not run past the new goal
			const limit = tau > 0 ? Math.abs(remaining) / tau : 0;
			damper.velocity =
				Math.sign(remaining) *
				Math.min(
					limit,
					Math.max(0, Math.sign(remaining) * damper.velocity),
				);
		};

		if (spherical.radius > 0) {
			const zoomRestriction = this._controls.zoomRestriction;
			clamp(
				this._zoomDamper,
				Math.log(
					Math.max(0, zoomRestriction.minDistance) / spherical.radius,
				),
				Math.log(zoomRestriction.maxDistance / spherical.radius),
			);
		}

		// with object controls the object turns freely, the camera stays
		if (this._controls.enableObjectControls) return;

		const restriction = this._controls.rotationRestriction;
		const toRadians = Math.PI / 180;

		if (this._controls.enablePolarRotation === false) {
			this._phiDamper.reset();
		} else if (spherical.radius > 0) {
			clamp(
				this._phiDamper,
				Math.max(restriction.minPolarAngle * toRadians, POLE_EPSILON) -
					spherical.phi,
				Math.min(
					restriction.maxPolarAngle * toRadians,
					Math.PI - POLE_EPSILON,
				) - spherical.phi,
			);
		}

		if (this._controls.enableAzimuthRotation === false) {
			this._thetaDamper.reset();
		} else {
			const theta = this._controls.enableTurntableControls
				? this._controls.sceneRotation[1]
				: spherical.theta;
			const min = restriction.minAzimuthAngle * toRadians;
			const max = restriction.maxAzimuthAngle * toRadians;
			if (
				(min !== -Infinity || max !== Infinity) &&
				theta >= min &&
				theta <= max
			)
				clamp(this._thetaDamper, min - theta, max - theta);
		}
	}

	private panDeltaToOffset(panDelta: vec2): vec3 {
		const offset = vec3.create();
		const panOffset = vec3.create();

		if (!this._controls.canvas) return offset;
		if (
			this._controls.canvas.clientWidth == 0 ||
			this._controls.canvas.clientHeight == 0
		)
			return offset;

		// perspective
		vec3.subtract(
			offset,
			this._controls.getPositionWithManualUpdates(),
			this._controls.getTargetWithManualUpdates(),
		);
		if (this._controls.camera instanceof OrthographicCamera) {
			const orthographicCamera: OrthographicCamera = <OrthographicCamera>(
				this._controls.camera
			);
			const mat = mat4.targetTo(
				mat4.create(),
				orthographicCamera.position,
				orthographicCamera.target,
				orthographicCamera.up,
			);

			// // we use only clientHeight here so aspect ratio does not distort speed
			// // left
			const v1 = vec3.fromValues(mat[0], mat[1], mat[2]);
			const scalar1 = -(
				(
					(panDelta[0] *
						(orthographicCamera.right - orthographicCamera.left) *
						0.5) /
					this._controls.canvas?.clientHeight
				) /** orthographicCamera.zoom */
			);
			vec3.multiply(v1, v1, vec3.fromValues(scalar1, scalar1, scalar1));
			vec3.add(panOffset, panOffset, v1);

			// // up
			const v2 = vec3.fromValues(mat[4], mat[5], mat[6]);
			const scalar2 =
				(panDelta[1] *
					(orthographicCamera.right - orthographicCamera.left) *
					0.5) /
				this._controls.canvas
					?.clientHeight; /** orthographicCamera.zoom */
			vec3.multiply(v2, v2, vec3.fromValues(scalar2, scalar2, scalar2));
			vec3.add(panOffset, panOffset, v2);
		} else {
			let targetDistance = vec3.length(offset);

			// half of the fov is center to top of screen
			targetDistance *= Math.tan(
				(((<PerspectiveCamera>this._controls.camera).fov / 2) *
					Math.PI) /
					180.0,
			);

			// we use only clientHeight here so aspect ratio does not distort speed
			// left
			const mat = mat4.targetTo(
				mat4.create(),
				this._controls.camera.position,
				this._controls.camera.target,
				vec3.fromValues(0, 0, 1),
			);

			const v1 = vec3.fromValues(mat[0], mat[1], mat[2]);
			const scalar1 = -(
				(2 * panDelta[0] * targetDistance) /
				this._controls.canvas?.clientHeight
			);
			vec3.multiply(v1, v1, vec3.fromValues(scalar1, scalar1, scalar1));
			vec3.add(panOffset, panOffset, v1);

			// // up
			const v2 = vec3.fromValues(mat[4], mat[5], mat[6]);
			const scalar2 =
				(2 * panDelta[1] * targetDistance) /
				this._controls.canvas?.clientHeight;
			vec3.multiply(v2, v2, vec3.fromValues(scalar2, scalar2, scalar2));
			vec3.add(panOffset, panOffset, v2);
		}

		return vec3.clone(panOffset);
	}

	// #endregion Private Methods (7)
}
