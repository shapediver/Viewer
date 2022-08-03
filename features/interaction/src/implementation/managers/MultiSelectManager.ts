import { IRay, IIntersection, IIntersectionFilter } from "@shapediver/viewer.rendering-engine.intersection-engine";
import { ITreeNode } from "@shapediver/viewer.shared.node-tree";
import { INTERACTION_STATE } from "../../interfaces/IInteractionEngine";
import { IInteractionFilterOptions } from "../../interfaces/IInteractionManager";
import { AbstractInteractionManager } from "../AbstractInteractionManager";
import { InteractionData } from "../InteractionData";
import { EventEngine, EVENTTYPE, ShapeDiverViewerInteractionError } from "@shapediver/viewer.shared.services";
import { IMultiSelectEvent } from "@shapediver/viewer.shared.types"
import { container } from "tsyringe";
import { IViewportApi } from "@shapediver/viewer";

export class MultiSelectManager extends AbstractInteractionManager {
    // #region Properties (6)

    readonly #eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);

    #effectMaterialTokens: (string | undefined)[] = [];
    #filter: IInteractionFilterOptions = (interactionState: INTERACTION_STATE): IIntersectionFilter => {
        if(interactionState === INTERACTION_STATE.DOWN) {
            return (node: ITreeNode) => {
                for(let i = 0; i < node.data.length; i++) {
                    if(node.data[i] instanceof InteractionData) {
                        if((<InteractionData>node.data[i]).interactionTypes.select)
                            return true;
                    }
                }
                return false;
            };
        }

        return (node: ITreeNode) => false;
    };
    #nodes: ITreeNode[] = [];

    // #endregion Properties (6)

    // #region Public Accessors (3)

    public get filter(): IInteractionFilterOptions {
        return this.#filter;
    }

    // #endregion Public Accessors (3)

    // #region Public Methods (3)
    
    public add(viewport: IViewportApi): void {
        this.viewport = viewport;
    }

    public remove(): void {
        for (let i = 0; i < this.#nodes.length; i++)
            this.deactivateNode(this.#nodes[i]); 
        this.viewport = undefined;
    }

    public onDown(ray: IRay, intersection: IIntersection[]): void {
        if(!this.viewport) throw new ShapeDiverViewerInteractionError('The interaction manager does not belong to an interaction engine. Please add it to one first.');
        const intersections = intersection.filter( i => this.filter(INTERACTION_STATE.DOWN)(i.node))

        if(this.#nodes.length > 0) {
            if(intersections.length > 0 && !this.#nodes.includes(intersections[0].node)) {
                // case other node was clicked, deselect then select
                this.activateNode(intersections[0]);
            } else if(intersections.length > 0 && this.#nodes.includes(intersections[0].node)) {
                // case same node was clicked, only deselect
                this.deactivateNode(intersections[0].node);
            }
        } else if(intersections.length > 0) {
            // easy case, no node select, just select this one
            this.activateNode(intersections[0]);
        }
    }

    public onEnd(ray: IRay, intersection: IIntersection[], endState: INTERACTION_STATE): void {
        if(!this.viewport) throw new ShapeDiverViewerInteractionError('The interaction manager does not belong to an interaction engine. Please add it to one first.');
    }

    public onMove(ray: IRay, intersection: IIntersection[]): void {        
        if(!this.viewport) throw new ShapeDiverViewerInteractionError('The interaction manager does not belong to an interaction engine. Please add it to one first.');
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
        if(!this.viewport) throw new ShapeDiverViewerInteractionError('The interaction manager does not belong to an interaction engine. Please add it to one first.');
        this.#nodes.push(intersection.node);
        const data = <InteractionData>intersection.node.data.find(d => d instanceof InteractionData);
        if(data) data.interactionStates.select = true;
        if(this.effectMaterial) {
            this.#effectMaterialTokens.push(this.interactionEffectUtils.applyEffectMaterial(intersection.node, this.effectMaterial))
        } else {
            this.#effectMaterialTokens.push(undefined);
        }
        

        this.viewport.updateNode(intersection.node);
        this.viewport.render();

        this.#eventEngine.emitEvent(EVENTTYPE.INTERACTION.SELECT_ON, { 
            nodes: this.#nodes, 
            node: intersection.node,
            intersectionPoint: intersection.point
        } as IMultiSelectEvent);
    }

    /**
     * Utility function to make the node inactive.
     * Set the according values, remove the effect and emit the event.
     * 
     * @param intersection 
     */
    private deactivateNode(node: ITreeNode) {
        if(!this.viewport) throw new ShapeDiverViewerInteractionError('The interaction manager does not belong to an interaction engine. Please add it to one first.');
        const index = this.#nodes.indexOf(node);
        if(index === -1) return;
        
        const effectMaterialToken = this.#effectMaterialTokens[index];
        this.#effectMaterialTokens.splice(index, 1);
        if(effectMaterialToken) 
            this.interactionEffectUtils.removeEffectMaterial(node, effectMaterialToken);
        
        this.viewport.updateNode(node);
        this.viewport.render();
        const data = <InteractionData>node.data.find(d => d instanceof InteractionData);
        if(data) data.interactionStates.select = false;
        
        this.#nodes.splice(index, 1);
        this.#eventEngine.emitEvent(EVENTTYPE.INTERACTION.SELECT_OFF, { nodes: this.#nodes, node: node } as IMultiSelectEvent);
    }

    // #endregion Private Methods (2)
}