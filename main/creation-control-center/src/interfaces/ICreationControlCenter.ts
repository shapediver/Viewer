import { BUSY_MODE_DISPLAY, SESSION_SETTINGS_MODE, SPINNER_POSITIONING, VISIBILITY_MODE } from "@shapediver/viewer.rendering-engine.rendering-engine";
import { RenderingEngine as RenderingEngineThreeJs } from "@shapediver/viewer.rendering-engine-threejs.standard";
import { ISettingsSections, SessionEngine } from "@shapediver/viewer.session-engine.session-engine";
import { ShapeDiverResponseDto } from "@shapediver/api.geometry-api-dto-v2";
import { ISettingsV3_1 } from "@shapediver/viewer.settings";

export interface ICreationControlCenter {
  // #region Properties (3)

  renderingEngines: { [key: string]: RenderingEngineThreeJs; }
  sessionEngines: { [key: string]: SessionEngine; }

  update?: ( sessionEngines: { [key: string]: SessionEngine; }, renderingEngines: { [key: string]: RenderingEngineThreeJs; } ) => void;

  // #endregion Properties (3)

  // #region Public Methods (10)

  applySettings(sessionId: string, response: ShapeDiverResponseDto, sections?: ISettingsSections): Promise<void>;
  applyViewportSettings(viewportId: string, settings: ISettingsV3_1, sections?: { ar?: boolean | undefined; scene?: boolean | undefined; camera?: boolean | undefined; light?: boolean | undefined; environment?: boolean | undefined; general?: boolean | undefined; }): Promise<void>;
  closeRenderingEngine(id: string): Promise<void>;
  closeSessionEngine(id: string): Promise<void>;
  createRenderingEngineThreeJs(properties: { canvas?: HTMLCanvasElement, id?: string, branding?: { logo?: string | null, backgroundColor?: string, busyModeSpinner?: string, busyModeDisplay?: BUSY_MODE_DISPLAY, spinnerPositioning?: SPINNER_POSITIONING }, sessionSettingsId?: string, sessionSettingsMode?: SESSION_SETTINGS_MODE, visibility?: VISIBILITY_MODE, }): Promise<RenderingEngineThreeJs>;
  createSessionEngine(properties: { ticket: string, modelViewUrl: string, jwtToken?: string, id?: string, waitForOutputs?: boolean, loadOutputs?: boolean, excludeViewports?: string[], initialParameterValues?: { [key: string]: string } }): Promise<SessionEngine>;
  getARSessionEngine(): SessionEngine | undefined;
  getViewportSettings(viewportId: string): ISettingsV3_1;
  resetSettings(sessionId: string, sections?: ISettingsSections): Promise<void>;
  saveSettings(sessionId: string, viewportId?: string): Promise<boolean>;

  // #endregion Public Methods (10)
}