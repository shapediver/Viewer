import {type ITreeNode} from "@shapediver/viewer.shared.node-tree";
import {type IRay, type IViewportEvent} from "@shapediver/viewer.shared.types";
import {vec3} from "gl-matrix";
import {type IInteractionManager} from "../IInteractionManager";

/**
 * Definition of the select event.
 * These events are sent for select specific events ({@link EVENTTYPE_INTERACTION}).
 */
export interface ISelectEvent extends IViewportEvent {
	// #region Properties (6)

	/**
	 * The original event that triggered the selection. Only provided if it was not a manual selection.
	 */
	event?: PointerEvent;
	/**
	 * All nodes in the scene tree that share the same groupId and are therefore interacted with at the same time.
	 */
	groupedNodes?: ITreeNode[];
	/**
	 * The intersection point of the ray with the node. Only provided on SELECT_ON.
	 */
	intersectionPoint?: vec3;
	/**
	 * The manager that emitted this event.
	 */
	manager: IInteractionManager;
	/**
	 * The node being selected.
	 */
	node: ITreeNode;
	/**
	 * The ray of the selection process. Only provided on SELECT_ON and only if it was not a manual selection.
	 */
	ray?: IRay;
	/**
	 * If the deselection happened due to another selection.
	 */
	reselection?: boolean;

	// #endregion Properties (6)
}
