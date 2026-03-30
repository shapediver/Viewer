import {
	EVENTTYPE_CAMERA,
	EVENTTYPE_OUTPUT,
	EVENTTYPE_PARAMETER,
	EVENTTYPE_RENDERING,
	EVENTTYPE_SCENE,
	EVENTTYPE_SESSION,
	EVENTTYPE_TASK,
	EVENTTYPE_VIEWPORT,
} from "./EventTypes";
import {ICameraEvent} from "./ICameraEvent";
import {IOutputEvent} from "./IOutputEvent";
import {IParameterEvent} from "./IParameterEvent";
import {IRenderingEvent} from "./IRenderingEvent";
import {ISceneEvent} from "./ISceneEvent";
import {ISessionErrorEvent, ISessionEvent} from "./ISessionEvent";
import {ITaskEvent} from "./ITaskEvent";
import {IViewportEvent} from "./IViewportEvent";

/**
 * Definition of the event response mapping.
 * This mapping is used to map the event type to the corresponding event interface.
 */
export type EventResponseMapping = {
	[EVENTTYPE_CAMERA.CAMERA_START]: ICameraEvent;
	[EVENTTYPE_CAMERA.CAMERA_MOVE]: ICameraEvent;
	[EVENTTYPE_CAMERA.CAMERA_END]: ICameraEvent;
	[EVENTTYPE_OUTPUT.OUTPUT_UPDATED]: IOutputEvent;
	[EVENTTYPE_PARAMETER.PARAMETER_VALUE_CHANGED]: IParameterEvent;
	[EVENTTYPE_PARAMETER.PARAMETER_SESSION_VALUE_CHANGED]: IParameterEvent;
	[EVENTTYPE_RENDERING.BEAUTY_RENDERING_FINISHED]: IRenderingEvent;
	[EVENTTYPE_SCENE.SCENE_BOUNDING_BOX_CHANGE]: ISceneEvent;
	[EVENTTYPE_SCENE.SCENE_BOUNDING_BOX_EMPTY]: ISceneEvent;
	[EVENTTYPE_VIEWPORT.BUSY_MODE_ON]: IViewportEvent;
	[EVENTTYPE_VIEWPORT.BUSY_MODE_OFF]: IViewportEvent;
	[EVENTTYPE_VIEWPORT.VIEWPORT_CREATED]: IViewportEvent;
	[EVENTTYPE_VIEWPORT.VIEWPORT_UPDATED]: IViewportEvent;
	[EVENTTYPE_VIEWPORT.VIEWPORT_CLOSED]: IViewportEvent;
	[EVENTTYPE_VIEWPORT.VIEWPORT_VISIBLE]: IViewportEvent;
	[EVENTTYPE_VIEWPORT.VIEWPORT_HIDDEN]: IViewportEvent;
	[EVENTTYPE_VIEWPORT.BUSY_MODE_ON]: IViewportEvent;
	[EVENTTYPE_VIEWPORT.BUSY_MODE_OFF]: IViewportEvent;
	[EVENTTYPE_VIEWPORT.VIEWPORT_SETTINGS_LOADED]: IViewportEvent;
	[EVENTTYPE_SESSION.SESSION_CREATED]: ISessionEvent;
	[EVENTTYPE_SESSION.SESSION_CUSTOMIZED]: ISessionEvent;
	[EVENTTYPE_SESSION.SESSION_CLOSED]: ISessionEvent;
	[EVENTTYPE_SESSION.SESSION_INITIAL_OUTPUTS_LOADED]: ISessionEvent;
	[EVENTTYPE_SESSION.SESSION_SDTF_DELAYED_LOADED]: ISessionEvent;
	[EVENTTYPE_SESSION.SESSION_ERROR]: ISessionErrorEvent;
	[EVENTTYPE_TASK.TASK_START]: ITaskEvent;
	[EVENTTYPE_TASK.TASK_PROCESS]: ITaskEvent;
	[EVENTTYPE_TASK.TASK_END]: ITaskEvent;
	[EVENTTYPE_TASK.TASK_CANCEL]: ITaskEvent;
};
