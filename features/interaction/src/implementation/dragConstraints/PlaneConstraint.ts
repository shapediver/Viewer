import { IDragConstraint } from "../../interfaces/utils/IDragConstraint";
import { IRay, IIntersection } from "@shapediver/viewer.rendering-engine.intersection-engine";
import { ITreeNode, TreeNode } from "@shapediver/viewer.shared.node-tree";
import { mat4, vec3 } from "gl-matrix";
import { IViewportApi } from "@shapediver/viewer";
import { IPlane, Plane } from "@shapediver/viewer.shared.math";
import { InteractionData } from "../InteractionData";
import { calculateDragMatrix } from "./DragConstraintsHelper";

export class PlaneConstraint implements IDragConstraint {
    // #region Properties (5)

    #coplanarPoint?: vec3;
    #dragOrigin?: vec3;
    #dragPlane?: IPlane;;
    #normal: vec3;
    #rotation: {
        axis: vec3,
        angle: number
    };

    // #endregion Properties (5)

    // #region Constructors (1)

    constructor(
        _normal: vec3,
        _coplanarPoint?: vec3,
        _rotation?: {
            axis: vec3,
            angle: number
        }
    ) {
        this.#normal = _normal;
        this.#coplanarPoint = _coplanarPoint;
        this.#rotation = _rotation || { axis: vec3.fromValues(0, 0, 1), angle: 0 };
    }

    // #endregion Constructors (1)

    // #region Public Methods (2)

    public intersect(viewport: IViewportApi, node: ITreeNode, ray: IRay): { distance: number, transformation: mat4 } | undefined {
        const distance = this.#dragPlane?.intersect(ray.origin, ray.direction);
        if (distance && distance > 0) {
            const point = vec3.add(vec3.create(), vec3.multiply(vec3.create(), ray.direction, vec3.fromValues(distance, distance, distance)), ray.origin);
            return { distance, transformation: calculateDragMatrix(node, point, this.#rotation, this.#dragOrigin!, point) };
        }
        return;
    }

    public setup(viewport: IViewportApi, node: ITreeNode, ray: IRay, intersection: IIntersection): { distance: number, transformation: mat4 } | undefined {
        if (this.#coplanarPoint) {
            this.#dragPlane = new Plane().setFromNormalAndCoplanarPoint(this.#normal, this.#coplanarPoint);
        } else {
            this.#dragPlane = new Plane().setFromNormalAndCoplanarPoint(this.#normal, intersection.point);
        }
        const data = <InteractionData>node.data.find(d => d instanceof InteractionData);
        this.#dragOrigin = data && data.dragOrigin ? vec3.transformMat4(vec3.create(), data.dragOrigin!, node.worldMatrix) : intersection.point;
        return this.intersect(viewport, node, ray);
    }

    // #endregion Public Methods (2)
}