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
import {vec3} from "gl-matrix";
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
	// #region Properties (17)

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
	readonly #settings: Settings;
	readonly #textVisualizationManager: TextVisualizationManager;
	readonly #uuidGenerator: UuidGenerator = UuidGenerator.instance;
	readonly #viewport: IViewportApi;

	#closed: boolean = false;
	#continuousRenderingFlag?: string;
	#uuid = this.#uuidGenerator.create();

	// #endregion Properties (17)

	// #region Constructors (1)

	constructor(
		viewport: IViewportApi,
		callbacks: Callbacks,
		settings: SettingsOptional,
		defaultTextures?: DefaultTextures,
	) {
		this.#viewport = viewport;
		this.#callbacks = callbacks;
		this.#settings = this.cleanSettings(settings);
		this.#defaultTextures = defaultTextures!;

		this.#parentNode = new TreeNode(`DrawingToolsManager_${this.#uuid}`);
		this.#parentNode.intersectionTest = false;
		sceneTree.root.addChild(this.#parentNode);
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

		sceneTree.root.removeChild(this.#parentNode);
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
	): void {
		this.#geometryManager.movePoint(index, position, metaData, temporary);
	}

	public movePointTemporary(
		index: number,
		position: vec3,
		metaData: RayTraceResult | undefined,
	): void {
		this.movePoint(index, position, metaData, true);
	}

	public onDown(event: PointerEvent, ray: IRay): void {
		if (this.closed) return;
		this.#interactionManager.onDown(event, ray);
	}

	public onKeyDown(event: KeyboardEvent): void {
		if (this.closed) return;

		this.#keysPressed[event.key] = true;
		const undoKeyPressed = this.keyPressed(this.#settings.controls.undo);
		const redoKeyPressed = this.keyPressed(this.#settings.controls.redo);

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

	public onKeyUp(event: KeyboardEvent): void {
		if (this.closed) return;
		this.#keysPressed[event.key] = false;
	}

	public onMove(event: PointerEvent, ray: IRay): void {
		if (this.closed) return;
		if (!this.#continuousRenderingFlag)
			this.#continuousRenderingFlag = this.#viewport.addFlag(
				FLAG_TYPE.CONTINUOUS_RENDERING,
			);
		this.#interactionManager.onMove(event, ray);
	}

	public onOut(): void {
		if (this.closed) return;
		this.#interactionManager.onOut();
		if (
			this.#continuousRenderingFlag &&
			SystemInfo.instance.isMobile === false
		) {
			this.#viewport.removeFlag(this.#continuousRenderingFlag);
			this.#continuousRenderingFlag = undefined;
		}
	}

	public onUp(): void {
		if (this.closed) return;
		this.#interactionManager.onUp();
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
			restrictions: {},
			visualization: {
				distanceMultiplicationFactor: 2,
				pointLabels: false,
				distanceLabels: true,
				points: {
					size_0: 15,
					size_1: 20,
					size_2: 15,
					size_3: 20,
					size_4: 15,
					size_5: 20,
					color_0: "#0d44f0",
					color_1: "#197aeb",
					color_2: "#9e27d8",
					color_3: "#bc47fd",
					color_4: "#00ff78",
					color_5: "#00ff78",
				},
				lines: {
					color: "#0d44f0",
				},
			},
			controls: {
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
			};
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
							color_0: "#0d44f0",
							color_1: "#197aeb",
							color_2: "#9e27d8",
							color_3: "#bc47fd",
							color_4: "#00ff78",
							color_5: "#00ff78",
						}
					: settingsOptional.visualization.points,
				lines: isUndefinedOrNull(settingsOptional.visualization.lines)
					? {
							color: "#0d44f0",
						}
					: settingsOptional.visualization.lines,
			};
		}

		if (!isUndefinedOrNull(settingsOptional.controls)) {
			settings.controls = {
				insert: isUndefinedOrNull(settingsOptional.controls.insert)
					? ["Insert", "+"]
					: settingsOptional.controls.insert,
				delete: isUndefinedOrNull(settingsOptional.controls.delete)
					? ["Delete", "-"]
					: settingsOptional.controls.delete,
				confirm: isUndefinedOrNull(settingsOptional.controls.confirm)
					? "Enter"
					: settingsOptional.controls.confirm,
				cancel: isUndefinedOrNull(settingsOptional.controls.cancel)
					? "Escape"
					: settingsOptional.controls.cancel,
				undo: isUndefinedOrNull(settingsOptional.controls.undo)
					? "Control+z"
					: settingsOptional.controls.undo,
				redo: isUndefinedOrNull(settingsOptional.controls.redo)
					? "Control+y"
					: settingsOptional.controls.redo,
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

	// #endregion Private Methods (2)
}
