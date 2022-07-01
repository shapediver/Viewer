export enum EVENTTYPE_CAMERA {
    CAMERA_START = "camera.start",
    CAMERA_MOVE = "camera.move",
    CAMERA_END = "camera.end",
}

export enum EVENTTYPE_RENDERING {
    BEAUTY_RENDERING_FINISHED = "rendering.beautyRenderingFinished"
}

export enum EVENTTYPE_SCENE {
    SCENE_BOUNDING_BOX_CHANGE = "scene.boundingBoxChange"
}

// VIEWPORT
//     FRAMERATE
//     RENDER_INFO
//     RENDER_BEAUTY_START
//     RENDER_BEAUTY_CANCEL
//     RENDER_BEAUTY_END
//     VISIBILITY_ON
//     VISIBILITY_OFF

export enum EVENTTYPE_VIEWPORT {
    BUSY_MODE_ON = "viewport.busy.on",
    BUSY_MODE_OFF = "viewport.busy.off",
    VIEWPORT_CREATED = "viewport.created",
    VIEWPORT_UPDATED = "viewport.updated",
    VIEWPORT_CLOSED = "viewport.closed"
}

export enum EVENTTYPE_SESSION {
    SESSION_CREATED = "session.created",
    SESSION_CUSTOMIZED = "session.customized",
    SESSION_CLOSED = "session.closed",
    SESSION_INITIAL_OUTPUTS_LOADED = 'session.initialOutputsLoaded'
}

export enum EVENTTYPE_TASK {
    TASK_START = "task.start",
    TASK_PROCESS = "task.process",
    TASK_END = "task.end",
    TASK_CANCEL = "task.cancel",
}

export enum EVENTTYPE_INTERACTION {
    DRAG_START = "interaction.drag.start",
    DRAG_MOVE = "interaction.drag.move",
    DRAG_END = "interaction.drag.end",
    HOVER_ON = "interaction.hover.on",
    HOVER_OFF = "interaction.hover.off",	
    SELECT_ON = "interaction.select.on",
    SELECT_OFF = "interaction.select.off",
}

export const EVENTTYPE = { 
    CAMERA: EVENTTYPE_CAMERA, 
    RENDERING: EVENTTYPE_RENDERING, 
    SCENE: EVENTTYPE_SCENE, 
    SESSION: EVENTTYPE_SESSION,
    VIEWPORT: EVENTTYPE_VIEWPORT,
    INTERACTION: EVENTTYPE_INTERACTION,
    TASK: EVENTTYPE_TASK
};

export type MainEventTypes = typeof EVENTTYPE_CAMERA | typeof EVENTTYPE_RENDERING | typeof EVENTTYPE_SCENE | typeof EVENTTYPE_SESSION | typeof EVENTTYPE_VIEWPORT | typeof EVENTTYPE_INTERACTION | typeof EVENTTYPE_TASK;