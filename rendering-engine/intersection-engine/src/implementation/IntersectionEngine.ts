import { GeometryData, MaterialData, MATERIAL_SIDE } from "@shapediver/viewer.shared.types";
import { mat4, vec3 } from "gl-matrix";
import { Triangle } from "@shapediver/viewer.shared.math";
import { Tree, TreeNode } from "@shapediver/viewer.shared.node-tree";
import { IIntersection } from "../interfaces/IIntersection";
import { IIntersectionEngine } from "../interfaces/IIntersectionEngine";
import { IIntersectionFilter } from "../interfaces/IIntersectionFilter";
import { IRay } from "../interfaces/IRay";
import { container, singleton } from "tsyringe";

@singleton()
export class IntersectionEngine implements IIntersectionEngine {
    private readonly _tree: Tree = <Tree>container.resolve(Tree);

    intersect(ray: IRay, filterCriteria: IIntersectionFilter[] = [], root: TreeNode = this._tree.root): IIntersection[] {
        let intersections: IIntersection[] = [];
        const intersectNode = (node: TreeNode) => {
            for (let i = 0; i < filterCriteria.length; i++) {
                if (filterCriteria[i](node)) {
                    const intersection = this.intersectNode(node, ray)
                    if (intersection) {
                        intersection.forEach(i => i.node = node);
                        intersections = intersections.concat(intersection);
                    }
                    break;
                }
            }
               
            for (let i = 0; i < node.children.length; i++)
                intersectNode(node.children[i])
        }
        intersectNode(this._tree.root);

        
        intersections.sort((a, b) => a.distance - b.distance);
        return intersections;
    }

    
    private checkIntersection(node: TreeNode, material: MaterialData | null, ray: IRay, pA: vec3, pB: vec3, pC: vec3): { distance: number, point: vec3, node: TreeNode } | undefined {
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

    private intersectNode(node: TreeNode, rayIn: IRay): IIntersection[] | undefined {
        const inverseMatrix = mat4.invert(mat4.create(), node.nodeMatrix);
        const ray = {
            origin: vec3.transformMat4(vec3.create(), rayIn.origin, inverseMatrix),
            direction: vec3.normalize(vec3.create(), vec3.fromValues(
                inverseMatrix[0] * rayIn.direction[0] + inverseMatrix[4] * rayIn.direction[1] + inverseMatrix[8] * rayIn.direction[2],
                inverseMatrix[1] * rayIn.direction[0] + inverseMatrix[5] * rayIn.direction[1] + inverseMatrix[9] * rayIn.direction[2],
                inverseMatrix[2] * rayIn.direction[0] + inverseMatrix[6] * rayIn.direction[1] + inverseMatrix[10] * rayIn.direction[2]
            ))
        };

        // if (node.boundingBox.boundingSphere.intersect(ray.origin, ray.direction) === null) return;
        if (node.boundingBox.intersect(rayIn.origin, rayIn.direction) === null) return;

        let geometryData: GeometryData | undefined;
        for (let i = 0; i < node.data.length; i++) {
            if (node.data[i] instanceof GeometryData) {
                geometryData = <GeometryData>node.data[i];
                break;
            }
        }
        if (!geometryData) {
            let intersections: IIntersection[] = [];
            for (let i = 0; i < node.children.length; i++) {
                let intersection = this.intersectNode(node.children[i], ray);
                if (intersection)
                    intersections = intersections.concat(intersection);
            }
            if (intersections.length > 0) {
                intersections.sort((a, b) => a.distance - b.distance);
                return intersections;
            }
            return;
        };

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
        return intersections;
    }

}