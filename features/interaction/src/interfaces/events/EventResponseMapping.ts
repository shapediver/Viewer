import {EVENTTYPE_INTERACTION} from "@shapediver/viewer";
import {IDragEvent} from "./IDragEvent";
import {IHoverEvent} from "./IHoverEvent";
import {IMultiSelectEvent} from "./IMultiSelectEvent";
import {ISelectEvent} from "./ISelectEvent";

/**
 * Definition of the event response mapping for interaction events.
 * This mapping is used to map the event type to the corresponding event interface.
 */
export type InteractionEventResponseMapping = {
	[EVENTTYPE_INTERACTION.DRAG_START]: IDragEvent;
	[EVENTTYPE_INTERACTION.DRAG_MOVE]: IDragEvent;
	[EVENTTYPE_INTERACTION.DRAG_END]: IDragEvent;
	[EVENTTYPE_INTERACTION.HOVER_ON]: IHoverEvent;
	[EVENTTYPE_INTERACTION.HOVER_OFF]: IHoverEvent;
	[EVENTTYPE_INTERACTION.SELECT_ON]: ISelectEvent;
	[EVENTTYPE_INTERACTION.SELECT_OFF]: ISelectEvent;
	[EVENTTYPE_INTERACTION.MULTI_SELECT_ON]: IMultiSelectEvent;
	[EVENTTYPE_INTERACTION.MULTI_SELECT_OFF]: IMultiSelectEvent;
	[EVENTTYPE_INTERACTION.MULTI_SELECT_MAXIMUM_NODES]: IMultiSelectEvent;
	[EVENTTYPE_INTERACTION.MULTI_SELECT_MINIMUM_NODES]: IMultiSelectEvent;
};
