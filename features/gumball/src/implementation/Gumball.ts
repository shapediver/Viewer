import {ITreeNode, IViewportApi} from "@shapediver/viewer";
import {mat4} from "gl-matrix";
import * as THREE from "three";
import {IGumball, SettingsOptional} from "../interfaces/IGumball";
import {TransformControls} from "../three/TransformControls";
import {TransformControlsManager} from "./TransformControlsManager";
/* eslint-disable @typescript-eslint/no-unused-vars */

export class Gumball extends TransformControlsManager implements IGumball {
	// #region Properties (38)

	readonly #transformControls: TransformControls;
	readonly #transformationControlsPlaceholder: THREE.Object3D =
		new THREE.Object3D();

	#currentMatrix: THREE.Matrix4 = new THREE.Matrix4();
	#enableRotation: boolean = true;
	#enableRotationX: boolean = true;
	#enableRotationY: boolean = true;
	#enableRotationZ: boolean = true;
	#enableRotationXY: boolean = true;
	#enableRotationYZ: boolean = true;
	#enableRotationXZ: boolean = true;
	#enableScaling: boolean = true;
	#enableScalingX: boolean = true;
	#enableScalingY: boolean = true;
	#enableScalingZ: boolean = true;
	#enableScalingXY: boolean = true;
	#enableScalingYZ: boolean = true;
	#enableScalingXZ: boolean = true;
	#enableTranslation: boolean = true;
	#enableTranslationX: boolean = true;
	#enableTranslationY: boolean = true;
	#enableTranslationZ: boolean = true;
	#enableTranslationXY: boolean = true;
	#enableTranslationYZ: boolean = true;
	#enableTranslationXZ: boolean = true;
	#moving: boolean = false;
	#pivotDragging: boolean = false;

	// #endregion Properties (38)

	// #region Constructors (1)

	constructor(
		viewport: IViewportApi,
		nodes: ITreeNode[],
		settings?: SettingsOptional,
	) {
		super(viewport, nodes, settings);

		this.#transformControls = new TransformControls(
			viewport.threeJsCoreObjects.camera,
			viewport.threeJsCoreObjects.renderer.domElement,
			this.restrictionManager,
			this.updateObjectsInternal.bind(this),
			this.updateObjectMatricesInternal.bind(this),
		);

		this.#transformControls.space = this.space;

		this.enableRotation = settings?.enableRotation ?? true;
		this.enableRotationX = settings?.enableRotationAxes?.x ?? true;
		this.enableRotationY = settings?.enableRotationAxes?.y ?? true;
		this.enableRotationZ = settings?.enableRotationAxes?.z ?? true;
		this.enableRotationXY =
			settings?.enableRotationAxes?.xy === undefined
				? this.enableRotationX && this.enableRotationY
				: settings?.enableRotationAxes?.xy;
		this.enableRotationYZ =
			settings?.enableRotationAxes?.yz === undefined
				? this.enableRotationY && this.enableRotationZ
				: settings?.enableRotationAxes?.yz;
		this.enableRotationXZ =
			settings?.enableRotationAxes?.xz === undefined
				? this.enableRotationX && this.enableRotationZ
				: settings?.enableRotationAxes?.xz;
		this.enableScaling = settings?.enableScaling ?? false;
		this.enableScalingX = settings?.enableScalingAxes?.x ?? true;
		this.enableScalingY = settings?.enableScalingAxes?.y ?? true;
		this.enableScalingZ = settings?.enableScalingAxes?.z ?? true;
		this.enableScalingXY =
			settings?.enableScalingAxes?.xy === undefined
				? this.enableScalingX && this.enableScalingY
				: settings?.enableScalingAxes?.xy;
		this.enableScalingYZ =
			settings?.enableScalingAxes?.yz === undefined
				? this.enableScalingY && this.enableScalingZ
				: settings?.enableScalingAxes?.yz;
		this.enableScalingXZ =
			settings?.enableScalingAxes?.xz === undefined
				? this.enableScalingX && this.enableScalingZ
				: settings?.enableScalingAxes?.xz;
		this.enableTranslation = settings?.enableTranslation ?? true;
		this.enableTranslationX = settings?.enableTranslationAxes?.x ?? true;
		this.enableTranslationY = settings?.enableTranslationAxes?.y ?? true;
		this.enableTranslationZ = settings?.enableTranslationAxes?.z ?? true;
		this.enableTranslationXY =
			settings?.enableTranslationAxes?.xy === undefined
				? this.enableTranslationX && this.enableTranslationY
				: settings?.enableTranslationAxes?.xy;
		this.enableTranslationYZ =
			settings?.enableTranslationAxes?.yz === undefined
				? this.enableTranslationY && this.enableTranslationZ
				: settings?.enableTranslationAxes?.yz;
		this.enableTranslationXZ =
			settings?.enableTranslationAxes?.xz === undefined
				? this.enableTranslationX && this.enableTranslationZ
				: settings?.enableTranslationAxes?.xz;

