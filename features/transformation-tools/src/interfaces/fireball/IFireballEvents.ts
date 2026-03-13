import {ITransformationToolsEvent} from "../events/ITransformationToolsEvent";

/**
 * Definition of the fireball event.
 * These events are sent for fireball specific events ({@link EVENTTYPE_TRANSFORMATION_TOOLS}).
 */
export interface IFireballEvent extends ITransformationToolsEvent {
	type: "fireball";
}
