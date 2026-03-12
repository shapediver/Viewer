import * as THREE from "three";

import {ITreeNode, IViewportApi} from "@shapediver/viewer";

import {mat4} from "gl-matrix";

import {IGumball} from "../..";
import {GumballSettingsOptional} from "../../interfaces/gumball/IGumball";
import {TransformControlsManager} from "../TransformControlsManager";
import {GumballControls} from "./three/GumballControls";

/* eslint-disable @typescript-eslint/no-unused-vars */
export class Gumball extends TransformControlsManager implements IGumball {
	readonly #gumballControls: GumballControls;
	readonly #transformcontrolsPlaceholder: THREE.Object3D =
		new THREE.Object3D();

	#currentMatrix: THREE.Matrix4 = new THREE.Matrix4();
	#enableRotation: boolean = true;
	#enableRotationX: boolean = true;
	#enableRotationXY: boolean = true;
	#enableRotationXZ: boolean = true;
	#enableRotationY: boolean = true;
	#enableRotationYZ: boolean = true;
	#enableRotationZ: boolean = true;
	#enableScaling: boolean = true;
	#enableScalingX: boolean = true;
	#enableScalingXY: boolean = true;
	#enableScalingXZ: boolean = true;
	#enableScalingY: boolean = true;
	#enableScalingYZ: boolean = true;
	#enableScalingZ: boolean = true;
	#enableTranslation: boolean = true;
	#enableTranslationX: boolean = true;
	#enableTranslationXY: boolean = true;
	#enableTranslationXZ: boolean = true;
	#enableTranslationY: boolean = true;
	#enableTranslationYZ: boolean = true;
	#enableTranslationZ: boolean = true;
	#moving: boolean = false;
	#pivotDragging: boolean = false;

	constructor(
		viewport: IViewportApi,
		nodes: ITreeNode[],
		settings?: GumballSettingsOptional,
	) {
		super(viewport, nodes, settings);

		this.#gumballControls = new GumballControls(
			viewport.threeJsCoreObjects.camera,
			viewport.threeJsCoreObjects.renderer.domElement,
			this.restrictionManager,
			this.updateObjectsInternal.bind(this),
			this.updateObjectMatricesInternal.bind(this),
		);

		this.#gumballControls.space = this.space;

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

	public get enableRotation(): boolean {
		return this.#enableRotation;
	}

	public set enableRotation(value: boolean) {
		this.#enableRotation = value;
		this.#gumballControls.gizmo.enableRotation = value;
	}

	public get enableRotationX(): boolean {
		return this.#enableRotationX;
	}

	public set enableRotationX(value: boolean) {
		this.#enableRotationX = value;
		this.#gumballControls.gizmo.enableRotationX = value;
	}

	public get enableRotationXY(): boolean {
		return this.#enableRotationXY;
	}

	public set enableRotationXY(value: boolean) {
		this.#enableRotationXY = value;
		this.#gumballControls.gizmo.enableRotationXY = value;
	}

	public get enableRotationXZ(): boolean {
		return this.#enableRotationXZ;
	}

	public set enableRotationXZ(value: boolean) {
		this.#enableRotationXZ = value;
		this.#gumballControls.gizmo.enableRotationXZ = value;
	}

	public get enableRotationY(): boolean {
		return this.#enableRotationY;
	}

	public set enableRotationY(value: boolean) {
		this.#enableRotationY = value;
		this.#gumballControls.gizmo.enableRotationY = value;
	}

	public get enableRotationYZ(): boolean {
		return this.#enableRotationYZ;
	}

	public set enableRotationYZ(value: boolean) {
		this.#enableRotationYZ = value;
		this.#gumballControls.gizmo.enableRotationYZ = value;
	}

	public get enableRotationZ(): boolean {
		return this.#enableRotationZ;
	}

	public set enableRotationZ(value: boolean) {
		this.#enableRotationZ = value;
		this.#gumballControls.gizmo.enableRotationZ = value;
	}

	public get enableScaling(): boolean {
		return this.#enableScaling;
	}

	public set enableScaling(value: boolean) {
		this.#enableScaling = value;
		this.#gumballControls.gizmo.enableScaling = value;
	}

	public get enableScalingX(): boolean {
		return this.#enableScalingX;
	}

	public set enableScalingX(value: boolean) {
		this.#enableScalingX = value;
		this.#gumballControls.gizmo.enableScalingX = value;
	}

	public get enableScalingXY(): boolean {
		return this.#enableScalingXY;
	}

	public set enableScalingXY(value: boolean) {
		this.#enableScalingXY = value;
		this.#gumballControls.gizmo.enableScalingXY = value;
	}

	public get enableScalingXZ(): boolean {
		return this.#enableScalingXZ;
	}

	public set enableScalingXZ(value: boolean) {
		this.#enableScalingXZ = value;
		this.#gumballControls.gizmo.enableScalingXZ = value;
	}

	public get enableScalingY(): boolean {
		return this.#enableScalingY;
	}

	public set enableScalingY(value: boolean) {
		this.#enableScalingY = value;
		this.#gumballControls.gizmo.enableScalingY = value;
	}

	public get enableScalingYZ(): boolean {
		return this.#enableScalingYZ;
	}

	public set enableScalingYZ(value: boolean) {
		this.#enableScalingYZ = value;
		this.#gumballControls.gizmo.enableScalingYZ = value;
	}