		this.setup();
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (32)

	public get enableRotation(): boolean {
		return this.#enableRotation;
	}

	public set enableRotation(value: boolean) {
		this.#enableRotation = value;
		this.#transformControls.gizmo.enableRotation = value;
	}

	public get enableRotationX(): boolean {
		return this.#enableRotationX;
	}

	public set enableRotationX(value: boolean) {
		this.#enableRotationX = value;
		this.#transformControls.gizmo.enableRotationX = value;
	}

	public get enableRotationY(): boolean {
		return this.#enableRotationY;
	}

	public set enableRotationY(value: boolean) {
		this.#enableRotationY = value;
		this.#transformControls.gizmo.enableRotationY = value;
	}

	public get enableRotationZ(): boolean {
		return this.#enableRotationZ;
	}

	public set enableRotationZ(value: boolean) {
		this.#enableRotationZ = value;
		this.#transformControls.gizmo.enableRotationZ = value;
	}

	public get enableRotationXY(): boolean {
		return this.#enableRotationXY;
	}

	public set enableRotationXY(value: boolean) {
		this.#enableRotationXY = value;
		this.#transformControls.gizmo.enableRotationXY = value;
	}

	public get enableRotationYZ(): boolean {
		return this.#enableRotationYZ;
	}

	public set enableRotationYZ(value: boolean) {
		this.#enableRotationYZ = value;
		this.#transformControls.gizmo.enableRotationYZ = value;
	}

	public get enableRotationXZ(): boolean {
		return this.#enableRotationXZ;
	}

	public set enableRotationXZ(value: boolean) {
		this.#enableRotationXZ = value;
		this.#transformControls.gizmo.enableRotationXZ = value;
	}

	public get enableScaling(): boolean {
		return this.#enableScaling;
	}

	public set enableScaling(value: boolean) {
		this.#enableScaling = value;
		this.#transformControls.gizmo.enableScaling = value;
	}

	public get enableScalingX(): boolean {
		return this.#enableScalingX;
	}

	public set enableScalingX(value: boolean) {
		this.#enableScalingX = value;
		this.#transformControls.gizmo.enableScalingX = value;
	}

	public get enableScalingY(): boolean {
		return this.#enableScalingY;
	}

	public set enableScalingY(value: boolean) {
		this.#enableScalingY = value;
		this.#transformControls.gizmo.enableScalingY = value;
	}

	public get enableScalingZ(): boolean {
		return this.#enableScalingZ;
	}

	public set enableScalingZ(value: boolean) {
		this.#enableScalingZ = value;
		this.#transformControls.gizmo.enableScalingZ = value;
	}

	public get enableScalingXY(): boolean {
		return this.#enableScalingXY;
	}

	public set enableScalingXY(value: boolean) {
		this.#enableScalingXY = value;
		this.#transformControls.gizmo.enableScalingXY = value;
	}

	public get enableScalingYZ(): boolean {
		return this.#enableScalingYZ;
	}

