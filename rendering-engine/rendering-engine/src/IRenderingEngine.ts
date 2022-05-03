import { DomEventEngine } from '@shapediver/viewer.shared.services'
import { Box } from '@shapediver/viewer.shared.math'

export enum RENDERERTYPE {
  /** The standard rendering engine */
  STANDARD = 'standard',
  /** A basic version of the rendering engine */
  ATTRIBUTES = 'attributes'
}

export enum VISIBILITYMODE {
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
  type: RENDERERTYPE;
  show: boolean;
  showStatistics: boolean;

  // #endregion Properties (2)

  // #region Public Methods (1)

  /**
   * Update the current tree with the provided node.
   * 
   * @param root the root node
   */
  update(): void;
  reset(): void;
  resize(width: number, height: number): void;
  getScreenshot(type?: string, encoderOptions?: number): string;

  // #endregion Public Methods (1)
}