import {type ITransformationToolsEvent} from "../events/ITransformationToolsEvent";

/**
 * Definition of the rectangleTransform event.
 * These events are sent for rectangleTransform specific events ({@link EVENTTYPE_TRANSFORMATION_TOOLS}).
 */
export interface IRectangleTransformEvent extends ITransformationToolsEvent {
	type: "rectangleTransform";
}
