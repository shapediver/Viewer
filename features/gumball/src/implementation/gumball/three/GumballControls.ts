import {IRestrictionManager} from "@shapediver/viewer.rendering-engine.intersection-restriction-engine";
import {
	Camera,
	Intersection,
	Object3D,
	OrthographicCamera,
	Quaternion,
	Raycaster,
	Vector2,
	Vector3,
} from "three";
import {GumballGizmo} from "./GumballGizmo";
import {GumballPlane} from "./GumballPlane";
/* eslint-disable @typescript-eslint/no-explicit-any */

const _raycaster = new Raycaster();

const _tempVector = new Vector3();
const _tempVector2 = new Vector3();
const _tempQuaternion = new Quaternion();
const _unit = {
	X: new Vector3(1, 0, 0),
	Y: new Vector3(0, 1, 0),
	Z: new Vector3(0, 0, 1),
};

export enum TransformationType {
	TRANSLATION = "translation",
	ROTATION = "rotation",
	SCALE = "scale",
}

export class GumballControls extends Object3D {
	// #region Properties (59)

	private _axis: string | null = null;
	private _camera: Camera;
	private _cameraPosition: Vector3 = new Vector3();
	private _cameraQuaternion: Quaternion = new Quaternion();
	private _cameraScale: Vector3;
	private _dragging: boolean = false;
	private _enabled: boolean = true;
	private _endNorm: Vector3;
	private _eye: Vector3 = new Vector3();
	private _gizmo: GumballGizmo;
	private _hovering: boolean = false;
	private _mode?: TransformationType;
	private _object: Object3D | undefined = undefined;
	private _offset: Vector3;
	private _parentPosition: Vector3;
	private _parentQuaternion: Quaternion;
	private _parentQuaternionInv: Quaternion = new Quaternion();
	private _parentScale: Vector3;
	private _pivotDragged: boolean = false;
	private _plane: GumballPlane;
	private _pointEnd: Vector3 = new Vector3();
	private _pointStart: Vector3 = new Vector3();
	private _positionStart: Vector3;
	private _quaternionStart: Quaternion;
	private _restrictionManager?: IRestrictionManager;
	private _rotationAngle: number = 0;
	private _rotationAxis: Vector3 = new Vector3();
	private _rotationSnap: number | null = null;
	private _scaleSnap: number | null = null;
	private _scaleStart: Vector3;
	private _showX: boolean = true;
	private _showY: boolean = true;
	private _showZ: boolean = true;
	private _size: number = 1;
	private _space: string = "local";
	private _startNorm: Vector3;
	private _translationSnap: number | null = null;
	private _updateCallback: (() => void) | undefined;
	private _updateMatricesCallback: (() => void) | undefined;
	private _worldPosition: Vector3 = new Vector3();
	private _worldPositionStart: Vector3 = new Vector3();
	private _worldQuaternion: Quaternion = new Quaternion();
	private _worldQuaternionInv: Quaternion;
	private _worldQuaternionStart: Quaternion = new Quaternion();
	private _worldScale: Vector3;
	private _worldScaleStart: Vector3;

	public domElement: HTMLElement;
	public isGumballControls: boolean;

	// #endregion Properties (59)

	// #region Constructors (1)

