import { DomEventEngine, SettingsEngine } from '@shapediver/viewer.shared.services'

export enum RENDERER_TYPE {
  /** The standard rendering engine */
  STANDARD = 'standard',
  /** A basic version of the rendering engine */
  ATTRIBUTES = 'attributes'
}

export enum VISIBILITY_MODE {
  /** The viewer shows the scene instantly */
  INSTANT = 'instant',
  /** The viewer shows the scene after the first session loading */
  SESSION = 'session',
  /** The viewer is shown once the 'show' property is set to true */
  MANUAL = 'manual'
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

export enum BUSY_MODE_DISPLAY {
  /** The viewport will be blurred when a session is busy. */
  BLUR = 'blur',
  /** A spinner will be shown when a session is busy. */
  SPINNER = 'spinner',
  /** Nothing happens when a session is busy. */
  NONE = 'none'
};

export enum SESSION_SETTINGS_MODE {
  /** No settings of a session will be used. */
  NONE = 'none',
  /** The first created session will be used for the settings of the viewport. */
  FIRST = 'first',
  /** The next created session will be used for the settings of the viewport. */
  NEXT = 'next',
  /** The previous created session will be used for the settings of the viewport. */
  PREVIOUS = 'previous',
  /** The previous created session will be used for the settings of the viewport. */
  MANUAL = 'manual',
};

export enum FLAG_TYPE {
  /** The flag to freeze the camera. */
  CAMERA_FREEZE = 'camera_freeze',
  /** The flag to continuously render the scene. */
  CONTINUOUS_RENDERING = 'continuous_rendering',
  /** The flag to continuously update the shadow map. */
  CONTINUOUS_SHADOW_MAP_UPDATE = 'continuous_shadow_map_update',
}

export interface IRenderingEngineOptions {
  canvas?: HTMLCanvasElement,
  id?: string,
  branding?: {
    /** Optional logo while the viewport is hidden. (our default will be used if none is provided, null will display no logo at all) */
    logo?: string | null,
    /** Optional background color while the viewport is hidden, can include alpha channel. (our default will be used if none is provided) */
    backgroundColor?: string,
    /** Optional logo while the viewport is in busy mode. (our default will be used if none is provided) */
    spinner?: string,
  },
  sessionSettingsId?: string,
  sessionSettingsMode?: SESSION_SETTINGS_MODE,
  visibility?: VISIBILITY_MODE,
}

export interface IRenderingEngine {
  // #region Properties (2)

  automaticResizing: boolean;
  blur: boolean;
  blurSceneWhenBusy: boolean;
  canvas: HTMLCanvasElement;
  closed: boolean;
  domEventEngine: DomEventEngine;
  id: string;
  pointSize: number;
  type: RENDERER_TYPE;
  settingsEngine?: SettingsEngine;
  show: boolean;
  showStatistics: boolean;
  sessionSettingsId?: string;
  sessionSettingsMode: SESSION_SETTINGS_MODE;
  visibility: VISIBILITY_MODE;

  // #endregion Properties (2)

  // #region Public Methods (1)

  /**
   * Update the current tree with the provided node.
   * 
   * @param root the root node
   */
  update(): void;
  init(): void;
  reset(): void;
  resize(width: number, height: number): void;
  getScreenshot(type?: string, encoderOptions?: number): string;

  // #endregion Public Methods (1)
}