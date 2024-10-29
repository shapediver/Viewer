import { IInteractionParameterProps } from './IInteractionParameterSettings';
import { RestrictionDefinition, Rotation } from './IRestrictionSettings';

// #region Type aliases (1)

export type DraggingParameterValue = {
    draggedObjects: {
        /** The name of the object as defined in the name filter. */
        name: string,
        /** The transformation matrix of the object after the dragging operation. */
        transformation: number[],
        /** The id of the drag anchor that was used, if one was used. */
        dragAnchorId?: string,
        /** The id of the restriction that was used. */
        restrictionId: string
    }[]
};

// #endregion Type aliases (1)

// #region Interfaces (2)

/**
 * Properties of a draggable object.
 */
export interface IDraggableObject {
    // #region Properties (4)

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
        position: number[],
        /** The rotation of the anchor */
        rotation?: Rotation
    }[],
    /**
     * The drag origin of the object.
     * 
     * The drag origin can be defined instead of using the default, the intersection with the node, as a dragging origin.
     * If at least one {@link dragAnchors} is used, this property will be ignored.
     */
    dragOrigin?: number[]
    /** The name filter for the objects that can be dragged with the defined settings. */
    nameFilter: string,
    /** The ids of the restrictions in the restrictions array to apply for these objects. */
    restrictions: string[],

    // #endregion Properties (4)
}

/**
 * Properties of a dragging parameter.
 */
export interface IDraggingParameterProps extends IInteractionParameterProps {
    // #region Properties (3)

    /** The color of the objects when dragged. (default: '#0d44f0') */
    draggingColor?: string,
    /**
     * The objects that can be dragged.
     * 
     * For each object, the name filter, the restrictions, the drag anchors, and the drag origin can be defined.
     * The name filter is used to filter the objects that can be dragged with the defined settings.
     * This means that multiple objects can be dragged with different settings, but also multiple objects can be dragged with the same settings.
     */
    objects?: IDraggableObject[],
    restrictions?: RestrictionDefinition[]

    // #endregion Properties (3)
}

// #endregion Interfaces (2)
