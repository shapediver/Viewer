import {
	Box,
	FLAG_TYPE,
	GeometryData,
	ITreeNode,
	IViewportApi,
	sceneTree,
} from "@shapediver/viewer";
import {
	EventEngine,
	EVENTTYPE_GUMBALL,
} from "@shapediver/viewer.shared.services";
import {mat4, vec3} from "gl-matrix";
import * as THREE from "three";
import {IGumballEvent} from "../interfaces/events/IGumballEvent";
import {IGumball, SettingsOptional} from "../interfaces/IGumball";
import {TransformControls} from "../three/TransformControls";
/* eslint-disable @typescript-eslint/no-unused-vars */

export class Gumball implements IGumball {
	// #region Properties (38)

	readonly #eventEngine: EventEngine = EventEngine.instance;
	readonly #keysPressed: {[key: string]: boolean} = {};
	readonly #matrixId: string = "SD_gumball_matrix";
	readonly #nodes: ITreeNode[] = [];
	readonly #parentObject: THREE.Object3D = new THREE.Object3D();
	readonly #singleNode: boolean;
	readonly #transformControls: TransformControls;
	readonly #transformationControlsPlaceholder: THREE.Object3D =
		new THREE.Object3D();
	readonly #viewport: IViewportApi;

	#cameraFreezeFlag?: string;
	#canvasEventListenerToken: string;
	#closed: boolean = false;
	#continuousRenderingFlag?: string;
	#continuousShadowMapUpdateFlag?: string;
	#currentMatrix: THREE.Matrix4 = new THREE.Matrix4();
	#enableRotation: boolean = true;
	#enableRotationX: boolean = true;
	#enableRotationY: boolean = true;
	#enableRotationZ: boolean = true;
	#enableScaling: boolean = true;
	#enableScalingX: boolean = true;
	#enableScalingY: boolean = true;
	#enableScalingZ: boolean = true;
	#enableTranslation: boolean = true;
	#enableTranslationX: boolean = true;
	#enableTranslationY: boolean = true;
	#enableTranslationZ: boolean = true;
	#initialOffset: vec3 = vec3.create();
	#initialTransform: mat4[] = [];
	#matrix: mat4 = mat4.create();
	#moving: boolean = false;
	#pivotDragging: boolean = false;
	#pivotOffset: mat4 = mat4.create();
	#previousGumballMatrix: mat4[] = [];
	#reuseTransformation: boolean = true;
	#scale: number = 0.15;
	#show: boolean = true;
	#space: "local" | "world" = "local";

	// #endregion Properties (38)

	// #region Constructors (1)

	constructor(
		viewport: IViewportApi,
		nodes: ITreeNode[],
		settings?: SettingsOptional,
	) {
		this.#viewport = viewport;
		this.#canvasEventListenerToken =
			this.#viewport.addCanvasEventListener(this);
		this.#nodes = nodes;
		this.#singleNode = nodes.length === 1;

		this.#transformControls = new TransformControls(
			viewport.threeJsCoreObjects.camera,
			viewport.threeJsCoreObjects.renderer.domElement,
			this.updateObjects.bind(this),
			this.updateObjectMatrices.bind(this),
		);

		this.enableRotation = settings?.enableRotation ?? true;
		this.enableRotationX = settings?.enableRotationAxes?.x ?? true;
		this.enableRotationY = settings?.enableRotationAxes?.y ?? true;
		this.enableRotationZ = settings?.enableRotationAxes?.z ?? true;
		this.enableScaling = settings?.enableScaling ?? false;
		this.enableScalingX = settings?.enableScalingAxes?.x ?? true;
		this.enableScalingY = settings?.enableScalingAxes?.y ?? true;
		this.enableScalingZ = settings?.enableScalingAxes?.z ?? true;
		this.enableTranslation = settings?.enableTranslation ?? true;
		this.enableTranslationX = settings?.enableTranslationAxes?.x ?? true;
		this.enableTranslationY = settings?.enableTranslationAxes?.y ?? true;
		this.enableTranslationZ = settings?.enableTranslationAxes?.z ?? true;
		this.scale = settings?.scale ?? 0.15;
		// we don't allow to change the space for now
		this.#space = settings?.space ?? "local";
		this.#transformControls.space = this.#space;
		// we don't allow to change the reuseTransformation for now
		this.#reuseTransformation = settings?.reuseTransformation ?? true;

		this.setup();
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (32)

	public get closed(): boolean {
		return this.#closed;
	}

	public get enableRotation(): boolean {
		return this.#enableRotation;
	}

