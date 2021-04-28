import { ISessionResponse, SessionResponse, ISessionOutput, SessionData, ISessionOutputContent, ISessionParameter, ISessionExport } from '@shapediver/viewer.shared.types';

import { OutputDelayException } from './OutputDelayException';
import { OutputLoader } from './OutputLoader';
import { SessionTreeNode } from './SessionTreeNode';

import { HttpClient, UuidGenerator } from '@shapediver/viewer.shared.utils';
import { container } from 'tsyringe';
import { SettingsEngine, SystemInfo, StateEngine } from '@shapediver/viewer.shared.services';
import { Export } from './Export';
import { Output } from './Output';
import { ISession } from '../interfaces/ISession';
import { Logger } from '@shapediver/viewer.shared.monitoring';
import { AxiosResponse } from 'axios';
import { AbstractParameter } from './AbstractParameter';
import { IParameter, PARAMETERTYPE } from '../interfaces/IParameter';
import { BooleanParameter } from './parameters/BooleanParameter';
import { StringParameter } from './parameters/StringParameter';
import { TimeParameter } from './parameters/TimeParameter';
import { StringListParameter } from './parameters/StringListParameter';
import { OddParameter } from './parameters/OddParameter';
import { IntParameter } from './parameters/IntParameter';
import { FloatParameter } from './parameters/FloatParameter';
import { EvenParameter } from './parameters/EvenParameter';
import { ColorParameter } from './parameters/ColorParameter';
import { FileParameter } from './parameters/FileParameter';

export class Session implements ISession {
    // #region Properties (18)

    private readonly _exports: { [key: string]: Export; } = {};
    private readonly _httpClient: HttpClient = <HttpClient>container.resolve(HttpClient);
    private readonly _id: string;
    private readonly _logger: Logger = <Logger>container.resolve(Logger);
    private readonly _modelViewUrl: string;
    private readonly _outputLoader: OutputLoader;
    private readonly _outputs: { [key: string]: Output; } = {};
    private readonly _outputsCreated: { [key: string]: Output; } = {};
    private readonly _parameters: { [key: string]: AbstractParameter<any>; } = {};
    private readonly _sessionEngineId = (<UuidGenerator>container.resolve(UuidGenerator)).create();
    private readonly _ticket: string;

