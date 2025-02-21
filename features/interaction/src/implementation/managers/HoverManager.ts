/* eslint-disable @typescript-eslint/no-unused-vars */
import { AbstractInteractionManager } from '../AbstractInteractionManager';
import { EventEngine, EVENTTYPE, Logger } from '@shapediver/viewer.shared.services';
import { IHoverEvent } from '../../interfaces/events/IHoverEvent';
import { IInteractionFilterOptions } from '../../interfaces/IInteractionManager';
import { IIntersection, IIntersectionFilter, IRay } from '@shapediver/viewer.rendering-engine.intersection-engine';
import { INTERACTION_STATE } from '../../interfaces/IInteractionEngine';
import { InteractionData } from '../InteractionData';
import { ITreeNode, Tree } from '@shapediver/viewer.shared.node-tree';
import { addListener, IMaterialAbstractData, IViewportApi, removeListener } from '@shapediver/viewer';

export class HoverManager extends AbstractInteractionManager {
    // #region Properties (8)

    readonly #eventEngine: EventEngine = EventEngine.instance;
    readonly #logger: Logger = Logger.instance;
    readonly #tree: Tree = Tree.instance;

    #effectMaterialToken?: string;
    #filter: IInteractionFilterOptions = (interactionState: INTERACTION_STATE): IIntersectionFilter => {
        if (interactionState === INTERACTION_STATE.MOVE) {
            return (node: ITreeNode) => {
                return !!this.getInteractionData(node);
            };
        }

