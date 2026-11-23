import {type ITreeNode} from "../tree-node/ITreeNode";
import {type IEvent} from "./IEvent";

/**
 * Definition of the viewport event.
 * These events are sent for viewport specific events ({@link EVENTTYPE_VIEWPORT}).
 */
export interface IViewportEvent extends IEvent {
	// #region Properties (1)

	viewportId: string;

	// #endregion Properties (1)
}

/**
 * The nodes of the scene tree that a scene update of a viewport went through.
 */
export interface ISceneChanges {
	/**
	 * The nodes that were converted again by the scene update, parents
	 * before their children. A node whose branch did not change is not in
	 * the list. The list can include a node that is no longer attached to the
	 * tree.
	 */
	readonly nodes: readonly ITreeNode[];
	/**
	 * The ids of the nodes whose converted objects were removed from the
	 * viewport by the scene update, together with those of their descendants.
	 * A node with one of these ids can be attached to the tree again.
	 */
	readonly removedNodeIds: readonly string[];
}

/**
 * Definition of the event that is sent when a viewport has been updated
 * (`EVENTTYPE_VIEWPORT.VIEWPORT_UPDATED`).
 */
export interface IViewportUpdatedEvent extends IViewportEvent {
	// #region Properties (1)

	/**
	 * What the scene update of this viewport went through. The field is
	 * absent if the update went through the whole tree (for example after a
	 * change of the renderer type or of GPU instancing, or the first update
	 * of a viewport), or if no scene update ran for this event. A listener that
	 * keeps data about the scene tree has to read the whole tree then.
	 */
	sceneChanges?: ISceneChanges;

	// #endregion Properties (1)
}
