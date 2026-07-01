import {type IRenderingEngine} from "@shapediver/viewer.rendering-engine.rendering-engine";
import {Box, type IBox, Sphere} from "@shapediver/viewer.shared.math";
import {
	AbstractTreeNodeData,
	type ITreeNode} from "@shapediver/viewer.shared.node-tree";
import {
	EventEngine,
	EVENTTYPE,
	SettingsEngine,
	StateEngine} from "@shapediver/viewer.shared.services";
import {CAMERA_TYPE, type ICameraOptions} from "@shapediver/viewer.shared.types";

import {mat4, vec2, vec3, vec4} from "gl-matrix";

import {type ICamera} from "../../interfaces/camera/ICamera";
import {type ICameraControls} from "../../interfaces/controls/ICameraControls";

export abstract class AbstractCamera
	extends AbstractTreeNodeData
	implements ICamera
{
	#active: boolean = false;
	#autoAdjust: boolean = true;
	#cameraMovementDuration: number = 800;
	#defaultPosition: vec3 = vec3.create();
	#defaultTarget: vec3 = vec3.create();
	#domEventListenerToken: string | undefined;
	#enableCameraControls: boolean = true;
	#eventListenerSceneCreatedToken: string | undefined;
	#eventListenerViewportUpdatedToken: string | undefined;
	#far: number = 1000;
	#initialAutoAdjust: boolean = false;
	#name?: string;
	#near: number = 1;
	#node?: ITreeNode;
	#order?: number;
	#revertAtMouseUp: boolean = false;
	#revertAtMouseUpDuration: number = 800;
	#sceneRotation: vec2 = vec2.create();
	#useNodeData: boolean = false;
	#zoomExtentsFactor: number = 1;

	protected readonly _eventEngine: EventEngine = EventEngine.instance;
	protected readonly _stateEngine: StateEngine = StateEngine.instance;

	protected _boundingBox: IBox = new Box();
	protected abstract _controls: ICameraControls;
	protected _position: vec3 = vec3.create();
	protected _target: vec3 = vec3.create();
	protected _viewportId?: string;

	constructor(
		private readonly _id: string,
		private readonly _type: CAMERA_TYPE,
		version?: string,
		private readonly _isDefault: boolean = false,
	) {
		super(_id, version);
	}

	public get active(): boolean {
		return this.#active;
	}

	public set active(value: boolean) {
		this.#active = value;
	}

	public get autoAdjust(): boolean {
		return this.#autoAdjust;
	}

	public set autoAdjust(value: boolean) {
		this.#autoAdjust = value;
	}

	public set boundingBox(value: IBox) {
		this._boundingBox = value;
	}

	public get cameraMovementDuration(): number {
		return this.#cameraMovementDuration;
	}

	public set cameraMovementDuration(value: number) {
		this.#cameraMovementDuration = value;
	}

	public get controls(): ICameraControls {
		return this._controls;
	}

	public get defaultPosition(): vec3 {
		return this.#defaultPosition;
	}

	public set defaultPosition(value: vec3) {
		this.#defaultPosition = value;
	}

	public get defaultTarget(): vec3 {
		return this.#defaultTarget;
	}

	public set defaultTarget(value: vec3) {
		this.#defaultTarget = value;
	}

	public get domEventListenerToken(): string | undefined {
		return this.#domEventListenerToken;
	}

	public set domEventListenerToken(value: string | undefined) {
		this.#domEventListenerToken = value;
	}

	public get enableCameraControls(): boolean {
		return this.#enableCameraControls;
	}

	public set enableCameraControls(value: boolean) {
		this.#enableCameraControls = value;
	}

	public get far(): number {
		return this.#far;
	}

	public set far(value: number) {
		this.#far = value;
	}

	public get id(): string {
		return this._id;
	}

	public get initialAutoAdjust(): boolean {
		return this.#initialAutoAdjust;
	}

	public set initialAutoAdjust(value: boolean) {
		this.#initialAutoAdjust = value;
	}

	public get isDefault(): boolean {
		return this._isDefault;
	}

	public get name(): string | undefined {
		return this.#name;
	}

	public set name(value: string | undefined) {
		this.#name = value;
	}

	public get near(): number {
		return this.#near;
	}

	public set near(value: number) {
		this.#near = value;
	}

	public get node(): ITreeNode | undefined {
		return this.#node;
	}

	public set node(value: ITreeNode | undefined) {
		this.#node = value;
	}

	public get order(): number | undefined {
		return this.#order;
	}

	public set order(value: number | undefined) {
		this.#order = value;
	}

	public get position(): vec3 {
		return this._position;
	}

	public set position(value: vec3) {
		this._position = value;
		this._controls.position = value;
	}

	public get revertAtMouseUp(): boolean {
		return this.#revertAtMouseUp;
	}

	public set revertAtMouseUp(value: boolean) {
		this.#revertAtMouseUp = value;
	}

	public get revertAtMouseUpDuration(): number {
		return this.#revertAtMouseUpDuration;
	}

	public set revertAtMouseUpDuration(value: number) {
		this.#revertAtMouseUpDuration = value;
	}

	public get sceneRotation(): vec2 {
		return this.#sceneRotation;
	}

	public set sceneRotation(value: vec2) {
		this.#sceneRotation = value;
	}

	public get target(): vec3 {
		return this._target;
	}

	public set target(value: vec3) {
		this._target = value;
		this._controls.target = value;
	}

	public get type(): CAMERA_TYPE {
		return this._type;
	}

	public get useNodeData(): boolean {
		return this.#useNodeData;
	}

	public set useNodeData(value: boolean) {
		this.#useNodeData = value;
	}

	public get viewportId(): string | undefined {
		return this._viewportId;
	}

	public get zoomExtentsFactor(): number {
		return this.#zoomExtentsFactor;
	}

	public set zoomExtentsFactor(value: number) {
		this.#zoomExtentsFactor = value;
	}

	public async animate(
		path: {position: vec3; target: vec3}[],
		options?: ICameraOptions,
	): Promise<boolean> {
		if (path.length === 0) return Promise.resolve(false);

		if (!options) options = {};
		options.duration =
			options.duration! >= 0
				? options.duration
				: this.cameraMovementDuration;

		const res = await this._controls.animate(path, options);
		if (res) {
			this._position = this._controls.position;
			this._target = this._controls.target;
		}
		return res;
	}

	public abstract applySettings(settingsEngine?: SettingsEngine): void;

	public abstract assignViewer(renderingEngine: IRenderingEngine): void;

	public boundingSphereVisible(sphere: Sphere): boolean {
		const projectionMatrix = this.getProjectionMatrix(sphere);
		// if we cannot calculate the projection matrix, we assume the sphere is visible
		if (!projectionMatrix) return true;

		// Calculate view matrix from camera position and target
		const viewMatrix = this.getViewMatrix();

		// Combine view and projection matrices to get view-projection matrix
		const viewProjectionMatrix = mat4.create();
		mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);

		const planes = this.getFrustumPlanes(viewProjectionMatrix);
		for (let i = 0; i < 6; i++) {
			const plane = planes[i];
			const distance =
				vec3.dot([plane[0], plane[1], plane[2]], sphere.center) +
				plane[3];

			if (distance < -sphere.radius) {
				return false;
			}
		}

		return true;
	}

	public abstract calculateZoomTo(
		zoomTarget?: Box,
		startingPosition?: vec3,
		startingTarget?: vec3,
	): {position: vec3; target: vec3};

	public destroy() {
		if (this.#eventListenerSceneCreatedToken)
			this._eventEngine.removeListener(
				this.#eventListenerSceneCreatedToken,
			);
		this.#eventListenerSceneCreatedToken = undefined;
		if (this.#eventListenerViewportUpdatedToken)
			this._eventEngine.removeListener(
				this.#eventListenerViewportUpdatedToken,
			);
		this.#eventListenerViewportUpdatedToken = undefined;
	}

	public abstract project(p: vec3): vec2;

	public reset(options?: ICameraOptions): Promise<boolean> {
		if (
			this.defaultPosition[0] === 0 &&
			this.defaultPosition[1] === 0 &&
			this.defaultPosition[2] === 0 &&
			this.defaultTarget[0] === 0 &&
			this.defaultTarget[1] === 0 &&
			this.defaultTarget[2] === 0
		) {
			return this.zoomTo(undefined, options);
		} else {
			return this.set(
				vec3.clone(this.defaultPosition),
				vec3.clone(this.defaultTarget),
				options,
			);
		}
	}

	public async set(
		position: vec3,
		target: vec3,
		options?: ICameraOptions,
	): Promise<boolean> {
		if (!options) options = {};
		options.duration =
			options.duration! >= 0
				? options.duration
				: this.cameraMovementDuration;

		const res = await this._controls.animate(
			[
				{
					position: vec3.clone(this.position),
					target: vec3.clone(this.target),
				},
				{position, target},
			],
			options,
		);
		if (res) {
			this._position = this._controls.position;
			this._target = this._controls.target;
		}
		return res;
	}

	public abstract unproject(p: vec3): vec3;

	public update(time: number): boolean {
		if (this.useNodeData && this.node && this._viewportId) {
			return true;
		} else {
			const {position, target, sceneRotation} =
				this._controls.update(time);
			let changed = true;
			if (
				vec3.equals(position, this.position) &&
				vec3.equals(target, this.target)
			)
				changed = false;

			this.position = vec3.clone(position);
			this.target = vec3.clone(target);
			this.sceneRotation = vec2.clone(sceneRotation);
			return changed;
		}
	}

	public zoomTo(
		zoomTarget?: Box,
		options?: ICameraOptions,
	): Promise<boolean> {
		const {position, target} = this.calculateZoomTo(zoomTarget);
		return this.set(position, target, options);
	}

	protected assignViewerInternal(viewportId: string) {
		this._viewportId = viewportId;
		this._eventEngine.addListener(
			EVENTTYPE.SESSION.SESSION_CUSTOMIZED,
			async () => {
				if (this.#autoAdjust === true) {
					const innerListenerToken = this._eventEngine.addListener(
						EVENTTYPE.VIEWPORT.VIEWPORT_UPDATED,
						async () => {
							this.zoomTo();
							this._eventEngine.removeListener(
								innerListenerToken,
							);
						},
					);
				}
			},
		);
	}

	protected getFrustumPlanes(projectionMatrix: mat4): vec4[] {
		const planes = [];

		for (let i = 0; i < 6; i++) {
			const plane = vec4.create();
			switch (i) {
				case 0:
					vec4.set(
						plane,
						projectionMatrix[3] - projectionMatrix[0],
						projectionMatrix[7] - projectionMatrix[4],
						projectionMatrix[11] - projectionMatrix[8],
						projectionMatrix[15] - projectionMatrix[12],
					);
					break; // Left
				case 1:
					vec4.set(
						plane,
						projectionMatrix[3] + projectionMatrix[0],
						projectionMatrix[7] + projectionMatrix[4],
						projectionMatrix[11] + projectionMatrix[8],
						projectionMatrix[15] + projectionMatrix[12],
					);
					break; // Right
				case 2:
					vec4.set(
						plane,
						projectionMatrix[3] + projectionMatrix[1],
						projectionMatrix[7] + projectionMatrix[5],
						projectionMatrix[11] + projectionMatrix[9],
						projectionMatrix[15] + projectionMatrix[13],
					);
					break; // Top
				case 3:
					vec4.set(
						plane,
						projectionMatrix[3] - projectionMatrix[1],
						projectionMatrix[7] - projectionMatrix[5],
						projectionMatrix[11] - projectionMatrix[9],
						projectionMatrix[15] - projectionMatrix[13],
					);
					break; // Bottom
				case 4:
					vec4.set(
						plane,
						projectionMatrix[3] - projectionMatrix[2],
						projectionMatrix[7] - projectionMatrix[6],
						projectionMatrix[11] - projectionMatrix[10],
						projectionMatrix[15] - projectionMatrix[14],
					);
					break; // Near
				case 5:
					vec4.set(
						plane,
						projectionMatrix[3] + projectionMatrix[2],
						projectionMatrix[7] + projectionMatrix[6],
						projectionMatrix[11] + projectionMatrix[10],
						projectionMatrix[15] + projectionMatrix[14],
					);
					break; // Far
			}

			const length = Math.sqrt(
				plane[0] ** 2 + plane[1] ** 2 + plane[2] ** 2,
			);
			if (length !== 0) {
				vec4.scale(plane, plane, 1 / length);
			}

			planes.push(plane);
		}

		return planes;
	}

	protected abstract getProjectionMatrix(sphere: Sphere): mat4 | undefined;

	protected getViewMatrix(): mat4 {
		const viewMatrix = mat4.create();
		const up = vec3.fromValues(0, 0, 1);
		mat4.lookAt(viewMatrix, this._position, this._target, up);
		return viewMatrix;
	}
}
