import { addListener, EVENTTYPE_DRAWING_TOOLS, IEvent } from '@shapediver/viewer';
import { DrawingToolsEventResponseMapping } from '../../interfaces/events/EventResponseMapping';
import { DrawingToolsManager, PointsData } from '../DrawingToolsManager';
import { IManager } from '../../interfaces/IManager';

// #region Type aliases (1)

export type HistoryState = {
    points: PointsData;
};

// #endregion Type aliases (1)

// #region Classes (1)

export class HistoryManager implements IManager {
    // #region Properties (3)

    #currentStateIndex: number = -1;
    #drawingToolsManager: DrawingToolsManager;
    #history: HistoryState[] = [];

    // #endregion Properties (3)

    // #region Constructors (1)

    constructor(drawingToolsManager: DrawingToolsManager) {
        this.#drawingToolsManager = drawingToolsManager;

        addListener(EVENTTYPE_DRAWING_TOOLS.GEOMETRY_CHANGED, (e: IEvent) => {
            const event = e as DrawingToolsEventResponseMapping[EVENTTYPE_DRAWING_TOOLS.GEOMETRY_CHANGED];
            if (event.temporary === false && event.points !== undefined && event.fromHistory !== true) {
                this.recordState({
                    points: event.points
                });
            }
        });
    }

    // #endregion Constructors (1)

    // #region Public Methods (8)

    public applyState(state: HistoryState): void {
        this.#drawingToolsManager.geometryState.updateDataFromHistory(state.points);
    }

    public canRedo(): boolean {
        return this.#currentStateIndex < this.#history.length - 1;
    }

    public canUndo(): boolean {
        return this.#currentStateIndex > 0;
    }

    public close(): void {
        this.#currentStateIndex = -1;
        this.#history = [];
    }

    public getState(): HistoryState {
        return this.#history[this.#currentStateIndex];
    }

    public recordState(state: HistoryState): void {
        this.#history = this.#history.slice(0, this.#currentStateIndex + 1);
        this.#history.push(state);
        this.#currentStateIndex = this.#history.length - 1;
    }

    public redo(): void {
        if(!this.canRedo()) return;

        if (this.#currentStateIndex < this.#history.length - 1)
            this.#currentStateIndex++;

        this.applyState(this.#history[this.#currentStateIndex]);
    }

    public undo(): void {
        if(!this.canUndo()) return;

        if (this.#currentStateIndex > 0)
            this.#currentStateIndex--;

        this.applyState(this.#history[this.#currentStateIndex]);
    }

    // #endregion Public Methods (8)
}

// #endregion Classes (1)
