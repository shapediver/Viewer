import { HttpClient, PerformanceEvaluator, SDError, UuidGenerator } from '@shapediver/viewer.shared.utils'
import { container } from 'tsyringe'
import { SettingsEngine, StateEngine, SystemInfo } from '@shapediver/viewer.shared.services'
import { Logger, LOGGINGTOPIC } from '@shapediver/viewer.shared.utils'
import { AxiosResponse } from 'axios'
import {
  ShapeDiverResponseBase,
  ShapeDiverResponseExport,
  ShapeDiverResponseExportDefinitionType,
  ShapeDiverResponseOutput,
  ShapeDiverResponseParameter,
} from '@shapediver/api.geometry-api-dto-v1'

import { OutputDelayException } from './OutputDelayException'
import { OutputLoader } from './OutputLoader'
import { SessionTreeNode } from './SessionTreeNode'
import { ISession } from '../interfaces/ISession'
import { SessionData } from './SessionData'

export class Session implements ISession {
    // #region Properties (19)

    private readonly _exports: { [key: string]: ShapeDiverResponseExport; } = {};
    private readonly _httpClient: HttpClient = <HttpClient>container.resolve(HttpClient);
    private readonly _id: string;
    private readonly _logger: Logger = <Logger>container.resolve(Logger);
    private readonly _modelViewUrl: string;
    private readonly _outputLoader: OutputLoader;
    private readonly _outputs: { [key: string]: ShapeDiverResponseOutput; } = {};
    private readonly _outputsCreated: { [key: string]: ShapeDiverResponseOutput; } = {};
    private readonly _parameters: { [key: string]: ShapeDiverResponseParameter; } = {};
    private readonly _parameterValues: { [key: string]: string; } = {};
    private readonly _performanceEvaluator = <PerformanceEvaluator>container.resolve(PerformanceEvaluator);
    private readonly _sessionEngineId = (<UuidGenerator>container.resolve(UuidGenerator)).create();
    private readonly _ticket: string;

    private _authorTicket?: boolean;
    private _bearerToken?: string;
    private _closed: boolean = false;
    private _headers = {
        "X-ShapeDiver-Origin": (<SystemInfo>container.resolve(SystemInfo)).origin,
        "X-ShapeDiver-SessionEngineId": this._sessionEngineId,
        "X-ShapeDiver-BuildVersion": '',
        "X-ShapeDiver-BuildDate": ''
    }

    private _initialized: boolean = false;
    private _refreshBearerToken!: () => string;
    private _sessionResponse!: ShapeDiverResponseBase;
    private _settingsConfig: any = {};
    private _updateCBs: (() => void)[] = [];

    // #endregion Properties (19)

    // #region Constructors (1)

    /**
     * Can be use to initialize a session with the ticket and modelViewUrl and returns a scene graph node with the result.
     * Can be use to customize the session with updated parameters to get the updated scene graph node.
     */
    constructor(properties: { id: string, ticket: string, modelViewUrl: string, buildVersion: string, buildDate: string, bearerToken?: string, primarySession?: boolean }) {
        this._id = properties.id;
        this._ticket = properties.ticket;
        this._modelViewUrl = properties.modelViewUrl;
        this._bearerToken = properties.bearerToken;
        this._headers['X-ShapeDiver-BuildDate'] = properties.buildDate;
        this._headers['X-ShapeDiver-BuildVersion'] = properties.buildVersion;
        this._outputLoader = new OutputLoader();
    }

    // #endregion Constructors (1)

    // #region Public Accessors (12)

    /**
     * Getter authorTicket
     * @return {boolean | undefined}
     */
    public get authorTicket(): boolean | undefined {
        return this._authorTicket;
    }

    /**
     * Setter authorTicket
     * @param {boolean | undefined} value
     */
    public set authorTicket(value: boolean | undefined) {
        this._authorTicket = value;
        this._updateCBs.forEach(v => v());
}

