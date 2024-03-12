import { EVENTTYPE_DRAWING_TOOLS } from '@shapediver/viewer';
import { IDrawingToolsEvent } from './IDrawingToolsEvent';

export type InteractionEventResponseMapping = {
    [EVENTTYPE_DRAWING_TOOLS.CANCEL]: IDrawingToolsEvent,
    [EVENTTYPE_DRAWING_TOOLS.FINISH]: IDrawingToolsEvent,
    [EVENTTYPE_DRAWING_TOOLS.INSERTED]: IDrawingToolsEvent,
    [EVENTTYPE_DRAWING_TOOLS.REMOVED]: IDrawingToolsEvent,
    [EVENTTYPE_DRAWING_TOOLS.DRAG_START]: IDrawingToolsEvent,
    [EVENTTYPE_DRAWING_TOOLS.DRAG_MOVE]: IDrawingToolsEvent,
    [EVENTTYPE_DRAWING_TOOLS.DRAG_END]: IDrawingToolsEvent,
}