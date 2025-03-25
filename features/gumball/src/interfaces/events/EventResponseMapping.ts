import {EVENTTYPE_GUMBALL} from "@shapediver/viewer";
import {IGumballEvent} from "./IGumballEvent";

/**
 * Definition of the event response mapping for gumball events.
 * This mapping is used to map the event type to the corresponding event interface.
 */
export type GumballEventResponseMapping = {
	[EVENTTYPE_GUMBALL.MATRIX_CHANGED]: IGumballEvent;
};
