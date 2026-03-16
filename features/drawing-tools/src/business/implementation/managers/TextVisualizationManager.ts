import {
	addListener,
	EVENTTYPE_DRAWING_TOOLS,
	ITreeNode,
	IViewportApi,
	ThreejsData,
	TreeNode,
} from "@shapediver/viewer";
import {
	CSS2DObject,
	CSS2DRenderer,
} from "@shapediver/viewer.rendering-engine.rendering-engine-threejs";
import {numberCleaner} from "@shapediver/viewer.shared.services";
import {vec3} from "gl-matrix";
import * as THREE from "three";
import {DrawingToolsEventResponseMapping} from "../../interfaces/events/EventResponseMapping";
import {Settings} from "../../interfaces/IDrawingToolsManager";
import {DrawingToolsManager} from "../DrawingToolsManager";

export class TextVisualizationManager {
	// #region Properties (14)

	readonly #drawingToolsManager: DrawingToolsManager;
	readonly #labelRenderer: CSS2DRenderer;
	readonly #parentNode: ITreeNode;
	readonly #settings: Settings;
	readonly #viewport: IViewportApi;
	readonly #visualizationNode: TreeNode = new TreeNode(
		"TextVisualizationNode",
	);

	#distanceObject3D: THREE.Object3D;
	#object3D: THREE.Object3D;
	#pointerPositionField: HTMLDivElement;
	#positionObject3D: THREE.Object3D;
	#prevHeight: number = 0;
	#prevWidth: number = 0;
	#showDistanceLabels: boolean = true;
	#showPointLabels: boolean = true;
	#showPointerPosition: boolean = true;

	// #endregion Properties (14)

	// #region Constructors (1)

	constructor(drawingToolsManager: DrawingToolsManager) {
		this.#drawingToolsManager = drawingToolsManager;
		this.#viewport = drawingToolsManager.viewport;
		this.#settings = drawingToolsManager.settings;
		this.#parentNode = drawingToolsManager.parentNode;

		this.#visualizationNode.intersectionTest = false;

		this.#labelRenderer = new CSS2DRenderer();
		this.#labelRenderer.setSize(
			this.#viewport.canvas.clientWidth,
			this.#viewport.canvas.clientHeight,
		);
		this.#labelRenderer.domElement.style.userSelect = "none";
		this.#labelRenderer.domElement.style.cursor = "default";
		this.#labelRenderer.domElement.style.pointerEvents = "none";
		this.#labelRenderer.domElement.style.overflow = "hidden";
		this.#labelRenderer.domElement.style.position = "absolute";
		this.#labelRenderer.domElement.style.width = "100%";
		this.#labelRenderer.domElement.style.height = "100%";
		this.#labelRenderer.domElement.style.left = "0%";
		this.#labelRenderer.domElement.style.top = "0%";
		this.#viewport.canvas.parentElement!.appendChild(
			this.#labelRenderer.domElement,
		);

		this.#pointerPositionField = document.createElement("div");
		this.#pointerPositionField.className = "label";
		this.#pointerPositionField.style.marginTop = "1em";
		this.#pointerPositionField.style.position = "absolute";
		this.#pointerPositionField.style.left = "1%";
		this.#pointerPositionField.style.bottom = "1%";
		this.#viewport.canvas.parentElement!.appendChild(
			this.#pointerPositionField,
		);

		this.#viewport.postRenderingCallback = (
			renderer: THREE.WebGLRenderer,
			scene: THREE.Scene,
			camera: THREE.Camera,
		) => {
			if (
				this.#prevWidth !== renderer.domElement.clientWidth ||
				this.#prevHeight !== renderer.domElement.clientHeight
			) {
				this.#prevWidth = renderer.domElement.clientWidth;
				this.#prevHeight = renderer.domElement.clientHeight;
				this.#labelRenderer.setSize(
					renderer.domElement.clientWidth,
					renderer.domElement.clientHeight,
				);
			}

			if (
				this.#labelRenderer.domElement.clientWidth !==
					renderer.domElement.clientWidth ||
				this.#labelRenderer.domElement.clientHeight !==
					renderer.domElement.clientHeight
			) {
				this.#labelRenderer.setSize(
					renderer.domElement.clientWidth,
					renderer.domElement.clientHeight,
				);
			}
			this.#labelRenderer.render(scene, camera);
		};

		this.#object3D = new THREE.Object3D();
		this.#positionObject3D = new THREE.Object3D();
		this.#positionObject3D.visible =
			this.#settings.visualization.pointLabels;
		this.#distanceObject3D = new THREE.Object3D();
		this.#distanceObject3D.visible =
			this.#settings.visualization.distanceLabels;

		this.#object3D.add(this.#positionObject3D);
		this.#object3D.add(this.#distanceObject3D);

		this.#showPointLabels = this.#settings.visualization.pointLabels;
		this.#showDistanceLabels = this.#settings.visualization.distanceLabels;
		this.#showPointerPosition =
			this.#settings.visualization.pointerPosition;

		const node = new TreeNode("ThreeJsDataNode");
		node.intersectionTest = false;

		const data = new ThreejsData(this.#object3D);
		node.addData(data);

		this.#visualizationNode.addChild(node);
		this.#visualizationNode.updateVersion();
		this.#parentNode.addChild(this.#visualizationNode);
		this.#parentNode.updateVersion(false, false);
		this.#viewport.updateNode(this.#parentNode);

		this.createPointLabels();
		this.createDistanceLabels();

		addListener(EVENTTYPE_DRAWING_TOOLS.GEOMETRY_CHANGED, (e) => {
			const event =
				e as DrawingToolsEventResponseMapping[EVENTTYPE_DRAWING_TOOLS.GEOMETRY_CHANGED];
			if (event.drawingToolsId !== this.#drawingToolsManager.uuid) return;
			this.createPointLabels();
			this.createDistanceLabels();
		});

		addListener(EVENTTYPE_DRAWING_TOOLS.MOVED, (e) => {
			const event =
				e as DrawingToolsEventResponseMapping[EVENTTYPE_DRAWING_TOOLS.MOVED];
			if (event.drawingToolsId !== this.#drawingToolsManager.uuid) return;
			this.createPointLabels();
			this.createDistanceLabels();
		});
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (4)

	public get showDistanceLabels(): boolean {
		return this.#distanceObject3D.visible;
	}

	public set showDistanceLabels(value: boolean) {
		this.#showDistanceLabels = value;
		if (this.#showDistanceLabels) {
			this.createDistanceLabels();
		} else {
			this.#distanceObject3D.remove(...this.#distanceObject3D.children);
		}
	}

	public get showPointLabels(): boolean {
		return this.#showPointLabels;
	}

	public set showPointLabels(value: boolean) {
		this.#showPointLabels = value;
		if (this.#showPointLabels) {
			this.createPointLabels();
		} else {
			this.#positionObject3D.remove(...this.#positionObject3D.children);
		}
	}

	public get showPointerPosition(): boolean {
		return this.#showPointerPosition;
	}

	public set showPointerPosition(value: boolean) {
		this.#showPointerPosition = value;
		if (!this.#showPointerPosition) {
			this.#pointerPositionField.innerHTML = "";
		}
	}

	// #endregion Public Getters And Setters (4)

	// #region Public Methods (4)

	public close(): void {
		this.#viewport.canvas.parentElement!.removeChild(
			this.#labelRenderer.domElement,
		);
		this.#viewport.canvas.parentElement!.removeChild(
			this.#pointerPositionField,
		);
		this.#positionObject3D.remove(...this.#positionObject3D.children);
		this.#distanceObject3D.remove(...this.#distanceObject3D.children);
	}

	public createDistanceLabels(): void {
		if (!this.#showDistanceLabels) return;
		this.#distanceObject3D.remove(...this.#distanceObject3D.children);

		const positionArray = this.#drawingToolsManager.positionArray;
		const indicesArrayLines = this.#drawingToolsManager.indicesArrayLines;

		if (!indicesArrayLines || positionArray.length <= 3) return;

		for (let i = 0; i < indicesArrayLines.length; i += 2) {
			// calculate the midpoint of the line
			const firstIndex = indicesArrayLines[i];
			const secondIndex = indicesArrayLines[i + 1];
			const firstPoint = vec3.fromValues(
				positionArray.at(firstIndex * 3)!,
				positionArray.at(firstIndex * 3 + 1)!,
				positionArray.at(firstIndex * 3 + 2)!,
			);
			const secondPoint = vec3.fromValues(
				positionArray.at(secondIndex * 3)!,
				positionArray.at(secondIndex * 3 + 1)!,
				positionArray.at(secondIndex * 3 + 2)!,
			);
			const midPoint = vec3.add(vec3.create(), firstPoint, secondPoint);
			vec3.scale(midPoint, midPoint, 0.5);

			const text = document.createElement("div");
			text.className = "label";
			text.style.marginTop = "1em";

			const child = document.createElement("div");
			child.className = "distance-label";

			// check if there is already a style tag in the head that defined the style for the point label
			// if not, create one
			let styleExists = false;
			document.head.querySelectorAll("style").forEach((style) => {
				if (style.textContent?.includes(".distance-label")) {
					styleExists = true;
					return;
				}
			});

			if (!styleExists) {
				const style = document.createElement("style");
				style.textContent = `
                    .distance-label {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        color: white;
                        background-color: ${this.#settings.visualization.points.color_1}80;
                        border-radius: 5px;
                        font-size: 16px;
                        text-align: center;
                        padding: 0px 2px;
                    }
                `;
				document.head.appendChild(style);
			}

			child.textContent = `${numberCleaner(vec3.distance(firstPoint, secondPoint))}${this.#settings.general.displayUnit}`;
			text.appendChild(child);

			const label = new CSS2DObject(text);
			label.position.set(midPoint[0], midPoint[1], midPoint[2]);
			this.#distanceObject3D.add(label);
		}
	}

	public createPointLabels(): void {
		if (!this.#showPointLabels) return;
		this.#positionObject3D.remove(...this.#positionObject3D.children);

		const positionArray = this.#drawingToolsManager.positionArray;
		for (let i = 0; i < positionArray.length; i += 3) {
			const text = document.createElement("div");
			text.className = "label";
			text.style.marginTop = "1em";

			const child = document.createElement("div");
			child.className = "point-label";

			// check if there is already a style tag in the head that defined the style for the point label
			// if not, create one
			let styleExists = false;
			document.head.querySelectorAll("style").forEach((style) => {
				if (style.textContent?.includes(".point-label")) {
					styleExists = true;
					return;
				}
			});

			if (!styleExists) {
				const style = document.createElement("style");
				style.textContent = `
                    .point-label {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        color: white;
                        background-color: ${this.#settings.visualization.points.color_1}80;
                        border-radius: 5px;
                        font-size: 16px;
                        text-align: center;
                        padding: 0px 2px;
                    }
                `;
				document.head.appendChild(style);
			}

			child.textContent = `[${numberCleaner(positionArray[i])}${this.#settings.general.displayUnit}, ${numberCleaner(positionArray[i + 1])}${this.#settings.general.displayUnit}, ${numberCleaner(positionArray[i + 2])}${this.#settings.general.displayUnit}]`;
			text.appendChild(child);

			const label = new CSS2DObject(text);
			label.position.set(
				positionArray[i],
				positionArray[i + 1],
				positionArray[i + 2],
			);
			this.#positionObject3D.add(label);
		}
	}

	public updatePointerPosition(p?: vec3): void {
		if (!this.#showPointerPosition) return;

		if (!p) {
			this.#pointerPositionField.innerText = "";
		} else {
			this.#pointerPositionField.innerText = `[${numberCleaner(p[0])}, ${numberCleaner(p[1])}, ${numberCleaner(p[2])}]`;
		}
	}

	// #endregion Public Methods (4)
}
