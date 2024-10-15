import { IInteractionParameterProps } from './IInteractionParameterSettings';
import { vec3 } from 'gl-matrix';

// #region Type aliases (1)

export type DraggingParameterValue = {
    // TODO

    draggedObjects: {
        /** The name of the object as defined in the name filter. */
        name: string,
        /** The transformation matrix of the object after the dragging operation. */
        transformation: number[][],
        /** The id of the drag anchor that was used, if one was used. */
        dragAnchorId?: string,
        /** The id of the constraint that was used. */
        constraintId: string
    }[]
};

/**
 * Rotation defined by an angle and an axis.
 */
export type Rotation = {
    /** The angle of the rotation. */
    angle: number,
    /** The axis of the rotation. */
    axis: vec3
};


// #endregion Type aliases (1)

// #region Interfaces (1)

interface IConstraintDefinition {
    /** The unique id of the constraint. */
    id: string;
    /** The type of the constraint. */
    type: 'point' | 'line' | 'plane' | 'camera_plane';
    /** Optional rotation of the constraint. */
    rotation?: Rotation
}

interface IPointConstraintDefinition extends IConstraintDefinition {
    type: 'point';
    /** The point of the constraint. */
    point: vec3;
    /** The radius of the constraint. */
    radius: number;
}

interface ILineConstraintDefinition extends IConstraintDefinition {
    type: 'line';
    /** The first point of the constraint. */
    point1: vec3;
    /** The second point of the constraint. */
    point2: vec3;
    /** The radius of the constraint. */
    radius: number;
}

interface IPlaneConstraintDefinition extends IConstraintDefinition {
    type: 'plane';
    /** The coplanar point of the constraint. */
    coplanarPoint: vec3;
    /** The normal of the constraint. */
    normal: vec3;
}

interface ICameraPlaneConstraintDefinition extends IConstraintDefinition {
    type: 'camera_plane';
}


/**
 * Properties of a dragging parameter.
 */
export interface IDraggingParameterProps extends IInteractionParameterProps {
    // #region Properties (2)

    /** The color of the objects when dragged. (default: '#0d44f0') */
    draggingColor?: string,
    /**
     * The objects that can be dragged.
     * 
     * For each object, the name filter, the constraints, the drag anchors, and the drag origin can be defined.
     * The name filter is used to filter the objects that can be dragged with the defined settings.
     * This means that multiple objects can be dragged with different settings, but also multiple objects can be dragged with the same settings.
     */
    objects?: {
        /** The name filter for the objects that can be dragged with the defined settings. */
        nameFilter: string[],
        /** The ids of the constraints in the constraints array to apply for these objects. */
        constraints: string[],
        /** 
         * The drag anchors for the object 
         * 
         * The drag anchors can be defined as various points in space that will be transformed according to the node matrix that this data item belongs to.
         * These anchors are used when an object is being dragged instead of the {@link dragOrigin} or the default, the intersection with the node.
         */
        dragAnchors?: {
            /** The id of the anchor */
            id: string,
            /** The position of the anchor */
            position: vec3,
            /** The rotation of the anchor */
            rotation?: Rotation
        }[],
        /**
         * The drag origin of the object.
         * 
         * The drag origin can be defined instead of using the default, the intersection with the node, as a dragging origin.
         * If at least one {@link dragAnchors} is used, this property will be ignored.
         */
        dragOrigin?: vec3
    }[],
    constraints: (IPointConstraintDefinition | ILineConstraintDefinition | IPlaneConstraintDefinition | ICameraPlaneConstraintDefinition)[]

    // #endregion Properties (2)
}

// #endregion Interfaces (1)
