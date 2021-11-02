import { IRay, IIntersection, IIntersectionFilter } from "@shapediver/viewer.rendering-engine.intersection-engine";
import { TreeNode } from "@shapediver/viewer.shared.node-tree";
import { InteractionData, MaterialData } from "@shapediver/viewer.shared.types";
import { IViewer } from "../../../../api/api/dist";
import { INTERACTION_STATE } from "../interfaces/IInteractionEngine";
import { IInteractionFilterOptions } from "../interfaces/IInteractionManager";
import { AbstractInteractionManager } from "./AbstractInteractionManager";

export class SelectManager extends AbstractInteractionManager {
    // #region Properties (5)

    #filter: IInteractionFilterOptions = (interactionState: INTERACTION_STATE): IIntersectionFilter => {
        if(interactionState === INTERACTION_STATE.DOWN) {
            return (node: TreeNode) => {
                for(let i = 0; i < node.data.length; i++) {
                    if(node.data[i] instanceof InteractionData) {
                        if((<InteractionData>node.data[i]).interactionTypes['select'])
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
    #effectMaterial: MaterialData = new MaterialData({color: "#ff0000"});

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

        if(this.#node) {
            if(intersections.length > 0 && intersection[0].node !== this.#node) {
                // case other node was clicked, deselect then select
                this.deselectNode();
                this.selectNode(intersections[0]);
            } else {
                // case same node was clicked, only deselect
                this.deselectNode();
            }
        } else if(intersections.length > 0) {
            // easy case, no node select, just select this one
            this.selectNode(intersections[0]);
        }
    }

    public onEnd(ray: IRay, intersection: IIntersection[]): void {}

    public onMove(ray: IRay, intersection: IIntersection[]): void {}

    // #endregion Public Methods (3)

    // #region Private Methods (2)

    private deselectNode() {
        this._effects.removeEffect(this.#node!, this.#effectMaterial)
        this._viewer.updateNode(this.#node!);
        this._viewer.render();
        this.#intersection = null;
        this.#node = null;
    }

    private selectNode(intersection: IIntersection) {
        this.#intersection = intersection;
        this.#node = this.#intersection.node;
        this._effects.applyEffect(this.#node, this.#effectMaterial)
        this._viewer.updateNode(this.#node);
        this._viewer.render();
    }

    // #endregion Private Methods (2)
}