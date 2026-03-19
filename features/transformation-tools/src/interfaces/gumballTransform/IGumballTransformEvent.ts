import {ITransformationToolsEvent} from "../events/ITransformationToolsEvent";

/**
 * Definition of the gumballTransform event.
 * These events are sent for gumballTransform specific events ({@link EVENTTYPE_TRANSFORMATION_TOOLS}).
 */
export interface IGumballTransformEvent extends ITransformationToolsEvent {
	type: "gumballTransform";
}
