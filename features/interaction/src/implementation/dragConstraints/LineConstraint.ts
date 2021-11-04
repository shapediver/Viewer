import { IDragConstraint } from "../../interfaces/IDragConstraint";
import { IRay, IIntersection } from "@shapediver/viewer.rendering-engine.intersection-engine";
import { TreeNode } from "@shapediver/viewer.shared.node-tree";
import { mat4, vec3 } from "gl-matrix";
import { IViewer } from "@shapediver/viewer";

export class LineConstraint implements IDragConstraint {
    // #region Properties (3)

    private _dragLineLength: number;
    private _dragOrigin?: vec3;
    private _dragRay: IRay;

    // #endregion Properties (3)

    // #region Constructors (1)

    constructor(private readonly _point1: vec3, private readonly _point2: vec3, private readonly _radius: number = 0) {
        const direction = vec3.sub(vec3.create(), this._point2, this._point1);
        this._dragLineLength = vec3.length(direction);
        this._dragRay = {
            origin: this._point1,
            direction: vec3.divide(vec3.create(), direction, vec3.fromValues(this._dragLineLength, this._dragLineLength, this._dragLineLength))
        };
    }

    // #endregion Constructors (1)

    // #region Public Methods (2)

    public intersect(viewer: IViewer, node: TreeNode, rayA: IRay): { distance: number, transformation: mat4 } | undefined {
        const planeNormal = vec3.cross(vec3.create(), rayA.direction, this._dragRay.direction);

        const Na = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), rayA.direction, planeNormal));
        const Nb = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), this._dragRay.direction, planeNormal));
        
        const da = vec3.dot(vec3.sub(vec3.create(), this._dragRay.origin, rayA.origin), Nb) / vec3.dot(rayA.direction, Nb);
        const db = vec3.dot(vec3.sub(vec3.create(), rayA.origin, this._dragRay.origin), Na) / vec3.dot(this._dragRay.direction, Na);

        let pointA: vec3 = vec3.create();
        if(da < 0) {
            vec3.copy(pointA, rayA.origin);
        } else {
            pointA = vec3.add(vec3.create(), rayA.origin, vec3.mul(vec3.create(), rayA.direction, vec3.fromValues(da, da, da)));
        }

        let pointB: vec3 = vec3.create();
        if(db < 0) {
            vec3.copy(pointB, this._dragRay.origin);
        } else if(db < this._dragLineLength) {
            pointB = vec3.add(vec3.create(), this._dragRay.origin, vec3.mul(vec3.create(), this._dragRay.direction, vec3.fromValues(db, db, db)));
        } else {
            vec3.copy(pointB, this._point2);
        }

        const distance = vec3.distance(pointA, pointB);
        if(distance < this._radius) {
            const dragTranslation = vec3.sub(vec3.create(), pointB, this._dragOrigin!);
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