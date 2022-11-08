import { IDragConstraint } from "../../interfaces/utils/IDragConstraint";
import { IRay, IIntersection } from "@shapediver/viewer.rendering-engine.intersection-engine";
import { ITreeNode, TreeNode } from "@shapediver/viewer.shared.node-tree";
import { mat4, vec3 } from "gl-matrix";
import { IViewportApi } from "@shapediver/viewer";
import { IPlane, Plane } from "@shapediver/viewer.shared.math";
import { InteractionData } from "../InteractionData";
import { calculateDragMatrix } from "./DragConstraintsHelper";

/**
 * The camera plane constraint is used for dragging and allows to specify that the dragging happens on a plane parallel to the camera plane that passes through the origin of the node being dragged.
 * The transformation and optional rotation of this constraint get applied to the node if it is the constraint with the closest distance to the ray that was used for the drag event.
 * As this is a difficult topic, please visit our [help desk section on interactions](https://help.shapediver.com/doc/interactions-part-1) where we go through the process of setting everything up with examples.
 */
export class CameraPlaneConstraint implements IDragConstraint {
    // #region Properties (3)

    #dragOrigin?: vec3;
    #dragPlane?: IPlane;
    #rotation: { axis: vec3; angle: number; };

    // #endregion Properties (3)

    // #region Constructors (1)

    /**
     * @param _rotation the rotation in [axis-angle representation](https://en.wikipedia.org/wiki/Axis%E2%80%93angle_representation) that is applied to the node if the drag contraint becomes active
     */
    constructor(
        _rotation?: {
            axis: vec3,
            angle: number
        }
    ) {
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
        const cameraDirection = vec3.normalize(vec3.create(), vec3.sub(vec3.create(), viewport.camera!.target, viewport.camera!.position));
        this.#dragPlane = new Plane().setFromNormalAndCoplanarPoint(cameraDirection, intersection.point);

        const data = <InteractionData>node.data.find(d => d instanceof InteractionData);
        this.#dragOrigin = data && data.dragOrigin ? vec3.transformMat4(vec3.create(), data.dragOrigin!, node.worldMatrix) : vec3.transformMat4(vec3.create(), intersection.point, mat4.invert(mat4.create(), previousDragMatrix));
        return this.intersect(viewport, node, ray);
    }

    // #endregion Public Methods (2)
}