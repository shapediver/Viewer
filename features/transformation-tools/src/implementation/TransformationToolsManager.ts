import * as THREE from "three";

import {Box, IViewportApi, SessionApiData} from "@shapediver/viewer";
import {
	IRestrictionManager,
	RestrictionManager,
	RestrictionProperties,
} from "@shapediver/viewer.rendering-engine.intersection-restriction-engine";
import {ITreeNode} from "@shapediver/viewer.shared.node-tree";
import {
	EventEngine,
	EVENTTYPE_TRANSFORMATION_TOOLS,
	SystemInfo,
} from "@shapediver/viewer.shared.services";
import {FLAG_TYPE, GeometryData} from "@shapediver/viewer.shared.types";

import {mat4, vec3} from "gl-matrix";

import {ITransformationToolsEvent} from "../interfaces/events/ITransformationToolsEvent";
import {
	ITransformationToolsManager,
	SettingsOptional,
} from "../interfaces/ITransformationToolsManager";

export abstract class TransformationToolsManager
	implements ITransformationToolsManager
{
	readonly #eventEngine: EventEngine = EventEngine.instance;
	readonly #keysPressed: {[key: string]: boolean} = {};
	readonly #matrixId: string = "SD_transformation_tools_matrix";
	readonly #nodes: ITreeNode[] = [];
	readonly #parentObject: THREE.Object3D = new THREE.Object3D();
	readonly #restrictionManager?: IRestrictionManager;
	readonly #singleNode: boolean;
	readonly #viewport: IViewportApi;

	#cameraFreezeFlag?: string;
	#canvasEventListenerToken: string;
	#closed: boolean = false;
	#continuousRenderingFlag?: string;
	#continuousShadowMapUpdateFlag?: string;
	#initialOffset: vec3 = vec3.create();
	#initialTransform: mat4[] = [];
	#instanceTransform: mat4[] = [];
	#pivotOffset: mat4 = mat4.create();
	#previousTransformationToolsMatrix: mat4[] = [];
	#reuseTransformation: boolean = true;
	#settings?: SettingsOptional;
	#show: boolean = true;

	protected abstract transformationToolsPlaceholderMatrix: mat4;

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
		this.#settings = settings;

		if (this.#singleNode && settings?.restrictions !== undefined) {
			const restrictionsArray: RestrictionProperties[] = [];
			for (const restrictionId in settings.restrictions) {
				const restriction = settings.restrictions[restrictionId];
				if (!restriction) continue;
				if (!restriction.id) restriction.id = restrictionId;
				restrictionsArray.push(restriction);
			}
			this.#restrictionManager = new RestrictionManager(
				viewport,
				undefined,
				restrictionsArray,
			);
		}

		// we don't allow to change the reuseTransformation for now
		this.#reuseTransformation = settings?.reuseTransformation ?? true;
	}

	public get closed(): boolean {
		return this.#closed;
	}

	public get show(): boolean {
		return this.#show;
	}

	public set show(value: boolean) {
		this.#show = value;
	}

	protected get canvasEventListenerToken(): string {
		return this.#canvasEventListenerToken;
	}

	protected get initialOffset(): vec3 {
		return this.#initialOffset;
	}

	protected get initialTransform(): mat4[] {
		return this.#initialTransform;
	}

	protected get instanceTransform(): mat4[] {
		return this.#instanceTransform;
	}

	protected get keysPressed(): {[key: string]: boolean} {
		return this.#keysPressed;
	}

	protected get nodes(): ITreeNode[] {
		return this.#nodes;
	}

	protected get parentObject(): THREE.Object3D {
		return this.#parentObject;
	}

	protected get pivotOffset(): mat4 {
		return this.#pivotOffset;
	}

	protected get previousTransformationToolsMatrix(): mat4[] {
		return this.#previousTransformationToolsMatrix;
	}

	protected get restrictionManager(): IRestrictionManager | undefined {
		return this.#restrictionManager;
	}

	protected get reuseTransformation(): boolean {
		return this.#reuseTransformation;
	}

	public get settings(): SettingsOptional | undefined {
		return this.#settings;
	}

	protected get singleNode(): boolean {
		return this.#singleNode;
	}

	protected abstract get type(): "gumballTransform" | "rectangleTransform";

	protected get viewport(): IViewportApi {
		return this.#viewport;
	}

	public close(): void {
		this.#closed = true;
		this.closeLogic();

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

	public onKeyDown(event: KeyboardEvent, pointerInCanvas: boolean): void {
		if (this.closed) return;
		if (!pointerInCanvas) return;
		this.#keysPressed[event.key] = true;

		this.onKeyDownLogic(event, pointerInCanvas);
	}

	public onKeyUp(event: KeyboardEvent, pointerInCanvas: boolean): void {
		if (this.closed) return;
		delete this.#keysPressed[event.key];

		this.onKeyUpLogic(event, pointerInCanvas);
	}

	public onMouseWheel(event: WheelEvent): void {}

	public onPointerDown(event: PointerEvent): void {
		if (this.closed) return;

		this.onPointerDownLogic(event);
	}

	public onPointerEnd(event: PointerEvent): void {
		if (this.closed) return;

		this.onPointerEndLogic(event);
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

		this.onPointerMoveLogic(event);
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

		this.onPointerOutLogic(event);
	}

	public onPointerUp(event: PointerEvent): void {
		if (this.closed) return;

		this.onPointerUpLogic(event);
	}

	protected abstract closeLogic(): void;

	protected getMatrix(previousMatrix: mat4, instanceMatrix: mat4): mat4 {
		const placeholderMatrix = mat4.copy(
			mat4.create(),
			this.transformationToolsPlaceholderMatrix,
		);
		const initialOffsetCorrectionMatrix = mat4.fromTranslation(
			mat4.create(),
			vec3.negate(vec3.create(), this.initialOffset),
		);

		const placeholderMatrixWithoutInitialOffset = mat4.multiply(
			mat4.create(),
			placeholderMatrix,
			initialOffsetCorrectionMatrix,
		);

		const matrix = mat4.clone(placeholderMatrixWithoutInitialOffset);
		if (this.singleNode === true) {
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
				placeholderMatrixWithoutInitialOffset,
				placeholderMatrixWithoutInitialOffset,
				instanceMatrix,
			);

			mat4.multiply(
				finalMatrix,
				placeholderMatrixWithoutInitialOffset,
				mat4.invert(mat4.create(), this.#pivotOffset),
			);
			mat4.multiply(finalMatrix, finalMatrix, previousMatrix);
			return finalMatrix;
		}
	}

	protected initialize(): mat4 {
		const transformationPlaceholderMatrix = mat4.create();

		// assign the position to the transformation tools objects
		if (this.#singleNode) {
			const index = this.#nodes[0].transformations.findIndex(
				(t) => t.id === "SD_transformation_tools_matrix",
			);
			if (index !== -1) {
				this.#previousTransformationToolsMatrix[0] = mat4.clone(
					this.#nodes[0].transformations[index].matrix,
				);
			} else {
				this.#previousTransformationToolsMatrix[0] = mat4.create();
			}

			if (this.reuseTransformation === true) {
				const trueBB = new Box();
				this.#nodes[0].traverseData((d) => {
					if (d instanceof GeometryData) {
						trueBB.union(d.boundingBox);
					}
				});

				vec3.copy(this.#initialOffset, trueBB.boundingSphere.center);
				mat4.fromTranslation(
					transformationPlaceholderMatrix,
					this.#initialOffset,
				);
				{
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
						mat4.multiply(
							transformationPlaceholderMatrix,
							transformationPlaceholderMatrix,
							initialWorldTransform,
						);
					} else {
						this.#initialTransform[0] = mat4.create();
						mat4.multiply(
							transformationPlaceholderMatrix,
							transformationPlaceholderMatrix,
							this.#nodes[0].worldMatrix,
						);
					}
				}
				{
					// the structure is as follows:
					// sessionNode -> instanceNode -> transformations
					// therefore we first find the the node with the name "transformations[*]"
					// and then check if the parent of its parent is the sessionNode
					let currentNode = this.#nodes[0];
					this.#instanceTransform[0] = mat4.create();
					while (currentNode.parent) {
						// we have found the transformations node
						if (
							new RegExp(/^transformations\[\d+\]$/).test(
								currentNode.name,
							)
						) {
							if (
								currentNode.parent &&
								currentNode.parent.parent &&
								currentNode.parent.parent.data.find(
									(d) => d instanceof SessionApiData,
								)
							) {
								// we confirm that this is a proper transformations node of an instance
								this.#instanceTransform[0] = mat4.clone(
									currentNode.transformations[0].matrix,
								);
								break;
							}
						}
						currentNode = currentNode.parent;
					}
				}
			} else {
				this.#initialTransform[0] = mat4.create();
				vec3.copy(
					this.#initialOffset,
					this.#nodes[0].boundingBox.boundingSphere.center,
				);
				mat4.multiply(
					transformationPlaceholderMatrix,
					transformationPlaceholderMatrix,
					mat4.fromTranslation(mat4.create(), this.#initialOffset),
				);
			}
		} else {
			const boundingBox = new Box();
			this.#previousTransformationToolsMatrix = [];
			for (let i = 0; i < this.#nodes.length; i++) {
				const node = this.#nodes[i];
				boundingBox.union(node.boundingBox);

				const index = node.transformations.findIndex(
					(t) => t.id === "SD_transformation_tools_matrix",
				);
				if (index !== -1) {
					this.#previousTransformationToolsMatrix.push(
						mat4.clone(node.transformations[index].matrix),
					);
				} else {
					this.#previousTransformationToolsMatrix.push(mat4.create());
				}
				{
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

				{
					// the structure is as follows:
					// sessionNode -> instanceNode -> transformations
					// therefore we first find the the node with the name "transformations[*]"
					// and then check if the parent of its parent is the sessionNode
					let currentNode = node;
					this.#instanceTransform[i] = mat4.create();
					while (currentNode.parent) {
						// we have found the transformations node
						if (
							new RegExp(/^transformations\[\d+\]$/).test(
								currentNode.name,
							)
						) {
							if (
								currentNode.parent &&
								currentNode.parent.parent &&
								currentNode.parent.parent.data.find(
									(d) => d instanceof SessionApiData,
								)
							) {
								// we confirm that this is a proper transformations node of an instance
								this.#instanceTransform[i] = mat4.clone(
									currentNode.transformations[0].matrix,
								);
								break;
							}
						}
						currentNode = currentNode.parent;
					}
				}
			}
			vec3.copy(this.#initialOffset, boundingBox.boundingSphere.center);

			mat4.multiply(
				transformationPlaceholderMatrix,
				transformationPlaceholderMatrix,
				mat4.fromTranslation(mat4.create(), this.#initialOffset),
			);
		}

		return transformationPlaceholderMatrix;
	}

	protected onKeyDownLogic(
		_event: KeyboardEvent,
		_pointerInCanvas: boolean,
	): void {}

	protected onKeyUpLogic(
		_event: KeyboardEvent,
		_pointerInCanvas: boolean,
	): void {}

	protected onPointerDownLogic(_event: PointerEvent): void {}

	protected onPointerEndLogic(_event: PointerEvent): void {}

	protected onPointerMoveLogic(_event: PointerEvent): void {}

	protected onPointerOutLogic(_event: PointerEvent): void {}

	protected onPointerUpLogic(_event: PointerEvent): void {}

	protected toggleCameraFreeze(freeze: boolean): void {
		if (freeze) {
			if (!this.#cameraFreezeFlag)
				this.#cameraFreezeFlag = this.#viewport.addFlag(
					FLAG_TYPE.CAMERA_FREEZE,
				);
		} else {
			if (this.#cameraFreezeFlag) {
				this.#viewport.removeFlag(this.#cameraFreezeFlag);
				this.#cameraFreezeFlag = undefined;
			}
		}
	}

	protected updateObjectMatrices(): void {
		const eventData: ITransformationToolsEvent = {
			viewportId: this.viewport.id,
			transformations: [],
			localTransformations: [],
			nodes: [],
			type: this.type,
		};

		this.nodes.forEach((node, i) => {
			const matrix = this.getMatrix(
				this.previousTransformationToolsMatrix[i],
				this.instanceTransform[i],
			);

			eventData.nodes.push(node);
			if (this.singleNode) {
				mat4.multiply(
					matrix,
					mat4.invert(mat4.create(), this.instanceTransform[i]),
					matrix,
				);
				eventData.transformations.push(mat4.clone(matrix));
				mat4.multiply(
					matrix,
					matrix,
					mat4.invert(mat4.create(), this.initialTransform[i]),
				);
			} else {
				const eventDataMatrix = mat4.clone(matrix);
				mat4.multiply(
					eventDataMatrix,
					eventDataMatrix,
					this.initialTransform[i],
				);
				mat4.multiply(
					eventDataMatrix,
					mat4.invert(mat4.create(), this.instanceTransform[i]),
					eventDataMatrix,
				);
				eventData.transformations.push(eventDataMatrix);

				mat4.multiply(
					matrix,
					mat4.invert(mat4.create(), this.instanceTransform[i]),
					matrix,
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
			EVENTTYPE_TRANSFORMATION_TOOLS.MATRIX_CHANGED,
			eventData,
		);
	}

	protected updateObjects() {
		this.nodes.forEach((node, i) => {
			const threeJsObject: THREE.Object3D | undefined = node
				.convertedObject[this.viewport.id] as THREE.Object3D;
			if (threeJsObject) {
				const matrix = this.getMatrix(
					this.previousTransformationToolsMatrix![i] as mat4,
					this.instanceTransform[i],
				);

				if (this.singleNode) {
					mat4.multiply(
						matrix,
						mat4.invert(mat4.create(), this.instanceTransform[i]),
						matrix,
					);
					mat4.multiply(
						matrix,
						matrix,
						mat4.invert(mat4.create(), this.initialTransform[i]),
					);
				} else {
					mat4.multiply(
						matrix,
						mat4.invert(mat4.create(), this.instanceTransform[i]),
						matrix,
					);
				}

				threeJsObject.matrixAutoUpdate = false;
				threeJsObject.matrix.copy(
					new THREE.Matrix4().fromArray(matrix),
				);
				threeJsObject.matrixWorldNeedsUpdate = true;
			}
		});
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
}
