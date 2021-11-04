import { IDragConstraint } from "../../interfaces/IDragConstraint";
import { IRay, IIntersection } from "@shapediver/viewer.rendering-engine.intersection-engine";
import { TreeNode } from "@shapediver/viewer.shared.node-tree";
import { mat4, vec3 } from "gl-matrix";
import { IViewer } from "@shapediver/viewer";
import { InteractionData } from "../InteractionData";

export class PointConstraint implements IDragConstraint {
    // #region Properties (1)

    private _dragOrigin?: vec3;

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(private readonly _point: vec3, private readonly _radius: number = 0) {}

    // #endregion Constructors (1)

    // #region Public Methods (2)

    public intersect(viewer: IViewer, node: TreeNode, ray: IRay): { distance: number, transformation: mat4 } | undefined {
        const closestPoint = vec3.sub(vec3.create(), this._point, ray.origin);
		const directionDistance = vec3.dot(closestPoint, ray.direction);

		if ( directionDistance < 0 ) {
			vec3.copy(closestPoint, ray.origin);
		} else {
            vec3.multiply(closestPoint, vec3.copy(closestPoint, ray.direction), vec3.fromValues(directionDistance, directionDistance, directionDistance));
            vec3.add(closestPoint, closestPoint, ray.origin);
        }
        
        const distance = vec3.distance(closestPoint, this._point);
        if (distance < this._radius) {
            const data = <InteractionData>node.data.find(d => d instanceof InteractionData);
            if(data && data.dragAnchors.length > 0) {
                const results: {
                    matrix: mat4,
                    transformedPoint: vec3
                }[] = [];
                for(let i = 0; i < data.dragAnchors.length; i++) {
                    const dragTranslation = vec3.sub(vec3.create(), this._point, data.dragAnchors[i].position!);
                    const matrix = mat4.fromTranslation(mat4.create(), dragTranslation)

                    const transformedPoint = vec3.transformMat4(vec3.create(), this._dragOrigin!, matrix);
                    results.push({matrix, transformedPoint})
                }

                results.sort((a, b) => vec3.distance(a.transformedPoint, closestPoint!) - vec3.distance(b.transformedPoint, closestPoint!));
                return { distance, transformation: results[0].matrix };
            } else {
                const dragTranslation = vec3.sub(vec3.create(), this._point, this._dragOrigin!);
                return { distance, transformation: mat4.fromTranslation(mat4.create(), dragTranslation) };
            }
        }
        return;
    }

    public setup(viewer: IViewer, node: TreeNode, ray: IRay, intersection: IIntersection): { distance: number, transformation: mat4 } | undefined {       
        const data = <InteractionData>node.data.find(d => d instanceof InteractionData);
        this._dragOrigin = data && data.dragOrigin ? data.dragOrigin : intersection.point;
        return { distance: intersection.distance, transformation: mat4.create() };
    }

    // #endregion Public Methods (2)
}