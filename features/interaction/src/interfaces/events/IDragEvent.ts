import {IRestriction} from "@shapediver/viewer.rendering-engine.intersection-restriction-engine";
import {ITreeNode} from "@shapediver/viewer.shared.node-tree";
import {IRay, IViewportEvent} from "@shapediver/viewer.shared.types";
import {mat4, vec3} from "gl-matrix";
import {IDragAnchor} from "../../implementation/InteractionData";
import {IInteractionManager} from "../IInteractionManager";

/**
 * Definition of the drag event.
 * These events are sent for drag specific events ({@link EVENTTYPE_INTERACTION}).
 */
export interface IDragEvent extends IViewportEvent {
	// #region Properties (9)

	/**
	 * The optional drag anchor that was used.
	 */
	dragAnchor?: IDragAnchor;
	/**
	 * The optional drag constraint that was applied.
	 *
	 * @deprecated Use {@link restriction} instead.
	 */
	dragConstraint?: IRestriction;
	/**
	 * The optional drag restriction that was used.
	 */
	restriction?: IRestriction;
	/**
	 * The original event that triggered the dragging. Only provided if it was not a manual dragging.
	 */
	event?: PointerEvent;
	/**
	 * All nodes in the scene tree that share the same groupId and are therefore interacted with at the same time.
	 */
	groupedNodes?: ITreeNode[];
	/**
	 * The intersection point of the ray with the node. Only provided on DRAG_START.
	 */
	intersectionPoint?: vec3;
	/**
	 * The manager that emitted this event.
	 */
	manager: IInteractionManager;
	/**
	 * The transformation matrix that is applied to the dragged node.
	 */
	matrix: mat4;
	/**
	 * The node being dragged.
	 */
	node: ITreeNode;
	/**
	 * The ray of the dragging process. Only provided on DRAG_START and DRAG_MOVE and only if it was not a manual dragging.
	 */
	ray?: IRay;

	// #endregion Properties (9)
}
