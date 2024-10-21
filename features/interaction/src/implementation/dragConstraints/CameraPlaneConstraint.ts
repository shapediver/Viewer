import { IDragAnchor } from '../InteractionData';
import { IDragConstraint } from '../../interfaces/utils/IDragConstraint';
import { IIntersection, IRay } from '@shapediver/viewer.rendering-engine.intersection-engine';
import { IPlane } from '@shapediver/viewer.shared.math';
import { ITreeNode } from '@shapediver/viewer.shared.node-tree';
import { IViewportApi } from '@shapediver/viewer';
import { mat4, vec3 } from 'gl-matrix';

/**
 * The camera plane constraint is used for dragging and allows to specify that the dragging happens on a plane parallel to the camera plane that passes through the origin of the node being dragged.
 * The transformation and optional rotation of this constraint get applied to the node if it is the constraint with the closest distance to the ray that was used for the drag event.
 * As this is a difficult topic, please visit our [help desk section on interactions](https://help.shapediver.com/doc/interactions-part-1) where we go through the process of setting everything up with examples.
 */
export class CameraPlaneConstraint implements IDragConstraint {
    // #region Properties (3)

    #dragOrigin?: vec3;
    #dragPlane?: IPlane;
    #rotation: { axis: vec3; angle: number; };

    // #endregion Properties (3)

    // #region Constructors (1)

    /**
     * @param _rotation the rotation in [axis-angle representation](https://en.wikipedia.org/wiki/Axis%E2%80%93angle_representation) that is applied to the node if the drag constraint becomes active
     */
    constructor(
        _rotation?: {
            axis: vec3,
            angle: number
        }
    ) {
        console.warn('The CameraPlaneConstraint is deprecated and will be removed in the future.');
        this.#rotation = _rotation || { axis: vec3.fromValues(0, 0, 1), angle: 0 };
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (1)

    public get rotation(): { axis: vec3, angle: number } | undefined {
        return this.#rotation;
    }

    // #endregion Public Getters And Setters (1)

    // #region Public Methods (2)

    public intersect(viewport: IViewportApi, node: ITreeNode, ray: IRay): { distance: number, transformation: mat4, dragAnchor?: IDragAnchor } | undefined {
        return;
    }

    public setup(viewport: IViewportApi, node: ITreeNode, ray: IRay, intersection: IIntersection, previousDragMatrix: mat4): { distance: number, transformation: mat4, dragAnchor?: IDragAnchor } | undefined {
        return this.intersect(viewport, node, ray);
    }

    // #endregion Public Methods (2)
}