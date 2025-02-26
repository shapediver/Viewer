import { EventEngine, EVENTTYPE } from '@shapediver/viewer.shared.services';
import {
    GeometryData,
    IIntersection,
    IIntersectionFilter,
    IRay
    } from '@shapediver/viewer.shared.types';
import { IIntersectionEngine, IntersectionEngine, RaycasterParameters } from '@shapediver/viewer.rendering-engine.intersection-engine';
import { InteractionData } from './InteractionData';
import { ITree, ITreeNode, Tree } from '@shapediver/viewer.shared.node-tree';

export class IntersectionManager implements IIntersectionEngine {
    // #region Properties (5)

    private readonly _eventEngine: EventEngine = EventEngine.instance;
    private readonly _intersectionEngine: IntersectionEngine = IntersectionEngine.instance;
    private readonly _tree: ITree = Tree.instance;

    private static _instance: IntersectionManager;

    private _intersectNodes: {
        node: ITreeNode,
        geometryData: { [key: string]: GeometryData }
    }[] = [];

    // #endregion Properties (5)

    // #region Constructors (1)

    private constructor() {
        this.gatherNodes();
        this._eventEngine.addListener(EVENTTYPE.VIEWPORT.VIEWPORT_UPDATED, () => {
            this.gatherNodes();
        });
    }

    // #endregion Constructors (1)

    // #region Public Static Getters And Setters (1)

    public static get instance() {
        return this._instance || (this._instance = new this());
    }

    // #endregion Public Static Getters And Setters (1)

    // #region Public Methods (1)

    public intersect(
        ray: IRay,
        viewportId: string,
        filterCriteria: IIntersectionFilter[] = [],
        rayCasterParams?: RaycasterParameters
    ): IIntersection[] {
        let intersections: IIntersection[] = [];

        // intersect all nodes
        this._intersectNodes.forEach(i => {
            const currentIntersection = this._intersectionEngine.intersectNode(ray, i.node, i.geometryData, viewportId, filterCriteria, rayCasterParams);
            if (currentIntersection)
                intersections = intersections.concat(currentIntersection);
        });

        intersections.sort((a, b) => {
            const distanceDiff = a.distance - b.distance;
            if (distanceDiff !== 0) return distanceDiff;

            // if the distance is the same, sort by the closest InteractionData within the sceneTree
            let depthA = 0;
            let depthB = 0;

            const computeDepth = (targetNode: ITreeNode, node: ITreeNode, depth: number = 0): number => {
                if (targetNode === node) return depth;
                if(node.parent) return computeDepth(targetNode, node.parent, depth + 1);
                return -1;
            };

            a.node.traverse(node => {
                if(node.data.includes(a.geometryData))
                    depthA = computeDepth(a.node, node);
            });
            b.node.traverse(node => {
                if(node.data.includes(b.geometryData))
                    depthB = computeDepth(b.node, node);
            });

            return depthA - depthB;
        });

        return intersections;
    }

    // #endregion Public Methods (1)

    // #region Private Methods (1)

    private gatherNodes() {
        this._intersectNodes = [];
        this._tree.root.traverse(node => {
            if (node.visible === false) return;

            for (let i = 0; i < node.data.length; i++) {
                if (node.data[i] instanceof InteractionData) {
                    const geometryData: { [key: string]: GeometryData } = {};
                    node.traverseData(d => {
                        if (d instanceof GeometryData) {
                            geometryData[`${d.id}_${d.version}`] = d;
                        }
                    });
                    this._intersectNodes.push({ node: node, geometryData: geometryData });
                }
            }
        });
    }

    // #endregion Private Methods (1)
}