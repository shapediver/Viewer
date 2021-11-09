import { IDragConstraint } from "../../interfaces/utils/IDragConstraint";
import { IRay, IIntersection } from "@shapediver/viewer.rendering-engine.intersection-engine";
import { TreeNode } from "@shapediver/viewer.shared.node-tree";
import { mat4, vec3 } from "gl-matrix";
import { IViewer } from "@shapediver/viewer";
import { InteractionData } from "../InteractionData";
import { calculateDragMatrix } from "./DragConstraintsHelper";
import { container } from "tsyringe";

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

    public intersect(viewer: IViewer, node: TreeNode, ray: IRay): { distance: number, transformation: mat4 } | undefined {
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

    public setup(viewer: IViewer, node: TreeNode, ray: IRay, intersection: IIntersection): { distance: number, transformation: mat4 } | undefined {       
        const data = <InteractionData>node.data.find(d => d instanceof InteractionData);
        this.#dragOrigin = data && data.dragOrigin ? data.dragOrigin : intersection.point;
        return this.intersect(viewer, node, ray);
    }

    // #endregion Public Methods (2)
}