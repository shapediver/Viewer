import { IDragConstraint } from "../../interfaces/IDragConstraint";
import { IRay, IIntersection } from "@shapediver/viewer.rendering-engine.intersection-engine";
import { TreeNode } from "@shapediver/viewer.shared.node-tree";
import { mat4, vec3 } from "gl-matrix";
import { IViewer } from "@shapediver/viewer";
import { Plane } from "@shapediver/viewer.shared.math";

export class PlaneConstraint implements IDragConstraint {
    // #region Properties (2)

    private _dragOrigin?: vec3;
    private _dragPlane?: Plane;

    // #endregion Properties (2)

    // #region Constructors (1)

    constructor(private readonly _normal: vec3, private readonly _coplanarPoint?: vec3) {
    }

    // #endregion Constructors (1)

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
        if(this._coplanarPoint) {
            this._dragPlane = new Plane().setFromNormalAndCoplanarPoint(this._normal, this._coplanarPoint);
        } else {
            this._dragPlane = new Plane().setFromNormalAndCoplanarPoint(this._normal, intersection.point);
        }

        return this.intersect(viewer, node, ray);
    }

    // #endregion Public Methods (2)
}