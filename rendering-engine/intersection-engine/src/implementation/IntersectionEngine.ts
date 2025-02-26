import * as THREE from 'three';
import { EventEngine, EVENTTYPE } from '@shapediver/viewer.shared.services';
import { GeometryData } from '@shapediver/viewer.shared.types';
import { IIntersection, IIntersectionFilter, IRay } from '@shapediver/viewer.shared.types';
import { IIntersectionEngine } from '../interfaces/IIntersectionEngine';
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
        filterCriteria?: IIntersectionFilter[],
        rayCasterParams?: THREE.RaycasterParameters
    ): IIntersection[] {
        let intersections: IIntersection[] = [];
        this._intersectNodes.forEach(i => {
            const currentIntersections = this.intersectNode(ray, i.node, i.geometryData, viewportId, filterCriteria, rayCasterParams);
            if (currentIntersections)
                intersections = intersections.concat(currentIntersections);
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

    public intersectNode(
        ray: IRay,
        node: ITreeNode,
        geometryData: { [key: string]: GeometryData },
        viewportId: string,
        filterCriteria?: IIntersectionFilter[],
        rayCasterParams?: THREE.RaycasterParameters
    ): IIntersection[] | undefined {
        if (node.visible === false) return;

        if (viewportId !== undefined) {
            if (node.excludeViewports.includes(viewportId)) return;
            if (node.restrictViewports.length > 0 && !node.restrictViewports.includes(viewportId)) return;
        }

        if (filterCriteria) {
            for (let i = 0; i < filterCriteria.length; i++) {
                // if the filter criteria returns false, skip the intersection test
                // the filter criteria per geometryData is then evaluated in the intersectionTest method
                if (filterCriteria[i](node))
                    return this.intersectionTest(ray, node, geometryData, viewportId, rayCasterParams, filterCriteria);
            }
        } else {
            return this.intersectionTest(ray, node, geometryData, viewportId, rayCasterParams);
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
        viewportId: string,
        rayCasterParams?: THREE.RaycasterParameters,
        filterCriteria?: IIntersectionFilter[]
    ): IIntersection[] | undefined {
        if (rayCasterParams) this._raycaster.params = rayCasterParams;

        this._raycaster.ray.direction.set(ray.direction[0], ray.direction[1], ray.direction[2]);
        this._raycaster.ray.origin.set(ray.origin[0], ray.origin[1], ray.origin[2]);


        const threeJsObject = node.convertedObject[viewportId!] as THREE.Object3D;
        if (threeJsObject) {
            const intersectionThree = this._raycaster.intersectObject(threeJsObject);
            if(intersectionThree.length === 0) return;

            let intersections = intersectionThree.map(i => {
                const intersectionDefinition: IIntersection = {
                    distance: i.distance,
                    point: [i.point.x, i.point.y, i.point.z],
                    node: node,
                    geometryData: geometryData[`${(i.object.parent as any).SDid}_${(i.object.parent as any).SDversion}`]
                };
                return intersectionDefinition;
            });

            if (filterCriteria) {
                intersections = intersections.filter(i => {
                    for (let j = 0; j < filterCriteria.length; j++)
                        if (filterCriteria[j](i.node, i.geometryData)) return true;
                    return false;
                });
            }
            intersections.sort((a, b) => a.distance - b.distance);
            return intersections;
        }
    }

    // #endregion Private Methods (2)
}