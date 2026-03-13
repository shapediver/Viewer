import {ITransformationToolsEvent} from "../events/ITransformationToolsEvent";

/**
 * Definition of the gumball event.
 * These events are sent for gumball specific events ({@link EVENTTYPE_TRANSFORMATION_TOOLS}).
 */
export interface IGumballEvent extends ITransformationToolsEvent {
	type: "gumball";
}
