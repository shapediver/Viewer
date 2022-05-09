import { IDomEventListener } from "@shapediver/viewer.shared.services";
import { IInteractionManager } from "./IInteractionManager";

export enum INTERACTION_STATE {
    DOWN = 'down',
    MOVE = 'move',
    END = 'end',
    OUT = 'out',
    UP = 'up'
}

export interface IInteractionEngine extends IDomEventListener {
    // #region Public Methods (2)

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

    // #endregion Public Methods (2)
}