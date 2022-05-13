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

export enum EVENTTYPE_VIEWER {
    BUSY_MODE_ON = "viewer.busy.on",
    BUSY_MODE_OFF = "viewer.busy.off",
    VIEWER_CREATED = "viewer.created",
    VIEWER_UPDATED = "viewer.updated",
    VIEWER_CLOSED = "viewer.closed"
}

export enum EVENTTYPE_SESSION {
    SESSION_CREATED = "session.created",
    SESSION_CUSTOMIZED = "session.customized",
    SESSION_CLOSED = "session.closed",
    SESSION_INITIAL_OUTPUTS_LOADED = 'session.initialOutputsLoaded'
}

export enum EVENTTYPE_SETTINGS {
    SETTINGS_UPDATE = "settings.update",
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

// export 
//     available
//     registered
//     registeredBatch
//     update
//     status

// parameters 
//     registered
//     registeredBatch
//     update
//     value_update

// state 
//     BUSY
//     IDLE
//     MESSAGE
//     FAILED

// VIEWER
//     FRAMERATE
//     RENDER_INFO
//     RENDER_BEAUTY_START
//     RENDER_BEAUTY_CANCEL
//     RENDER_BEAUTY_END
//     VISIBILITY_ON
//     VISIBILITY_OFF

// INTERACTION
//     DRAG_START
//     DRAG_MOVE
//     DRAG_END
//     HOVER_ON
//     HOVER_OVER
//     HOVER_OFF	
//     SELECT_ON
//     SELECT_OFF

export const EVENTTYPE = { 
    CAMERA: EVENTTYPE_CAMERA, 
    RENDERING: EVENTTYPE_RENDERING, 
    SCENE: EVENTTYPE_SCENE, 
    SESSION: EVENTTYPE_SESSION,
    SETTING: EVENTTYPE_SETTINGS,
    VIEWER: EVENTTYPE_VIEWER,
    INTERACTION: EVENTTYPE_INTERACTION,
    TASK: EVENTTYPE_TASK
};

export type MAIN_EVENTTYPE = typeof EVENTTYPE_CAMERA | typeof EVENTTYPE_RENDERING | typeof EVENTTYPE_SCENE | typeof EVENTTYPE_SESSION | typeof EVENTTYPE_SETTINGS | typeof EVENTTYPE_VIEWER | typeof EVENTTYPE_INTERACTION | typeof EVENTTYPE_TASK;