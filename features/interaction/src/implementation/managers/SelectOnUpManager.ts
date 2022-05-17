import { IRay, IIntersection, IIntersectionFilter } from "@shapediver/viewer.rendering-engine.intersection-engine";
import { ITreeNode, TreeNode } from "@shapediver/viewer.shared.node-tree";
import { INTERACTION_STATE } from "../../interfaces/IInteractionEngine";
import { IInteractionFilterOptions } from "../../interfaces/IInteractionManager";
import { AbstractInteractionManager } from "../AbstractInteractionManager";
import { InteractionData } from "../InteractionData";
import { EventEngine, EVENTTYPE } from "@shapediver/viewer.shared.services";
import { container } from "tsyringe";
import { ITreeNodeData } from "@shapediver/viewer.shared.node-tree";
import { ISelectEvent } from "@shapediver/viewer.shared.types";

export class SelectOnUpManager extends AbstractInteractionManager {
    // #region Properties (6)

    readonly #eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);

    #deselectOnEmpty: boolean = true;
    #effectMaterialToken?: string;
    #filter: IInteractionFilterOptions = (interactionState: INTERACTION_STATE): IIntersectionFilter => {
        if(interactionState === INTERACTION_STATE.UP) {
            return (node: ITreeNode) => {
                for(let i = 0; i < node.data.length; i++) {
                    if(node.data[i] instanceof InteractionData) {
                        if((<InteractionData>node.data[i]).interactionTypes['select'])
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

    // #endregion Properties (6)

    // #region Public Accessors (3)

    public get deselectOnEmpty(): boolean {
        return this.#deselectOnEmpty;
    }

    public set deselectOnEmpty(value: boolean) {
        this.#deselectOnEmpty = value;
    }

    public get filter(): IInteractionFilterOptions {
        return this.#filter;
    }

    // #endregion Public Accessors (3)

    // #region Public Methods (3)

    public onDown(ray: IRay, intersection: IIntersection[]): void {}

    public onEnd(ray: IRay, intersection: IIntersection[], endState: INTERACTION_STATE): void {
        if(endState === INTERACTION_STATE.UP) {
            const intersections = intersection.filter( i => this.filter(INTERACTION_STATE.UP)(i.node))

            if(this.#node) {
                if(intersections.length > 0 && intersection[0].node !== this.#node) {
                    // case other node was clicked, deselect then select
                    this.deactivateNode();
                    this.activateNode(intersections[0]);
                } else if(intersections.length > 0 && intersection[0].node === this.#node) {
                    // case same node was clicked, only deselect
                    this.deactivateNode();
                } else if(intersections.length === 0 && this.#deselectOnEmpty) {
                    // case no node was clicked, only deselect when option is on
                    this.deactivateNode();
                }
            } else if(intersections.length > 0) {
                // easy case, no node select, just select this one
                this.activateNode(intersections[0]);
            } 
        }
    }

    public onMove(ray: IRay, intersection: IIntersection[]): void {}

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
        if(data) data.interactionStates['select'] = true;
        if(this.effectMaterial) {
            this.#effectMaterialToken = this.interactionEffectUtils.applyEffectMaterial(this.#node, this.effectMaterial)
        } else {
            this.#effectMaterialToken = undefined;
        }
        
        this.#eventEngine.emitEvent(EVENTTYPE.INTERACTION.SELECT_ON, { node: this.#node } as ISelectEvent);

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
        if(data) data.interactionStates['select'] = false;
        
        this.#eventEngine.emitEvent(EVENTTYPE.INTERACTION.SELECT_OFF, { node: this.#node } as ISelectEvent);

        this.#intersection = null;
        this.#node = null;
    }

    // #endregion Private Methods (2)
}