import { IDragConstraint } from "../../interfaces/utils/IDragConstraint";
import { IRay, IIntersection } from "@shapediver/viewer.rendering-engine.intersection-engine";
import { ITreeNode, TreeNode } from "@shapediver/viewer.shared.node-tree";
import { mat4, vec3 } from "gl-matrix";
import { IViewportApi } from "@shapediver/viewer";
import { IPlane, Plane } from "@shapediver/viewer.shared.math";
import { InteractionData } from "../InteractionData";
import { calculateDragMatrix } from "./DragConstraintsHelper";

/**
 * The plane constraint is used for dragging and allows to specify a plane on which an object can be dragged.
 * The transformation and optional rotation of this constraint get applied to the node if it is the constraint with the closest distance to the ray that was used for the drag event.
 * As this is a difficult topic, please visit our [help desk section on interactions](https://help.shapediver.com/doc/interactions-part-1) where we go through the process of setting everything up with examples.
 */
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

    /**
     * @param _normal the normal vector of the plane
     * @param _coplanarPoint a coplanar point on the plane 
     * @param _rotation the rotation in [axis-angle representation](https://en.wikipedia.org/wiki/Axis%E2%80%93angle_representation) that is applied to the node if the drag contraint becomes active
     */
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

    public setup(viewport: IViewportApi, node: ITreeNode, ray: IRay, intersection: IIntersection, previousDragMatrix: mat4): { distance: number, transformation: mat4 } | undefined {
        if (this.#coplanarPoint) {
            this.#dragPlane = new Plane().setFromNormalAndCoplanarPoint(this.#normal, this.#coplanarPoint);
        } else {
            this.#dragPlane = new Plane().setFromNormalAndCoplanarPoint(this.#normal, intersection.point);
        }
        const data = <InteractionData>node.data.find(d => d instanceof InteractionData);
        this.#dragOrigin = data && data.dragOrigin ? vec3.transformMat4(vec3.create(), data.dragOrigin!, node.worldMatrix) : vec3.transformMat4(vec3.create(), intersection.point, mat4.invert(mat4.create(), previousDragMatrix));
        return this.intersect(viewport, node, ray);
    }

    // #endregion Public Methods (2)
}