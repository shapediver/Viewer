import { CreationControlCenterViewport, ICreationControlCenterViewport, ViewportCreationDefinition } from '@shapediver/viewer.creation-control-center.viewport';
import { InputValidator, Logger, SESSION_SETTINGS_MODE, ShapeDiverViewerValidationError } from '@shapediver/viewer.shared.services';
import { IViewportApi } from './interfaces/IViewportApi';
import { RenderingEngine as RenderingEngineThreeJs } from '@shapediver/viewer.rendering-engine.rendering-engine-threejs';
import { showConsoleMessage } from '@shapediver/viewer.api.general';
import { ViewportApi } from './implementation/ViewportApi';
import { BUSY_MODE_DISPLAY, SPINNER_POSITIONING, VISIBILITY_MODE } from '@shapediver/viewer.shared.types';

const creationControlCenterViewport: ICreationControlCenterViewport = CreationControlCenterViewport.instance;
const inputValidator: InputValidator = InputValidator.instance;
const logger: Logger = Logger.instance;

/**
 * The viewports that are currently being used.
 */
export const viewports: { [key: string]: IViewportApi; } = {};

// Whenever a session or viewport is added or removed, this update is called.
creationControlCenterViewport.updateViewports = (
    renderingEngines: { [key: string]: RenderingEngineThreeJs; }
) => {
    for (const v in renderingEngines)
        if (!viewports[v])
            viewports[v] = new ViewportApi(renderingEngines[v]);

    for (const v in viewports) {
        if (!renderingEngines[v])
            delete viewports[v];
    }
};

/**
 * Create and initialize a viewport with the provided type and canvas, 
 * and return a viewport api object allowing to control it.
 * 
 * An optional identifier for the viewport can be provided. This identifier can be used to retrieve the  
 * viewport object from {@link viewports}. In case no identifier is provided, a unique one will be generated.
 * 
 * By default a new viewport displays the complete scene tree. Viewports can be excluded from 
 * displaying geometry for specific sessions by using the {@link excludeViewports} property of
 * {@link ISessionApi}.
 * 
 * @param properties.visibility The visibility of the viewport.
 * @param properties.canvas The canvas that the viewport should use. A canvas element will be created if none is provided. 
 * @param properties.id The unique identifier to use for the viewport.
 * @param properties.branding Optional branding options.
 * @param properties.sessionSettingsId Optional identifier of the session to be used for loading / persisting settings of the viewport when the {@link SESSION_SETTINGS_MODE} is set to MANUAL. 
 * @param properties.sessionSettingsMode Allows to control which session to use for loading / persisting settings of the viewport. (default: {@link SESSION_SETTINGS_MODE.FIRST}).
 * @returns 
 */
export const createViewport = async (properties?: ViewportCreationDefinition): Promise<IViewportApi> => {
    showConsoleMessage();

    const prop = Object.assign({}, properties);
    const copy = Object.fromEntries(
        Object.entries(prop).filter(([key]) => key !== 'canvas')
    );

    logger.debug(`createSession: Creating and initializing session with properties ${JSON.stringify(copy)}.`);
    inputValidator.validateAndError('createViewport', properties, 'object', false);

    inputValidator.validateAndError('createViewport', prop.canvas, 'HTMLCanvasElement', false);
    inputValidator.validateAndError('createViewport', prop.id, 'string', false);
    inputValidator.validateAndError('createViewport', prop.sessionSettingsId, 'string', false);
    inputValidator.validateAndError('createViewport', prop.sessionSettingsMode, 'enum', false, Object.values(SESSION_SETTINGS_MODE));
    inputValidator.validateAndError('createViewport', prop.visibility, 'enum', false, Object.values(VISIBILITY_MODE));

    inputValidator.validateAndError('createViewport', prop.branding, 'object', false);
    const branding = Object.assign({}, prop.branding);
    if (branding.logo !== null) inputValidator.validateAndError('createViewport', branding.logo, 'string', false);
    inputValidator.validateAndError('createViewport', branding.backgroundColor, 'string', false);
    inputValidator.validateAndError('createViewport', branding.busyModeSpinner, 'string', false);
    inputValidator.validateAndError('createViewport', branding.busyModeDisplay, 'enum', false, Object.values(BUSY_MODE_DISPLAY));
    inputValidator.validateAndError('createViewport', branding.spinnerPositioning, 'enum', false, Object.values(SPINNER_POSITIONING));

    prop.sessionSettingsMode = prop.sessionSettingsMode !== undefined ? prop.sessionSettingsMode : SESSION_SETTINGS_MODE.FIRST;

    if (prop.sessionSettingsMode === SESSION_SETTINGS_MODE.MANUAL && !prop.sessionSettingsId)
        throw new ShapeDiverViewerValidationError('createViewport: Input could not be validated. sessionSettingsId has to point to a valid and created session when using SESSION_SETTINGS_MODE.MANUAL', prop.sessionSettingsId, 'string');

    const renderingEngine = await creationControlCenterViewport.createViewportEngine(prop);

    viewports[renderingEngine.id] = new ViewportApi(renderingEngine);
    return viewports[renderingEngine.id];
};
