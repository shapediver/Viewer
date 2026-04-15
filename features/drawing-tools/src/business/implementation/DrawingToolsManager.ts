import {
	FLAG_TYPE,
	ITreeNode,
	IViewportApi,
	sceneTree,
	TreeNode,
} from "@shapediver/viewer";
import {IRay} from "@shapediver/viewer.features.interaction";
import {
	EventManager,
	GeometryMathManager,
	IRestriction,
	IRestrictionManager,
	RayTraceResult,
	RestrictionProperties,
	RESTRICTION_TYPE,
} from "@shapediver/viewer.rendering-engine.intersection-restriction-engine";
import {
	EventEngine,
	EVENTTYPE_DRAWING_TOOLS,
	IEvent,
	ShapeDiverViewerDrawingToolsError,
	SystemInfo,
	UuidGenerator,
} from "@shapediver/viewer.shared.services";
import {mat4, vec3} from "gl-matrix";
import {IEdgeControl} from "../interfaces/controls/IEdgeControl";
import {DrawingToolsEventResponseMapping} from "../interfaces/events/EventResponseMapping";
import {
	Callbacks,
	DefaultTextures,
	IDrawingToolsManager,
	MATERIAL_INDEX,
	PointsData,
	Settings,
	SettingsOptional,
} from "../interfaces/IDrawingToolsManager";
import {GeometryManager} from "./managers/geometry/GeometryManager";
import {GeometryState} from "./managers/geometry/GeometryState";
import {HistoryManager} from "./managers/HistoryManager";
import {InteractionManager} from "./managers/interaction/InteractionManager";
import {TextVisualizationManager} from "./managers/TextVisualizationManager";

export class DrawingToolsManager implements IDrawingToolsManager {
	// #region Properties (18)

	readonly #callbacks: Callbacks;
	readonly #defaultTextures: DefaultTextures;
	readonly #eventEngine = EventEngine.instance;
	readonly #eventManager: EventManager;
	readonly #geometryManager: GeometryManager;
	readonly #geometryMathManager: GeometryMathManager;
	readonly #historyManager: HistoryManager;
	readonly #interactionManager: InteractionManager;
	readonly #keysPressed: {[key: string]: boolean} = {};
	readonly #parentNode: ITreeNode;
	readonly #sceneParent: ITreeNode;
	readonly #settings: Settings;
	readonly #textVisualizationManager: TextVisualizationManager;
	readonly #uuidGenerator: UuidGenerator = UuidGenerator.instance;
	readonly #viewport: IViewportApi;

	#closed: boolean = false;
	#paused: boolean = false;
	#continuousRenderingFlag?: string;
	#uuid = this.#uuidGenerator.create();

	// #endregion Properties (17)

	// #region Constructors (1)

	constructor(
		viewport: IViewportApi,
		callbacks: Callbacks,
		settings: SettingsOptional,
		defaultTextures?: DefaultTextures,
		parentNode?: ITreeNode,
	) {
		this.#viewport = viewport;
		this.#callbacks = callbacks;
		this.#settings = this.cleanSettings(settings);
		this.#defaultTextures = defaultTextures!;
		this.#sceneParent = parentNode ?? sceneTree.root;

		this.#parentNode = new TreeNode(`DrawingToolsManager_${this.#uuid}`);
		this.#parentNode.intersectionTest = false;
		this.#sceneParent.addChild(this.#parentNode);
		sceneTree.root.updateVersion(false, false);

		this.#geometryMathManager = new GeometryMathManager(
			this.#viewport,
			this.#settings.visualization,
		);
		this.#geometryManager = new GeometryManager(this);
		this.#interactionManager = new InteractionManager(this);
		this.#textVisualizationManager = new TextVisualizationManager(this);
		this.#historyManager = new HistoryManager(this);

