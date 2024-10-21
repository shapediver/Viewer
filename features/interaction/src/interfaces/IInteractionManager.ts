import { IInteractionEffectUtils } from './utils/IInteractionEffectUtils';
import { IIntersection, IIntersectionFilter, IRay } from '@shapediver/viewer.rendering-engine.intersection-engine';
import { IMaterialAbstractData, IViewportApi } from '@shapediver/viewer';
import { INTERACTION_STATE } from './IInteractionEngine';

// #region Type aliases (1)

export type IInteractionFilterOptions = {
    (interactionState: INTERACTION_STATE): IIntersectionFilter;
}

// #endregion Type aliases (1)

// #region Interfaces (1)

export interface IInteractionManager {
    // #region Properties (5)

    /**
     * The material that is applied to the node once the effect (selection, hovering or dragging) is active.
     * If no effect material is applied, the material will not be changed.
     */
    effectMaterial?: IMaterialAbstractData;
    /**
     * A filter that is applied during the intersection process.
     * While intersecting, only nodes where this filter applies will be evaluated.
     * The filters can be set per {@link INTERACTION_STATE}.
     */
    filter: IInteractionFilterOptions;
    /**
     * The unique id of the interaction manager.
     */
    id: string;
    /**
     * Effect utils that are automatically assigned by the {@link AbstractInteractionManager}.
     */
    interactionEffectUtils: IInteractionEffectUtils;
    /**
     * The reference to the viewer.
     */
    viewport?: IViewportApi;

    // #endregion Properties (5)

    // #region Public Methods (5)

    /**
     * Called internally when adding the interaction manager to an interaction engine. Here the viewport is set.
     * 
     * @param viewport 
     */
    add(viewport: IViewportApi): void;
    /**
     * For onDown events (pointerdown) this method is called.
     * The pointer event is already translated into a ray.
     * An array of intersections is provided that is the result of an intersection with the ray and the scene with the applied filters.
     * (Note that filters of other InteractionManagers may also apply, therefore you need to sanitize the intersections in that case)
     * 
     * @param event
     * @param ray 
     * @param intersection 
     */
    onDown(event: PointerEvent, ray: IRay, intersection: IIntersection[]): void;
    /**
     * For onEnd events (pointerup, pointerout) this method is called.
     * The pointer event is already translated into a ray.
     * An array of intersections is provided that is the result of an intersection with the ray and the scene with the applied filters.
     * (Note that filters of other InteractionManagers may also apply, therefore you need to sanitize the intersections in that case)
     * 
     * @param event
     * @param ray 
     * @param intersection 
     * @param endState 
     */
    onEnd(event: PointerEvent, ray: IRay, intersection: IIntersection[], endState: INTERACTION_STATE): void;
    /**
     * For onMove events (pointermove) this method is called.
     * The pointer event is already translated into a ray.
     * An array of intersections is provided that is the result of an intersection with the ray and the scene with the applied filters.
     * (Note that filters of other InteractionManagers may also apply, therefore you need to sanitize the intersections in that case)
     * 
     * @param event
     * @param ray 
     * @param intersection 
     */
    onMove(event: PointerEvent, ray: IRay, intersection: IIntersection[]): void;
    /**
     * Called internally to remove the viewport from the manager and to clean up.
     */
    remove(): void;

    // #endregion Public Methods (5)
}

// #endregion Interfaces (1)
