import { IDomEventListener } from "@shapediver/viewer.shared.services";
import { IInteractionManager } from "./IInteractionManager";

export enum INTERACTION_STATE {
    /** The event enum for mousedown and touchstart. */
    DOWN = 'down',
    /** The event enum for mousemove and touchmove. */
    MOVE = 'move',
    /** The event enum for mouseup, mouseout, touchcancel and touchup. */
    END = 'end',
    /** The event enum for mouseout and touchcancel. */
    OUT = 'out',
    /** The event enum for mouseup and touchup. */
    UP = 'up'
}

export interface IInteractionEngine extends IDomEventListener {
    // #region Public Methods (2)

    /**
     * All currently registered interaction managers with their token as a key.
     */
    readonly managers: { [key: string]: IInteractionManager };

    /**
     * The opacity threshold that used to for intersection. (Default: 0)
     * If the object is equal or below the threshold, it is not intersected anymore.
     * 
     * Example: If the value is set to 0.25, all objects that have an opacity of 0.25 or lower and not intersectable.
     */
    intersectionOpacity: number;

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

    // #endregion Public Methods (2)
}