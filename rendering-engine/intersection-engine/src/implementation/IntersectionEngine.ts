import * as THREE from 'three';
import { EventEngine, EVENTTYPE } from '@shapediver/viewer.shared.services';
import { GeometryData } from '@shapediver/viewer.shared.types';
import { IIntersection } from '../interfaces/IIntersection';
import { IIntersectionEngine } from '../interfaces/IIntersectionEngine';
import { IIntersectionFilter } from '../interfaces/IIntersectionFilter';
import { IRay } from '../interfaces/IRay';
import { ITree, ITreeNode, Tree } from '@shapediver/viewer.shared.node-tree';

export class IntersectionEngine implements IIntersectionEngine {
    // #region Properties (5)

    private readonly _eventEngine: EventEngine = EventEngine.instance;
    private readonly _raycaster: THREE.Raycaster = new THREE.Raycaster();
    private readonly _tree: ITree = Tree.instance;

    private static _instance: IntersectionEngine;

    private _intersectNodes: {
        node: ITreeNode,
        geometryData: { [key: string]: GeometryData },
        visible: boolean,
        excludeViewports: string[],
        restrictViewports: string[],
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

    // #region Public Methods (2)

    public intersect(
        ray: IRay,
        viewportId: string,
        filterCriteria?: IIntersectionFilter[]
    ): IIntersection[] {
        let intersections: IIntersection[] = [];
        this._intersectNodes.forEach(i => {
            const currentIntersections = this.intersectNode(ray, i.node, i.geometryData, viewportId, filterCriteria);
            if (currentIntersections)
                intersections = intersections.concat(currentIntersections);
        });
        intersections.sort((a, b) => a.distance - b.distance);
        return intersections;
    }

    public intersectNode(
        ray: IRay,
        node: ITreeNode,
        geometryData: { [key: string]: GeometryData },
        viewportId: string,
        filterCriteria?: IIntersectionFilter[]
    ): IIntersection[] | undefined {
        if (node.visible === false) return;

        if (viewportId !== undefined) {
            if (node.excludeViewports.includes(viewportId)) return;
            if (node.restrictViewports.length > 0 && !node.restrictViewports.includes(viewportId)) return;
        }

        if (filterCriteria) {
            for (let i = 0; i < filterCriteria.length; i++) {
                if (filterCriteria[i](node))
                    return this.intersectionTest(ray, node, geometryData, viewportId);
            }
        } else {
            return this.intersectionTest(ray, node, geometryData, viewportId);
        }
    }

    // #endregion Public Methods (2)

    // #region Private Methods (2)

    /**
     * Gather all nodes that contain geometry data.
     */
    private gatherNodes() {
        this._intersectNodes = [];
        this._tree.root.traverse(node => {
            if (node.visible === false) return;

            for (let i = 0; i < node.data.length; i++) {
                if (node.data[i] instanceof GeometryData) {
                    const geometryData: GeometryData = node.data[i] as GeometryData;
                    let tempNode = node;
                    let visible = true, restrictViewports: string[] = [], excludeViewports: string[] = [];
                    while (tempNode.parent) {
                        visible = tempNode.visible && visible;
                        restrictViewports = restrictViewports.concat(tempNode.restrictViewports);
                        excludeViewports = excludeViewports.concat(tempNode.excludeViewports);
                        tempNode = tempNode.parent;
                    }

                    this._intersectNodes.push({
                        node,
                        geometryData: { [`${geometryData.id}_${geometryData.version}`]: geometryData },
                        visible,
                        restrictViewports: [...new Set(restrictViewports)],
                        excludeViewports: [...new Set(excludeViewports)]
                    });
                }
            }
        });
    }

    /**
     * Do the intersection test with the ray and the node.
     * 
     * @param ray the ray to test
     * @param node the node to test
     * @param geometryData the geometry data of the node
     * @param viewportId the viewport id
     * @returns 
     */
    private intersectionTest(
        ray: IRay,
        node: ITreeNode,
        geometryData: { [key: string]: GeometryData },
        viewportId: string
    ): IIntersection[] | undefined {
        this._raycaster.ray.direction.set(ray.direction[0], ray.direction[1], ray.direction[2]);
        this._raycaster.ray.origin.set(ray.origin[0], ray.origin[1], ray.origin[2]);

        let intersections: IIntersection[] = [];

        const threeJsObject = node.convertedObject[viewportId!] as THREE.Object3D;
        if (threeJsObject) {
            const intersectionThree = this._raycaster.intersectObject(threeJsObject);
            const intersection = intersectionThree.map(i => {
                const intersection: IIntersection = {
                    distance: i.distance,
                    point: [i.point.x, i.point.y, i.point.z],
                    node: node,
                    geometryData: geometryData[`${(i.object.parent as any).SDid}_${(i.object.parent as any).SDversion}`]
                };
                return intersection;
            });
            intersections = intersections.concat(intersection);
        }

        intersections.sort((a, b) => a.distance - b.distance);
        return intersections;
    }

    // #endregion Private Methods (2)
}