import { IIntersection, IIntersectionFilter, IRay } from '@shapediver/viewer.rendering-engine.intersection-engine'
import { ITreeNode } from '@shapediver/viewer.shared.node-tree'
import { EventEngine, EVENTTYPE, ShapeDiverViewerInteractionError } from '@shapediver/viewer.shared.services'
import { container } from 'tsyringe'

import { INTERACTION_STATE } from '../../interfaces/IInteractionEngine'
import { IInteractionFilterOptions } from '../../interfaces/IInteractionManager'
import { AbstractInteractionManager } from '../AbstractInteractionManager'
import { InteractionData } from '../InteractionData'
import { ITreeNodeData } from '@shapediver/viewer.shared.node-tree'
import { IViewportApi } from '@shapediver/viewer'
import { IHoverEvent } from '../../interfaces/events/IHoverEvent'

export class HoverManager extends AbstractInteractionManager {
    // #region Properties (5)

    readonly #eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);

    #effectMaterialToken?: string;
    #filter: IInteractionFilterOptions = (interactionState: INTERACTION_STATE): IIntersectionFilter => {
        if (interactionState === INTERACTION_STATE.MOVE) {
            return (node: ITreeNode) => {
                for (let i = 0; i < node.data.length; i++) {
                    if (node.data[i] instanceof InteractionData) {
                        if ((<InteractionData>node.data[i]).interactionTypes.hover)
                            return true;
                    }
                }
                return false;
            };
        }

        return (node: ITreeNode) => false;
    };

    #intersection: IIntersection | null = null;
    #node: ITreeNode | null = null;

    // #endregion Properties (5)

    // #region Public Accessors (1)

    public get filter(): IInteractionFilterOptions {
        return this.#filter;
    }

    // #endregion Public Accessors (1)

    // #region Public Methods (3)

    public add(viewport: IViewportApi): void {
        this.viewport = viewport;
    }

    public remove(): void {
        if (this.#node)
            this.deactivateNode(); 
        this.viewport = undefined;
    }
    
    /**
     * Select a node for hovering.
     * The point and distance of the intersection can be freely chosen and are provided in the event callbacks.
     * 
     * @param intersection 
     */
    public select(intersection: IIntersection) {
        if(this.#node)
            this.deactivateNode();
        this.activateNode(intersection);
    }

    /**
     * Deselect the current node.
     */
    public deselect() {
        if(this.#node)
            this.deactivateNode();
    }

    public onDown(event: MouseEvent | TouchEvent, ray: IRay, intersection: IIntersection[]): void {
        if(!this.viewport) throw new ShapeDiverViewerInteractionError('The interaction manager does not belong to an interaction engine. Please add it to one first.');
    }

    public onEnd(event: MouseEvent | TouchEvent, ray: IRay, intersection: IIntersection[], endState: INTERACTION_STATE): void {
        if(!this.viewport) throw new ShapeDiverViewerInteractionError('The interaction manager does not belong to an interaction engine. Please add it to one first.');
    }

    public onMove(event: MouseEvent | TouchEvent, ray: IRay, intersection: IIntersection[]): void {
        if(!this.viewport) throw new ShapeDiverViewerInteractionError('The interaction manager does not belong to an interaction engine. Please add it to one first.');
        let intersections = intersection.filter(i => this.filter(INTERACTION_STATE.MOVE)(i.node))
        intersections = intersection.filter(i => {
            const data = <InteractionData>i.node.data.find(d => d instanceof InteractionData);
            return !(data && data.interactionStates.drag === true);
        })

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

    // #endregion Public Methods (3)

    // #region Private Methods (2)

    /**
     * Utility function to make the node the current active node.
     * Set the according values, apply the effect and emit the event.
     * 
     * @param intersection 
     * @param event 
     * @param ray 
     */
    private activateNode(intersection: IIntersection, event?: MouseEvent | TouchEvent, ray?: IRay) {
        if(!this.viewport) throw new ShapeDiverViewerInteractionError('The interaction manager does not belong to an interaction engine. Please add it to one first.');
        this.#intersection = intersection;
        this.#node = this.#intersection.node;
        const data = <InteractionData>this.#node!.data.find((d: ITreeNodeData) => d instanceof InteractionData);
        if (data) data.interactionStates.hover = true;
        if(this.effectMaterial) {
            this.#effectMaterialToken = this.interactionEffectUtils.applyEffectMaterial(this.#node, this.effectMaterial)
        } else {
            this.#effectMaterialToken = undefined;
        }

        this.viewport.updateNode(this.#node);
        this.viewport.render();

        this.#eventEngine.emitEvent(EVENTTYPE.INTERACTION.HOVER_ON, 
            {
                viewportId: this.viewport.id,
                node: this.#node,
                intersectionPoint: this.#intersection.point,
                ray,
                event,
                manager: this
            } as IHoverEvent
        );
    }

    /**
     * Utility function to make the node inactive.
     * Set the according values, remove the effect and emit the event.
     * 
     * @param event 
     */
    private deactivateNode(event?: MouseEvent | TouchEvent) {
        if(!this.viewport) throw new ShapeDiverViewerInteractionError('The interaction manager does not belong to an interaction engine. Please add it to one first.');
        if(this.#effectMaterialToken) {
            this.interactionEffectUtils.removeEffectMaterial(this.#node!, this.#effectMaterialToken);
            this.#effectMaterialToken = undefined;
        }
        this.viewport.updateNode(this.#node!);
        this.viewport.render();
        const data = <InteractionData>this.#node!.data.find((d: ITreeNodeData) => d instanceof InteractionData);
        if (data) data.interactionStates.hover = false;

        const node = this.#node;
        
        this.#intersection = null;
        this.#node = null;

        this.#eventEngine.emitEvent(EVENTTYPE.INTERACTION.HOVER_OFF, 
            { 
                viewportId: this.viewport.id,
                node: node,
                event,
                manager: this
            } as IHoverEvent
        );
    }

    // #endregion Private Methods (2)
}