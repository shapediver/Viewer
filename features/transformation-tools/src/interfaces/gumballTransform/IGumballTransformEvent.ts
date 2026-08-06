import {type ITransformationToolsEvent} from "../events/ITransformationToolsEvent";

/**
 * Definition of the gumballTransform event.
 * These events are sent for gumballTransform specific events (`EVENTTYPE_TRANSFORMATION_TOOLS`).
 */
export interface IGumballTransformEvent extends ITransformationToolsEvent {
	type: "gumball";
}
