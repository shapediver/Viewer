import { GeometryData, IMaterialAbstractData, MATERIAL_SIDE, PRIMITIVE_MODE } from "@shapediver/viewer.shared.types";
import { mat4, vec3 } from "gl-matrix";
import { Triangle } from "@shapediver/viewer.shared.math";
import { ITree, ITreeNode, Tree, TreeNode } from "@shapediver/viewer.shared.node-tree";
import { EventEngine, EVENTTYPE, EVENTTYPE_SCENE, HttpClient, InputValidator, Logger, SettingsEngine, ShapeDiverBackendError, ShapeDiverViewerError, ShapeDiverViewerSessionError, StateEngine, StatePromise, UuidGenerator } from "@shapediver/viewer.shared.services";
import { InteractionData } from "./InteractionData";
import { IIntersection, IIntersectionEngine, IIntersectionFilter, IRay } from "@shapediver/viewer.rendering-engine.intersection-engine";
import { RENDERER_TYPE } from '@shapediver/viewer.rendering-engine.rendering-engine'

export class IntersectionManager implements IIntersectionEngine {
    // #region Properties (2)

    private readonly _tree: ITree = Tree.instance;

    private static _instance: IntersectionManager;
    private readonly _eventEngine: EventEngine = EventEngine.instance;

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
        console.log("collected Nodes: ", this._intersectNodes.length)
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
                    const intersection = this.intersectNode(node, ray, intersectionOptions)
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

    // #region Private Methods (4)

    private checkIntersection(node: ITreeNode, material: IMaterialAbstractData | null, ray: IRay, pA: vec3, pB: vec3, pC: vec3): { distance: number, point: vec3, node: ITreeNode } | undefined {
        let point: vec3 | null;

        if (material && material.side === MATERIAL_SIDE.BACK) {
            const triangle = new Triangle(pC, pB, pA);
            point = triangle.intersect(ray.origin, ray.direction);
        } else {
            const triangle = new Triangle(pA, pB, pC);
            point = triangle.intersect(ray.origin, ray.direction);
        }

        if (point === null) return;

        const distance = vec3.distance(ray.origin, point);
        return {
            distance: distance,
            point: vec3.clone(point),
            node
        };
    }

