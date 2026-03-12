import {EVENTTYPE_TRANSFORM_CONTROLS} from "@shapediver/viewer";
import {ITransformControlsEvent} from "./ITransformControlsEvent";

/**
 * Definition of the event response mapping for transform controls events.
 * This mapping is used to map the event type to the corresponding event interface.
 */
export type EventResponseMapping = {
	[EVENTTYPE_TRANSFORM_CONTROLS.MATRIX_CHANGED]: ITransformControlsEvent;
};