	public set enableRotation(value: boolean) {
		this.#enableRotation = value;
		this.#transformControls.enableRotation = value;
	}

	public get enableRotationX(): boolean {
		return this.#enableRotationX;
	}

	public set enableRotationX(value: boolean) {
		this.#enableRotationX = value;
		this.#transformControls.enableRotationX = value;
	}

	public get enableRotationY(): boolean {
		return this.#enableRotationY;
	}

	public set enableRotationY(value: boolean) {
		this.#enableRotationY = value;
		this.#transformControls.enableRotationY = value;
	}

	public get enableRotationZ(): boolean {
		return this.#enableRotationZ;
	}

	public set enableRotationZ(value: boolean) {
		this.#enableRotationZ = value;
		this.#transformControls.enableRotationZ = value;
	}

	public get enableScaling(): boolean {
		return this.#enableScaling;
	}

	public set enableScaling(value: boolean) {
		this.#enableScaling = value;
		this.#transformControls.enableScaling = value;
	}

	public get enableScalingX(): boolean {
		return this.#enableScalingX;
	}

	public set enableScalingX(value: boolean) {
		this.#enableScalingX = value;
		this.#transformControls.enableScalingX = value;
	}

	public get enableScalingY(): boolean {
		return this.#enableScalingY;
	}

	public set enableScalingY(value: boolean) {
		this.#enableScalingY = value;
		this.#transformControls.enableScalingY = value;
	}

	public get enableScalingZ(): boolean {
		return this.#enableScalingZ;
	}

	public set enableScalingZ(value: boolean) {
		this.#enableScalingZ = value;
		this.#transformControls.enableScalingZ = value;
	}

	public get enableTranslation(): boolean {
		return this.#enableTranslation;
	}

	public set enableTranslation(value: boolean) {
		this.#enableTranslation = value;
		this.#transformControls.enableTranslation = value;
	}

	public get enableTranslationX(): boolean {
		return this.#enableTranslationX;
	}

	public set enableTranslationX(value: boolean) {
		this.#enableTranslationX = value;
		this.#transformControls.enableTranslationX = value;
	}

	public get enableTranslationY(): boolean {
		return this.#enableTranslationY;
	}

	public set enableTranslationY(value: boolean) {
		this.#enableTranslationY = value;
		this.#transformControls.enableTranslationY = value;
	}

	public get enableTranslationZ(): boolean {
		return this.#enableTranslationZ;
	}

	public set enableTranslationZ(value: boolean) {
		this.#enableTranslationZ = value;
		this.#transformControls.enableTranslationZ = value;
	}

	public get matrix(): mat4 {
		return this.#matrix;
	}

	public get reuseTransformation(): boolean {
		return this.#reuseTransformation;
	}

	public get scale(): number {
		return this.#scale;
	}

	public set scale(value: number) {
		this.#scale = value;
		const size = sceneTree.root.boundingBox.boundingSphere.radius * value;
		this.#transformControls.setSize(size);
	}

	public get show(): boolean {
		return this.#show;
	}

	public set show(value: boolean) {
		this.#show = value;
	}

	public get space(): "local" | "world" {
		return this.#space;
	}

	// #endregion Public Getters And Setters (32)

	// #region Public Methods (10)

