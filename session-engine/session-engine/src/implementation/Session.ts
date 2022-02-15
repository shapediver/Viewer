import { container } from 'tsyringe'
import { HttpClient, PerformanceEvaluator, UuidGenerator, SystemInfo, Logger, LOGGINGTOPIC, ShapeDiverViewerSessionError, ShapeDiverViewerError } from '@shapediver/viewer.shared.services'

import { OutputDelayException } from './OutputDelayException'
import { OutputLoader } from './OutputLoader'
import { SessionTreeNode } from './SessionTreeNode'
import { ISession } from '../interfaces/ISession'
import { SessionData } from './SessionData'
import { create, ShapeDiverError as ShapeDiverBackendError, ShapeDiverResponseErrorType, ShapeDiverRequestGltfUploadQueryConversion, ShapeDiverResponseDto, ShapeDiverResponseError, ShapeDiverResponseExport, ShapeDiverResponseExportDefinitionType, ShapeDiverResponseOutput, ShapeDiverResponseParameter, ShapeDiverSdk, ShapeDiverSdkConfigType } from '@shapediver/sdk.geometry-api-sdk-v2'
import { AxiosRequestConfig } from 'axios'

export class Session implements ISession {
    // #region Properties (22)

    private readonly _exports: { [key: string]: ShapeDiverResponseExport; } = {};
    private readonly _httpClient: HttpClient = <HttpClient>container.resolve(HttpClient);
    private readonly _id: string;
    private readonly _logger: Logger = <Logger>container.resolve(Logger);
    private readonly _modelViewUrl: string;
    private readonly _outputLoader: OutputLoader;
    private readonly _outputs: { [key: string]: ShapeDiverResponseOutput; } = {};
    private readonly _outputsFreeze: { [key: string]: boolean; } = {};
    private readonly _parameterValues: { [key: string]: string; } = {};
    private readonly _parameters: { [key: string]: ShapeDiverResponseParameter; } = {};
    private readonly _performanceEvaluator = <PerformanceEvaluator>container.resolve(PerformanceEvaluator);
    private readonly _sessionEngineId = (<UuidGenerator>container.resolve(UuidGenerator)).create();
    private readonly _ticket: string;

    private _bearerToken?: string;
    private _closed: boolean = false;
    private _closeOnFailure: () => Promise<void>
    private _headers = {
        "X-ShapeDiver-Origin": (<SystemInfo>container.resolve(SystemInfo)).origin,
        "X-ShapeDiver-SessionEngineId": this._sessionEngineId,
        "X-ShapeDiver-BuildVersion": '',
        "X-ShapeDiver-BuildDate": ''
    };
    private _initialized: boolean = false;
    private _modelId?: string;
    private _refreshBearerToken?: () => Promise<string>;
    private _responseDto?: ShapeDiverResponseDto;
    private _retryCounter = 0;
    private _sdk: ShapeDiverSdk;
    private _sessionId?: string;
    private _viewerSettings?: object;
    private _dataCache: {
        [key: string]: Promise<Blob | HTMLImageElement>
    } = {};

    // #endregion Properties (22)

    // #region Constructors (1)

    /**
     * Can be use to initialize a session with the ticket and modelViewUrl and returns a scene graph node with the result.
     * Can be use to customize the session with updated parameters to get the updated scene graph node.
     */
    constructor(properties: { id: string, ticket: string, modelViewUrl: string, buildVersion: string, buildDate: string, closeOnFailure: () => Promise<void>, bearerToken?: string, primarySession?: boolean }) {
        this._id = properties.id;
        this._ticket = properties.ticket;
        this._modelViewUrl = properties.modelViewUrl;
        this._closeOnFailure = properties.closeOnFailure;
        this._bearerToken = properties.bearerToken;
        this._headers['X-ShapeDiver-BuildDate'] = properties.buildDate;
        this._headers['X-ShapeDiver-BuildVersion'] = properties.buildVersion;
        this._outputLoader = new OutputLoader();
    
        this._sdk = create(this._modelViewUrl, this._bearerToken);
        this._sdk.setConfigurationValue(ShapeDiverSdkConfigType.REQUEST_HEADERS, this._headers);
    }

    // #endregion Constructors (1)

    // #region Public Accessors (13)

    public get bearerToken(): string | undefined {
        return this._bearerToken;
    }

    public set bearerToken(value: string | undefined) {
        this._bearerToken = value;
        this._sdk.setConfigurationValue(ShapeDiverSdkConfigType.JWT_TOKEN, value);
    }

    public get canUploadGLTF(): boolean {
        try {
            this.checkAvailability('gltf-upload');
            return true;   
        } catch (e) {
            return false;
        }
    }

