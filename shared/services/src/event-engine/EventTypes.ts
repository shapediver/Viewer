// #region Type aliases (1)

export type MainEventTypes = typeof EVENTTYPE_CAMERA | typeof EVENTTYPE_OUTPUT | typeof EVENTTYPE_RENDERING | typeof EVENTTYPE_SCENE | typeof EVENTTYPE_SESSION | typeof EVENTTYPE_PARAMETER | typeof EVENTTYPE_VIEWPORT | typeof EVENTTYPE_INTERACTION | typeof EVENTTYPE_DRAWING_TOOLS | typeof EVENTTYPE_TASK;

// #endregion Type aliases (1)

// #region Enums (10)

/**
 * Event types for all camera events
 * The camera events are used to notify about camera changes, like start, move and end of camera movement.
 * The events that are sent with the camera events are of type {@link ICameraEvent}. The {@link EventResponseMapping} can used to map the event type to the corresponding event interface.
 * 
 * @enum {string}
 */
export enum EVENTTYPE_CAMERA {
    /**
     * The CAMERA_START-event is sent when the camera starts moving.
     */
    CAMERA_START = 'camera.start',
    /**
     * The CAMERA_MOVE-event is sent when the camera moves.
     */
    CAMERA_MOVE = 'camera.move',
    /**
     * The CAMERA_END-event is sent when the camera stops moving.
     */
    CAMERA_END = 'camera.end',
}

/**
 * Event types for all drawing tools events
 * The drawing tools events are used to notify about drawing tools changes, like cancel, finish, update, inserted, removed, drag start, move and end.
 * The events that are sent with the drawing tools events are of type {@link IDrawingToolsEvent}. The {@link EventResponseMapping} can used to map the event type to the corresponding event interface.
 */
export enum EVENTTYPE_DRAWING_TOOLS {
    /**
     * The CANCEL-event is sent when the drawing process has been canceled.
     */
    CANCEL = 'drawing_tools.cancel',
    /**
     * The FINISH-event is sent when the drawing process has been finished.
     */
    FINISH = 'drawing_tools.finish',
    /**
     * The UPDATE-event is sent when the drawing process has been updated.
     */
    UPDATE = 'drawing_tools.update',
    /**
     * The ADDED-event is sent when a point has been added.
     */
    ADDED = 'drawing_tools.added',
    /**
     * The REMOVED-event is sent when a point has been removed.
     */
    REMOVED = 'drawing_tools.removed',
    /**
     * The MOVED-event is sent when a point has been moved.
     */
    MOVED = 'drawing_tools.moved',
    /**
     * The SELECTED-event is sent when a point has been selected.
     */
    SELECTED = 'drawing_tools.selected',
    /**
     * The DESELECTED-event is sent when a point has been deselected.
     */
    DESELECTED = 'drawing_tools.deselected',
    /**
     * The GEOMETRY_CHANGED-event is sent when the geometry has been changed.
     */
    GEOMETRY_CHANGED = 'drawing_tools.geometry.changed',
    /**
     * The DRAG_START-event is sent when the dragging of a point has started.
     */
    DRAG_START = 'drawing_tools.drag.start',
    /**
     * The DRAG_MOVE-event is sent when a point is being dragged.
     */
    DRAG_MOVE = 'drawing_tools.drag.move',
    /**
     * The DRAG_END-event is sent when the dragging of a point has ended.
     */
    DRAG_END = 'drawing_tools.drag.end',
    /**
     * The MINIMUM_POINTS-event is sent when the minimum number of points has not been met.
     */
    MINIMUM_POINTS = 'drawing_tools.minimumPoints',
    /**
     * The MAXIMUM_POINTS-event is sent when the maximum number of points has been exceeded.
     */
    MAXIMUM_POINTS = 'drawing_tools.maximumPoints',
    /**
     * The UNCLOSED_LOOP-event is sent when the loop is not closed, but should be.
     */
    UNCLOSED_LOOP = 'drawing_tools.unclosedLoop',
}

/**
 * Event types for all interaction events
 * The interaction events are used to notify about interaction changes, like drag start, move and end, hover on and off, select on and off.
 * The events that are sent with the interaction events are of type {@link IInteractionEvent}. The {@link EventResponseMapping} can used to map the event type to the corresponding event interface.
 */
