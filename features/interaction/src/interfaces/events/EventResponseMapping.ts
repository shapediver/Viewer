import { EVENTTYPE_INTERACTION } from '@shapediver/viewer';
import { IDragEvent } from './IDragEvent';
import { IHoverEvent } from './IHoverEvent';
import { IMultiSelectEvent } from './IMultiSelectEvent';
import { ISelectEvent } from './ISelectEvent';

/**
 * Definition of the event response mapping for interaction events.
 * This mapping is used to map the event type to the corresponding event interface.
 */
export type InteractionEventResponseMapping = {
    [EVENTTYPE_INTERACTION.DRAG_START]: IDragEvent,
    [EVENTTYPE_INTERACTION.DRAG_MOVE]: IDragEvent,
    [EVENTTYPE_INTERACTION.DRAG_END]: IDragEvent,
    [EVENTTYPE_INTERACTION.HOVER_ON]: IHoverEvent,
    [EVENTTYPE_INTERACTION.HOVER_OFF]: IHoverEvent,
    [EVENTTYPE_INTERACTION.SELECT_ON]: ISelectEvent | IMultiSelectEvent,
    [EVENTTYPE_INTERACTION.SELECT_OFF]: ISelectEvent | IMultiSelectEvent,
}