        return (node: ITreeNode) => false;
    };
    #groupEffectMaterialToken?: string[];
    #groupedNodes?: ITreeNode[];
    #intersection: IIntersection | null = null;
    #node: ITreeNode | null = null;
    #dragEventTokenStart: string;
    #currentlyDragging: boolean = false;
    #dragEventTokenEnd: string;

    // #endregion Properties (8)

    // #region Constructors (1)

    constructor(id?: string, effectMaterial?: IMaterialAbstractData) {
        super(id, effectMaterial);

        this.#dragEventTokenStart = addListener(EVENTTYPE.INTERACTION.DRAG_START, () => {
            this.#currentlyDragging = true;
        });
        this.#dragEventTokenEnd = addListener(EVENTTYPE.INTERACTION.DRAG_END, () => {
            this.#currentlyDragging = false;
        });
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (1)

    public get filter(): IInteractionFilterOptions {
        return this.#filter;
    }

    // #endregion Public Getters And Setters (1)

    // #region Public Methods (7)

    public add(viewport: IViewportApi): void {
        this.viewport = viewport;
    }

    /**
     * Deselect the current node.
     */
    public deselect() {
        if (this.#node)
            this.deactivateNode();
    }

    public onDown(event: PointerEvent, ray: IRay, intersection: IIntersection[]): void {
        if (!this.viewport) {
            this.#logger.warn('The interaction manager does not belong to an interaction engine. Please add it to one first.');
            return;
        }
    }

    public onEnd(event: PointerEvent, ray: IRay, intersection: IIntersection[], endState: INTERACTION_STATE): void {
        if (!this.viewport) {
            this.#logger.warn('The interaction manager does not belong to an interaction engine. Please add it to one first.');
            return;
        }
    }

    public onMove(event: PointerEvent, ray: IRay, intersection: IIntersection[]): void {
        if (!this.viewport) {
            this.#logger.warn('The interaction manager does not belong to an interaction engine. Please add it to one first.');
            return;
        }
        
        // if a node is currently being dragged, do not hover any other nodes
        if(this.#currentlyDragging) {
            if(this.#node)
                this.deactivateNode(event);
            return;
        }

        let intersections = intersection.filter(i => this.filter(INTERACTION_STATE.MOVE)(i.node));
        intersections = intersection.filter(i => {
            const data = this.getInteractionData(i.node);
            return !(data && data.interactionStates.drag === true);
        });

        if (this.#node) {
            if (intersections.length > 0 && intersection[0].node === this.#node) {
                // do nothing
            } else if (intersections.length > 0) {
                this.deactivateNode(event);
                this.activateNode(intersections[0], event, ray);
            } else {
                this.deactivateNode(event);
            }
        } else if (intersections.length > 0) {
            // easy case, no node hover, just hover this one
            this.activateNode(intersections[0], event, ray);
        }
    }

    public remove(): void {
        if (this.#node)
            this.deactivateNode();
        this.viewport = undefined;

        removeListener(this.#dragEventTokenStart);
        removeListener(this.#dragEventTokenEnd);
    }

    /**
     * Select a node for hovering.
     * The point and distance of the intersection can be freely chosen and are provided in the event callbacks.
     * 
     * @param intersection 
     */
    public select(intersection: IIntersection) {
        if (this.#node)
            this.deactivateNode();
        this.activateNode(intersection);
    }

    // #endregion Public Methods (7)

    // #region Private Methods (2)

    /**
     * Utility function to make the node the current active node.
     * Set the according values, apply the effect and emit the event.
     * 
     * @param intersection 
     * @param event 
     * @param ray 
     */
    private activateNode(intersection: IIntersection, event?: PointerEvent, ray?: IRay) {
        if (!this.viewport) {
            this.#logger.warn('The interaction manager does not belong to an interaction engine. Please add it to one first.');
            return;
        }
        this.#intersection = intersection;
        this.#node = this.#intersection.node;

        this.#groupedNodes = undefined;
        this.#groupEffectMaterialToken = undefined;

        // find the interaction data
        const data = this.getInteractionData(this.#node!);
        if (data) data.interactionStates.hover = true;

        // find and store all nodes that are within the group
        if (data && data.groupId) {
            this.#groupedNodes = this.gatheredGroupedNodes[data.groupId] || [];
            this.#groupEffectMaterialToken = [];
        }

        // apply the effect material if there is something to apply
        if (this.effectMaterial) {
            this.#effectMaterialToken = this.interactionEffectUtils.applyEffectMaterial(this.#node, this.effectMaterial);
            if (this.#groupedNodes) this.#groupedNodes!.forEach(n => this.#groupEffectMaterialToken!.push(this.interactionEffectUtils.applyEffectMaterial(n, this.effectMaterial!)));
        } else {
            this.#effectMaterialToken = undefined;
        }

        this.viewport.updateNode(this.#node);
        if (this.#groupedNodes) this.#groupedNodes!.forEach(n => this.viewport!.updateNode(n));

        this.viewport.render();

        this.#eventEngine.emitEvent(EVENTTYPE.INTERACTION.HOVER_ON,
            {
                viewportId: this.viewport.id,
                node: this.#node,
                intersectionPoint: this.#intersection.point,
                ray,
                event,
                manager: this,
                groupedNodes: this.#groupedNodes
            } as IHoverEvent
        );
    }

    /**
     * Utility function to make the node inactive.
     * Set the according values, remove the effect and emit the event.
     * 
     * @param event 
     */
    private deactivateNode(event?: PointerEvent) {
        if (!this.viewport) {
            this.#logger.warn('The interaction manager does not belong to an interaction engine. Please add it to one first.');
            return;
        }

        // find the interaction data
        const data = this.getInteractionData(this.#node!);
        if (data) data.interactionStates.hover = false;

        if (this.#effectMaterialToken) {
            this.interactionEffectUtils.removeEffectMaterial(this.#node!, this.#effectMaterialToken);
            this.#effectMaterialToken = undefined;

            if (this.#groupedNodes) this.#groupedNodes!.forEach((n, i) => this.interactionEffectUtils.removeEffectMaterial(n, this.#groupEffectMaterialToken![i]));
            this.#groupEffectMaterialToken = undefined;
        }

        this.viewport.updateNode(this.#node!);
        if (this.#groupedNodes) this.#groupedNodes!.forEach(n => this.viewport!.updateNode(n));

        this.viewport.render();

        this.#eventEngine.emitEvent(EVENTTYPE.INTERACTION.HOVER_OFF,
            {
                viewportId: this.viewport.id,
                node: this.#node,
                event,
                manager: this,
                groupedNodes: this.#groupedNodes
            } as IHoverEvent
        );

        this.#intersection = null;
        this.#node = null;

        this.#groupedNodes = undefined;
        this.#groupEffectMaterialToken = undefined;
    }
    
    private getInteractionData(node: ITreeNode): InteractionData | undefined {
        for (let i = 0; i < node.data.length; i++) {
            if (node.data[i] instanceof InteractionData) {
                if (((<InteractionData>node.data[i]).restrictedManagers.length === 0 || (<InteractionData>node.data[i]).restrictedManagers.includes(this.id)) &&
                    (<InteractionData>node.data[i]).interactionTypes.hover)
                    return node.data[i] as InteractionData;
            }
        }
    }

    // #endregion Private Methods (2)
}