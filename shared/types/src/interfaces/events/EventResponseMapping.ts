import { EVENTTYPE_CAMERA, EVENTTYPE_INTERACTION, EVENTTYPE_RENDERING, EVENTTYPE_SCENE, EVENTTYPE_SESSION, EVENTTYPE_TASK, EVENTTYPE_VIEWPORT } from "@shapediver/viewer.shared.services";
import { ICameraEvent } from "./ICameraEvent";
import { IDragEvent } from "./IDragEvent";
import { IHoverEvent } from "./IHoverEvent";
import { ISceneEvent } from "./ISceneEvent";
import { ISelectEvent } from "./ISelectEvent";
import { ISessionEvent } from "./ISessionEvent";
import { ITaskEvent } from "./ITaskEvent";
import { IViewportEvent } from "./IViewportEvent";

export type EventResponseMapping = {
    [EVENTTYPE_CAMERA.CAMERA_START]: ICameraEvent,
    [EVENTTYPE_CAMERA.CAMERA_MOVE]: ICameraEvent,
    [EVENTTYPE_CAMERA.CAMERA_END]: ICameraEvent,
    [EVENTTYPE_RENDERING.BEAUTY_RENDERING_FINISHED]: IViewportEvent,
    [EVENTTYPE_SCENE.SCENE_BOUNDING_BOX_CHANGE]: ISceneEvent,
    [EVENTTYPE_VIEWPORT.BUSY_MODE_ON]: IViewportEvent,
    [EVENTTYPE_VIEWPORT.BUSY_MODE_OFF]: IViewportEvent,
    [EVENTTYPE_VIEWPORT.VIEWPORT_CREATED]: IViewportEvent,
    [EVENTTYPE_VIEWPORT.VIEWPORT_UPDATED]: IViewportEvent,
    [EVENTTYPE_VIEWPORT.VIEWPORT_CLOSED]: IViewportEvent,
    [EVENTTYPE_SESSION.SESSION_CREATED]: ISessionEvent,
    [EVENTTYPE_SESSION.SESSION_CUSTOMIZED]: ISessionEvent,
    [EVENTTYPE_SESSION.SESSION_CLOSED]: ISessionEvent,
    [EVENTTYPE_SESSION.SESSION_INITIAL_OUTPUTS_LOADED]: ISessionEvent,
    [EVENTTYPE_TASK.TASK_START]: ITaskEvent,
    [EVENTTYPE_TASK.TASK_PROCESS]: ITaskEvent,
    [EVENTTYPE_TASK.TASK_END]: ITaskEvent,
    [EVENTTYPE_TASK.TASK_CANCEL]: ITaskEvent,
    [EVENTTYPE_INTERACTION.DRAG_START]: IDragEvent,
    [EVENTTYPE_INTERACTION.DRAG_MOVE]: IDragEvent,
    [EVENTTYPE_INTERACTION.DRAG_END]: IDragEvent,
    [EVENTTYPE_INTERACTION.HOVER_ON]: IHoverEvent,
    [EVENTTYPE_INTERACTION.HOVER_OFF]: IHoverEvent,
    [EVENTTYPE_INTERACTION.SELECT_ON]: ISelectEvent,
    [EVENTTYPE_INTERACTION.SELECT_OFF]: ISelectEvent,
}