export enum EVENTTYPE_INTERACTION {
    /**
     * The DRAG_START-event is sent when the dragging of an object has started.
     */
    DRAG_START = 'interaction.drag.start',
    /**
     * The DRAG_MOVE-event is sent when an object is being dragged.
     */
    DRAG_MOVE = 'interaction.drag.move',
    /**
     * The DRAG_END-event is sent when the dragging of an object has ended.
     */
    DRAG_END = 'interaction.drag.end',
    /**
     * The HOVER_ON-event is sent when an object has been hovered.
     */
    HOVER_ON = 'interaction.hover.on',
    /**
     * The HOVER_OFF-event is sent when an object has been unhovered.
     */
    HOVER_OFF = 'interaction.hover.off',
    /**
     * The SELECT_ON-event is sent when an object has been selected.
     */
    SELECT_ON = 'interaction.select.on',
    /**
     * The SELECT_OFF-event is sent when an object has been deselected.
     */
    SELECT_OFF = 'interaction.select.off',
    /**
     * The MULTI_SELECT_ON-event is sent when multiple objects have been selected.
     */
    MULTI_SELECT_ON = 'interaction.multiSelect.on',
    /**
     * The MULTI_SELECT_OFF-event is sent when multiple objects have been deselected.
     */
    MULTI_SELECT_OFF = 'interaction.multiSelect.off',
    /**
     * The MULTI_SELECT_MAXIMUM_NODES-event is sent when the maximum number of nodes has been selected.
     */
    MULTI_SELECT_MAXIMUM_NODES = 'interaction.multiSelect.maximumNodes',
    /**
     * The MULTI_SELECT_MINIMUM_NODES-event is sent when the minimum number of nodes has not been selected.
     */
    MULTI_SELECT_MINIMUM_NODES = 'interaction.multiSelect.minimumNodes',
}

/**
 * Event types for all output events
 * The output events are used to notify about output changes, like updated outputs.
 * The events that are sent with the output events are of type {@link IOutputEvent}. The {@link EventResponseMapping} can used to map the event type to the corresponding event interface.
 */
export enum EVENTTYPE_OUTPUT {
    /**
     * The OUTPUT_UPDATED-event is sent when an output has been updated.
     */
    OUTPUT_UPDATED = 'output.updated'
}

/**
 * Event types for all parameter events
 * The parameter events are used to notify about parameter changes, like value changes or session value changes.
 * The events that are sent with the parameter events are of type {@link IParameterEvent}. The {@link EventResponseMapping} can used to map the event type to the corresponding event interface.
 */
export enum EVENTTYPE_PARAMETER {
    /**
     * The PARAMETER_VALUE_CHANGED-event is sent when the value of a parameter has changed.
     */
    PARAMETER_VALUE_CHANGED = 'parameter.valueChanged',
    /**
     * The PARAMETER_SESSION_VALUE_CHANGED-event is sent when the session value of a parameter has changed.
     */
    PARAMETER_SESSION_VALUE_CHANGED = 'parameter.sessionValueChanged'
}

/**
 * Event types for all rendering events
 * The rendering events are used to notify about specific rendering events, like the finishing of the beauty rendering.
 * The events that are sent with the rendering events are of type {@link IRenderingEvent}. The {@link EventResponseMapping} can used to map the event type to the corresponding event interface.
 */
export enum EVENTTYPE_RENDERING {
    /**
     * The BEAUTY_RENDERING_FINISHED-event is sent when the beauty rendering has finished.
     */
    BEAUTY_RENDERING_FINISHED = 'rendering.beautyRenderingFinished'
}

/**
 * Event types for all scene events
 * The scene events are used to notify about scene changes, like bounding box changes or empty bounding boxes.
 * The events that are sent with the scene events are of type {@link ISceneEvent}. The {@link EventResponseMapping} can used to map the event type to the corresponding event interface.
 */
export enum EVENTTYPE_SCENE {
    /**
     * The SCENE_BOUNDING_BOX_CHANGE-event is sent when the bounding box of the scene has changed.
     */
    SCENE_BOUNDING_BOX_CHANGE = 'scene.boundingBoxChange',
    /**
     * TheSCENE_BOUNDING_BOX_EMPTY-event is sent when the bounding box of the scene is empty.
     */
    SCENE_BOUNDING_BOX_EMPTY = 'scene.boundingBoxEmpty'
}

/**
 * Event types for all session events
 * The session events are used to notify about session changes, like creation, customization, closing, loading of initial outputs or delayed loading of SDTF.
 * The events that are sent with the session events are of type {@link ISessionEvent}. The {@link EventResponseMapping} can used to map the event type to the corresponding event interface.
 */
