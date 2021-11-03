import { IRay, IIntersection, IIntersectionFilter } from "@shapediver/viewer.rendering-engine.intersection-engine";
import { TreeNode } from "@shapediver/viewer.shared.node-tree";
import { InteractionData, MaterialData } from "@shapediver/viewer.shared.types";
import { IViewer } from "../../../../api/api/dist";
import { INTERACTION_STATE } from "../interfaces/IInteractionEngine";
import { IInteractionFilterOptions } from "../interfaces/IInteractionManager";
import { AbstractInteractionManager } from "./AbstractInteractionManager";

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
    #effectMaterial: MaterialData = new MaterialData({color: "#0000ff"});

    #tokenCameraFreeze!: string;
    #tokenContinuousRendering!: string;
    #tokenContinuousShadowMapUpdate!: string;

    // #endregion Properties (5)

    // #region Constructors (1)

    constructor(viewer: IViewer) {
        super(viewer);
    }

    // #endregion Constructors (1)

    // #region Public Accessors (1)

    public get filter(): IInteractionFilterOptions {
        return this.#filter;
    }

    // #endregion Public Accessors (1)

    // #region Public Methods (3)

    public onDown(ray: IRay, intersection: IIntersection[]): void {
        const intersections = intersection.filter( i => this.filter(INTERACTION_STATE.DOWN)(i.node))
        if(intersections.length > 0) {
            this.dragNode(intersections[0]);

            const transformationMatrix = this._dragConstraints.setup(this._viewer, this.#node!, ray, this.#intersection!);
            this.#node!.transformations.push({ id: 'SD_drag_matrix', matrix: transformationMatrix })
            this.#tokenCameraFreeze = this._viewer.addCameraFreezeFlag();
            this.#tokenContinuousRendering = this._viewer.addContinuousRenderingFlag();
            this.#tokenContinuousShadowMapUpdate = this._viewer.addShadowMapUpdateFlag();
        }
    }

    public onEnd(ray: IRay, intersection: IIntersection[]): void {
        if(!this.#node) return;
        this.#node.transformations.splice(this.#node.transformations.indexOf(this.#node.transformations.find(t => t.id === 'SD_drag_matrix')!), 1);
        this._viewer.updateNode(this.#node!);
        this.undragNode();
        
        setTimeout(() => {
            this._viewer.removeCameraFreezeFlag(this.#tokenCameraFreeze);
            this._viewer.removeContinuousRenderingFlag(this.#tokenContinuousRendering);
            this._viewer.removeShadowMapUpdateFlag(this.#tokenContinuousShadowMapUpdate);
        }, 0)
    }

    public onMove(ray: IRay, intersection: IIntersection[]): void {        
        if(!this.#node) return;
        const transformationMatrix = this._dragConstraints.intersect(this._viewer, this.#node!, ray);
        this.#node.transformations.find(t => t.id === 'SD_drag_matrix')!.matrix = transformationMatrix;
        this._viewer.updateNode(this.#node!);
    }

    // #endregion Public Methods (3)

    // #region Private Methods (2)

    private undragNode() {
        this._effects.removeEffect(this.#node!, this.#effectMaterial)
        this._viewer.updateNode(this.#node!);
        this._viewer.render();
        this.#intersection = null;
        this.#node = null;
    }

    private dragNode(intersection: IIntersection) {
        this.#intersection = intersection;
        this.#node = this.#intersection.node;
        this._effects.applyEffect(this.#node, this.#effectMaterial)
        this._viewer.updateNode(this.#node);
        this._viewer.render();
    }

    // #endregion Private Methods (2)
}