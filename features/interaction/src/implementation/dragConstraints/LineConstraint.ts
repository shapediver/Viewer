import { IDragConstraint } from "../../interfaces/utils/IDragConstraint";
import { IRay, IIntersection } from "@shapediver/viewer.rendering-engine.intersection-engine";
import { ITreeNode, TreeNode } from "@shapediver/viewer.shared.node-tree";
import { mat4, vec3 } from "gl-matrix";
import { IViewportApi } from "@shapediver/viewer";
import { InteractionData } from "../InteractionData";
import { calculateDragMatrix } from "./DragConstraintsHelper";

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

    public setup(viewport: IViewportApi, node: ITreeNode, ray: IRay, intersection: IIntersection): { distance: number, transformation: mat4 } | undefined {
        const data = <InteractionData>node.data.find(d => d instanceof InteractionData);
        this.#dragOrigin = data && data.dragOrigin ? vec3.transformMat4(vec3.create(), data.dragOrigin!, node.worldMatrix) : intersection.point;
        return this.intersect(viewport, node, ray);
    }

    // #endregion Public Methods (2)
}