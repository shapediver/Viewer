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
import { ITreeNode, IViewportApi } from '@shapediver/viewer';
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
            return {
                distance,
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
