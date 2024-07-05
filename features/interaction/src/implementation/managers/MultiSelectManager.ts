import { AbstractInteractionManager } from '../AbstractInteractionManager';
import { EventEngine, EVENTTYPE, EVENTTYPE_INTERACTION, ShapeDiverViewerInteractionError } from '@shapediver/viewer.shared.services';
import { IInteractionFilterOptions } from '../../interfaces/IInteractionManager';
import { IIntersection, IIntersectionFilter, IRay } from '@shapediver/viewer.rendering-engine.intersection-engine';
import { IMultiSelectEvent } from '../../interfaces/events/IMultiSelectEvent';
import { INTERACTION_STATE } from '../../interfaces/IInteractionEngine';
import { InteractionData } from '../InteractionData';
import { ITreeNode, Tree } from '@shapediver/viewer.shared.node-tree';
import { IViewportApi } from '@shapediver/viewer';

export class MultiSelectManager extends AbstractInteractionManager {
    // #region Properties (9)

    readonly #eventEngine: EventEngine = EventEngine.instance;
    readonly #tree: Tree = Tree.instance;

    #effectMaterialTokens: { [key: string]: string } = {};
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
    #groupEffectMaterialToken: { [key: string]: string[] } = {};
    #groupedNodes: { [key: string]: ITreeNode[] } = {};
    #maximumNodes: number = Infinity;
    #minimumNodes: number = 0;
    #nodes: { [key: string]: ITreeNode } = {};

    // #endregion Properties (9)

    // #region Public Getters And Setters (5)

    public get filter(): IInteractionFilterOptions {
        return this.#filter;
    }

    public get maximumNodes(): number {
        return this.#maximumNodes;
    }

    public set maximumNodes(value: number) {
        this.#maximumNodes = value;
    }

    public get minimumNodes(): number {
        return this.#minimumNodes;
    }

    public set minimumNodes(value: number) {
        this.#minimumNodes = value;
    }

    // #endregion Public Getters And Setters (5)

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
        if (this.#nodes[this.createNodeKey(node)])
            this.deactivateNode(node);
    }

