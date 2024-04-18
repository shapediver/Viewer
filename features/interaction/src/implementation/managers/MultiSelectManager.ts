import { AbstractInteractionManager } from '../AbstractInteractionManager';
import { EventEngine, EVENTTYPE, ShapeDiverViewerInteractionError } from '@shapediver/viewer.shared.services';
import { IInteractionFilterOptions } from '../../interfaces/IInteractionManager';
import { IIntersection, IIntersectionFilter, IRay } from '@shapediver/viewer.rendering-engine.intersection-engine';
import { IMultiSelectEvent } from '../../interfaces/events/IMultiSelectEvent';
import { INTERACTION_STATE } from '../../interfaces/IInteractionEngine';
import { InteractionData } from '../InteractionData';
import { ITreeNode, Tree } from '@shapediver/viewer.shared.node-tree';
import { IViewportApi } from '@shapediver/viewer';

export class MultiSelectManager extends AbstractInteractionManager {
    // #region Properties (7)

    readonly #eventEngine: EventEngine = EventEngine.instance;
    readonly #tree: Tree = Tree.instance;

    #effectMaterialTokens: (string | undefined)[] = [];
    #filter: IInteractionFilterOptions = (interactionState: INTERACTION_STATE): IIntersectionFilter => {
        if (interactionState === INTERACTION_STATE.DOWN) {
            return (node: ITreeNode) => {
                for (let i = 0; i < node.data.length; i++) {
                    if (node.data[i] instanceof InteractionData) {
                        if ((<InteractionData>node.data[i]).interactionTypes.select)
                            return true;
                    }
                }
                return false;
            };
        }

