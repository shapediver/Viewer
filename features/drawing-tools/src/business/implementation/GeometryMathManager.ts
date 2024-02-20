import { DrawingToolsManager } from './DrawingToolsManager';
import { IManager } from '../interfaces/IManager';
import { IRay } from '@shapediver/viewer.features.interaction';
import { vec3 } from 'gl-matrix';

export class GeometryMathManager implements IManager {
    // #region Properties (1)

    readonly #drawingToolsManager: DrawingToolsManager;

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(drawToolsManager: DrawingToolsManager) {
        this.#drawingToolsManager = drawToolsManager;
    }

    // #endregion Constructors (1)

    // #region Public Methods (3)

    /**
     * Check which distances of lines to ray
     * 
     * @param ray 
     * @returns 
     */
    public checkLineDistances(ray: IRay): { index: number[]; distance: number; }[] | undefined {
        const positionArray = this.#drawingToolsManager.geometryManager.positionArray;
        const indicesArrayLines = this.#drawingToolsManager.geometryManager.indicesArrayLines;

        // if there are no line array indices, return
        if (!indicesArrayLines) return;

        /**
         * Calculate line distances to ray
         */
        const distances: {
            index: number[];
            distance: number;
        }[] = [];

        for (let i = 0; i < indicesArrayLines.length; i += 2) {
            const firstIndex = indicesArrayLines.at(i)!;
            const secondIndex = indicesArrayLines.at(i + 1)!;
            const lineStart = vec3.fromValues(positionArray.at(firstIndex * 3)!, positionArray.at(firstIndex * 3 + 1)!, positionArray.at(firstIndex * 3 + 2)!);
            const lineEnd = vec3.fromValues(positionArray.at(secondIndex * 3)!, positionArray.at(secondIndex * 3 + 1)!, positionArray.at(secondIndex * 3 + 2)!);

            const distance = this.rayLineDistance(ray, lineStart, lineEnd);

            if (distance > 1.5) continue;
            distances.push({ index: [firstIndex, secondIndex], distance: distance });
        }

        // if there are no distances, return
        if (distances.length === 0) return;

        return distances.sort((a, b) => a.distance - b.distance);
    }
    
    /**
     * Check which distances of points to ray
     * 
     * @param ray 
     * @returns 
     */
    public checkPointDistances(ray: IRay): {
        index: number;
        distance: number;
    }[] | undefined {
        const positionArray = this.#drawingToolsManager.geometryManager.positionArray;

        /**
         * Calculate point distances to ray
         */
        const distances: {
            index: number;
            distance: number;
        }[] = [];
        for (let i = 0; i < positionArray.length; i += 3) {
            const point = vec3.fromValues(positionArray.at(i)!, positionArray.at(i + 1)!, positionArray.at(i + 2)!);

            // distance from point to ray
            const distance = this.rayPointDistance(ray, point);

            if (distance > 1.5) continue;
            distances.push({ index: i / 3, distance: distance });
        }

        // if there are no distances, return
        if (distances.length === 0) return;

        // sort distances
        return distances.sort((a, b) => a.distance - b.distance);
    }

    public close(): void { }

    // #endregion Public Methods (3)

    // #region Private Methods (2)

    /**
     * Calculate the distance between a ray and a line segment
     * 
     * @param ray 
     * @param lineStart 
     * @param lineEnd 
     * @returns 
     */
    private rayLineDistance(ray: IRay, lineStart: vec3, lineEnd: vec3): number {
        // direction of line
        const lineDirection = vec3.normalize(vec3.create(), vec3.subtract(vec3.create(), lineEnd, lineStart));

        // cross product of ray direction and line direction
        const crossProduct = vec3.cross(vec3.create(), ray.direction, lineDirection);
        
        // length of cross product
        const crossProductLength = vec3.length(crossProduct);

        if (crossProductLength < 0.0001) {
            // ray and line are parallel, calculate the distance differently
            const closestPointOnRay = ray.origin;
            const closestPointOnLine = vec3.add(vec3.create(), lineStart, vec3.scale(vec3.create(), lineDirection, vec3.dot(vec3.subtract(vec3.create(), ray.origin, lineStart), lineDirection)));
            return vec3.distance(closestPointOnRay, closestPointOnLine);
        }

        
        const t = vec3.sub(vec3.create(), lineStart, ray.origin);
        const u = vec3.cross(vec3.create(), t, lineDirection);
        const v = vec3.cross(vec3.create(), t, ray.direction);

        const tValue = vec3.dot(u, crossProduct) / crossProductLength ** 2;
        const uValue = vec3.dot(v, crossProduct) / crossProductLength ** 2;

        const closestPointOnRay = vec3.add(vec3.create(), ray.origin, vec3.scale(vec3.create(), ray.direction, tValue));

        // restrict the closest point on line to the line segment
        let closestPointOnLine: vec3;
        if (uValue < 0) {
            closestPointOnLine = lineStart;
        } else if (uValue > vec3.distance(lineStart, lineEnd)) {
            closestPointOnLine = lineEnd;
        } else {
            closestPointOnLine = vec3.add(vec3.create(), lineStart, vec3.scale(vec3.create(), lineDirection, uValue));
        }
        

        return vec3.distance(closestPointOnRay, closestPointOnLine);
    }

    /**
     * Calculate the distance between a ray and a point
     * 
     * @param ray 
     * @param point 
     * @returns 
     */
    private rayPointDistance(ray: IRay, point: vec3): number {
        // distance from point to ray
        const dot = vec3.dot(ray.direction, vec3.sub(vec3.create(), point, ray.origin));
        // closest point on ray to point
        const closestPoint = vec3.add(vec3.create(), ray.origin, vec3.multiply(vec3.create(), ray.direction, vec3.fromValues(dot, dot, dot)));
        // distance from point to closest point on ray
        return vec3.distance(point, closestPoint);
    }

    // #endregion Private Methods (2)
}