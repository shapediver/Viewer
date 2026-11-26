import {EVENTTYPE_TRANSFORMATION_TOOLS} from "@shapediver/viewer";
import {
	type IRectangleTransformGestureEvent,
	type IRectangleTransformHoverEvent,
} from "../rectangleTransform/IRectangleTransformEvents";
import {type ITransformationToolsEvent} from "./ITransformationToolsEvent";

/**
 * Definition of the event response mapping for transform tools events.
 * This mapping is used to map the event type to the corresponding event interface.
 */
export type EventResponseMapping = {
	[EVENTTYPE_TRANSFORMATION_TOOLS.MATRIX_CHANGED]: ITransformationToolsEvent;
	[EVENTTYPE_TRANSFORMATION_TOOLS.GESTURE_START]: IRectangleTransformGestureEvent;
	[EVENTTYPE_TRANSFORMATION_TOOLS.HOVER_CHANGED]: IRectangleTransformHoverEvent;
};
