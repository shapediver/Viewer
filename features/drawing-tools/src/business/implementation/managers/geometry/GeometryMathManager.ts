import { DrawingToolsManager } from '../../DrawingToolsManager';
import { IManager } from '../../../interfaces/IManager';
import { IRay, IViewportApi } from '@shapediver/viewer.features.interaction';
import { Settings } from '../../../interfaces/IDrawingToolsManager';
import { vec3 } from 'gl-matrix';

export class GeometryMathManager implements IManager {
    // #region Properties (3)

    readonly #drawingToolsManager: DrawingToolsManager;
    readonly #settings: Settings;
    readonly #viewport: IViewportApi;

    // #endregion Properties (3)

    // #region Constructors (1)

    constructor(drawingToolsManager: DrawingToolsManager) {
        this.#drawingToolsManager = drawingToolsManager;
        this.#viewport = drawingToolsManager.viewport;
        this.#settings = drawingToolsManager.settings;
    }

    // #endregion Constructors (1)

    // #region Public Methods (7)

    /**
     * Check which distances of lines to ray
     * 
     * @param ray 
     * @returns 
     */
    public checkLineDistances(ray: IRay): { index: number[]; distance: number; }[] | undefined {
        const positionArray = this.#drawingToolsManager.positionArray;
        const indicesArrayLines = this.#drawingToolsManager.indicesArrayLines;

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

            const { closestPointOnRay, closestPointOnLine } = this.closestPointsRayLine(ray, lineStart, lineEnd);
            if (this.screenSpaceDistanceCheck(closestPointOnRay, closestPointOnLine, this.#settings.visualization.points.size_0! * this.#settings.visualization.distanceMultiplicationFactor).check === false) continue;

            distances.push({ index: [firstIndex, secondIndex], distance: vec3.distance(closestPointOnRay, closestPointOnLine) });
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
        const positionArray = this.#drawingToolsManager.positionArray;

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
            const closestPoint = this.closestPoint(ray, point);
            if (this.screenSpaceDistanceCheck(point, closestPoint, this.#settings.visualization.points.size_0! * this.#settings.visualization.distanceMultiplicationFactor).check === false) continue;

            distances.push({ index: i / 3, distance: vec3.distance(point, closestPoint) });
        }

        // if there are no distances, return
        if (distances.length === 0) return;

        // sort distances
        return distances.sort((a, b) => a.distance - b.distance);
    }

    public close(): void { }

    /**
     * Calculate the closest point on a line to a point
     * 
     * @param start 
     * @param end 
     * @param point 
     */
    public closestPointOnLine(start: vec3, end: vec3, point: vec3): vec3 {
        const lineDir = vec3.sub(vec3.create(), end, start);
        // Vector from linePoint to point
        const v = vec3.sub(vec3.create(), point, start);

        // Line direction dot product with itself
        const dirDotDir = vec3.dot(lineDir, lineDir);

        // If the direction vector is a zero vector, return the line point as closest point
        if (dirDotDir === 0) return start;

        // Projection factor t
        const t = vec3.dot(v, lineDir) / dirDotDir;

        // Closest point on the line
        const closestPoint = vec3.add(vec3.create(), start, vec3.scale(vec3.create(), lineDir, t));

        return closestPoint;
    }

    /**
     * Calculate the distance between a ray and a line segment
     * 
     * @param ray 
     * @param lineStart 
     * @param lineEnd 
     * @returns 
     */
    public closestPointsRayLine(ray: IRay, lineStart: vec3, lineEnd: vec3): { closestPointOnRay: vec3, closestPointOnLine: vec3 } {
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
            return {
                closestPointOnRay, closestPointOnLine
            };
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

        return {
            closestPointOnRay, closestPointOnLine
        };
    }

    /**
     * Calculate the distance between two rays
     * 
     * @param ray1 
     * @param ray2 
     * @returns 
     */
    public closestPointsRayRay(ray1: IRay, ray2: IRay): { closestPointOnRay1: vec3, closestPointOnRay2: vec3 } {
        // cross product of ray1 direction and ray2 direction
        const crossProduct = vec3.cross(vec3.create(), ray1.direction, ray2.direction);

        // length of cross product
        const crossProductLength = vec3.length(crossProduct);

        if (crossProductLength < 0.0001) {
            // ray1 and ray2 are parallel, calculate the distance differently
            const closestPointOnRay1 = ray1.origin;
            const closestPointOnRay2 = vec3.add(vec3.create(), ray2.origin, vec3.scale(vec3.create(), ray2.direction, vec3.dot(vec3.subtract(vec3.create(), ray1.origin, ray2.origin), ray2.direction)));
            return {
                closestPointOnRay1, closestPointOnRay2
            };
        }

        const t = vec3.sub(vec3.create(), ray2.origin, ray1.origin);
        const u = vec3.cross(vec3.create(), t, ray2.direction);
        const v = vec3.cross(vec3.create(), t, ray1.direction);

        const tValue = vec3.dot(u, crossProduct) / crossProductLength ** 2;
        const uValue = vec3.dot(v, crossProduct) / crossProductLength ** 2;

        const closestPointOnRay1 = vec3.add(vec3.create(), ray1.origin, vec3.scale(vec3.create(), ray1.direction, tValue));
        const closestPointOnRay2 = vec3.add(vec3.create(), ray2.origin, vec3.scale(vec3.create(), ray2.direction, uValue));

        return {
            closestPointOnRay1, closestPointOnRay2
        };
    }

    public screenSpaceDistanceCheck(point1: vec3, point2: vec3, threshold: number) {
        const camera = this.#viewport.camera!;

        // Project points to NDC
        const screenPos1 = camera.project(vec3.clone(point1));
        const screenPos2 = camera.project(vec3.clone(point2));

        const width = this.#viewport.canvas.width;
        const height = this.#viewport.canvas.height;

        const x1 = ((screenPos1[0] * (width / 2)) + (width / 2));
        const y1 = - ((screenPos1[1] * (height / 2)) + (height / 2));

        const x2 = ((screenPos2[0] * (width / 2)) + (width / 2));
        const y2 = - ((screenPos2[1] * (height / 2)) + (height / 2));

        const distanceSquared = (x2 - x1) ** 2 + (y2 - y1) ** 2;

        /**
         * Logic: The actual calculation would be
         * distance * 2 < threshold
         * the multiplication by 2 is to account for the fact that the distance is from the center of the point
         * 
         * However, we work with the squared distance to avoid the sqrt operation
         * Therefore we square all values:
         * distanceSquared * 4 < threshold ** 2
         */
        return {
            distanceSquared: distanceSquared,
            check: distanceSquared * 4 < threshold ** 2
        };
    }

    // #endregion Public Methods (7)

    // #region Private Methods (1)

    /**
     * Calculate the closest point on a ray to a point
     * 
     * @param ray 
     * @param point 
     * @returns 
     */
    private closestPoint(ray: IRay, point: vec3): vec3 {
        // distance from point to ray
        const dot = vec3.dot(ray.direction, vec3.sub(vec3.create(), point, ray.origin));
        // closest point on ray to point
        return vec3.add(vec3.create(), ray.origin, vec3.multiply(vec3.create(), ray.direction, vec3.fromValues(dot, dot, dot)));
    }

    // #endregion Private Methods (1)
}