import { VISIBILITY_MODE } from '@shapediver/viewer.rendering-engine.rendering-engine'
import { container } from 'tsyringe';
import { ITree, Tree } from '@shapediver/viewer.shared.node-tree';
import { ISessionApi } from './interfaces/session/ISessionApi';
import { IViewportApi, SESSION_SETTINGS_MODE } from './interfaces/viewport/IViewportApi';
import { IEvent, LOGGING_LEVEL, LOGGING_TOPIC, MainEventTypes, SettingsEngine } from '@shapediver/viewer.shared.services';
import { Logger } from '@shapediver/viewer.shared.services';
import { ShapeDiverViewerError } from '@shapediver/viewer.shared.services';
import { ShapeDiverBackendError } from '@shapediver/viewer.shared.services';
import { InputValidator } from '@shapediver/viewer.shared.services';
import { EventResponseMapping } from '.';

class ViewerOptions {
    // #region Properties (3)

    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #settingsEngine: SettingsEngine = <SettingsEngine>container.resolve(SettingsEngine);

    // #endregion Properties (3)

    // #region Public Accessors (4)

    public get loggingLevel(): LOGGING_LEVEL {
        return this.#logger.loggingLevel;
    }

    public set loggingLevel(value: LOGGING_LEVEL) {
        try {
            this.#logger.debugLow(LOGGING_TOPIC.GENERAL, `Api.loggingLevel: Updating LoggingLevel to ${value}.`);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.GENERAL, 'Api.loggingLevel', value, 'enum', true, Object.values(LOGGING_LEVEL));
            this.#logger.loggingLevel = value;
            this.#logger.debug(LOGGING_TOPIC.GENERAL, `Api.loggingLevel: LoggingLevel was set to: ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.GENERAL, 'Api.loggingLevel', e);
        }
    }

    public get showMessages(): boolean {
        return this.#logger.showMessages;
    }

    public set showMessages(value: boolean) {
        try {
            this.#logger.debugLow(LOGGING_TOPIC.GENERAL, `Api.showMessages: Updating ShowMessages to ${value}.`);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.GENERAL, 'Api.showMessages', value, 'boolean');
            this.#logger.showMessages = value;
            this.#settingsEngine.general.showMessages = this.#logger.showMessages;
            this.#logger.debug(LOGGING_TOPIC.GENERAL, `Api.showMessages: ShowMessages was set to: ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.GENERAL, 'Api.showMessages', e);
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
    throw new Error('Method not implemented.');
};

/**
 * Removes an event listener.
 * 
 * @param id The id of the listener.
 * @returns 
 */
export const removeListener = (id: string): boolean => {
    throw new Error('Method not implemented.');
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


/**
 * The logging level that is used.
 */
export let loggingLevel: LOGGING_LEVEL = viewerOptions.loggingLevel;

/**
 * Option to show/hide messages.
 * ATOM: Please add details on what this is used for exactly
 */
export let showMessages: boolean = viewerOptions.showMessages;

/**
 * Create and initialize a session with a model on a 
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
 * @param properties.ticket The ticket for direct embedding of the model to create a session for.
 * @param properties.modelViewUrl The modelViewUrl of the {@link https://help.shapediver.com/doc/Geometry-Backend.1863942173.html|ShapeDiver Geometry Backend} hosting the model.
 * @param properties.jwtToken The JWT to use for authorizing the API calls to the Geometry Backend.
 * @param properties.id The unique identifier to use for the session.
 * @param properties.waitForOutputs Option to wait for the outputs to be loaded. (default: true)
 * @param properties.loadOutputs Option to not load the outputs. (default: true)
 * @param properties.initialParameters The initial set of parameter values to use. Map from parameter id to parameter value. The default value will be used for any parameter not specified.
 * @returns 
 */
export const createSession = async (
    properties: {
        ticket: string,
        modelViewUrl: string,
        jwtToken?: string,
        id?: string,
        waitForOutputs?: boolean,
        loadOutputs?: boolean,
        initialParameters?: { [key: string]: string }
    }
): Promise<ISessionApi> => {
    throw new Error('Method not implemented.');
};

/**
 * Create and initialize a viewport with the provided type and canvas, 
 * and return a viewport api object allowing to control it.
 * 
 * An optional identifier for the viewport can be provided. This identifier can be used to retrieve the  
 * viewport object from {@link viewports}. In case no identifier is provided, a unique one will be generated.
 * 
 * The viewport will automatically load what is currently in the scene tree. 
 * ATOM: Is "load" a good term to use here? Isn't it "show" or "render"?
 * 
 * @param properties.type The type of the viewport. ATOM: there is no type parameter below
 * @param properties.visibility The visibility of the viewport.
 * @param properties.canvas The canvas that the viewport should use. ATOM: is this really optional?
 * @param properties.id The unique identifier to use for the viewport.
 * @param properties.branding Optional branding options.
 * @param properties.sessionSettingsId The id of the session that is currently used for the settings of the viewport. ATOM: Let's adapt this once IViewportApi::sessionSettingsId has been clarified
 * @param properties.sessionSettingsMode The mode in which the session settings should be loaded. (default: {@link SESSION_SETTINGS_MODE.FIRST}). ATOM: Let's adapt this once IViewportApi::sessionSettingsMode has been clarified.
 * @returns 
 */
export const createViewport = async (
    properties?: {
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
             * ATOM: Let's explain how the placement can be influenced.
             */
            spinner?: string,
        },
        sessionSettingsId?: string,
        sessionSettingsMode?: SESSION_SETTINGS_MODE,
        visibility?: VISIBILITY_MODE,
    }): Promise<IViewportApi> => {
    throw new Error('Method not implemented.');
};
