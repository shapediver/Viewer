import {ITreeNode} from "@shapediver/viewer.shared.node-tree";
import {IEvent} from "@shapediver/viewer.shared.services";

/**
 * Definition of the output event.
 * These events are sent for output specific events ({@link EVENTTYPE_OUTPUT}).
 */
export interface IOutputEvent extends IEvent {
	// #region Properties (4)

	/**
	 * The new node of the output.
	 */
	newNode?: ITreeNode;
	/**
	 * The old node of the output.
	 */
	oldNode?: ITreeNode;
	/**
	 * The id of the output.
	 */
	outputId: string;
	/**
	 * The version of the output.
	 */
	outputVersion: string;

	// #endregion Properties (4)
}
