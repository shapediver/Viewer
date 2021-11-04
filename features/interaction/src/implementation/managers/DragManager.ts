import { IRay, IIntersection, IIntersectionFilter } from "@shapediver/viewer.rendering-engine.intersection-engine";
import { TreeNode } from "@shapediver/viewer.shared.node-tree";
import { MaterialData, MATERIAL_ALPHA, MATERIAL_SIDE } from "@shapediver/viewer.shared.types";
import { IDragConstraint } from "../../interfaces/IDragConstraint";
import { INTERACTION_STATE } from "../../interfaces/IInteractionEngine";
import { IInteractionFilterOptions } from "../../interfaces/IInteractionManager";
import { AbstractInteractionManager } from "../AbstractInteractionManager";
import { InteractionData } from "../InteractionData";

export class DragManager extends AbstractInteractionManager {
    // #region Properties (5)

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
    #effectMaterialToken!: string;
    #effectMaterial: MaterialData = new MaterialData({color: "#0000ff"});

    #tokenCameraFreeze!: string;
    #tokenContinuousRendering!: string;
    #tokenContinuousShadowMapUpdate!: string;

    // #endregion Properties (5)

    // #region Public Accessors (1)

    public get filter(): IInteractionFilterOptions {
        return this.#filter;
    }
    
    public addDragConstraint(constraint: IDragConstraint): string {
        return this.dragConstraints.addDragConstraint(constraint);
    }

    public removeDragConstraint(token: string): boolean {
        return this.dragConstraints.removeDragConstraint(token);
    }

    // #endregion Public Accessors (1)

    // #region Public Methods (3)

    public onDown(ray: IRay, intersection: IIntersection[]): void {
        const intersections = intersection.filter( i => this.filter(INTERACTION_STATE.DOWN)(i.node))
        if(intersections.length > 0) {
            this.activateNode(intersections[0]);

            if(this.#node!.transformations.find(t => t.id === 'SD_drag_matrix'))
                this.#node!.transformations.splice(this.#node!.transformations.indexOf(this.#node!.transformations.find(t => t.id === 'SD_drag_matrix')!), 1);

            const transformationMatrix = this.dragConstraints.setup(this.viewer, this.#node!, ray, this.#intersection!);
            this.#node!.transformations.push({ id: 'SD_drag_matrix', matrix: transformationMatrix })
            this.#tokenCameraFreeze = this.viewer.addCameraFreezeFlag();
            this.#tokenContinuousRendering = this.viewer.addContinuousRenderingFlag();
            this.#tokenContinuousShadowMapUpdate = this.viewer.addShadowMapUpdateFlag();
        }
    }

    public onEnd(ray: IRay, intersection: IIntersection[]): void {
        if(!this.#node) return;

        // optional to reset
        // this.#node.transformations.splice(this.#node.transformations.indexOf(this.#node.transformations.find(t => t.id === 'SD_drag_matrix')!), 1);
        
        this.viewer.updateNode(this.#node!);
        this.deactivateNode();
        
        this.viewer.removeCameraFreezeFlag(this.#tokenCameraFreeze);
        this.viewer.removeContinuousRenderingFlag(this.#tokenContinuousRendering);
        this.viewer.removeShadowMapUpdateFlag(this.#tokenContinuousShadowMapUpdate);
    }

    public onMove(ray: IRay, intersection: IIntersection[]): void {        
        if(!this.#node) return;
        const transformationMatrix = this.dragConstraints.intersect(this.viewer, this.#node!, ray);
        this.#node.transformations.find(t => t.id === 'SD_drag_matrix')!.matrix = transformationMatrix;
        this.viewer.updateNode(this.#node!);
    }

    // #endregion Public Methods (3)

    // #region Private Methods (2)

    private deactivateNode() {
        this.effects.removeEffectMaterial(this.#node!, this.#effectMaterialToken);
        this.viewer.updateNode(this.#node!);
        this.viewer.render();
        const data = <InteractionData>this.#node!.data.find(d => d instanceof InteractionData);
        if(data) data.interactionStates['drag'] = false;
        this.#intersection = null;
        this.#node = null;
    }

    private activateNode(intersection: IIntersection) {
        this.#intersection = intersection;
        this.#node = this.#intersection.node;
        const data = <InteractionData>this.#node!.data.find(d => d instanceof InteractionData);
        if(data) data.interactionStates['drag'] = true;
        this.#effectMaterialToken = this.effects.applyEffectMaterial(this.#node, this.#effectMaterial)
        this.viewer.updateNode(this.#node);
        this.viewer.render();
    }

    // #endregion Private Methods (2)
}