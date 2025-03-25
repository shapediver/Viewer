import {ITreeNode} from "@shapediver/viewer.shared.node-tree";
import {IRay, IViewportEvent} from "@shapediver/viewer.shared.types";
import {vec3} from "gl-matrix";
import {IInteractionManager} from "../IInteractionManager";

/**
 * Definition of the hover event.
 * These events are sent for hover specific events ({@link EVENTTYPE_INTERACTION}).
 */
export interface IHoverEvent extends IViewportEvent {
	// #region Properties (6)

	/**
	 * The original event that triggered the hovering. Only provided if it was not a manual hovering.
	 */
	event?: PointerEvent;
	/**
	 * All nodes in the scene tree that share the same groupId and are therefore interacted with at the same time.
	 */
	groupedNodes?: ITreeNode[];
	/**
	 * The intersection point of the ray with the node. Only provided on HOVER_ON.
	 */
	intersectionPoint?: vec3;
	/**
	 * The manager that emitted this event.
	 */
	manager: IInteractionManager;
	/**
	 * The node being hovered.
	 */
	node: ITreeNode;
	/**
	 * The ray of the hover process. Only provided on HOVER_ON and only if it was not a manual hovering.
	 */
	ray?: IRay;

	// #endregion Properties (6)
}
