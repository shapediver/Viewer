import { BUSY_MODE_DISPLAY, SESSION_SETTINGS_MODE, SPINNER_POSITIONING, VISIBILITY_MODE } from '@shapediver/viewer.rendering-engine.rendering-engine'
import { ITree, Tree, TreeNode } from '@shapediver/viewer.shared.node-tree';
import { ISessionApi } from './interfaces/session/ISessionApi';
import { IViewportApi } from './interfaces/viewport/IViewportApi';
import { EventEngine, IEvent, LOGGING_LEVEL, MainEventTypes, SettingsEngine, ShapeDiverViewerValidationError, UuidGenerator } from '@shapediver/viewer.shared.services';
import { Logger } from '@shapediver/viewer.shared.services';
import { ShapeDiverViewerError } from '@shapediver/viewer.shared.services';
import { ShapeDiverBackendError } from '@shapediver/viewer.shared.services';
import { InputValidator } from '@shapediver/viewer.shared.services';
import { CreationControlCenter, ICreationControlCenter } from '@shapediver/viewer.main.creation-control-center';
import { ViewportApi } from './implementation/viewport/ViewportApi';
import { SessionEngine } from '@shapediver/viewer.session-engine.session-engine';
import { SessionApi } from './implementation/session/SessionApi';
import { RenderingEngine as RenderingEngineThreeJs } from '@shapediver/viewer.rendering-engine-threejs.standard';
import { build_data } from '@shapediver/viewer.shared.build-data';
import { GeometryEngine } from '@shapediver/viewer.data-engine.geometry-engine';


const creationControlCenter: ICreationControlCenter = CreationControlCenter.instance;
const inputValidator: InputValidator = InputValidator.instance;
const logger: Logger = Logger.instance;
const eventEngine: EventEngine = EventEngine.instance;
const geometryEngine: GeometryEngine = GeometryEngine.instance;

let createdConsoleMessage = false, consoleBranding = true;

export interface IGeneralOptions {
    /**
     * The logging level that is used.
     */
    loggingLevel: LOGGING_LEVEL;

    /**
     * Option to show/hide messages in the browser console.
     */
    showMessages: boolean;
    
    /**
     * The number of glTFs that are downloaded and processed at the same time.
     * Restricting this number might help if too much data is downloaded at the same time.
     * (default: Infinity)
     */
    parallelGlTFProcessing: number;

    /**
     * When set to false, the branding in the viewer console will be limited to a single line.
     * This will only include the viewer version. (default: true)
     */
    consoleBranding: boolean;
}

class GeneralOptions {
    // #region Public Accessors (4)

    public get loggingLevel(): LOGGING_LEVEL {
        return logger.loggingLevel;
    }

    public set loggingLevel(value: LOGGING_LEVEL) {
        inputValidator.validateAndError('loggingLevel', value, 'enum', true, Object.values(LOGGING_LEVEL));
        logger.loggingLevel = value;
        logger.debug(`loggingLevel: LoggingLevel was set to: ${value}`);
    }

    public get showMessages(): boolean {
        return logger.showMessages;
    }

    public set showMessages(value: boolean) {
        inputValidator.validateAndError('showMessages', value, 'boolean');
        logger.showMessages = value;
        logger.debug(`showMessages: ShowMessages was set to: ${value}`);
    }
    
    public get parallelGlTFProcessing(): number {
        return geometryEngine.parallelGlTFProcessing;
    }

    public set parallelGlTFProcessing(value: number) {
        inputValidator.validateAndError('parallelGlTFProcessing', value, 'number');
        geometryEngine.parallelGlTFProcessing = value;
        logger.debug(`parallelGlTFProcessing: ParallelGlTFProcessing was set to: ${value}`);
    }

    public get consoleBranding(): boolean {
        return consoleBranding;
    }

    public set consoleBranding(value: boolean) {
        inputValidator.validateAndError('consoleBranding', value, 'boolean');
        consoleBranding = value;
        logger.debug(`consoleBranding: ConsoleBranding was set to: ${value}`);
    }

    // #endregion Public Accessors (4)
}

/**
 * Adds an event listener.
 * 
 * @param type The type of event.
 * @param cb The callback.
 * @returns 
 */
export const addListener = (type: string | MainEventTypes, cb: (event: IEvent) => void): string => {
    inputValidator.validateAndError(`addListener`, type, 'string');
    inputValidator.validateAndError(`addListener`, cb, 'function');
    logger.debug(`addListener: Event Listener was registered for ${type}.`);
    return eventEngine.addListener(type, cb);
};

/**
 * Removes an event listener.
 * 
 * @param id The id of the listener.
 * @returns 
 */
export const removeListener = (id: string): boolean => {
    inputValidator.validateAndError(`removeListener`, id, 'string');
    logger.debug(`removeListener: Removing event listener with id ${id}.`);
    return eventEngine.removeListener(id);
};