	public set enableScalingYZ(value: boolean) {
		this.#enableScalingYZ = value;
		this.#transformControls.gizmo.enableScalingYZ = value;
	}

	public get enableScalingXZ(): boolean {
		return this.#enableScalingXZ;
	}

	public set enableScalingXZ(value: boolean) {
		this.#enableScalingXZ = value;
		this.#transformControls.gizmo.enableScalingXZ = value;
	}

	public get enableTranslation(): boolean {
		return this.#enableTranslation;
	}

	public set enableTranslation(value: boolean) {
		this.#enableTranslation = value;
		this.#transformControls.gizmo.enableTranslation = value;
	}

	public get enableTranslationX(): boolean {
		return this.#enableTranslationX;
	}

	public set enableTranslationX(value: boolean) {
		this.#enableTranslationX = value;
		this.#transformControls.gizmo.enableTranslationX = value;
	}

	public get enableTranslationY(): boolean {
		return this.#enableTranslationY;
	}

	public set enableTranslationY(value: boolean) {
		this.#enableTranslationY = value;
		this.#transformControls.gizmo.enableTranslationY = value;
	}

	public get enableTranslationZ(): boolean {
		return this.#enableTranslationZ;
	}

	public set enableTranslationZ(value: boolean) {
		this.#enableTranslationZ = value;
		this.#transformControls.gizmo.enableTranslationZ = value;
	}

	public get enableTranslationXY(): boolean {
		return this.#enableTranslationXY;
	}

	public set enableTranslationXY(value: boolean) {
		this.#enableTranslationXY = value;
		this.#transformControls.gizmo.enableTranslationXY = value;
	}

	public get enableTranslationYZ(): boolean {
		return this.#enableTranslationYZ;
	}

	public set enableTranslationYZ(value: boolean) {
		this.#enableTranslationYZ = value;
		this.#transformControls.gizmo.enableTranslationYZ = value;
	}

	public get enableTranslationXZ(): boolean {
		return this.#enableTranslationXZ;
	}

	public set enableTranslationXZ(value: boolean) {
		this.#enableTranslationXZ = value;
		this.#transformControls.gizmo.enableTranslationXZ = value;
	}

	// #endregion Public Getters And Setters (32)

	// #region Public Methods (10)

