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
import { ITreeNode, IViewportApi } from '@shapediver/viewer';
import { IVisualizationSettings } from '../../../interfaces/IVisualizationSettings';
import { mat4, vec3 } from 'gl-matrix';

// #region Type aliases (1)

export type PointRestrictionProperties = {
    rotation?: { axis: vec3; angle: number; };
    point: vec3;
    radius?: number;
} & RestrictionProperties;

// #endregion Type aliases (1)

// #region Classes (1)

export class PointRestriction extends AbstractRestriction implements IRestriction {
    // #region Properties (7)

    readonly #viewport: IViewportApi;

    #dragOrigin?: vec3;
    #node?: ITreeNode;
    #point: vec3;
    #radius: number;
    #rotation: { axis: vec3; angle: number; };
    #snapRestrictions: { [key: string]: ISnapRestriction } = {};

    // #endregion Properties (7)

    // #region Constructors (1)

    constructor(viewport: IViewportApi, geometryMathManager: GeometryMathManager, parentNode: ITreeNode, id: string, settings: IVisualizationSettings, properties: PointRestrictionProperties) {
        super(viewport, parentNode, id, RESTRICTION_TYPE.PLANE);

        this.#viewport = viewport;
        this.#rotation = properties.rotation || { axis: vec3.fromValues(0, 0, 1), angle: 0 };
        this.#point = properties.point;
        this.#radius = properties.radius || 0;
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (4)

    public get point(): vec3 {
        return this.#point;
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

    // #endregion Public Getters And Setters (4)

    // #region Public Methods (2)

    public rayTrace(ray: IRay, metaData?: RestrictionMetaData): RayTraceResult | undefined {
        if (!this.#node || !this.#dragOrigin) return;

        const closestPoint = vec3.sub(vec3.create(), this.#point, ray.origin);
        const directionDistance = vec3.dot(closestPoint, ray.direction);

        if (directionDistance < 0) {
            vec3.copy(closestPoint, ray.origin);
        } else {
            vec3.multiply(closestPoint, vec3.copy(closestPoint, ray.direction), vec3.fromValues(directionDistance, directionDistance, directionDistance));
            vec3.add(closestPoint, closestPoint, ray.origin);
        }

        const distance = vec3.distance(closestPoint, this.#point);
        if (distance < this.#radius) {
            const { matrix, dragAnchor } = calculateDragMatrix(this.#point, this.#rotation, this.#dragOrigin!, metaData?.dragAnchors, closestPoint);
            return { distance, transformation: matrix, dragAnchor, point: closestPoint, restriction: this };
        }
        return;
    }

    public setup(node: ITreeNode, ray: IRay, intersection: IIntersection, previousDragMatrix: mat4, dragOrigin?: vec3): RayTraceResult | undefined {
        let invertedPreviousDragMatrix = mat4.invert(mat4.create(), previousDragMatrix);
        if (!invertedPreviousDragMatrix)
            invertedPreviousDragMatrix = mat4.create();

        this.#dragOrigin = dragOrigin ? vec3.transformMat4(vec3.create(), dragOrigin, node.worldMatrix) : vec3.transformMat4(vec3.create(), intersection.point, invertedPreviousDragMatrix);
        this.#node = node;
        return this.rayTrace(ray);
    }

    // #endregion Public Methods (2)

    // #region Protected Methods (1)

    protected visibilityChanged(): void { }

    // #endregion Protected Methods (1)
}

// #endregion Classes (1)
