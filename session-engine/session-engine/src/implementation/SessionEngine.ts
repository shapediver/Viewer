import { container } from 'tsyringe'
import { HttpClient, HttpResponse, PerformanceEvaluator, UuidGenerator, SystemInfo, Logger, LOGGING_TOPIC, ShapeDiverViewerSessionError, ShapeDiverViewerError, Converter, SettingsEngine, EVENTTYPE, EventEngine, StateEngine, ShapeDiverViewerSettingsError } from '@shapediver/viewer.shared.services'

import { OutputDelayException } from './OutputDelayException'
import { OutputLoader } from './OutputLoader'
import { SessionTreeNode } from './SessionTreeNode'
import { ISessionEngine, ISettingsSections, PARAMETER_TYPE } from '../interfaces/ISessionEngine'
import { SessionData } from './SessionData'
import { create, ShapeDiverError as ShapeDiverBackendError, ShapeDiverResponseErrorType, ShapeDiverRequestGltfUploadQueryConversion, ShapeDiverResponseDto, ShapeDiverResponseError, ShapeDiverResponseExport, ShapeDiverResponseExportDefinitionType, ShapeDiverResponseOutput, ShapeDiverResponseParameter, ShapeDiverSdk, ShapeDiverSdkConfigType, ShapeDiverResponseModelComputationStatus } from '@shapediver/sdk.geometry-api-sdk-v2'
import { AxiosRequestConfig } from 'axios'
import { ISessionTreeNode } from '../interfaces/ISessionTreeNode'
import { ITree, ITreeNode, Tree, TreeNode } from '@shapediver/viewer.shared.node-tree'
import { ITaskEvent, TASK_TYPE } from '@shapediver/viewer.shared.types'
import { FileParameter } from './dto/FileParameter'
import { IFileParameter } from '../interfaces/dto/IFileParameter'
import { IExport } from '../interfaces/dto/IExport'
import { IParameter } from '../interfaces/dto/IParameter'
import { IOutput } from '../interfaces/dto/IOutput'
import { Parameter } from './dto/Parameter'
import { vec3 } from 'gl-matrix'
import { Export } from './dto/Export'
import { Output } from './dto/Output'
import { convert, ISettingsV3_1, validate } from '@shapediver/viewer.settings'

export class SessionEngine implements ISessionEngine {
    // #region Properties (40)

