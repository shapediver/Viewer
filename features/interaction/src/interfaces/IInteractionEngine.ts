import { IDomEventListener } from "@shapediver/viewer.shared.services";
import { IInteractionManager } from "./IInteractionManager";

export enum INTERACTION_STATE {
    DOWN = 'down',
    MOVE = 'move',
    END = 'end'
}

export interface IInteractionEngine extends IDomEventListener {
    // #region Public Methods (2)

    addInteractionManager(manager: IInteractionManager): string;
    removeInteractionManager(token: string): boolean;

    // #endregion Public Methods (2)
}