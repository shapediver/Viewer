import {
	addListener,
	EVENTTYPE_DRAWING_TOOLS,
	type ITreeNode,
	type IViewportApi,
	ThreejsData,
	TreeNode} from "@shapediver/viewer";
import {
	CSS2DObject,
	CSS2DRenderer} from "@shapediver/viewer.rendering-engine.rendering-engine-threejs";
import {numberCleaner} from "@shapediver/viewer.shared.services";
import {vec3} from "gl-matrix";
import * as THREE from "three";
import {type DrawingToolsEventResponseMapping} from "../../interfaces/events/EventResponseMapping";
import {type Settings} from "../../interfaces/IDrawingToolsManager";
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
			if (
				event.drawingToolsId !==
				this.#drawingToolsManager.geometryManager.parentNode.id
			)
				return;
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

			child.textContent = this.#formatValue(
				vec3.distance(firstPoint, secondPoint),
			);
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

			child.textContent = `[${this.#formatValue(positionArray[i])}, ${this.#formatValue(positionArray[i + 1])}, ${this.#formatValue(positionArray[i + 2])}]`;
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
			this.#pointerPositionField.innerText = `[${this.#formatValue(p[0])}, ${this.#formatValue(p[1])}, ${this.#formatValue(p[2])}]`;
		}
	}

	// #endregion Public Methods (4)

	// #region Private Methods (2)

	#formatValue(value: number): string {
		const displayUnit = this.#settings.general.displayUnit;
		switch (displayUnit) {
			case "mile":
				return this.#formatImperial(value, 63360);
			case "feet":
				return this.#formatImperial(value, 12);
			case "inches":
				return this.#formatImperial(value, 1);
			case "meter":
				return this.#formatMetric(value, 1);
			case "kilometer":
				return this.#formatMetric(value, 1000);
			case "centimeter":
				return this.#formatMetric(value, 0.01);
			case "millimeter":
				return this.#formatMetric(value, 0.001);
			default:
				return `${numberCleaner(value)}${displayUnit}`;
		}
	}

	// Converts value to inches via toInches factor, then cascades mi → ft → in.
	// Preserves up to 2 decimal places in the smallest non-zero unit shown.
	#formatImperial(value: number, toInches: number): string {
		const neg = value < 0 ? "-" : "";
		// Work in 0.01 inch units to retain 2 decimal places without float drift
		const total = Math.round(Math.abs(value) * toInches * 100);

		const mi = Math.floor(total / 6_336_000); // 1 mile = 63360 inches = 6,336,000 units
		const ft = Math.floor((total % 6_336_000) / 1_200); // 1 foot = 12 inches = 1,200 units
		const inch = (total % 1_200) / 100;

		const parts: string[] = [];
		if (mi > 0) parts.push(`${mi}mi`);
		if (ft > 0) parts.push(`${ft}′`);
		if (inch > 0) parts.push(`${inch}″`);

		return neg + (parts.length > 0 ? parts.join(" ") : "0");
	}

	// Converts value to meters via toMeters factor, then cascades km → m → cm → mm.
	// Preserves up to 2 decimal places in the smallest non-zero unit shown.
	#formatMetric(value: number, toMeters: number): string {
		const neg = value < 0 ? "-" : "";
		// Work in 0.01 mm units (10^-5 m) to retain 2 decimal places in mm without float drift
		const total = Math.round(Math.abs(value) * toMeters * 100_000);

		const km = Math.floor(total / 100_000_000);
		const m = Math.floor((total % 100_000_000) / 100_000);
		const cm = Math.floor((total % 100_000) / 1_000);
		const mm = (total % 1_000) / 100;

		const parts: string[] = [];
		if (km > 0) parts.push(`${km}km`);
		if (m > 0) parts.push(`${m}m`);
		if (cm > 0) parts.push(`${cm}cm`);
		if (mm > 0) parts.push(`${mm}mm`);

		return neg + (parts.length > 0 ? parts.join(" ") : "0");
	}

	// #endregion Private Methods (2)
}
