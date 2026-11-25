// #region Enums (8)

/**
 * Modes used to indicate that a viewport is busy.
 */
export enum BUSY_MODE_DISPLAY {
	/** The viewport will be blurred when a session is busy. */
	BLUR = "blur",
	/** A spinner will be shown when a session is busy. */
	SPINNER = "spinner",
	/** Nothing happens when a session is busy. */
	NONE = "none",
}

/**
 * Types of flags used to influence the render loop.
 */
export enum FLAG_TYPE {
	/** The flag for the busy mode. */
	BUSY_MODE = "busy_mode",
	/** The flag to freeze the camera. */
	CAMERA_FREEZE = "camera_freeze",
	/** The flag to continuously render the scene. */
	CONTINUOUS_RENDERING = "continuous_rendering",
	/** The flag to continuously update the shadow map. */
	CONTINUOUS_SHADOW_MAP_UPDATE = "continuous_shadow_map_update",
	/** The flag to suspend updates of the scene until the flag is removed. */
	SUSPEND_SCENE_UPDATES = "suspend_scene_updates",
}

export enum RENDERER_TYPE {
	/** The standard rendering engine */
	STANDARD = "standard",
	/** A basic version of the rendering engine */
	ATTRIBUTES = "attributes",
}

export enum ENVIRONMENT_MAP_PBR_MODE {
	/** Use the legacy three.js r162 environment-map roughness mixing for PBR materials. */
	LEGACY = "legacy",
	/** Use the current three.js environment-map roughness mixing for PBR materials. */
	MODERN = "modern",
}

export enum ENVIRONMENT_MAP_ORIENTATION {
	/** The orientation of earlier Viewer versions: custom .hdr maps are turned a quarter turn around the vertical axis compared to three.js. */
	LEGACY = "legacy",
	/** Custom .hdr maps have the same orientation as in three.js and other tools that use the same file. Built-in presets keep their orientation. */
	THREEJS = "threejs",
}

export enum ENVIRONMENT_MAP_FILTERING {
	/** The prefiltering of current three.js: the blurred levels of the environment map are filtered with GGX importance sampling. */
	GGX = "ggx",
	/** The prefiltering of three.js r160 and older: the blurred levels of the environment map are filtered with a Gaussian blur. Polished metal on thin, curved parts reflects a slightly brighter environment, matching renderers on older three.js. */
	GAUSSIAN = "gaussian",
}

export enum SPINNER_POSITIONING {
	CENTER = "center",
	TOP_LEFT = "top_left",
	TOP_RIGHT = "top_right",
	BOTTOM_LEFT = "bottom_left",
	BOTTOM_RIGHT = "bottom_right",
}

export enum TEXTURE_ENCODING {
	LINEAR = "linear",
	SRGB = "srgb",
	RGBE = "rgbe",
	RGBM7 = "rgbm7",
	RGBM16 = "rgbm16",
	RGBD = "rgbd",
	GAMMA = "gamma",
}

export enum TONE_MAPPING {
	NONE = "none",
	LINEAR = "linear",
	REINHARD = "reinhard",
	CINEON = "cineon",
	ACES_FILMIC = "aces_filmic",
	AGX = "agx",
	NEUTRAL = "neutral",
}

export enum VISIBILITY_MODE {
	/** The viewport shows the scene instantly */
	INSTANT = "instant",
	/** The viewport shows the scene after the first session loading */
	SESSION = "session",
	/** The viewport is shown once the 'show' property is set to true */
	MANUAL = "manual",
	/** The viewport is shown after all the sessions in the property 'visibilitySessionIds' are loaded */
	SESSIONS = "sessions",
}

// #endregion Enums (7)
