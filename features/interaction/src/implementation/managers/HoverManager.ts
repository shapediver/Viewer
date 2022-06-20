import { IIntersection, IIntersectionFilter, IRay } from '@shapediver/viewer.rendering-engine.intersection-engine'
import { ITreeNode, TreeNode } from '@shapediver/viewer.shared.node-tree'
import { IHoverEvent, MaterialStandardData } from '@shapediver/viewer.shared.types'
import { EventEngine, EVENTTYPE } from '@shapediver/viewer.shared.services'
import { container } from 'tsyringe'

import { INTERACTION_STATE } from '../../interfaces/IInteractionEngine'
import { IInteractionFilterOptions } from '../../interfaces/IInteractionManager'
import { AbstractInteractionManager } from '../AbstractInteractionManager'
import { InteractionData } from '../InteractionData'
import { ITreeNodeData } from '@shapediver/viewer.shared.node-tree'

export class HoverManager extends AbstractInteractionManager {
    // #region Properties (5)

    readonly #eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);

    #effectMaterialToken?: string;
    #filter: IInteractionFilterOptions = (interactionState: INTERACTION_STATE): IIntersectionFilter => {
        if (interactionState === INTERACTION_STATE.MOVE) {
            return (node: ITreeNode) => {
                for (let i = 0; i < node.data.length; i++) {
                    if (node.data[i] instanceof InteractionData) {
                        if ((<InteractionData>node.data[i]).interactionTypes['hover'])
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

    public add(): void {

    }

    public remove(): void {
        if (this.#node)
            this.deactivateNode(); 
    }

    public onDown(ray: IRay, intersection: IIntersection[]): void { }

    public onEnd(ray: IRay, intersection: IIntersection[], endState: INTERACTION_STATE): void { }

    public onMove(ray: IRay, intersection: IIntersection[]): void {
        let intersections = intersection.filter(i => this.filter(INTERACTION_STATE.MOVE)(i.node))
        intersections = intersection.filter(i => {
            const data = <InteractionData>i.node.data.find(d => d instanceof InteractionData);
            return !(data && data.interactionStates['drag'] === true);
        })

        if (this.#node) {
            if (intersections.length > 0 && intersection[0].node === this.#node) {
                // do nothing
            } else if (intersections.length > 0) {
                this.deactivateNode();
                this.activateNode(intersections[0]);
            } else {
                this.deactivateNode();
            }
        } else if (intersections.length > 0) {
            // easy case, no node hover, just hover this one
            this.activateNode(intersections[0]);
        }
    }

    // #endregion Public Methods (3)

    // #region Private Methods (2)

    /**
     * Utility function to make the node the current active node.
     * Set the according values, apply the effect and emit the event.
     * 
     * @param intersection 
     */
    private activateNode(intersection: IIntersection) {
        this.#intersection = intersection;
        this.#node = this.#intersection.node;
        const data = <InteractionData>this.#node!.data.find((d: ITreeNodeData) => d instanceof InteractionData);
        if (data) data.interactionStates['hover'] = true;
        if(this.effectMaterial) {
            this.#effectMaterialToken = this.interactionEffectUtils.applyEffectMaterial(this.#node, this.effectMaterial)
        } else {
            this.#effectMaterialToken = undefined;
        }
        this.#eventEngine.emitEvent(EVENTTYPE.INTERACTION.HOVER_ON, { node: this.#node } as IHoverEvent);

        this.viewport.updateNode(this.#node);
        this.viewport.render();
    }

    /**
     * Utility function to make the node inactive.
     * Set the according values, remove the effect and emit the event.
     * 
     * @param intersection 
     */
    private deactivateNode() {
        if(this.#effectMaterialToken) {
            this.interactionEffectUtils.removeEffectMaterial(this.#node!, this.#effectMaterialToken);
            this.#effectMaterialToken = undefined;
        }
        this.viewport.updateNode(this.#node!);
        this.viewport.render();
        const data = <InteractionData>this.#node!.data.find((d: ITreeNodeData) => d instanceof InteractionData);
        if (data) data.interactionStates['hover'] = false;

        this.#eventEngine.emitEvent(EVENTTYPE.INTERACTION.HOVER_OFF, { node: this.#node } as IHoverEvent);

        this.#intersection = null;
        this.#node = null;
    }

    // #endregion Private Methods (2)
}