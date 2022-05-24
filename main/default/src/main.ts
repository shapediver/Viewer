import { SESSION_SETTINGS_MODE, VISIBILITY_MODE } from '@shapediver/viewer.rendering-engine.rendering-engine'
import { container } from 'tsyringe';
import { ITree, Tree } from '@shapediver/viewer.shared.node-tree';
import { ISessionApi } from './interfaces/session/ISessionApi';
import { IViewportApi } from './interfaces/viewport/IViewportApi';
import { EventEngine, IEvent, LOGGING_LEVEL, LOGGING_TOPIC, MainEventTypes, SettingsEngine, UuidGenerator } from '@shapediver/viewer.shared.services';
import { Logger } from '@shapediver/viewer.shared.services';
import { ShapeDiverViewerError } from '@shapediver/viewer.shared.services';
import { ShapeDiverBackendError } from '@shapediver/viewer.shared.services';
import { InputValidator } from '@shapediver/viewer.shared.services';
import { CreationControlCenter, ICreationControlCenter } from '@shapediver/viewer.main.creation-control-center';
import { ViewportApi } from './implementation/viewport/ViewportApi';
import { SessionEngine } from '@shapediver/viewer.session-engine.session-engine';
import { SessionApi } from './implementation/session/SessionApi';
import { RenderingEngine as RenderingEngineThreeJs } from '@shapediver/viewer.rendering-engine-threejs.standard';


const creationControlCenter: ICreationControlCenter = <ICreationControlCenter>container.resolve(CreationControlCenter);
const inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
const logger: Logger = <Logger>container.resolve(Logger);
const eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);

class ViewerOptions {
    // #region Public Accessors (4)

    public get loggingLevel(): LOGGING_LEVEL {
        return logger.loggingLevel;
    }

