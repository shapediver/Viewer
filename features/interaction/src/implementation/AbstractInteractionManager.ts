import { container } from "tsyringe";
import { IRay, IIntersection } from "@shapediver/viewer.rendering-engine.intersection-engine";
import { IInteractionFilterOptions, IInteractionManager } from "../interfaces/IInteractionManager";
import { IViewer } from "@shapediver/viewer";
import { DragConstraints } from "./DragConstraints";
import { InteractionEffects } from "./InteractionEffects";

export abstract class AbstractInteractionManager implements IInteractionManager {
    // #region Properties (4)

    protected readonly _dragConstraints: DragConstraints = <DragConstraints>container.resolve(DragConstraints);
    protected readonly _effects: InteractionEffects = <InteractionEffects>container.resolve(InteractionEffects);
    protected readonly _viewer: IViewer;

    abstract filter: IInteractionFilterOptions;

    // #endregion Properties (4)

    // #region Constructors (1)

    constructor(viewer: IViewer) {
        this._viewer = viewer;
    }

    // #endregion Constructors (1)

    // #region Public Abstract Methods (3)

    abstract onDown(ray: IRay, intersection: IIntersection[]): void;
    abstract onEnd(ray: IRay, intersection: IIntersection[]): void;
    abstract onMove(ray: IRay, intersection: IIntersection[]): void;

    // #endregion Public Abstract Methods (3)
}