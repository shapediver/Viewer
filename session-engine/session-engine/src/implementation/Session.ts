import { ISessionResponse, SessionResponse, ISessionOutput, SessionData, ISessionOutputContent, ISessionParameter, ISessionExport } from '@shapediver/viewer.shared.types';

import { OutputDelayException } from './OutputDelayException';
import { OutputLoader } from './OutputLoader';
import { SessionTreeNode } from './SessionTreeNode';

import { HttpClient, UuidGenerator } from '@shapediver/viewer.shared.utils';
import { container } from 'tsyringe';
import { SettingsEngine, SystemInfo, StateEngine } from '@shapediver/viewer.shared.services';
import { Export } from './Export';
import { Output } from './Output';
import { Parameter } from './Parameter';
import { ISession } from '../interfaces/ISession';
import { Logger } from '@shapediver/viewer.shared.monitoring';

export class Session implements ISession {
    // #region Properties (18)

    private readonly _exports: { [key: string]: Export; } = {};
    private readonly _httpClient = container.resolve(HttpClient);
    private readonly _id: string;
    private readonly _logger = container.resolve(Logger);
    private readonly _modelViewUrl: string;
    private readonly _outputLoader: OutputLoader;
    private readonly _outputs: { [key: string]: Output; } = {};
    private readonly _outputsCreated: { [key: string]: Output; } = {};
    private readonly _parameters: { [key: string]: Parameter; } = {};
    private readonly _sessionEngineId = container.resolve(UuidGenerator).create();
    private readonly _ticket: string;

    private _bearerToken?: string;
    private _headers = {
        "X-ShapeDiver-Origin": (<SystemInfo>container.resolve(SystemInfo)).origin,
        "X-ShapeDiver-ViewerId": '125295ae-3955-46f1-8b41-c2ce046111ec', // TODO
        "X-ShapeDiver-SessionEngineId": this._sessionEngineId,
        "X-ShapeDiver-BuildVersion": '3.0.0.0', // TODO
        "X-ShapeDiver-BuildDate": '2021-02-24T16:30:08.542Z', // TODO
    }

    private _initialized: boolean = false;
    private _loadDefaultSettings: boolean = true;
    private _refreshBearerToken!: () => string;
    private _sessionResponse: SessionResponse;

    // #endregion Properties (18)

    // #region Constructors (1)

    /**
     * Can be use to initialize a session with the ticket and modelViewUrl and returns a scene graph node with the result.
     * Can be use to customize the session with updated parameters to get the updated scene graph node.
     */
    constructor(properties: { id: string, ticket: string, modelViewUrl: string, bearerToken?: string, loadDefaultSettings?: boolean }) {
        this._id = properties.id;
        this._ticket = properties.ticket;
        this._modelViewUrl = properties.modelViewUrl;
        this._bearerToken = properties.bearerToken;
        this._loadDefaultSettings = properties.loadDefaultSettings || true;
        this._sessionResponse = new SessionResponse();
        this._outputLoader = new OutputLoader(this._sessionResponse);
    }

    // #endregion Constructors (1)

    // #region Public Accessors (7)

    public get bearerToken(): string | undefined {
        return this._bearerToken;
    }

    public set bearerToken(value: string | undefined) {
        this._bearerToken = value;
    }

    public get id(): string {
        return this._id;
    }

    public get initialized(): boolean {
        return this._initialized;
    }

    public get modelViewUrl(): string {
        return this._modelViewUrl;
    }

    public set refreshBearerToken(value: () => string) {
        this._refreshBearerToken = value;
    }

    public get ticket(): string {
        return this._ticket;
    }

    // #endregion Public Accessors (7)

    // #region Public Methods (17)

    public createOutput(id: string): Output {
        if (this._outputs[id] || this._outputsCreated[id]) {
            this._logger.error('Output with this id already exists.');
            return this._outputs[id];
        }

        this._outputsCreated[id] = new Output(id, { version: '1.0' });
        this._outputs[id] = this._outputsCreated[id];
        return this._outputs[id];
    }

    /**
     * Customizes the session with updated parameters to get the updated scene graph node.
     * 
     * @param parameters the parameter set to update the session
     * @returns promise with a scene graph node
     */
    public async customize(): Promise<SessionTreeNode> {
        for (let parameterId in this._parameters)
            this._sessionResponse.parameters[parameterId].value = this._parameters[parameterId].value;
        for (let outputId in this._outputsCreated)
            this._sessionResponse.outputs[outputId] = this._outputsCreated[outputId];

        const parameters: { [key: string]: string } = {};
        for (let parameter in this._sessionResponse.parameters)
            parameters[parameter] = this._sessionResponse.parameters[parameter].value;
        return this.customizeSession(parameters);
    }