/**
 * The scene tree that is used to store the scene.
 * The scene tree contains a unique node and child nodes for each session, 
 * and can also be used to add your own nodes.
 */
export const sceneTree: ITree = Tree.instance;

/**
 * The viewports that are currently being used.
 */
export const viewports: { [key: string]: IViewportApi; } = {};

/**
 * The sessions that are currently being used.
 */
export const sessions: { [key: string]: ISessionApi; } = {};

// Whenever a session or viewport is added or removed, this update is called.
creationControlCenter.update = (
    sessionEngines: { [key: string]: SessionEngine; },
    renderingEngines: { [key: string]: RenderingEngineThreeJs; }
) => {
    for (let s in sessionEngines)
        if (!sessions[s])
            sessions[s] = new SessionApi(sessionEngines[s]);

    for (let s in sessions)
        if (!sessionEngines[s])
            delete sessions[s];

    for (let v in renderingEngines)
        if (!viewports[v])
            viewports[v] = new ViewportApi(renderingEngines[v]);

    for (let v in viewports) {
        if (!renderingEngines[v])
            delete viewports[v];
    }
}

const showConsoleMessage = () => {
    createdConsoleMessage = true;
    if(consoleBranding === true) {
        console.log(`Powered by:
   _____  __                         ____   _                   
  / ___/ / /_   ____ _ ____   ___   / __ \\ (_)_   __ ___   _____
  \\__ \\ / __ \\ / __ '// __ \\ / _ \\ / / / // /| | / // _ \\ / ___/
 ___/ // / / // /_/ // /_/ //  __// /_/ // / | |/ //  __// /    
/____//_/ /_/ \\__,_// .___/ \\___//_____//_/  |___/ \\___//_/     
                   /_/                                          
ShapeDiver Viewer 3, Version ${build_data.build_version.replace('3.', '')}
Visit us at https://shapediver.com/ and find out more!
`);
    } else {
        console.log(`ShapeDiver Viewer 3, Version ${build_data.build_version.replace('3.', '')}`);
    }
}

/**
 * General Viewer options that are used everywhere.
 * - loggingLevel: The logging level that is used.
 * - showMessages: Option to show/hide messages in the browser console.
 */
export const generalOptions: IGeneralOptions = new GeneralOptions();

/**
 * Create and initialize a session with a model hosted on a 
 * {@link https://help.shapediver.com/doc/Geometry-Backend.1863942173.html|ShapeDiver Geometry Backend}, 
 * using the provided ticket and modelViewUrl. 
 * Returns a session api object allowing to control the session.
 * 
 * A JWT can be specified for authorizing the API calls to the Geometry Backend. 
 * The model's settings on the Geometry Backend might require a JWT to be provided.
 *
 * By default the outputs of the model for its default parameter values will be loaded.
 * 
 * An optional identifier for the session can be provided. This identifier can be used to retrieve the  
 * api object from {@link sessions}. In case no identifier is provided, a unique one will be generated.
 * 
 * @param properties.ticket The ticket for direct embedding of the model to create a session for. This identifies the model on the Geometry Backend.
 * @param properties.modelViewUrl The modelViewUrl of the {@link https://help.shapediver.com/doc/Geometry-Backend.1863942173.html|ShapeDiver Geometry Backend} hosting the model.
 * @param properties.jwtToken The JWT to use for authorizing the API calls to the Geometry Backend.
 * @param properties.id The unique identifier to use for the session.
 * @param properties.waitForOutputs Option to wait for the outputs to be loaded, or return immediately after creation of the session. (default: true)
 * @param properties.loadOutputs Option to load the outputs, or not load them until the first call of {@link ISessioncustomize}. (default: true)
 * @param properties.excludeViewports Option to exclude some viewports from the start. Can be accessed via {@link ISessionexcludeViewports}.
 * @param properties.initialParameterValues The initial set of parameter values to use. Map from parameter id to parameter value. The default value will be used for any parameter not specified.
 * @returns 
 */
