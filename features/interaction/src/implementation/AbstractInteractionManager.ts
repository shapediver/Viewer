import { container } from 'tsyringe'
import { IIntersection, IRay } from '@shapediver/viewer.rendering-engine.intersection-engine'
import { IViewportApi, IMaterialAbstractData } from '@shapediver/viewer'

import { IInteractionFilterOptions, IInteractionManager } from '../interfaces/IInteractionManager'
import { DragConstraintUtils } from './utils/DragConstraintUtils'
import { InteractionEffectUtils } from './utils/InteractionEffectUtils'
import { IDragConstraintUtils } from '../interfaces/utils/IDragConstraintUtils'
import { IInteractionEffectUtils } from '../interfaces/utils/IInteractionEffectUtils'
import { INTERACTION_STATE } from '../interfaces/IInteractionEngine'

export abstract class AbstractInteractionManager implements IInteractionManager {
    // #region Properties (5)

    #dragConstraintUtils: IDragConstraintUtils = <DragConstraintUtils>container.resolve(DragConstraintUtils);
    #effectMaterial?: IMaterialAbstractData;
    #interactionEffectUtils: IInteractionEffectUtils = <InteractionEffectUtils>container.resolve(InteractionEffectUtils);
    #viewport?: IViewportApi;
    abstract filter: IInteractionFilterOptions;

    // #endregion Properties (5)

    // #region Public Accessors (8)

    public get dragConstraintUtils(): IDragConstraintUtils {
        return this.#dragConstraintUtils;
    }

    public set dragConstraintUtils(value: IDragConstraintUtils) {
        this.#dragConstraintUtils = value;
    }

    public get effectMaterial(): IMaterialAbstractData | undefined {
        return this.#effectMaterial;
    }

    public set effectMaterial(value: IMaterialAbstractData | undefined) {
        this.#effectMaterial = value;
    }

    public get interactionEffectUtils(): IInteractionEffectUtils {
        return this.#interactionEffectUtils;
    }

    public set interactionEffectUtils(value: IInteractionEffectUtils) {
        this.#interactionEffectUtils = value;
    }

    public get viewport(): IViewportApi | undefined {
        return this.#viewport;
    }

    public set viewport(value: IViewportApi | undefined) {
        this.#viewport = value;
    }

    // #endregion Public Accessors (8)

    // #region Public Abstract Methods (3)

    abstract add(viewport: IViewportApi): void;
    abstract remove(): void;
    abstract onDown(event: MouseEvent | TouchEvent, ray: IRay, intersection: IIntersection[]): void;
    abstract onEnd(event: MouseEvent | TouchEvent, ray: IRay, intersection: IIntersection[], endState: INTERACTION_STATE): void;
    abstract onMove(event: MouseEvent | TouchEvent, ray: IRay, intersection: IIntersection[]): void;

    // #endregion Public Abstract Methods (3)
}