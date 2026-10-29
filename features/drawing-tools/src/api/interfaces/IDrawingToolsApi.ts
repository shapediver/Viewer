import {
	type IRestrictionApi,
	type RayTraceResult,
	type RestrictionProperties} from "@shapediver/viewer.rendering-engine.intersection-restriction-engine";
import {vec3} from "gl-matrix";
import {type PointsData} from "../../business/interfaces/IDrawingToolsManager";

export interface IDrawingToolsApi {
	// #region Properties (5)

	/**
	 * Check if the drawing tool is closed.
	 */
	readonly closed: boolean;
	/**
	 * Check if the drawing tool is paused: by {@link pause}, or while the
	 * viewport is busy if {@link pauseWhileBusy} is set.
	 */
	readonly paused: boolean;
	/**
	 * Pause the drawing tool while the viewport is busy (busy mode, e.g. a
	 * session computes), like {@link pause}; it continues when the busy mode
	 * ends (unless paused by {@link pause}). (default: false)
	 */
	pauseWhileBusy: boolean;
	/**
	 * The points data of the drawing tool.
	 */
	readonly pointsData: PointsData;
	/**
	 * The restrictions of the drawing tool.
	 */
	readonly restrictions: {
		[key: string]: IRestrictionApi;
	};
	/**
	 * The unique identifier of the drawing tool instance.
	 */
	readonly uuid: string;

	/**
	 * Show the distance labels of the drawing tool.
	 */
	showDistanceLabels: boolean;
	/**
	 * Show the point labels of the drawing tool.
	 */
	showPointLabels: boolean;

	// #endregion Properties (5)

	// #region Public Methods (11)

	/**
	 * Add a point to the drawing tool.
	 *
	 * @param index The index of the point in the position array.
	 * @param position The position of the point.
	 */
	addPoint(index: number, position?: vec3 | undefined): void;
	/**
	 * Add a ray tracing intersection restriction to the drawing tool.
	 *
	 * @param properties The properties of the restriction.
	 * @returns The api of the restriction.
	 */
	addRestriction(
		properties: RestrictionProperties,
		token?: string,
	): IRestrictionApi | undefined;
	/**
	 * Check if the drawing tool can redo the last action.
	 */
	canRedo(): boolean;
	/**
	 * Check if the drawing tool can undo the last action.
	 */
	canUndo(): boolean;
	/**
	 * Pause the drawing tool, suspending all user interactions while keeping the
	 * current state (a point drag in progress is cancelled). Call
	 * {@link continue} to resume. See also {@link pauseWhileBusy}.
	 */
	pause(): void;
	/**
	 * Resume the drawing tool after it has been paused by {@link pause} (it
	 * stays paused while the viewport is busy if {@link pauseWhileBusy} is set).
	 */
	continue(): void;
	/**
	 * Cancel the drawing tool.
	 */
	cancel(): void;
	/**
	 * Cancel any in-progress hover or drag interaction without closing the drawing tool.
	 */
	cancelDrag(): void;
	/**
	 * Returns true if a point or control is currently hovered or being dragged.
	 */
	isInteractionActive(): boolean;
	/**
	 * Close the drawing tool.
	 */
	close(): void;
	/**
	 * Move a point of the drawing tool.
	 *
	 * @param index The index of the point in the position array.
	 * @param position The new position of the point.
	 * @param temporary If true, the move will not be applied immediately (default: false).
	 */
	movePoint(
		index: number,
		position: vec3,
		temporary?: boolean,
		skipConstraints?: boolean,
	): void;
	/**
	 * Redo the last action of the drawing tool.
	 */
	redo(): void;
	/**
	 * Remove a point from the drawing tool.
	 *
	 * @param index The index of the point in the position array.
	 */
	removePoint(index: number): void;
	/**
	 * Remove a restriction from the drawing tool.
	 *
	 * @param id
	 */
	removeRestriction(id: string): void;
	/**
	 * Undo the last action of the drawing tool.
	 */
	undo(): void;
	/**
	 * Receive an update of the drawing tool.
	 *
	 * @returns The points data of the drawing tool.
	 */
	update(): {
		pointsData: PointsData;
		metaData: (RayTraceResult | undefined)[];
	} | void;

	// #endregion Public Methods (11)
}