	public close(): void {
		this.#parentObject.remove(this.#transformControls);
		this.#parentObject.remove(this.#transformationControlsPlaceholder);
		this.#transformControls.detach();
		this.#transformControls.dispose();
		this.#viewport.threeJsCoreObjects.scene.remove(this.#parentObject);

		this.#viewport.removeCanvasEventListener(
			this.#canvasEventListenerToken,
		);
		if (this.#continuousRenderingFlag)
			this.#viewport.removeFlag(this.#continuousRenderingFlag);
		if (this.#continuousShadowMapUpdateFlag)
			this.#viewport.removeFlag(this.#continuousShadowMapUpdateFlag);
		if (this.#cameraFreezeFlag)
			this.#viewport.removeFlag(this.#cameraFreezeFlag);
	}

	public keyPressed(key: string | string[]): boolean {
		if (Array.isArray(key)) {
			// check if one of the keys is pressed
			let result = false;
			for (let i = 0; i < key.length; i++) {
				result = result || this.keyPressCheck(key[i]);
			}
			return result;
		} else {
			return this.keyPressCheck(key);
		}
	}

	public onKeyDown(event: KeyboardEvent): void {
		if (this.closed) return;
		this.#keysPressed[event.key] = true;

		if (
			this.#moving === false &&
			Object.values(this.#keysPressed).length === 1 &&
			this.keyPressed("p") &&
			this.#pivotDragging === false
		) {
			this.activatePivotDragging();
		}
	}

	public onKeyUp(event: KeyboardEvent): void {
		if (this.closed) return;
		delete this.#keysPressed[event.key];

		if (this.#pivotDragging === true && !this.keyPressed("p")) {
			this.deactivatePivotDragging();
		}
	}

	public onMouseWheel(event: WheelEvent): void {}

	public onPointerDown(event: PointerEvent): void {
		if (this.closed) return;

		this.#transformControls.onPointerDown(event);

		this.#moving = this.#transformControls.dragging;
		if (
			this.#transformControls.dragging ||
			this.#transformControls.hovering
		)
			this.#viewport.addRestrictedCanvasListenerToken(
				this.#canvasEventListenerToken,
			);
	}

	public onPointerEnd(event: PointerEvent): void {
		if (this.closed) return;

		this.#moving = false;
		this.#viewport.removeRestrictedCanvasListenerToken(
			this.#canvasEventListenerToken,
		);

		this.#transformControls.onPointerUp(event);
	}

	public onPointerMove(event: PointerEvent): void {
		if (this.closed) return;

		if (!this.#continuousRenderingFlag)
			this.#continuousRenderingFlag = this.#viewport.addFlag(
				FLAG_TYPE.CONTINUOUS_RENDERING,
			);
		if (!this.#continuousShadowMapUpdateFlag)
			this.#continuousShadowMapUpdateFlag = this.#viewport.addFlag(
				FLAG_TYPE.CONTINUOUS_SHADOW_MAP_UPDATE,
			);

		if (
			this.#moving === false &&
			Object.values(this.#keysPressed).length === 1 &&
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
			this.#viewport.addRestrictedCanvasListenerToken(
				this.#canvasEventListenerToken,
			);
		} else {
			this.#viewport.removeRestrictedCanvasListenerToken(
				this.#canvasEventListenerToken,
			);
		}
	}

	public onPointerOut(event: PointerEvent): void {
		if (this.closed) return;

		if (this.#continuousRenderingFlag) {
			this.#viewport.removeFlag(this.#continuousRenderingFlag);
			this.#continuousRenderingFlag = undefined;
		}
		if (this.#continuousShadowMapUpdateFlag) {
			this.#viewport.removeFlag(this.#continuousShadowMapUpdateFlag);
			this.#continuousShadowMapUpdateFlag = undefined;
		}
		this.#viewport.render();

		this.#moving = false;
	}

	public onPointerUp(event: PointerEvent): void {
		if (this.closed) return;

		this.#moving = false;
	}

	// #endregion Public Methods (10)

	// #region Private Methods (7)

