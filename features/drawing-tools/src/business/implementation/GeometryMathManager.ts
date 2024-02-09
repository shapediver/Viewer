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

    // #region Public Methods (2)

    /**
     * check which distances of points to ray
     */
    public checkDistances(ray: IRay, positionArray: Float32Array): {
        index: number;
        distance: number;
    }[] | undefined {
        const distances: {
            index: number;
            distance: number;
        }[] = [];
        for (let i = 0; i < positionArray.length; i += 3) {
            const point = vec3.fromValues(positionArray.at(i)!, positionArray.at(i + 1)!, positionArray.at(i + 2)!);
            // distance from point to ray
            const dot = vec3.dot(ray.direction, vec3.sub(vec3.create(), point, ray.origin));
            // closest point on ray to point
            const closestPoint = vec3.add(vec3.create(), ray.origin, vec3.multiply(vec3.create(), ray.direction, vec3.fromValues(dot, dot, dot)));
            // distance from point to closest point on ray
            const distance = vec3.distance(point, closestPoint);

            if (distance > 1) continue;
            distances.push({ index: i / 3, distance: distance });
        }

        // get lowest distance value key
        if (distances.length === 0) return;
        // sort distances
        return distances.sort((a, b) => a.distance - b.distance);
    }

    public close(): void { }

    // #endregion Public Methods (2)
}