import { GeometryData, IMaterialAbstractData, MATERIAL_SIDE, PRIMITIVE_MODE } from "@shapediver/viewer.shared.types";
import { mat4, vec3 } from "gl-matrix";
import { Triangle } from "@shapediver/viewer.shared.math";
import { ITree, ITreeNode, Tree, TreeNode } from "@shapediver/viewer.shared.node-tree";
import { EventEngine, EVENTTYPE } from "@shapediver/viewer.shared.services";
import { InteractionData } from "./InteractionData";
import { IIntersection, IIntersectionEngine, IIntersectionFilter, IntersectionEngine, IRay } from "@shapediver/viewer.rendering-engine.intersection-engine";
import { RENDERER_TYPE } from '@shapediver/viewer.rendering-engine.rendering-engine'

export class IntersectionManager implements IIntersectionEngine {
    // #region Properties (2)

    private readonly _tree: ITree = Tree.instance;

    private static _instance: IntersectionManager;
    private readonly _eventEngine: EventEngine = EventEngine.instance;
    private readonly _intersectionEngine: IntersectionEngine = IntersectionEngine.instance;

    private _intersectNodes: ITreeNode[] = [];

    private constructor() {
        this.gatherNodes();
        this._eventEngine.addListener(EVENTTYPE.VIEWPORT.VIEWPORT_UPDATED, () => {
            this.gatherNodes();
        })
    }

    private gatherNodes() {
        this._intersectNodes = [];
        this._tree.root.traverse(node => {
            if (node.visible === false) return;

            for(let i = 0; i < node.data.length; i++) {
                if(node.data[i] instanceof InteractionData)
                    this._intersectNodes.push(node)
            }
        })
    }

    // #endregion Properties (2)

    // #region Public Static Accessors (1)

    public static get instance() {
        return this._instance || (this._instance = new this());
    }

    // #endregion Public Static Accessors (1)

    // #region Public Methods (1)


    public intersect(
        ray: IRay,
        filterCriteria: IIntersectionFilter[] = [],
        intersectionOptions: { opacity: number, rendererType: RENDERER_TYPE } = { opacity: 0, rendererType: RENDERER_TYPE.STANDARD },
        root: ITreeNode = this._tree.root,
        viewerID?: string
    ): IIntersection[] {
        let intersections: IIntersection[] = [];

        const intersectNode = (node: ITreeNode) => {
            if (node.visible === false) return;

            if (viewerID !== undefined) {
                if (node.excludeViewports.includes(viewerID)) return;
                if (node.restrictViewports.length > 0 && !node.restrictViewports.includes(viewerID)) return;
            }

            for (let i = 0; i < filterCriteria.length; i++) {
                if (filterCriteria[i](node)) {
                    const intersection = this._intersectionEngine.intersectNode(node, ray, intersectionOptions)
                    if (intersection) {
                        intersection.forEach(i => i.node = node);
                        intersections = intersections.concat(intersection);
                    }
                    break;
                }
            }
        }
        for (let i = 0; i < this._intersectNodes.length; i++)
            intersectNode(this._intersectNodes[i])

        intersections.sort((a, b) => a.distance - b.distance);
        return intersections;
    }

    // #endregion Public Methods (1)
}