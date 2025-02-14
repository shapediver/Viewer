import { AbstractRestriction } from '../AbstractRestriction';
import { GeometryMathManager } from '../../GeometryMathManager';
import { IRay } from '@shapediver/viewer.rendering-engine.intersection-engine';
import {
    IRestriction,
    RestrictionMetaData,
    RestrictionPropertiesBase,
    RestrictionResult
} from '../../../interfaces/IRestriction';
import { ISnapRestriction } from '../../../interfaces/ISnapRestriction';
import { ITreeNode, IViewportApi, Sphere } from '@shapediver/viewer';
import { IVisualizationSettings } from '../../../interfaces/IVisualizationSettings';
import { vec3 } from 'gl-matrix';

// #region Type aliases (1)

export interface PointRestrictionProperties extends RestrictionPropertiesBase {
    /**
     * The location of the restriction.
     */
    point: vec3;
    /**
     * The radius in which the restriction is active.
     */
    radius?: number;
}

// #endregion Type aliases (1)

// #region Classes (1)

export class PointRestriction extends AbstractRestriction implements IRestriction {
    // #region Properties (4)

    readonly #viewport: IViewportApi;
    readonly #sphere: Sphere;

    #point: vec3;
    #radius: number;
    #snapRestrictions: { [key: string]: ISnapRestriction } = {};

    // #endregion Properties (4)

    // #region Constructors (1)

    constructor(viewport: IViewportApi, geometryMathManager: GeometryMathManager, parentNode: ITreeNode, id: string, settings: IVisualizationSettings, properties: PointRestrictionProperties) {
        super(viewport, parentNode, id, properties);

        this.#viewport = viewport;
        this.#point = properties.point;
        this.#radius = properties.radius || 0;
        this.#sphere = new Sphere(this.#point, this.#radius);
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (4)

    public get point(): vec3 {
        return this.#point;
    }

    public get radius(): number {
        return this.#radius;
    }

    public get snapRestrictions(): { [key: string]: ISnapRestriction; } {
        return this.#snapRestrictions;
    }

    // #endregion Public Getters And Setters (4)

    // #region Public Methods (1)

    public rayTrace(ray: IRay, metaData?: RestrictionMetaData): RestrictionResult | undefined {
        const distance = this.#sphere.intersect(ray.origin, ray.direction);

        if (distance) {
            const closestPoint = vec3.add(vec3.create(), ray.origin, vec3.scale(vec3.create(), ray.direction, distance));

            return {
                point: this.#point,
                closestPointOnRay: closestPoint,
                restriction: this,
            };
        }
        return;
    }

    // #endregion Public Methods (1)

    // #region Protected Methods (1)

    protected visibilityChanged(): void { }

    // #endregion Protected Methods (1)
}

// #endregion Classes (1)
