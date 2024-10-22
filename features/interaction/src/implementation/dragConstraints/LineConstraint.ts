import { IDragConstraint } from '../../interfaces/utils/IDragConstraint';
import { vec3 } from 'gl-matrix';

/**
 * The line constraint is used for dragging and allows the specification of a line along which objects can be dragged.
 * The radius defines in which distance this constraint is being considered to be chosen from the constraints defined.
 * The transformation and optional rotation of this constraint get applied to the node if it is the constraint with the closest distance to the ray that was used for the drag event.
 * As this is a difficult topic, please visit our [help desk section on interactions](https://help.shapediver.com/doc/interactions-part-1) where we go through the process of setting everything up with examples.
 *
 * @deprecated This class is deprecated and will be removed in the future. Please use the `LineRestriction` instead.
 */
export class LineConstraint implements IDragConstraint {
    // #region Properties (4)

    #point1: vec3;
    #point2: vec3;
    #radius: number = 0;
    #rotation: {
        axis: vec3,
        angle: number
    };

    // #endregion Properties (4)

    // #region Constructors (1)

    /**
     * @param _point1 the start point of the line
     * @param _point2 the end point of the line
     * @param _radius the radius in which the line is considered
     * @param _rotation the rotation in [axis-angle representation](https://en.wikipedia.org/wiki/Axis%E2%80%93angle_representation) that is applied to the node if the drag contraint becomes active
     */
    constructor(
        _point1: vec3,
        _point2: vec3,
        _radius: number = 0,
        _rotation?: {
            axis: vec3,
            angle: number
        }
    ) {
        this.#point1 = _point1;
        this.#point2 = _point2;
        this.#radius = _radius;
        this.#rotation = _rotation || { axis: vec3.fromValues(0, 0, 1), angle: 0 };
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (4)

    public get point1(): vec3 {
        return this.#point1;
    }

    public get point2(): vec3 {
        return this.#point2;
    }

    public get radius(): number {
        return this.#radius;
    }

    public get rotation(): { axis: vec3, angle: number } | undefined {
        return this.#rotation;
    }

    // #endregion Public Getters And Setters (4)
}