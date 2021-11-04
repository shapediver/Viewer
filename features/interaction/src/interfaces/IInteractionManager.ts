import { IIntersection, IIntersectionFilter, IRay } from "@shapediver/viewer.rendering-engine.intersection-engine";
import { IViewer } from "@shapediver/viewer";
import { INTERACTION_STATE } from "./IInteractionEngine";

export type IInteractionFilterOptions = {
    (interactionState: INTERACTION_STATE): IIntersectionFilter;
}

export interface IInteractionManager {
    // #region Properties (2)

    filter: IInteractionFilterOptions;
    viewer: IViewer;

    // #endregion Properties (2)

    // #region Public Methods (3)

    onDown(ray: IRay, intersection: IIntersection[]): void;
    onEnd(ray: IRay, intersection: IIntersection[]): void;
    onMove(ray: IRay, intersection: IIntersection[]): void;

    // #endregion Public Methods (3)
}