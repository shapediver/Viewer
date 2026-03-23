import * as THREE from "three";

import {
	addListener,
	ITreeNode,
	IViewportApi,
	TreeNode,
} from "@shapediver/viewer";
import {IRay} from "@shapediver/viewer.features.interaction";
import {GeometryMathManager} from "@shapediver/viewer.rendering-engine.intersection-restriction-engine";
import {MultiPointsMaterial} from "@shapediver/viewer.rendering-engine.rendering-engine-threejs";
import {
	EventEngine,
	EVENTTYPE_DRAWING_TOOLS,
	IEvent,
} from "@shapediver/viewer.shared.services";
import {
	AttributeData,
	GeometryData,
	IGeometryData,
	IMapData,
	MapData,
	MaterialMultiPointData,
	MATERIAL_ALPHA,
	PrimitiveData,
	PRIMITIVE_MODE,
} from "@shapediver/viewer.shared.types";

import {vec3} from "gl-matrix";

import {IControl} from "../../../interfaces/controls/IControl";
import {IEdgeControl} from "../../../interfaces/controls/IEdgeControl";
import {DrawingToolsEventResponseMapping} from "../../../interfaces/events/EventResponseMapping";
import {IDrawingToolsEvent} from "../../../interfaces/events/IDrawingToolsEvent";
import {
	DefaultTextures,
	MATERIAL_INDEX,
	Settings,
} from "../../../interfaces/IDrawingToolsManager";
import {DrawingToolsManager} from "../../DrawingToolsManager";
import {EdgeControl} from "./EdgeControl";

export class ControlsManager {
	readonly #controls: IControl[] = [];
	readonly #defaultTextures: DefaultTextures;
	readonly #drawingToolsId: string;
	readonly #drawingToolsManager: DrawingToolsManager;
	readonly #eventEngine = EventEngine.instance;
	readonly #geometryMathManager: GeometryMathManager;
	readonly #geometryNodeId: string;
	readonly #parentNode: ITreeNode;
	readonly #settings: Settings;
	readonly #viewport: IViewportApi;

	#draggedControlIndex?: number;
	#geometryData?: IGeometryData;

	// Hover state
	#hoveredControlIndex?: number;

	// Drag state
	#isDraggingControl: boolean = false;
	#materialIndexArray: number[] = new Array(1024).fill(0);
	#positionArray!: Float32Array;
	#positionIndexArray!: Float32Array;

	constructor(drawingToolsManager: DrawingToolsManager) {
		this.#drawingToolsManager = drawingToolsManager;
		this.#drawingToolsId = drawingToolsManager.uuid;
		this.#geometryNodeId =
			drawingToolsManager.geometryManager.parentNode.id;
		this.#geometryMathManager = drawingToolsManager.geometryMathManager;
		this.#viewport = drawingToolsManager.viewport;
		this.#settings = drawingToolsManager.settings;
		this.#defaultTextures = drawingToolsManager.defaultTextures;

		const parentNode = new TreeNode("DrawingToolsControls");
		parentNode.intersectionTest = false;
		drawingToolsManager.geometryManager.parentNode.addChild(parentNode);
		this.#parentNode = parentNode;

		this.buildControls();
		this.initGeometry();
		this.setupEventListeners();
	}

	public get controlCount(): number {
		return this.#controls.length;
	}

	public get hoveredControlIndex(): number | undefined {
		return this.#hoveredControlIndex;
	}

	public get isDraggingControl(): boolean {
		return this.#isDraggingControl;
	}

	/**
	 * Checks which control (if any) is closest to the given ray.
	 * Updates hover visual state and returns true if a control is hovered.
	 */
	public checkHover(ray: IRay): boolean {
		if (this.#controls.length === 0) return false;

		const distances = this.#geometryMathManager.checkPointDistances(
			ray,
			this.#positionArray,
		);

		if (distances) {
			const index = distances[0].index;
			if (this.#hoveredControlIndex !== index) {
				if (this.#hoveredControlIndex !== undefined) {
					this.updateMaterialIndex(
						this.#hoveredControlIndex,
						MATERIAL_INDEX.DEFAULT,
					);
				}
				this.#hoveredControlIndex = index;
				this.updateMaterialIndex(index, MATERIAL_INDEX.HOVERED);
			}
			return true;
		}

		this.clearHover();
		return false;
	}

