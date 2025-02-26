import { AbstractInteractionManager } from '../AbstractInteractionManager';
import { EventEngine, EVENTTYPE, Logger } from '@shapediver/viewer.shared.services';
import { IInteractionFilterOptions } from '../../interfaces/IInteractionManager';
import { IIntersection, IIntersectionFilter, IRay } from '@shapediver/viewer.shared.types';
import { IMaterialAbstractData, IViewportApi } from '@shapediver/viewer';
import { INTERACTION_STATE } from '../../interfaces/IInteractionEngine';
import { InteractionData } from '../InteractionData';
import { ISelectEvent } from '../../interfaces/events/ISelectEvent';
import { ITreeNode, Tree } from '@shapediver/viewer.shared.node-tree';
/* eslint-disable @typescript-eslint/no-unused-vars */

export class SelectOnUpManager extends AbstractInteractionManager {
    // #region Properties (9)

    readonly #eventEngine: EventEngine = EventEngine.instance;
    readonly #logger: Logger = Logger.instance;
    readonly #tree: Tree = Tree.instance;

    #deselectOnEmpty: boolean = true;
    #effectMaterialToken?: string;
    #filter: IInteractionFilterOptions = (interactionState: INTERACTION_STATE): IIntersectionFilter => {
        if (interactionState === INTERACTION_STATE.UP) {
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

    // #endregion Properties (9)

    // #region Constructors (1)

    constructor(id?: string, effectMaterial?: IMaterialAbstractData, deselectOnEmpty?: boolean) {
        super(id, effectMaterial);
        if (deselectOnEmpty !== undefined) this.#deselectOnEmpty = deselectOnEmpty;
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (3)

    /**
     * Deselect the selected node when clicking on an empty space in the Viewport.
     */
    public get deselectOnEmpty(): boolean {
        return this.#deselectOnEmpty;
    }

    /**
     * Deselect the selected node when clicking on an empty space in the Viewport.
     */
    public set deselectOnEmpty(value: boolean) {
        this.#deselectOnEmpty = value;
    }

    public get filter(): IInteractionFilterOptions {
        return this.#filter;
    }

    // #endregion Public Getters And Setters (3)

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
        if (endState === INTERACTION_STATE.UP) {
            const intersections = intersection.filter(i => this.filter(INTERACTION_STATE.UP)(i.node));

            if (this.#node) {
                if (intersections.length > 0 && intersection[0].node !== this.#node) {
                    // case other node was clicked, deselect then select
                    this.deactivateNode(event);
                    this.activateNode(intersections[0], event, ray);
                } else if (intersections.length > 0 && intersection[0].node === this.#node) {
                    // case same node was clicked, only deselect
                    this.deactivateNode(event);
                } else if (intersections.length === 0 && this.#deselectOnEmpty) {
                    // case no node was clicked, only deselect when option is on
                    this.deactivateNode(event);
                }
            } else if (intersections.length > 0) {
                // easy case, no node select, just select this one
                this.activateNode(intersections[0], event, ray);
            }
        }
    }

    public onMove(event: PointerEvent, ray: IRay, intersection: IIntersection[]): void {
        if (!this.viewport) {
            this.#logger.warn('The interaction manager does not belong to an interaction engine. Please add it to one first.');
            return;
        }
    }

    public remove(): void {
        if (this.#node)
            this.deactivateNode();
        this.viewport = undefined;
    }

    /**
     * Select a node.
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
        if (data) data.interactionStates.select = true;

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

        this.#eventEngine.emitEvent(EVENTTYPE.INTERACTION.SELECT_ON,
            {
                viewportId: this.viewport.id,
                node: this.#node,
                intersectionPoint: this.#intersection.point,
                ray,
                event,
                manager: this,
                groupedNodes: this.#groupedNodes
            } as ISelectEvent
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
        if (data) data.interactionStates.select = false;

        if (this.#effectMaterialToken) {
            this.interactionEffectUtils.removeEffectMaterial(this.#node!, this.#effectMaterialToken);
            this.#effectMaterialToken = undefined;

            if (this.#groupedNodes) this.#groupedNodes!.forEach((n, i) => this.interactionEffectUtils.removeEffectMaterial(n, this.#groupEffectMaterialToken![i]));
            this.#groupEffectMaterialToken = undefined;
        }

        this.viewport.updateNode(this.#node!);
        if (this.#groupedNodes) this.#groupedNodes!.forEach(n => this.viewport!.updateNode(n));

        this.viewport.render();

        this.#eventEngine.emitEvent(EVENTTYPE.INTERACTION.SELECT_OFF,
            {
                viewportId: this.viewport.id,
                node: this.#node,
                event,
                manager: this,
                groupedNodes: this.#groupedNodes
            } as ISelectEvent
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
                    (<InteractionData>node.data[i]).interactionTypes.select)
                    return node.data[i] as InteractionData;
            }
        }
    }

    // #endregion Private Methods (2)
}