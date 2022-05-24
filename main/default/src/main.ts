import { IRenderingEngineOptions, SESSION_SETTINGS_MODE, VISIBILITY_MODE } from '@shapediver/viewer.rendering-engine.rendering-engine'
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
import { ISessionEngineOptions, SessionEngine } from '@shapediver/viewer.session-engine.session-engine';
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
 * This stores all sessions, but can also be used to store your own data.
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
 * Option to show/hide messages.
 */
export let showMessages: boolean = viewerOptions.showMessages;

/**
 * Create and initialize a session with the provided ticket and modelViewUrl.
 * An id can be provided. This id can be used to retrieve this object later on.
 * In the case no id has been provided, a unique one will be generated.
 * 
 * A jwtToken can be provided (JWT).
 * 
 * The session will be initialized automatically, 
 * and the first computation will be loaded in the the scene tree once the promise has resolved.
 * 
 * @param properties.ticket The ticket of a session.
 * @param properties.modelViewUrl The modelViewUrl of the session.
 * @param properties.jwtToken The jwtToken of the session.
 * @param properties.id The unique id the session should have.
 * @param properties.waitForOutputs Option to wait for the outputs to be loaded. (default: true)
 * @param properties.loadOutputs Option to not load the outputs. (default: true)
 * @param properties.initialParameters The initial set of parameters.
 * @returns 
 */
export const createSession = async (properties: ISessionEngineOptions): Promise<ISessionApi> => {
    logger.info(LOGGING_TOPIC.SESSION, `Api.createSession: Creating and initializing session with properties ${JSON.stringify(properties)}.`);
    // input validation
    inputValidator.validateAndError(LOGGING_TOPIC.SESSION, `Api.createSession`, properties, 'object');
    inputValidator.validateAndError(LOGGING_TOPIC.SESSION, `Api.createSession`, properties.ticket, 'string');
    inputValidator.validateAndError(LOGGING_TOPIC.SESSION, `Api.createSession`, properties.modelViewUrl, 'string');
    inputValidator.validateAndError(LOGGING_TOPIC.SESSION, `Api.createSession`, properties.jwtToken, 'string', false);
    inputValidator.validateAndError(LOGGING_TOPIC.SESSION, `Api.createSession`, properties.id, 'string', false);
    inputValidator.validateAndError(LOGGING_TOPIC.SESSION, `Api.createSession`, properties.waitForOutputs, 'boolean', false);
    inputValidator.validateAndError(LOGGING_TOPIC.SESSION, `Api.createSession`, properties.loadOutputs, 'boolean', false);
    inputValidator.validateAndError(LOGGING_TOPIC.SESSION, `Api.createSession`, properties.initialParameters, 'object', false);
    if (properties.initialParameters)
        for (let p in properties.initialParameters)
            inputValidator.validateAndError(LOGGING_TOPIC.SESSION, `Api.createSession`, properties.initialParameters[p], 'string');

    const sessionEngine = await creationControlCenter.createSessionEngine(properties);
    sessions[sessionEngine.id] = new SessionApi(sessionEngine);
    return sessions[sessionEngine.id];
};

/**
 * Create and initialize a viewport with the provided type and canvas.
 * An id can be provided. This id can be used to retrieve this object later on.
 * In the case no id has been provided, a unique one will be generated.
 * 
 * The viewport will automatically load what is currently in the scene tree.
 * 
 * @param properties.type The type of the viewport.
 * @param properties.visibility The visibility of the viewport.
 * @param properties.canvas The canvas that the viewport should use.
 * @param properties.id The unique id the session should have .
 * @param properties.branding Optional branding options.
 * @param properties.sessionSettingsId The id of the session that is currently used for the settings of the viewport.
 * @param properties.sessionSettingsMode The mode in which the session settings should be loaded. (default: {@link SESSION_SETTINGS_MODE.FIRST})
 * @returns 
 */
export const createViewport = async (properties?: IRenderingEngineOptions): Promise<IViewportApi> => {
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