    /**
     * Getter bearerToken
     * @return {string | undefined}
     */
    public get bearerToken(): string | undefined {
        return this._bearerToken;
    }

    /**
     * Setter bearerToken
     * @param {string | undefined} value
     */
    public set bearerToken(value: string | undefined) {
        this._bearerToken = value;
        this._updateCBs.forEach(v => v());
    }

    public get exports(): { [key: string]: ShapeDiverResponseExport; } {
        return this._exports;
    }

    /**
     * Getter id
     * @return {string}
     */
    public get id(): string {
        return this._id;
    }

    /**
     * Getter initialized
     * @return {boolean}
     */
    public get initialized(): boolean {
        return this._initialized;
    }

    /**
     * Getter modelViewUrl
     * @return {string}
     */
    public get modelViewUrl(): string {
        return this._modelViewUrl;
    }

    public get outputs(): { [key: string]: ShapeDiverResponseOutput; } {
        return this._outputs;
    }

    public get parameters(): { [key: string]: ShapeDiverResponseParameter; } {
        return this._parameters;
    }

    public get parameterValues(): { [key: string]: string; } {
        return this._parameterValues;
    }

    /**
     * Setter refreshBearerToken
     * @param {() => string} value
     */
    public set refreshBearerToken(value: () => string) {
        this._refreshBearerToken = value;
        this._updateCBs.forEach(v => v());
    }

    /**
     * Getter sessionResponse
     * @return {ShapeDiverResponse}
     */
    public get sessionResponse(): ShapeDiverResponseBase {
        return this._sessionResponse;
    }

    /**
     * Getter settingsConfig
     * @return {any}
     */
    public get settingsConfig(): any {
        return this._settingsConfig;
    }

    /**
     * Getter ticket
     * @return {string}
     */
    public get ticket(): string {
        return this._ticket;
    }

    // #endregion Public Accessors (12)

    // #region Public Methods (18)

    public async close(): Promise<boolean> {
        this._closed = true;
        if (this._initialized) {
            try {
                await this.sessionCommunication(this._sessionResponse.actions?.filter(v => v.name === 'close')[0].href!, this._sessionResponse.actions?.filter(v => v.name === 'close')[0].method!, null, 'application/json');
            } catch (e) {
                if (e.response && e.response.status) {
                    this._logger.httpError(LOGGINGTOPIC.SESSION, new SDError(e.message, e), `Session.close: Session closing failed.`, e.response.status, false)
                  } else {
                    this._logger.error(LOGGINGTOPIC.SESSION, new SDError(e.message, e), `Session.close: Session closing failed.`, false)
                }
                return false;
            }
        }
        return true;
    }

    /**
     * Customizes the session with updated parameters to get the updated scene graph node.
     * 
     * @param parameters the parameter set to update the session
     * @returns promise with a scene graph node
     */
    public async customize(cancelRequest: () => boolean): Promise<SessionTreeNode> {
        return this.customizeSession(this._parameterValues, cancelRequest);
    }

    /**
     * Initializes the session with the ticket and modelViewUrl.
     * 
     * @returns promise with a scene graph node
     */
    public async init(): Promise<SessionTreeNode> {
        if (this._initialized === true) {
            this._logger.error(LOGGINGTOPIC.SESSION, new SDError('Session.init: Session already initialized.'));
            return this.loadOutputs(this._parameterValues);
        }

        try {
            let sessionResponse;
            try {
                this._performanceEvaluator.startSection('sessionResponse');
                sessionResponse = <ShapeDiverResponseBase>(await this.sessionCommunication(this._modelViewUrl + "/ticket/" + this._ticket, 'post', null)).data;
                this._performanceEvaluator.endSection('sessionResponse');
            } catch (e) {                
                if (e.response && e.response.status) {
                    this._logger.httpError(LOGGINGTOPIC.SESSION, new SDError(e.message, e), `Session.init: Session init failed.`, e.response.status, false)
                } else {
                    this._logger.error(LOGGINGTOPIC.SESSION, new SDError(e.message, e), `Session.init: Session init failed.`, false)
                }
                return new SessionTreeNode();
            }

            this._settingsConfig = sessionResponse.config;
            this._sessionResponse = this.mergeResponses(this._sessionResponse, sessionResponse, this._parameters, this._outputs, this._exports);
            this._authorTicket = !!(this._sessionResponse.actions?.filter(v => v.name === 'defaultparam')[0] && this._sessionResponse.actions?.filter(v => v.name === 'configure')[0]);

            this._initialized = true;
            this._updateCBs.forEach(v => v());
            return this.loadOutputs(this._parameterValues);
        } catch (e) {
            this._logger.error(LOGGINGTOPIC.SESSION, new SDError(e.message, e), 'Session.init: Something went wrong at session init.');
            return new SessionTreeNode();
        }
    }

