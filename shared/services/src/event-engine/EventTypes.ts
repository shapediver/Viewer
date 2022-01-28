export enum CAMERA {
    CAMERA_START = "camera.start",
    CAMERA_MOVE = "camera.move",
    CAMERA_END = "camera.end",
}

export enum RENDERING {
    BEAUTY_RENDERING_FINISHED = "rendering.beautyRenderingFinished"
}

export enum SCENE {
    SCENE_BOUNDING_BOX_CHANGE = "scene.boundingBoxChange"
}

export enum VIEWER {
    VIEWER_CREATED = "viewer.created",
    VIEWER_UPDATED = "viewer.updated",
    VIEWER_CLOSED = "viewer.closed"
}

export enum SESSION {
    SESSION_CREATED = "session.created",
    SESSION_CUSTOMIZED = "session.customized",
    SESSION_CLOSED = "session.closed",
    SESSION_INITIAL_OUTPUTS_LOADED = 'session.initialOutputsLoaded'
}

export enum SETTINGS {
    SETTINGS_UPDATE = "settings.update",
}

export enum INTERACTION {
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
    CAMERA, 
    RENDERING, 
    SCENE, 
    SESSION,
    SETTINGS,
    VIEWER,
    INTERACTION
};

export type MAINEVENTTYPE = typeof CAMERA | typeof RENDERING | typeof SCENE | typeof SESSION | typeof SETTINGS | typeof VIEWER | typeof INTERACTION;