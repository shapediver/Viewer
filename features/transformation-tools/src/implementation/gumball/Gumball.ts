import * as THREE from "three";

import {ITreeNode, IViewportApi, SystemInfo} from "@shapediver/viewer";

import {mat4} from "gl-matrix";

import {IGumball} from "../..";
import {GumballSettingsOptional} from "../../interfaces/gumball/IGumball";
import {TransformationToolsManager} from "../TransformationToolsManager";
import {GumballControls} from "./three/GumballControls";

/* eslint-disable @typescript-eslint/no-unused-vars */
export class Gumball extends TransformationToolsManager implements IGumball {
	readonly #gumballControls: GumballControls;
	readonly #systemInfo: SystemInfo = SystemInfo.instance;
	readonly #transformationToolsPlaceholder: THREE.Object3D =
		new THREE.Object3D();

	#currentMatrix: THREE.Matrix4 = new THREE.Matrix4();
	#enableRotation: boolean = true;
	#enableScaling: boolean = true;
	#enableTranslation: boolean = true;
	#moving: boolean = false;
	#pivotDragging: boolean = false;
	#scale: number = 0.15;
	#space: "local" | "world" = "local";

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

		const isMobile = this.#systemInfo.isMobile;
		const mobileFactor = isMobile ? 2 : 1;
		this.#scale = (settings?.scale ?? 0.15) * mobileFactor;
		// we don't allow to change the space for now
		this.#space = settings?.space ?? "local";

		this.enableRotation = settings?.enableRotation ?? true;
		this.#gumballControls.gizmo.enableRotationX =
			settings?.enableRotationAxes?.x ?? true;
		this.#gumballControls.gizmo.enableRotationY =
			settings?.enableRotationAxes?.y ?? true;
		this.#gumballControls.gizmo.enableRotationZ =
			settings?.enableRotationAxes?.z ?? true;
		this.#gumballControls.gizmo.enableRotationXY =
			settings?.enableRotationAxes?.xy === undefined
				? this.#gumballControls.gizmo.enableRotationX &&
					this.#gumballControls.gizmo.enableRotationY
				: settings?.enableRotationAxes?.xy;
		this.#gumballControls.gizmo.enableRotationYZ =
			settings?.enableRotationAxes?.yz === undefined
				? this.#gumballControls.gizmo.enableRotationY &&
					this.#gumballControls.gizmo.enableRotationZ
				: settings?.enableRotationAxes?.yz;
		this.#gumballControls.gizmo.enableRotationXZ =
			settings?.enableRotationAxes?.xz === undefined
				? this.#gumballControls.gizmo.enableRotationX &&
					this.#gumballControls.gizmo.enableRotationZ
				: settings?.enableRotationAxes?.xz;
		this.enableScaling = settings?.enableScaling ?? false;
		this.#gumballControls.gizmo.enableScalingX =
			settings?.enableScalingAxes?.x ?? true;
		this.#gumballControls.gizmo.enableScalingY =
			settings?.enableScalingAxes?.y ?? true;
		this.#gumballControls.gizmo.enableScalingZ =
			settings?.enableScalingAxes?.z ?? true;
		this.#gumballControls.gizmo.enableScalingXY =
			settings?.enableScalingAxes?.xy === undefined
				? this.#gumballControls.gizmo.enableScalingX &&
					this.#gumballControls.gizmo.enableScalingY
				: settings?.enableScalingAxes?.xy;
		this.#gumballControls.gizmo.enableScalingYZ =
			settings?.enableScalingAxes?.yz === undefined
				? this.#gumballControls.gizmo.enableScalingY &&
					this.#gumballControls.gizmo.enableScalingZ
				: settings?.enableScalingAxes?.yz;
		this.#gumballControls.gizmo.enableScalingXZ =
			settings?.enableScalingAxes?.xz === undefined
				? this.#gumballControls.gizmo.enableScalingX &&
					this.#gumballControls.gizmo.enableScalingZ
				: settings?.enableScalingAxes?.xz;
		this.enableTranslation = settings?.enableTranslation ?? true;
		this.#gumballControls.gizmo.enableTranslationX =
			settings?.enableTranslationAxes?.x ?? true;
		this.#gumballControls.gizmo.enableTranslationY =
			settings?.enableTranslationAxes?.y ?? true;
		this.#gumballControls.gizmo.enableTranslationZ =
			settings?.enableTranslationAxes?.z ?? true;
		this.#gumballControls.gizmo.enableTranslationXY =
			settings?.enableTranslationAxes?.xy === undefined
				? this.#gumballControls.gizmo.enableTranslationX &&
					this.#gumballControls.gizmo.enableTranslationY
				: settings?.enableTranslationAxes?.xy;
		this.#gumballControls.gizmo.enableTranslationYZ =
			settings?.enableTranslationAxes?.yz === undefined
				? this.#gumballControls.gizmo.enableTranslationY &&
					this.#gumballControls.gizmo.enableTranslationZ
				: settings?.enableTranslationAxes?.yz;
		this.#gumballControls.gizmo.enableTranslationXZ =
			settings?.enableTranslationAxes?.xz === undefined
				? this.#gumballControls.gizmo.enableTranslationX &&
					this.#gumballControls.gizmo.enableTranslationZ
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

	public get enableScaling(): boolean {
		return this.#enableScaling;
	}

	public set enableScaling(value: boolean) {
		this.#enableScaling = value;
		this.#gumballControls.gizmo.enableScaling = value;
	}

	public get enableTranslation(): boolean {
		return this.#enableTranslation;
	}

	public set enableTranslation(value: boolean) {
		this.#enableTranslation = value;
		this.#gumballControls.gizmo.enableTranslation = value;
	}

	public get scale(): number {
		return this.#scale;
	}

	public get space(): "local" | "world" {
		return this.#space;
	}

	public get transformationToolsPlaceholderMatrix(): mat4 {
		return mat4.fromValues(
			...this.#transformationToolsPlaceholder.matrix.toArray(),
		);
	}

	public get type(): "gumball" {
		return "gumball";
	}

	public closeLogic(): void {
		this.parentObject.remove(this.#gumballControls);
		this.parentObject.remove(this.#transformationToolsPlaceholder);
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
				(t) => t.id === "SD_transformation_tools_matrix",
			);
			if (index !== -1) {
				this.previousTransformationToolsMatrix[0] = mat4.clone(
					this.nodes[0].transformations[index].matrix,
				);
			} else {
				this.previousTransformationToolsMatrix[0] = mat4.create();
			}
		}

		this.#currentMatrix = this.#transformationToolsPlaceholder.matrix
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
		this.#transformationToolsPlaceholder.applyMatrix4(
			new THREE.Matrix4().fromArray(matrix),
		);

		this.#gumballControls.attach(this.#transformationToolsPlaceholder);
		this.#gumballControls.setSize(this.scale);
		this.parentObject.add(this.#gumballControls);
		this.parentObject.add(this.#transformationToolsPlaceholder);
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
			const currentMatrix = this.#transformationToolsPlaceholder.matrix
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
