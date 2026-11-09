import {type ITreeNode} from "@shapediver/viewer.shared.node-tree";
import {type IViewportEvent} from "@shapediver/viewer.shared.types";
import {type ITransformationToolsEvent} from "../events/ITransformationToolsEvent";

/**
 * Definition of the rectangleTransform event.
 * These events are sent for rectangleTransform specific events (`EVENTTYPE_TRANSFORMATION_TOOLS`).
 */
export interface IRectangleTransformEvent extends ITransformationToolsEvent {
	type: "rectangleTransform";
}

/**
 * Sent with `EVENTTYPE_TRANSFORMATION_TOOLS.GESTURE_START`: a press starts a
 * gesture on a rectangle transform, before the gesture changes anything.
 */
export interface IRectangleTransformGestureEvent extends IViewportEvent {
	/** The pointerdown of the gesture. */
	event: PointerEvent;
	/** The id of the rectangle transform. */
	id: string;
	/** The transformed nodes. */
	nodes: ITreeNode[];
	/**
	 * What the press is on: a scaling or rotation handle, or the plane (also
	 * a transformed object, see `RectangleTransformSettings.translateOnObjects`).
	 */
	target: "handle" | "plane";
	type: "rectangleTransform";
}

/**
 * Sent with `EVENTTYPE_TRANSFORMATION_TOOLS.HOVER_CHANGED` by a preview, see
 * `RectangleTransformSettings.preview`.
 */
export interface IRectangleTransformHoverEvent extends IViewportEvent {
	/** Whether the pointer is over the area of the preview. */
	hovered: boolean;
	/** The id of the rectangle transform. */
	id: string;
	/** The transformed nodes. */
	nodes: ITreeNode[];
	type: "rectangleTransform";
}
