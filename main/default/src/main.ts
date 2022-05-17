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
export const createViewport = async (
    properties?: {
        canvas?: HTMLCanvasElement,
        id?: string, 
        branding?: {
            /** Optional logo while the viewport is hidden. (our default will be used if none is provided, null will display no logo at all) */
            logo?: string | null,
            /** Optional background color while the viewport is hidden, can include alpha channel. (our default will be used if none is provided) */
            backgroundColor?: string,
            /** Optional logo while the viewport is in busy mode. (our default will be used if none is provided) */
            spinner?: string,
        },
        sessionSettingsId?: string,
        sessionSettingsMode?: SESSION_SETTINGS_MODE,
        visibility?: VISIBILITY_MODE,
    }): Promise<IViewportApi> => {
    throw new Error('Method not implemented.');
};