export enum EVENTTYPE_SESSION {
    /**
     * The SESSION_CREATED-event is sent when the session has been created.
     */
    SESSION_CREATED = 'session.created',
    /**
     * The SESSION_CUSTOMIZED-event is sent when the session has been customized.
     */
    SESSION_CUSTOMIZED = 'session.customized',
    /**
     * The SESSION_CLOSED-event is sent when the session has been closed.
     */
    SESSION_CLOSED = 'session.closed',
    /**
     * The SESSION_INITIAL_OUTPUTS_LOADED-event is sent when the initial outputs of the session have been loaded.
     */
    SESSION_INITIAL_OUTPUTS_LOADED = 'session.initialOutputsLoaded',
    /**
     * The SESSION_SDTF_DELAYED_LOADED-event is sent when the SDTF of the session has been delayed loaded.
     */
    SESSION_SDTF_DELAYED_LOADED = 'session.sdtfDelayedLoaded',
}

/**
 * Event types for all task events
 * The task events are used to notify about task changes, like start, process, end or cancel of a task.
 * The events that are sent with the task events are of type {@link ITaskEvent}. The {@link EventResponseMapping} can used to map the event type to the corresponding event interface.
 */
export enum EVENTTYPE_TASK {
    /**
     * The TASK_START-event is sent when a task has started.
     */
    TASK_START = 'task.start',
    /**
     * The TASK_PROCESS-event is sent when the process of a task has been updated.
     */
    TASK_PROCESS = 'task.process',
    /**
     * The TASK_END-event is sent when a task has ended.
     */
    TASK_END = 'task.end',
    /**
     * The TASK_CANCEL-event is sent when a task has been canceled.
     */
    TASK_CANCEL = 'task.cancel',
}

/**
 * Event types for all viewport events
 * The viewport events are used to notify about viewport changes, like creation, update, closing, visibility changes or loading of settings.
 * The events that are sent with the viewport events are of type {@link IViewportEvent}. The {@link EventResponseMapping} can used to map the event type to the corresponding event interface.
 */
export enum EVENTTYPE_VIEWPORT {
    /**
     * The BUSY_MODE_ON-event is sent when the busy mode of the viewport has started.
     */
    BUSY_MODE_ON = 'viewport.busy.on',
    /**
     * The BUSY_MODE_OFF-event is sent when the busy mode of the viewport has ended.
     */
    BUSY_MODE_OFF = 'viewport.busy.off',
    /**
     * The VIEWPORT_CREATED-event is sent when the viewport has been created.
     */
    VIEWPORT_CREATED = 'viewport.created',
    /**
     * The VIEWPORT_UPDATED-event is sent when the viewport has been updated.
     */
    VIEWPORT_UPDATED = 'viewport.updated',
    /**
     * The VIEWPORT_CLOSED-event is sent when the viewport has been closed.
     */
    VIEWPORT_CLOSED = 'viewport.closed',
    /**
     * The VIEWPORT_SETTINGS_LOADED-event is sent when the settings of the viewport have been loaded.
     */
    VIEWPORT_SETTINGS_LOADED = 'viewport.settingsLoaded',
    /**
     * The VIEWPORT_VISIBLE-event is sent when the viewport has become visible.
     */
    VIEWPORT_VISIBLE = 'viewport.visible',
    /**
     * The VIEWPORT_HIDDEN-event is sent when the viewport has become hidden.
     */
    VIEWPORT_HIDDEN = 'viewport.hidden',
}

// #endregion Enums (10)

// #region Variables (1)

/**
 * Definition of the event types.
 * These types are used to identify the type of an event in an event object {@link IEvent}.
 * The {@link EventResponseMapping} is used to map the event type to the corresponding event interface.
 */
export const EVENTTYPE = {
    CAMERA: EVENTTYPE_CAMERA,
    OUTPUT: EVENTTYPE_OUTPUT,
    RENDERING: EVENTTYPE_RENDERING,
    SCENE: EVENTTYPE_SCENE,
    SESSION: EVENTTYPE_SESSION,
    PARAMETER: EVENTTYPE_PARAMETER,
    VIEWPORT: EVENTTYPE_VIEWPORT,
    INTERACTION: EVENTTYPE_INTERACTION,
    TASK: EVENTTYPE_TASK,
    DRAWING_TOOLS: EVENTTYPE_DRAWING_TOOLS
};

// #endregion Variables (1)
