import { IDragConstraint } from "../../interfaces/IDragConstraint";
import { IRay, IIntersection } from "@shapediver/viewer.rendering-engine.intersection-engine";
import { TreeNode } from "@shapediver/viewer.shared.node-tree";
import { mat4, vec3 } from "gl-matrix";
import { IViewer } from "@shapediver/viewer";
import { Plane } from "@shapediver/viewer.shared.math";

export class CameraPlaneConstraint implements IDragConstraint {
    // #region Properties (2)

    private _dragOrigin?: vec3;
    private _dragPlane?: Plane;

    // #endregion Properties (2)

    // #region Public Methods (2)

    public intersect(viewer: IViewer, node: TreeNode, ray: IRay): { distance: number, transformation: mat4 } | undefined {
        const distance = this._dragPlane?.intersect(ray.origin, ray.direction);
        if (distance && distance > 0) {
            const point = vec3.add(vec3.create(), vec3.multiply(vec3.create(), ray.direction, vec3.fromValues(distance, distance, distance)), ray.origin);
            const dragTranslation = vec3.sub(vec3.create(), point, this._dragOrigin!);
            return { distance, transformation: mat4.fromTranslation(mat4.create(), dragTranslation) };
        }
        return;
    }

    public setup(viewer: IViewer, node: TreeNode, ray: IRay, intersection: IIntersection): { distance: number, transformation: mat4 } | undefined {
        const cameraDirection = vec3.normalize(vec3.create(), vec3.sub(vec3.create(), viewer.camera!.target, viewer.camera!.position));
        this._dragPlane = new Plane().setFromNormalAndCoplanarPoint(cameraDirection, intersection.point);
        this._dragOrigin = intersection.point;
        return { distance: intersection.distance, transformation: mat4.create() };
    }

    // #endregion Public Methods (2)
}