	public clearHover(): void {
		if (this.#hoveredControlIndex !== undefined) {
			this.updateMaterialIndex(
				this.#hoveredControlIndex,
				MATERIAL_INDEX.DEFAULT,
			);
			this.#hoveredControlIndex = undefined;
		}
	}

	public close(): void {
		const parent = this.#drawingToolsManager.geometryManager.parentNode;
		parent.removeChild(this.#parentNode);
		parent.updateVersion();
	}

	/**
	 * Commits the drag.
	 *
	 * Emits `DRAG_END` first — this allows external commit handlers
	 * (e.g. `RectangleTransform.handleRectDrag`) to permanently flush DT
	 * point positions before the `GEOMETRY_CHANGED` record is written.
	 * Then emits `GEOMETRY_CHANGED` so the HistoryManager captures the
	 * final state.  Also delegates end-of-drag state refresh to the control.
	 */
	public endDragging(): void {
		if (!this.#isDraggingControl || this.#draggedControlIndex === undefined)
			return;

		const control = this.#controls[this.#draggedControlIndex];
		const geometryState = this.#drawingToolsManager.geometryState;

		// Emit DRAG_END so that commit-phase handlers fire synchronously
		// (e.g. flushRectPoints with temporary=false) before GEOMETRY_CHANGED.
		this.#eventEngine.emitEvent(EVENTTYPE_DRAWING_TOOLS.DRAG_END, {
			viewportId: this.#viewport.id,
			drawingToolsId: this.#drawingToolsId,
			controlIndex: this.#draggedControlIndex,
			points: geometryState.getPointsData(),
			metaData: geometryState.metadataArray,
		} as IDrawingToolsEvent);

		// positionArray now reflects the committed positions (updated by the
		// DRAG_END handler's non-temporary flushRectPoints, or by in-place
		// mutation from temporary moves if no handler is present).
		this.#eventEngine.emitEvent(EVENTTYPE_DRAWING_TOOLS.GEOMETRY_CHANGED, {
			viewportId: this.#viewport.id,
			drawingToolsId: this.#drawingToolsId,
			points: geometryState.getPointsData(),
			metaData: geometryState.metadataArray,
			temporary: false,
			fromHistory: false,
		} as IDrawingToolsEvent);

		// Refresh the control's derived state now that geometry is committed.
		control.end((idx) => geometryState.getPosition(idx));

		this.updateMaterialIndex(
			this.#draggedControlIndex,
			MATERIAL_INDEX.HOVERED,
		);

		this.#isDraggingControl = false;
		this.#draggedControlIndex = undefined;
	}

	/**
	 * Delegates the drag-move to the control, then updates the visual position
	 * and emits `DRAG_MOVE` so that external listeners (e.g. RectangleTransform)
	 * can react on every frame.
	 */
	public moveDraggedControl(ray: IRay): void {
		if (!this.#isDraggingControl || this.#draggedControlIndex === undefined)
			return;

		const control = this.#controls[this.#draggedControlIndex];
		const geometryState = this.#drawingToolsManager.geometryState;

		// Track which points were moved and their new temporary positions so
		// sibling controls that share those points can be refreshed below.
		const movedPoints = new Map<number, vec3>();

		const newPos = control.move(ray, (idx, pos) => {
			movedPoints.set(idx, vec3.clone(pos));
			this.#drawingToolsManager.movePointTemporary(idx, pos, undefined);
		});
		if (newPos === undefined) return;

		this.setControlPosition(this.#draggedControlIndex, newPos);

		// Refresh every other control whose point1 or point2 was just moved.
		// Temporary moves bypass geometryState.#positionArray, so we supply a
		// custom getPosition that prefers the freshly moved positions.
		if (movedPoints.size > 0) {
			const getPosition = (idx: number): vec3 =>
				movedPoints.get(idx) ?? geometryState.getPosition(idx);

			const refreshed = new Set<number>();
			for (const movedIdx of movedPoints.keys()) {
				for (let i = 0; i < this.#controls.length; i++) {
					if (i === this.#draggedControlIndex) continue;
					if (refreshed.has(i)) continue;
					if (
						this.#controls[i].refreshForMovedPoint(
							movedIdx,
							getPosition,
						)
					) {
						this.setControlPosition(i, this.#controls[i].position);
						refreshed.add(i);
					}
				}
			}
		}

		// Notify listeners (e.g. RectangleTransform) on every drag frame.
		this.#eventEngine.emitEvent(EVENTTYPE_DRAWING_TOOLS.DRAG_MOVE, {
			viewportId: this.#viewport.id,
			drawingToolsId: this.#drawingToolsId,
			controlIndex: this.#draggedControlIndex,
			points: geometryState.getPointsData(),
			metaData: geometryState.metadataArray,
		} as IDrawingToolsEvent);
	}

	/**
	 * Resets hover and drag state to pre-interaction values, delegating point
	 * restoration to the control itself.
	 */
	public onOut(): void {
		if (
			this.#isDraggingControl &&
			this.#draggedControlIndex !== undefined
		) {
			const control = this.#controls[this.#draggedControlIndex];
			control.cancel((idx, pos) =>
				this.#drawingToolsManager.movePointTemporary(
					idx,
					pos,
					undefined,
				),
			);
			this.setControlPosition(
				this.#draggedControlIndex,
				control.position,
			);
			this.updateMaterialIndex(
				this.#draggedControlIndex,
				MATERIAL_INDEX.DEFAULT,
			);
		}

		this.clearHover();
		this.#isDraggingControl = false;
		this.#draggedControlIndex = undefined;
	}

	/**
	 * Begins dragging the currently hovered control.
	 * Delegates start-of-drag snapshotting to the control itself.
	 * Returns true if dragging started.
	 */
	public startDragging(): boolean {
		if (this.#hoveredControlIndex === undefined) return false;

		const control = this.#controls[this.#hoveredControlIndex];
		const geometryState = this.#drawingToolsManager.geometryState;

		if (!control.start((idx) => geometryState.getPosition(idx)))
			return false;

		this.#draggedControlIndex = this.#hoveredControlIndex;
		this.#isDraggingControl = true;

		this.updateMaterialIndex(
			this.#hoveredControlIndex,
			MATERIAL_INDEX.SELECTED_HOVERED,
		);
		return true;
	}

	private buildControls(): void {
		const controls = this.#settings.controls;
		if (!controls || controls.length === 0) return;

		const geometryState = this.#drawingToolsManager.geometryState;
		for (const cfg of controls) {
			if (cfg.type === "edge") {
				const edgeCfg = cfg as IEdgeControl;
				const p1 = geometryState.getPosition(edgeCfg.point1);
				const p2 = geometryState.getPosition(edgeCfg.point2);
				this.#controls.push(new EdgeControl(edgeCfg, p1, p2));
			}
		}
	}

	private initGeometry(): void {
		const count = this.#controls.length;
		if (count === 0) return;

		// Build flat position buffer from initial midpoints.
		this.#positionArray = new Float32Array(count * 3);
		for (let i = 0; i < count; i++) {
			this.#positionArray.set(this.#controls[i].position, i * 3);
		}

		// position-index attribute: point i uses materialIndexArray[i].
		this.#positionIndexArray = new Float32Array(count);
		for (let i = 0; i < count; i++) this.#positionIndexArray[i] = i;

		this.#geometryData = new GeometryData(
			new PrimitiveData({
				POSITION: new AttributeData(
					this.#positionArray,
					3,
					12,
					0,
					4,
					false,
					this.#positionArray.length,
				),
			}),
			PRIMITIVE_MODE.POINTS,
		);
		this.#geometryData.primitive.attributes["POSITION_INDEX"] =
			new AttributeData(
				this.#positionIndexArray,
				1,
				1,
				0,
				1,
				true,
				this.#positionIndexArray.length,
				[0],
				[this.#positionIndexArray.length],
			);
		this.#geometryData.renderOrder = 1001; // above regular points (1000)

		this.#geometryData.material = new MaterialMultiPointData(
			Object.assign(
				{
					materialIndexDataMap: new MapData(new Image(), {
						asData: true,
						data: this.#materialIndexArray,
					}),
					materialIndexDataMapSize: 1024,
					alphaMode: MATERIAL_ALPHA.BLEND,
					depthTest: false,
					depthWrite: false,
					transparent: true,
				},
				this.#settings.visualization.points,
			),
		);

		const applyTexture = (variations: string[], map: IMapData): void => {
			for (const v of variations) {
				(
					this.#geometryData!.material as unknown as {
						[key: string]: unknown;
					}
				)[v] = map;
			}
			(
				this.#geometryData!.material as MaterialMultiPointData
			).updateVersion();
			this.#geometryData!.updateVersion();
		};

		const variation_0 = [
			"map_0",
			"map_1",
			"map_2",
			"map_3",
			"map_4",
			"map_5",
			"map_6",
			"map_7",
		];

		if (this.#defaultTextures.variation_0 instanceof MapData) {
			applyTexture(variation_0, this.#defaultTextures.variation_0);
		} else {
			(this.#defaultTextures.variation_0 as Promise<IMapData>).then(
				(map) => applyTexture(variation_0, map),
			);
		}

		this.#parentNode.addData(this.#geometryData);
	}

	private setControlPosition(controlIndex: number, pos: vec3): void {
		const threeJsGeometry = this.#geometryData?.convertedObject?.[
			this.#viewport.id
		] as THREE.Points | undefined;
		if (threeJsGeometry) {
			threeJsGeometry.geometry.attributes["position"].setXYZ(
				controlIndex,
				pos[0],
				pos[1],
				pos[2],
			);
			threeJsGeometry.geometry.attributes["position"].needsUpdate = true;
		} else {
			// Not yet rendered: update the underlying array directly.
			this.#positionArray.set(pos, controlIndex * 3);
		}
	}

	private setupEventListeners(): void {
		// When a real point is moved (temporary or permanent), refresh any
		// controls that reference it as point1 or point2.
		addListener(EVENTTYPE_DRAWING_TOOLS.MOVED, (e: IEvent) => {
			const event =
				e as DrawingToolsEventResponseMapping[EVENTTYPE_DRAWING_TOOLS.MOVED];
			if (event.drawingToolsId !== this.#geometryNodeId) return;
			if (this.#isDraggingControl) return;
			if (event.index !== undefined) {
				this.updateControlsForPoint(event.index);
			}
		});

		// Full refresh on any permanent geometry change (e.g. undo/redo).
		addListener(EVENTTYPE_DRAWING_TOOLS.GEOMETRY_CHANGED, (e: IEvent) => {
			const event =
				e as DrawingToolsEventResponseMapping[EVENTTYPE_DRAWING_TOOLS.GEOMETRY_CHANGED];
			if (event.drawingToolsId !== this.#drawingToolsId) return;
			if (event.temporary) return;
			if (this.#isDraggingControl) return;
			this.updateAllControls();
		});
	}

	private updateAllControls(): void {
		const getPosition = (idx: number) =>
			this.#drawingToolsManager.geometryState.getPosition(idx);
		for (let i = 0; i < this.#controls.length; i++) {
			this.#controls[i].refreshAll(getPosition);
			this.setControlPosition(i, this.#controls[i].position);
		}
	}

	private updateControlsForPoint(movedIndex: number): void {
		const getPosition = (idx: number) =>
			this.#drawingToolsManager.geometryState.getPosition(idx);
		for (let i = 0; i < this.#controls.length; i++) {
			if (
				this.#controls[i].refreshForMovedPoint(movedIndex, getPosition)
			) {
				this.setControlPosition(i, this.#controls[i].position);
			}
		}
	}

	private updateMaterialIndex(
		controlIndex: number,
		materialIndex: MATERIAL_INDEX,
	): void {
		if (!this.#geometryData) return;
		this.#materialIndexArray[controlIndex] = materialIndex;

		const threeJsGeometry = this.#geometryData.convertedObject?.[
			this.#viewport.id
		] as THREE.Points | undefined;

		if (threeJsGeometry) {
			const mat = threeJsGeometry.material as MultiPointsMaterial;
			mat.materialIndexDataTexture!.image.data[controlIndex] =
				materialIndex;
			mat.materialIndexDataTexture!.needsUpdate = true;
			mat.needsUpdate = true;
		}

		(
			this.#geometryData.material as MaterialMultiPointData
		).materialIndexDataMap = new MapData(new Image(), {
			asData: true,
			data: this.#materialIndexArray,
		});
		this.#geometryData.material!.updateVersion();
	}
}
