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
import { EXPORTTYPE } from '../interfaces/IExport';
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
import { SessionData } from './SessionData';
import { ShapeDiverResponseBase as ShapeDiverResponse } from "@shapediver/api.geometry-api-dto-v1"
import { SBitmapParameter } from './parameters/SBitmapParameter';
import { SCurveParameter } from './parameters/SCurveParameter';
import { SIntegerParameter } from './parameters/SIntegerParameter';
import { SNumberParameter } from './parameters/SNumberParameter';
import { SStringParameter } from './parameters/SStringParameter';
import { SParameter } from './parameters/SParameter';

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

    private _closed: boolean = false;
    private _initialized: boolean = false;
    private _refreshBearerToken!: () => string;
    private _sessionResponse!: ShapeDiverResponse;
    private _settingsConfig: any = {};

    // #endregion Properties (18)

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
     * Getter settingsConfig
     * @return {any}
     */
    public get settingsConfig(): any {
        return this._settingsConfig;
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
     * @return {ShapeDiverResponse}
     */
    public get sessionResponse(): ShapeDiverResponse {
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

    // #region Public Methods (23)

    public createOutput(id: string): Output {
        if (this._outputs[id] || this._outputsCreated[id]) {
            this._logger.error('Output with this id already exists.');
            return this._outputs[id];
        }

        this._outputsCreated[id] = new Output(this, id, { version: '1.0', id, name: '', dependency: [] });
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
        return this.customizeSession(this.getParametersAsString());
    }

    public async close(): Promise<boolean> {
        this._closed = true;
        if (this._initialized) {
            try {
                await this.sessionCommunication(this._sessionResponse.actions?.filter(v => v.name === 'close')[0].href!, this._sessionResponse.actions?.filter(v => v.name === 'close')[0].method!, null, 'application/json');
            } catch (e) {
                this._logger.error('Session closing failed.', e, e.response && e.response.status ? e.response.status : null);
                return false;
            }
        }
        return true;
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
            return this.loadOutputs(this.getParametersAsString());
        }

        try {
            let sessionResponse;
            try {
                sessionResponse = <ShapeDiverResponse>(await this.sessionCommunication(this._modelViewUrl + "/ticket/" + this._ticket, 'post', null)).data;
            } catch (e) {
                this._logger.error('Session init failed.', e, e.response && e.response.status ? e.response.status : null);
                return new SessionTreeNode();
            }

            this._settingsConfig = sessionResponse.config;
            this._sessionResponse = this.mergeResponses(this._sessionResponse, sessionResponse, this._parameters, this._outputs, this._exports);
            this._authorTicket = !!(this._sessionResponse.actions?.filter(v => v.name === 'defaultparam')[0] && this._sessionResponse.actions?.filter(v => v.name === 'configure')[0]);

            this._initialized = true;
            return this.loadOutputs(this.getParametersAsString());
        } catch (e) {
            this._logger.error('Something went wrong at session init.', e);
            return new SessionTreeNode();
        }
    }

    public mergeResponses(r1: ShapeDiverResponse, r2: ShapeDiverResponse, parameters?: { [key: string]: AbstractParameter<any>; }, outputs?: { [key: string]: Output; }, exports?: { [key: string]: Export; }): ShapeDiverResponse {
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
                switch (r1.parameters[parameterId].type) {
                    case PARAMETERTYPE.BOOL:
                        parameters[parameterId] = new BooleanParameter(this, parameterId, r1.parameters[parameterId]);
                        break;
                    case PARAMETERTYPE.COLOR:
                        parameters[parameterId] = new ColorParameter(this, parameterId, r1.parameters[parameterId]);
                        break;
                    case PARAMETERTYPE.EVEN:
                        parameters[parameterId] = new EvenParameter(this, parameterId, r1.parameters[parameterId]);
                        break;
                    case PARAMETERTYPE.FILE:
                        parameters[parameterId] = new FileParameter(this, parameterId, r1.parameters[parameterId]);
                        break;
                    case PARAMETERTYPE.FLOAT:
                        parameters[parameterId] = new FloatParameter(this, parameterId, r1.parameters[parameterId]);
                        break;
                    case PARAMETERTYPE.INT:
                        parameters[parameterId] = new IntParameter(this, parameterId, r1.parameters[parameterId]);
                        break;
                    case PARAMETERTYPE.ODD:
                        parameters[parameterId] = new OddParameter(this, parameterId, r1.parameters[parameterId]);
                        break;
                    case PARAMETERTYPE.STRINGLIST:
                        parameters[parameterId] = new StringListParameter(this, parameterId, r1.parameters[parameterId]);
                        break;
                    case PARAMETERTYPE.TIME:
                        parameters[parameterId] = new TimeParameter(this, parameterId, r1.parameters[parameterId]);
                        break;
                    case PARAMETERTYPE.SBITMAP:
                        parameters[parameterId] = new SBitmapParameter(this, parameterId, r1.parameters[parameterId]);
                        break;
                    case PARAMETERTYPE.SCURVE:
                        parameters[parameterId] = new SCurveParameter(this, parameterId, r1.parameters[parameterId]);
                        break;
                    case PARAMETERTYPE.SINTEGER:
                        parameters[parameterId] = new SIntegerParameter(this, parameterId, r1.parameters[parameterId]);
                        break;
                    case PARAMETERTYPE.SNUMBER:
                        parameters[parameterId] = new SNumberParameter(this, parameterId, r1.parameters[parameterId]);
                        break;
                    case PARAMETERTYPE.SSTRING:
                        parameters[parameterId] = new SStringParameter(this, parameterId, r1.parameters[parameterId]);
                        break;
                    case PARAMETERTYPE.SBOOL || PARAMETERTYPE.SBOX || PARAMETERTYPE.SBREP || PARAMETERTYPE.SCIRCLE || PARAMETERTYPE.SCOLOR || PARAMETERTYPE.SDOMAIN || PARAMETERTYPE.SDOMAIN2D || PARAMETERTYPE.SLINE || PARAMETERTYPE.SMESH || PARAMETERTYPE.SPLANE || PARAMETERTYPE.SPOINT || PARAMETERTYPE.SRECTANGLE || PARAMETERTYPE.SSUBDIV || PARAMETERTYPE.SSURFACE || PARAMETERTYPE.STIME || PARAMETERTYPE.SVECTOR:
                        parameters[parameterId] = new SParameter(this, parameterId, r1.parameters[parameterId]);
                        break;
                    default:
                        parameters[parameterId] = new StringParameter(this, parameterId, r1.parameters[parameterId]);
                }
            }
        }

        if (exports) {
            for (let exportId in r1.exports)
                if((<any>Object).values(EXPORTTYPE).includes(<string>r1.exports[exportId].type))
                    exports[exportId] = new Export(this, exportId, r1.exports[exportId]);
        }

        if (outputs) {
            for (let outputId in r1.outputs)
                outputs[outputId] = new Output(this, outputId, r1.outputs[outputId]);
        }

        return r1;
    }

    public async saveDefaultParameters(): Promise<boolean> {
        if (!this._sessionResponse.actions?.filter(v => v.name === 'defaultparam')[0]) {
            this._logger.error('Session has to be in edit mode to be able to save the settings.');
            return false;
        }
        try {
            await this.sessionCommunication(this._sessionResponse.actions?.filter(v => v.name === 'defaultparam')[0].href!, this._sessionResponse.actions?.filter(v => v.name === 'defaultparam')[0].method!, this.getParametersAsString(), 'application/json');
            return true;
        } catch (e) {
            this._logger.error('Saving of default parameters failed.', e, e.response && e.response.status ? e.response.status : null);
            return false;
        }
    }

    public async saveSettings(json: any): Promise<boolean> {
        if (!this._sessionResponse.actions?.filter(v => v.name === 'configure')[0]) {
            this._logger.error('Session has to be in edit mode to be able to save the settings.');
            return false;
        }
        try {
            await this.sessionCommunication(this._sessionResponse.actions?.filter(v => v.name === 'configure')[0].href!, this._sessionResponse.actions?.filter(v => v.name === 'configure')[0].method!, json, 'application/json');
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

    // #endregion Public Methods (23)

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
                responseCustomize = <ShapeDiverResponse>(await this.sessionCommunication(this._sessionResponse.actions?.filter(v => v.name === 'customize')[0].href!, 'post', parameters, 'application/json')).data;
            } catch (e) {
                if (e.response && e.response.status) {
                    if (e.response && e.response.status && e.response.status === 410 && !this._closed) {
                        this._logger.info('Session customization failed. Session expired. Re-initializing session.');
                        this._initialized = false;
                        await this.init();
                        return this.customizeSession(parameters);
                    }
                }

                this._logger.error('Session customization failed.', e, e.response && e.response.status ? e.response.status : null);
                return new SessionTreeNode();
            }
            this._sessionResponse = this.mergeResponses(this._sessionResponse, responseCustomize, this._parameters, this._outputs, this._exports);
            return this.loadOutputs(parameters);
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
    private async loadOutputs(parameters: { [key: string]: string }): Promise<SessionTreeNode> {
        const o = Object.assign({}, this._outputs, this._outputsCreated);
        try {
            const node = await this._outputLoader.loadOutputs(this._sessionResponse, o);
            node.data.push(new SessionData(this._sessionResponse));
            return node;
        }
        catch (e) {
            if (e instanceof OutputDelayException)
                await this.timeout(e.delay);

            let outputMapping: { [key: string]: string } = {};
            for (let output in o)
                outputMapping[output] = o[output].version;

            let responseCache = (await this.sessionCommunication(this._sessionResponse.actions?.filter(v => v.name === 'cache')[0].href!, this._sessionResponse.actions?.filter(v => v.name === 'cache')[0].method!.toLowerCase()!, outputMapping, 'application/json')).data;
            this._sessionResponse = this.mergeResponses(this._sessionResponse, responseCache, this._parameters, this._outputs, this._exports);
            return await this.loadOutputs(parameters);
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