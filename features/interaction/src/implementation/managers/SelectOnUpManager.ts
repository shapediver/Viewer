import { IRay, IIntersection, IIntersectionFilter } from "@shapediver/viewer.rendering-engine.intersection-engine";
import { ITreeNode, TreeNode } from "@shapediver/viewer.shared.node-tree";
import { INTERACTION_STATE } from "../../interfaces/IInteractionEngine";
import { IInteractionFilterOptions } from "../../interfaces/IInteractionManager";
import { AbstractInteractionManager } from "../AbstractInteractionManager";
import { InteractionData } from "../InteractionData";
import { EventEngine, EVENTTYPE, ShapeDiverViewerInteractionError } from "@shapediver/viewer.shared.services";
import { container } from "tsyringe";
import { ITreeNodeData } from "@shapediver/viewer.shared.node-tree";
import { IViewportApi } from "@shapediver/viewer";
import { ISelectEvent } from "../../interfaces/events/ISelectEvent";

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
                        if((<InteractionData>node.data[i]).interactionTypes.select)
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

    // #endregion Public Accessors (3)

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
     * Select a node.
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
        if(endState === INTERACTION_STATE.UP) {
            const intersections = intersection.filter( i => this.filter(INTERACTION_STATE.UP)(i.node))

            if(this.#node) {
                if(intersections.length > 0 && intersection[0].node !== this.#node) {
                    // case other node was clicked, deselect then select
                    this.deactivateNode(event);
                    this.activateNode(intersections[0], event, ray);
                } else if(intersections.length > 0 && intersection[0].node === this.#node) {
                    // case same node was clicked, only deselect
                    this.deactivateNode(event);
                } else if(intersections.length === 0 && this.#deselectOnEmpty) {
                    // case no node was clicked, only deselect when option is on
                    this.deactivateNode(event);
                }
            } else if(intersections.length > 0) {
                // easy case, no node select, just select this one
                this.activateNode(intersections[0], event, ray);
            } 
        }
    }

    public onMove(event: MouseEvent | TouchEvent, ray: IRay, intersection: IIntersection[]): void {
        if(!this.viewport) throw new ShapeDiverViewerInteractionError('The interaction manager does not belong to an interaction engine. Please add it to one first.');
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
        if(data) data.interactionStates.select = true;
        if(this.effectMaterial) {
            this.#effectMaterialToken = this.interactionEffectUtils.applyEffectMaterial(this.#node, this.effectMaterial)
        } else {
            this.#effectMaterialToken = undefined;
        }
        
        this.viewport.updateNode(this.#node);
        this.viewport.render();

        this.#eventEngine.emitEvent(EVENTTYPE.INTERACTION.SELECT_ON,
            {
                viewportId: this.viewport.id,
                node: this.#node,
                intersectionPoint: this.#intersection.point,
                ray,
                event,
                manager: this
            } as ISelectEvent
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
        if(data) data.interactionStates.select = false;
        
        const node = this.#node;

        this.#intersection = null;
        this.#node = null;

        this.#eventEngine.emitEvent(EVENTTYPE.INTERACTION.SELECT_OFF, 
            { 
                viewportId: this.viewport.id,
                node,
                event,
                manager: this         
            } as ISelectEvent
        );
    }

    // #endregion Private Methods (2)
}