import { ISettings } from '@shapediver/viewer.settings';
import { IViewportSettingsSections, ViewportCreationDefinition } from '@shapediver/viewer.shared.types';
import { RenderingEngine as RenderingEngineThreeJs } from '@shapediver/viewer.rendering-engine.rendering-engine-threejs';

export interface ICreationControlCenterViewport {
    // #region Properties (2)

    updateViewports?: (viewportEngines: { [key: string]: RenderingEngineThreeJs; }) => void;
    viewportEngines: { [key: string]: RenderingEngineThreeJs; };

    // #endregion Properties (2)

    // #region Public Methods (4)

    applyViewportSettings(viewportId: string, settings: ISettings, sections?: IViewportSettingsSections): Promise<void>;
    closeViewportEngine(id: string): Promise<void>;
    createViewportEngine(properties: ViewportCreationDefinition): Promise<RenderingEngineThreeJs>;
    getViewportSettings(viewportId: string): ISettings;

    // #endregion Public Methods (4)
}
