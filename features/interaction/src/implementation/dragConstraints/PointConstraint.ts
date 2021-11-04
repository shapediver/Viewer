import { IDragConstraint } from "../../interfaces/IDragConstraint";
import { IRay, IIntersection } from "@shapediver/viewer.rendering-engine.intersection-engine";
import { TreeNode } from "@shapediver/viewer.shared.node-tree";
import { mat4, vec3 } from "gl-matrix";
import { IViewer } from "@shapediver/viewer";

export class PointConstraint implements IDragConstraint {
    // #region Properties (1)

    private _dragOrigin?: vec3;

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(private readonly _point: vec3, private readonly _radius: number = 0) {}

    // #endregion Constructors (1)

    // #region Public Methods (2)

    public intersect(viewer: IViewer, node: TreeNode, ray: IRay): { distance: number, transformation: mat4 } | undefined {
        const pa = vec3.sub(vec3.create(), this._point, ray.origin);
        const dot = vec3.dot(pa, ray.direction);
        const d = vec3.multiply(vec3.create(), vec3.fromValues(dot, dot, dot), ray.direction);

        const closestPoint = vec3.sub(vec3.create(), pa, d);
        
        const distance = vec3.distance(closestPoint, this._point);
        if (distance < this._radius) {
            const dragTranslation = vec3.sub(vec3.create(), this._point, this._dragOrigin!);
            return { distance, transformation: mat4.fromTranslation(mat4.create(), dragTranslation) };
        }
        return;
    }

    public setup(viewer: IViewer, node: TreeNode, ray: IRay, intersection: IIntersection): { distance: number, transformation: mat4 } | undefined {       
        this._dragOrigin = intersection.point;
        return { distance: intersection.distance, transformation: mat4.create() };
    }

    // #endregion Public Methods (2)
}