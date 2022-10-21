import { IIntersection, IIntersectionFilter, IRay } from "@shapediver/viewer.rendering-engine.intersection-engine";
import { IMaterialAbstractData, IViewportApi } from "@shapediver/viewer";
import { INTERACTION_STATE } from "./IInteractionEngine";
import { IDragConstraintUtils } from "./utils/IDragConstraintUtils";
import { IInteractionEffectUtils } from "./utils/IInteractionEffectUtils";

export type IInteractionFilterOptions = {
    (interactionState: INTERACTION_STATE): IIntersectionFilter;
}

export interface IInteractionManager {
    // #region Properties (2)

    /**
     * The material that is applied to the node once the effect (selection, hovering or dragging) is active.
     * If no effect material is applied, the material will not be changed.
     */
    effectMaterial?: IMaterialAbstractData;

    /**
     * Drag constraint utils that are automatically assigned by the {@link AbstractInteractionManager}.
     */
    dragConstraintUtils: IDragConstraintUtils;

    /**
     * Effect utils that are automatically assigned by the {@link AbstractInteractionManager}.
     */
    interactionEffectUtils: IInteractionEffectUtils;

    /**
     * A filter that is applied during the intersection process.
     * While intersecting, only nodes where this filter applies will be evaluated.
     * The filters can be set per {@link INTERACTION_STATE}.
     */
    filter: IInteractionFilterOptions;

    /**
     * The reference to the viewer.
     */
    viewport?: IViewportApi;

    // #endregion Properties (2)

    // #region Public Methods (3)

    /**
     * For onDown events (mouseDown and touchstart) this method is called.
     * The mouse event is already translated into a ray, therefore it can be used independently of mouse or touch events.
     * An array of intersections is provided that is the result of an intersection with the ray and the scene with the applied filters.
     * (Note that filters of other InteractionManagers may also apply, therefore you need to sanitize the intersections in that case)
     * 
     * @param event
     * @param ray 
     * @param intersection 
     */
    onDown(event: MouseEvent | TouchEvent, ray: IRay, intersection: IIntersection[]): void;

    /**
     * For onEnd events (mouseUp, mouseOut and touchend) this method is called.
     * The mouse event is already translated into a ray, therefore it can be used independently of mouse or touch events.
     * An array of intersections is provided that is the result of an intersection with the ray and the scene with the applied filters.
     * (Note that filters of other InteractionManagers may also apply, therefore you need to sanitize the intersections in that case)
     * 
     * @param event
     * @param ray 
     * @param intersection 
     * @param endState 
     */
    onEnd(event: MouseEvent | TouchEvent, ray: IRay, intersection: IIntersection[], endState: INTERACTION_STATE): void;

    /**
     * For onMove events (mouseMove and touchmove) this method is called.
     * The mouse event is already translated into a ray, therefore it can be used independently of mouse or touch events.
     * An array of intersections is provided that is the result of an intersection with the ray and the scene with the applied filters.
     * (Note that filters of other InteractionManagers may also apply, therefore you need to sanitize the intersections in that case)
     * 
     * @param event
     * @param ray 
     * @param intersection 
     */
    onMove(event: MouseEvent | TouchEvent, ray: IRay, intersection: IIntersection[]): void;

    /**
     * Called internally when adding the interaction manager to an interaction engine. Here the viewport is set.
     * 
     * @param viewport 
     */
    add(viewport: IViewportApi): void;

    /**
     * Called internally to remove the viewport from the manager and to clean up.
     */
    remove(): void;

    // #endregion Public Methods (3)
}