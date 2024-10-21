import { AbstractRestriction } from '../AbstractRestriction';
import { calculateDragMatrix } from '../RestrictionsHelper';
import {
    ITreeNode,
    IViewportApi
} from '@shapediver/viewer';
import { GeometryMathManager } from '../../GeometryMathManager';
import { IIntersection, IRay } from '@shapediver/viewer.rendering-engine.intersection-engine';
import { IPlane, Plane } from '@shapediver/viewer.shared.math';
import {
    IRestriction,
    RayTraceResult,
    RESTRICTION_TYPE,
    RestrictionMetaData,
    RestrictionProperties
} from '../../../interfaces/IRestriction';
import { ISnapRestriction } from '../../../interfaces/ISnapRestriction';
import { IVisualizationSettings } from '../../../interfaces/IVisualizationSettings';
import { mat4, vec3 } from 'gl-matrix';

// #region Type aliases (1)

export type CameraPlaneRestrictionProperties = {
    rotation: { axis: vec3; angle: number; };
} & RestrictionProperties;

// #endregion Type aliases (1)

// #region Classes (1)

export class CameraPlaneRestriction extends AbstractRestriction implements IRestriction {
    // #region Properties (6)

    readonly #viewport: IViewportApi;

    #snapRestrictions: { [key: string]: ISnapRestriction } = {};

    #dragOrigin?: vec3;
    #dragPlane?: IPlane;
    #node?: ITreeNode;
    #rotation: { axis: vec3; angle: number; };

    // #endregion Properties (6)

    // #region Constructors (1)

    constructor(viewport: IViewportApi, geometryMathManager: GeometryMathManager, parentNode: ITreeNode, id: string, settings: IVisualizationSettings, properties: CameraPlaneRestrictionProperties) {
        super(viewport, parentNode, id, RESTRICTION_TYPE.PLANE);

        this.#viewport = viewport;
        this.#rotation = properties.rotation;
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (2)

    public get priority(): number {
        return -1;
    }

    public get snapRestrictions(): { [key: string]: ISnapRestriction; } {
        return this.#snapRestrictions;
    }

    // #endregion Public Getters And Setters (2)

    // #region Public Methods (1)

    public rayTrace(ray: IRay, metaData?: RestrictionMetaData): RayTraceResult | undefined {
        if (!this.#node || !this.#dragPlane || !this.#dragOrigin) return;

        const distance = this.#dragPlane?.intersect(ray.origin, ray.direction);
        if (distance && distance > 0) {
            const point = vec3.add(vec3.create(), vec3.multiply(vec3.create(), ray.direction, vec3.fromValues(distance, distance, distance)), ray.origin);
            const { matrix, dragAnchor } = calculateDragMatrix(point, this.#rotation, this.#dragOrigin!, metaData?.dragAnchors, point);
            return { distance, transformation: matrix, dragAnchor, point, restriction: this };
        }
        return;
    }

    // #endregion Public Methods (1)

    // #region Protected Methods (1)

    protected visibilityChanged(): void { }

    public setup(node: ITreeNode, ray: IRay, intersection: IIntersection, previousDragMatrix: mat4, dragOrigin?: vec3): RayTraceResult | undefined {
        const cameraDirection = vec3.normalize(vec3.create(), vec3.sub(vec3.create(), this.#viewport.camera!.target, this.#viewport.camera!.position));
        this.#dragPlane = new Plane().setFromNormalAndCoplanarPoint(cameraDirection, intersection.point);

        let invertedPreviousDragMatrix = mat4.invert(mat4.create(), previousDragMatrix);
        if (!invertedPreviousDragMatrix)
            invertedPreviousDragMatrix = mat4.create();

        this.#dragOrigin = dragOrigin ? vec3.transformMat4(vec3.create(), dragOrigin, node.worldMatrix) : vec3.transformMat4(vec3.create(), intersection.point, invertedPreviousDragMatrix);
        this.#node = node;
        return this.rayTrace(ray);
    }
    // #endregion Protected Methods (1)
}

// #endregion Classes (1)