    public mergeResponses(r1: ShapeDiverResponseBase, r2: ShapeDiverResponseBase, parameters?: { [key: string]: ShapeDiverResponseParameter; }, outputs?: { [key: string]: ShapeDiverResponseOutput; }, exports?: { [key: string]: ShapeDiverResponseExport; }): ShapeDiverResponseBase {
        if (!r1)
            r1 = { version: r2.version };

        // convert version
        if (r2.version)
            r1.version = r2.version;

        // convert version
        if (r2.collection)
            r1.collection = r2.collection;

        // merge actions
        if (r2.actions) {
            for (let i = 0, len = r2.actions.length; i < len; i++) {
                r1.actions = r1.actions || [];
                if (r1.actions.findIndex((value) => value.name === r2.actions![i].name) === -1)
                    r1.actions.push(r2.actions[i])
            }
        }

        // merge templates
        if (r2.templates) {
            for (let i = 0, len = r2.templates.length; i < len; i++) {
                r1.templates = r1.templates || [];
                if (r1.templates.findIndex((value) => value.name === r2.actions![i].name) === -1)
                    r1.templates.push(r2.templates[i])
            }
        }

        // convert config
        if (r2.config && !r1.config)
            r1.config = r2.config;

        // convert name
        if (r2.name && !r1.name)
            r1.name = r2.name;

        // convert parameters
        if (r2.parameters) {
            for (let parameterId in r2.parameters) {
                r1.parameters = r1.parameters || {};
                r1.parameters[parameterId] = r1.parameters[parameterId] || r2.parameters[parameterId];
            }
        }

        // convert outputs
        if (r2.outputs) {
            for (let outputId in r2.outputs) {
                r1.outputs = r1.outputs || {};
                if ('version' in r2.outputs[outputId] || !(r1.outputs[outputId] && 'version' in r1.outputs[outputId]))
                    r1.outputs[outputId] = r2.outputs[outputId];
            }
        }

        // convert exports
        if (r2.exports) {
            for (let exportId in r2.exports) {
                r1.exports = r1.exports || {};
                if ('version' in r2.exports[exportId] || !(r1.exports[exportId] && 'version' in r1.exports[exportId]))
                    r1.exports[exportId] = r2.exports[exportId];
            }
        }

        if (parameters) {
            for (let parameterId in r1.parameters) {
                if(parameters[parameterId]) continue;
                parameters[parameterId] = r1.parameters[parameterId];
                parameters[parameterId].id = parameterId;
            }
        }

        if (exports) {
            for (let exportId in r1.exports)
                if(r1.exports[exportId].type === ShapeDiverResponseExportDefinitionType.EMAIL || r1.exports[exportId].type === ShapeDiverResponseExportDefinitionType.DOWNLOAD) {
                    exports[exportId] = r1.exports[exportId];
                    exports[exportId].id = exportId;
                }
        }

        if (outputs) {
            for (let outputId in r1.outputs) {
                outputs[outputId] = <ShapeDiverResponseOutput>r1.outputs[outputId];
                outputs[outputId].id = outputId;
            }
        }

        return r1;
    }

