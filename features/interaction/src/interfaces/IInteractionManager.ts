import { IIntersection, IIntersectionFilter, IRay } from "@shapediver/viewer.rendering-engine.intersection-engine";
import { INTERACTION_STATE } from "./IInteractionEngine";

export type IInteractionFilterOptions = {
    (interactionState: INTERACTION_STATE): IIntersectionFilter;
}

export interface IInteractionManager {
    filter: IInteractionFilterOptions;
    onDown(ray: IRay, intersection: IIntersection[]): void;
    onMove(ray: IRay, intersection: IIntersection[]): void;
    onEnd(ray: IRay, intersection: IIntersection[]): void;
}