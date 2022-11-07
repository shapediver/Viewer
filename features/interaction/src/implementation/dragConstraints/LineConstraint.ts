import { IDragConstraint } from "../../interfaces/utils/IDragConstraint";
import { IRay, IIntersection } from "@shapediver/viewer.rendering-engine.intersection-engine";
import { ITreeNode, TreeNode } from "@shapediver/viewer.shared.node-tree";
import { mat4, vec3 } from "gl-matrix";
import { IViewportApi } from "@shapediver/viewer";
import { InteractionData } from "../InteractionData";
import { calculateDragMatrix } from "./DragConstraintsHelper";

/**
 * The line constraint is used for dragging and allows the specification of a line along which objects can be dragged.
 * The radius defines in which distance this constraint is being considered to be chosen from the constraints defined.
 * The transformation and optional rotation of this constraint get applied to the node if it is the constraint with the closest distance to the ray that was used for the drag event.
 * As this is a difficult topic, please visit our [help desk section on interactions](https://help.shapediver.com/doc/interactions-part-1) where we go through the process of setting everything up with examples.
 */
export class LineConstraint implements IDragConstraint {
    // #region Properties (7)

    #dragLineLength: number;
    #dragOrigin?: vec3;
    #dragRay: IRay;
    #point1: vec3;
    #point2: vec3;
    #radius: number = 0;
    #rotation: {
        axis: vec3,
        angle: number
    };

    // #endregion Properties (7)

    // #region Constructors (1)

    /**
     * @param _point1 the start point of the line
     * @param _point2 the end point of the line
     * @param _radius the radius in which the line is considered
     * @param _rotation the rotation in [axis-angle representation](https://en.wikipedia.org/wiki/Axis%E2%80%93angle_representation) that is applied to the node if the drag contraint becomes active
     */
    constructor(
        _point1: vec3,
        _point2: vec3,
        _radius: number = 0,
        _rotation?: {
            axis: vec3,
            angle: number
        }
    ) {
        this.#point1 = _point1;
        this.#point2 = _point2;
        this.#radius = _radius;
        this.#rotation = _rotation || { axis: vec3.fromValues(0, 0, 1), angle: 0 };

        const direction = vec3.sub(vec3.create(), this.#point2, this.#point1);
        this.#dragLineLength = vec3.length(direction);
        this.#dragRay = {
            origin: this.#point1,
            direction: vec3.divide(vec3.create(), direction, vec3.fromValues(this.#dragLineLength, this.#dragLineLength, this.#dragLineLength))
        };
    }

    // #endregion Constructors (1)

    // #region Public Methods (2)

    public intersect(viewport: IViewportApi, node: ITreeNode, rayA: IRay): { distance: number, transformation: mat4 } | undefined {
        const planeNormal = vec3.cross(vec3.create(), rayA.direction, this.#dragRay.direction);

        const Na = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), rayA.direction, planeNormal));
        const Nb = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), this.#dragRay.direction, planeNormal));

        const da = vec3.dot(vec3.sub(vec3.create(), this.#dragRay.origin, rayA.origin), Nb) / vec3.dot(rayA.direction, Nb);
        const db = vec3.dot(vec3.sub(vec3.create(), rayA.origin, this.#dragRay.origin), Na) / vec3.dot(this.#dragRay.direction, Na);

        let pointA: vec3 = vec3.create();
        if (da < 0) {
            vec3.copy(pointA, rayA.origin);
        } else {
            pointA = vec3.add(vec3.create(), rayA.origin, vec3.mul(vec3.create(), rayA.direction, vec3.fromValues(da, da, da)));
        }

        let pointB: vec3 = vec3.create();
        if (db < 0) {
            vec3.copy(pointB, this.#dragRay.origin);
        } else if (db < this.#dragLineLength) {
            pointB = vec3.add(vec3.create(), this.#dragRay.origin, vec3.mul(vec3.create(), this.#dragRay.direction, vec3.fromValues(db, db, db)));
        } else {
            vec3.copy(pointB, this.#point2);
        }

        const distance = vec3.distance(pointA, pointB);
        if (distance < this.#radius)
            return { distance, transformation: calculateDragMatrix(node, pointB, this.#rotation, this.#dragOrigin!, pointA) };

        return;
    }

    public setup(viewport: IViewportApi, node: ITreeNode, ray: IRay, intersection: IIntersection, previousDragMatrix: mat4): { distance: number, transformation: mat4 } | undefined {
        const data = <InteractionData>node.data.find(d => d instanceof InteractionData);
        this.#dragOrigin = data && data.dragOrigin ? vec3.transformMat4(vec3.create(), data.dragOrigin!, node.worldMatrix) : vec3.transformMat4(vec3.create(), intersection.point, mat4.invert(mat4.create(), previousDragMatrix));
        return this.intersect(viewport, node, ray);
    }

    // #endregion Public Methods (2)
}