export const createSession = async (properties: {
    ticket: string,
    modelViewUrl: string,
    jwtToken?: string,
    id?: string,
    waitForOutputs?: boolean,
    loadOutputs?: boolean,
    excludeViewports?: string[],
    initialParameterValues?: { [key: string]: string }
}): Promise<ISessionApi> => {
    if(createdConsoleMessage === false) showConsoleMessage();

    logger.info(`createSession: Creating and initializing session with properties ${JSON.stringify(properties)}.`);
    // input validation
    inputValidator.validateAndError(`createSession`, properties, 'object');
    inputValidator.validateAndError(`createSession`, properties.ticket, 'string');
    inputValidator.validateAndError(`createSession`, properties.modelViewUrl, 'string');
    inputValidator.validateAndError(`createSession`, properties.jwtToken, 'string', false);
    inputValidator.validateAndError(`createSession`, properties.id, 'string', false);
    inputValidator.validateAndError(`createSession`, properties.waitForOutputs, 'boolean', false);
    inputValidator.validateAndError(`createSession`, properties.loadOutputs, 'boolean', false);
    inputValidator.validateAndError(`createSession`, properties.excludeViewports, 'stringArray', false);
    inputValidator.validateAndError(`createSession`, properties.initialParameterValues, 'object', false);
    if (properties.initialParameterValues)
        for (let p in properties.initialParameterValues)
            inputValidator.validateAndError(`createSession`, properties.initialParameterValues[p], 'string');

    if (properties.waitForOutputs === undefined) properties.waitForOutputs = true;
    if (properties.loadOutputs === undefined) properties.loadOutputs = true;

    const sessionEngine = await creationControlCenter.createSessionEngine(properties);
    sessions[sessionEngine.id] = new SessionApi(sessionEngine);
    return sessions[sessionEngine.id];
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
export const createViewport = async (properties?: {
    canvas?: HTMLCanvasElement,
    id?: string,
    branding?: {
        /** 
         * Optional URL to a logo to be displayed while the viewport is hidden. 
         * A default logo will be used if none is provided. 
         * Supply null to display no logo at all.
         */
        logo?: string | null,
        /** 
         * Optional background color to show while the viewport is hidden, can include alpha channel. 
         * A default color will be used if none is provided.
         */
        backgroundColor?: string,
        /** 
         * Optional URL to a logo to be displayed while the viewport is in busy mode. 
         * A default logo will be used if none is provided. 
         * The positioning of the spinner can be influenced via {@link SPINNER_POSITIONING}.
         */
        busyModeSpinner?: string,
        /**
         * The mode used to indicate that the viewport is busy. (default: BUSY_MODE_DISPLAY.SPINNER)
         * Whenever the busy mode gets toggled, the events {@link EVENTTYPE_VIEWPORT.BUSY_MODE_ON} and {@link EVENTTYPE_VIEWPORT.BUSY_MODE_OFF} will be emitted.
         */
        busyModeDisplay?: BUSY_MODE_DISPLAY,
        /**
         * Where the spinner that is specified by {@link BUSY_MODE_DISPLAY} is desplayed on the screen. (default: BUSY_MODE_DISPLAY.BOTTOM_RIGHT)
         */
        spinnerPositioning?: SPINNER_POSITIONING

    },
    sessionSettingsId?: string,
    sessionSettingsMode?: SESSION_SETTINGS_MODE,
    visibility?: VISIBILITY_MODE,
}): Promise<IViewportApi> => {
    if(createdConsoleMessage === false) showConsoleMessage();

    inputValidator.validateAndError('createViewport', properties, 'object', false);

    const prop = Object.assign({}, properties);
    inputValidator.validateAndError(`createViewport`, prop.canvas, 'HTMLCanvasElement', false);
    inputValidator.validateAndError(`createViewport`, prop.id, 'string', false);
    inputValidator.validateAndError(`createViewport`, prop.sessionSettingsId, 'string', false);
    inputValidator.validateAndError(`createViewport`, prop.sessionSettingsMode, 'enum', false, Object.values(SESSION_SETTINGS_MODE));
    inputValidator.validateAndError(`createViewport`, prop.visibility, 'enum', false, Object.values(VISIBILITY_MODE));

    inputValidator.validateAndError('createViewport', prop.branding, 'object', false);
    const branding = Object.assign({}, prop.branding);
    if (branding.logo !== null) inputValidator.validateAndError(`createViewport`, branding.logo, 'string', false);
    inputValidator.validateAndError(`createViewport`, branding.backgroundColor, 'string', false);
    inputValidator.validateAndError(`createViewport`, branding.busyModeSpinner, 'string', false);
    inputValidator.validateAndError(`createViewport`, branding.busyModeDisplay, 'enum', false, Object.values(BUSY_MODE_DISPLAY));
    inputValidator.validateAndError(`createViewport`, branding.spinnerPositioning, 'enum', false, Object.values(SPINNER_POSITIONING));

    prop.sessionSettingsMode = prop.sessionSettingsMode !== undefined ? prop.sessionSettingsMode : SESSION_SETTINGS_MODE.FIRST;

    if (prop.sessionSettingsMode === SESSION_SETTINGS_MODE.MANUAL && !prop.sessionSettingsId)
        throw new ShapeDiverViewerValidationError(`createViewport: Input could not be validated. sessionSettingsId has to point to a valid and created session when using SESSION_SETTINGS_MODE.MANUAL`, prop.sessionSettingsId, 'string');

    const renderingEngine = await creationControlCenter.createRenderingEngineThreeJs(prop);

    viewports[renderingEngine.id] = new ViewportApi(renderingEngine);
    return viewports[renderingEngine.id];
};