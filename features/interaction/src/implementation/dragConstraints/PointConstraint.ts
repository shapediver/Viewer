import { IDragConstraint } from "../../interfaces/utils/IDragConstraint";
import { IRay, IIntersection } from "@shapediver/viewer.rendering-engine.intersection-engine";
import { ITreeNode, TreeNode } from "@shapediver/viewer.shared.node-tree";
import { mat4, vec3 } from "gl-matrix";
import { IViewportApi } from "@shapediver/viewer";
import { InteractionData } from "../InteractionData";
import { calculateDragMatrix } from "./DragConstraintsHelper";

/**
 * The point constraint is used for dragging and allows to specify the position where an object can be dragged to.
 * The radius defines in which distance this constraint is being considered to be chosen from the constraints defined.
 * The transformation and optional rotation of this constraint get applied to the node if it is the constraint with the closest distance to the ray that was used for the drag event.
 * As this is a difficult topic, please visit our [help desk section on interactions](https://help.shapediver.com/doc/interactions-part-1) where we go through the process of setting everything up with examples.
 */
export class PointConstraint implements IDragConstraint {
    // #region Properties (4)

    #dragOrigin?: vec3;
    #point: vec3;
    #radius: number = 0;
    #rotation: {
        axis: vec3,
        angle: number
    };

    // #endregion Properties (4)

    // #region Constructors (1)

    /**
     * @param _point the point
     * @param _radius the radius in which the point is considered
     * @param _rotation the rotation in [axis-angle representation](https://en.wikipedia.org/wiki/Axis%E2%80%93angle_representation) that is applied to the node if the drag contraint becomes active
     */
    constructor(
        _point: vec3, 
        _radius: number = 0,
        _rotation?: {
            axis: vec3,
            angle: number
        }
    ) {
        this.#point = _point;
        this.#radius = _radius;
        this.#rotation = _rotation || { axis: vec3.fromValues(0,0,1), angle: 0 };
    }

    // #endregion Constructors (1)

    // #region Public Methods (2)

    public intersect(viewport: IViewportApi, node: ITreeNode, ray: IRay): { distance: number, transformation: mat4 } | undefined {
        const closestPoint = vec3.sub(vec3.create(), this.#point, ray.origin);
		const directionDistance = vec3.dot(closestPoint, ray.direction);

		if ( directionDistance < 0 ) {
			vec3.copy(closestPoint, ray.origin);
		} else {
            vec3.multiply(closestPoint, vec3.copy(closestPoint, ray.direction), vec3.fromValues(directionDistance, directionDistance, directionDistance));
            vec3.add(closestPoint, closestPoint, ray.origin);
        }
        
        const distance = vec3.distance(closestPoint, this.#point);
        if (distance < this.#radius) 
            return { distance, transformation: calculateDragMatrix(node, this.#point, this.#rotation, this.#dragOrigin!, closestPoint) };
        return;
    }

    public setup(viewport: IViewportApi, node: ITreeNode, ray: IRay, intersection: IIntersection, previousDragMatrix: mat4): { distance: number, transformation: mat4 } | undefined {       
        const data = <InteractionData>node.data.find(d => d instanceof InteractionData);
        this.#dragOrigin = data && data.dragOrigin ? vec3.transformMat4(vec3.create(), data.dragOrigin!, node.worldMatrix) : vec3.transformMat4(vec3.create(), intersection.point, mat4.invert(mat4.create(), previousDragMatrix));
        return this.intersect(viewport, node, ray);
    }

    // #endregion Public Methods (2)
}