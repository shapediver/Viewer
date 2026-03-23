import {IRay} from "@shapediver/viewer.shared.types";
import {vec3} from "gl-matrix";

export type GetPositionFn = (index: number) => vec3;
export type MoveTemporaryFn = (index: number, pos: vec3) => void;

export interface IControl {
	type: string;
	position: vec3;

	/**
	 * Begin a drag interaction. Snapshots any required initial state.
	 * Returns false if the control cannot be dragged at this time.
	 */
	start(getPosition: GetPositionFn): boolean;

	/**
	 * Move the control during drag. Returns the updated visual position of the
	 * control, or undefined if no movement was possible (e.g. degenerate geometry).
	 */
	move(ray: IRay, moveTemporary: MoveTemporaryFn): vec3 | undefined;

	/**
	 * Commit the drag and refresh any derived state from the committed geometry.
	 */
	end(getPosition: GetPositionFn): void;

	/**
	 * Cancel the drag, restoring all affected geometry points to their
	 * pre-drag positions.
	 */
	cancel(moveTemporary: MoveTemporaryFn): void;

	/**
	 * Called when a single point in the geometry has moved (not during a drag).
	 * Returns true if this control was affected and its visual position changed.
	 */
	refreshForMovedPoint(
		movedIndex: number,
		getPosition: GetPositionFn,
	): boolean;

	/**
	 * Refreshes all derived state from the current geometry (e.g. after undo/redo).
	 */
	refreshAll(getPosition: GetPositionFn): void;
}