	constructor(
		camera: Camera,
		domElement?: HTMLElement,
		restrictionManager?: IRestrictionManager,
		updateCallback?: () => void,
		updateMatricesCallback?: () => void,
	) {
		super();

		this.userData.ambientOcclusion = false;

		this._camera = camera;
		this._restrictionManager = restrictionManager;
		this._updateCallback = updateCallback;
		this._updateMatricesCallback = updateMatricesCallback;

		if (domElement === undefined) {
			console.warn(
				'THREE.GumballControls: The second parameter "domElement" is now mandatory.',
			);
			domElement = document as unknown as HTMLElement;
		}

		this.isGumballControls = true;

		this.visible = false;
		this.domElement = domElement;
		this.domElement.style.touchAction = "none"; // disable touch scroll

		const _gizmo = new GumballGizmo(this);
		this._gizmo = _gizmo;
		this.add(_gizmo);

		const _plane = new GumballPlane(this);
		this._plane = _plane;
		this.add(_plane);

		// Define properties with getters/setter
		// Setting the defined property will automatically trigger change event
		// Defined properties are passed down to gizmo and plane

		this._offset = new Vector3();
		this._startNorm = new Vector3();
		this._endNorm = new Vector3();
		this._cameraScale = new Vector3();

		this._parentPosition = new Vector3();
		this._parentQuaternion = new Quaternion();
		this._parentQuaternion = new Quaternion();
		this._parentScale = new Vector3();

		this._worldScaleStart = new Vector3();
		this._worldQuaternionInv = new Quaternion();
		this._worldScale = new Vector3();

		this._positionStart = new Vector3();
		this._quaternionStart = new Quaternion();
		this._scaleStart = new Vector3();
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (66)

	public get axis(): string | null {
		return this._axis;
	}

	public set axis(value: string | null) {
		this._axis = value;
	}

	public get camera(): Camera {
		return this._camera;
	}

	public get cameraPosition(): Vector3 {
		return this._cameraPosition;
	}

	public get cameraQuaternion(): Quaternion {
		return this._cameraQuaternion;
	}

	public get dragging(): boolean {
		return this._dragging;
	}

	public set dragging(value: boolean) {
		this._dragging = value;
		this.dispatchEvent({type: "dragging-changed", value} as any);
	}

	public get enabled(): boolean {
		return this._enabled;
	}

	public set enabled(value: boolean) {
		this._enabled = value;
	}

	public get eye(): Vector3 {
		return this._eye;
	}

	public get gizmo(): GumballGizmo {
		return this._gizmo;
	}

	public get hovering(): boolean {
		return this._hovering;
	}

	public get mode(): TransformationType | undefined {
		return this._mode;
	}

	public set mode(value: TransformationType | undefined) {
		this._mode = value;
	}

	public get object(): Object3D | undefined {
		return this._object;
	}

	public set object(value: Object3D | undefined) {
		this._object = value;
	}

	public get pivotDragged(): boolean {
		return this._pivotDragged;
	}

	public set pivotDragged(value: boolean) {
		this._pivotDragged = value;
	}

	public get pointEnd(): Vector3 {
		return this._pointEnd;
	}

	public get pointStart(): Vector3 {
		return this._pointStart;
	}

	public get rotationAngle(): number {
		return this._rotationAngle;
	}

	public set rotationAngle(value: number) {
		this._rotationAngle = value;
	}

	public get rotationAxis(): Vector3 {
		return this._rotationAxis;
	}

	public get rotationSnap(): number | null {
		return this._rotationSnap;
	}

	public set rotationSnap(value: number | null) {
		this._rotationSnap = value;
	}

	public get scaleSnap(): number | null {
		return this._scaleSnap;
	}

	public set scaleSnap(value: number | null) {
		this._scaleSnap = value;
	}

	public get showX(): boolean {
		return this._showX;
	}

	public set showX(value: boolean) {
		this._showX = value;
	}

	public get showY(): boolean {
		return this._showY;
	}

	public set showY(value: boolean) {
		this._showY = value;
	}

	public get showZ(): boolean {
		return this._showZ;
	}

	public set showZ(value: boolean) {
		this._showZ = value;
	}

	public get size(): number {
		return this._size;
	}

	public set size(value: number) {
		this._size = value;
	}

	public get space(): string {
		return this._space;
	}

	public set space(value: string) {
		this._space = value;
	}

	public get translationSnap(): number | null {
		return this._translationSnap;
	}

	public set translationSnap(value: number | null) {
		this._translationSnap = value;
	}

	public get worldPosition(): Vector3 {
		return this._worldPosition;
	}

	public get worldPositionStart(): Vector3 {
		return this._worldPositionStart;
	}

	public get worldQuaternion(): Quaternion {
		return this._worldQuaternion;
	}

	public get worldQuaternionStart(): Quaternion {
		return this._worldQuaternionStart;
	}

	// #endregion Public Getters And Setters (66)

	// #region Public Methods (21)

	// Set current object
	public attach(object: Object3D) {
		this.object = object;
		this.visible = true;

		return this;
	}

	// Detach from object
	public detach() {
		this.object = undefined;
		this.visible = false;
		this.axis = null;

		return this;
	}

	public dispose() {
		this.traverse(function (child) {
			if ((child as any).geometry) (child as any).geometry.dispose();
			if ((child as any).material) (child as any).material.dispose();
		});
	}

	public getPointer(event: PointerEvent) {
		if (this.domElement.ownerDocument.pointerLockElement) {
			return {
				x: 0,
				y: 0,
				button: event.button,
			};
		} else {
			const rect = this.domElement.getBoundingClientRect();

			return {
				x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
				y: (-(event.clientY - rect.top) / rect.height) * 2 + 1,
				button: event.button,
			};
		}
	}

	public getRaycaster() {
		return _raycaster;
	}

	public intersectObjectWithRay(
		object: Object3D,
		raycaster: Raycaster,
		includeInvisible: boolean,
	) {
		const allIntersections = raycaster.intersectObject(object, true);

		for (let i = 0; i < allIntersections.length; i++) {
			if (allIntersections[i].object.visible || includeInvisible) {
				return allIntersections[i];
			}
		}

		return false;
	}

	public onPointerDown(event: PointerEvent) {
		if (!this.enabled) return;

		if (!document.pointerLockElement) {
			this.domElement.setPointerCapture(event.pointerId);
		}

		this.pointerHover(this.getPointer(event));
		this.pointerDown(this.getPointer(event));
	}

	public onPointerHover(event: PointerEvent) {
		if (!this.enabled) return;

		switch (event.pointerType) {
			case "mouse":
			case "pen":
				this.pointerHover(this.getPointer(event));
				break;
		}
	}

	public onPointerMove(event: PointerEvent) {
		if (!this.enabled) return;

		this.pointerMove(this.getPointer(event));
	}

	public onPointerUp(event: PointerEvent) {
		if (!this.enabled) return;

		this.domElement.releasePointerCapture(event.pointerId);

		this.pointerUp(this.getPointer(event));
	}

	public pointerDown(pointer: {x: number; y: number; button: any}) {
		if (
			this.object === undefined ||
			this.dragging === true ||
			(pointer != null && pointer.button !== 0)
		)
			return;

		if (this.axis !== null) {
			if (pointer !== null)
				_raycaster.setFromCamera(
					pointer as unknown as Vector2,
					this.camera,
				);

			const planeIntersect = this.intersectObjectWithRay(
				this._plane,
				_raycaster,
				true,
			);

			if (planeIntersect) {
				this.object.updateMatrixWorld();
				this.object?.parent?.updateMatrixWorld();

				this._positionStart.copy(this.object.position);
				this._quaternionStart.copy(this.object.quaternion);
				this._scaleStart.copy(this.object.scale);

				this.object.matrixWorld.decompose(
					this.worldPositionStart,
					this.worldQuaternionStart,
					this._worldScaleStart,
				);

				this.pointStart
					.copy(planeIntersect.point)
					.sub(this.worldPositionStart);
			}

			this.dragging = true;
		}
	}

	public pointerHover(pointer: {x: number; y: number; button: any}) {
		if (this.object === undefined || this.dragging === true) return;

		if (pointer !== null)
			_raycaster.setFromCamera(
				pointer as unknown as Vector2,
				this.camera,
			);

		const intersections: {
			mode: TransformationType;
			intersection: Intersection;
		}[] = [];

		if (this._gizmo.enableTranslation) {
			const intersection = this.intersectObjectWithRay(
				this._gizmo.picker.translate,
				_raycaster,
				true,
			);
			if (intersection) {
				intersections.push({
					mode: TransformationType.TRANSLATION,
					intersection,
				});
			}
		}

		if (this._gizmo.enableRotation) {
			const intersection = this.intersectObjectWithRay(
				this._gizmo.picker.rotate,
				_raycaster,
				true,
			);
			if (intersection) {
				intersections.push({
					mode: TransformationType.ROTATION,
					intersection,
				});
			}
		}

		if (this._gizmo.enableScaling && this.space === "local") {
			const intersection = this.intersectObjectWithRay(
				this._gizmo.picker.scale,
				_raycaster,
				true,
			);
			if (intersection) {
				intersections.push({
					mode: TransformationType.SCALE,
					intersection,
				});
			}
		}

		intersections.sort(
			(a, b) => a.intersection.distance - b.intersection.distance,
		);

		if (intersections.length > 0) {
			this.axis = intersections[0].intersection.object.name;
			this.mode = intersections[0].mode;
		} else {
			this.axis = null;
			this.mode = undefined;
		}

		this._hovering = intersections.length > 0;
	}

	public pointerMove(pointer: {x: number; y: number; button: any}) {
		const axis = this.axis;
		const object = this.object;
		let space = this.space;

		if (axis === "E" || axis === "XYZE" || axis === "XYZ") {
			space = "world";
		}

		if (
			object === undefined ||
			axis === null ||
			this.dragging === false ||
			(pointer !== null && pointer.button !== -1)
		)
			return;

		if (pointer !== null)
			_raycaster.setFromCamera(
				pointer as unknown as Vector2,
				this.camera,
			);

		const planeIntersect = this.intersectObjectWithRay(
			this._plane,
			_raycaster,
			true,
		);

		if (!planeIntersect) return;

		this.pointEnd.copy(planeIntersect.point).sub(this.worldPositionStart);

		if (this.mode === TransformationType.TRANSLATION) {
			if (this._restrictionManager)
				this._restrictionManager.showRestrictionVisualization = true;

			// Apply translate

			this._offset.copy(this.pointEnd).sub(this.pointStart);

			if (space === "local" && axis !== "XYZ") {
				this._offset.applyQuaternion(this._worldQuaternionInv);
			}

			if (axis.indexOf("X") === -1) this._offset.x = 0;
			if (axis.indexOf("Y") === -1) this._offset.y = 0;
			if (axis.indexOf("Z") === -1) this._offset.z = 0;

			if (space === "local" && axis !== "XYZ") {
				this._offset
					.applyQuaternion(this._quaternionStart)
					.divide(this._parentScale);
			} else {
				this._offset
					.applyQuaternion(this._parentQuaternionInv)
					.divide(this._parentScale);
			}

			object.position.copy(this._offset).add(this._positionStart);

			// get the center of the gumball in world coordinates
			const center = new Vector3().copy(object.position);

			// use the camera to project the center into screen space
			const screenPosition = center.clone().project(this._camera);

			// store the raycaster origin and direction
			const rayOrigin = _raycaster.ray.origin.clone();
			const rayDirection = _raycaster.ray.direction.clone();

			// create a ray from the camera through the screen position
			_raycaster.setFromCamera(
				new Vector2(screenPosition.x, screenPosition.y),
				this._camera,
			);

			const restrictedPoint = this._restrictionManager
				? this._restrictionManager.rayTrace(
						{
							origin: [
								_raycaster.ray.origin.x,
								_raycaster.ray.origin.y,
								_raycaster.ray.origin.z,
							],
							direction: [
								_raycaster.ray.direction.x,
								_raycaster.ray.direction.y,
								_raycaster.ray.direction.z,
							],
						},
						{
							type: "gumball",
						},
					)
				: null;

			// reset the raycaster to its original state
			_raycaster.ray.origin.copy(rayOrigin);
			_raycaster.ray.direction.copy(rayDirection);

			// Apply translation snap
			if (restrictedPoint && restrictedPoint.point) {
				if (space === "local") {
					object.position.x = restrictedPoint.point[0];
					object.position.y = restrictedPoint.point[1];
					object.position.z = restrictedPoint.point[2];
				}

				if (space === "world") {
					if (object.parent) {
						object.position.add(
							_tempVector.setFromMatrixPosition(
								object.parent.matrixWorld,
							),
						);
					}
					object.position.x = restrictedPoint.point[0];
					object.position.y = restrictedPoint.point[1];
					object.position.z = restrictedPoint.point[2];

					if (object.parent) {
						object.position.sub(
							_tempVector.setFromMatrixPosition(
								object.parent.matrixWorld,
							),
						);
					}
				}
			}
		}

		if (this.mode === TransformationType.SCALE && space === "local") {
			if (axis.search("XYZ") !== -1) {
				let d = this.pointEnd.length() / this.pointStart.length();

				if (this.pointEnd.dot(this.pointStart) < 0) d *= -1;

				_tempVector2.set(d, d, d);
			} else {
				_tempVector.copy(this.pointStart);
				_tempVector2.copy(this.pointEnd);

				_tempVector.applyQuaternion(this._worldQuaternionInv);
				_tempVector2.applyQuaternion(this._worldQuaternionInv);

				_tempVector2.divide(_tempVector);

				if (axis.search("X") === -1) {
					_tempVector2.x = 1;
				}

				if (axis.search("Y") === -1) {
					_tempVector2.y = 1;
				}

				if (axis.search("Z") === -1) {
					_tempVector2.z = 1;
				}

				if (axis === "XY") {
					// assign the same scale to both x and y
					const avgScale = (_tempVector2.x + _tempVector2.y) / 2;
					_tempVector2.x = avgScale;
					_tempVector2.y = avgScale;
				}

				if (axis === "YZ") {
					// assign the same scale to both y and z
					const avgScale = (_tempVector2.y + _tempVector2.z) / 2;
					_tempVector2.y = avgScale;
					_tempVector2.z = avgScale;
				}

				if (axis === "XZ") {
					// assign the same scale to both x and z
					const avgScale = (_tempVector2.x + _tempVector2.z) / 2;
					_tempVector2.x = avgScale;
					_tempVector2.z = avgScale;
				}
			}

			// Apply scale

			object.scale.copy(this._scaleStart).multiply(_tempVector2);

			if (this.scaleSnap) {
				if (axis.search("X") !== -1) {
					object.scale.x =
						Math.round(object.scale.x / this.scaleSnap) *
							this.scaleSnap || this.scaleSnap;
				}

				if (axis.search("Y") !== -1) {
					object.scale.y =
						Math.round(object.scale.y / this.scaleSnap) *
							this.scaleSnap || this.scaleSnap;
				}

				if (axis.search("Z") !== -1) {
					object.scale.z =
						Math.round(object.scale.z / this.scaleSnap) *
							this.scaleSnap || this.scaleSnap;
				}
			}
		}

		if (this.mode === TransformationType.ROTATION) {
			this._offset.copy(this.pointEnd).sub(this.pointStart);

			const ROTATION_SPEED =
				20 /
				this.worldPosition.distanceTo(
					_tempVector.setFromMatrixPosition(this.camera.matrixWorld),
				);

			let _inPlaneRotation = false;

			if (axis === "XYZE") {
				this.rotationAxis
					.copy(this._offset)
					.cross(this.eye)
					.normalize();
				this.rotationAngle =
					this._offset.dot(
						_tempVector.copy(this.rotationAxis).cross(this.eye),
					) * ROTATION_SPEED;
			} else if (axis === "X" || axis === "Y" || axis === "Z") {
				this.rotationAxis.copy(_unit[axis]);

				_tempVector.copy(_unit[axis]);

				if (space === "local") {
					_tempVector.applyQuaternion(this.worldQuaternion);
				}

				_tempVector.cross(this.eye);

				// When _tempVector is 0 after cross with this.eye the vectors are parallel and should use in-plane rotation logic.
				if (_tempVector.length() === 0) {
					_inPlaneRotation = true;
				} else {
					this.rotationAngle =
						this._offset.dot(_tempVector.normalize()) *
						ROTATION_SPEED;
				}
			}

			if (axis === "E" || _inPlaneRotation) {
				this.rotationAxis.copy(this.eye);
				this.rotationAngle = this.pointEnd.angleTo(this.pointStart);

				this._startNorm.copy(this.pointStart).normalize();
				this._endNorm.copy(this.pointEnd).normalize();

				this.rotationAngle *=
					this._endNorm.cross(this._startNorm).dot(this.eye) < 0
						? 1
						: -1;
			}

			// Apply rotation snap

			if (this.rotationSnap)
				this.rotationAngle =
					Math.round(this.rotationAngle / this.rotationSnap) *
					this.rotationSnap;

			// Apply rotate
			if (space === "local" && axis !== "E" && axis !== "XYZE") {
				object.quaternion.copy(this._quaternionStart);
				object.quaternion
					.multiply(
						_tempQuaternion.setFromAxisAngle(
							this.rotationAxis,
							this.rotationAngle,
						),
					)
					.normalize();
			} else {
				this.rotationAxis.applyQuaternion(this._parentQuaternionInv);
				object.quaternion.copy(
					_tempQuaternion.setFromAxisAngle(
						this.rotationAxis,
						this.rotationAngle,
					),
				);
				object.quaternion.multiply(this._quaternionStart).normalize();
			}
		}

		if (this._updateCallback) this._updateCallback();
	}

	public pointerUp(pointer: {x: number; y: number; button: any}) {
		if (this._restrictionManager)
			this._restrictionManager.showRestrictionVisualization = false;
		if (pointer !== null && pointer.button !== 0) return;

		if (this.dragging && this.axis !== null) {
			if (this._updateMatricesCallback) this._updateMatricesCallback();
		}

		this.dragging = false;
		this.axis = null;
	}

	public reset() {
		if (!this.enabled) return;
		if (this._restrictionManager)
			this._restrictionManager.showRestrictionVisualization = false;

		if (this.dragging) {
			this.object?.position.copy(this._positionStart);
			this.object?.quaternion.copy(this._quaternionStart);
			this.object?.scale.copy(this._scaleStart);

			this.pointStart.copy(this.pointEnd);
		}
	}

	public setRotationSnap(rotationSnap: number) {
		this.rotationSnap = rotationSnap;
	}

	public setScaleSnap(scaleSnap: number) {
		this.scaleSnap = scaleSnap;
	}

	public setSize(size: number) {
		this.size = size;
	}

	public setSpace(space: string) {
		this.space = space;
	}

	public setTranslationSnap(translationSnap: number) {
		this.translationSnap = translationSnap;
	}

	// updateMatrixWorld updates key transformation variables
	public updateMatrixWorld(force: boolean = false) {
		if (this.object !== undefined) {
			this.object.updateMatrixWorld();

			if (this.object.parent === null) {
				console.error(
					"GumballControls: The attached 3D object must be a part of the scene graph.",
				);
			} else {
				this.object.parent.matrixWorld.decompose(
					this._parentPosition,
					this._parentQuaternion,
					this._parentScale,
				);
			}

			this.object.matrixWorld.decompose(
				this.worldPosition,
				this.worldQuaternion,
				this._worldScale,
			);

			this._parentQuaternionInv.copy(this._parentQuaternion).invert();
			this._worldQuaternionInv.copy(this.worldQuaternion).invert();
		}

		this.camera.updateMatrixWorld();
		this.camera.matrixWorld.decompose(
			this.cameraPosition,
			this.cameraQuaternion,
			this._cameraScale,
		);

		if ((this.camera as OrthographicCamera).isOrthographicCamera) {
			this.camera.getWorldDirection(this.eye).negate();
		} else {
			this.eye
				.copy(this.cameraPosition)
				.sub(this.worldPosition)
				.normalize();
		}

		super.updateMatrixWorld(force);
	}

	// #endregion Public Methods (21)
}