	public get enableScalingZ(): boolean {
		return this.#enableScalingZ;
	}

	public set enableScalingZ(value: boolean) {
		this.#enableScalingZ = value;
		this.#gumballControls.gizmo.enableScalingZ = value;
	}

	public get enableTranslation(): boolean {
		return this.#enableTranslation;
	}

	public set enableTranslation(value: boolean) {
		this.#enableTranslation = value;
		this.#gumballControls.gizmo.enableTranslation = value;
	}

	public get enableTranslationX(): boolean {
		return this.#enableTranslationX;
	}

	public set enableTranslationX(value: boolean) {
		this.#enableTranslationX = value;
		this.#gumballControls.gizmo.enableTranslationX = value;
	}

	public get enableTranslationXY(): boolean {
		return this.#enableTranslationXY;
	}

	public set enableTranslationXY(value: boolean) {
		this.#enableTranslationXY = value;
		this.#gumballControls.gizmo.enableTranslationXY = value;
	}

	public get enableTranslationXZ(): boolean {
		return this.#enableTranslationXZ;
	}

	public set enableTranslationXZ(value: boolean) {
		this.#enableTranslationXZ = value;
		this.#gumballControls.gizmo.enableTranslationXZ = value;
	}

	public get enableTranslationY(): boolean {
		return this.#enableTranslationY;
	}

	public set enableTranslationY(value: boolean) {
		this.#enableTranslationY = value;
		this.#gumballControls.gizmo.enableTranslationY = value;
	}

	public get enableTranslationYZ(): boolean {
		return this.#enableTranslationYZ;
	}

	public set enableTranslationYZ(value: boolean) {
		this.#enableTranslationYZ = value;
		this.#gumballControls.gizmo.enableTranslationYZ = value;
	}

	public get enableTranslationZ(): boolean {
		return this.#enableTranslationZ;
	}

	public set enableTranslationZ(value: boolean) {
		this.#enableTranslationZ = value;
		this.#gumballControls.gizmo.enableTranslationZ = value;
	}

	public get transformcontrolsPlaceholderMatrix(): mat4 {
		return mat4.fromValues(
			...this.#transformcontrolsPlaceholder.matrix.toArray(),
		);
	}

	public closeLogic(): void {
		this.parentObject.remove(this.#gumballControls);
		this.parentObject.remove(this.#transformcontrolsPlaceholder);
		this.#gumballControls.detach();
		this.#gumballControls.dispose();
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
		this.#gumballControls.onPointerDown(event);

		this.#moving = this.#gumballControls.dragging;
		if (this.#gumballControls.dragging || this.#gumballControls.hovering)
			this.viewport.addRestrictedCanvasListenerToken(
				this.canvasEventListenerToken,
			);
	}

	public onPointerEndLogic(event: PointerEvent): void {
		this.#moving = false;
		this.viewport.removeRestrictedCanvasListenerToken(
			this.canvasEventListenerToken,
		);

		this.#gumballControls.onPointerUp(event);
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

		this.#gumballControls.onPointerHover(event);
		if (this.#moving) this.#gumballControls.onPointerMove(event);

		if (this.#gumballControls.dragging || this.#gumballControls.hovering) {
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

	private activatePivotDragging() {
		this.#pivotDragging = true;

		this.#gumballControls.pivotDragged = true;
		this.#gumballControls.gizmo.enableTranslation = true;
		this.#gumballControls.gizmo.enableRotation = false;
		this.#gumballControls.gizmo.enableScaling = false;

		if (this.singleNode === true && this.reuseTransformation === true) {
			const index = this.nodes[0].transformations.findIndex(
				(t) => t.id === "SD_transform_controls_matrix",
			);
			if (index !== -1) {
				this.previousTransformControlsMatrix[0] = mat4.clone(
					this.nodes[0].transformations[index].matrix,
				);
			} else {
				this.previousTransformControlsMatrix[0] = mat4.create();
			}
		}

		this.#currentMatrix = this.#transformcontrolsPlaceholder.matrix
			.clone()
			.multiply(new THREE.Matrix4().fromArray(this.pivotOffset).invert());
	}

	private deactivatePivotDragging() {
		this.#pivotDragging = false;

		this.#gumballControls.pivotDragged = false;
		this.#gumballControls.gizmo.enableTranslation = this.#enableTranslation;
		this.#gumballControls.gizmo.enableRotation = this.#enableRotation;
		this.#gumballControls.gizmo.enableScaling = this.#enableScaling;
	}

	private setup() {
		const matrix = this.initialize();
		this.#transformcontrolsPlaceholder.applyMatrix4(
			new THREE.Matrix4().fromArray(matrix),
		);

		this.#gumballControls.attach(this.#transformcontrolsPlaceholder);
		this.#gumballControls.setSize(this.scale);
		this.parentObject.add(this.#gumballControls);
		this.parentObject.add(this.#transformcontrolsPlaceholder);
		this.viewport.threeJsCoreObjects.scene.add(this.parentObject);

		// we register the CAMERA_FREEZE whenever the dragging happens
		this.#gumballControls.addEventListener(
			"dragging-changed",
			(event: unknown) =>
				this.toggleCameraFreeze(!(event as {value: boolean}).value),
		);
	}

	private updateObjectMatricesInternal() {
		if (this.#pivotDragging === true) {
			const currentMatrix = this.#transformcontrolsPlaceholder.matrix
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
}
