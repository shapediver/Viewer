import { ITreeNode } from '@shapediver/viewer.shared.node-tree';
import { DomEventEngine, SettingsEngine } from '@shapediver/viewer.shared.services'
import { IGeometryData } from '@shapediver/viewer.shared.types';
import { vec2, vec3 } from 'gl-matrix';

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
};

/**
 * Session settings to be used by a viewport.
 * 
 * The {@link https://help.shapediver.com/doc/Geometry-Backend.1863942173.html|ShapeDiver Geometry Backend} 
 * allows to persist settings of the viewer, individually for each model that it hosts. Persisting the settings
 * of the viewer requires permissions which are typically only granted to the owner of the model. Editing
 * of the settings typically happens on the model edit page of the ShapeDiver Platform.
 * 
 * Whenever an instance of the viewer creates a session with a model, the settings are made available to the viewer.
 * It is possible to use multiple sessions with different models from a single instance of the viewer. 
 * Therefore the viewer offers a choice on which settings to use.
 */
export enum SESSION_SETTINGS_MODE {
  /** No settings of a session will be used for the viewport. */
  NONE = 'none',
  /** 
   * The settings of the very first session created will be used for the viewport. 
   */
  FIRST = 'first',
  /** 
   * Use this mode in case you want to assign a specific session identifier 
   * to the viewport, whose settings will be used.
   */
  MANUAL = 'manual',
};

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

export enum SPINNER_POSITIONING {
  CENTER = 'center',
  TOP_LEFT = 'top_left',
  TOP_RIGHT = 'top_right',
  BOTTOM_LEFT = 'bottom_left',
  BOTTOM_RIGHT = 'bottom_right',
}

export interface IRenderingEngine {
  // #region Properties (15)

  automaticResizing: boolean;
  canvas: HTMLCanvasElement;
  closed: boolean;
  domEventEngine: DomEventEngine;
  id: string;
  pointSize: number;
  sessionSettingsId?: string;
  sessionSettingsMode: SESSION_SETTINGS_MODE;
  settingsEngine?: SettingsEngine;
  show: boolean;
  showStatistics: boolean;
  type: RENDERER_TYPE;
  visibility: VISIBILITY_MODE;

  // #endregion Properties (15)

  // #region Public Methods (7)

  addFlag(flag: FLAG_TYPE): string;
  convert3Dto2D(p: vec3): { container: vec2; client: vec2; page: vec2; hidden: boolean; };
  getScreenshot(type?: string, encoderOptions?: number): string;
  mouseEventToRay(event: MouseEvent): { origin: vec3, direction: vec3 };
  raytraceScene(origin: vec3, direction: vec3, root?: ITreeNode): { distance: number, node: ITreeNode, data: IGeometryData; }[]
  removeFlag(token: string): boolean;
  reset(): void;
  resize(width: number, height: number): void;
  touchToRay(event: Touch): { origin: vec3, direction: vec3 };
  touchEventToRay(event: TouchEvent): { origin: vec3, direction: vec3 };
  update(id: string): void;
  viewInAR(file: string, options?: { arScale?: 'auto' | 'fixed', arPlacement?: 'floor' | 'wall', xrEnvironment?: boolean }): Promise<void>;
  viewableInAR(): boolean;

  // #endregion Public Methods (7)
}