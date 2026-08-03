import {
	addListener,
	EVENTTYPE_DRAWING_TOOLS,
	removeListener,
	type IEvent,
} from "@shapediver/viewer";
import {type RayTraceResult} from "@shapediver/viewer.rendering-engine.intersection-restriction-engine";
import {type DrawingToolsEventResponseMapping} from "../../interfaces/events/EventResponseMapping";
import {type PointsData} from "../../interfaces/IDrawingToolsManager";
import {DrawingToolsManager} from "../DrawingToolsManager";

// #region Type aliases (1)

export type HistoryState = {
	points: PointsData;
	metaData: RayTraceResult[];
};

// #endregion Type aliases (1)

// #region Classes (1)

export class HistoryManager {
	// #region Constants (1)

	static readonly MAX_HISTORY = 256;

	// #endregion Constants (1)

	// #region Properties (3)

	#currentStateIndex: number = -1;
	#drawingToolsManager: DrawingToolsManager;
	#eventListenerToken: string;
	#history: HistoryState[] = [];

	// #endregion Properties (3)

	// #region Constructors (1)

	constructor(drawingToolsManager: DrawingToolsManager) {
		this.#drawingToolsManager = drawingToolsManager;

		this.#eventListenerToken = addListener(
			EVENTTYPE_DRAWING_TOOLS.GEOMETRY_CHANGED,
			(e: IEvent) => {
				const event =
					e as DrawingToolsEventResponseMapping[EVENTTYPE_DRAWING_TOOLS.GEOMETRY_CHANGED];
				if (event.drawingToolsId !== this.#drawingToolsManager.uuid)
					return;
				if (
					event.temporary === false &&
					event.points !== undefined &&
					event.metaData !== undefined &&
					event.fromHistory !== true &&
					event.recordHistory !== false
				) {
					/**
					 * DO SOME CHECKS TO ENSURE THAT THE STATE IS CORRECT
					 */
					// 1. within number of points
					if (
						this.#drawingToolsManager.geometryState.checkNumberOfPoints(
							event.points.length,
						) === false
					)
						return;
					// 2. closed loop if it should be closed
					if (
						this.#drawingToolsManager.settings.geometry.close ===
							true &&
						this.#drawingToolsManager.geometryState.closeLoop ===
							false &&
						this.#drawingToolsManager.settings.geometry
							.autoClose === false
					)
						return;

					this.recordState({
						points: event.points,
						metaData: event.metaData,
					});
				}
			},
		);
	}

	// #endregion Constructors (1)

	// #region Public Methods (8)

	public applyState(state: HistoryState): void {
		this.#drawingToolsManager.geometryState.updateDataFromHistory(
			state.points,
			state.metaData,
		);
	}

	public canRedo(): boolean {
		return this.#currentStateIndex < this.#history.length - 1;
	}

	public canUndo(): boolean {
		return this.#currentStateIndex > 0;
	}

	public close(): void {
		removeListener(this.#eventListenerToken);
		this.#currentStateIndex = -1;
		this.#history = [];
	}

	public getState(): HistoryState {
		return this.#history[this.#currentStateIndex];
	}

	public recordState(state: HistoryState): void {
		this.#history = this.#history.slice(0, this.#currentStateIndex + 1);
		this.#history.push(state);
		// Cap history to prevent unbounded memory growth over long sessions
		if (this.#history.length > HistoryManager.MAX_HISTORY)
			this.#history.shift();
		this.#currentStateIndex = this.#history.length - 1;
	}

	public redo(): void {
		if (!this.canRedo()) return;

		if (this.#currentStateIndex < this.#history.length - 1)
			this.#currentStateIndex++;

		this.applyState(this.#history[this.#currentStateIndex]);
	}

	public undo(): void {
		if (!this.canUndo()) return;

		if (this.#currentStateIndex > 0) this.#currentStateIndex--;

		this.applyState(this.#history[this.#currentStateIndex]);
	}

	// #endregion Public Methods (8)
}

// #endregion Classes (1)
