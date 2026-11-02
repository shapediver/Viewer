import {type IDomEventListener} from "@shapediver/viewer.shared.services";
import {type IInteractionManager} from "./IInteractionManager";

export enum INTERACTION_STATE {
	/** The event enum for mousedown and touchstart. */
	DOWN = "down",
	/** The event enum for mousemove and touchmove. */
	MOVE = "move",
	/** The event enum for mouseup, mouseout, touchcancel and touchup. */
	END = "end",
	/** The event enum for mouseout and touchcancel. */
	OUT = "out",
	/** The event enum for mouseup and touchup. */
	UP = "up",
}

export interface IInteractionEngine extends IDomEventListener {
	// #region Public Methods (2)

	/**
	 * All currently registered interaction managers with their token as a key.
	 */
	readonly managers: {[key: string]: IInteractionManager};

	/**
	 * The current state of the interaction engine.
	 */
	closed: boolean;

	/**
	 * Opacity at or below which scene geometry does not occlude interactions
	 * when occludeBySceneGeometry is enabled. (Default: 0.01)
	 */
	intersectionOpacity: number;

	/**
	 * Whether the interactions are paused: by {@link pause}, or while the
	 * viewport is busy if {@link pauseWhileBusy} is set.
	 */
	readonly paused: boolean;

	/**
	 * Pause the interactions while the viewport is busy (busy mode, e.g. a
	 * session computes), like {@link pause}; they continue when the busy mode
	 * ends (unless paused by {@link pause}). (Default: false)
	 */
	pauseWhileBusy: boolean;

	/**
	 * Add a new interaction manager to the selection of interaction managers.
	 * This manager will be fed with all onDown, onMove and onEnd events by the InteractionEngine.
	 * The token that is return can be used to remove this interaction manager.
	 *
	 * @param manager
	 * @returns
	 */
	addInteractionManager(manager: IInteractionManager): string;
	/**
	 * Remove an interaction manager with the token returned when adding it.
	 *
	 * @param token
	 * @returns
	 */
	removeInteractionManager(token: string): boolean;

	/**
	 * Closes the interaction engine and removes all managers that where registered.
	 */
	close(): void;

	/**
	 * Pause all interactions of the registered managers (selection, hovering,
	 * dragging), e.g. while a computation runs: pointer events are ignored
	 * until {@link continue} is called. An interaction in progress is
	 * cancelled (see `IInteractionManager.cancelInteraction`: a drag returns
	 * its nodes to their placement before the drag, hovered nodes are
	 * unhovered, a box selection ends without selecting). The selection is
	 * kept. The camera is not affected. See also {@link pauseWhileBusy}.
	 */
	pause(): void;

	/**
	 * Resume the interactions after {@link pause} (they stay paused while the
	 * viewport is busy if {@link pauseWhileBusy} is set).
	 */
	continue(): void;

	// #endregion Public Methods (4)
}
