import { AbstractRestriction } from '../AbstractRestriction';
import { GeometryMathManager } from '../../GeometryMathManager';
import { IRay } from '@shapediver/viewer.shared.types';
import {
    IRestriction,
    RESTRICTION_TYPE,
    RestrictionMetaData,
    RestrictionPropertiesBase,
    RestrictionResult
} from '../../../interfaces/IRestriction';
import { ISnapRestriction } from '../../../interfaces/ISnapRestriction';
import { ITreeNode } from '@shapediver/viewer.shared.node-tree';
import { IViewportApi } from '@shapediver/viewer';
import { IVisualizationSettings } from '../../../interfaces/IVisualizationSettings';
import { vec3 } from 'gl-matrix';
import { PointRestriction } from '../point/PointRestriction';

// #region Type aliases (1)

export interface LineRestrictionProperties extends RestrictionPropertiesBase {
    /**
     * The first point of the line.
     */
    point1: vec3;
    /**
     * The second point of the line.
     */
    point2: vec3;
    /**
     * The radius in which the restriction is active.
     */
    radius?: number;
    /**
     * The radius of the first point.
     */
    point1Radius?: number;
    /**
     * The radius of the second point.
     */
    point2Radius?: number;
}

// #endregion Type aliases (1)

// #region Classes (1)

export class LineRestriction extends AbstractRestriction implements IRestriction {
    // #region Properties (7)

    readonly #viewport: IViewportApi;

    #dragLineLength: number;
    #dragRay: IRay;
    #point1: vec3;
    #point1Restriction: PointRestriction | undefined;
    #point2: vec3;
    #point2Restriction: PointRestriction | undefined;
    #radius: number;
    #snapRestrictions: { [key: string]: ISnapRestriction } = {};

    // #endregion Properties (7)

    // #region Constructors (1)

    constructor(viewport: IViewportApi, geometryMathManager: GeometryMathManager, parentNode: ITreeNode, id: string, settings: IVisualizationSettings, properties: LineRestrictionProperties) {
        super(viewport, parentNode, id, properties);

        this.#viewport = viewport;
        this.#point1 = properties.point1;
        this.#point2 = properties.point2;
        this.#radius = properties.radius || 0;
        if (properties.point1Radius !== undefined) {
            this.#point1Restriction = new PointRestriction(viewport,
                geometryMathManager,
                parentNode,
                id,
                settings,
                {
                    type: RESTRICTION_TYPE.POINT,
                    point: properties.point1,
                    radius: properties.point1Radius
                });
        }
        if (properties.point2Radius !== undefined) {
            this.#point2Restriction = new PointRestriction(viewport,
                geometryMathManager,
                parentNode,
                id,
                settings,
                {
                    type: RESTRICTION_TYPE.POINT,
                    point: properties.point2,
                    radius: properties.point2Radius
                });
        }

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

    public get point1Restriction(): PointRestriction | undefined {
        return this.#point1Restriction;
    }

    public get point2(): vec3 {
        return this.#point2;
    }

    public get point2Restriction(): PointRestriction | undefined {
        return this.#point2Restriction;
    }

    public get radius(): number {
        return this.#radius;
    }

    public get snapRestrictions(): { [key: string]: ISnapRestriction; } {
        return this.#snapRestrictions;
    }

    // #endregion Public Getters And Setters (5)

    // #region Public Methods (1)

    public isWithinRadius(point: vec3): boolean {
        // Check distance from point to the start of the cylinder
        const distance = vec3.squaredDistance(point, this.#point1);
        const squaredRadius1 = this.#point1Restriction?.radius ?
            this.#radius > this.#point1Restriction.radius ? this.#radius * this.#radius : this.#point1Restriction.radius * this.#point1Restriction.radius
            : this.#radius * this.#radius;
        if (distance < squaredRadius1) {
            return true;
        }

        // Check distance from point to the end of the cylinder
        const distance2 = vec3.squaredDistance(point, this.#point2);
        const squaredRadius2 = this.#point2Restriction?.radius ?
            this.#radius > this.#point2Restriction.radius ? this.#radius * this.#radius : this.#point2Restriction.radius * this.#point2Restriction.radius
            : this.#radius * this.#radius;
        if (distance2 < squaredRadius2) {
            return true;
        }

        // Calculate the closest point on the line segment (between point1 and point2)
        const lineDir = vec3.sub(vec3.create(), this.#point2, this.#point1); // Direction of the line segment
        const lineLengthSquared = vec3.squaredLength(lineDir);

        // Project the point onto the line (scaled projection)
        const projection = vec3.dot(vec3.sub(vec3.create(), point, this.#point1), lineDir) / lineLengthSquared;

        // Clamp the projection value to ensure it's within the line segment
        const clampedProjection = Math.max(0, Math.min(1, projection));

        // Calculate the closest point on the segment
        const closestPointOnLine = vec3.scaleAndAdd(vec3.create(), this.#point1, lineDir, clampedProjection);

        // Check if the point is within the radius of the line
        const distance3 = vec3.squaredDistance(point, closestPointOnLine);
        if (distance3 < this.#radius * this.#radius) {
            return true;
        }

        // If all checks fail, return false
        return false;
    }

    public rayTrace(ray: IRay, metaData?: RestrictionMetaData): RestrictionResult | undefined {
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

        // first, check the simple cases
        // if there the restrictions for the points are set, we need to check them
        const result1 = this.#point1Restriction ? this.#point1Restriction.rayTrace(ray) : undefined;
        const result2 = this.#point2Restriction ? this.#point2Restriction.rayTrace(ray) : undefined;

        // return the closest result
        if (result1 || result2) {
            if (result1 && result2) {
                if (result1.distanceOriginToClosestIntersectionPointSquared < result2.distanceOriginToClosestIntersectionPointSquared) {
                    return result1;
                }
                return result2;
            }
            return result1 || result2;
        }

        const distance = vec3.squaredDistance(pointA, pointB);
        if (distance < this.#radius * this.#radius) {
            // check if origin is inside the cylinder
            const distanceOrigin = vec3.squaredDistance(ray.origin, pointB);
            if (distanceOrigin < this.#radius * this.#radius) {
                return {
                    closestIntersectionPoint: pointA,
                    distanceOriginToClosestIntersectionPointSquared: vec3.sqrDist(ray.origin, pointA),
                    targetPoint: pointB,
                    distanceClosestPointToTargetPointSquared: distance,
                    restriction: this
                };
            }

            // now we calculate the closest point on the cylinder to the ray
            const offset = Math.sqrt(this.#radius * this.#radius - distance);
            // Compute the entry distance
            const entry = da - offset;
            const closestIntersectionPoint = vec3.scaleAndAdd(vec3.create(), ray.origin, ray.direction, entry);

            return {
                closestIntersectionPoint,
                distanceOriginToClosestIntersectionPointSquared: entry * entry,
                targetPoint: pointB,
                distanceClosestPointToTargetPointSquared: distance,
                restriction: this
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