    public get exports(): { [key: string]: ShapeDiverResponseExport; } {
        return this._exports;
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

    public get outputs(): { [key: string]: ShapeDiverResponseOutput; } {
        return this._outputs;
    }

    public get outputsFreeze(): { [key: string]: boolean; } {
        return this._outputsFreeze;
    }

    public get parameterValues(): { [key: string]: string; } {
        return this._parameterValues;
    }

    public get parameters(): { [key: string]: ShapeDiverResponseParameter; } {
        return this._parameters;
    }

    public set refreshBearerToken(value: () => Promise<string>) {
        this._refreshBearerToken = value;
    }

    public get ticket(): string {
        return this._ticket;
    }

    public get viewerSettings(): object | undefined {
        return this._viewerSettings;
    }

    private async handleError(topic: LOGGINGTOPIC, scope: string, e: ShapeDiverBackendError | ShapeDiverViewerError | Error, retry = false) {
        if(e instanceof ShapeDiverResponseError) {
            if(e.error === ShapeDiverResponseErrorType.SESSION_GONE_ERROR) {
                // case 1: the session is no longer available
                // we try to re-initialize the session 3 times, if that does not work, we close it

                this._logger.warn(topic, `The session has been closed, trying to re-initialize.`);

                if(this._retryCounter < 3) {
                    // we retry this 3 times, the `retry` option in the init function is set to true and passed on 
                    this._retryCounter = retry ? this._retryCounter + 1 : 1;
                    try {
                        this._initialized = false;
                        await this.init(this.parameterValues, true);
                    } catch(e) {
                        if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
                        throw this._logger.handleError(topic, scope, e);
                    }
                } else {
                    // the retries were exceeded, we close the session
                    this._logger.warn(LOGGINGTOPIC.SESSION, 'Tried to retry the connect multiple times, bearer token still not valid. Closing Session.');
                    try { await this._closeOnFailure(); } catch(e) {}
                    throw this._logger.handleError(topic, scope, e);
                }
            } else if(
                e.error === ShapeDiverResponseErrorType.ERROR_FORBIDDEN || 
                e.error === ShapeDiverResponseErrorType.ERROR_UNAUTHORIZED ||
                e.error === ShapeDiverResponseErrorType.TOKEN_MISSING_ERROR ||
                e.error === ShapeDiverResponseErrorType.JWT_VALIDATION_ERROR ||
                e.error === ShapeDiverResponseErrorType.MODEL_VALIDATION_ERROR ||
                e.error === ShapeDiverResponseErrorType.TICKET_VALIDATION_ERROR ||
                e.error === ShapeDiverResponseErrorType.REQUEST_VALIDATION_ERROR ||
                e.error === ShapeDiverResponseErrorType.SESSION_VALIDATION_ERROR ||
                e.error === ShapeDiverResponseErrorType.PARAMETER_VALIDATION_ERROR 
            ) {
                // if any of the above errors occur, we try to get a new bearer token
                // if we get a new one, we retry 3 times (by requiring new bearer tokens every time)
                if(this._retryCounter < 3) {
                    if(this._refreshBearerToken) {
                        this.bearerToken = await this._refreshBearerToken();
                        this._retryCounter = retry ? this._retryCounter + 1 : 1;
                        this._logger.warn(LOGGINGTOPIC.SESSION, 'Re-trying with new bearer token.');
                    } else {
                        // no bearer tokens are supplied, we close the session
                        this._logger.warn(LOGGINGTOPIC.SESSION, 'No retry possible, no new bearer token was supplied. Closing Session.');
                        try { await this._closeOnFailure(); } catch(e) {}
                        throw this._logger.handleError(topic, scope, e);
                    }
                } else {
                    // the retries were exceeded, we close the session
                    this._logger.warn(LOGGINGTOPIC.SESSION, 'Tried to retry the connect multiple times, bearer token still not valid. Closing Session.');
                    try { await this._closeOnFailure(); } catch(e) {}
                    throw this._logger.handleError(topic, scope, e);
                }
            } else {
                throw this._logger.handleError(topic, scope, e);
            }
        } else {
            throw this._logger.handleError(topic, scope, e);
        }
    }

    // #endregion Public Accessors (13)

    // #region Public Methods (13)

    public async close(retry = false): Promise<boolean> {
        this.checkAvailability('close');

        try {
            await this._sdk.session.close(this._sessionId!)
            this._closed = true;
            return true;
        } catch (e) {
            await this.handleError(LOGGINGTOPIC.SESSION, 'Session.close', e, retry);
            return await this.close(true); 
        }
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
    public async init(parameterValues?: {
        [key: string]: string;
    }, retry = false): Promise<void> {
        if (this._initialized === true) {
            const error = new ShapeDiverViewerSessionError('Session.init: Session already initialized.');
            throw this._logger.handleError(LOGGINGTOPIC.SESSION, 'Session.init', error);
        }

        try {
            this._performanceEvaluator.startSection('sessionResponse');
            this._responseDto = await this._sdk.session.init(this._ticket, parameterValues);
            this._performanceEvaluator.endSection('sessionResponse');

            this._viewerSettings = this._responseDto.viewer?.config;
            this._sessionId = this._responseDto.sessionId;
            this._modelId = this._responseDto.model?.id;

            if(!this._sessionId) 
                throw new ShapeDiverViewerSessionError(`Session.init: Initialization of session failed. ResponseDto did not have a sessionId.`)
            if(!this._modelId) 
                throw new ShapeDiverViewerSessionError(`Session.init: Initialization of session failed. ResponseDto did not have a model.id.`)

            this.updateResponseDto(this._responseDto);
            this._initialized = true;
        } catch (e) {
            await this.handleError(LOGGINGTOPIC.SESSION, 'Session.init', e, retry);
            return await this.init(parameterValues, true);
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
    public async loadOutputs(cancelRequest: () => boolean = () => false, retry = false): Promise<SessionTreeNode> {
        this.checkAvailability();

        const o = Object.assign({}, this._outputs);
        const of = Object.assign({}, this._outputsFreeze);
        try {
            const node = await this._outputLoader.loadOutputs(this._responseDto!, o, of, this.loadData.bind(this));
            node.data.push(new SessionData(this._responseDto!));
            return node;
        }
        catch (e) {
            if (e instanceof OutputDelayException) {
                await this.timeout(e.delay);
            } else {
                await this.handleError(LOGGINGTOPIC.SESSION, 'Session.loadOutputs', e, retry);
                return await this.loadOutputs(cancelRequest, true);
            }

            if(cancelRequest()) return new SessionTreeNode();
            let outputMapping: { [key: string]: string } = {};
            for (let output in o)
                outputMapping[output] = o[output].version;
            
            try {
                const responseDto = await this._sdk.output.getCache(this._sessionId!, outputMapping);
                if(cancelRequest()) return new SessionTreeNode();
                this.updateResponseDto(responseDto);
                return await this.loadOutputs(cancelRequest);
            } catch(e) {
                await this.handleError(LOGGINGTOPIC.SESSION, 'Session.loadOutputs', e, retry);
                return await this.loadOutputs(cancelRequest, true);
            }
        }
    }

    public async requestExport(exportId: string, parameters: { [key: string]: string }, retry = false): Promise<ShapeDiverResponseExport> {
        this.checkAvailability('export');
        try {
            const responseDto = await this._sdk.utils.submitAndWaitForExport(this._sdk, this._sessionId!, { exports: { id: exportId }, parameters })
            this.updateResponseDto(responseDto);
            return this.exports[exportId];
        } catch (e) {
            await this.handleError(LOGGINGTOPIC.SESSION, 'Session.requestExport', e, retry);
            return await this.requestExport(exportId, parameters, true);
        }
    }

    public async saveDefaultParameters(retry = false): Promise<boolean> {
        this.checkAvailability('defaultparam', true);
        try {
            await this._sdk.model.setDefaultParams(this._modelId!, this._parameterValues)
            return true;
        } catch (e) {
            await this.handleError(LOGGINGTOPIC.SESSION, 'Session.saveDefaultParameters', e, retry);
            return await this.saveDefaultParameters(true);
        }
    }

    /**
     * Save the export properties for displayname, order, tooltip and hidden
     * 
     * @param exports 
     * @returns 
     */
    public async saveExportProperties(exports: {
        [key: string]: {
            displayname: string,
            hidden: boolean,
            order: number,
            tooltip: string
        }
    }, retry = false): Promise<boolean> {
        this.checkAvailability('export-definition', true);
        try {
            await this._sdk.export.updateDefinitions(this._modelId!, exports);
            return true;
        } catch (e) {
            await this.handleError(LOGGINGTOPIC.SESSION, 'Session.saveExportProperties', e, retry);
            return await this.saveExportProperties(exports, true);
        }
    }

    /**
     * Save the output properties for displayname, order, tooltip and hidden
     * 
     * @param outputs 
     * @returns 
     */
    public async saveOutputProperties(outputs: {
        [key: string]: {
            displayname: string,
            hidden: boolean,
            order: number,
            tooltip: string
        }
    }, retry = false): Promise<boolean> {
        this.checkAvailability('output-definition', true);
        try {
            await this._sdk.output.updateDefinitions(this._modelId!, outputs);
            return true;
        } catch (e) {
            await this.handleError(LOGGINGTOPIC.SESSION, 'Session.saveOutputProperties', e, retry);
            return await this.saveOutputProperties(outputs, true);
        }
    }

    /**
     * Save the parameter properties for displayname, order, tooltip and hidden
     * 
     * @param parameters 
     * @returns 
     */
    public async saveParameterProperties(parameters: {
        [key: string]: {
            displayname: string,
            hidden: boolean,
            order: number,
            tooltip: string
        }
    }, retry = false): Promise<boolean> {
        this.checkAvailability('parameter-definition', true);
        try {
            await this._sdk.model.updateParameterDefinitions(this._modelId!, parameters);
            return true;
        } catch (e) {
            await this.handleError(LOGGINGTOPIC.SESSION, 'Session.saveParameterProperties', e, retry);
            return await this.saveParameterProperties(parameters, true);
        }
    }

    public async saveSettings(json: any, retry = false): Promise<boolean> {
        this.checkAvailability('configure', true);
        try {
            await this._sdk.model.updateConfig(this._modelId!, json);
            return true;
        } catch (e) {
            await this.handleError(LOGGINGTOPIC.SESSION, 'Session.saveSettings', e, retry);
            return await this.saveSettings(json, true);
        }
    }

    public async uploadFile(parameterId: string, data: File, type: string, retry = false): Promise<string> {
        this.checkAvailability('file-upload');
        try {
            const responseDto = await this._sdk.file.requestUpload(this._sessionId!, {
                [parameterId]: { size: data.size, format: type }
            })

            if(responseDto && responseDto.asset && responseDto.asset.file && responseDto.asset.file[parameterId]) {
                const fileAsset = responseDto.asset.file[parameterId];
                await this._sdk.utils.upload(fileAsset.href, await data.arrayBuffer(), type);
                return fileAsset.id;
            } else {
                const error = new ShapeDiverViewerSessionError(`Session.uploadFile: Upload reply has not the required format.`);
                throw this._logger.handleError(LOGGINGTOPIC.SESSION, 'Session.uploadFile', error);
            }
        } catch (e) {
            await this.handleError(LOGGINGTOPIC.SESSION, 'Session.uploadFile', e, retry);
            return await this.uploadFile(parameterId, data, type, retry);
        }
    }

    public async uploadGLTF(blob: Blob, conversion: ShapeDiverRequestGltfUploadQueryConversion = ShapeDiverRequestGltfUploadQueryConversion.NONE, retry = false): Promise<string> {
        this.checkAvailability('gltf-upload');
        try {
            const responseDto = await this._sdk.gltf.upload(this._sessionId!, await blob.arrayBuffer(), 'model/gltf-binary', conversion);
            if(!responseDto || !responseDto.gltf || !responseDto.gltf.href) {
                const error = new ShapeDiverViewerSessionError(`Session.uploadGLTF: Upload reply has not the required format.`);
                throw this._logger.handleError(LOGGINGTOPIC.SESSION, 'Session.uploadGLTF', error);
            }
            return responseDto.gltf.href;
        } catch (e) {
            await this.handleError(LOGGINGTOPIC.SESSION, 'Session.uploadGLTF', e, retry);
            return await this.uploadGLTF(blob, conversion, retry);
        }
    }

    // #endregion Public Methods (13)

    // #region Private Methods (5)

    private checkAvailability(action?: string, checkForModelId = false) {
        if(!this._responseDto) {
            const error = new ShapeDiverViewerSessionError(`Session.checkAvailability: responseDto not available.`);
            throw this._logger.handleError(LOGGINGTOPIC.SESSION, 'Session.checkAvailability', error);
        }

        if(!this._sessionId) {
            const error = new ShapeDiverViewerSessionError(`Session.checkAvailability: sessionId not available.`);
            throw this._logger.handleError(LOGGINGTOPIC.SESSION, 'Session.checkAvailability', error);
        }

        if(checkForModelId && !this._modelId) {
            const error = new ShapeDiverViewerSessionError(`Session.checkAvailability: modelId not available.`);
            throw this._logger.handleError(LOGGINGTOPIC.SESSION, 'Session.checkAvailability', error);
        }
        
        if(action && !this._responseDto.actions) {
            const error = new ShapeDiverViewerSessionError(`Session.checkAvailability: actions not available.`);
            throw this._logger.handleError(LOGGINGTOPIC.SESSION, 'Session.checkAvailability', error);
        }

        const responseDtoAction = this._responseDto.actions?.find(a => a.name === action);
        if(action && !responseDtoAction) {
            const error = new ShapeDiverViewerSessionError(`Session.checkAvailability: action ${action} not available.`);
            throw this._logger.handleError(LOGGINGTOPIC.SESSION, 'Session.checkAvailability', error);
        }
    }

    private async customizeSession(parameters: { [key: string]: string }, cancelRequest: () => boolean, retry = false): Promise<SessionTreeNode> {
        this.checkAvailability('customize');
        try {
            this._performanceEvaluator.startSection('sessionResponse');
            const responseDto = await this._sdk.utils.submitAndWaitForCustomization(this._sdk, this._sessionId!, parameters);
            this._performanceEvaluator.endSection('sessionResponse');
            if(cancelRequest()) return new SessionTreeNode();
            this.updateResponseDto(responseDto);
            return this.loadOutputs(cancelRequest);
        } catch (e) {
            await this.handleError(LOGGINGTOPIC.SESSION, 'Session.customizeSession', e, retry);
            return await this.customizeSession(parameters, cancelRequest, true);
        }
    }

    public async loadData(href: string, config: AxiosRequestConfig = { responseType: 'blob' }, retry = false): Promise<Blob | HTMLImageElement> {
        this.checkAvailability();
        try {
            const dataKey = btoa(href);
            if(this._dataCache[dataKey]) return await this._dataCache[dataKey];

            this._dataCache[dataKey] = new Promise<Blob | HTMLImageElement>(async resolve => {
                const response = await this._httpClient.get(
                    `${this.modelViewUrl}/api/v2/session/${this._sessionId}/image?url=${dataKey}`,
                    config
                );
                const bitmapContentTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/svg+xml'];
                
                if(response.headers && response.headers['content-type'] && bitmapContentTypes.includes(response.headers['content-type'])) {
                    const img = new Image();
                    const promise = new Promise<void>(resolve => {
                      img.onload = () => resolve();
                    })
                    img.crossOrigin = "anonymous";
                    img.src = href;
                    await promise;
                    resolve(img);
                } else {
                    resolve(response.data);
                }
            });

            return await this._dataCache[dataKey];
        } catch (e) {
            await this.handleError(LOGGINGTOPIC.SESSION, 'Session.loadData', e, retry);
            return await this.loadData(href, config, true);
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

    private updateResponseDto(responseDto: ShapeDiverResponseDto) {
        if(!this._responseDto) {
            this._responseDto = responseDto;
            return;
        }

        // convert parameters
        if (responseDto.parameters) {
            for (let parameterId in responseDto.parameters) {
                this._responseDto.parameters = this._responseDto.parameters || {};
                this._responseDto.parameters[parameterId] = this._responseDto.parameters[parameterId] || responseDto.parameters[parameterId];
            }
        }

        // convert outputs
        if (responseDto.outputs) {
            for (let outputId in responseDto.outputs) {
                this._responseDto.outputs = this._responseDto.outputs || {};
                if ('version' in responseDto.outputs[outputId] || !(this._responseDto.outputs[outputId] && 'version' in this._responseDto.outputs[outputId]))
                    this._responseDto.outputs[outputId] = responseDto.outputs[outputId];
            }
        }

        // convert exports
        if (responseDto.exports) {
            for (let exportId in responseDto.exports) {
                this._responseDto.exports = this._responseDto.exports || {};
                if ('version' in responseDto.exports[exportId] || !(this._responseDto.exports[exportId] && 'version' in this._responseDto.exports[exportId]))
                    this._responseDto.exports[exportId] = responseDto.exports[exportId];
            }
        }

        for (let parameterId in this._responseDto.parameters) {
            if (this.parameters[parameterId]) continue;
            this.parameters[parameterId] = this._responseDto.parameters[parameterId];
            this.parameters[parameterId].id = parameterId;
        }

        for (let exportId in this._responseDto.exports)
            if (this._responseDto.exports[exportId].type === ShapeDiverResponseExportDefinitionType.EMAIL || this._responseDto.exports[exportId].type === ShapeDiverResponseExportDefinitionType.DOWNLOAD) {
                this.exports[exportId] = this._responseDto.exports[exportId];
                this.exports[exportId].id = exportId;
            }

        for (let outputId in this._responseDto.outputs) {
            this.outputs[outputId] = <ShapeDiverResponseOutput>this._responseDto.outputs[outputId];
            this.outputs[outputId].id = outputId;
            if(this.outputsFreeze[outputId] === undefined) this.outputsFreeze[outputId] = false;
        }
    }

    // #endregion Private Methods (5)
}