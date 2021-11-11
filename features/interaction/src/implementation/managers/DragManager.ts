import { IRay, IIntersection, IIntersectionFilter } from "@shapediver/viewer.rendering-engine.intersection-engine";
import { TreeNode } from "@shapediver/viewer.shared.node-tree";
import { MaterialData, MATERIAL_ALPHA, MATERIAL_SIDE } from "@shapediver/viewer.shared.types";
import { mat4, vec3 } from "gl-matrix";
import { EventEngine, EVENTTYPE, UuidGenerator } from "@shapediver/viewer.shared.services";
import { IDragConstraint } from "../../interfaces/utils/IDragConstraint";
import { INTERACTION_STATE } from "../../interfaces/IInteractionEngine";
import { IInteractionFilterOptions } from "../../interfaces/IInteractionManager";
import { AbstractInteractionManager } from "../AbstractInteractionManager";
import { InteractionData } from "../InteractionData";
import { container } from "tsyringe";
import { IDragEvent } from "../../interfaces/events/IDragEvent";
import { IViewer } from "@shapediver/viewer";

export class DragManager extends AbstractInteractionManager {
    // #region Properties (11)

    readonly #eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);
    readonly #uuidGenerator: UuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);

    #dragConstraints: { [key: string]: IDragConstraint } = {};
    #effectMaterialToken!: string;
    #filter: IInteractionFilterOptions = (interactionState: INTERACTION_STATE): IIntersectionFilter => {
        if(interactionState === INTERACTION_STATE.DOWN) {
            return (node: TreeNode) => {
                for(let i = 0; i < node.data.length; i++) {
                    if(node.data[i] instanceof InteractionData) {
                        if((<InteractionData>node.data[i]).interactionTypes['drag'])
                            return true;
                    }
                }
                return false;
            };
        }