    /**
     * Deselect all nodes.
     */
    public deselectAll() {
        for (const id in this.#nodes)
            this.deactivateNode(this.#nodes[id]);
    }

    public onDown(event: PointerEvent, ray: IRay, intersection: IIntersection[]): void {
        if (!this.viewport) throw new ShapeDiverViewerInteractionError('The interaction manager does not belong to an interaction engine. Please add it to one first.');
        const intersections = intersection.filter(i => this.filter(INTERACTION_STATE.DOWN)(i.node));

        if (Object.keys(this.#nodes).length > 0) {
            let originalNode: ITreeNode | undefined;

            for (const id in this.#groupedNodes) {
                const array = this.#groupedNodes[id];
                if (intersections.length > 0 && array.includes(intersections[0].node))
                    originalNode = Object.values(this.#nodes).find(n => array.includes(n));
            }

            if (intersections.length > 0 && !this.#nodes[this.createNodeKey(intersections[0].node)] && !originalNode) {
                // case other node was clicked, deselect then select
                this.activateNode(intersections[0], event, ray);
            } else if (intersections.length > 0 && this.#nodes[this.createNodeKey(intersections[0].node)]) {
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
        for (const id in this.#nodes)
            this.deactivateNode(this.#nodes[id]);
        this.viewport = undefined;
    }

    /**
     * Select a node.
     * The point and distance of the intersection can be freely chosen and are provided in the event callbacks.
     * 
     * @param intersection 
     */
    public select(intersection: IIntersection) {
        if (this.#nodes[this.createNodeKey(intersection.node)])
            this.deactivateNode(intersection.node);
        this.activateNode(intersection);
    }

    // #endregion Public Methods (8)

    // #region Private Methods (3)

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

        const nodeKey = this.createNodeKey(intersection.node);
        const data = <InteractionData>intersection.node.data.find(d => d instanceof InteractionData);
        const groupId = data?.groupId;

        if (Object.keys(this.#nodes).length >= this.#maximumNodes) {
            this.#eventEngine.emitEvent(EVENTTYPE.INTERACTION.MULTI_SELECT_MAXIMUM_NODES, {
                viewportId: this.viewport.id,
                node: intersection.node,
                nodes: Object.values(this.#nodes),
                intersectionPoint: intersection.point,
                ray,
                event,
                manager: this,
                groupedNodes: groupId && this.#groupedNodes[groupId] ? this.#groupedNodes[groupId] : undefined
            } as IMultiSelectEvent);
            throw new ShapeDiverViewerInteractionError(`The maximum number of nodes ${this.maximumNodes} has been reached.`);
        }

        this.#nodes[nodeKey] = intersection.node;

        // find the interaction data
        if (data) data.interactionStates.select = true;

        // find and store all nodes that are within the group
        if (groupId) {
            this.#groupedNodes[groupId] = [];
            this.#groupEffectMaterialToken[groupId] = [];
            this.#groupedNodes[groupId] = this.gatheredGroupedNodes[groupId] || [];
        }

        if (this.effectMaterial) {
            this.#effectMaterialTokens[nodeKey] = this.interactionEffectUtils.applyEffectMaterial(intersection.node, this.effectMaterial);
            if (groupId && this.#groupedNodes[groupId]) this.#groupedNodes[groupId]!.forEach(n => this.#groupEffectMaterialToken[groupId]!.push(this.interactionEffectUtils.applyEffectMaterial(n, this.effectMaterial!)));
        }

        this.viewport.updateNode(intersection.node);
        if (groupId && this.#groupedNodes[groupId]) this.#groupedNodes[groupId]!.forEach(n => this.viewport!.updateNode(n));

        this.viewport.render();

        this.#eventEngine.emitEvent(EVENTTYPE.INTERACTION.MULTI_SELECT_ON, {
            viewportId: this.viewport.id,
            nodes: Object.values(this.#nodes),
            node: intersection.node,
            intersectionPoint: intersection.point,
            ray,
            event,
            manager: this,
            groupedNodes: groupId && this.#groupedNodes[groupId] ? this.#groupedNodes[groupId] : undefined
        } as IMultiSelectEvent);

        if (Object.keys(this.#nodes).length < this.#minimumNodes) {
            this.#eventEngine.emitEvent(EVENTTYPE.INTERACTION.MULTI_SELECT_MINIMUM_NODES, {
                viewportId: this.viewport.id,
                node: intersection.node,
                nodes: Object.values(this.#nodes),
                intersectionPoint: intersection.point,
                ray,
                event,
                manager: this,
                groupedNodes: groupId && this.#groupedNodes[groupId] ? this.#groupedNodes[groupId] : undefined
            } as IMultiSelectEvent);
        }
    }

    private createNodeKey(node: ITreeNode): string {
        return node.id + '_' + node.version;
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

        const groupId = data?.groupId;

        const nodeKey = this.createNodeKey(node);
        if (!this.#nodes[nodeKey]) return;

        const effectMaterialToken = this.#effectMaterialTokens[nodeKey];
        delete this.#effectMaterialTokens[nodeKey];
        if (effectMaterialToken) {
            this.interactionEffectUtils.removeEffectMaterial(node, effectMaterialToken);
            if (groupId && this.#groupedNodes[groupId]) this.#groupedNodes[groupId]!.forEach((n, i) => this.interactionEffectUtils.removeEffectMaterial(n, this.#groupEffectMaterialToken[groupId]![i]));
        }

        this.viewport.updateNode(node);
        if (groupId && this.#groupedNodes[groupId]) this.#groupedNodes[groupId]!.forEach(n => this.viewport!.updateNode(n));

        this.viewport.render();

        delete this.#nodes[nodeKey];
        this.#eventEngine.emitEvent(EVENTTYPE.INTERACTION.MULTI_SELECT_OFF,
            {
                viewportId: this.viewport.id,
                nodes: Object.values(this.#nodes),
                node: node,
                event,
                manager: this,
                groupedNodes: groupId && this.#groupedNodes[groupId] ? this.#groupedNodes[groupId] : undefined
            } as IMultiSelectEvent
        );

        if (groupId) {
            delete this.#groupedNodes[groupId];
            delete this.#groupEffectMaterialToken[groupId];
        }

        if (Object.values(this.#nodes).length < this.#minimumNodes) {
            this.#eventEngine.emitEvent(EVENTTYPE.INTERACTION.MULTI_SELECT_MINIMUM_NODES, {
                viewportId: this.viewport.id,
                node: node,
                nodes: Object.values(this.#nodes),
                event,
                manager: this,
                groupedNodes: groupId && this.#groupedNodes[groupId] ? this.#groupedNodes[groupId] : undefined
            } as IMultiSelectEvent);
        }
    }

    // #endregion Private Methods (3)
}