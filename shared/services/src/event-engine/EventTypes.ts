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
    SESSION_CLOSED = "session.closed"
}
export enum SETTINGS {
    SETTINGS_REGISTERED = "settings.registered",
    SETTINGS_REGISTERED_EXTERNAL = "settings.registered.external",
    SETTINGS_UPDATE = "settings.update",
}



export const EVENTTYPE = { 
    CAMERA, 
    ENVIRONMENTMAP,
    RENDERING, 
    SCENE, 
    SESSION,
    SETTINGS,
    VIEWER
};
export type EVENTTYPE = typeof EVENTTYPE;

export type MAINEVENTTYPE = typeof CAMERA | typeof ENVIRONMENTMAP | typeof RENDERING | typeof SCENE | typeof SESSION | typeof SETTINGS | typeof VIEWER;