        return (node: TreeNode) => false;
    };

    #intersection: IIntersection | null = null;
    #node: TreeNode | null = null;
    #setupOptions: {
        viewer: IViewer, 
        node: TreeNode, 
        ray: IRay, 
        intersection: IIntersection
    } | null = null;
    #tokenCameraFreeze!: string;
    #tokenContinuousRendering!: string;
    #tokenContinuousShadowMapUpdate!: string;

    // #endregion Properties (11)

    // #region Public Accessors (1)

    public get filter(): IInteractionFilterOptions {
        return this.#filter;
    }

    // #endregion Public Accessors (1)

    // #region Public Methods (7)

    public addDragConstraint(constraint: IDragConstraint): string {
        const token = this.#uuidGenerator.create();
        this.#dragConstraints[token] = constraint;
        if(this.#setupOptions) constraint.setup(this.#setupOptions.viewer, this.#setupOptions.node, this.#setupOptions.ray, this.#setupOptions.intersection);
        return token;
    }

    public onDown(ray: IRay, intersection: IIntersection[]): void {
        const intersections = intersection.filter( i => this.filter(INTERACTION_STATE.DOWN)(i.node))
        if(intersections.length > 0) 
            this.setNode(intersections[0].node, intersections[0].distance, intersections[0].point, ray);
    }

    public onEnd(ray: IRay, intersection: IIntersection[]): void {
       this.removeNode();
    }

    public onMove(ray: IRay, intersection: IIntersection[]): void {        
        if(!this.#node) return;

        const transformationMatrix = this.dragConstraintUtils.intersect(this.#dragConstraints, this.viewer, this.#node!, ray);
        this.applyTransformation(this.#node, transformationMatrix);
        this.viewer.updateNode(this.#node!);

        this.#eventEngine.emitEvent(EVENTTYPE.INTERACTION.DRAG_MOVE, { node: this.#node, matrix: transformationMatrix } as IDragEvent);
    }

    public removeDragConstraint(token: string): boolean {
        if(!this.#dragConstraints[token]) return false;
        delete this.#dragConstraints[token];
        return true;
    }

    /**
     * Remove the node as the currently used drag node.
     * 
     * @returns 
     */
    public removeNode() {
        if(!this.#node) return;

        const transformationMatrix = this.#node.transformations.find(t => t.id === 'SD_drag_matrix')?.matrix;
        this.#eventEngine.emitEvent(EVENTTYPE.INTERACTION.DRAG_END, { node: this.#node, matrix: transformationMatrix } as IDragEvent);
        this.#setupOptions = null;

        // optional removal
        // this.removeTransformation(this.#node!);
        this.viewer.updateNode(this.#node!);
        this.deactivateNode();
        
        this.viewer.removeCameraFreezeFlag(this.#tokenCameraFreeze);
        this.viewer.removeContinuousRenderingFlag(this.#tokenContinuousRendering);
        this.viewer.removeShadowMapUpdateFlag(this.#tokenContinuousShadowMapUpdate);
    }

    /**
     * Set the current dragged node.
     * This will serve as the start of the drag event.
     * This function is also called internally at onDown events.
     * 
     * @param node 
     * @param distance 
     * @param intersectionPoint 
     * @param ray 
     */
    public setNode(node: TreeNode, distance: number = 0, intersectionPoint: vec3 = vec3.create(), ray: IRay = {origin: vec3.create(), direction: vec3.create()}) {
        this.activateNode({node, distance, point: intersectionPoint});
        this.#setupOptions = { viewer: this.viewer, node: this.#node!, ray, intersection: this.#intersection! };
        const transformationMatrix = this.dragConstraintUtils.setup(this.#dragConstraints, this.viewer, this.#node!, ray, this.#intersection!);
        this.applyTransformation(this.#node!, transformationMatrix);
        this.#tokenCameraFreeze = this.viewer.addCameraFreezeFlag();
        this.#tokenContinuousRendering = this.viewer.addContinuousRenderingFlag();
        this.#tokenContinuousShadowMapUpdate = this.viewer.addShadowMapUpdateFlag();
        this.#eventEngine.emitEvent(EVENTTYPE.INTERACTION.DRAG_START, { node: this.#node, matrix: transformationMatrix } as IDragEvent);
    }

    // #endregion Public Methods (7)

    // #region Private Methods (4)

    /**
     * Utility function to make the node the current active node.
     * Set the according values, apply the effect and emit the event.
     * 
     * @param intersection 
     */
    private activateNode(intersection: IIntersection) {
        this.#intersection = intersection;
        this.#node = this.#intersection.node;
        const data = <InteractionData>this.#node!.data.find(d => d instanceof InteractionData);
        if(data) data.interactionStates['drag'] = true;
        this.#effectMaterialToken = this.interactionEffectUtils.applyEffectMaterial(this.#node, this.effectMaterial)
        this.viewer.updateNode(this.#node);
        this.viewer.render();
    }

    /**
     * Utility function to apply the transformation to the current node.
     * 
     * @param node 
     * @param matrix 
     */
    private applyTransformation(node: TreeNode, matrix: mat4) {
        const index = node.transformations.findIndex(t => t.id === 'SD_drag_matrix');
        if(index !== -1) { 
            node.transformations[index].matrix = matrix;
        } else {
            node.transformations.push({ id: 'SD_drag_matrix', matrix })
        }
    }

    /**
     * Utility function to make the node inactive.
     * Set the according values, remove the effect and emit the event.
     * 
     * @param intersection 
     */
    private deactivateNode() {
        this.interactionEffectUtils.removeEffectMaterial(this.#node!, this.#effectMaterialToken);
        this.viewer.updateNode(this.#node!);
        this.viewer.render();
        const data = <InteractionData>this.#node!.data.find(d => d instanceof InteractionData);
        if(data) data.interactionStates['drag'] = false;
        this.#intersection = null;
        this.#node = null;
    }

    private removeTransformation(node: TreeNode) {
        const index = node.transformations.findIndex(t => t.id === 'SD_drag_matrix');
        if(index !== -1) node.transformations.splice(index, 1);
    }

    // #endregion Private Methods (4)
}