import { build_data } from '@shapediver/viewer.shared.build-data';
import {
    EventEngine,
    HttpClient,
    IEvent,
    InputValidator,
    Logger,
    LOGGING_LEVEL,
    MainEventTypes
} from '@shapediver/viewer.shared.services';
import { GeometryEngine } from '@shapediver/viewer.data-engine.geometry-engine';
import { ITree, Tree } from '@shapediver/viewer.shared.node-tree';

// #region Interfaces (1)

export interface IGeneralOptions {
    // #region Properties (5)

    /**
     * Caching options.
     */
    caching: {
        /**
         * Option to enable/disable the caching. (default: true)
         */
        enable: boolean;

        /**
         * Query parameters that are excluded when creating the key that is used for the comparison of data entries in the cache. (default: ['Expires', 'Signature', 'Key-Pair-Id'])
         * Example: by the addition of 'Expires' the URLs https://link.example?Expires=0 and https://link.example?Expires=1 are both reduced to https://link.example for caching.
         */
        excludedQueryParameters: string[];

        /**
         * The maximum size of the cache in bytes. (default: 1024^3)
         */
        maxCacheSize: number;
    }

    /**
     * When set to false, the branding in the viewer console will be limited to a single line.
     * This will only include the viewer version. (default: true)
     */
    consoleBranding: boolean;
    /**
     * The logging level that is used.
     */
    loggingLevel: LOGGING_LEVEL;
    /**
     * The number of glTFs that are downloaded and processed at the same time.
     * Restricting this number might help if too much data is downloaded at the same time.
     * (default: Infinity)
     */
    parallelGlTFProcessing: number;
    /**
     * Option to show/hide messages in the browser console.
     */
    showMessages: boolean;

    // #endregion Properties (5)
}

// #endregion Interfaces (1)

// #region Classes (1)

class GeneralOptions {
    // #region Public Getters And Setters (10)

    public get caching(): { enable: boolean, excludedQueryParameters: string[], maxCacheSize: number } {
        return {
            enable: httpClient.enableCaching,
            excludedQueryParameters: httpClient.excludedQueryParameters,
            maxCacheSize: httpClient.maxCacheSize
        };
    }

    public set caching(value: { enable: boolean, excludedQueryParameters: string[], maxCacheSize: number }) {
        inputValidator.validateAndError('caching', value, 'object', true);
        inputValidator.validateAndError('caching', value.enable, 'boolean');
        inputValidator.validateAndError('caching', value.excludedQueryParameters, 'stringArray');
        inputValidator.validateAndError('caching', value.maxCacheSize, 'number');
        if (value.enable !== undefined) httpClient.enableCaching = value.enable;
        if (value.excludedQueryParameters !== undefined) httpClient.excludedQueryParameters = value.excludedQueryParameters;
        if (value.maxCacheSize !== undefined) httpClient.maxCacheSize = value.maxCacheSize;
        logger.debug(`caching: CoggingLevel was set to: ${value}`);
    }

    public get consoleBranding(): boolean {
        return consoleBranding;
    }

    public set consoleBranding(value: boolean) {
        inputValidator.validateAndError('consoleBranding', value, 'boolean');
        consoleBranding = value;
        logger.debug(`consoleBranding: ConsoleBranding was set to: ${value}`);
    }

    public get loggingLevel(): LOGGING_LEVEL {
        return logger.loggingLevel;
    }

    public set loggingLevel(value: LOGGING_LEVEL) {
        inputValidator.validateAndError('loggingLevel', value, 'enum', true, Object.values(LOGGING_LEVEL));
        logger.loggingLevel = value;
        logger.debug(`loggingLevel: LoggingLevel was set to: ${value}`);
    }

    public get parallelGlTFProcessing(): number {
        return geometryEngine.parallelGlTFProcessing;
    }

    public set parallelGlTFProcessing(value: number) {
        inputValidator.validateAndError('parallelGlTFProcessing', value, 'number');
        geometryEngine.parallelGlTFProcessing = value;
        logger.debug(`parallelGlTFProcessing: ParallelGlTFProcessing was set to: ${value}`);
    }

    public get showMessages(): boolean {
        return logger.showMessages;
    }

    public set showMessages(value: boolean) {
        inputValidator.validateAndError('showMessages', value, 'boolean');
        logger.showMessages = value;
        logger.debug(`showMessages: ShowMessages was set to: ${value}`);
    }

    // #endregion Public Getters And Setters (10)
}

// #endregion Classes (1)

// #region Variables (12)

const httpClient: HttpClient = HttpClient.instance;
const inputValidator: InputValidator = InputValidator.instance;
const logger: Logger = Logger.instance;
const eventEngine: EventEngine = EventEngine.instance;
const geometryEngine: GeometryEngine = GeometryEngine.instance;
let createdConsoleMessage = false, consoleBranding = true;
/**
 * Adds an event listener.
 * 
 * @param type The type of event.
 * @param cb The callback.
 * @returns 
 */
export const addListener = (type: string | MainEventTypes, cb: (event: IEvent) => void): string => {
    inputValidator.validateAndError('addListener', type, 'string');
    inputValidator.validateAndError('addListener', cb, 'function');
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
    inputValidator.validateAndError('removeListener', id, 'string');
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
 * The version of the viewer.
 */
export const version: string = build_data.build_version.replace('3.', '');
export const showConsoleMessage = () => {
    if (createdConsoleMessage === true) return;
    createdConsoleMessage = true;

    if (consoleBranding === true) {
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
};
/**
 * General Viewer options that are used everywhere.
 * - loggingLevel: The logging level that is used.
 * - showMessages: Option to show/hide messages in the browser console.
 * - parallelGlTFProcessing: The number of glTFs that are downloaded and processed at the same time.
 * - consoleBranding: When set to false, the branding in the viewer console will be limited to a single line.
 * - caching: Caching Options.
 */
export const generalOptions: IGeneralOptions = new GeneralOptions();

// #endregion Variables (12)