    /**
     * Getter export
     * @return {Export}
     */
    public getExport(id: string): Export | null {
        const e = this._exports[id];
        if (!e) {
            this._logger.error('Export with this id does not exist.');
            return null;
        }
        return e;
    }

    public getExportById(id: string): Export | null {
        return this.getExport(id);
    }

    public getExportByName(name: string): Export[] {
        const exports: Export[] = [];
        for (let exportId in this._exports) {
            if (name === this._exports[exportId].name)
                exports.push(this._exports[exportId])
        }
        return exports;
    }

    public getExportByType(type: string): Export[] {
        const exports: Export[] = [];
        for (let exportId in this._exports) {
            if (type === this._exports[exportId].type)
                exports.push(this._exports[exportId])
        }
        return exports;
    }

    /**
     * Getter exports
     * @return {{ [key: string]: Export; }}
     */
    public getExports(): { [key: string]: Export; } {
        const r: { [key: string]: Export } = {};
        for (let e in this._exports)
            r[e] = this._exports[e];
        return r;
    }

    /**
     * Getter output
     * @return {Output}
     */
    public getOutput(id: string): Output | null {
        const o = this._outputs[id];
        if (!o) {
            this._logger.error('Output with this id does not exist.');
            return null;
        }
        return o;
    }

    public getOutputById(id: string): Output | null {
        return this.getOutput(id);
    }

    public getOutputByName(name: string): Output[] {
        const outputs: Output[] = [];
        for (let outputId in this._outputs) {
            if (name === this._outputs[outputId].name)
                outputs.push(this._outputs[outputId])
        }
        return outputs;
    }

    /**
     * Getter outputs
     * @return {{ [key: string]: Output; }}
     */
    public getOutputs(): { [key: string]: Output; } {
        const r: { [key: string]: Output } = {};
        for (let o in this._outputs)
            r[o] = this._outputs[o];
        return r;
    }

    /**
     * Getter parameter
     * @return {Parameter}
     */
    public getParameter(id: string): Parameter | null {
        const p = this._parameters[id];
        if (!p) {
            this._logger.error('Parameter with this id does not exist.');
            return null;
        }
        return p;
    }

    public getParameterById(id: string): Parameter | null {
        return this.getParameter(id);
    }

    public getParameterByName(name: string): Parameter[] {
        const parameters: Parameter[] = [];
        for (let parameterId in this._parameters) {
            if (name === this._parameters[parameterId].name)
                parameters.push(this._parameters[parameterId])
        }
        return parameters;
    }

    public getParameterByType(type: string): Parameter[] {
        const parameters: Parameter[] = [];
        for (let parameterId in this._parameters) {
            if (type === this._parameters[parameterId].type)
                parameters.push(this._parameters[parameterId])
        }
        return parameters;
    }

    /**
     * Getter parameters
     * @return {{ [key: string]: Parameter; }}
     */
    public getParameters(): { [key: string]: Parameter; } {
        const r: { [key: string]: Parameter } = {};
        for (let p in this._parameters)
            r[p] = this._parameters[p];
        return r;
    }