	public closeLogic(): void {
		this.parentObject.remove(this.#transformControls);
		this.parentObject.remove(this.#transformationControlsPlaceholder);
		this.#transformControls.detach();
		this.#transformControls.dispose();
		this.viewport.threeJsCoreObjects.scene.remove(this.parentObject);
	}

	public onKeyDownLogic(
		event: KeyboardEvent,
		pointerInCanvas: boolean,
	): void {
		if (this.closed) return;
		if (!pointerInCanvas) return;
		this.keysPressed[event.key] = true;

		if (
			this.#moving === false &&
			Object.values(this.keysPressed).length === 1 &&
			this.keyPressed("p") &&
			this.#pivotDragging === false
		) {
			this.activatePivotDragging();
		}
	}

	public onKeyUpLogic(event: KeyboardEvent, pointerInCanvas: boolean): void {
		if (this.closed) return;
		delete this.keysPressed[event.key];

		if (this.#pivotDragging === true && !this.keyPressed("p")) {
			this.deactivatePivotDragging();
		}
	}

	public onMouseWheel(event: WheelEvent): void {}

	public onPointerDownLogic(event: PointerEvent): void {
		this.#transformControls.onPointerDown(event);

		this.#moving = this.#transformControls.dragging;
		if (
			this.#transformControls.dragging ||
			this.#transformControls.hovering
		)
			this.viewport.addRestrictedCanvasListenerToken(
				this.canvasEventListenerToken,
			);
	}

	public onPointerEndLogic(event: PointerEvent): void {
		this.#moving = false;
		this.viewport.removeRestrictedCanvasListenerToken(
			this.canvasEventListenerToken,
		);

		this.#transformControls.onPointerUp(event);
	}

	public onPointerMoveLogic(event: PointerEvent): void {
		if (
			this.#moving === false &&
			Object.values(this.keysPressed).length === 1 &&
			this.keyPressed("p") &&
			this.#pivotDragging === false
		) {
			this.activatePivotDragging();
		}

		if (this.#pivotDragging === true && !this.keyPressed("p")) {
			this.deactivatePivotDragging();
		}

		this.#transformControls.onPointerHover(event);
		if (this.#moving) this.#transformControls.onPointerMove(event);

		if (
			this.#transformControls.dragging ||
			this.#transformControls.hovering
		) {
			this.viewport.addRestrictedCanvasListenerToken(
				this.canvasEventListenerToken,
			);
		} else {
			this.viewport.removeRestrictedCanvasListenerToken(
				this.canvasEventListenerToken,
			);
		}
	}

	public onPointerOutLogic(event: PointerEvent): void {
		this.#moving = false;
	}

	public onPointerUpLogic(event: PointerEvent): void {
		this.#moving = false;
	}

	// #endregion Public Methods (10)

	// #region Private Methods (7)

	private activatePivotDragging() {
		this.#pivotDragging = true;

		this.#transformControls.pivotDragged = true;
		this.#transformControls.gizmo.enableTranslation = true;
		this.#transformControls.gizmo.enableRotation = false;
		this.#transformControls.gizmo.enableScaling = false;

		if (this.singleNode === true && this.reuseTransformation === true) {
			const index = this.nodes[0].transformations.findIndex(
				(t) => t.id === "SD_gumball_matrix",
			);
			if (index !== -1) {
				this.previousGumballMatrix[0] = mat4.clone(
					this.nodes[0].transformations[index].matrix,
				);
			} else {
				this.previousGumballMatrix[0] = mat4.create();
			}
		}

		this.#currentMatrix = this.#transformationControlsPlaceholder.matrix
			.clone()
			.multiply(new THREE.Matrix4().fromArray(this.pivotOffset).invert());
	}

	private deactivatePivotDragging() {
		this.#pivotDragging = false;

		this.#transformControls.pivotDragged = false;
		this.#transformControls.gizmo.enableTranslation =
			this.#enableTranslation;
		this.#transformControls.gizmo.enableRotation = this.#enableRotation;
		this.#transformControls.gizmo.enableScaling = this.#enableScaling;
	}

	private setup() {
		const matrix = this.initialize();
		this.#transformationControlsPlaceholder.applyMatrix4(matrix);

		this.#transformControls.attach(this.#transformationControlsPlaceholder);
		this.#transformControls.setSize(this.scale);
		this.parentObject.add(this.#transformControls);
		this.parentObject.add(this.#transformationControlsPlaceholder);
		this.viewport.threeJsCoreObjects.scene.add(this.parentObject);

		// we register the CAMERA_FREEZE whenever the dragging happens
		this.#transformControls.addEventListener(
			"dragging-changed",
			(event: unknown) =>
				this.toggleCameraFreeze(!(event as {value: boolean}).value),
		);
	}

	private updateObjectMatricesInternal() {
		if (this.#pivotDragging === true) {
			const currentMatrix = this.#transformationControlsPlaceholder.matrix
				.clone()
				.multiply(
					new THREE.Matrix4().fromArray(this.pivotOffset).invert(),
				);

			const delta = new THREE.Matrix4().multiplyMatrices(
				this.#currentMatrix.clone().invert(),
				currentMatrix,
			);
			mat4.multiply(
				this.pivotOffset,
				this.pivotOffset,
				mat4.fromValues(...delta.toArray()),
			);

			this.deactivatePivotDragging();
		} else {
			this.updateObjectMatrices();
		}
	}

	private updateObjectsInternal() {
		if (this.#pivotDragging === true) return;
		this.updateObjects();
	}

	public get transformationControlsPlaceholderMatrix(): THREE.Matrix4 {
		return this.#transformationControlsPlaceholder.matrix;
	}

	// #endregion Private Methods (7)
}
