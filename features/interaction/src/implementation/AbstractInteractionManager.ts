import { IIntersection, IRay } from '@shapediver/viewer.rendering-engine.intersection-engine'
import { IViewportApi, IMaterialAbstractData, ITreeNode, Tree } from '@shapediver/viewer'

import { IInteractionFilterOptions, IInteractionManager } from '../interfaces/IInteractionManager'
import { DragConstraintUtils } from './utils/DragConstraintUtils'
import { InteractionEffectUtils } from './utils/InteractionEffectUtils'
import { IDragConstraintUtils } from '../interfaces/utils/IDragConstraintUtils'
import { IInteractionEffectUtils } from '../interfaces/utils/IInteractionEffectUtils'
import { INTERACTION_STATE } from '../interfaces/IInteractionEngine'
import { EventEngine, EVENTTYPE } from '@shapediver/viewer.shared.services'
import { InteractionData } from './InteractionData'

export abstract class AbstractInteractionManager implements IInteractionManager {
    // #region Properties (6)

    readonly #eventEngine: EventEngine = EventEngine.instance;
    readonly #tree: Tree = Tree.instance;

    #dragConstraintUtils: IDragConstraintUtils = DragConstraintUtils.instance;
    #effectMaterial?: IMaterialAbstractData;
    #interactionEffectUtils: IInteractionEffectUtils = InteractionEffectUtils.instance;
    #viewport?: IViewportApi;
    #gatheredGroupedNodes: {
        [key: string]: ITreeNode[]
    } = {};

    abstract filter: IInteractionFilterOptions;

    // #endregion Properties (6)

    // #region Constructors (1)

    constructor() {        
        this.gatherGroupNodes();
        this.#eventEngine.addListener(EVENTTYPE.VIEWPORT.VIEWPORT_UPDATED, () => {
            this.gatherGroupNodes();
        })
    }

    // #endregion Constructors (1)

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

    public get gatheredGroupedNodes(): {
        [key: string]: ITreeNode[]
    } {
        return this.#gatheredGroupedNodes;
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

    // #region Public Abstract Methods (5)

    abstract add(viewport: IViewportApi): void;
    abstract onDown(event: MouseEvent | TouchEvent, ray: IRay, intersection: IIntersection[]): void;
    abstract onEnd(event: MouseEvent | TouchEvent, ray: IRay, intersection: IIntersection[], endState: INTERACTION_STATE): void;
    abstract onMove(event: MouseEvent | TouchEvent, ray: IRay, intersection: IIntersection[]): void;
    abstract remove(): void;

    // #endregion Public Abstract Methods (5)

    // #region Private Methods (1)

    private gatherGroupNodes() {
        this.#gatheredGroupedNodes = {};
        this.#tree.root.traverse(node => {
            if (node.visible === false) return;
            if(this.#viewport && node.excludeViewports.includes(this.#viewport.id)) return;
            if(this.#viewport && node.restrictViewports.length > 0 && !node.restrictViewports.includes(this.#viewport.id)) return;

            for(let i = 0; i < node.data.length; i++) {
                if(node.data[i] instanceof InteractionData && (<InteractionData>node.data[i]).groupId) {
                    if(!this.#gatheredGroupedNodes[(<InteractionData>node.data[i]).groupId!]) 
                        this.#gatheredGroupedNodes[(<InteractionData>node.data[i]).groupId!] = [];
                    this.#gatheredGroupedNodes[(<InteractionData>node.data[i]).groupId!].push(node);
                }
            }
        })
    }

    // #endregion Private Methods (1)
}