    private _authorTicket?: boolean;
    private _bearerToken?: string;
    private _headers = {
        "X-ShapeDiver-Origin": (<SystemInfo>container.resolve(SystemInfo)).origin,
        "X-ShapeDiver-SessionEngineId": this._sessionEngineId,
        "X-ShapeDiver-BuildVersion": '',
        "X-ShapeDiver-BuildDate": ''
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
    constructor(properties: { id: string, ticket: string, modelViewUrl: string, buildVersion: string, buildDate: string, bearerToken?: string, loadDefaultSettings?: boolean }) {
        this._id = properties.id;
        this._ticket = properties.ticket;
        this._modelViewUrl = properties.modelViewUrl;
        this._bearerToken = properties.bearerToken;
        this._headers['X-ShapeDiver-BuildDate'] = properties.buildDate;
        this._headers['X-ShapeDiver-BuildVersion'] = properties.buildVersion;
        this._loadDefaultSettings = properties.loadDefaultSettings || true;
        this._sessionResponse = new SessionResponse();
        this._outputLoader = new OutputLoader(this._sessionResponse);
    }

    // #endregion Constructors (1)

    // #region Public Accessors (10)

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

    /**
     * Setter refreshBearerToken
     * @param {() => string} value
     */
    public set refreshBearerToken(value: () => string) {
        this._refreshBearerToken = value;
    }

    /**
     * Getter sessionResponse
     * @return {SessionResponse}
     */
    public get sessionResponse(): SessionResponse {
        return this._sessionResponse;
    }

    /**
     * Getter ticket
     * @return {string}
     */
    public get ticket(): string {
        return this._ticket;
    }

    // #endregion Public Accessors (10)

    // #region Public Methods (21)

    public createOutput(id: string): Output {
        if (this._outputs[id] || this._outputsCreated[id]) {
            this._logger.error('Output with this id already exists.');
            return this._outputs[id];
        }

        this._outputsCreated[id] = new Output(this, id, { version: '1.0' });
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
        return this.customizeSession(this.getParametersAsString());
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
    public getParameter(id: string): IParameter<any> | null {
        const p = this._parameters[id];
        if (!p) {
            this._logger.error('Parameter with this id does not exist.');
            return null;
        }
        return p;
    }

    public getParameterById(id: string): IParameter<any> | null {
        return this.getParameter(id);
    }

    public getParameterByName(name: string): IParameter<any>[] {
        const parameters: IParameter<any>[] = [];
        for (let parameterId in this._parameters) {
            if (name === this._parameters[parameterId].name)
                parameters.push(this._parameters[parameterId])
        }
        return parameters;
    }

    public getParameterByType(type: string): IParameter<any>[] {
        const parameters: IParameter<any>[] = [];
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
    public getParameters(): { [key: string]: IParameter<any>; } {
        const r: { [key: string]: IParameter<any> } = {};
        for (let p in this._parameters)
            r[p] = this._parameters[p];
        return r;
    }

    public getParametersAsString(): { [key: string]: string } {
        const parameters: { [key: string]: string } = {};
        for (let parameter in this._parameters)
            parameters[parameter] = this._parameters[parameter].toString();
        return parameters;
    }

    /**
     * Initializes the session with the ticket and modelViewUrl.
     * 
     * @returns promise with a scene graph node
     */
    public async init(): Promise<SessionTreeNode> {
        if (this._initialized === true) {
            this._logger.error('Session already initialized.');
            return this.loadOutputs(this.getParametersAsString(), this._sessionResponse.outputs);
        }

        try {
            let sessionResponse;
            try {
                sessionResponse = <ISessionResponse>(await this.sessionCommunication(this._modelViewUrl + "/ticket/" + this._ticket, 'post', null)).data;
            } catch (e) {
                this._logger.error('Session init failed.', e, e.response && e.response.status ? e.response.status : null);
                return new SessionTreeNode();
            }

            if (this._loadDefaultSettings) (<SettingsEngine>container.resolve(SettingsEngine)).fromJson(sessionResponse.config, this.id);
            this._sessionResponse.adaptSession(sessionResponse);

            this._authorTicket = !!(this._sessionResponse.actions['defaultparam'] && this._sessionResponse.actions['configure']);

            for (let parameterId in this._sessionResponse.parameters) {
                switch (this._sessionResponse.parameters[parameterId].type.toLowerCase()) {
                    case PARAMETERTYPE.BOOL:
                        this._parameters[parameterId] = new BooleanParameter(this, parameterId, this._sessionResponse.parameters[parameterId]);
                        break;
                    case PARAMETERTYPE.COLOR:
                        this._parameters[parameterId] = new ColorParameter(this, parameterId, this._sessionResponse.parameters[parameterId]);
                        break;
                    case PARAMETERTYPE.EVEN:
                        this._parameters[parameterId] = new EvenParameter(this, parameterId, this._sessionResponse.parameters[parameterId]);
                        break;
                    case PARAMETERTYPE.FILE:
                        this._parameters[parameterId] = new FileParameter(this, parameterId, this._sessionResponse.parameters[parameterId]);
                        break;
                    case PARAMETERTYPE.FLOAT:
                        this._parameters[parameterId] = new FloatParameter(this, parameterId, this._sessionResponse.parameters[parameterId]);
                        break;
                    case PARAMETERTYPE.INT:
                        this._parameters[parameterId] = new IntParameter(this, parameterId, this._sessionResponse.parameters[parameterId]);
                        break;
                    case PARAMETERTYPE.ODD:
                        this._parameters[parameterId] = new OddParameter(this, parameterId, this._sessionResponse.parameters[parameterId]);
                        break;
                    case PARAMETERTYPE.STRINGLIST:
                        this._parameters[parameterId] = new StringListParameter(this, parameterId, this._sessionResponse.parameters[parameterId]);
                        break;
                    case PARAMETERTYPE.TIME:
                        this._parameters[parameterId] = new TimeParameter(this, parameterId, this._sessionResponse.parameters[parameterId]);
                        break;
                    default:
                        this._parameters[parameterId] = new StringParameter(this, parameterId, this._sessionResponse.parameters[parameterId]);
                }
            }
            for (let exportId in this._sessionResponse.exports)
                this._exports[exportId] = new Export(this, exportId, this._sessionResponse.exports[exportId]);
            for (let outputId in this._sessionResponse.outputs)
                this._outputs[outputId] = new Output(this, outputId, this._sessionResponse.outputs[outputId]);

            this._initialized = true;
            return this.loadOutputs(this.getParametersAsString(), this._sessionResponse.outputs);
        } catch (e) {
            this._logger.error('Something went wrong at session init.', e);
            return new SessionTreeNode();
        }
    }

    public async saveDefaultParameters(): Promise<boolean> {
        if (!this._sessionResponse.actions['defaultparam']) {
            this._logger.error('Session has to be in edit mode to be able to save the settings.');
            return false;
        }
        try {
            await this.sessionCommunication(this._sessionResponse.actions['defaultparam'].href!, this._sessionResponse.actions['defaultparam'].method!, this.getParametersAsString(), 'application/json');
            return true;
        } catch (e) {
            this._logger.error('Saving of default parameters failed.', e, e.response && e.response.status ? e.response.status : null);
            return false;
        }
    }

    public async saveSettings(json: any): Promise<boolean> {
        if (!this._sessionResponse.actions['configure']) {
            this._logger.error('Session has to be in edit mode to be able to save the settings.');
            return false;
        }
        try {
            await this.sessionCommunication(this._sessionResponse.actions['configure'].href!, this._sessionResponse.actions['configure'].method!, json, 'application/json');
            return true;
        } catch (e) {
            this._logger.error('Saving of settings failed.', e, e.response && e.response.status ? e.response.status : null);
            return false;
        }
    }

    public async sessionCommunication(href: string, method: string | 'post' | 'get', data: any, contentType?: string): Promise<AxiosResponse<any>> {
        let headers = this._bearerToken ? Object.assign({ "Authorization": this._bearerToken }, this._headers) : this._headers;
        if (contentType) headers = Object.assign({ "Content-Type": contentType }, this._headers);

        method = method.toLowerCase();
        if (method !== 'post' && method !== 'get') throw new Error('Method ' + method + ' not recognized.');
        try {
            return await this._httpClient[method](href, { data, headers });
        } catch (e) {
            if (e.response && e.response.status && e.response.status === 403 && e.response.data && (e.response.data.error === 'SdJwtValidationError' || e.response.data.error === 'SdErrorUnauthorized')) {
                if (!this._refreshBearerToken) {
                    this._logger.error('Session request failed. Bearer Token invalid, please try to supply a valid token or assign the "refreshBearerToken" callback.');
                    throw e;
                } else {
                    const bearerToken = this.bearerToken;
                    const newToken = this._refreshBearerToken();
                    if (bearerToken === newToken) {
                        this._logger.error('Session request failed. Bearer Token invalid, callback "refreshBearerToken" supplied the same token.');
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

    // #endregion Public Methods (21)

    // #region Private Methods (3)

    private async customizeSession(parameters: { [key: string]: string }): Promise<SessionTreeNode> {
        if (this._initialized === false) {
            this._logger.error('Session not initialized.');
            return new SessionTreeNode();
        }
        try {
            let responseCustomize;
            try {
                for (let parameter in parameters)
                    if (this._parameters[parameter] instanceof FileParameter) parameters[parameter] = await (<FileParameter>this._parameters[parameter]).upload();
                console.log(parameters)
                responseCustomize = <ISessionResponse>(await this.sessionCommunication(this._sessionResponse.actions['customize'].href!, 'post', parameters, 'application/json')).data;
            } catch (e) {
                if (e.response && e.response.status) {
                    if (e.response && e.response.status && e.response.status === 410) {
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
            if (e instanceof OutputDelayException)
                await this.timeout(e.delay);

            let outputMapping: { [key: string]: string } = {};
            for (let output in outputs)
                outputMapping[output] = outputs[output].version;

            let responseCache = (await this.sessionCommunication(this._sessionResponse.actions['cache'].href!, this._sessionResponse.actions['cache'].method!.toLowerCase(), outputMapping, 'application/json')).data;
            this._sessionResponse.adaptSession(responseCache);
            return await this.loadOutputs(parameters, outputs);
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