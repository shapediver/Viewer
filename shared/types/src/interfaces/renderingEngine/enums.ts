// #region Enums (7)

/**
 * Modes used to indicate that a viewport is busy.
 */
export enum BUSY_MODE_DISPLAY {
    /** The viewport will be blurred when a session is busy. */
    BLUR = 'blur',
    /** A spinner will be shown when a session is busy. */
    SPINNER = 'spinner',
    /** Nothing happens when a session is busy. */
    NONE = 'none'
}

/**
   * Types of flags used to influence the render loop.
   */
export enum FLAG_TYPE {
    /** The flag for the busy mode. */
    BUSY_MODE = 'busy_mode',
    /** The flag to freeze the camera. */
    CAMERA_FREEZE = 'camera_freeze',
    /** The flag to continuously render the scene. */
    CONTINUOUS_RENDERING = 'continuous_rendering',
    /** The flag to continuously update the shadow map. */
    CONTINUOUS_SHADOW_MAP_UPDATE = 'continuous_shadow_map_update',
}

export enum RENDERER_TYPE {
    /** The standard rendering engine */
    STANDARD = 'standard',
    /** A basic version of the rendering engine */
    ATTRIBUTES = 'attributes'
}

export enum SPINNER_POSITIONING {
    CENTER = 'center',
    TOP_LEFT = 'top_left',
    TOP_RIGHT = 'top_right',
    BOTTOM_LEFT = 'bottom_left',
    BOTTOM_RIGHT = 'bottom_right',
}

export enum TEXTURE_ENCODING {
    LINEAR = 'linear',
    SRGB = 'srgb',
    RGBE = 'rgbe',
    RGBM7 = 'rgbm7',
    RGBM16 = 'rgbm16',
    RGBD = 'rgbd',
    GAMMA = 'gamma'
}

export enum TONE_MAPPING {
    NONE = 'none',
    LINEAR = 'linear',
    REINHARD = 'reinhard',
    CINEON = 'cineon',
    ACES_FILMIC = 'aces_filmic'
}

export enum VISIBILITY_MODE {
    /** The viewer shows the scene instantly */
    INSTANT = 'instant',
    /** The viewer shows the scene after the first session loading */
    SESSION = 'session',
    /** The viewer is shown once the 'show' property is set to true */
    MANUAL = 'manual'
}

// #endregion Enums (7)