    public async saveDefaultParameters(): Promise<boolean> {
        if (!this._sessionResponse.actions?.filter(v => v.name === 'defaultparam')[0]) {
            this._logger.error(LOGGINGTOPIC.SESSION, new SDError('Session.saveDefaultParameters: Session has to be in edit mode to be able to save the settings.'));
            return false;
        }
        try {
            await this.sessionCommunication(this._sessionResponse.actions?.filter(v => v.name === 'defaultparam')[0].href!, this._sessionResponse.actions?.filter(v => v.name === 'defaultparam')[0].method!, this._parameterValues, 'application/json');
            return true;
        } catch (e) {                
            if (e.response && e.response.status) {
                this._logger.httpError(LOGGINGTOPIC.SESSION, new SDError(e.message, e), `Session.saveDefaultParameters: Saving of default parameters failed.`, e.response.status, false)
            } else {
                this._logger.error(LOGGINGTOPIC.SESSION, new SDError(e.message, e), `Session.saveDefaultParameters: Saving of default parameters failed.`, false)
            }
            return false;
        }
    }

    public async saveSettings(json: any): Promise<boolean> {
        if (!this._sessionResponse.actions?.filter(v => v.name === 'configure')[0]) {
            this._logger.error(LOGGINGTOPIC.SESSION, new SDError('Session.saveSettings: Session has to be in edit mode to be able to save the settings.'));
            return false;
        }
        try {
            await this.sessionCommunication(this._sessionResponse.actions?.filter(v => v.name === 'configure')[0].href!, this._sessionResponse.actions?.filter(v => v.name === 'configure')[0].method!, json, 'application/json');
            return true;
        } catch (e) {
            if (e.response && e.response.status) {
                this._logger.httpError(LOGGINGTOPIC.SESSION, new SDError(e.message, e), `Session.saveSettings: Saving of settings failed.`, e.response.status, false)
            } else {
                this._logger.error(LOGGINGTOPIC.SESSION, new SDError(e.message, e), `Session.saveSettings: Saving of settings failed.`, false)
            }
            return false;
        }
    }

    public async sessionCommunication(href: string, method: string | 'post' | 'get', data: any, contentType?: string): Promise<AxiosResponse<any>> {
        let headers = this._bearerToken ? Object.assign({ "Authorization": this._bearerToken }, this._headers) : this._headers;
        if (contentType) headers = Object.assign({ "Content-Type": contentType }, this._headers);

        method = method.toLowerCase();
        if (method !== 'post' && method !== 'get') throw this._logger.error(LOGGINGTOPIC.SESSION, new SDError('Session: Method ' + method + ' not recognized.'));
        try {
            return await this._httpClient[method](href, { data, headers });
        } catch (e) {
            if (e.response && e.response.status && e.response.status === 403 && e.response.data && (e.response.data.error === 'SdJwtValidationError' || e.response.data.error === 'SdErrorUnauthorized')) {
                if (!this._refreshBearerToken) {
                    this._logger.error(LOGGINGTOPIC.SESSION, new SDError('Session.sessionCommunication: Session request failed. Bearer Token invalid, please try to supply a valid token or assign the "refreshBearerToken" callback.'));
                    throw e;
                } else {
                    const bearerToken = this.bearerToken;
                    const newToken = this._refreshBearerToken();
                    if (bearerToken === newToken) {
                        this._logger.error(LOGGINGTOPIC.SESSION, new SDError('Session.sessionCommunication: Session request failed. Bearer Token invalid, callback "refreshBearerToken" supplied the same token.'));
                        throw e;
                    } else {
                        this.bearerToken = newToken;
                        return this.sessionCommunication(href, method, data, contentType);
                    }
                }
            }
            throw e;
        }
    }

    // #endregion Public Methods (18)

    // #region Private Methods (3)

