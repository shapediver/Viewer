import { container } from "tsyringe";
import { IRay, IIntersection } from "@shapediver/viewer.rendering-engine.intersection-engine";
import { IInteractionFilterOptions, IInteractionManager } from "../interfaces/IInteractionManager";
import { IViewer, MaterialData } from "@shapediver/viewer";
import { DragConstraintUtils } from "./utils/DragConstraintUtils";
import { InteractionEffectUtils } from "./utils/InteractionEffectUtils";
import { IDragConstraintUtils } from "../interfaces/utils/IDragConstraintUtils";
import { IInteractionEffectUtils } from "../interfaces/utils/IInteractionEffectUtils";

export abstract class AbstractInteractionManager implements IInteractionManager {
    // #region Properties (5)

    #dragConstraintUtils: IDragConstraintUtils = <DragConstraintUtils>container.resolve(DragConstraintUtils);
    #effectMaterial: MaterialData = new MaterialData({ color: '#00fff7' });
    #interactionEffectUtils: IInteractionEffectUtils = <InteractionEffectUtils>container.resolve(InteractionEffectUtils);
    #viewer!: IViewer;
    abstract filter: IInteractionFilterOptions;

    // #endregion Properties (5)

    // #region Public Accessors (8)

    public get dragConstraintUtils(): IDragConstraintUtils {
        return this.#dragConstraintUtils;
    }

    public set dragConstraintUtils(value: IDragConstraintUtils) {
        this.#dragConstraintUtils = value;
    }

    public get effectMaterial(): MaterialData {
        return this.#effectMaterial;
    }

    public set effectMaterial(value: MaterialData) {
        this.#effectMaterial = value;
    }

    public get interactionEffectUtils(): IInteractionEffectUtils {
        return this.#interactionEffectUtils;
    }

    public set interactionEffectUtils(value: IInteractionEffectUtils) {
        this.#interactionEffectUtils = value;
    }

    public get viewer(): IViewer {
        return this.#viewer;
    }

    public set viewer(value: IViewer) {
        this.#viewer = value;
    }

    // #endregion Public Accessors (8)

    // #region Public Abstract Methods (3)

    abstract onDown(ray: IRay, intersection: IIntersection[]): void;
    abstract onEnd(ray: IRay, intersection: IIntersection[]): void;
    abstract onMove(ray: IRay, intersection: IIntersection[]): void;

    // #endregion Public Abstract Methods (3)
}