	private activatePivotDragging() {
		this.#pivotDragging = true;

		this.#transformControls.pivotDragged = true;
		this.#transformControls.enableTranslation = true;
		this.#transformControls.enableRotation = false;
		this.#transformControls.enableScaling = false;

		if (this.#singleNode === true && this.reuseTransformation === true) {
			const index = this.#nodes[0].transformations.findIndex(
				(t) => t.id === "SD_gumball_matrix",
			);
			if (index !== -1) {
				this.#previousGumballMatrix[0] = mat4.clone(
					this.#nodes[0].transformations[index].matrix,
				);
			} else {
				this.#previousGumballMatrix[0] = mat4.create();
			}
		}

		this.#currentMatrix = this.#transformationControlsPlaceholder.matrix
			.clone()
			.multiply(
				new THREE.Matrix4().fromArray(this.#pivotOffset).invert(),
			);
	}

	private deactivatePivotDragging() {
		this.#pivotDragging = false;

		this.#transformControls.pivotDragged = false;
		this.#transformControls.enableTranslation = this.#enableTranslation;
		this.#transformControls.enableRotation = this.#enableRotation;
		this.#transformControls.enableScaling = this.#enableScaling;
	}

	private getMatrix(previousMatrix: mat4): mat4 {
		const m = new THREE.Matrix4().copy(
			this.#transformationControlsPlaceholder.matrix,
		);
		const placeholderMatrix = mat4.fromValues(...m.toArray());
		const initialOffsetCorrectionMatrix = mat4.fromTranslation(
			mat4.create(),
			vec3.negate(vec3.create(), this.#initialOffset),
		);
		const placeholderMatrixWithoutInitialOffset = mat4.multiply(
			mat4.create(),
			placeholderMatrix,
			initialOffsetCorrectionMatrix,
		);

		this.#matrix = mat4.clone(placeholderMatrixWithoutInitialOffset);
		if (this.#singleNode === true) {
			if (this.reuseTransformation === true) {
				const finalMatrix = mat4.create();
				mat4.multiply(
					finalMatrix,
					placeholderMatrixWithoutInitialOffset,
					mat4.invert(mat4.create(), this.#pivotOffset),
				);
				return finalMatrix;
			} else {
				const finalMatrix = mat4.create();
				mat4.multiply(
					finalMatrix,
					placeholderMatrixWithoutInitialOffset,
					mat4.invert(mat4.create(), this.#pivotOffset),
				);
				mat4.multiply(finalMatrix, finalMatrix, previousMatrix);
				return finalMatrix;
			}
		} else {
			const finalMatrix = mat4.create();
			mat4.multiply(
				finalMatrix,
				placeholderMatrixWithoutInitialOffset,
				mat4.invert(mat4.create(), this.#pivotOffset),
			);
			mat4.multiply(finalMatrix, finalMatrix, previousMatrix);
			return finalMatrix;
		}
	}

	private keyPressCheck(key: string): boolean {
		const pressedKeys = Object.keys(this.#keysPressed).filter(
			(key) => this.#keysPressed[key] === true,
		);

		// check if it the only key that is pressed
		if (key.includes("+") && key.length > 1) {
			const keys = key.split("+");

			// there are more keys pressed than the keys in the combination
			if (keys.length !== pressedKeys.length) return false;
			let result = true;
			for (let i = 0; i < keys.length; i++)
				result = result && (this.#keysPressed[keys[i]] || false);

			return result;
		} else {
			// there are also other keys pressed
			if (pressedKeys.length > 1) return false;

			return this.#keysPressed[key] || false;
		}
	}

	private setup() {
		// assign the position to the transformation controls objects
		if (this.#singleNode) {
			const index = this.#nodes[0].transformations.findIndex(
				(t) => t.id === "SD_gumball_matrix",
			);
			if (index !== -1) {
				this.#previousGumballMatrix[0] = mat4.clone(
					this.#nodes[0].transformations[index].matrix,
				);
			} else {
				this.#previousGumballMatrix[0] = mat4.create();
			}

			if (this.reuseTransformation === true) {
				const trueBB = new Box();
				this.#nodes[0].traverseData((d) => {
					if (d instanceof GeometryData) {
						trueBB.union(d.boundingBox);
					}
				});

				vec3.copy(this.#initialOffset, trueBB.boundingSphere.center);
				this.#transformationControlsPlaceholder.applyMatrix4(
					new THREE.Matrix4().makeTranslation(
						new THREE.Vector3().fromArray(this.#initialOffset),
					),
				);

				const transformations: {[key: string]: mat4} = {};
				this.#nodes[0].traverse((c) => {
					if (c.name.startsWith("mesh_") && c.parent)
						transformations[c.parent.name] = mat4.clone(
							c.parent.nodeMatrix,
						);
				});

				if (
					Object.keys(transformations).length === 1 &&
					Object.keys(transformations)[0] !== "no_transformations"
				) {
					this.#initialTransform[0] = mat4.clone(
						transformations[Object.keys(transformations)[0]],
					);
					const initialWorldTransform = mat4.multiply(
						mat4.create(),
						this.#nodes[0].worldMatrix,
						this.#initialTransform[0],
					);
					this.#transformationControlsPlaceholder.applyMatrix4(
						new THREE.Matrix4().fromArray(initialWorldTransform),
					);
				} else {
					this.#initialTransform[0] = mat4.create();
					this.#transformationControlsPlaceholder.applyMatrix4(
						new THREE.Matrix4().fromArray(
							this.#nodes[0].worldMatrix,
						),
					);
				}
			} else {
				this.#initialTransform[0] = mat4.create();
				vec3.copy(
					this.#initialOffset,
					this.#nodes[0].boundingBox.boundingSphere.center,
				);
				this.#transformationControlsPlaceholder.applyMatrix4(
					new THREE.Matrix4().makeTranslation(
						new THREE.Vector3().fromArray(this.#initialOffset),
					),
				);
			}
		} else {
			const boundingBox = new Box();
			this.#previousGumballMatrix = [];
			for (let i = 0; i < this.#nodes.length; i++) {
				const node = this.#nodes[i];
				boundingBox.union(node.boundingBox);

				const index = node.transformations.findIndex(
					(t) => t.id === "SD_gumball_matrix",
				);
				if (index !== -1) {
					this.#previousGumballMatrix.push(
						mat4.clone(node.transformations[index].matrix),
					);
				} else {
					this.#previousGumballMatrix.push(mat4.create());
				}

				const transformations: {[key: string]: mat4} = {};
				node.traverse((c) => {
					if (c.name.startsWith("mesh_") && c.parent) {
						transformations[c.parent.name] = mat4.clone(
							c.parent.nodeMatrix,
						);
					}
				});
				if (
					Object.keys(transformations).length === 1 &&
					Object.keys(transformations)[0] !== "no_transformations"
				) {
					this.#initialTransform[i] = mat4.clone(
						transformations[Object.keys(transformations)[0]],
					);
				} else {
					this.#initialTransform[i] = mat4.create();
				}
			}
			vec3.copy(this.#initialOffset, boundingBox.boundingSphere.center);
			this.#transformationControlsPlaceholder.applyMatrix4(
				new THREE.Matrix4().makeTranslation(
					new THREE.Vector3().fromArray(this.#initialOffset),
				),
			);
		}

		this.#transformControls.attach(this.#transformationControlsPlaceholder);
		this.#transformControls.setSize(this.#scale);
		this.#parentObject.add(this.#transformControls);
		this.#parentObject.add(this.#transformationControlsPlaceholder);
		this.#viewport.threeJsCoreObjects.scene.add(this.#parentObject);

		// we register the CAMERA_FREEZE whenever the dragging happens
		this.#transformControls.addEventListener(
			"dragging-changed",
			(event: unknown) => {
				if ((event as {value: boolean}).value === true) {
					if (this.#cameraFreezeFlag)
						this.#viewport.removeFlag(this.#cameraFreezeFlag);
					this.#cameraFreezeFlag = this.#viewport.addFlag(
						FLAG_TYPE.CAMERA_FREEZE,
					);
				} else if (this.#cameraFreezeFlag) {
					this.#viewport.removeFlag(this.#cameraFreezeFlag);
					this.#cameraFreezeFlag = undefined;
				}
			},
		);
	}

	private updateObjectMatrices() {
		if (this.#pivotDragging === true) {
			const currentMatrix = this.#transformationControlsPlaceholder.matrix
				.clone()
				.multiply(
					new THREE.Matrix4().fromArray(this.#pivotOffset).invert(),
				);

			const delta = new THREE.Matrix4().multiplyMatrices(
				this.#currentMatrix.clone().invert(),
				currentMatrix,
			);
			mat4.multiply(
				this.#pivotOffset,
				this.#pivotOffset,
				mat4.fromValues(...delta.toArray()),
			);

			this.deactivatePivotDragging();
		} else {
			const eventData: IGumballEvent = {
				viewportId: this.#viewport.id,
				transformations: [],
				localTransformations: [],
				nodes: [],
			};

			this.#nodes.forEach((node, i) => {
				const matrix = this.getMatrix(this.#previousGumballMatrix[i]);

				eventData.nodes.push(node);
				if (this.#singleNode) {
					eventData.transformations.push(mat4.clone(matrix));
					mat4.multiply(
						matrix,
						matrix,
						mat4.invert(mat4.create(), this.#initialTransform[i]),
					);
				} else {
					eventData.transformations.push(
						mat4.multiply(
							mat4.create(),
							matrix,
							this.#initialTransform[i],
						),
					);
				}

				const transformation = node.transformations.find(
					(t) => t.id === this.#matrixId,
				);
				eventData.localTransformations.push(mat4.clone(matrix));
				if (transformation) {
					transformation.matrix = matrix;
				} else {
					node.transformations.push({
						id: this.#matrixId,
						matrix,
					});
				}
				node.updateVersion();
			});

			// emit the event
			this.#eventEngine.emitEvent(
				EVENTTYPE_GUMBALL.MATRIX_CHANGED,
				eventData,
			);
		}
	}

	private updateObjects() {
		if (this.#pivotDragging === true) return;

		this.#nodes.forEach((node, i) => {
			const threeJsObject: THREE.Object3D | undefined = node
				.convertedObject[this.#viewport.id] as THREE.Object3D;
			if (threeJsObject) {
				const matrix = this.getMatrix(
					this.#previousGumballMatrix![i] as mat4,
				);

				if (this.#singleNode)
					mat4.multiply(
						matrix,
						matrix,
						mat4.invert(mat4.create(), this.#initialTransform[i]),
					);

				threeJsObject.matrixAutoUpdate = false;
				threeJsObject.matrix.copy(
					new THREE.Matrix4().fromArray(matrix),
				);
				threeJsObject.matrixWorldNeedsUpdate = true;
			}
		});
	}

	// #endregion Private Methods (7)
}
