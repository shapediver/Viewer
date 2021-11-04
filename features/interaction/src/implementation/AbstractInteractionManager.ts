import { container } from "tsyringe";
import { IRay, IIntersection } from "@shapediver/viewer.rendering-engine.intersection-engine";
import { IInteractionFilterOptions, IInteractionManager } from "../interfaces/IInteractionManager";
import { IViewer } from "@shapediver/viewer";
import { DragConstraints } from "./DragConstraints";
import { InteractionEffects } from "./InteractionEffects";

export abstract class AbstractInteractionManager implements IInteractionManager {
    // #region Properties (4)

    readonly #dragConstraints: DragConstraints = <DragConstraints>container.resolve(DragConstraints);
    readonly #effects: InteractionEffects = <InteractionEffects>container.resolve(InteractionEffects);

    #viewer!: IViewer;
    abstract filter: IInteractionFilterOptions;

    // #endregion Properties (4)

    // #region Public Accessors (4)

    public get dragConstraints(): DragConstraints {
        return this.#dragConstraints;
    }

    public get effects(): InteractionEffects {
        return this.#effects;
    }

    public get viewer(): IViewer {
        return this.#viewer;
    }

    public set viewer(value: IViewer) {
        this.#viewer = value;
    }

    // #endregion Public Accessors (4)

    // #region Public Abstract Methods (3)

    abstract onDown(ray: IRay, intersection: IIntersection[]): void;
    abstract onEnd(ray: IRay, intersection: IIntersection[]): void;
    abstract onMove(ray: IRay, intersection: IIntersection[]): void;

    // #endregion Public Abstract Methods (3)
}