import * as THREE from "three";

import {ITreeNode, IViewportApi, SystemInfo} from "@shapediver/viewer";

import {mat4} from "gl-matrix";

import {IGumballTransform} from "../..";
import {GumballTransformSettingsOptional} from "../../interfaces/gumballTransform/IGumballTransform";
import {TransformationToolsManager} from "../TransformationToolsManager";
import {GumballTransformControls} from "./three/GumballTransformControls";

/* eslint-disable @typescript-eslint/no-unused-vars */
export class GumballTransform
	extends TransformationToolsManager
	implements IGumballTransform
{
	readonly #gumballTransformControls: GumballTransformControls;
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
		settings?: GumballTransformSettingsOptional,
	) {
		super(viewport, nodes, settings);
		console.log(
			"creating gumball transform with nodes",
			nodes,
			"and settings",
			settings,
		);

		this.#gumballTransformControls = new GumballTransformControls(
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
		this.#gumballTransformControls.gizmo.enableRotationX =
			settings?.enableRotationAxes?.x ?? true;
		this.#gumballTransformControls.gizmo.enableRotationY =
			settings?.enableRotationAxes?.y ?? true;
		this.#gumballTransformControls.gizmo.enableRotationZ =
			settings?.enableRotationAxes?.z ?? true;
		this.#gumballTransformControls.gizmo.enableRotationXY =
			settings?.enableRotationAxes?.xy === undefined
				? this.#gumballTransformControls.gizmo.enableRotationX &&
					this.#gumballTransformControls.gizmo.enableRotationY
				: settings?.enableRotationAxes?.xy;
		this.#gumballTransformControls.gizmo.enableRotationYZ =
			settings?.enableRotationAxes?.yz === undefined
				? this.#gumballTransformControls.gizmo.enableRotationY &&
					this.#gumballTransformControls.gizmo.enableRotationZ
				: settings?.enableRotationAxes?.yz;
		this.#gumballTransformControls.gizmo.enableRotationXZ =
			settings?.enableRotationAxes?.xz === undefined
				? this.#gumballTransformControls.gizmo.enableRotationX &&
					this.#gumballTransformControls.gizmo.enableRotationZ
				: settings?.enableRotationAxes?.xz;
		this.enableScaling = settings?.enableScaling ?? false;
		this.#gumballTransformControls.gizmo.enableScalingX =
			settings?.enableScalingAxes?.x ?? true;
		this.#gumballTransformControls.gizmo.enableScalingY =
			settings?.enableScalingAxes?.y ?? true;
		this.#gumballTransformControls.gizmo.enableScalingZ =
			settings?.enableScalingAxes?.z ?? true;
		this.#gumballTransformControls.gizmo.enableScalingXY =
			settings?.enableScalingAxes?.xy === undefined
				? this.#gumballTransformControls.gizmo.enableScalingX &&
					this.#gumballTransformControls.gizmo.enableScalingY
				: settings?.enableScalingAxes?.xy;
		this.#gumballTransformControls.gizmo.enableScalingYZ =
			settings?.enableScalingAxes?.yz === undefined
				? this.#gumballTransformControls.gizmo.enableScalingY &&
					this.#gumballTransformControls.gizmo.enableScalingZ
				: settings?.enableScalingAxes?.yz;
		this.#gumballTransformControls.gizmo.enableScalingXZ =
			settings?.enableScalingAxes?.xz === undefined
				? this.#gumballTransformControls.gizmo.enableScalingX &&
					this.#gumballTransformControls.gizmo.enableScalingZ
				: settings?.enableScalingAxes?.xz;
		this.enableTranslation = settings?.enableTranslation ?? true;
		this.#gumballTransformControls.gizmo.enableTranslationX =
			settings?.enableTranslationAxes?.x ?? true;
		this.#gumballTransformControls.gizmo.enableTranslationY =
			settings?.enableTranslationAxes?.y ?? true;
		this.#gumballTransformControls.gizmo.enableTranslationZ =
			settings?.enableTranslationAxes?.z ?? true;
		this.#gumballTransformControls.gizmo.enableTranslationXY =
			settings?.enableTranslationAxes?.xy === undefined
				? this.#gumballTransformControls.gizmo.enableTranslationX &&
					this.#gumballTransformControls.gizmo.enableTranslationY
				: settings?.enableTranslationAxes?.xy;
		this.#gumballTransformControls.gizmo.enableTranslationYZ =
			settings?.enableTranslationAxes?.yz === undefined
				? this.#gumballTransformControls.gizmo.enableTranslationY &&
					this.#gumballTransformControls.gizmo.enableTranslationZ
				: settings?.enableTranslationAxes?.yz;
		this.#gumballTransformControls.gizmo.enableTranslationXZ =
			settings?.enableTranslationAxes?.xz === undefined
				? this.#gumballTransformControls.gizmo.enableTranslationX &&
					this.#gumballTransformControls.gizmo.enableTranslationZ
				: settings?.enableTranslationAxes?.xz;

		this.setup();
	}

	public get enableRotation(): boolean {
		return this.#enableRotation;
	}

	public set enableRotation(value: boolean) {
		this.#enableRotation = value;
		this.#gumballTransformControls.gizmo.enableRotation = value;
	}

	public get enableScaling(): boolean {
		return this.#enableScaling;
	}

	public set enableScaling(value: boolean) {
		this.#enableScaling = value;
		this.#gumballTransformControls.gizmo.enableScaling = value;
	}

	public get enableTranslation(): boolean {
		return this.#enableTranslation;
	}

	public set enableTranslation(value: boolean) {
		this.#enableTranslation = value;
		this.#gumballTransformControls.gizmo.enableTranslation = value;
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
		this.parentObject.remove(this.#gumballTransformControls);
		this.parentObject.remove(this.#transformationToolsPlaceholder);
		this.#gumballTransformControls.detach();
		this.#gumballTransformControls.dispose();
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
		this.#gumballTransformControls.onPointerDown(event);

		this.#moving = this.#gumballTransformControls.dragging;
		if (
			this.#gumballTransformControls.dragging ||
			this.#gumballTransformControls.hovering
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

		this.#gumballTransformControls.onPointerUp(event);
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

		this.#gumballTransformControls.onPointerHover(event);
		if (this.#moving) this.#gumballTransformControls.onPointerMove(event);

		if (
			this.#gumballTransformControls.dragging ||
			this.#gumballTransformControls.hovering
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

	private activatePivotDragging() {
		this.#pivotDragging = true;

		this.#gumballTransformControls.pivotDragged = true;
		this.#gumballTransformControls.gizmo.enableTranslation = true;
		this.#gumballTransformControls.gizmo.enableRotation = false;
		this.#gumballTransformControls.gizmo.enableScaling = false;

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

		this.#gumballTransformControls.pivotDragged = false;
		this.#gumballTransformControls.gizmo.enableTranslation =
			this.#enableTranslation;
		this.#gumballTransformControls.gizmo.enableRotation =
			this.#enableRotation;
		this.#gumballTransformControls.gizmo.enableScaling =
			this.#enableScaling;
	}

	private setup() {
		const matrix = this.initialize();
		this.#transformationToolsPlaceholder.applyMatrix4(
			new THREE.Matrix4().fromArray(matrix),
		);

		this.#gumballTransformControls.attach(
			this.#transformationToolsPlaceholder,
		);
		this.#gumballTransformControls.setSize(this.scale);
		this.parentObject.add(this.#gumballTransformControls);
		this.parentObject.add(this.#transformationToolsPlaceholder);
		this.viewport.threeJsCoreObjects.scene.add(this.parentObject);

		// we register the CAMERA_FREEZE whenever the dragging happens
		this.#gumballTransformControls.addEventListener(
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