    /**
     * Initializes the session with the ticket and modelViewUrl.
     * 
     * @returns promise with a scene graph node
     */
    public async init(): Promise<SessionTreeNode> {
        if (this._initialized === true) {
            this._logger.error('Session already initialized.');
            const parameters: { [key: string]: string } = {};
            for (let parameter in this._sessionResponse.parameters)
                parameters[parameter] = this._sessionResponse.parameters[parameter].value;
            return this.loadOutputs(parameters, this._sessionResponse.outputs);
        }

        const headers = this._bearerToken ? Object.assign({ "Authorization": this._bearerToken }, this._headers) : this._headers;

        try {
            let sessionResponse;
            try {
                sessionResponse = <ISessionResponse>(await this._httpClient.post(this._modelViewUrl + "/ticket/" + this._ticket, null, { headers })).data;
            } catch (e) {
                if (e.response && e.response.status && e.response.status === 403 && e.response.data && (e.response.data.error === 'SdJwtValidationError' || e.response.data.error === 'SdErrorUnauthorized')) {
                    if (!this._refreshBearerToken) {
                        this._logger.error('Session init failed. Bearer Token invalid, please try to supply a valid token or assign the "refreshBearerToken" callback.');
                        return new SessionTreeNode();
                    } else {
                        const bearerToken = this.bearerToken;
                        const newToken = this._refreshBearerToken();
                        if (bearerToken === newToken) {
                            this._logger.error('Session init failed. Bearer Token invalid, callback "refreshBearerToken" supplied the same token.');
                            return new SessionTreeNode();
                        } else {
                            this.bearerToken = newToken;
                            return this.init();
                        }
                    }
                }

                this._logger.error('Session init failed.', e, e.response && e.response.status ? e.response.status : null);
                return new SessionTreeNode();
            }

            if (this._loadDefaultSettings && !(<StateEngine>container.resolve(StateEngine)).settingsRegistered.resolved) (<SettingsEngine>container.resolve(SettingsEngine)).fromJson(sessionResponse.config);
            this._sessionResponse.adaptSession(sessionResponse);

            const parameters: { [key: string]: string } = {};
            for (let parameter in this._sessionResponse.parameters)
                parameters[parameter] = this._sessionResponse.parameters[parameter].value;

            for (let parameterId in this._sessionResponse.parameters)
                this._parameters[parameterId] = new Parameter(parameterId, this._sessionResponse.parameters[parameterId]);
            for (let exportId in this._sessionResponse.exports)
                this._exports[exportId] = new Export(exportId, this._sessionResponse.exports[exportId]);
            for (let outputId in this._sessionResponse.outputs)
                this._outputs[outputId] = new Output(outputId, this._sessionResponse.outputs[outputId]);

            this._initialized = true;
            return this.loadOutputs(parameters, this._sessionResponse.outputs);
        } catch (e) {
            this._logger.error('Something went wrong at session init.', e);
            return new SessionTreeNode();
        }
    }

    // #endregion Public Methods (17)

    // #region Private Methods (3)

    private async customizeSession(parameters: { [key: string]: string }): Promise<SessionTreeNode> {
        if (this._initialized === false) {
            this._logger.error('Session not initialized.');
            return new SessionTreeNode();
        }
        try {
            let headers = this._bearerToken ? Object.assign({ "Authorization": this._bearerToken }, this._headers) : this._headers;
            headers = Object.assign({ "Content-Type": "application/json" }, this._headers);
            let responseCustomize;
            try {
                responseCustomize = <ISessionResponse>(await this._httpClient.post(this._sessionResponse.actions['customize'].href!, null, { data: parameters, headers })).data;
            } catch (e) {
                if (e.response && e.response.status) {
                    if (e.response.status === 403 && e.response.data && (e.response.data.error === 'SdJwtValidationError' || e.response.data.error === 'SdErrorUnauthorized')) {
                        if (!this._refreshBearerToken) {
                            this._logger.error('Session customization failed. Bearer Token invalid, please try to supply a valid token or assign the "refreshBearerToken" callback.');
                            return new SessionTreeNode();
                        } else {
                            const bearerToken = this.bearerToken;
                            const newToken = this._refreshBearerToken();
                            if (bearerToken === newToken) {
                                this._logger.error('Session customization failed. Bearer Token invalid, callback "refreshBearerToken" supplied the same token.');
                                return new SessionTreeNode();
                            } else {
                                this.bearerToken = newToken;
                                return this.customizeSession(parameters);
                            }
                        }
                    } else if (e.response.status === 410) {
                        this._logger.info('Session customization failed. Session expired. Re-initializing session.');
                        this._initialized = false;
                        await this.init();
                        return this.customizeSession(parameters);
                    }
                }

                this._logger.error('Session customization failed.', e, e.response && e.response.status ? e.response.status : null);
                return new SessionTreeNode();
            }

            this._sessionResponse.adaptSession(responseCustomize);
            return this.loadOutputs(parameters, this._sessionResponse.outputs);
        } catch (e) {
            this._logger.error('Something went wrong at session customization.', e);
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
    private async loadOutputs(parameters: { [key: string]: string }, outputs: { [key: string]: ISessionOutput; }): Promise<SessionTreeNode> {
        try {
            const node = await this._outputLoader.loadOutputs(outputs);
            node.data.push(new SessionData(this._sessionResponse));
            return node;
        }
        catch (e) {
            if (e instanceof OutputDelayException) {
                await this.timeout(e.delay);
            }
            return this.customizeSession(parameters);
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

    // #endregion Private Methods (3)
}