import { SESSION_SETTINGS_MODE, VISIBILITY_MODE } from "@shapediver/viewer.rendering-engine.rendering-engine";
import { RenderingEngine as RenderingEngineThreeJs } from "@shapediver/viewer.rendering-engine-threejs.standard";
import { SessionEngine } from "@shapediver/viewer.session-engine.session-engine";
import { ShapeDiverResponseDto } from "@shapediver/api.geometry-api-dto-v2";

export interface ICreationControlCenter {
  // #region Public Methods (4)

  renderingEngines: { [key: string]: RenderingEngineThreeJs; }
  sessionEngines: { [key: string]: SessionEngine; }

  update?: (
    sessionEngines: { [key: string]: SessionEngine; },
    renderingEngines: { [key: string]: RenderingEngineThreeJs; }
  ) => void;

  applySettings(sessionId: string, response: ShapeDiverResponseDto, sections?: { session?: { parameter?: { displayname?: boolean | undefined; order?: boolean | undefined; hidden?: boolean | undefined; value?: boolean | undefined; } | undefined; export?: { displayname?: boolean | undefined; order?: boolean | undefined; hidden?: boolean | undefined; } | undefined; } | undefined; viewport?: { scene?: boolean | undefined; camera?: boolean | undefined; light?: boolean | undefined; environment?: boolean | undefined; } | undefined; }): Promise<void>;

  closeSessionEngine(id: string): Promise<void>;

  closeRenderingEngine(id: string): Promise<void>;

  createSessionEngine(properties: {
    ticket: string,
    modelViewUrl: string,
    jwtToken?: string,
    id?: string,
    waitForOutputs?: boolean,
    loadOutputs?: boolean,
    excludeViewports?: string[],
    initialParameterValues?: { [key: string]: string }
  }): Promise<SessionEngine>;

  createRenderingEngineThreeJs(properties: {
    canvas?: HTMLCanvasElement,
    id?: string,
    branding?: {
      logo?: string | null,
      backgroundColor?: string,
      spinner?: string,
    },
    sessionSettingsId?: string,
    sessionSettingsMode?: SESSION_SETTINGS_MODE,
    visibility?: VISIBILITY_MODE,
  }): Promise<RenderingEngineThreeJs>;

  saveSettings(sessionId: string, viewportId?: string): Promise<boolean>;
  
  // #endregion Public Methods (4)
}