export enum CAMERA {
    CAMERA_START = "camera.start",
    CAMERA_MOVE = "camera.move",
    CAMERA_END = "camera.end",
}
export enum ENVIRONMENTMAP {
    ENVIRONMENTMAP_LOADED = "environmentmap.loaded",
}
export enum HTML {
    // HTML_ANCHORADD = "html.anchoradd",
    // HTML_ANCHORREMOVE = "html.anchorremove",
}
export enum INTERACTION {}
export enum LIGHT {
    LIGHT_ADDED = "light.added",
    LIGHT_REMOVED = "light.removed",
    LIGHT_CHANGED = "light.changed",
    LIGHT_SCENE_ADDED = "light.scene.added",
    LIGHT_SCENE_REMOVED = "light.scene.removed",
    LIGHT_SCENE_CHANGED = "light.scene.changed",
}
export enum RENDERING {
    BEAUTY_RENDERING_FINISHED = "rendering.beautyrenderingfinished"
    //RENDERING_FRAMERATE = "rendering.framerate",
}
export enum SCENE {
    SCENE_BOUNDING_BOX_CHANGE = "scene.boundingboxchange"
    // SCENE_VISIBLE = "scene.visible",
    // SCENE_HIDDEN = "scene.hidden",
}
export enum VIEWER {
    VIEWER_CREATED = "viewer.created",
    VIEWER_INITIALIZED = "viewer.initialized",
    VIEWER_UPDATED = "viewer.updated",
    VIEWER_CLOSED = "viewer.closed"
}



export enum EXPORT {
    // EXPORT_AVAILABLE = "export.available",
    // EXPORT_REGISTERED = "export.registered",
    // EXPORT_REGISTEREDBATCH = "export.registeredbatch",
    // EXPORT_UPDATE = "export.update",
    // EXPORT_STATUS = "export.status",
}
export enum PARAMETER {
    // PARAMETER_REGISTERED = "parameter.registered",
    // PARAMETER_REGISTEREDBATCH = "parameter.registeredbatch",
    // PARAMETER_UPDATE = "parameter.update",
    // PARAMETER_VALUEUPDATE = "parameter.valueupdate",
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
    SETTINGS_UPDATE = "settings.update",
}



export const EVENTTYPE = { 
    CAMERA, 
    ENVIRONMENTMAP,
    EXPORT, 
    HTML, 
    INTERACTION, 
    LIGHT, 
    PARAMETER, 
    RENDERING, 
    SCENE, 
    SESSION,
    SETTINGS,
    VIEWER
};
export type EVENTTYPE = typeof EVENTTYPE;

export type MAINEVENTTYPE = typeof CAMERA | typeof ENVIRONMENTMAP | typeof EXPORT | typeof HTML | typeof INTERACTION | typeof LIGHT | typeof PARAMETER | typeof RENDERING | typeof SCENE | typeof SESSION | typeof SETTINGS | typeof VIEWER;