        return (node: ITreeNode) => false;
    };
    #groupEffectMaterialToken: string[][] = [];
    #groupedNodes: ITreeNode[][] = [];
    #nodes: ITreeNode[] = [];

    // #endregion Properties (7)

    // #region Public Getters And Setters (1)

    public get filter(): IInteractionFilterOptions {
        return this.#filter;
    }

    // #endregion Public Getters And Setters (1)

    // #region Public Methods (8)

    public add(viewport: IViewportApi): void {
        this.viewport = viewport;
    }

    /**
     * Deselect a specific node.
     * 
     * @param node 
     */
    public deselect(node: ITreeNode) {
        if (this.#nodes.includes(node))
            this.deactivateNode(node);
    }

    /**
     * Deselect all nodes.
     */
    public deselectAll() {
        for (let i = 0; i < this.#nodes.length; i++)
            this.deactivateNode(this.#nodes[i]);
    }

    public onDown(event: PointerEvent, ray: IRay, intersection: IIntersection[]): void {
        if (!this.viewport) throw new ShapeDiverViewerInteractionError('The interaction manager does not belong to an interaction engine. Please add it to one first.');
        const intersections = intersection.filter(i => this.filter(INTERACTION_STATE.DOWN)(i.node));

        if (this.#nodes.length > 0) {
            let originalNode: ITreeNode | undefined;
            this.#groupedNodes.forEach(array => {
                if (intersections.length > 0 && array.includes(intersections[0].node))
                    originalNode = this.#nodes.find(n => array.includes(n))!;
            });

            if (intersections.length > 0 && !this.#nodes.includes(intersections[0].node) && !originalNode) {
                // case other node was clicked, deselect then select
                this.activateNode(intersections[0], event, ray);
            } else if (intersections.length > 0 && this.#nodes.includes(intersections[0].node)) {
                // case same node was clicked, only deselect
                this.deactivateNode(intersections[0].node, event);
            } else if (originalNode) {
                // case it is one of the grouped nodes
                this.deactivateNode(originalNode!, event);
            }
        } else if (intersections.length > 0) {
            // easy case, no node select, just select this one
            this.activateNode(intersections[0], event, ray);
        }
    }

    public onEnd(event: PointerEvent, ray: IRay, intersection: IIntersection[], endState: INTERACTION_STATE): void {
        if (!this.viewport) throw new ShapeDiverViewerInteractionError('The interaction manager does not belong to an interaction engine. Please add it to one first.');
    }

    public onMove(event: PointerEvent, ray: IRay, intersection: IIntersection[]): void {
        if (!this.viewport) throw new ShapeDiverViewerInteractionError('The interaction manager does not belong to an interaction engine. Please add it to one first.');
    }

    public remove(): void {
        for (let i = 0; i < this.#nodes.length; i++)
            this.deactivateNode(this.#nodes[i]);
        this.viewport = undefined;
    }

    /**
     * Select a node.
     * The point and distance of the intersection can be freely chosen and are provided in the event callbacks.
     * 
     * @param intersection 
     */
    public select(intersection: IIntersection) {
        if (this.#nodes.includes(intersection.node))
            this.deactivateNode(intersection.node);
        this.activateNode(intersection);
    }

    // #endregion Public Methods (8)

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
        if (!this.viewport) throw new ShapeDiverViewerInteractionError('The interaction manager does not belong to an interaction engine. Please add it to one first.');
        this.#nodes.push(intersection.node);

        // find the interaction data
        const data = <InteractionData>intersection.node.data.find(d => d instanceof InteractionData);
        if (data) data.interactionStates.select = true;

        // find and store all nodes that are within the group
        this.#groupedNodes[this.#nodes.length - 1] = [];
        this.#groupEffectMaterialToken[this.#nodes.length - 1] = [];
        if (data.groupId)
            this.#groupedNodes[this.#nodes.length - 1] = this.gatheredGroupedNodes[data.groupId] || [];

        if (this.effectMaterial) {
            this.#effectMaterialTokens.push(this.interactionEffectUtils.applyEffectMaterial(intersection.node, this.effectMaterial));
            if (this.#groupedNodes[this.#nodes.length - 1]) this.#groupedNodes[this.#nodes.length - 1]!.forEach(n => this.#groupEffectMaterialToken[this.#nodes.length - 1]!.push(this.interactionEffectUtils.applyEffectMaterial(n, this.effectMaterial!)));
        } else {
            this.#effectMaterialTokens.push(undefined);
        }

        this.viewport.updateNode(intersection.node);
        if (this.#groupedNodes) this.#groupedNodes[this.#nodes.length - 1]!.forEach(n => this.viewport!.updateNode(n));

        this.viewport.render();

        this.#eventEngine.emitEvent(EVENTTYPE.INTERACTION.SELECT_ON, {
            viewportId: this.viewport.id,
            nodes: this.#nodes,
            node: intersection.node,
            intersectionPoint: intersection.point,
            ray,
            event,
            manager: this,
            groupedNodes: this.#groupedNodes[this.#nodes.length - 1]
        } as IMultiSelectEvent);
    }

    /**
     * Utility function to make the node inactive.
     * Set the according values, remove the effect and emit the event.
     * 
     * @param event
     */
    private deactivateNode(node: ITreeNode, event?: PointerEvent) {
        if (!this.viewport) throw new ShapeDiverViewerInteractionError('The interaction manager does not belong to an interaction engine. Please add it to one first.');

        // find the interaction data
        const data = <InteractionData>node.data.find(d => d instanceof InteractionData);
        if (data) data.interactionStates.select = false;

        const index = this.#nodes.indexOf(node);
        if (index === -1) return;

        const effectMaterialToken = this.#effectMaterialTokens[index];
        this.#effectMaterialTokens.splice(index, 1);
        if (effectMaterialToken) {
            this.interactionEffectUtils.removeEffectMaterial(node, effectMaterialToken);
            if (this.#groupedNodes[index]) this.#groupedNodes[index]!.forEach((n, i) => this.interactionEffectUtils.removeEffectMaterial(n, this.#groupEffectMaterialToken[index]![i]));
        }

        this.viewport.updateNode(node);
        if (this.#groupedNodes[index]) this.#groupedNodes[index]!.forEach(n => this.viewport!.updateNode(n));

        this.viewport.render();

        this.#nodes.splice(index, 1);
        this.#eventEngine.emitEvent(EVENTTYPE.INTERACTION.SELECT_OFF,
            {
                viewportId: this.viewport.id,
                nodes: this.#nodes,
                node: node,
                event,
                manager: this,
                groupedNodes: this.#groupedNodes[index]
            } as IMultiSelectEvent
        );
        this.#groupedNodes.splice(index, 1);
        this.#groupEffectMaterialToken.splice(index, 1);
    }

    // #endregion Private Methods (2)
}