    private async customizeSession(parameters: { [key: string]: string }, cancelRequest: () => boolean): Promise<SessionTreeNode> {
        if (this._initialized === false) {
            this._logger.error(LOGGINGTOPIC.SESSION, new SDError('Session.customizeSession: Session not initialized.'));
            return new SessionTreeNode();
        }
        try {
            let responseCustomize;
            try {
                this._performanceEvaluator.startSection('sessionResponse');
                responseCustomize = <ShapeDiverResponseBase>(await this.sessionCommunication(this._sessionResponse.actions?.filter(v => v.name === 'customize')[0].href!, 'post', parameters, 'application/json')).data;
                this._performanceEvaluator.endSection('sessionResponse');
                if(cancelRequest()) return new SessionTreeNode();
            } catch (e) {
                if (e.response && e.response.status) {
                    if (e.response && e.response.status && e.response.status === 410 && !this._closed) {
                        this._logger.info(LOGGINGTOPIC.SESSION, 'Session.customizeSession: Session customization failed. Session expired. Re-initializing session.');
                        this._initialized = false;
                        this._updateCBs.forEach(v => v());
                        await this.init();
                        if(cancelRequest()) return new SessionTreeNode();
                        return this.customizeSession(parameters, cancelRequest);
                    }
                }

                if (e.response && e.response.status) {
                    this._logger.httpError(LOGGINGTOPIC.SESSION, new SDError(e.message, e), `Session.customizeSession: Session customization failed.`, e.response.status, false)
                } else {
                    this._logger.error(LOGGINGTOPIC.SESSION, new SDError(e.message, e), `Session.customizeSession: Session customization failed.`, false)
                }
                return new SessionTreeNode();
            }
            this._sessionResponse = this.mergeResponses(this._sessionResponse, responseCustomize, this._parameters, this._outputs, this._exports);
            return this.loadOutputs(parameters, cancelRequest);
        } catch (e) {
            this._logger.error(LOGGINGTOPIC.SESSION, new SDError(e.message, e), 'Session.customizeSession: Something went wrong at session customization.');
            return new SessionTreeNode();
        }
    }

    /**
     * Load the outputs and return the scene graph node of the result.
     * In case the outputs have a delay property, another customization request with the parameter set is sent.
     * 
     * @param parameters the parameter set to update the session 
     * @param outputs the outputs to load
     * @returns promise with a scene graph node
     */
    private async loadOutputs(parameters: { [key: string]: string }, cancelRequest: () => boolean = () => false): Promise<SessionTreeNode> {
        const o = Object.assign({}, this._outputs, this._outputsCreated);
        try {
            const node = await this._outputLoader.loadOutputs(this._sessionResponse, o);
            node.data.push(new SessionData(this._sessionResponse));
            return node;
        }
        catch (e) {
            if (e instanceof OutputDelayException)
                await this.timeout(e.delay);

            if(cancelRequest()) return new SessionTreeNode();
            let outputMapping: { [key: string]: string } = {};
            for (let output in o)
                outputMapping[output] = o[output].version;

            let responseCache = (await this.sessionCommunication(this._sessionResponse.actions?.filter(v => v.name === 'cache')[0].href!, this._sessionResponse.actions?.filter(v => v.name === 'cache')[0].method!.toLowerCase()!, outputMapping, 'application/json')).data;
            if(cancelRequest()) return new SessionTreeNode();
            this._sessionResponse = this.mergeResponses(this._sessionResponse, responseCache, this._parameters, this._outputs, this._exports);
            return await this.loadOutputs(parameters, cancelRequest);
        }
    }

    /**
     * Returns a promise that resolves after the amount of milliseconds provided.
     * 
     * @param ms the milliseconds
     * @returns promise that resolve after specified milliseconds
     */
    private async timeout(ms: number): Promise<any> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    public addUpdateCB(value: () => void) {
        this._updateCBs.push(value)
    }

    // #endregion Private Methods (3)
}