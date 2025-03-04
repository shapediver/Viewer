import { DomEventEngine, SESSION_SETTINGS_MODE, SettingsEngine } from '@shapediver/viewer.shared.services';
import { FLAG_TYPE, IGeometryData, IIntersectionFilter, RENDERER_TYPE, VISIBILITY_MODE } from '@shapediver/viewer.shared.types';
import { ITreeNode } from '@shapediver/viewer.shared.node-tree';
import { vec2, vec3 } from 'gl-matrix';

// #region Interfaces (1)

export interface IRenderingEngine {
  // #region Properties (13)

  automaticResizing: boolean;
  canvas: HTMLCanvasElement;
  closed: boolean;
  domEventEngine: DomEventEngine;
  id: string;
  visibilitySessionIds?: string[];
  pointSize: number;
  sessionSettingsId?: string;
  sessionSettingsMode: SESSION_SETTINGS_MODE;
  settingsEngine?: SettingsEngine;
  show: boolean;
  showStatistics: boolean;
  type: RENDERER_TYPE;
  visibility: VISIBILITY_MODE;

  // #endregion Properties (13)

  // #region Public Methods (16)

  addFlag(flag: FLAG_TYPE): string;
  assignSettingsEngine(settingsEngine: SettingsEngine): void;
  continueRendering(): void;
  convert3Dto2D(p: vec3): { container: vec2; client: vec2; page: vec2; hidden: boolean; };
  getScreenshot(type?: string, encoderOptions?: number): string;
  isMobileDeviceWithoutBrowserARSupport(): boolean;
  pauseRendering(): void;
  pointerEventToRay(event: PointerEvent): { origin: vec3, direction: vec3 };
  raytraceScene(origin: vec3, direction: vec3, filterCriteria?: IIntersectionFilter[]): { distance: number, node: ITreeNode, data?: IGeometryData; }[]
  removeFlag(token: string): boolean;
  reset(): void;
  resize(width: number, height: number): void;
  start(): void;
  update(id: string): void;
  viewInAR(file: string, options?: { arScale?: 'auto' | 'fixed', arPlacement?: 'floor' | 'wall', xrEnvironment?: boolean }): Promise<void>;
  viewableInAR(): boolean;

  // #endregion Public Methods (16)
}

// #endregion Interfaces (1)
