import {ICameraControlsSettings} from "@shapediver/viewer.settings";
import {
	Converter,
	EventEngine,
	EVENTTYPE,
	SettingsEngine,
} from "@shapediver/viewer.shared.services";
import {ICameraOptions} from "@shapediver/viewer.shared.types";
import {mat4, vec2, vec3} from "gl-matrix";
import {ICamera} from "../../interfaces/camera/ICamera";
import {ICameraControls} from "../../interfaces/controls/ICameraControls";
import {ICameraControlsEventDistribution} from "../../interfaces/controls/ICameraControlsEventDistribution";
import {ICameraControlsLogic} from "../../interfaces/controls/ICameraControlsLogic";
import {CameraInterpolationManager} from "../interpolation/CameraInterpolationManager";

export abstract class AbstractCameraControls implements ICameraControls {
	// #region Properties (38)

	private readonly _cameraInterpolationManager: CameraInterpolationManager;
	private readonly _converter: Converter = Converter.instance;
	private readonly _eventEngine: EventEngine = EventEngine.instance;

	private _autoRotationSpeed: number = 0;
	private _canvas?: HTMLCanvasElement;
	private _cubePositionRestriction: {min: vec3; max: vec3} = {
		min: vec3.fromValues(-Infinity, -Infinity, -Infinity),
		max: vec3.fromValues(Infinity, Infinity, Infinity),
	};
	private _cubeTargetRestriction: {min: vec3; max: vec3} = {
		min: vec3.fromValues(-Infinity, -Infinity, -Infinity),
		max: vec3.fromValues(Infinity, Infinity, Infinity),
	};
	private _damping: number = 0.1;
	private _enableAutoRotation: boolean = false;
	private _enableAzimuthRotation: boolean = true;
	private _enableKeyPan: boolean = false;
	private _enableObjectControls: boolean = false;
	private _enablePan: boolean = true;
	private _enablePolarRotation: boolean = true;
	private _enableRotation: boolean = true;
	private _enableTurntableControls: boolean = false;
	private _enableZoom: boolean = true;
	private _input: {
		keys: {up: number; down: number; left: number; right: number};
		mouse: {rotate: number; zoom: number; pan: number};
		touch: {rotate: number; zoom: number; pan: number};
	} = {
		keys: {up: 38, down: 40, left: 37, right: 39},
		mouse: {rotate: 0, zoom: 1, pan: 2},
		touch: {rotate: 1, zoom: 2, pan: 2},
	};
	private _keyPanSpeed: number = 0.5;
	private _manualInteraction: boolean = false;
	private _manualInteractionTransformations: {
		position: {
			matrix?: mat4;
			vector?: vec3;
		}[];
		target: {
			matrix?: mat4;
			vector?: vec3;
		}[];
		sceneRotation: {
			theta: number;
			phi: number;
		}[];
	};
	private _movementSmoothness: number = 0.5;
	private _moving: boolean = false;
	private _movingDuration: number = 0;
	private _nonmanualInteraction: boolean = false;
	private _nonmanualInteractionTransformations: {
		position: {
			matrix?: mat4;
			vector?: vec3;
		}[];
		target: {
			matrix?: mat4;
			vector?: vec3;
		}[];
		sceneRotation: {
			theta: number;
			phi: number;
		}[];
	};
	private _objectControlsCenter: vec3 = vec3.create();
	private _panSpeed: number = 0.5;
	private _position: vec3 = vec3.create();
	private _rotationRestriction: {
		minPolarAngle: number;
		maxPolarAngle: number;
		minAzimuthAngle: number;
		maxAzimuthAngle: number;
	} = {
		minPolarAngle: 0,
		maxPolarAngle: 180,
		minAzimuthAngle: -Infinity,
		maxAzimuthAngle: Infinity,
	};
	private _rotationSpeed: number = 0.5;
	private _sceneRotation: vec2 = vec2.create();
	private _spherePositionRestriction: {center: vec3; radius: number} = {
		center: vec3.create(),
		radius: Infinity,
	};
	private _sphereTargetRestriction: {center: vec3; radius: number} = {
		center: vec3.create(),
		radius: Infinity,
	};
	private _target: vec3 = vec3.create();
	private _turntableCenter: vec3 = vec3.create();
	private _viewportId?: string;
	private _zoomRestriction: {minDistance: number; maxDistance: number} = {
		minDistance: 0,
		maxDistance: Infinity,
	};
	private _zoomSpeed: number = 0.5;

