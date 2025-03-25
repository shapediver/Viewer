import {IRenderingEngine} from "@shapediver/viewer.rendering-engine.rendering-engine";
import {IOrthographicCameraSettings} from "@shapediver/viewer.settings";
import {Box, IBox} from "@shapediver/viewer.shared.math";
import {ITree, Tree} from "@shapediver/viewer.shared.node-tree";
import {
	Converter,
	DomEventEngine,
	Logger,
	SettingsEngine,
	ShapeDiverViewerCameraError,
} from "@shapediver/viewer.shared.services";
import {mat4, vec2, vec3} from "gl-matrix";
import {
	IOrthographicCamera,
	ORTHOGRAPHIC_CAMERA_DIRECTION,
} from "../../interfaces/camera/IOrthographicCamera";
import {ICameraControls} from "../../interfaces/controls/ICameraControls";
import {CAMERA_TYPE} from "../../interfaces/ICameraEngine";
import {OrthographicCameraControls} from "../controls/OrthographicCameraControls";
import {AbstractCamera} from "./AbstractCamera";

export class OrthographicCamera
	extends AbstractCamera
	implements IOrthographicCamera
{
	// #region Properties (11)

	readonly #converter: Converter = Converter.instance;
	readonly #logger: Logger = Logger.instance;
	readonly #tree: ITree = Tree.instance;

	#bottom: number = -100;
	#direction: ORTHOGRAPHIC_CAMERA_DIRECTION =
		ORTHOGRAPHIC_CAMERA_DIRECTION.CUSTOM;
	#domEventEngine?: DomEventEngine;
	#left: number = -100;
	#right: number = 100;
	#top: number = 100;
	#up: vec3 = vec3.fromValues(0, 0, 1);

	protected _controls: ICameraControls;

	// #endregion Properties (11)

	// #region Constructors (1)

	constructor(id: string, version?: string, isDefault: boolean = false) {
		super(id, CAMERA_TYPE.ORTHOGRAPHIC, version, isDefault);
		this._controls = new OrthographicCameraControls(this, true);
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (14)

	public get bottom(): number {
		return this.#bottom;
	}

	public set bottom(value: number) {
		this.#bottom = value;
	}

	public get controls(): ICameraControls {
		return this._controls;
	}

	public set controls(value: ICameraControls) {
		this._controls = value;
	}

	public get direction(): ORTHOGRAPHIC_CAMERA_DIRECTION {
		return this.#direction;
	}

	public set direction(value: ORTHOGRAPHIC_CAMERA_DIRECTION) {
		const changedDirection = this.#direction !== value;

		this.#direction = value;
		switch (this.#direction) {
			case ORTHOGRAPHIC_CAMERA_DIRECTION.TOP:
			case ORTHOGRAPHIC_CAMERA_DIRECTION.BOTTOM:
				this.up = vec3.fromValues(0, 1, 0);
				break;
			case ORTHOGRAPHIC_CAMERA_DIRECTION.RIGHT:
			case ORTHOGRAPHIC_CAMERA_DIRECTION.LEFT:
				this.up = vec3.fromValues(0, 0, 1);
				break;
			case ORTHOGRAPHIC_CAMERA_DIRECTION.BACK:
			case ORTHOGRAPHIC_CAMERA_DIRECTION.FRONT:
				this.up = vec3.fromValues(0, 0, 1);
				break;
			default:
				this.up = vec3.fromValues(0, 0, 1);
		}

		if (changedDirection) {
			const {position, target} = this.calculateZoomTo(undefined);
			this.defaultPosition = vec3.clone(position);
			this.defaultTarget = vec3.clone(target);

			this.position = vec3.clone(position);
			this.target = vec3.clone(target);
		}
	}

	public get left(): number {
		return this.#left;
	}

	public set left(value: number) {
		this.#left = value;
	}

	public get right(): number {
		return this.#right;
	}

	public set right(value: number) {
		this.#right = value;
	}

	public get top(): number {
		return this.#top;
	}

	public set top(value: number) {
		this.#top = value;
	}

	public get up(): vec3 {
		return this.#up;
	}

	public set up(value: vec3) {
		this.#up = value;
	}

	// #endregion Public Getters And Setters (14)

	// #region Public Methods (6)

	public applySettings(settingsEngine: SettingsEngine) {
		const cameraSetting = <IOrthographicCameraSettings>(
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
		(<OrthographicCameraControls>this._controls).applySettings(
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
			(<OrthographicCameraControls>this._controls)
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

		const target = vec3.fromValues(
			(box.max[0] + box.min[0]) / 2,
			(box.max[1] + box.min[1]) / 2,
			(box.max[2] + box.min[2]) / 2,
		);
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

		const factor = 2 * box.boundingSphere.radius * this.zoomExtentsFactor;

		switch (this.#direction) {
			case ORTHOGRAPHIC_CAMERA_DIRECTION.TOP:
				return {
					position: vec3.fromValues(
						target[0],
						target[1],
						target[2] + factor,
					),
					target: vec3.clone(target),
				};
			case ORTHOGRAPHIC_CAMERA_DIRECTION.BOTTOM:
				return {
					position: vec3.fromValues(
						target[0],
						target[1],
						target[2] - factor,
					),
					target: vec3.clone(target),
				};
			case ORTHOGRAPHIC_CAMERA_DIRECTION.RIGHT:
				return {
					position: vec3.fromValues(
						target[0] + factor,
						target[1],
						target[2],
					),
					target: vec3.clone(target),
				};
			case ORTHOGRAPHIC_CAMERA_DIRECTION.LEFT:
				return {
					position: vec3.fromValues(
						target[0] - factor,
						target[1],
						target[2],
					),
					target: vec3.clone(target),
				};
			case ORTHOGRAPHIC_CAMERA_DIRECTION.BACK:
				return {
					position: vec3.fromValues(
						target[0],
						target[1] + factor,
						target[2],
					),
					target: vec3.clone(target),
				};
			case ORTHOGRAPHIC_CAMERA_DIRECTION.FRONT:
				return {
					position: vec3.fromValues(
						target[0],
						target[1] - factor,
						target[2],
					),
					target: vec3.clone(target),
				};
			default: {
				// get the direction from the starting position to the starting target
				const direction = vec3.subtract(
					vec3.create(),
					startingPosition,
					target,
				);
				// normalize the direction
				vec3.normalize(direction, direction);
				// get the new position
				return {
					position: vec3.add(
						vec3.create(),
						target,
						vec3.scale(vec3.create(), direction, factor),
					),
					target: vec3.clone(target),
				};
			}
		}
	}

	public clone(): IOrthographicCamera {
		return new OrthographicCamera(this.id, this.version);
	}

	public project(pos: vec3): vec2 {
		const m = mat4.targetTo(
			mat4.create(),
			this.position,
			this.target,
			this.up,
		);
		const p = mat4.ortho(
			mat4.create(),
			this.left,
			this.right,
			this.bottom,
			this.top,
			this.near,
			this.far,
		);
		let inverse = mat4.invert(mat4.create(), m);
		if (!inverse) inverse = mat4.create();
		vec3.transformMat4(pos, pos, inverse);
		vec3.transformMat4(pos, pos, p);
		return vec2.fromValues(pos[0], pos[1]);
	}

	public unproject(pos: vec3): vec3 {
		const m = mat4.targetTo(
			mat4.create(),
			this.position,
			this.target,
			this.up,
		);
		const p = mat4.ortho(
			mat4.create(),
			this.left,
			this.right,
			this.bottom,
			this.top,
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

	protected getProjectionMatrix(): mat4 | undefined {
		const distance = vec3.distance(this.position, this.target) / 2;
		if (distance === 0) return;

		return mat4.ortho(
			mat4.create(),
			this.#left,
			this.#right,
			this.#bottom,
			this.#top,
			this.near,
			this.far,
		);
	}

	// #endregion Protected Methods (1)
}
