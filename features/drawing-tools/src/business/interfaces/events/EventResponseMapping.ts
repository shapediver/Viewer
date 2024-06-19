import { EVENTTYPE_DRAWING_TOOLS } from '@shapediver/viewer';
import { IDrawingToolsEvent } from './IDrawingToolsEvent';

export type DrawingToolsEventResponseMapping = {
    [EVENTTYPE_DRAWING_TOOLS.CANCEL]: IDrawingToolsEvent,
    [EVENTTYPE_DRAWING_TOOLS.FINISH]: IDrawingToolsEvent,
    [EVENTTYPE_DRAWING_TOOLS.ADDED]: IDrawingToolsEvent,
    [EVENTTYPE_DRAWING_TOOLS.REMOVED]: IDrawingToolsEvent,
    [EVENTTYPE_DRAWING_TOOLS.MOVED]: IDrawingToolsEvent,
    [EVENTTYPE_DRAWING_TOOLS.GEOMETRY_CHANGED]: IDrawingToolsEvent,
    [EVENTTYPE_DRAWING_TOOLS.SELECTED]: IDrawingToolsEvent,
    [EVENTTYPE_DRAWING_TOOLS.DESELECTED]: IDrawingToolsEvent,
    [EVENTTYPE_DRAWING_TOOLS.DRAG_START]: IDrawingToolsEvent,
    [EVENTTYPE_DRAWING_TOOLS.DRAG_MOVE]: IDrawingToolsEvent,
    [EVENTTYPE_DRAWING_TOOLS.DRAG_END]: IDrawingToolsEvent,
    [EVENTTYPE_DRAWING_TOOLS.MINIMUM_POINTS]: IDrawingToolsEvent,
    [EVENTTYPE_DRAWING_TOOLS.MAXIMUM_POINTS]: IDrawingToolsEvent,
    [EVENTTYPE_DRAWING_TOOLS.UNCLOSED_LOOP]: IDrawingToolsEvent,
}