		this.#eventManager = new EventManager(this.#viewport, {
			onDown: this.onDown.bind(this),
			onUp: this.onUp.bind(this),
			onOut: this.onOut.bind(this),
			onMove: this.onMove.bind(this),
			onKeyDown: this.onKeyDown.bind(this),
			onKeyUp: this.onKeyUp.bind(this),
		});

		this.#continuousRenderingFlag = this.#viewport.addFlag(
			FLAG_TYPE.CONTINUOUS_RENDERING,
		);

		// special case, the scene is still empty, so we create a grid by default and show the scene
		if (sceneTree.root.boundingBox.isEmpty()) this.#viewport.show = true;

		// add listener for geometry changes, if autoUpdate is enabled the drawing tool will update automatically
		this.#eventEngine.addListener(
			EVENTTYPE_DRAWING_TOOLS.GEOMETRY_CHANGED,
			(e: IEvent) => {
				const event =
					e as DrawingToolsEventResponseMapping[EVENTTYPE_DRAWING_TOOLS.GEOMETRY_CHANGED];
				if (event.drawingToolsId !== this.#uuid) return;
				if (
					event.temporary === false &&
					event.points !== undefined &&
					event.metaData !== undefined &&
					event.recordHistory !== false
				) {
					if (
						this.#settings.general.autoUpdate &&
						(this.#interactionManager.insertionInteractionHandler
							.insertionActive === false ||
							SystemInfo.instance.isMobile === true) &&
						(this.#settings.geometry.autoClose ||
							this.#settings.geometry.close ===
								this.#geometryManager.geometryState.closeLoop)
					) {
						this.update();
					}
				}
			},
		);
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (22)

	public get callbacks(): Callbacks {
		return this.#callbacks;
	}

	public get closed(): boolean {
		return this.#closed;
	}

	public get paused(): boolean {
		return this.#paused;
	}

	public get defaultTextures(): DefaultTextures {
		return this.#defaultTextures;
	}

	public get geometryManager(): GeometryManager {
		return this.#geometryManager;
	}

	public get geometryMathManager(): GeometryMathManager {
		return this.#geometryMathManager;
	}

	public get geometryState(): GeometryState {
		return this.#geometryManager.geometryState;
	}

	public get historyManager(): HistoryManager {
		return this.#historyManager;
	}

	public get indicesArrayLines(): Uint8Array | null | undefined {
		return this.#geometryManager.geometryState.indicesArrayLines;
	}

	public get insertionActive(): boolean {
		return this.#interactionManager.insertionInteractionHandler
			.insertionActive;
	}

	public get interactionManager(): InteractionManager {
		return this.#interactionManager;
	}

	public get parentNode(): ITreeNode {
		return this.#parentNode;
	}

	public get positionArray(): Float32Array {
		return this.#geometryManager.geometryState.positionArray;
	}

	public get restrictionManager(): IRestrictionManager {
		return this.#interactionManager.restrictionManager;
	}

	public get restrictions(): {[key: string]: IRestriction} {
		return this.restrictionManager.restrictions;
	}

	public get settings(): Settings {
		return this.#settings;
	}

	public get showDistanceLabels(): boolean {
		return this.#textVisualizationManager.showDistanceLabels;
	}

	public set showDistanceLabels(value: boolean) {
		this.#textVisualizationManager.showDistanceLabels = value;
	}

	public get showPointLabels(): boolean {
		return this.#textVisualizationManager.showPointLabels;
	}

	public set showPointLabels(value: boolean) {
		this.#textVisualizationManager.showPointLabels = value;
	}

	public get showPointerPosition(): boolean {
		return this.#textVisualizationManager.showPointerPosition;
	}

	public set showPointerPosition(value: boolean) {
		this.#textVisualizationManager.showPointerPosition = value;
	}

	public get textVisualizationManager(): TextVisualizationManager {
		return this.#textVisualizationManager;
	}

	public get uuid(): string {
		return this.#uuid;
	}

	public get viewport(): IViewportApi {
		return this.#viewport;
	}

	// #endregion Public Getters And Setters (22)

	// #region Public Methods (28)

	/**
	 * Apply position and size constraints to a proposed point position.
	 * Position constraints clamp each axis independently.
	 * Size constraints clamp the moved point so the geometry extent stays within [min, max].
	 *
	 * @param proposedPosition  The unconstrained candidate position.
	 * @param pointIndex        The index of the point being moved/added. Pass the
	 *                          current point count (or any value >= count) when adding
	 *                          a new point so that all current points are treated as
	 *                          "other" points.
	 * @param overrides         Optional map of pointIndex→position for points that
	 *                          are being moved in the same frame (e.g. other selected
	 *                          points or already-computed adjacency targets). These
	 *                          positions are used instead of the stored positions when
	 *                          computing the geometry extent.
	 */
	public applyConstraints(
		proposedPosition: vec3,
		pointIndex: number,
		overrides?: Map<number, vec3>,
		originalPositionOverride?: vec3,
	): vec3 {
		const constraints = this.#settings.geometry.constraints;
		if (!constraints) return proposedPosition;

		const result = vec3.clone(proposedPosition);
		// #geometryManager may not be assigned yet during GeometryState.init();
		// safe fallback: derive pointCount from overrides when unavailable.
		const geometryState = this.#geometryManager?.geometryState;
		const pointCount =
			geometryState?.getPointCount() ??
			(overrides ? overrides.size + 1 : 0);

		// Position constraints: clamp each axis to [min, max].
		if (constraints.position) {
			const posAxes = ["x", "y", "z"] as const;
			for (let i = 0; i < 3; i++) {
				const c = constraints.position[posAxes[i]];
				if (c) result[i] = Math.max(c[0], Math.min(c[1], result[i]));
			}
		}

		// Size constraints: keep geometry extent within [minSize, maxSize].
		if (constraints.size && pointCount > 0) {
			// traverse all points and get the min and max on each axis
			const min = vec3.fromValues(
				Number.POSITIVE_INFINITY,
				Number.POSITIVE_INFINITY,
				Number.POSITIVE_INFINITY,
			);
			const max = vec3.fromValues(
				Number.NEGATIVE_INFINITY,
				Number.NEGATIVE_INFINITY,
				Number.NEGATIVE_INFINITY,
			);
			for (let i = 0; i < pointCount; i++) {
				if (i === pointIndex) continue;
				const pos = overrides?.get(i) ?? geometryState?.getPosition(i);
				if (!pos) continue;
				for (let j = 0; j < 3; j++) {
					min[j] = Math.min(min[j], pos[j]);
					max[j] = Math.max(max[j], pos[j]);
				}
			}

			// now we check if our new point position would violate the size constraints and if yes, we clamp it to the valid range
			const sizeAxes = ["x", "y", "z"] as const;
			// The committed (pre-drag) position of the moving point, used to detect
			// when an edge control has crossed to the other side of the opposite edge.
			// When an originalPositionOverride is provided (e.g. from EdgeControl with
			// the drag-start position), use it so that the crossing detection always
			// refers to the true pre-drag side, even when movePointTemporary has
			// updated positionArray mid-drag.
			const originalPosition =
				originalPositionOverride ??
				geometryState?.getPosition(pointIndex);
			for (let i = 0; i < 3; i++) {
				const c = constraints.size[sizeAxes[i]];
				if (!c) continue;

				const [minSize, maxSize] = c;
				const newExtent =
					Math.max(max[i], result[i]) - Math.min(min[i], result[i]);

				// check if there is a maxSize constraint and if it is violated, if yes clamp to the valid range
				if (
					maxSize !== undefined &&
					isFinite(maxSize) &&
					newExtent > maxSize
				) {
					if (result[i] <= min[i]) result[i] = max[i] - maxSize;
					else result[i] = min[i] + maxSize;
				}

				// check if there is a minSize constraint and if it is violated, if yes clamp to the valid range
				if (
					minSize !== undefined &&
					isFinite(minSize) &&
					newExtent < minSize
				) {
					if (result[i] >= max[i]) {
						if (
							originalPosition !== undefined &&
							originalPosition[i] <= min[i]
						) {
							// Crossing case (low→high): the point originated on the low
							// side but has now moved past the opposite edge. The sibling
							// override contaminates max[i], so use min[i] as the stable
							// reference instead.
							result[i] = min[i] - minSize;
						} else {
							// Standard high-side case: push it up from the low reference.
							result[i] = min[i] + minSize;
						}
					} else if (
						originalPosition !== undefined &&
						originalPosition[i] >= max[i]
					) {
						// Crossing case (high→low): the point originated on the high side
						// but has now moved past the opposite edge. The sibling override
						// contaminates min[i], so use max[i] as the stable reference.
						result[i] = max[i] + minSize;
					} else {
						// Standard low-side case: point is legitimately on the low side.
						result[i] = max[i] - minSize;
					}
				}
			}
		}

		return result;
	}

	/**
	 * Add a point to the drawing tool.
	 *
	 * @param index
	 * @param position
	 * @returns
	 */
	public addPoint(
		index: number,
		position?: vec3 | undefined,
		metaData?: RayTraceResult,
		temporary = false,
	): boolean {
		if (this.#closed) return false;
		if (!this.#geometryManager.canAddPoint()) {
			this.#eventEngine.emitEvent(
				EVENTTYPE_DRAWING_TOOLS.MAXIMUM_POINTS,
				{
					viewportId: this.viewport.id,
					drawingToolsId: this.#uuid,
					message: `The maximum amount of points (${this.#settings.geometry.maxPoints}) has been exceeded.`,
				},
			);
			throw new ShapeDiverViewerDrawingToolsError(
				`The maximum amount of points (${this.#settings.geometry.maxPoints}) has been exceeded.`,
			);
		}
		return this.#geometryManager.addPoint(
			index,
			position,
			metaData,
			temporary,
		);
	}

	public addPointTemporary(
		index: number,
		position?: vec3 | undefined,
		metaData?: RayTraceResult,
	): boolean {
		return this.addPoint(index, position, metaData, true);
	}

	/**
	 * Add a ray tracing intersection restriction to the drawing tool.
	 *
	 * @param planeProperties
	 * @returns
	 */
	public addRestriction(
		properties: RestrictionProperties,
		token?: string,
	): string | undefined {
		if (!properties.id)
			properties.id = token || this.#uuidGenerator.create();
		return this.#interactionManager.restrictionManager.addRestriction(
			properties,
		);
	}

	public canRedo(): boolean {
		return this.#historyManager.canRedo();
	}

	public canUndo(): boolean {
		return this.#historyManager.canUndo();
	}

	public pause(): void {
		if (this.#closed || this.#paused) return;
		this.#interactionManager.onOut();
		this.#paused = true;
	}

	public continue(): void {
		if (this.#closed) return;
		this.#paused = false;
	}

	public cancel(): void {
		if (this.#closed) return;
		try {
			this.#callbacks.onCancel();
		} catch (e) {
			throw new ShapeDiverViewerDrawingToolsError(
				"An error occurred while cancelling the drawing tool.",
			);
		}
		this.#eventEngine.emitEvent(EVENTTYPE_DRAWING_TOOLS.CANCEL, {
			viewportId: this.viewport.id,
			drawingToolsId: this.#uuid,
		});
		this.close();
	}

	public close(): void {
		if (this.#closed) return;
		if (this.#continuousRenderingFlag)
			this.#viewport.removeFlag(this.#continuousRenderingFlag);
		this.#eventManager.close();
		this.#geometryMathManager.close();
		this.#geometryManager.close();
		this.#interactionManager.close();
		this.#textVisualizationManager.close();

		this.#sceneParent.removeChild(this.#parentNode);
		sceneTree.root.updateVersion(false, false);
		this.#closed = true;
	}

	public getPointsData(): PointsData {
		return this.geometryState.getPointsData();
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

	public movePoint(
		index: number,
		position: vec3,
		metaData: RayTraceResult | undefined,
		temporary = false,
		skipConstraints?: boolean,
	): void {
		this.#geometryManager.movePoint(
			index,
			position,
			metaData,
			temporary,
			skipConstraints,
		);
	}

	public movePointTemporary(
		index: number,
		position: vec3,
		metaData: RayTraceResult | undefined,
	): void {
		this.movePoint(index, position, metaData, true);
	}

	public onDown(event: PointerEvent, ray: IRay): void {
		if (this.closed || this.#paused) return;
		this.#geometryMathManager.localToWorldMatrix =
			this.#sceneParent.worldMatrix;
		this.#interactionManager.onDown(
			event,
			this.transformRayToLocalSpace(ray),
		);
	}

	public onKeyDown(event: KeyboardEvent, pointerInCanvas: boolean): void {
		if (this.closed || this.#paused) return;
		if (!pointerInCanvas) return;

		this.#keysPressed[event.key] = true;
		const undoKeyPressed = this.keyPressed(this.#settings.keyBindings.undo);
		const redoKeyPressed = this.keyPressed(this.#settings.keyBindings.redo);

		/**
		 * IF UNDO KEY IS PRESSED
		 * - UNDO
		 */
		if (undoKeyPressed) {
			this.#historyManager.undo();
		}

		/**
		 * IF REDO KEY IS PRESSED
		 * - REDO
		 */
		if (redoKeyPressed) {
			this.#historyManager.redo();
		}

		this.#interactionManager.onKeyDown();
	}

	public onKeyUp(event: KeyboardEvent, pointerInCanvas: boolean): void {
		if (this.closed || this.#paused) return;
		this.#keysPressed[event.key] = false;
	}

	public onMove(event: PointerEvent, ray: IRay): void {
		if (this.closed || this.#paused) return;
		if (!this.#continuousRenderingFlag)
			this.#continuousRenderingFlag = this.#viewport.addFlag(
				FLAG_TYPE.CONTINUOUS_RENDERING,
			);
		this.#geometryMathManager.localToWorldMatrix =
			this.#sceneParent.worldMatrix;
		this.#interactionManager.onMove(
			event,
			this.transformRayToLocalSpace(ray),
		);
	}

	public onOut(): void {
		if (this.closed || this.#paused) return;
		this.#interactionManager.onOut();
		if (
			this.#continuousRenderingFlag &&
			SystemInfo.instance.isMobile === false
		) {
			this.#viewport.removeFlag(this.#continuousRenderingFlag);
			this.#continuousRenderingFlag = undefined;
		}
	}

	public onUp(event: PointerEvent): void {
		if (this.closed || this.#paused) return;
		this.#interactionManager.onUp(event);
	}

	/**
	 * Cancel any in-progress hover or drag interaction without closing the drawing tool.
	 */
	public cancelDrag(): void {
		if (this.closed || this.#paused) return;
		this.#interactionManager.onOut();
	}

	/**
	 * Returns true if a point or control is currently hovered or being dragged.
	 */
	public isInteractionActive(): boolean {
		const helper = this.#interactionManager.interactionManagerHelper;
		const controls = this.#interactionManager.controlsManager;
		return (
			helper.hoveredPoint !== undefined ||
			helper.dragging ||
			controls?.hoveredControlIndex !== undefined ||
			(controls?.isDraggingControl ?? false)
		);
	}

	public redo(): void {
		this.#historyManager.redo();
	}

	/**
	 * Remove a point from the drawing tool.
	 *
	 * @param index
	 * @returns
	 */
	public removePoint(index: number, temporary = false): boolean {
		if (this.#closed) return false;
		if (!this.geometryState.canRemovePoint()) {
			this.#eventEngine.emitEvent(
				EVENTTYPE_DRAWING_TOOLS.MINIMUM_POINTS,
				{
					viewportId: this.viewport.id,
					drawingToolsId: this.#uuid,
					message: `The minimum amount of points (${this.#settings.geometry.minPoints}) has not been met.`,
				},
			);
			throw new ShapeDiverViewerDrawingToolsError(
				`The minimum amount of points (${this.#settings.geometry.minPoints}) has not been met.`,
			);
		}

		return this.#geometryManager.removePoint(index, temporary);
	}

	public removePointTemporary(index: number): boolean {
		return this.removePoint(index, true);
	}

	public removePoints(indices: number[]): void {
		if (this.#closed) return;

		if (!this.geometryState.canRemovePoint(indices.length)) {
			this.#eventEngine.emitEvent(
				EVENTTYPE_DRAWING_TOOLS.MINIMUM_POINTS,
				{
					viewportId: this.viewport.id,
					drawingToolsId: this.#uuid,
					message: `The minimum amount of points (${this.#settings.geometry.minPoints}) has not been met.`,
				},
			);
			throw new ShapeDiverViewerDrawingToolsError(
				`The minimum amount of points (${this.#settings.geometry.minPoints}) has not been met.`,
			);
		}

		this.#geometryManager.removePoints(indices);
	}

	/**
	 * Remove a restriction from the drawing tool.
	 *
	 * @param token
	 */
	public removeRestriction(token: string): void {
		this.#interactionManager.restrictionManager.removeRestriction(token);
	}

	public resetMaterialIndices(): void {
		this.#geometryManager.resetMaterialIndices();
		const disabledPoints = this.#settings.geometry.disabledPoints;
		if (disabledPoints) {
			for (const idx of disabledPoints) {
				this.updateMaterialIndex(idx, MATERIAL_INDEX.DISABLED);
			}
		}
	}

	public undo(): void {
		this.#historyManager.undo();
	}

	public update(): {
		pointsData: PointsData;
		metaData: (RayTraceResult | undefined)[];
	} | void {
		if (this.#closed) return;

		const pointsCount = this.geometryState.getPointCount();
		if (
			this.#settings.geometry.minPoints !== undefined &&
			pointsCount < this.#settings.geometry.minPoints
		) {
			this.#eventEngine.emitEvent(
				EVENTTYPE_DRAWING_TOOLS.MINIMUM_POINTS,
				{
					viewportId: this.viewport.id,
					drawingToolsId: this.#uuid,
					message: `The minimum amount of points (${this.#settings.geometry.minPoints}) has not been met. Current number of points: ${pointsCount}.`,
				},
			);
			throw new ShapeDiverViewerDrawingToolsError(
				`The minimum amount of points (${this.#settings.geometry.minPoints}) has not been met. Current number of points: ${pointsCount}.`,
			);
		} else if (
			this.#settings.geometry.maxPoints !== undefined &&
			pointsCount > this.#settings.geometry.maxPoints
		) {
			this.#eventEngine.emitEvent(
				EVENTTYPE_DRAWING_TOOLS.MAXIMUM_POINTS,
				{
					viewportId: this.viewport.id,
					drawingToolsId: this.#uuid,
					message: `The maximum amount of points (${this.#settings.geometry.maxPoints}) has been exceeded. Current number of points: ${pointsCount}.`,
				},
			);
			throw new ShapeDiverViewerDrawingToolsError(
				`The maximum amount of points (${this.#settings.geometry.maxPoints}) has been exceeded. Current number of points: ${pointsCount}.`,
			);
		} else if (
			this.#settings.geometry.mode === "lines" &&
			!(
				this.#settings.geometry.autoClose ||
				this.#settings.geometry.close ===
					this.#geometryManager.geometryState.closeLoop
			) &&
			pointsCount > 2
		) {
			this.#eventEngine.emitEvent(EVENTTYPE_DRAWING_TOOLS.UNCLOSED_LOOP, {
				viewportId: this.viewport.id,
				drawingToolsId: this.#uuid,
				message:
					"The geometry is not closed, but is required to be closed.",
			});
			throw new ShapeDiverViewerDrawingToolsError(
				"The geometry is not closed, but is required to be closed.",
			);
		} else {
			const pointsData = this.geometryState.getPointsData();
			try {
				this.#callbacks.onUpdate(
					pointsData,
					this.geometryState.metadataArray,
				);
				this.#eventEngine.emitEvent(EVENTTYPE_DRAWING_TOOLS.UPDATE, {
					viewportId: this.viewport.id,
					drawingToolsId: this.#uuid,
				});
			} catch (e) {
				throw new ShapeDiverViewerDrawingToolsError(
					"An error occurred while updating the drawing tool.",
				);
			}
			if (this.#settings.general.closeOnUpdate) this.close();
			return {
				pointsData,
				metaData: this.geometryState.metadataArray,
			};
		}
	}

	public updateMaterialIndex(
		index: number,
		materialIndex: MATERIAL_INDEX,
	): void {
		this.#geometryManager.updateMaterialIndex(index, materialIndex);
	}

	public updateTextVisualization(): void {
		this.#textVisualizationManager.createPointLabels();
		this.#textVisualizationManager.createDistanceLabels();
	}

	// #endregion Public Methods (28)

	// #region Private Methods (2)

	private cleanSettings(settingsOptional: SettingsOptional): Settings {
		if (typeof settingsOptional === "string")
			settingsOptional = JSON.parse(settingsOptional);

		const settings: Settings = {
			geometry: {
				points: [],
				mode: "lines",
				close: true,
				autoClose: false,
			},
			controls: [],
			restrictions: {},
			visualization: {
				distanceMultiplicationFactor: 2,
				pointLabels: false,
				pointerPosition: true,
				distanceLabels: true,
				points: {
					size_0: 15,
					size_1: 20,
					size_2: 15,
					size_3: 20,
					size_4: 15,
					size_5: 20,
					size_6: 10,
					color_0: "#0d44f0",
					color_1: "#197aeb",
					color_2: "#9e27d8",
					color_3: "#bc47fd",
					color_4: "#00ff78",
					color_5: "#00ff78",
					color_6: "#888888",
				},
				lines: {
					color: "#0d44f0",
				},
			},
			keyBindings: {
				insert: ["Insert", "+"],
				delete: ["Delete", "-"],
				confirm: "Enter",
				cancel: "Escape",
				undo: "Control+z",
				redo: "Control+y",
			},
			general: {
				autoStart: true,
				autoUpdate: false,
				closeOnUpdate: false,
				displayUnit: "",
				enableTranslation: true,
				enableInsertion: true,
				enableDeletion: true,
				enableSelection: true,
			},
		};

		const isUndefinedOrNull = (value: unknown): value is undefined | null =>
			value === undefined || value === null;

		if (!isUndefinedOrNull(settingsOptional.geometry)) {
			settings.geometry = {
				points: isUndefinedOrNull(settingsOptional.geometry.points)
					? []
					: settingsOptional.geometry.points,
				mode:
					settingsOptional.geometry.mode === "points"
						? "points"
						: "lines",
				minPoints: settingsOptional.geometry.minPoints,
				maxPoints: settingsOptional.geometry.maxPoints,
				strictMinMaxPoints: isUndefinedOrNull(
					settingsOptional.geometry.strictMinMaxPoints,
				)
					? true
					: settingsOptional.geometry.strictMinMaxPoints,
				close: isUndefinedOrNull(settingsOptional.geometry.close)
					? true
					: settingsOptional.geometry.close,
				autoClose: isUndefinedOrNull(
					settingsOptional.geometry.autoClose,
				)
					? true
					: settingsOptional.geometry.autoClose,
				weightedAdjacency: settingsOptional.geometry.weightedAdjacency,
				disabledPoints: settingsOptional.geometry.disabledPoints,
				constraints: settingsOptional.geometry.constraints,
			};
		}

		if (!isUndefinedOrNull(settingsOptional.controls)) {
			settings.controls = [];
			for (const control of settingsOptional.controls) {
				if (!control) continue;
				if (control.type === "edge") {
					const edgeControl = control as IEdgeControl;
					if (
						edgeControl.direction === undefined ||
						edgeControl.point1 === undefined ||
						edgeControl.point2 === undefined
					) {
						continue;
					}
					edgeControl.direction = vec3.normalize(
						vec3.create(),
						edgeControl.direction,
					);
					settings.controls.push(edgeControl);
				}
			}
		}

		if (!isUndefinedOrNull(settingsOptional.visualization)) {
			settings.visualization = {
				distanceMultiplicationFactor: isUndefinedOrNull(
					settingsOptional.visualization.distanceMultiplicationFactor,
				)
					? 2
					: settingsOptional.visualization
							.distanceMultiplicationFactor,
				pointLabels: isUndefinedOrNull(
					settingsOptional.visualization.pointLabels,
				)
					? false
					: settingsOptional.visualization.pointLabels,
				pointerPosition: isUndefinedOrNull(
					settingsOptional.visualization.pointerPosition,
				)
					? true
					: settingsOptional.visualization.pointerPosition,
				distanceLabels: isUndefinedOrNull(
					settingsOptional.visualization.distanceLabels,
				)
					? true
					: settingsOptional.visualization.distanceLabels,
				points: isUndefinedOrNull(settingsOptional.visualization.points)
					? {
							size_0: 15,
							size_1: 20,
							size_2: 15,
							size_3: 20,
							size_4: 15,
							size_5: 20,
							size_6: 10,
							color_0: "#0d44f0",
							color_1: "#197aeb",
							color_2: "#9e27d8",
							color_3: "#bc47fd",
							color_4: "#00ff78",
							color_5: "#00ff78",
							color_6: "#888888",
						}
					: settingsOptional.visualization.points,
				lines: isUndefinedOrNull(settingsOptional.visualization.lines)
					? {
							color: "#0d44f0",
						}
					: settingsOptional.visualization.lines,
				wireframe: isUndefinedOrNull(
					settingsOptional.visualization.wireframe,
				)
					? undefined
					: settingsOptional.visualization.wireframe,
				wireframeColor: isUndefinedOrNull(
					settingsOptional.visualization.wireframeColor,
				)
					? undefined
					: settingsOptional.visualization.wireframeColor,
				edgeControlVisualization: isUndefinedOrNull(
					settingsOptional.visualization.edgeControlVisualization,
				)
					? undefined
					: settingsOptional.visualization.edgeControlVisualization,
			};
		}

		if (!isUndefinedOrNull(settingsOptional.keyBindings)) {
			settings.keyBindings = {
				insert: isUndefinedOrNull(settingsOptional.keyBindings.insert)
					? ["Insert", "+"]
					: settingsOptional.keyBindings.insert,
				delete: isUndefinedOrNull(settingsOptional.keyBindings.delete)
					? ["Delete", "-"]
					: settingsOptional.keyBindings.delete,
				confirm: isUndefinedOrNull(settingsOptional.keyBindings.confirm)
					? "Enter"
					: settingsOptional.keyBindings.confirm,
				cancel: isUndefinedOrNull(settingsOptional.keyBindings.cancel)
					? "Escape"
					: settingsOptional.keyBindings.cancel,
				undo: isUndefinedOrNull(settingsOptional.keyBindings.undo)
					? "Control+z"
					: settingsOptional.keyBindings.undo,
				redo: isUndefinedOrNull(settingsOptional.keyBindings.redo)
					? "Control+y"
					: settingsOptional.keyBindings.redo,
			};
		}

		if (!isUndefinedOrNull(settingsOptional.general)) {
			settings.general = {
				autoStart: isUndefinedOrNull(settingsOptional.general.autoStart)
					? true
					: settingsOptional.general.autoStart,
				autoUpdate: isUndefinedOrNull(
					settingsOptional.general.autoUpdate,
				)
					? false
					: settingsOptional.general.autoUpdate,
				closeOnUpdate: isUndefinedOrNull(
					settingsOptional.general.closeOnUpdate,
				)
					? false
					: settingsOptional.general.closeOnUpdate,
				displayUnit: isUndefinedOrNull(
					settingsOptional.general.displayUnit,
				)
					? ""
					: settingsOptional.general.displayUnit,
				enableTranslation: isUndefinedOrNull(
					settingsOptional.general.enableTranslation,
				)
					? true
					: settingsOptional.general.enableTranslation,
				enableInsertion: isUndefinedOrNull(
					settingsOptional.general.enableInsertion,
				)
					? true
					: settingsOptional.general.enableInsertion,
				enableDeletion: isUndefinedOrNull(
					settingsOptional.general.enableDeletion,
				)
					? true
					: settingsOptional.general.enableDeletion,
				enableSelection: isUndefinedOrNull(
					settingsOptional.general.enableSelection,
				)
					? true
					: settingsOptional.general.enableSelection,
			};
		}

		const min = vec3.fromValues(Infinity, Infinity, Infinity);
		const max = vec3.fromValues(-Infinity, -Infinity, -Infinity);
		for (let i = 0; i < settings.geometry.points.length; i++) {
			const point = settings.geometry.points[i];

			min[0] = Math.min(min[0], point[0]);
			min[1] = Math.min(min[1], point[1]);
			min[2] = Math.min(min[2], point[2]);

			max[0] = Math.max(max[0], point[0]);
			max[1] = Math.max(max[1], point[1]);
			max[2] = Math.max(max[2], point[2]);
		}

		if (
			isUndefinedOrNull(settingsOptional.restrictions) ||
			Object.keys(settingsOptional.restrictions).length === 0
		) {
			settings.restrictions["plane"] = {type: RESTRICTION_TYPE.PLANE};
		} else {
			settings.restrictions = settingsOptional.restrictions as {
				[key: string]: RestrictionProperties;
			};
		}

		return settings;
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

	/**
	 * Transform a point from the parent node's local space back to world space.
	 * Used to convert local-space positions (stored in positionArray) to world
	 * space when they need to be passed to world-space APIs (e.g. restriction
	 * startPoint metadata that expects world-space coordinates).
	 * When no custom parent is set (sceneTree.root), returns the point unchanged.
	 */
	public localToWorldPoint(p: vec3): vec3 {
		if (this.#sceneParent === sceneTree.root) return p;
		return vec3.transformMat4(
			vec3.create(),
			p,
			this.#sceneParent.worldMatrix,
		);
	}

	/**
	 * If the DT is attached to a parent node with a non-identity world matrix,
	 * transform the incoming world-space ray into the parent's local space so
	 * that restrictions, drag deltas, and weightedAdjacency all operate in the
	 * same coordinate frame as the stored point positions.
	 * When no custom parent is set (sceneTree.root), worldMatrix is identity and
	 * the ray is returned unchanged.
	 */
	private transformRayToLocalSpace(ray: IRay): IRay {
		if (this.#sceneParent === sceneTree.root) return ray;
		const invMatrix = mat4.invert(
			mat4.create(),
			this.#sceneParent.worldMatrix,
		);
		if (!invMatrix) return ray;
		const localOrigin = vec3.transformMat4(
			vec3.create(),
			ray.origin,
			invMatrix,
		);
		// Direction is a free vector — apply only the rotation/scale part (w=0).
		const m = invMatrix;
		const d = ray.direction;
		const localDirection = vec3.normalize(
			vec3.create(),
			vec3.fromValues(
				m[0] * d[0] + m[4] * d[1] + m[8] * d[2],
				m[1] * d[0] + m[5] * d[1] + m[9] * d[2],
				m[2] * d[0] + m[6] * d[1] + m[10] * d[2],
			),
		);
		return {origin: localOrigin, direction: localDirection};
	}

	// #endregion Private Methods (2)
}