    public set loggingLevel(value: LOGGING_LEVEL) {
        try {
            logger.debugLow(LOGGING_TOPIC.GENERAL, `Api.loggingLevel: Updating LoggingLevel to ${value}.`);
            inputValidator.validateAndError(LOGGING_TOPIC.GENERAL, 'Api.loggingLevel', value, 'enum', true, Object.values(LOGGING_LEVEL));
            logger.loggingLevel = value;
            logger.debug(LOGGING_TOPIC.GENERAL, `Api.loggingLevel: LoggingLevel was set to: ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw logger.handleError(LOGGING_TOPIC.GENERAL, 'Api.loggingLevel', e);
        }
    }

    public get showMessages(): boolean {
        return logger.showMessages;
    }

    public set showMessages(value: boolean) {
        try {
            logger.debugLow(LOGGING_TOPIC.GENERAL, `Api.showMessages: Updating ShowMessages to ${value}.`);
            inputValidator.validateAndError(LOGGING_TOPIC.GENERAL, 'Api.showMessages', value, 'boolean');
            logger.showMessages = value;
            logger.debug(LOGGING_TOPIC.GENERAL, `Api.showMessages: ShowMessages was set to: ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw logger.handleError(LOGGING_TOPIC.GENERAL, 'Api.showMessages', e);
        }
    }

    // #endregion Public Accessors (4)
}

const viewerOptions = new ViewerOptions();
/**
 * Adds an event listener.
 * 
 * @param type The type of event.
 * @param cb The callback.
 * @returns 
 */
export const addListener = (type: string | MainEventTypes, cb: (event: IEvent) => void): string => {
    try {
        logger.debugLow(LOGGING_TOPIC.GENERAL, `Api.addListener: Event Listener was registered for ${type}.`);
        logger.debug(LOGGING_TOPIC.GENERAL, `Api.addListener: Event Listener was registered for ${type}.`);
        return eventEngine.addListener(type, cb);
    } catch (e) {
        if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
        throw logger.handleError(LOGGING_TOPIC.GENERAL, 'Api.addListener', e);
    }
};

/**
 * Removes an event listener.
 * 
 * @param id The id of the listener.
 * @returns 
 */
export const removeListener = (id: string): boolean => {
    try {
        logger.debugLow(LOGGING_TOPIC.GENERAL, `Api.removeListener: Removing event listener with id ${id}.`);
        return eventEngine.removeListener(id);
    } catch (e) {
        if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
        throw logger.handleError(LOGGING_TOPIC.GENERAL, 'Api.removeListener', e);
    }
};

/**
 * The scene tree that is used to store the scene.
 * The scene tree contains a unique node and child nodes for each session, 
 * and can also be used to add your own nodes.
 */
export const sceneTree: ITree = <ITree>container.resolve(Tree);

/**
 * The viewports that are currently being used.
 */
export const viewports: { [key: string]: IViewportApi; } = {};

/**
 * The sessions that are currently being used.
 */
export const sessions: { [key: string]: ISessionApi; } = {};

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

/**
 * The logging level that is used.
 */
export let loggingLevel: LOGGING_LEVEL = viewerOptions.loggingLevel;

/**
 * Option to show/hide messages in the browser console.
 */
export let showMessages: boolean = viewerOptions.showMessages;

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
 * ATOM: It would be useful to have an optional parameter allowing to specify a transformation for the session node.
 * 
 * @param properties.ticket The ticket for direct embedding of the model to create a session for. This identifies the model on the Geometry Backend.
 * @param properties.modelViewUrl The modelViewUrl of the {@link https://help.shapediver.com/doc/Geometry-Backend.1863942173.html|ShapeDiver Geometry Backend} hosting the model.
 * @param properties.jwtToken The JWT to use for authorizing the API calls to the Geometry Backend.
 * @param properties.id The unique identifier to use for the session.
 * @param properties.waitForOutputs Option to wait for the outputs to be loaded, or return immediately after creation of the session. (default: true)
 * @param properties.loadOutputs Option to load the outputs, or not load them until the first call of {@link ISessionApi.customize}. (default: true)
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
    initialParameterValues?: { [key: string]: string }
}): Promise<ISessionApi> => {
    logger.info(LOGGING_TOPIC.SESSION, `Api.createSession: Creating and initializing session with properties ${JSON.stringify(properties)}.`);
    // input validation
    inputValidator.validateAndError(LOGGING_TOPIC.SESSION, `Api.createSession`, properties, 'object');
    inputValidator.validateAndError(LOGGING_TOPIC.SESSION, `Api.createSession`, properties.ticket, 'string');
    inputValidator.validateAndError(LOGGING_TOPIC.SESSION, `Api.createSession`, properties.modelViewUrl, 'string');
    inputValidator.validateAndError(LOGGING_TOPIC.SESSION, `Api.createSession`, properties.jwtToken, 'string', false);
    inputValidator.validateAndError(LOGGING_TOPIC.SESSION, `Api.createSession`, properties.id, 'string', false);
    inputValidator.validateAndError(LOGGING_TOPIC.SESSION, `Api.createSession`, properties.waitForOutputs, 'boolean', false);
    inputValidator.validateAndError(LOGGING_TOPIC.SESSION, `Api.createSession`, properties.loadOutputs, 'boolean', false);
    inputValidator.validateAndError(LOGGING_TOPIC.SESSION, `Api.createSession`, properties.initialParameterValues, 'object', false);
    if (properties.initialParameterValues)
        for (let p in properties.initialParameterValues)
            inputValidator.validateAndError(LOGGING_TOPIC.SESSION, `Api.createSession`, properties.initialParameterValues[p], 'string');

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
 * @param properties.sessionSettingsId Optional identifier of the session to be used for loading / persisting settings of the viewport. 
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
       * ATOM: Let's explain how the spinner's placement can be influenced.
       */
      spinner?: string,
    },
    sessionSettingsId?: string,
    sessionSettingsMode?: SESSION_SETTINGS_MODE,
    visibility?: VISIBILITY_MODE,
  }): Promise<IViewportApi> => {
    try {
        inputValidator.validateAndError(LOGGING_TOPIC.VIEWER, 'Api.createViewer', properties, 'object', false);
        const prop = Object.assign({}, properties);
        inputValidator.validateAndError(LOGGING_TOPIC.VIEWER, `Api.createViewer`, prop.visibility, 'enum', false, Object.values(VISIBILITY_MODE));
        inputValidator.validateAndError(LOGGING_TOPIC.VIEWER, `Api.createViewer`, prop.canvas, 'HTMLCanvasElement', false);
        inputValidator.validateAndError(LOGGING_TOPIC.VIEWER, `Api.createViewer`, prop.id, 'string', false);
        inputValidator.validateAndError(LOGGING_TOPIC.VIEWER, 'Api.createViewer', prop.branding, 'object', false);
        const branding = Object.assign({}, prop.branding);
        inputValidator.validateAndError(LOGGING_TOPIC.VIEWER, `Api.createViewer`, branding.backgroundColor, 'string', false);

        prop.sessionSettingsMode = prop.sessionSettingsMode || SESSION_SETTINGS_MODE.FIRST;
        //TODO proper type checking

        const renderingEngine = await creationControlCenter.createRenderingEngineThreeJs(prop);

        viewports[renderingEngine.id] = new ViewportApi(renderingEngine);
        return viewports[renderingEngine.id];
    } catch (e) {
        if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
        throw logger.handleError(LOGGING_TOPIC.GENERAL, 'Api.createViewer', e);
    }
};