	protected _cameraControlsEventDistribution!: ICameraControlsEventDistribution;
	protected _cameraLogic!: ICameraControlsLogic;

	// #endregion Properties (38)

	// #region Constructors (1)

	constructor(
		private _camera: ICamera,
		private _enabled: boolean,
	) {
		this._cameraInterpolationManager = new CameraInterpolationManager(
			this._camera,
			this,
		);
		this._manualInteractionTransformations = {
			position: [],
			target: [],
			sceneRotation: [],
		};
		this._nonmanualInteractionTransformations = {
			position: [],
			target: [],
			sceneRotation: [],
		};
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (59)

	public get autoRotationSpeed(): number {
		return this._autoRotationSpeed;
	}

	public set autoRotationSpeed(value: number) {
		this._autoRotationSpeed = value;
	}

	public get camera(): ICamera {
		return this._camera;
	}

	public set camera(value: ICamera) {
		this._camera = value;
	}

	public get cameraControlsEventDistribution(): ICameraControlsEventDistribution {
		return this._cameraControlsEventDistribution;
	}

	public get canvas(): HTMLCanvasElement | undefined {
		return this._canvas;
	}

	public set canvas(value: HTMLCanvasElement | undefined) {
		this._canvas = value;
	}

	public get cubePositionRestriction(): {min: vec3; max: vec3} {
		return this._cubePositionRestriction;
	}

	public set cubePositionRestriction(value: {min: vec3; max: vec3}) {
		this._cubePositionRestriction = value;
	}

	public get cubeTargetRestriction(): {min: vec3; max: vec3} {
		return this._cubeTargetRestriction;
	}

	public set cubeTargetRestriction(value: {min: vec3; max: vec3}) {
		this._cubeTargetRestriction = value;
	}

	public get damping(): number {
		return this._damping;
	}

	public set damping(value: number) {
		this._damping = value;
	}

	public get enableAutoRotation(): boolean {
		return this._enableAutoRotation;
	}

	public set enableAutoRotation(value: boolean) {
		this._enableAutoRotation = value;
	}

	public get enableAzimuthRotation(): boolean {
		return this._enableAzimuthRotation;
	}

	public set enableAzimuthRotation(value: boolean) {
		this._enableAzimuthRotation = value;
	}

	public get enableKeyPan(): boolean {
		return this._enableKeyPan;
	}

	public set enableKeyPan(value: boolean) {
		this._enableKeyPan = value;
	}

	public get enableObjectControls(): boolean {
		return this._enableObjectControls;
	}

	public set enableObjectControls(value: boolean) {
		this._enableObjectControls = value;
	}

	public get enablePan(): boolean {
		return this._enablePan;
	}

	public set enablePan(value: boolean) {
		this._enablePan = value;
	}

	public get enablePolarRotation(): boolean {
		return this._enablePolarRotation;
	}

	public set enablePolarRotation(value: boolean) {
		this._enablePolarRotation = value;
	}

	public get enableRotation(): boolean {
		return this._enableRotation;
	}

	public set enableRotation(value: boolean) {
		this._enableRotation = value;
	}

	public get enableTurntableControls(): boolean {
		return this._enableTurntableControls;
	}

	public set enableTurntableControls(value: boolean) {
		this._enableTurntableControls = value;
	}

	public get enableZoom(): boolean {
		return this._enableZoom;
	}

	public set enableZoom(value: boolean) {
		this._enableZoom = value;
	}

	public get enabled(): boolean {
		return this._enabled;
	}

	public set enabled(value: boolean) {
		if (!value) {
			this._manualInteraction = false;
			this._manualInteractionTransformations = {
				position: [],
				target: [],
				sceneRotation: [],
			};
			this._nonmanualInteraction = false;
			this._nonmanualInteractionTransformations = {
				position: [],
				target: [],
				sceneRotation: [],
			};

			this._cameraControlsEventDistribution.reset();
			this._cameraLogic.reset();
		}
		this._enabled = value;
	}

	public get input(): {
		keys: {up: number; down: number; left: number; right: number};
		mouse: {rotate: number; zoom: number; pan: number};
		touch: {rotate: number; zoom: number; pan: number};
	} {
		return this._input;
	}

	public set input(value: {
		keys: {up: number; down: number; left: number; right: number};
		mouse: {rotate: number; zoom: number; pan: number};
		touch: {rotate: number; zoom: number; pan: number};
	}) {
		this._input = value;
	}

	public get keyPanSpeed(): number {
		return this._keyPanSpeed;
	}

	public set keyPanSpeed(value: number) {
		this._keyPanSpeed = value;
	}

	public get movementSmoothness(): number {
		return this._movementSmoothness;
	}

	public set movementSmoothness(value: number) {
		this._movementSmoothness = value;
	}

	public get objectControlsCenter(): vec3 {
		return this._objectControlsCenter;
	}

	public set objectControlsCenter(value: vec3) {
		this._objectControlsCenter = value;
	}

	public get panSpeed(): number {
		return this._panSpeed;
	}

	public set panSpeed(value: number) {
		this._panSpeed = value;
	}

	public get position(): vec3 {
		return this._position;
	}

	public set position(value: vec3) {
		this._position = value;
	}

	public get rotationRestriction(): {
		minPolarAngle: number;
		maxPolarAngle: number;
		minAzimuthAngle: number;
		maxAzimuthAngle: number;
	} {
		return this._rotationRestriction;
	}

	public set rotationRestriction(value: {
		minPolarAngle: number;
		maxPolarAngle: number;
		minAzimuthAngle: number;
		maxAzimuthAngle: number;
	}) {
		this._rotationRestriction = value;
	}

	public get rotationSpeed(): number {
		return this._rotationSpeed;
	}

	public set rotationSpeed(value: number) {
		this._rotationSpeed = value;
	}

	public get sceneRotation(): vec2 {
		return this._sceneRotation;
	}

	public set sceneRotation(value: vec2) {
		this._sceneRotation = value;
	}

	public get spherePositionRestriction(): {center: vec3; radius: number} {
		return this._spherePositionRestriction;
	}

	public set spherePositionRestriction(value: {
		center: vec3;
		radius: number;
	}) {
		this._spherePositionRestriction = value;
	}

	public get sphereTargetRestriction(): {center: vec3; radius: number} {
		return this._sphereTargetRestriction;
	}

	public set sphereTargetRestriction(value: {center: vec3; radius: number}) {
		this._sphereTargetRestriction = value;
	}

	public get target(): vec3 {
		return this._target;
	}

	public set target(value: vec3) {
		this._target = value;
	}

	public get turntableCenter(): vec3 {
		return this._turntableCenter;
	}

	public set turntableCenter(value: vec3) {
		this._turntableCenter = value;
	}

	public get zoomRestriction(): {minDistance: number; maxDistance: number} {
		return this._zoomRestriction;
	}

	public set zoomRestriction(value: {
		minDistance: number;
		maxDistance: number;
	}) {
		this._zoomRestriction = value;
	}

	public get zoomSpeed(): number {
		return this._zoomSpeed;
	}

	public set zoomSpeed(value: number) {
		this._zoomSpeed = value;
	}

	// #endregion Public Getters And Setters (59)

	// #region Public Methods (16)

	public animate(
		path: {position: vec3; target: vec3}[],
		options: ICameraOptions,
	): Promise<boolean> {
		if (options && options.duration === 0) {
			this._position = path[path.length - 1].position;
			this._target = path[path.length - 1].target;
			return new Promise<boolean>((resolve) => resolve(true));
		}

		this._manualInteraction = false;
		this._manualInteractionTransformations = {
			position: [],
			target: [],
			sceneRotation: [],
		};
		return this._cameraInterpolationManager.interpolate(path, options);
	}

	public applyPositionMatrix(
		matrix: mat4,
		manualInteraction?: boolean | undefined,
	): void {
		if (this._manualInteraction || manualInteraction) {
			this._manualInteraction = true;
			this._manualInteractionTransformations.position.push({matrix});
		} else {
			this._nonmanualInteraction = true;
			this._nonmanualInteractionTransformations.position.push({matrix});
		}
	}

	public applyPositionVector(
		vector: vec3,
		manualInteraction?: boolean | undefined,
	): void {
		if (this._manualInteraction || manualInteraction) {
			this._manualInteraction = true;
			this._manualInteractionTransformations.position.push({vector});
		} else {
			this._nonmanualInteraction = true;
			this._nonmanualInteractionTransformations.position.push({vector});
		}
	}

	public applyRotation(
		vector: vec2,
		manualInteraction?: boolean | undefined,
	): void {
		if (this._manualInteraction || manualInteraction) {
			this._manualInteraction = true;
			this._manualInteractionTransformations.sceneRotation.push({
				theta: vector[0],
				phi: vector[1],
			});
		} else {
			this._nonmanualInteraction = true;
			this._nonmanualInteractionTransformations.sceneRotation.push({
				theta: vector[0],
				phi: vector[1],
			});
		}
	}

	public applySettings(settingsEngine: SettingsEngine) {
		const cameraSetting = settingsEngine.camera.cameras[this.camera.id];
		if (!cameraSetting) return;
		this.reset();
		const controlsSettings = <ICameraControlsSettings>(
			cameraSetting.controls
		);
		this.autoRotationSpeed = controlsSettings.autoRotationSpeed;
		this.damping = controlsSettings.damping;
		this.enableAutoRotation = controlsSettings.enableAutoRotation;
		this.enableKeyPan = controlsSettings.enableKeyPan;
		this.enablePan = controlsSettings.enablePan;
		this.enableRotation = controlsSettings.enableRotation;
		this.enableZoom = controlsSettings.enableZoom;
		// this.input = controlsSettings.input;
		this.keyPanSpeed = controlsSettings.keyPanSpeed;
		this.movementSmoothness = controlsSettings.movementSmoothness;
		this.rotationSpeed = controlsSettings.rotationSpeed;
		this.panSpeed = controlsSettings.panSpeed;
		this.zoomSpeed = controlsSettings.zoomSpeed;

		this.enableAzimuthRotation = controlsSettings.enableAzimuthRotation;
		this.enablePolarRotation = controlsSettings.enablePolarRotation;
		this.enableTurntableControls = controlsSettings.enableTurntableControls;
		this.enableObjectControls = controlsSettings.enableObjectControls;
		this.turntableCenter = this._converter.toVec3(
			controlsSettings.turntableCenter,
		);
		this.objectControlsCenter = this._converter.toVec3(
			controlsSettings.objectControlsCenter,
		);

		if (controlsSettings.restrictions.position.cube.min.x === null)
			controlsSettings.restrictions.position.cube.min.x = -Infinity;
		if (controlsSettings.restrictions.position.cube.min.y === null)
			controlsSettings.restrictions.position.cube.min.y = -Infinity;
		if (controlsSettings.restrictions.position.cube.min.z === null)
			controlsSettings.restrictions.position.cube.min.z = -Infinity;
		if (controlsSettings.restrictions.position.cube.max.x === null)
			controlsSettings.restrictions.position.cube.max.x = Infinity;
		if (controlsSettings.restrictions.position.cube.max.y === null)
			controlsSettings.restrictions.position.cube.max.y = Infinity;
		if (controlsSettings.restrictions.position.cube.max.z === null)
			controlsSettings.restrictions.position.cube.max.z = Infinity;
		if (controlsSettings.restrictions.position.sphere.radius === null)
			controlsSettings.restrictions.position.sphere.radius = Infinity;
		if (controlsSettings.restrictions.target.cube.min.x === null)
			controlsSettings.restrictions.target.cube.min.x = -Infinity;
		if (controlsSettings.restrictions.target.cube.min.y === null)
			controlsSettings.restrictions.target.cube.min.y = -Infinity;
		if (controlsSettings.restrictions.target.cube.min.z === null)
			controlsSettings.restrictions.target.cube.min.z = -Infinity;
		if (controlsSettings.restrictions.target.cube.max.x === null)
			controlsSettings.restrictions.target.cube.max.x = Infinity;
		if (controlsSettings.restrictions.target.cube.max.y === null)
			controlsSettings.restrictions.target.cube.max.y = Infinity;
		if (controlsSettings.restrictions.target.cube.max.z === null)
			controlsSettings.restrictions.target.cube.max.z = Infinity;
		if (controlsSettings.restrictions.target.sphere.radius === null)
			controlsSettings.restrictions.target.sphere.radius = Infinity;
		if (controlsSettings.restrictions.rotation.minAzimuthAngle === null)
			controlsSettings.restrictions.rotation.minAzimuthAngle = -Infinity;
		if (controlsSettings.restrictions.rotation.maxAzimuthAngle === null)
			controlsSettings.restrictions.rotation.maxAzimuthAngle = Infinity;
		if (controlsSettings.restrictions.zoom.maxDistance === null)
			controlsSettings.restrictions.zoom.maxDistance = Infinity;

		this.cubePositionRestriction = {
			min: this._converter.toVec3(
				controlsSettings.restrictions.position.cube.min,
			),
			max: this._converter.toVec3(
				controlsSettings.restrictions.position.cube.max,
			),
		};
		this.spherePositionRestriction = {
			center: this._converter.toVec3(
				controlsSettings.restrictions.position.sphere.center,
			),
			radius: controlsSettings.restrictions.position.sphere.radius,
		};
		this.cubeTargetRestriction = {
			min: this._converter.toVec3(
				controlsSettings.restrictions.target.cube.min,
			),
			max: this._converter.toVec3(
				controlsSettings.restrictions.target.cube.max,
			),
		};
		this.sphereTargetRestriction = {
			center: this._converter.toVec3(
				controlsSettings.restrictions.target.sphere.center,
			),
			radius: controlsSettings.restrictions.target.sphere.radius,
		};
		this.rotationRestriction = controlsSettings.restrictions.rotation;
		this.zoomRestriction = controlsSettings.restrictions.zoom;
	}

	public applyTargetMatrix(
		matrix: mat4,
		manualInteraction?: boolean | undefined,
	): void {
		if (this._manualInteraction || manualInteraction) {
			this._manualInteraction = true;
			this._manualInteractionTransformations.target.push({matrix});
		} else {
			this._nonmanualInteraction = true;
			this._nonmanualInteractionTransformations.target.push({matrix});
		}
	}

	public applyTargetVector(
		vector: vec3,
		manualInteraction?: boolean | undefined,
	): void {
		if (this._manualInteraction || manualInteraction) {
			this._manualInteraction = true;
			this._manualInteractionTransformations.target.push({vector});
		} else {
			this._nonmanualInteraction = true;
			this._nonmanualInteractionTransformations.target.push({vector});
		}
	}

	public applyUpMatrix(
		matrix: mat4,
		manualInteraction?: boolean | undefined,
	): void {
		// https://shapediver.atlassian.net/browse/SS-2949
		throw new Error("Method not implemented.");
	}

	public assignViewer(viewportId: string, canvas: HTMLCanvasElement) {
		this._canvas = canvas;
		this._viewportId = viewportId;
	}

	public getPositionWithManualUpdates(): vec3 {
		let position = vec3.clone(this._position);
		if (this._manualInteraction) {
			for (
				let i =
					this._manualInteractionTransformations.position.length - 1;
				i >= 0;
				i--
			) {
				if (this._manualInteractionTransformations.position[i].matrix) {
					position = vec3.transformMat4(
						position,
						position,
						this._manualInteractionTransformations.position[i]
							.matrix!,
					);
				} else {
					position = vec3.add(
						position,
						position,
						this._manualInteractionTransformations.position[i]
							.vector!,
					);
				}
			}
		}
		return position;
	}

	public getPositionWithUpdates(): vec3 {
		return this.getPosition();
	}

	public getTargetWithManualUpdates(): vec3 {
		let target = vec3.clone(this._target);
		if (this._manualInteraction) {
			for (
				let i =
					this._manualInteractionTransformations.target.length - 1;
				i >= 0;
				i--
			) {
				if (this._manualInteractionTransformations.target[i].matrix) {
					target = vec3.transformMat4(
						target,
						target,
						this._manualInteractionTransformations.target[i]
							.matrix!,
					);
				} else {
					target = vec3.add(
						target,
						target,
						this._manualInteractionTransformations.target[i]
							.vector!,
					);
				}
			}
		}
		return target;
	}

	public getTargetWithUpdates(): vec3 {
		return this.getTarget();
	}

	public isMoving(): boolean {
		return this._manualInteraction || this._nonmanualInteraction;
	}

	public isWithinRestrictions(position: vec3, target: vec3): boolean {
		return this._cameraLogic.isWithinRestrictions(position, target);
	}

	public reset(): void {
		this._cameraControlsEventDistribution.reset();
		this._cameraLogic.reset();
	}

	public update(time: number): {
		position: vec3;
		target: vec3;
		sceneRotation: vec2;
	} {
		if (!this._enabled)
			return {
				position: vec3.clone(this._position),
				target: vec3.clone(this._target),
				sceneRotation: vec2.clone(this._sceneRotation),
			};

		// reset all values
		if (
			this._manualInteraction === true &&
			this._cameraInterpolationManager.active()
		)
			this._cameraInterpolationManager.stop();

		const {position, target, sceneRotation} = this._cameraLogic.restrict(
			this.getPosition(),
			this.getTarget(),
			this.getSceneRotation(),
		);
		this._position = vec3.clone(position);
		this._target = vec3.clone(target);
		this._sceneRotation = sceneRotation
			? vec2.clone(sceneRotation)
			: vec2.create();

		this._manualInteraction = false;
		this._manualInteractionTransformations = {
			position: [],
			target: [],
			sceneRotation: [],
		};
		this._nonmanualInteraction = this._cameraInterpolationManager.active();
		this._nonmanualInteractionTransformations = {
			position: [],
			target: [],
			sceneRotation: [],
		};

		this._cameraLogic.update(time, this._nonmanualInteraction);

		const oldMovement = this._moving;
		const cameraDefinition = {
			position: vec3.clone(this._position),
			target: vec3.clone(this._target),
			sceneRotation: vec2.clone(this._sceneRotation),
		};

		this._movingDuration += time;
		this._moving = this._manualInteraction || this._nonmanualInteraction;

		switch (true) {
			case oldMovement !== this._moving && this._moving === true:
				this._eventEngine.emitEvent(EVENTTYPE.CAMERA.CAMERA_START, {
					viewportId: this._viewportId,
					cameraId: this.camera.id,
				});
				break;
			case oldMovement !== this._moving && this._moving === false:
				this._eventEngine.emitEvent(EVENTTYPE.CAMERA.CAMERA_END, {
					viewportId: this._viewportId,
					cameraId: this.camera.id,
				});
				break;
			default:
				this._eventEngine.emitEvent(EVENTTYPE.CAMERA.CAMERA_MOVE, {
					viewportId: this._viewportId,
					cameraId: this.camera.id,
				});
		}

		if (!this._moving) this._movingDuration = 0;

		return cameraDefinition;
	}

	// #endregion Public Methods (16)

	// #region Private Methods (3)

	private getPosition(): vec3 {
		let position = vec3.clone(this._position);
		if (this._manualInteraction) {
			for (
				let i =
					this._manualInteractionTransformations.position.length - 1;
				i >= 0;
				i--
			) {
				if (this._manualInteractionTransformations.position[i].matrix) {
					position = vec3.transformMat4(
						position,
						position,
						this._manualInteractionTransformations.position[i]
							.matrix!,
					);
				} else {
					position = vec3.add(
						position,
						position,
						this._manualInteractionTransformations.position[i]
							.vector!,
					);
				}
			}
		} else if (this._nonmanualInteraction) {
			for (
				let i =
					this._nonmanualInteractionTransformations.position.length -
					1;
				i >= 0;
				i--
			) {
				if (
					this._nonmanualInteractionTransformations.position[i].matrix
				) {
					position = vec3.transformMat4(
						position,
						position,
						this._nonmanualInteractionTransformations.position[i]
							.matrix!,
					);
				} else {
					position = vec3.add(
						position,
						position,
						this._nonmanualInteractionTransformations.position[i]
							.vector!,
					);
				}
			}
		}
		return position;
	}

	private getSceneRotation(): vec2 {
		let sceneRotation = vec2.clone(this._sceneRotation);
		if (this._manualInteraction) {
			for (
				let i =
					this._manualInteractionTransformations.sceneRotation
						.length - 1;
				i >= 0;
				i--
			) {
				sceneRotation = vec2.add(
					sceneRotation,
					sceneRotation,
					vec2.fromValues(
						this._manualInteractionTransformations.sceneRotation[i]
							.theta,
						this._manualInteractionTransformations.sceneRotation[i]
							.phi,
					),
				);
			}
		} else if (this._nonmanualInteraction) {
			for (
				let i =
					this._nonmanualInteractionTransformations.sceneRotation
						.length - 1;
				i >= 0;
				i--
			) {
				sceneRotation = vec2.add(
					sceneRotation,
					sceneRotation,
					vec2.fromValues(
						this._nonmanualInteractionTransformations.sceneRotation[
							i
						].theta,
						this._nonmanualInteractionTransformations.sceneRotation[
							i
						].phi,
					),
				);
			}
		}
		return sceneRotation;
	}

	private getTarget(): vec3 {
		let target = vec3.clone(this._target);
		if (this._manualInteraction) {
			for (
				let i =
					this._manualInteractionTransformations.target.length - 1;
				i >= 0;
				i--
			) {
				if (this._manualInteractionTransformations.target[i].matrix) {
					target = vec3.transformMat4(
						target,
						target,
						this._manualInteractionTransformations.target[i]
							.matrix!,
					);
				} else {
					target = vec3.add(
						target,
						target,
						this._manualInteractionTransformations.target[i]
							.vector!,
					);
				}
			}
		} else if (this._nonmanualInteraction) {
			for (
				let i =
					this._nonmanualInteractionTransformations.target.length - 1;
				i >= 0;
				i--
			) {
				if (
					this._nonmanualInteractionTransformations.target[i].matrix
				) {
					target = vec3.transformMat4(
						target,
						target,
						this._nonmanualInteractionTransformations.target[i]
							.matrix!,
					);
				} else {
					target = vec3.add(
						target,
						target,
						this._nonmanualInteractionTransformations.target[i]
							.vector!,
					);
				}
			}
		}
		return target;
	}

	// #endregion Private Methods (3)
}
