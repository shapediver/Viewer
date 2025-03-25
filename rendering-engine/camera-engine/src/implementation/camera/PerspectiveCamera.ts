import {IRenderingEngine} from "@shapediver/viewer.rendering-engine.rendering-engine";
import {IPerspectiveCameraSettings} from "@shapediver/viewer.settings";
import {Box, IBox, Plane, Sphere} from "@shapediver/viewer.shared.math";
import {ITree, Tree} from "@shapediver/viewer.shared.node-tree";
import {
	Converter,
	DomEventEngine,
	SettingsEngine,
	ShapeDiverViewerCameraError,
} from "@shapediver/viewer.shared.services";
import {mat4, quat, vec2, vec3} from "gl-matrix";
import {IPerspectiveCamera} from "../../interfaces/camera/IPerspectiveCamera";
import {ICameraControls} from "../../interfaces/controls/ICameraControls";
import {CAMERA_TYPE} from "../../interfaces/ICameraEngine";
import {PerspectiveCameraControls} from "../controls/PerspectiveCameraControls";
import {AbstractCamera} from "./AbstractCamera";

export class PerspectiveCamera
	extends AbstractCamera
	implements IPerspectiveCamera
{
	// #region Properties (6)

	readonly #converter: Converter = Converter.instance;
	readonly #tree: ITree = Tree.instance;

	#aspect: number | undefined;
	#domEventEngine?: DomEventEngine;
	#fov: number = 60;

	protected _controls: ICameraControls;

	// #endregion Properties (6)

	// #region Constructors (1)

	constructor(
		id: string,
		version?: string,
		initialAspect?: number,
		isDefault: boolean = false,
	) {
		super(id, CAMERA_TYPE.PERSPECTIVE, version, isDefault);
		this.#aspect = initialAspect;
		this._controls = new PerspectiveCameraControls(this, true);
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (6)

	public get aspect(): number | undefined {
		return this.#aspect;
	}

	public set aspect(value: number | undefined) {
		this.#aspect = value;
	}

	public get controls(): ICameraControls {
		return this._controls;
	}

	public set controls(value: ICameraControls) {
		this._controls = value;
	}

	public get fov(): number {
		return this.#fov;
	}

	public set fov(value: number) {
		this.#fov = value;
	}

	// #endregion Public Getters And Setters (6)

	// #region Public Methods (6)

	public applySettings(settingsEngine: SettingsEngine) {
		const cameraSetting = <IPerspectiveCameraSettings>(
			settingsEngine.camera.cameras[this.id]
		);
		if (cameraSetting) {
			this.name = cameraSetting.name;
			this.autoAdjust = cameraSetting.autoAdjust;
			this.cameraMovementDuration = cameraSetting.cameraMovementDuration;
			this.enableCameraControls = cameraSetting.enableCameraControls;
			this.revertAtMouseUp = cameraSetting.revertAtMouseUp;
			this.revertAtMouseUpDuration =
				cameraSetting.revertAtMouseUpDuration;
			this.sceneRotation = vec2.fromValues(
				cameraSetting.sceneRotation.x,
				cameraSetting.sceneRotation.y,
			);
			this.zoomExtentsFactor = cameraSetting.zoomExtentsFactor;

			const position = this.#converter.toVec3(cameraSetting.position);
			const target = this.#converter.toVec3(cameraSetting.target);
			this.defaultPosition = vec3.clone(position);
			this.defaultTarget = vec3.clone(target);

			this.position = position;
			this.target = target;
			this.fov = cameraSetting.fov;
		}

		if (
			this.position[0] === this.target[0] &&
			this.position[1] === this.target[1] &&
			this.position[2] === this.target[2]
		) {
			if (this._viewportId) {
				this._stateEngine.viewportEngines[
					this._viewportId
				]?.boundingBoxCreated.then(async () => {
					await this.zoomTo(undefined, {duration: 0});
					this.defaultPosition = vec3.clone(this._controls.position);
					this.defaultTarget = vec3.clone(this._controls.target);
				});
			}
		}
		(<PerspectiveCameraControls>this._controls).applySettings(
			settingsEngine,
		);
	}

	public assignViewer(renderingEngine: IRenderingEngine): void {
		if (renderingEngine.closed)
			throw new ShapeDiverViewerCameraError(
				`OrthographicCamera(${this.id}).assignViewer: Viewer with id ${renderingEngine.id} not found.`,
			);

		this.assignViewerInternal(renderingEngine.id);
		this._controls.assignViewer(renderingEngine.id, renderingEngine.canvas);

		if (this.domEventListenerToken && this.#domEventEngine)
			this.#domEventEngine.removeDomEventListener(
				this.domEventListenerToken,
			);

		this.#domEventEngine = renderingEngine.domEventEngine;
		this.domEventListenerToken = this.#domEventEngine.addDomEventListener(
			(<PerspectiveCameraControls>this._controls)
				.cameraControlsEventDistribution,
		);

		this.boundingBox = this.#tree.root.boundingBox.clone();

		this._stateEngine.viewportEngines[
			renderingEngine.id
		]?.boundingBoxCreated.then(async () => {
			if (
				this.position[0] === this.target[0] &&
				this.position[1] === this.target[1] &&
				this.position[2] === this.target[2]
			)
				await this.zoomTo(undefined, {duration: 0});
		});
	}

	public calculateZoomTo(
		zoomTarget?: Box,
		startingPosition: vec3 = this.position,
		startingTarget: vec3 = this.target,
	): {position: vec3; target: vec3} {
		let box: IBox;

		// Part 1 - calculate the bounding box that we should zoom to
		if (!zoomTarget) {
			// complete scene
			box = this._boundingBox.clone();
		} else {
			// specified Box
			box = zoomTarget.clone();
		}

		if (box.isEmpty())
			return {position: vec3.create(), target: vec3.create()};

		const invalidInput =
			startingPosition[0] === startingTarget[0] &&
			startingPosition[1] === startingTarget[1] &&
			startingPosition[2] === startingTarget[2];
		const target = vec3.fromValues(
			(box.max[0] + box.min[0]) / 2,
			(box.max[1] + box.min[1]) / 2,
			(box.max[2] + box.min[2]) / 2,
		);

		// if the camera position and the target are the same, we set a corner position
		if (
			startingPosition[0] === startingTarget[0] &&
			startingPosition[1] === startingTarget[1] &&
			startingPosition[2] === startingTarget[2]
		)
			startingPosition = vec3.fromValues(
				target[0],
				target[1] - 7.5,
				target[2] + 5,
			);

		// extend box by the factor
		const boxDir = vec3.subtract(vec3.create(), box.max, target);
		vec3.multiply(
			boxDir,
			boxDir,
			invalidInput
				? vec3.fromValues(2, 2, 2)
				: vec3.fromValues(
						this.zoomExtentsFactor,
						this.zoomExtentsFactor,
						this.zoomExtentsFactor,
					),
		);
		box = new Box(
			vec3.subtract(vec3.create(), target, boxDir),
			vec3.add(vec3.create(), target, boxDir),
		);

		let direction = vec3.create();
		if (invalidInput) {
			direction = vec3.normalize(
				vec3.create(),
				vec3.subtract(vec3.create(), target, startingPosition),
			);
		} else {
			direction = vec3.normalize(
				vec3.create(),
				vec3.subtract(vec3.create(), startingTarget, startingPosition),
			);
		}

		const cross = vec3.normalize(
			vec3.create(),
			vec3.cross(vec3.create(), vec3.fromValues(0, 0, 1), direction),
		);
		const up = vec3.normalize(
			vec3.create(),
			vec3.cross(vec3.create(), cross, direction),
		);

		let position = vec3.add(
			vec3.create(),
			target,
			vec3.multiply(
				vec3.create(),
				direction,
				vec3.fromValues(-0.00000001, -0.00000001, -0.00000001),
			),
		);

		const points = [];
		points.push(vec3.fromValues(box.min[0], box.min[1], box.min[2]));
		points.push(vec3.fromValues(box.min[0], box.min[1], box.max[2]));
		points.push(vec3.fromValues(box.min[0], box.max[1], box.min[2]));
		points.push(vec3.fromValues(box.min[0], box.max[1], box.max[2]));
		points.push(vec3.fromValues(box.max[0], box.min[1], box.min[2]));
		points.push(vec3.fromValues(box.max[0], box.min[1], box.max[2]));
		points.push(vec3.fromValues(box.max[0], box.max[1], box.min[2]));
		points.push(vec3.fromValues(box.max[0], box.max[1], box.max[2]));

		const fovDown = vec3.normalize(
			vec3.create(),
			vec3.transformQuat(
				vec3.create(),
				direction,
				quat.setAxisAngle(
					quat.create(),
					cross,
					(this.fov / 2) * (Math.PI / 180),
				),
			),
		);
		const fovUp = vec3.normalize(
			vec3.create(),
			vec3.transformQuat(
				vec3.create(),
				direction,
				quat.setAxisAngle(
					quat.create(),
					cross,
					-(this.fov / 2) * (Math.PI / 180),
				),
			),
		);

		const aspect = invalidInput ? 1.5 : this.aspect || 1.5;
		const hFoV =
			2 * Math.atan(Math.tan((this.fov * Math.PI) / 180 / 2) * aspect);
		const fovRight = vec3.normalize(
			vec3.create(),
			vec3.transformQuat(
				vec3.create(),
				direction,
				quat.setAxisAngle(quat.create(), up, hFoV / 2),
			),
		);
		const fovLeft = vec3.normalize(
			vec3.create(),
			vec3.transformQuat(
				vec3.create(),
				direction,
				quat.setAxisAngle(quat.create(), up, -hFoV / 2),
			),
		);

		const planeCross = new Plane(vec3.clone(cross), 0);
		planeCross.setFromNormalAndCoplanarPoint(
			vec3.clone(cross),
			vec3.clone(target),
		);

		const planeUp = new Plane(vec3.fromValues(0, 0, 1), 0);
		planeUp.setFromNormalAndCoplanarPoint(
			vec3.clone(up),
			vec3.clone(target),
		);

		let distanceCamera = 0.0;
		for (let i = 0; i < points.length; i++) {
			let projected = planeCross.clampPoint(points[i]);
			let toP = vec3.normalize(
				vec3.create(),
				vec3.subtract(vec3.create(), projected, position),
			);

			if (vec3.dot(direction, fovDown) > vec3.dot(direction, toP)) {
				const currentDir = vec3.multiply(
					vec3.create(),
					vec3.dot(fovDown, toP) > vec3.dot(fovUp, toP)
						? fovDown
						: fovUp,
					vec3.fromValues(-1, -1, -1),
				);
				const distance = planeUp.intersect(projected, currentDir);
				if (distance) {
					const cameraPoint = vec3.add(
						vec3.create(),
						vec3.multiply(
							vec3.create(),
							currentDir,
							vec3.fromValues(distance, distance, distance),
						),
						projected,
					);
					distanceCamera = Math.max(
						distanceCamera,
						vec3.distance(target, cameraPoint),
					);
				}
			}

			projected = planeUp.clampPoint(points[i]);
			toP = vec3.normalize(
				vec3.create(),
				vec3.subtract(vec3.create(), projected, position),
			);

			if (vec3.dot(direction, fovRight) > vec3.dot(direction, toP)) {
				const currentDir = vec3.multiply(
					vec3.create(),
					vec3.dot(fovRight, toP) > vec3.dot(fovLeft, toP)
						? fovRight
						: fovLeft,
					vec3.fromValues(-1, -1, -1),
				);
				const distance = planeCross.intersect(projected, currentDir);
				if (distance) {
					const cameraPoint = vec3.add(
						vec3.create(),
						vec3.multiply(
							vec3.create(),
							currentDir,
							vec3.fromValues(distance, distance, distance),
						),
						projected,
					);
					distanceCamera = Math.max(
						distanceCamera,
						vec3.distance(target, cameraPoint),
					);
				}
			}
		}

		position = vec3.add(
			vec3.create(),
			target,
			vec3.multiply(
				vec3.create(),
				direction,
				vec3.fromValues(
					-distanceCamera,
					-distanceCamera,
					-distanceCamera,
				),
			),
		);

		return {
			position,
			target,
		};
	}

	public clone(): IPerspectiveCamera {
		return new PerspectiveCamera(this.id, this.version, this.aspect);
	}

	public project(
		pos: vec3,
		position = this.position,
		target = this.target,
	): vec2 {
		const m = mat4.targetTo(
			mat4.create(),
			position,
			target,
			vec3.fromValues(0, 0, 1),
		);
		const aspect = this.aspect || 1.5;
		const p = mat4.perspective(
			mat4.create(),
			this.fov / (180 / Math.PI),
			aspect,
			this.near,
			this.far,
		);
		let inverse = mat4.invert(mat4.create(), m);
		if (!inverse) inverse = mat4.create();
		vec3.transformMat4(pos, pos, inverse);
		vec3.transformMat4(pos, pos, p);
		return vec2.fromValues(pos[0], pos[1]);
	}

	public unproject(
		pos: vec3,
		position = this.position,
		target = this.target,
	): vec3 {
		const m = mat4.targetTo(
			mat4.create(),
			position,
			target,
			vec3.fromValues(0, 0, 1),
		);
		const aspect = this.aspect || 1.5;
		const p = mat4.perspective(
			mat4.create(),
			this.fov / (180 / Math.PI),
			aspect,
			this.near,
			this.far,
		);
		let inverse = mat4.invert(mat4.create(), p);
		if (!inverse) inverse = mat4.create();
		vec3.transformMat4(pos, pos, inverse);
		vec3.transformMat4(pos, pos, m);
		return vec3.clone(pos);
	}

	// #endregion Public Methods (6)

	// #region Protected Methods (1)

	protected getProjectionMatrix(sphere: Sphere): mat4 | undefined {
		if (!this.aspect || sphere.radius === 0) return;

		const far =
			this.fov < 10
				? this.fov * 100.0 * 100 * sphere.radius
				: 100 * sphere.radius;
		const near =
			this.fov < 10
				? this.fov * 100.0 * 0.01 * sphere.radius
				: 0.01 * sphere.radius;
		return mat4.perspective(
			mat4.create(),
			this.fov / (180 / Math.PI),
			this.aspect,
			near,
			far,
		);
	}

	// #endregion Protected Methods (1)
}