    private checkLineIntersection(node: ITreeNode, ray: IRay, radius: number, pA: vec3, pB: vec3): { distance: number, point: vec3, node: ITreeNode } | undefined {
        const direction = vec3.sub(vec3.create(), pB, pA);
        const lineLength = vec3.length(direction);
        const lineRay = {
            origin: pA,
            direction: vec3.divide(vec3.create(), direction, vec3.fromValues(lineLength, lineLength, lineLength))
        };
        const planeNormal = vec3.cross(vec3.create(), ray.direction, lineRay.direction);

        const Na = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), ray.direction, planeNormal));
        const Nb = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), lineRay.direction, planeNormal));

        const da = vec3.dot(vec3.sub(vec3.create(), pA, ray.origin), Nb) / vec3.dot(ray.direction, Nb);
        const db = vec3.dot(vec3.sub(vec3.create(), ray.origin, pA), Na) / vec3.dot(lineRay.direction, Na);

        let pointA: vec3 = vec3.create();
        if (da < 0) {
            vec3.copy(pointA, ray.origin);
        } else {
            pointA = vec3.add(vec3.create(), ray.origin, vec3.mul(vec3.create(), ray.direction, vec3.fromValues(da, da, da)));
        }

        let pointB: vec3 = vec3.create();
        if (db < 0) {
            vec3.copy(pointB, pA);
        } else if (db < lineLength) {
            pointB = vec3.add(vec3.create(), pA, vec3.mul(vec3.create(), lineRay.direction, vec3.fromValues(db, db, db)));
        } else {
            vec3.copy(pointB, pB);
        }

        const distance = vec3.distance(pointA, pointB);
        if (distance < radius) {
            return {
                distance: distance,
                point: vec3.clone(pointB),
                node
            }
        } else {
            return;
        }
    }

    private checkPointIntersection(node: ITreeNode, ray: IRay, radius: number, p: vec3): { distance: number, point: vec3, node: ITreeNode } | undefined {
        const closestPoint = vec3.sub(vec3.create(), p, ray.origin);
        const directionDistance = vec3.dot(closestPoint, ray.direction);

        if (directionDistance < 0) {
            vec3.copy(closestPoint, ray.origin);
        } else {
            vec3.multiply(closestPoint, vec3.copy(closestPoint, ray.direction), vec3.fromValues(directionDistance, directionDistance, directionDistance));
            vec3.add(closestPoint, closestPoint, ray.origin);
        }

        const distance = vec3.distance(closestPoint, p);
        if (distance < radius) {
            return {
                distance: distance,
                point: vec3.clone(closestPoint),
                node
            }
        } else {
            return;
        }
    }

    private intersectNode(node: ITreeNode, rayIn: IRay, intersectionOptions: { opacity: number, rendererType: RENDERER_TYPE }): IIntersection[] | undefined {
        if (node.visible === false) return;

        const inverseMatrix = mat4.invert(mat4.create(), node.worldMatrix);
        const ray = {
            origin: vec3.transformMat4(vec3.create(), rayIn.origin, inverseMatrix),
            direction: vec3.normalize(vec3.create(), vec3.fromValues(
                inverseMatrix[0] * rayIn.direction[0] + inverseMatrix[4] * rayIn.direction[1] + inverseMatrix[8] * rayIn.direction[2],
                inverseMatrix[1] * rayIn.direction[0] + inverseMatrix[5] * rayIn.direction[1] + inverseMatrix[9] * rayIn.direction[2],
                inverseMatrix[2] * rayIn.direction[0] + inverseMatrix[6] * rayIn.direction[1] + inverseMatrix[10] * rayIn.direction[2]
            ))
        };

        let geometryData: GeometryData | undefined;
        for (let i = 0; i < node.data.length; i++) {
            if (node.data[i] instanceof GeometryData) {
                geometryData = <GeometryData>node.data[i];
                break;
            }
        }

        // quick out if the material does not fit the intersection options
        if (geometryData) {
            let materialData: IMaterialAbstractData | null = null;
            if (geometryData.primitive.effectMaterials.length > 0) {
                materialData = geometryData.primitive.effectMaterials[geometryData.primitive.effectMaterials.length - 1].material
            } else if (intersectionOptions.rendererType === RENDERER_TYPE.ATTRIBUTES) {
                materialData = geometryData.primitive.attributeMaterial;
            } else {
                materialData = geometryData.primitive.material;
            }

            // if opacity <= intersectionOptions.opacity
            if (materialData && materialData.opacity <= intersectionOptions.opacity)
                return;
        }

        if (!geometryData) {
            let intersections: IIntersection[] = [];
            for (let i = 0; i < node.children.length; i++) {
                let intersection = this.intersectNode(node.children[i], rayIn, intersectionOptions);
                if (intersection)
                    intersections = intersections.concat(intersection);
            }
            if (intersections.length > 0) {
                intersections.sort((a, b) => a.distance - b.distance);
                return intersections;
            }
            return;
        } else if (geometryData.primitive.mode === PRIMITIVE_MODE.LINES) {
            // if (node.boundingBox.boundingSphere.intersects(ray.origin, ray.direction) === false) return;
            if (node.boundingBox.intersects(rayIn.origin, rayIn.direction) === false) return;

            const index = geometryData.primitive.indices;
            const position = geometryData.primitive.attributes['POSITION'];
            const radius = 0.1;
            let intersections = [];
            if (index !== null) {
                // indexed buffer geometry
                for (let i = 0, il = +index.count; i < il; i += 2) {
                    const a = index.array[(i) * index.itemSize];
                    const b = index.array[(i + 1) * index.itemSize];

                    let intersection = this.checkLineIntersection(node, ray, radius,
                        vec3.fromValues(position.array[a * position.itemSize], position.array[a * position.itemSize + 1], position.array[a * position.itemSize + 2]),
                        vec3.fromValues(position.array[b * position.itemSize], position.array[b * position.itemSize + 1], position.array[b * position.itemSize + 2]));
                    if (intersection) intersections.push(intersection)
                }
            } else if (position !== undefined) {
                // non-indexed buffer geometry
                for (let i = 0, il = +position.count; i < il; i += 2) {
                    const a = i;
                    const b = i + 1;
                    let intersection = this.checkLineIntersection(node, ray, radius,
                        vec3.fromValues(position.array[a * position.itemSize], position.array[a * position.itemSize + 1], position.array[a * position.itemSize + 2]),
                        vec3.fromValues(position.array[b * position.itemSize], position.array[b * position.itemSize + 1], position.array[b * position.itemSize + 2])); if (intersection) intersections.push(intersection)
                }
            }

            intersections.sort((a, b) => a.distance - b.distance);
            intersections.forEach(i => i.point = vec3.transformMat4(i.point, i.point, node.worldMatrix));
            return intersections;
        } else if (geometryData.primitive.mode === PRIMITIVE_MODE.LINE_LOOP || geometryData.primitive.mode === PRIMITIVE_MODE.LINE_STRIP) {
            // if (node.boundingBox.boundingSphere.intersects(ray.origin, ray.direction) === false) return;
            if (node.boundingBox.intersects(rayIn.origin, rayIn.direction) === false) return;

            const index = geometryData.primitive.indices;
            const position = geometryData.primitive.attributes['POSITION'];
            const radius = 0.1;
            let intersections = [];
            if (index !== null) {
                // indexed buffer geometry
                for (let i = 0, il = +index.count - 1; i < il; i++) {
                    const a = index.array[(i) * index.itemSize];
                    const b = index.array[(i + 1) * index.itemSize];

                    let intersection = this.checkLineIntersection(node, ray, radius,
                        vec3.fromValues(position.array[a * position.itemSize], position.array[a * position.itemSize + 1], position.array[a * position.itemSize + 2]),
                        vec3.fromValues(position.array[b * position.itemSize], position.array[b * position.itemSize + 1], position.array[b * position.itemSize + 2]));
                    if (intersection) intersections.push(intersection)
                }
            } else if (position !== undefined) {
                // non-indexed buffer geometry
                for (let i = 0, il = +position.count; i < il; i += 2) {
                    const a = i;
                    const b = i + 1;
                    let intersection = this.checkLineIntersection(node, ray, radius,
                        vec3.fromValues(position.array[a * position.itemSize], position.array[a * position.itemSize + 1], position.array[a * position.itemSize + 2]),
                        vec3.fromValues(position.array[b * position.itemSize], position.array[b * position.itemSize + 1], position.array[b * position.itemSize + 2])); if (intersection) intersections.push(intersection)
                }
            }

            intersections.sort((a, b) => a.distance - b.distance);
            intersections.forEach(i => i.point = vec3.transformMat4(i.point, i.point, node.worldMatrix));
            return intersections;
        } else if (geometryData.primitive.mode === PRIMITIVE_MODE.POINTS) {
            const position = geometryData.primitive.attributes['POSITION'];
            const radius = 0.1;
            let intersections = [];
            if (position !== undefined) {
                // non-indexed buffer geometry
                for (let i = 0, il = +position.count; i < il; i++) {
                    let intersection = this.checkPointIntersection(node, ray, radius,
                        vec3.fromValues(position.array[i * position.itemSize], position.array[i * position.itemSize + 1], position.array[i * position.itemSize + 2]));
                    if (intersection) intersections.push(intersection)
                }
            }

            intersections.sort((a, b) => a.distance - b.distance);
            intersections.forEach(i => i.point = vec3.transformMat4(i.point, i.point, node.worldMatrix));
            return intersections;
        } else {
            // Here, Vector is a vector in Rn, not a dynamic array.
            let  v = vec3.sub(vec3.create(), node.boundingBox.boundingSphere.center, rayIn.origin);
            let dotProd = vec3.dot(v, rayIn.direction);
            dotProd = Math.max(dotProd, 0.0); // if dotProd is negative, the closest point is in the opposite direction to d.
            let e = vec3.add(vec3.create(), rayIn.origin, vec3.scale(vec3.create(), rayIn.direction, dotProd));

            let squaredDistance = vec3.squaredDistance(e, node.boundingBox.boundingSphere.center);
            if (squaredDistance > node.boundingBox.boundingSphere.radius * node.boundingBox.boundingSphere.radius) return;

            // if (node.boundingBox.boundingSphere.intersects(ray.origin, ray.direction) === false) return;
            if (node.boundingBox.intersects(rayIn.origin, rayIn.direction) === false) return;

            const material = geometryData.primitive.material;
            const index = geometryData.primitive.indices;
            const position = geometryData.primitive.attributes['POSITION'];

            let intersections = [];

            if (index !== null) {
                // indexed buffer geometry
                for (let i = 0, il = +index.count; i < il; i += 3) {
                    const a = index.array[(i) * index.itemSize];
                    const b = index.array[(i + 1) * index.itemSize];
                    const c = index.array[(i + 2) * index.itemSize];

                    let intersection = this.checkIntersection(node, material, ray,
                        vec3.fromValues(position.array[a * position.itemSize], position.array[a * position.itemSize + 1], position.array[a * position.itemSize + 2]),
                        vec3.fromValues(position.array[b * position.itemSize], position.array[b * position.itemSize + 1], position.array[b * position.itemSize + 2]),
                        vec3.fromValues(position.array[c * position.itemSize], position.array[c * position.itemSize + 1], position.array[c * position.itemSize + 2]));
                    if (intersection) intersections.push(intersection)
                }
            } else if (position !== undefined) {
                // non-indexed buffer geometry
                for (let i = 0, il = +position.count; i < il; i += 3) {
                    const a = i;
                    const b = i + 1;
                    const c = i + 2;
                    let intersection = this.checkIntersection(node, material, ray,
                        vec3.fromValues(position.array[a * position.itemSize], position.array[a * position.itemSize + 1], position.array[a * position.itemSize + 2]),
                        vec3.fromValues(position.array[b * position.itemSize], position.array[b * position.itemSize + 1], position.array[b * position.itemSize + 2]),
                        vec3.fromValues(position.array[c * position.itemSize], position.array[c * position.itemSize + 1], position.array[c * position.itemSize + 2]));
                    if (intersection) intersections.push(intersection)
                }
            }

            intersections.sort((a, b) => a.distance - b.distance);
            intersections.forEach(i => i.point = vec3.transformMat4(i.point, i.point, node.worldMatrix));
            return intersections;
        }
    }

    // #endregion Private Methods (4)
}