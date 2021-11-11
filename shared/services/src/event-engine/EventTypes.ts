export enum CAMERA {
    CAMERA_START = "camera.start",
    CAMERA_MOVE = "camera.move",
    CAMERA_END = "camera.end",
}
export enum ENVIRONMENTMAP {
    ENVIRONMENTMAP_LOADED = "environmentmap.loaded",
}
export enum RENDERING {
    BEAUTY_RENDERING_FINISHED = "rendering.beautyrenderingfinished"
}
export enum SCENE {
    SCENE_BOUNDING_BOX_CHANGE = "scene.boundingboxchange"
}
export enum VIEWER {
    VIEWER_CREATED = "viewer.created",
    VIEWER_INITIALIZED = "viewer.initialized",
    VIEWER_UPDATED = "viewer.updated",
    VIEWER_CLOSED = "viewer.closed"
}

export enum SESSION {
    SESSION_CREATED = "session.created",
    SESSION_INITIALIZED = "session.initialized",
    SESSION_LOADED = "session.loaded",
    SESSION_CUSTOMIZED = "session.customized",
    SESSION_INITIAL_OUTPUTS_LOADED = "session.initialOutputsLoaded",
    SESSION_CLOSED = "session.closed"
}
export enum SETTINGS {
    SETTINGS_REGISTERED = "settings.registered",
    SETTINGS_REGISTERED_EXTERNAL = "settings.registered.external",
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
    ENVIRONMENTMAP,
    RENDERING, 
    SCENE, 
    SESSION,
    SETTINGS,
    VIEWER,
    INTERACTION
};

export type MAINEVENTTYPE = typeof CAMERA | typeof ENVIRONMENTMAP | typeof RENDERING | typeof SCENE | typeof SESSION | typeof SETTINGS | typeof VIEWER | typeof INTERACTION;