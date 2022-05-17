import { IIntersection, IIntersectionFilter, IRay } from "@shapediver/viewer.rendering-engine.intersection-engine";
import { IViewportApi } from "@shapediver/viewer";
import { INTERACTION_STATE } from "./IInteractionEngine";

export type IInteractionFilterOptions = {
    (interactionState: INTERACTION_STATE): IIntersectionFilter;
}

export interface IInteractionManager {
    // #region Properties (2)

    /**
     * A filter that is applied during the intersection process.
     * While intersecting, only nodes where this filter applies will be evaluated.
     * The filters can be set per {@link INTERACTION_STATE}.
     */
    filter: IInteractionFilterOptions;
    /**
     * The reference to the viewer.
     */
    viewport: IViewportApi;

    // #endregion Properties (2)

    // #region Public Methods (3)

    /**
     * For onDown events (mouseDown and touchstart) this method is called.
     * The mouse event is already translated into a ray, therefore it can be used independently of mouse or touch events.
     * An array of intersections is provided that is the result of an intersection with the ray and the scene with the applied filters.
     * (Note that filters of other InteractionManagers may also apply, therefore you need to sanitize the intersections in that case)
     * 
     * @param ray 
     * @param intersection 
     */
    onDown(ray: IRay, intersection: IIntersection[]): void;
    /**
     * For onEnd events (mouseUp, mouseOut and touchend) this method is called.
     * The mouse event is already translated into a ray, therefore it can be used independently of mouse or touch events.
     * An array of intersections is provided that is the result of an intersection with the ray and the scene with the applied filters.
     * (Note that filters of other InteractionManagers may also apply, therefore you need to sanitize the intersections in that case)
     * 
     * @param ray 
     * @param intersection 
     */
    onEnd(ray: IRay, intersection: IIntersection[], endState: INTERACTION_STATE): void;
    /**
     * For onMove events (mouseMove and touchmove) this method is called.
     * The mouse event is already translated into a ray, therefore it can be used independently of mouse or touch events.
     * An array of intersections is provided that is the result of an intersection with the ray and the scene with the applied filters.
     * (Note that filters of other InteractionManagers may also apply, therefore you need to sanitize the intersections in that case)
     * 
     * @param ray 
     * @param intersection 
     * @param endState 
     */
    onMove(ray: IRay, intersection: IIntersection[]): void;

    // #endregion Public Methods (3)
}