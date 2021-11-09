import { IDragConstraint } from "../../interfaces/utils/IDragConstraint";
import { IRay, IIntersection } from "@shapediver/viewer.rendering-engine.intersection-engine";
import { TreeNode } from "@shapediver/viewer.shared.node-tree";
import { mat4, vec3 } from "gl-matrix";
import { IViewer } from "@shapediver/viewer";
import { Plane } from "@shapediver/viewer.shared.math";
import { InteractionData } from "../InteractionData";
import { calculateDragMatrix } from "./DragConstraintsHelper";

export class CameraPlaneConstraint implements IDragConstraint {
    // #region Properties (3)

    #dragOrigin?: vec3;
    #dragPlane?: Plane;
    #rotation: { axis: vec3; angle: number; };

    // #endregion Properties (3)

    // #region Constructors (1)

    constructor(
        _rotation?: {
            axis: vec3,
            angle: number
        }
    ) {
        this.#rotation = _rotation || { axis: vec3.fromValues(0,0,1), angle: 0 };
    }

    // #endregion Constructors (1)

    // #region Public Methods (2)

    public intersect(viewer: IViewer, node: TreeNode, ray: IRay): { distance: number, transformation: mat4 } | undefined {
        const distance = this.#dragPlane?.intersect(ray.origin, ray.direction);
        if (distance && distance > 0) {
            const point = vec3.add(vec3.create(), vec3.multiply(vec3.create(), ray.direction, vec3.fromValues(distance, distance, distance)), ray.origin);
            return { distance, transformation: calculateDragMatrix(node, point, this.#rotation, this.#dragOrigin!, point) };
        }
        return;
    }

    public setup(viewer: IViewer, node: TreeNode, ray: IRay, intersection: IIntersection): { distance: number, transformation: mat4 } | undefined {
        const cameraDirection = vec3.normalize(vec3.create(), vec3.sub(vec3.create(), viewer.camera!.target, viewer.camera!.position));
        this.#dragPlane = new Plane().setFromNormalAndCoplanarPoint(cameraDirection, intersection.point);

        const data = <InteractionData>node.data.find(d => d instanceof InteractionData);
        this.#dragOrigin = data && data.dragOrigin ? data.dragOrigin : intersection.point;
        return this.intersect(viewer, node, ray);
    }

    // #endregion Public Methods (2)
}