import { AbstractRestriction } from '../AbstractRestriction';
import { calculateDragMatrix } from '../RestrictionsHelper';
import { GeometryMathManager } from '../../GeometryMathManager';
import { IIntersection, IRay } from '@shapediver/viewer.rendering-engine.intersection-engine';
import {
    IRestriction,
    RayTraceResult,
    RESTRICTION_TYPE,
    RestrictionMetaData,
    RestrictionProperties
} from '../../../interfaces/IRestriction';
import { ISnapRestriction } from '../../../interfaces/ISnapRestriction';
import { ITreeNode } from '@shapediver/viewer.shared.node-tree';
import { IViewportApi } from '@shapediver/viewer';
import { IVisualizationSettings } from '../../../interfaces/IVisualizationSettings';
import { mat4, vec3 } from 'gl-matrix';

// #region Type aliases (1)

export type LineRestrictionProperties = {
    rotation?: { axis: vec3; angle: number; };
    point1: vec3;
    point2: vec3;
    radius?: number;
} & RestrictionProperties;

// #endregion Type aliases (1)

// #region Classes (1)

export class LineRestriction extends AbstractRestriction implements IRestriction {
    // #region Properties (10)

    readonly #viewport: IViewportApi;

    #dragLineLength: number;
    #dragOrigin?: vec3;
    #dragRay: IRay;
    #node?: ITreeNode;
    #point1: vec3;
    #point2: vec3;
    #radius: number;
    #rotation: { axis: vec3; angle: number; };
    #snapRestrictions: { [key: string]: ISnapRestriction } = {};

    // #endregion Properties (10)

    // #region Constructors (1)

    constructor(viewport: IViewportApi, geometryMathManager: GeometryMathManager, parentNode: ITreeNode, id: string, settings: IVisualizationSettings, properties: LineRestrictionProperties) {
        super(viewport, parentNode, id, RESTRICTION_TYPE.PLANE);

        this.#viewport = viewport;
        this.#rotation = properties.rotation || { axis: vec3.fromValues(0, 0, 1), angle: 0 };
        this.#point1 = properties.point1;
        this.#point2 = properties.point2;
        this.#radius = properties.radius || 0;

        const direction = vec3.sub(vec3.create(), this.#point2, this.#point1);
        this.#dragLineLength = vec3.length(direction);
        this.#dragRay = {
            origin: this.#point1,
            direction: vec3.divide(vec3.create(), direction, vec3.fromValues(this.#dragLineLength, this.#dragLineLength, this.#dragLineLength))
        };
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (5)

    public get point1(): vec3 {
        return this.#point1;
    }

    public get point2(): vec3 {
        return this.#point2;
    }

    public get priority(): number {
        return -1;
    }

    public get radius(): number {
        return this.#radius;
    }

    public get snapRestrictions(): { [key: string]: ISnapRestriction; } {
        return this.#snapRestrictions;
    }

    // #endregion Public Getters And Setters (5)

    // #region Public Methods (2)

    public rayTrace(ray: IRay, metaData?: RestrictionMetaData): RayTraceResult | undefined {
        if (!this.#node || !this.#dragOrigin) return;

        const planeNormal = vec3.cross(vec3.create(), ray.direction, this.#dragRay.direction);

        const Na = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), ray.direction, planeNormal));
        const Nb = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), this.#dragRay.direction, planeNormal));

        const da = vec3.dot(vec3.sub(vec3.create(), this.#dragRay.origin, ray.origin), Nb) / vec3.dot(ray.direction, Nb);
        const db = vec3.dot(vec3.sub(vec3.create(), ray.origin, this.#dragRay.origin), Na) / vec3.dot(this.#dragRay.direction, Na);

        let pointA: vec3 = vec3.create();
        if (da < 0) {
            vec3.copy(pointA, ray.origin);
        } else {
            pointA = vec3.add(vec3.create(), ray.origin, vec3.mul(vec3.create(), ray.direction, vec3.fromValues(da, da, da)));
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
        if (distance < this.#radius) {
            const { matrix, dragAnchor } = calculateDragMatrix(pointB, this.#rotation, this.#dragOrigin!, metaData?.dragAnchors, pointA);
            return { distance, transformation: matrix, dragAnchor, point: pointB, restriction: this };
        }

        return;
    }

    public setup(node: ITreeNode, ray: IRay, intersection: IIntersection, previousDragMatrix: mat4, dragOrigin?: vec3): RayTraceResult | undefined {
        let invertedPreviousDragMatrix = mat4.invert(mat4.create(), previousDragMatrix);
        if (!invertedPreviousDragMatrix)
            invertedPreviousDragMatrix = mat4.create();

        this.#dragOrigin = dragOrigin ? vec3.transformMat4(vec3.create(), dragOrigin!, node.worldMatrix) : vec3.transformMat4(vec3.create(), intersection.point, invertedPreviousDragMatrix);
        this.#node = node;
        return this.rayTrace(ray);
    }

    // #endregion Public Methods (2)

    // #region Protected Methods (1)

    protected visibilityChanged(): void { }

    // #endregion Protected Methods (1)
}

// #endregion Classes (1)
