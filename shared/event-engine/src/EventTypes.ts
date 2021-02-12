export enum CAMERA {
    CAMERA_START = "camera.start",
    CAMERA_MOVE = "camera.move",
    CAMERA_END = "camera.end",
}

export enum EXPORT {
    // EXPORT_AVAILABLE = "export.available",
    // EXPORT_REGISTERED = "export.registered",
    // EXPORT_REGISTEREDBATCH = "export.registeredbatch",
    // EXPORT_UPDATE = "export.update",
    // EXPORT_STATUS = "export.status",
}

export enum HTML {
    // HTML_ANCHORADD = "html.anchoradd",
    // HTML_ANCHORREMOVE = "html.anchorremove",
}

export enum INTERACTION {
    // INTERACTION_DRAGSTART = 'interaction.dragstart',
    // INTERACTION_DRAGMOVE = 'interaction.dragmove',
    // INTERACTION_DRAGEND = 'interaction.dragend',
    // INTERACTION_HOVERON = 'interaction.hoveron',
    // INTERACTION_HOVEROVER = 'interaction.hoverover',
    // INTERACTION_HOVEROFF = 'interaction.hoveroff',
    // INTERACTION_SELECTON = 'interaction.selecton',
    // INTERACTION_SELECTOFF = 'interaction.selectoff',
}

export enum LIGHT {
    LIGHT_ADDED = "light.added",
    LIGHT_REMOVED = "light.removed",
    LIGHT_CHANGED = "light.changed",
    LIGHT_SCENE_ADDED = "light.scene.added",
    LIGHT_SCENE_REMOVED = "light.scene.removed",
    LIGHT_SCENE_CHANGED = "light.scene.changed",
}

export enum PARAMETER {
    // PARAMETER_REGISTERED = "parameter.registered",
    // PARAMETER_REGISTEREDBATCH = "parameter.registeredbatch",
    // PARAMETER_UPDATE = "parameter.update",
    // PARAMETER_VALUEUPDATE = "parameter.valueupdate",
}

export enum RENDERING {
    //RENDERING_FRAMERATE = "rendering.framerate",
}

export enum SCENE {
    // SCENE_VISIBLE = "scene.visible",
    // SCENE_HIDDEN = "scene.hidden",
}

export enum SETTING {
    // SETTING_REGISTERED = "setting.registered",
    // SETTING_UPDATE = "setting.update",
}


export const EVENTTYPE = { 
    CAMERA, 
    EXPORT, 
    HTML, 
    INTERACTION, 
    LIGHT, 
    PARAMETER, 
    RENDERING, 
    SCENE, 
    SETTING
};
export type EVENTTYPE = typeof EVENTTYPE;

export type MAIN_EVENTTYPE = typeof CAMERA | typeof EXPORT | typeof HTML | typeof INTERACTION | typeof LIGHT | typeof PARAMETER | typeof RENDERING | typeof SCENE | typeof SETTING;