    private readonly _converter: Converter = <Converter>container.resolve(Converter);
    private readonly _eventEngine = <EventEngine>container.resolve(EventEngine);
    private readonly _exports: { [key: string]: IExport; } = {};
    private readonly _httpClient: HttpClient = <HttpClient>container.resolve(HttpClient);
    private readonly _id: string;
    private readonly _logger: Logger = <Logger>container.resolve(Logger);
    private readonly _modelViewUrl: string;
    private readonly _outputLoader: OutputLoader;
    private readonly _outputs: { [key: string]: IOutput; } = {};
    private readonly _outputsFreeze: { [key: string]: boolean; } = {};
    private readonly _parameterValues: { [key: string]: string; } = {};
    private readonly _parameters: { [key: string]: IParameter<any>; } = {};
    private readonly _performanceEvaluator = <PerformanceEvaluator>container.resolve(PerformanceEvaluator);
    private readonly _sceneTree: ITree = <ITree>container.resolve(Tree);
    private readonly _sessionEngineId = (<UuidGenerator>container.resolve(UuidGenerator)).create();
    private readonly _settingsEngine: SettingsEngine = new SettingsEngine();
    private readonly _stateEngine: StateEngine = <StateEngine>container.resolve(StateEngine);
    private readonly _ticket: string;
    private readonly _uuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);

    private _automaticSceneUpdate: boolean = true;
    private _bearerToken?: string;
    private _closeOnFailure: () => Promise<void> = async () => { };

    private _closed: boolean = false;
    private _customizeOnParameterChange: boolean = false;
    private _dataCache: {
        [key: string]: Promise<HttpResponse<any>>
    } = {};
    private _excludeViewports: string[] = [];
    private _headers = {
        "X-ShapeDiver-Origin": (<SystemInfo>container.resolve(SystemInfo)).origin,
        "X-ShapeDiver-SessionEngineId": this._sessionEngineId,
        "X-ShapeDiver-BuildVersion": '',
        "X-ShapeDiver-BuildDate": ''
    };
    private _initialized: boolean = false;
    private _modelId?: string;
    private _node: ITreeNode;
    private _refreshBearerToken?: () => Promise<string>;
    private _responseDto?: ShapeDiverResponseDto;
    private _retryCounter = 0;
    private _sdk: ShapeDiverSdk;
    private _sessionId?: string;
    private _updateCallback: ((newNode: ITreeNode, oldNode: ITreeNode) => void) | null = null;
    private _viewerSettings?: object;

    #customizationProcess!: string;
    #parameterHistory: {
        [key: string]: {
            value: any,
            valueString: string
        }
    }[] = [];
    #parameterHistoryCall = false;
    #parameterHistoryForward: {
        [key: string]: {
            value: any,
            valueString: string
        }
    }[] = [];

    // #endregion Properties (40)

    // #region Constructors (1)

    /**
     * Can be use to initialize a session with the ticket and modelViewUrl and returns a scene graph node with the result.
     * Can be use to customize the session with updated parameters to get the updated scene graph node.
     */
    constructor(properties: { id: string, ticket: string, modelViewUrl: string, buildVersion: string, buildDate: string, bearerToken?: string, excludeViewports?: string[] }) {
        this._id = properties.id;
        this._node = new TreeNode(properties.id);
        this._ticket = properties.ticket;
        this._modelViewUrl = properties.modelViewUrl;
        this._excludeViewports = properties.excludeViewports || [];
        this._bearerToken = properties.bearerToken;
        this._headers['X-ShapeDiver-BuildDate'] = properties.buildDate;
        this._headers['X-ShapeDiver-BuildVersion'] = properties.buildVersion;
        this._outputLoader = new OutputLoader(this);

        this._sdk = create(this._modelViewUrl, this._bearerToken);
        this._sdk.setConfigurationValue(ShapeDiverSdkConfigType.REQUEST_HEADERS, this._headers);
    }

    // #endregion Constructors (1)

    // #region Public Accessors (23)

    public get automaticSceneUpdate(): boolean {
        return this._automaticSceneUpdate;
    }

    public set automaticSceneUpdate(value: boolean) {
        this._automaticSceneUpdate = value;
        value ? this._sceneTree.addNode(this._node) : this._sceneTree.removeNode(this._node);
    }

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

    public get customizeOnParameterChange(): boolean {
        return this._customizeOnParameterChange;
    }

    public set customizeOnParameterChange(value: boolean) {
        this._customizeOnParameterChange = value;
    }

    public get excludeViewports(): string[] {
        return this._excludeViewports;
    }

    public set excludeViewports(value: string[]) {
        this._excludeViewports = JSON.parse(JSON.stringify(value));
        this._node.excludeViewports = JSON.parse(JSON.stringify(value));
    }

    public get exports(): { [key: string]: IExport; } {
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

    public get node(): ITreeNode {
        return this._node;
    }

    public get outputs(): { [key: string]: IOutput; } {
        return this._outputs;
    }

    public get outputsFreeze(): { [key: string]: boolean; } {
        return this._outputsFreeze;
    }

    public get parameterValues(): { [key: string]: string; } {
        return this._parameterValues;
    }

    public get parameters(): { [key: string]: IParameter<any>; } {
        return this._parameters;
    }

    public get refreshBearerToken(): (() => Promise<string>) | undefined {
        return this._refreshBearerToken;
    }

    public set refreshBearerToken(value: (() => Promise<string>) | undefined) {
        this._refreshBearerToken = value;
    }

    public get settingsEngine(): SettingsEngine {
        return this._settingsEngine;
    }

    public get ticket(): string {
        return this._ticket;
    }

    public get updateCallback(): ((newNode: ITreeNode, oldNode: ITreeNode) => void) | null {
      return this._updateCallback;
    }
  
    public set updateCallback(value: ((newNode: ITreeNode, oldNode: ITreeNode) => void) | null) {
      this._updateCallback = value;
    }  

    public get viewerSettings(): object | undefined {
        return this._viewerSettings;
    }

    // #endregion Public Accessors (23)

    // #region Public Methods (22)

    public applySettings(response: ShapeDiverResponseDto, sections?: ISettingsSections) {
        try {
            sections = sections || {};
            if (sections.session === undefined) {
                sections.session = {
                    parameter: { displayname: false, order: false, hidden: false },
                    export: { displayname: false, order: false, hidden: false }
                };
            }
            if (sections.session.parameter === undefined)
                sections.session.parameter = { displayname: false, order: false, hidden: false, value: false };
            if (sections.session.export === undefined)
                sections.session.export = { displayname: false, order: false, hidden: false };
            if (sections.viewport === undefined)
                sections.viewport = { ar: false, scene: false, camera: false, light: false, environment: false, general: false };

            let config: object;
            if ((<ShapeDiverResponseDto>response).viewer !== undefined) {
                config = (<ShapeDiverResponseDto>response).viewer!.config;
            } else {
                const error = new ShapeDiverViewerSettingsError('Session.applySettings: No config object available.');
                throw this._logger.handleError(LOGGING_TOPIC.SETTINGS, 'Session.applySettings', error);
            }

            try {
                validate(config)
            } catch (e) {
                const error = new ShapeDiverViewerSettingsError('Session.applySettings: Was not able to validate config object.');
                throw this._logger.handleError(LOGGING_TOPIC.SETTINGS, 'Session.applySettings', error);
            }

            const settings = <ISettingsV3_1>convert(config, '3.1');

            const exportMappingUid: { [key: string]: string | undefined } = {};
            if (sections.session.export.displayname || sections.session.export.order || sections.session.export.hidden)
                if (response.exports)
                    for (let exportId in response.exports)
                        if (response.exports[exportId].uid !== undefined)
                            exportMappingUid[response.exports[exportId].uid!] = exportId;

            const currentSettings = this._settingsEngine.settings;

            // apply parameter settings
            if (sections.session.parameter.displayname || sections.session.parameter.order || sections.session.parameter.hidden || sections.session.parameter.value) {
                for (let p in this.parameters) {
                    if (settings.session[p]) {
                        if (sections.session.parameter.displayname) this.parameters[p].displayname = settings.session[p].displayname;
                        if (sections.session.parameter.order) this.parameters[p].order = settings.session[p].order;
                        if (sections.session.parameter.hidden) this.parameters[p].hidden = settings.session[p].hidden || false;
                    }

                    if (response.parameters && response.parameters[p]) {
                        if (sections.session.parameter.value) this.parameters[p].value = response.parameters[p].defval !== undefined ? response.parameters[p].defval : this.parameters[p].value;
                    }
                }
            }

            // apply export settings
            if (sections.session.export.displayname || sections.session.export.order || sections.session.export.hidden) {
                for (let p in this.exports) {
                    let idForSettings = '';
                    if (settings.session[p]) {
                        idForSettings = p;
                    } else {
                        const uid = this.exports[p].uid;
                        if (!uid) continue;
                        if (!exportMappingUid[uid]) continue;
                        idForSettings = exportMappingUid[uid]!;
                    }
                    if (settings.session[idForSettings]) {
                        if (sections.session.export.displayname) this.exports[p].displayname = settings.session[idForSettings].displayname;
                        if (sections.session.export.order) this.exports[p].order = settings.session[idForSettings].order;
                        if (sections.session.export.hidden) this.exports[p].hidden = settings.session[idForSettings].hidden || false;
                    }
                }
            }

            // apply ar settings
            if (sections.viewport.ar) {
                currentSettings.ar = settings.ar;
                currentSettings.general.transformation = settings.general.transformation;
            }

            // apply camera settings
            if (sections.viewport.camera)
                currentSettings.camera = settings.camera;

            // apply light settings
            if (sections.viewport.light)
                currentSettings.light = settings.light;

            // apply scene settings
            if (sections.viewport.scene) {
                currentSettings.environmentGeometry.gridColor = settings.environmentGeometry.gridColor;
                currentSettings.environmentGeometry.gridVisibility = settings.environmentGeometry.gridVisibility;
                currentSettings.environmentGeometry.groundPlaneColor = settings.environmentGeometry.groundPlaneColor;
                currentSettings.environmentGeometry.groundPlaneVisibility = settings.environmentGeometry.groundPlaneVisibility;

                currentSettings.rendering.shadows = settings.rendering.shadows;
                currentSettings.rendering.ambientOcclusion = settings.rendering.ambientOcclusion;

                currentSettings.rendering.textureEncoding = settings.rendering.textureEncoding;
                currentSettings.rendering.outputEncoding = settings.rendering.outputEncoding;
                currentSettings.rendering.physicallyCorrectLights = settings.rendering.physicallyCorrectLights;
                currentSettings.rendering.toneMapping = settings.rendering.toneMapping;
                currentSettings.rendering.toneMappingExposure = settings.rendering.toneMappingExposure;
            }

            if (sections.viewport.general) {
                currentSettings.general.commitParameters = settings.general.commitParameters;
                currentSettings.general.pointSize = settings.general.pointSize;
            }

            // apply environment settings
            if (sections.viewport.environment) {
                currentSettings.environment.clearAlpha = settings.environment.clearAlpha;
                currentSettings.environment.clearColor = settings.environment.clearColor;
                currentSettings.environment.map = settings.environment.map;
                currentSettings.environment.mapAsBackground = settings.environment.mapAsBackground;
            }

        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this._logger.handleError(LOGGING_TOPIC.GENERAL, 'Session.applySettings', e);
        }
    }

    public canGoBack(): boolean {
        // the first entry is always the one from the init call
        // all additional entries can be undone
        return this.#parameterHistory.length > 1;
    }

    public canGoForward(): boolean {
        return this.#parameterHistoryForward.length > 0;
    }

    public async close(retry = false): Promise<void> {
        this.checkAvailability('close');

        try {
            this._httpClient.removeDataLoading(this._sessionId!)
            await this._sdk.session.close(this._sessionId!);
            if (this._automaticSceneUpdate) this._sceneTree.removeNode(this._node);

            this._closed = true;
        } catch (e) {
            await this.handleError(LOGGING_TOPIC.SESSION, 'Session.close', e, retry);
            return await this.close(true);
        }
    }

    /**
     * Customizes the session with updated parameters to get the updated scene graph node.
     * 
     * @param parameters the parameter set to update the session
     * @returns promise with a scene graph node
     */
    public async customize(force: boolean = false): Promise<ITreeNode> {
        const eventId = this._uuidGenerator.create();
        const customizationId = this._uuidGenerator.create();
        try {
            // we check if something changed
            if (force === false) {
                let changes = false;
                for (const parameterId in this.parameters)
                    if (this.parameters[parameterId].sessionValue !== this.parameters[parameterId].value)
                        changes = true;
                if(changes === false)
                    return this.node;
            }

            const eventStart: ITaskEvent = { type: TASK_TYPE.SESSION_CUSTOMIZATION, id: eventId, progress: 0, data: { sessionId: this.id }, status: 'Customizing session' };
            this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_START, eventStart);

            const oldNode = this.node.cloneInstance();
            this.#customizationProcess = customizationId;

            this._logger.debugLow(LOGGING_TOPIC.SESSION, `Session(${this.id}).customize: Customizing session.`);

            for (let r in this._stateEngine.renderingEngines)
                this._stateEngine.renderingEngines[r].busy.push(customizationId);

            const eventFileUpload: ITaskEvent = { type: TASK_TYPE.SESSION_CUSTOMIZATION, id: eventId, progress: 0.1, data: { sessionId: this.id }, status: 'Uploading file parameters' };
            this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_PROCESS, eventFileUpload);

            const fileParameterIds: { [key: string]: string } = {}
            // load file parameter first
            for (const parameterId in this.parameters) {
                if (this.parameters[parameterId] instanceof FileParameter) {
                    fileParameterIds[parameterId] = await (<IFileParameter>this.parameters[parameterId]).upload();

                    // OPTION TO SKIP - PART 1a
                    if (this.#customizationProcess !== customizationId) {
                        for (let r in this._stateEngine.renderingEngines)
                            if (this._stateEngine.renderingEngines[r].busy.includes(customizationId))
                                this._stateEngine.renderingEngines[r].busy.splice(this._stateEngine.renderingEngines[r].busy.indexOf(customizationId), 1);

                        this._logger.debug(LOGGING_TOPIC.SESSION, `Session(${this.id}).customize: Session customization was exceeded by other customization request.`);

                        const eventCancel1a: ITaskEvent = { type: TASK_TYPE.SESSION_CUSTOMIZATION, id: eventId, progress: 1, data: { sessionId: this.id }, status: 'Session customization was exceeded by other customization request' };
                        this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_CANCEL, eventCancel1a);
                        return new SessionTreeNode();
                    }
                }
            }

            // OPTION TO SKIP - PART 1b
            if (this.#customizationProcess !== customizationId) {
                for (let r in this._stateEngine.renderingEngines)
                    if (this._stateEngine.renderingEngines[r].busy.includes(customizationId))
                        this._stateEngine.renderingEngines[r].busy.splice(this._stateEngine.renderingEngines[r].busy.indexOf(customizationId), 1);

                const eventCancel1b: ITaskEvent = { type: TASK_TYPE.SESSION_CUSTOMIZATION, id: eventId, progress: 1, data: { sessionId: this.id }, status: 'Session customization was exceeded by other customization request' };
                this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_CANCEL, eventCancel1b);
                this._logger.debug(LOGGING_TOPIC.SESSION, `Session(${this.id}).customize: Session customization was exceeded by other customization request.`);
                return new SessionTreeNode();
            }

            // assign the uploaded parameters
            for (const parameterId in fileParameterIds)
                this.parameters[parameterId].value = fileParameterIds[parameterId];

            const parameterSet: {
                [key: string]: {
                    value: any,
                    valueString: string
                }
            } = {};

            // create a set of the current validated parameter values
            for (const parameterId in this.parameters) {
                parameterSet[parameterId] = {
                    value: this.parameters[parameterId].value,
                    valueString: this.parameters[parameterId].stringify()
                }
            }

            // update the session engine parameter values if everything succeeded
            for (const parameterId in this.parameters)
                this.parameterValues[parameterId] = parameterSet[parameterId].valueString;
            this._logger.info(LOGGING_TOPIC.SESSION, `Session(${this.id}).customize: Customizing session with parameters ${JSON.stringify(this.parameterValues)}.`);

            const eventRequest: ITaskEvent = { type: TASK_TYPE.SESSION_CUSTOMIZATION, id: eventId, progress: 0.25, data: { sessionId: this.id }, status: 'Sending customization request' };
            this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_PROCESS, eventRequest);

            const newNode = await this.customizeInternal(() => this.#customizationProcess !== customizationId);

            const eventSceneUpdate: ITaskEvent = { type: TASK_TYPE.SESSION_CUSTOMIZATION, id: eventId, progress: 0.75, data: { sessionId: this.id }, status: 'Updating scene' };
            this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_PROCESS, eventSceneUpdate);

            // OPTION TO SKIP - PART 2
            if (this.#customizationProcess !== customizationId) {
                for (let r in this._stateEngine.renderingEngines)
                    if (this._stateEngine.renderingEngines[r].busy.includes(customizationId))
                        this._stateEngine.renderingEngines[r].busy.splice(this._stateEngine.renderingEngines[r].busy.indexOf(customizationId), 1);

                const eventCancel2: ITaskEvent = { type: TASK_TYPE.SESSION_CUSTOMIZATION, id: eventId, progress: 1, data: { sessionId: this.id }, status: 'Session customization was exceeded by other customization request' };
                this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_CANCEL, eventCancel2);
                this._logger.debug(LOGGING_TOPIC.SESSION, `Session(${this.id}).customize: Session customization was exceeded by other customization request.`);
                return newNode;
            }

            // if this is not a call by the goBack or goForward functions, add the parameter values to the history and delete the forward history
            if (!this.#parameterHistoryCall) {
                this.#parameterHistory.push(parameterSet);
                this.#parameterHistoryForward = [];
            }

            if (this.automaticSceneUpdate) this._sceneTree.removeNode(this.node);
            this._node = newNode;
            if (this.automaticSceneUpdate) this._sceneTree.addNode(this.node);

            this._logger.debug(LOGGING_TOPIC.SESSION, `Session(${this.id}).customize: Customization request finished, updating geometry.`);

            // set the session values to the current ones in all parameters
            for (const parameterId in this.parameters)
                (<any>this.parameters[parameterId].sessionValue) = parameterSet[parameterId].value;

            if (this._updateCallback) this._updateCallback(newNode, oldNode);
                
            // set the output content to what has been updated
            for (const outputId in this.outputs)
                this.outputs[outputId].updateOutput(
                    newNode.children.find(c => c.name === outputId)!,
                    oldNode.children.find(c => c.name === outputId)!
                );

            // set the export definitions
            for (const exportId in this.exports)
                this.exports[exportId].updateExport();

            this._warningCreator();

            this.node.excludeViewports = JSON.parse(JSON.stringify(this._excludeViewports));

            for (let r in this._stateEngine.renderingEngines)
                if (this._stateEngine.renderingEngines[r].busy.includes(customizationId))
                    this._stateEngine.renderingEngines[r].busy.splice(this._stateEngine.renderingEngines[r].busy.indexOf(customizationId), 1);

            this._logger.debug(LOGGING_TOPIC.SESSION, `Session(${this.id}).customize: Session customized.`);

            this._eventEngine.emitEvent(EVENTTYPE.SESSION.SESSION_CUSTOMIZED, { sessionId: this.id });

            const eventEnd: ITaskEvent = { type: TASK_TYPE.SESSION_CUSTOMIZATION, id: eventId, progress: 1, data: { sessionId: this.id }, status: 'Session customized' };
            this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_END, eventEnd);

            return this.node;
        } catch (e) {
            const eventCancel: ITaskEvent = { type: TASK_TYPE.SESSION_CUSTOMIZATION, id: eventId, progress: 1, data: { sessionId: this.id }, status: 'Session customization failed' };
            this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_CANCEL, eventCancel);

            for (let r in this._stateEngine.renderingEngines)
                if (this._stateEngine.renderingEngines[r].busy.includes(customizationId))
                    this._stateEngine.renderingEngines[r].busy.splice(this._stateEngine.renderingEngines[r].busy.indexOf(customizationId), 1);

            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this._logger.handleError(LOGGING_TOPIC.SESSION, `Session(${this.id}).customize`, e);
        }
    }

    public async customizeParallel(parameterValues: { [key: string]: string }): Promise<ITreeNode> {
        try {
            const parameterSet: {
                [key: string]: string
            } = {};

            // create a set of the current validated parameter values
            for (const parameterId in this.parameters)
                parameterSet[parameterId] = parameterValues[parameterId] !== undefined ? (' ' + parameterValues[parameterId]).slice(1) : this.parameters[parameterId].stringify()

            const newNode = await this.customizeSession(parameterSet, () => false, true);
            newNode.excludeViewports = JSON.parse(JSON.stringify(this._excludeViewports));
            return newNode;
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this._logger.handleError(LOGGING_TOPIC.SESSION, `Session(${this.id}).customize`, e);
        }
    }

    public async goBack(): Promise<ITreeNode> {
        if (!this.canGoBack()) {
            this._logger.debug(LOGGING_TOPIC.SESSION, `Session(${this.id}).goBack: Cannot go further back.`);
            return new TreeNode();
        }
        // get the current parameter set and store it in the forward history later on
        const currentParameterSet = this.#parameterHistory.pop()!;

        // adjust the parameters according to the last parameter set
        const lastParameterSet = this.#parameterHistory[this.#parameterHistory.length - 1];
        for (const parameterId in lastParameterSet)
            this.parameters[parameterId].value = lastParameterSet[parameterId].value;

        // call the customization function with the parameterHistoryCall value set to true
        this.#parameterHistoryCall = true;
        const node = await this.customize();
        this.#parameterHistoryCall = false;

        // add the current (not anymore current) parameter set to the forward history
        this.#parameterHistoryForward.push(currentParameterSet);
        return node;
    }

    public async goForward(): Promise<ITreeNode> {
        if (!this.canGoForward()) {
            this._logger.debug(LOGGING_TOPIC.SESSION, `Session(${this.id}).goForward: Cannot go further forward.`);
            return new TreeNode();
        }
        // get the last undone parameter set and apply the values to the parameters
        const lastParameterSet = this.#parameterHistoryForward.pop()!;
        for (const parameterId in lastParameterSet)
            this.parameters[parameterId].value = lastParameterSet[parameterId].value;

        // call the customization function with the parameterHistoryCall value set to true
        this.#parameterHistoryCall = true;
        const node = await this.customize();
        this.#parameterHistoryCall = false;

        // add the current parameter set to the history
        this.#parameterHistory.push(lastParameterSet);
        return node;
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
            throw this._logger.handleError(LOGGING_TOPIC.SESSION, 'Session.init', error);
        }

        try {
            this._performanceEvaluator.startSection('sessionResponse');

            const parameterSet: { [key: string]: string } = {};
            for (const parameterId in parameterValues)
                parameterSet[parameterId] = (' ' + parameterValues[parameterId]).slice(1);

            this._responseDto = await this._sdk.session.init(this._ticket, parameterSet);
            this._performanceEvaluator.endSection('sessionResponse');

            this._viewerSettings = this._responseDto.viewer?.config;
            this._settingsEngine.loadSettings(this._viewerSettings);
            this._sessionId = this._responseDto.sessionId;
            this._modelId = this._responseDto.model?.id;
            
            this._httpClient.addDataLoading(this._sessionId!, {
                getAsset: this._sdk.asset.getAsset.bind(this._sdk.asset),
                downloadTexture: this._sdk.asset.downloadImage.bind(this._sdk.asset),
            })

            if (!this._sessionId)
                throw new ShapeDiverViewerSessionError(`Session.init: Initialization of session failed. ResponseDto did not have a sessionId.`)
            if (!this._modelId)
                throw new ShapeDiverViewerSessionError(`Session.init: Initialization of session failed. ResponseDto did not have a model.id.`)

            this.updateResponseDto(this._responseDto, parameterSet);
            this._initialized = true;
        } catch (e) {
            await this.handleError(LOGGING_TOPIC.SESSION, 'Session.init', e, retry);
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
     public async loadOutputsParallel(responseDto: ShapeDiverResponseDto, cancelRequest: () => boolean = () => false, retry = false): Promise<ISessionTreeNode> {
        this.checkAvailability();

        let outputs: {
            [key: string]: IOutput;
        } = {}
        let outputsFreeze: {
            [key: string]: boolean;
        } = {}
        
        for (let outputId in responseDto.outputs) {
            responseDto.outputs[outputId].id = outputId;
            if (this.outputsFreeze[outputId] === undefined) outputsFreeze[outputId] = false;
            outputs[outputId] = new Output(<ShapeDiverResponseOutput>responseDto.outputs[outputId], this);
        }

        try {
            const node = await this._outputLoader.loadOutputs(this._responseDto!.model?.name || 'model', outputs, outputsFreeze);
            node.data.push(new SessionData(responseDto));      
            return node;
        }
        catch (e) {
            if (e instanceof OutputDelayException) {
                await this.timeout(e.delay);
            } else {
                await this.handleError(LOGGING_TOPIC.SESSION, 'Session.loadOutputsParallel', e, retry);
                if (cancelRequest()) return new SessionTreeNode();
                return await this.loadOutputsParallel(responseDto, cancelRequest, true);
            }

            if (cancelRequest()) return new SessionTreeNode();
            let outputMapping: { [key: string]: string } = {};
            for (let output in outputs)
                outputMapping[output] = outputs[output].version;

            try {
                const responseDto = await this._sdk.output.getCache(this._sessionId!, outputMapping);
                if (cancelRequest()) return new SessionTreeNode();
                this.updateResponseDto(responseDto);
                return await this.loadOutputsParallel(responseDto, cancelRequest);
            } catch (e) {
                await this.handleError(LOGGING_TOPIC.SESSION, 'Session.loadOutputsParallel', e, retry);
                if (cancelRequest()) return new SessionTreeNode();
                return await this.loadOutputsParallel(responseDto, cancelRequest, true);
            }
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
    public async loadOutputs(cancelRequest: () => boolean = () => false, retry = false): Promise<ISessionTreeNode> {
        this.checkAvailability();

        const o = Object.assign({}, this._outputs);
        const of = Object.assign({}, this._outputsFreeze);
        try {
            const node = await this._outputLoader.loadOutputs(this._responseDto!.model?.name || 'model', o, of);
            node.data.push(new SessionData(this._responseDto!));

            if (cancelRequest()) return node;            

            if (this._automaticSceneUpdate) this._sceneTree.removeNode(this._node);
            this._node = node;
            if (this._automaticSceneUpdate) this._sceneTree.addNode(this._node);

            this.node.excludeViewports = JSON.parse(JSON.stringify(this._excludeViewports));

            return node;
        }
        catch (e) {
            if (e instanceof OutputDelayException) {
                await this.timeout(e.delay);
            } else {
                await this.handleError(LOGGING_TOPIC.SESSION, 'Session.loadOutputs', e, retry);
                if (cancelRequest()) return new SessionTreeNode();
                return await this.loadOutputs(cancelRequest, true);
            }

            if (cancelRequest()) return new SessionTreeNode();
            let outputMapping: { [key: string]: string } = {};
            for (let output in o)
                outputMapping[output] = o[output].version;

            try {
                const responseDto = await this._sdk.output.getCache(this._sessionId!, outputMapping);
                if (cancelRequest()) return new SessionTreeNode();
                this.updateResponseDto(responseDto);
                return await this.loadOutputs(cancelRequest);
            } catch (e) {
                await this.handleError(LOGGING_TOPIC.SESSION, 'Session.loadOutputs', e, retry);
                if (cancelRequest()) return new SessionTreeNode();
                return await this.loadOutputs(cancelRequest, true);
            }
        }
    }

    public async requestExport(exportId: string, parameters: { [key: string]: string }, maxWaitTime: number, retry = false): Promise<ShapeDiverResponseExport> {
        this.checkAvailability('export');
        try {
            const parameterSet: { [key: string]: string } = {};
            for (const parameterId in parameters)
                parameterSet[parameterId] = (' ' + parameters[parameterId]).slice(1);
            const responseDto = await this._sdk.utils.submitAndWaitForExport(this._sdk, this._sessionId!, { exports: { id: exportId }, parameters: parameterSet }, maxWaitTime)
            this.updateResponseDto(responseDto);
            return this.exports[exportId];
        } catch (e) {
            await this.handleError(LOGGING_TOPIC.SESSION, 'Session.requestExport', e, retry);
            return await this.requestExport(exportId, parameters, maxWaitTime, true);
        }
    }

    public resetSettings(sections?: ISettingsSections): void {
        if (!this._responseDto) {
            const error = new ShapeDiverViewerSessionError(`Session.resetSettings: responseDto not available.`);
            throw this._logger.handleError(LOGGING_TOPIC.SESSION, 'Session.resetSettings', error);
        }
        try {
            sections = sections || {};
            if (sections.session === undefined) {
                sections.session = {
                    parameter: { displayname: true, order: true, hidden: true },
                    export: { displayname: true, order: true, hidden: true }
                };
            }
            if (sections.session.parameter === undefined)
                sections.session.parameter = { displayname: true, order: true, hidden: true, value: true };
            if (sections.session.export === undefined)
                sections.session.export = { displayname: true, order: true, hidden: true };
            if (sections.viewport === undefined)
                sections.viewport = { ar: true, scene: true, camera: true, light: true, environment: true, general: true };

            return this.applySettings(this._responseDto, sections);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this._logger.handleError(LOGGING_TOPIC.GENERAL, 'Session.resetSettings', e);
        }
    }

    public async saveDefaultParameterValues(): Promise<boolean> {
        try {
            this._logger.debugLow(LOGGING_TOPIC.SESSION, `Session(${this.id}).saveDefaultParameters: Saving default parameters.`);
            const response = await this.saveDefaultParameters();
            if (response) {
                this._logger.debug(LOGGING_TOPIC.SESSION, `Session(${this.id}).saveDefaultParameters: Saved default parameters.`);
            } else {
                const error = new ShapeDiverViewerSessionError(`Session(${this.id}).saveDefaultParameters: Could not save default parameters.`);
                throw this._logger.handleError(LOGGING_TOPIC.SESSION, `Session(${this.id}).saveDefaultParameters`, error);
            }
            return response;
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this._logger.handleError(LOGGING_TOPIC.SESSION, `Session(${this.id}).saveDefaultParameters`, e);
        }
    }

    public async saveDefaultParameters(retry = false): Promise<boolean> {
        this.checkAvailability('defaultparam', true);
        try {
            await this._sdk.model.setDefaultParams(this._modelId!, this._parameterValues)
            return true;
        } catch (e) {
            await this.handleError(LOGGING_TOPIC.SESSION, 'Session.saveDefaultParameters', e, retry);
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
            await this.handleError(LOGGING_TOPIC.SESSION, 'Session.saveExportProperties', e, retry);
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
            await this.handleError(LOGGING_TOPIC.SESSION, 'Session.saveOutputProperties', e, retry);
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
            await this.handleError(LOGGING_TOPIC.SESSION, 'Session.saveParameterProperties', e, retry);
            return await this.saveParameterProperties(parameters, true);
        }
    }

    public async saveSettings(json: any, retry = false): Promise<boolean> {
        this.checkAvailability('configure', true);
        
        try {
            validate(json, '3.1')
        } catch (e) {
            const error = new ShapeDiverViewerSettingsError('Session.saveSettings: Settings could not be validated. ' + (<Error>e).message, <Error>e);
            throw this._logger.handleError(LOGGING_TOPIC.SETTINGS, 'Session.applySettings', error);
        } 
        
        try {        
            await this._sdk.model.updateConfig(this._modelId!, json);
            return true;
        } catch (e) {
            await this.handleError(LOGGING_TOPIC.SESSION, 'Session.saveSettings', e, retry);
            return await this.saveSettings(json, true);
        }
    }

    public async saveUiProperties(saveInSettings: boolean = true): Promise<boolean> {
        try {
            this._logger.debugLow(LOGGING_TOPIC.SESSION, `Session(${this.id}).saveSessionProperties: Saving session properties.`);

            // settings saving 
            this._saveSessionSettings();

            let properties: {
                [key: string]: {
                    displayname: string,
                    hidden: boolean,
                    order: number,
                    tooltip: string
                }
            } = {};
            for (let p in this.parameters) {
                properties[p] = {
                    displayname: this.parameters[p].displayname !== undefined ? this.parameters[p].displayname! : '',
                    hidden: this.parameters[p].hidden !== undefined ? this.parameters[p].hidden : false,
                    order: this.parameters[p].order !== undefined ? this.parameters[p].order! : 0,
                    tooltip: this.parameters[p].tooltip !== undefined ? this.parameters[p].tooltip! : '',
                };
            }
            const responseP = Object.values(properties).length !== 0 ? await this.saveParameterProperties(properties) : true;

            properties = {};
            for (let e in this.exports) {
                properties[e] = {
                    displayname: this.exports[e].displayname !== undefined ? this.exports[e].displayname! : '',
                    hidden: this.exports[e].hidden !== undefined ? this.exports[e].hidden : false,
                    order: this.exports[e].order !== undefined ? this.exports[e].order! : 0,
                    tooltip: this.exports[e].tooltip !== undefined ? this.exports[e].tooltip! : '',
                };
            }
            const responseE = Object.values(properties).length !== 0 ? await this.saveExportProperties(properties) : true;

            properties = {};
            for (let o in this.outputs) {
                properties[o] = {
                    displayname: this.outputs[o].displayname !== undefined ? this.outputs[o].displayname! : '',
                    hidden: this.outputs[o].hidden !== undefined ? this.outputs[o].hidden : false,
                    order: this.outputs[o].order !== undefined ? this.outputs[o].order! : 0,
                    tooltip: this.outputs[o].tooltip !== undefined ? this.outputs[o].tooltip! : '',
                };
            }
            const responseO = Object.values(properties).length !== 0 ? await this.saveOutputProperties(properties) : true;

            // save partial settings
            const response = saveInSettings ? await this.saveSettings(this._settingsEngine.convertToTargetVersion()) : true;

            if (response && responseP && responseO && responseE) {
                this._logger.debug(LOGGING_TOPIC.SESSION, `Session(${this.id}).saveSessionProperties: Saved session properties.`);
            } else {
                this._logger.warn(LOGGING_TOPIC.SESSION, `Session(${this.id}).saveSessionProperties: Could not save session properties.`);
            }
            return response && responseP && responseO && responseE;
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this._logger.handleError(LOGGING_TOPIC.SESSION, `Session(${this.id}).saveSessionProperties`, e);
        }
    }

    public async updateOutputs(): Promise<ITreeNode> {
        const eventId = this._uuidGenerator.create();
        const customizationId = this._uuidGenerator.create();
        const eventStart: ITaskEvent = { type: TASK_TYPE.SESSION_OUTPUTS_UPDATE, id: eventId, progress: 0, data: { sessionId: this.id }, status: 'Updating outputs' };
        this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_START, eventStart);

        const oldNode = this.node.cloneInstance();
        this.#customizationProcess = customizationId;

        this._logger.debugLow(LOGGING_TOPIC.SESSION, `Session(${this.id}).updateOutputs: Updating Outputs.`);

        for (let r in this._stateEngine.renderingEngines)
            this._stateEngine.renderingEngines[r].busy.push(customizationId);

        const eventRequest: ITaskEvent = { type: TASK_TYPE.SESSION_OUTPUTS_UPDATE, id: eventId, progress: 0.25, data: { sessionId: this.id }, status: 'Loading outputs' };
        this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_PROCESS, eventRequest);

        const newNode = await this.loadOutputs(() => this.#customizationProcess !== customizationId);

        const eventSceneUpdate: ITaskEvent = { type: TASK_TYPE.SESSION_OUTPUTS_UPDATE, id: eventId, progress: 0.75, data: { sessionId: this.id }, status: 'Updating scene' };
        this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_PROCESS, eventSceneUpdate);

        // OPTION TO SKIP - PART 1
        if (this.#customizationProcess !== customizationId) {
            for (let r in this._stateEngine.renderingEngines)
                if (this._stateEngine.renderingEngines[r].busy.includes(customizationId))
                    this._stateEngine.renderingEngines[r].busy.splice(this._stateEngine.renderingEngines[r].busy.indexOf(customizationId), 1);

            const eventCancel1: ITaskEvent = { type: TASK_TYPE.SESSION_OUTPUTS_UPDATE, id: eventId, progress: 1, data: { sessionId: this.id }, status: 'Output updating was exceeded by other customization request' };
            this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_CANCEL, eventCancel1);
            this._logger.debug(LOGGING_TOPIC.SESSION, `Session(${this.id}).updateOutputs: Output updating was exceeded by other request.`);
            return newNode;
        }

        if (this.automaticSceneUpdate) this._sceneTree.removeNode(this.node);
        this._node = newNode;
        if (this.automaticSceneUpdate) this._sceneTree.addNode(this.node);

        this._logger.debug(LOGGING_TOPIC.SESSION, `Session(${this.id}).updateOutputs: Updating outputs finished, updating geometry.`);
        
        if (this._updateCallback) this._updateCallback(newNode, oldNode);

        // set the output content to what has been updated
        for (const outputId in this.outputs) {
            this.outputs[outputId].updateOutput(
                newNode.children.find(c => c.name === outputId)!,
                oldNode.children.find(c => c.name === outputId)!
            );
        }

        // set the export definitions
        for (const exportId in this.exports)
            this.exports[exportId].updateExport();

        this._warningCreator();
        this.node.excludeViewports = JSON.parse(JSON.stringify(this._excludeViewports));

        for (let r in this._stateEngine.renderingEngines)
            if (this._stateEngine.renderingEngines[r].busy.includes(customizationId))
                this._stateEngine.renderingEngines[r].busy.splice(this._stateEngine.renderingEngines[r].busy.indexOf(customizationId), 1);

        this._logger.debug(LOGGING_TOPIC.SESSION, `Session(${this.id}).updateOutputs: Updated outputs.`);

        const eventEnd: ITaskEvent = { type: TASK_TYPE.SESSION_OUTPUTS_UPDATE, id: eventId, progress: 1, data: { sessionId: this.id }, status: 'Outputs updated' };
        this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_END, eventEnd);

        return this.node;
    }

    public async uploadFile(parameterId: string, data: File, type: string, retry = false): Promise<string> {
        this.checkAvailability('file-upload');
        try {
            const responseDto = await this._sdk.file.requestUpload(this._sessionId!, {
                [parameterId]: { size: data.size, format: type }
            })

            if (responseDto && responseDto.asset && responseDto.asset.file && responseDto.asset.file[parameterId]) {
                const fileAsset = responseDto.asset.file[parameterId];
                await this._sdk.utils.upload(fileAsset.href, await data.arrayBuffer(), type);
                return fileAsset.id;
            } else {
                const error = new ShapeDiverViewerSessionError(`Session.uploadFile: Upload reply has not the required format.`);
                throw this._logger.handleError(LOGGING_TOPIC.SESSION, 'Session.uploadFile', error);
            }
        } catch (e) {
            await this.handleError(LOGGING_TOPIC.SESSION, 'Session.uploadFile', e, retry);
            return await this.uploadFile(parameterId, data, type, true);
        }
    }

    public async uploadGLTF(blob: Blob, conversion: ShapeDiverRequestGltfUploadQueryConversion = ShapeDiverRequestGltfUploadQueryConversion.NONE, retry = false): Promise<ShapeDiverResponseDto> {
        this.checkAvailability('gltf-upload');
        try {
            const responseDto = await this._sdk.gltf.upload(this._sessionId!, await blob.arrayBuffer(), 'model/gltf-binary', conversion);
            if (!responseDto || !responseDto.gltf || !responseDto.gltf.href) {
                const error = new ShapeDiverViewerSessionError(`Session.uploadGLTF: Upload reply has not the required format.`);
                throw this._logger.handleError(LOGGING_TOPIC.SESSION, 'Session.uploadGLTF', error);
            }
            return responseDto;
        } catch (e) {
            await this.handleError(LOGGING_TOPIC.SESSION, 'Session.uploadGLTF', e, retry);
            return await this.uploadGLTF(blob, conversion, true);
        }
    }

    // #endregion Public Methods (22)

    // #region Private Methods (8)

    private _saveSessionSettings() {
        const parameters = this.parameters;
        const exports = this.exports;

        const sessionProperties: {
            [key: string]: {
                order: number;
                displayname: string;
                hidden: boolean;
            }
        } = {};
        for (let p in parameters) {
            sessionProperties[p] = {
                order: parameters[p].order || 0,
                displayname: parameters[p].displayname || '',
                hidden: parameters[p].hidden
            }
        }
        for (let e in exports) {
            sessionProperties[e] = {
                order: exports[e].order || 0,
                displayname: exports[e].displayname || '',
                hidden: exports[e].hidden
            }
        }
        this._settingsEngine.session = sessionProperties;

        let orderedOutputs: IOutput[] = [];
        for (let o in this.outputs) orderedOutputs.push(this.outputs[o]);
        orderedOutputs.sort((a, b) => ((a.order || Infinity) - (b.order || Infinity)));
        let zerosOutputs = orderedOutputs.filter(x => x.order === 0);
        orderedOutputs = orderedOutputs.filter((el) => { return !zerosOutputs.includes(el); });
        orderedOutputs = zerosOutputs.concat(orderedOutputs);

        const controlOrderOutputs = orderedOutputs.map((value) => { return value.id; });
        for (let i = 0; i < controlOrderOutputs.length; i++) {
            if (this.outputs[controlOrderOutputs[i]])
                if (this.outputs[controlOrderOutputs[i]]!.order !== i)
                    this.outputs[controlOrderOutputs[i]]!.order = i;
        }
    }

    private _warningCreator() {
        // set the output content to what has been updated
        for (const outputId in this.outputs) {
            let warning: string = '';
            if (this.outputs[outputId].msg)
                warning += `\n\t- ${this.outputs[outputId].msg}`;
            if (this.outputs[outputId].status_collect && this.outputs[outputId].status_collect !== ShapeDiverResponseModelComputationStatus.SUCCESS)
                warning += `\n\t- status_collect is ${this.outputs[outputId].status_collect}`;
            if (this.outputs[outputId].status_computation && this.outputs[outputId].status_computation !== ShapeDiverResponseModelComputationStatus.SUCCESS)
                warning += `\n\t- status_computation is ${this.outputs[outputId].status_computation}`;
            if (warning)
                this._logger.warn(LOGGING_TOPIC.SESSION, `\nOutput(${outputId}):${warning}`);
        }

        // set the export definitions
        for (const exportId in this.exports) {
            let warning: string = '';
            if (this.exports[exportId].msg)
                warning += `\n\t- ${this.exports[exportId].msg}`;
            if (this.exports[exportId].status_collect && this.exports[exportId].status_collect !== ShapeDiverResponseModelComputationStatus.SUCCESS)
                warning += `\n\t- status_collect is ${this.exports[exportId].status_collect}`;
            if (this.exports[exportId].status_computation && this.exports[exportId].status_computation !== ShapeDiverResponseModelComputationStatus.SUCCESS)
                warning += `\n\t- status_computation is ${this.exports[exportId].status_computation}`;
            if (warning)
                this._logger.warn(LOGGING_TOPIC.SESSION, `\nExport(${exportId}):${warning}`);
        }
    }

    private checkAvailability(action?: string, checkForModelId = false) {
        if (!this._responseDto) {
            const error = new ShapeDiverViewerSessionError(`Session.checkAvailability: responseDto not available.`);
            throw this._logger.handleError(LOGGING_TOPIC.SESSION, 'Session.checkAvailability', error);
        }

        if (!this._sessionId) {
            const error = new ShapeDiverViewerSessionError(`Session.checkAvailability: sessionId not available.`);
            throw this._logger.handleError(LOGGING_TOPIC.SESSION, 'Session.checkAvailability', error);
        }

        if (checkForModelId && !this._modelId) {
            const error = new ShapeDiverViewerSessionError(`Session.checkAvailability: modelId not available.`);
            throw this._logger.handleError(LOGGING_TOPIC.SESSION, 'Session.checkAvailability', error);
        }

        if (action && !this._responseDto.actions) {
            const error = new ShapeDiverViewerSessionError(`Session.checkAvailability: actions not available.`);
            throw this._logger.handleError(LOGGING_TOPIC.SESSION, 'Session.checkAvailability', error);
        }

        const responseDtoAction = this._responseDto.actions?.find(a => a.name === action);
        if (action && !responseDtoAction) {
            const error = new ShapeDiverViewerSessionError(`Session.checkAvailability: action ${action} not available.`);
            throw this._logger.handleError(LOGGING_TOPIC.SESSION, 'Session.checkAvailability', error);
        }
    }

    private async customizeInternal(cancelRequest: () => boolean): Promise<ISessionTreeNode> {
        return this.customizeSession(this._parameterValues, cancelRequest);
    }

    private async customizeSession(parameters: { [key: string]: string }, cancelRequest: () => boolean, parallel = false, retry = false): Promise<ISessionTreeNode> {
        this.checkAvailability('customize');
        try {
            this._performanceEvaluator.startSection('sessionResponse');
            const responseDto = await this._sdk.utils.submitAndWaitForCustomization(this._sdk, this._sessionId!, parameters);
            this._performanceEvaluator.endSection('sessionResponse');
            if (cancelRequest()) return new SessionTreeNode();            
            if (parallel === false) this.updateResponseDto(responseDto);
            return parallel === false ? this.loadOutputs(cancelRequest) : this.loadOutputsParallel(responseDto, cancelRequest);
        } catch (e) {
            await this.handleError(LOGGING_TOPIC.SESSION, 'Session.customizeSession', e, retry);
            if (cancelRequest()) return new SessionTreeNode();
            return await this.customizeSession(parameters, cancelRequest, parallel, true);
        }
    }

    private async handleError(topic: LOGGING_TOPIC, scope: string, e: ShapeDiverBackendError | ShapeDiverViewerError | Error | unknown, retry = false) {
        if (e instanceof ShapeDiverResponseError) {
            if (e.error === ShapeDiverResponseErrorType.SESSION_GONE_ERROR) {
                // case 1: the session is no longer available
                // we try to re-initialize the session 3 times, if that does not work, we close it

                this._logger.warn(topic, `The session has been closed, trying to re-initialize.`);

                if (this._retryCounter < 3) {
                    // we retry this 3 times, the `retry` option in the init function is set to true and passed on 
                    this._retryCounter = retry ? this._retryCounter + 1 : 1;
                    try {
                        this._initialized = false;
                        await this.init(this.parameterValues, true);
                    } catch (e) {
                        if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
                        throw this._logger.handleError(topic, scope, e);
                    }
                } else {
                    // the retries were exceeded, we close the session
                    this._logger.warn(LOGGING_TOPIC.SESSION, 'Tried to retry the connect multiple times, bearer token still not valid. Closing Session.');
                    try { await this._closeOnFailure(); } catch (e) { }
                    throw this._logger.handleError(topic, scope, e);
                }
            } else if (e.error === ShapeDiverResponseErrorType.JWT_VALIDATION_ERROR) {
                // if any of the above errors occur, we try to get a new bearer token
                // if we get a new one, we retry 3 times (by requiring new bearer tokens every time)
                if (this._retryCounter < 3) {
                    if (this._refreshBearerToken) {
                        this.bearerToken = await this._refreshBearerToken();
                        this._retryCounter = retry ? this._retryCounter + 1 : 1;
                        this._logger.warn(LOGGING_TOPIC.SESSION, 'Re-trying with new bearer token.');
                    } else {
                        // no bearer tokens are supplied, we close the session
                        this._logger.warn(LOGGING_TOPIC.SESSION, 'No retry possible, no new bearer token was supplied. Closing Session.');
                        try { await this._closeOnFailure(); } catch (e) { }
                        throw this._logger.handleError(topic, scope, e);
                    }
                } else {
                    // the retries were exceeded, we close the session
                    this._logger.warn(LOGGING_TOPIC.SESSION, 'Tried to retry the connect multiple times, bearer token still not valid. Closing Session.');
                    try { await this._closeOnFailure(); } catch (e) { }
                    throw this._logger.handleError(topic, scope, e);
                }
            } else {
                throw this._logger.handleError(topic, scope, e);
            }
        } else {
            throw this._logger.handleError(topic, scope, e);
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

    private updateResponseDto(responseDto: ShapeDiverResponseDto, initialParameters?: {
        [key: string]: string;
    }) {
        if (!this._responseDto) {
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

        const parameterSet: {
            [key: string]: {
                value: any,
                valueString: string
            }
        } = {};

        for (let parameterId in this._responseDto.parameters) {
            if (this.parameters[parameterId]) continue;
            this._responseDto.parameters[parameterId].id = parameterId;

            switch (true) {
                case this._responseDto.parameters[parameterId].type === PARAMETER_TYPE.BOOL:
                    this.parameters[parameterId] = new Parameter<boolean>(this._responseDto.parameters[parameterId], this);
                    break;
                case this._responseDto.parameters[parameterId].type === PARAMETER_TYPE.COLOR:
                    this.parameters[parameterId] = new Parameter<number | vec3>(this._responseDto.parameters[parameterId], this);
                    break;
                case this._responseDto.parameters[parameterId].type === PARAMETER_TYPE.FILE:
                    this.parameters[parameterId] = new FileParameter(this._responseDto.parameters[parameterId], this);
                    break;
                case this._responseDto.parameters[parameterId].type === PARAMETER_TYPE.EVEN || this._responseDto.parameters[parameterId].type === PARAMETER_TYPE.FLOAT || this._responseDto.parameters[parameterId].type === PARAMETER_TYPE.INT || this._responseDto.parameters[parameterId].type === PARAMETER_TYPE.ODD:
                    this.parameters[parameterId] = new Parameter<number>(this._responseDto.parameters[parameterId], this);
                    break;
                default:
                    this.parameters[parameterId] = new Parameter<string>(this._responseDto.parameters[parameterId], this);
                    break;
            }

            if(initialParameters && initialParameters[parameterId] !== undefined) 
                this.parameters[parameterId].value = initialParameters[parameterId]

            parameterSet[parameterId] = {
                value: this.parameters[parameterId].value,
                valueString: this.parameters[parameterId].stringify()
            }

            if (!this.initialized)
                this.parameterValues[parameterId] = parameterSet[parameterId].valueString;
        }

        // store the initialization as the first parameter set in the history
        if (!this.initialized)
            this.#parameterHistory.push(parameterSet);

        for (let exportId in this._responseDto.exports) {
            if (this._responseDto.exports[exportId].type === ShapeDiverResponseExportDefinitionType.EMAIL || this._responseDto.exports[exportId].type === ShapeDiverResponseExportDefinitionType.DOWNLOAD) {
                if(!this.exports[exportId]) {
                    this._responseDto.exports[exportId].id = exportId;
                    this.exports[exportId] = new Export(this._responseDto.exports[exportId], this);
                } else {
                    this.exports[exportId].updateExportDefinition(this._responseDto.exports[exportId])
                }
            }
        }

        for (let outputId in this._responseDto.outputs) {
            if(!this.outputs[outputId]) {
                this._responseDto.outputs[outputId].id = outputId;
                if (this.outputsFreeze[outputId] === undefined) this.outputsFreeze[outputId] = false;
                this.outputs[outputId] = new Output(<ShapeDiverResponseOutput>this._responseDto.outputs[outputId], this);
            } else {
                this.outputs[outputId].updateOutputDefinition(<ShapeDiverResponseOutput>this._responseDto.outputs[outputId])
            }
        }
    }

    // #endregion Private Methods (8)
}