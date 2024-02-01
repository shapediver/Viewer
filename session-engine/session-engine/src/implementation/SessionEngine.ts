import {
    convert,
    ISettings,
    latestVersion,
    validate,
    versions
} from '@shapediver/viewer.settings';
import {
    create,
    isGBResponseError,
    ShapeDiverError as ShapeDiverBackendError,
    ShapeDiverRequestConfigure,
    ShapeDiverRequestCustomization,
    ShapeDiverRequestExport,
    ShapeDiverRequestGltfUploadQueryConversion,
    ShapeDiverResponseDto,
    ShapeDiverResponseErrorType,
    ShapeDiverResponseExport,
    ShapeDiverResponseExportDefinitionType,
    ShapeDiverResponseModelComputationStatus,
    ShapeDiverResponseOutput,
    ShapeDiverSdk,
    ShapeDiverSdkConfigType
} from '@shapediver/sdk.geometry-api-sdk-v2';
import {
    EventEngine,
    EVENTTYPE,
    HttpClient,
    HttpResponse,
    Logger,
    PerformanceEvaluator,
    SettingsEngine,
    ShapeDiverViewerError,
    ShapeDiverViewerSessionError,
    ShapeDiverViewerSettingsError,
    StateEngine,
    SystemInfo,
    UuidGenerator
} from '@shapediver/viewer.shared.services';
import { Export } from './dto/Export';
import { FileParameter } from './dto/FileParameter';
import { IExport } from '../interfaces/dto/IExport';
import { IFileParameter } from '../interfaces/dto/IFileParameter';
import { IOutput } from '../interfaces/dto/IOutput';
import { IParameter } from '../interfaces/dto/IParameter';
import { ISessionEngine, ISettingsSections, PARAMETER_TYPE } from '../interfaces/ISessionEngine';
import { ISessionTreeNode } from '../interfaces/ISessionTreeNode';
import { IOutputEvent, ITaskEvent, TASK_TYPE } from '@shapediver/viewer.shared.types';
import {
    ITree,
    ITreeNode,
    Tree,
    TreeNode
} from '@shapediver/viewer.shared.node-tree';
import { Output } from './dto/Output';
import { OutputDelayException } from './OutputDelayException';
import { OutputLoader, OutputLoaderTaskEventInfo } from './OutputLoader';
import { Parameter } from './dto/Parameter';
import { SessionData } from './SessionData';
import { SessionTreeNode } from './SessionTreeNode';
import { vec3 } from 'gl-matrix';
/* eslint-disable @typescript-eslint/no-empty-function */

export class SessionEngine implements ISessionEngine {
    // #region Properties (44)

    private readonly _eventEngine = EventEngine.instance;
    private readonly _exports: { [key: string]: IExport; } = {};
    private readonly _guid?: string;
    private readonly _httpClient: HttpClient = HttpClient.instance;
    private readonly _id: string;
    private readonly _logger: Logger = Logger.instance;
    private readonly _modelViewUrl: string;
    private readonly _outputLoader: OutputLoader;
    private readonly _outputs: { [key: string]: IOutput; } = {};
    private readonly _outputsFreeze: { [key: string]: boolean; } = {};
    private readonly _parameterValues: { [key: string]: string; } = {};
    private readonly _parameters: { [key: string]: IParameter<unknown>; } = {};
    private readonly _performanceEvaluator = PerformanceEvaluator.instance;
    private readonly _sceneTree: ITree = Tree.instance;
    private readonly _sessionEngineId = (UuidGenerator.instance).create();
    private readonly _settingsEngine: SettingsEngine = new SettingsEngine();
    private readonly _stateEngine: StateEngine = StateEngine.instance;
    private readonly _ticket?: string;
    private readonly _uuidGenerator = UuidGenerator.instance;

    #customizationBusyModes: string[] = [];
    #customizationProcess?: string;
    #parameterHistory: {
        [key: string]: {
            value: unknown,
            valueString: string
        }
    }[] = [];
    #parameterHistoryCall = false;
    #parameterHistoryForward: {
        [key: string]: {
            value: unknown,
            valueString: string
        }
    }[] = [];
    private _automaticSceneUpdate: boolean = true;
    private _closeOnFailure: () => Promise<void> = async () => { };
    private _closed: boolean = false;
    private _customizeOnParameterChange: boolean = false;
    private _dataCache: {
        [key: string]: Promise<HttpResponse<unknown>>
    } = {};
    private _excludeViewports: string[] = [];
    private _headers = {
        'X-ShapeDiver-Origin': (SystemInfo.instance).origin,
        'X-ShapeDiver-SessionEngineId': this._sessionEngineId,
        'X-ShapeDiver-BuildVersion': '',
        'X-ShapeDiver-BuildDate': ''
    };
    private _initialized: boolean = false;
    private _jwtToken?: string;
    private _modelId?: string;
    private _node: ITreeNode;
    private _refreshJwtToken?: () => Promise<string>;
    private _responseDto?: ShapeDiverResponseDto;
    private _retryCounter = 0;
    private _sdk!: ShapeDiverSdk;
    private _sessionId?: string;
    private _updateCallback: ((newNode: ITreeNode, oldNode: ITreeNode) => void) | null = null;
    private _viewerSettings?: object;
    private _viewerSettingsVersion: string = latestVersion;
    private _viewerSettingsVersionBackend: string = latestVersion;

    // #endregion Properties (44)

    // #region Constructors (1)

    /**
     * Can be use to initialize a session with the ticket/guid and modelViewUrl and returns a scene graph node with the result.
     * Can be use to customize the session with updated parameters to get the updated scene graph node.
     */
    constructor(properties: { id: string, ticket?: string, guid?: string, modelViewUrl: string, buildVersion: string, buildDate: string, jwtToken?: string, excludeViewports?: string[] }) {
        this._id = properties.id;
        this._node = new TreeNode(properties.id);
        this._guid = properties.guid;
        this._ticket = properties.ticket;
        this._modelViewUrl = properties.modelViewUrl;
        this._excludeViewports = properties.excludeViewports || [];
        this._jwtToken = properties.jwtToken;
        this._headers['X-ShapeDiver-BuildDate'] = properties.buildDate;
        this._headers['X-ShapeDiver-BuildVersion'] = properties.buildVersion;
        this._outputLoader = new OutputLoader(this);

        try {
            this._sdk = create(this._modelViewUrl, this._jwtToken);
            this._sdk.setConfigurationValue(ShapeDiverSdkConfigType.REQUEST_HEADERS, this._headers);
        } catch (e) {
            throw this._httpClient.convertError(e);
        }
    }

    // #endregion Constructors (1)

    // #region Public Accessors (25)

    public get automaticSceneUpdate(): boolean {
        return this._automaticSceneUpdate;
    }

    public set automaticSceneUpdate(value: boolean) {
        this._automaticSceneUpdate = value;
        value && this._closed === false ? this.addToSceneTree(this._node) : this.removeFromSceneTree(this._node);
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

    public get guid(): string | undefined {
        return this._guid;
    }

    public get id(): string {
        return this._id;
    }

    public get initialized(): boolean {
        return this._initialized;
    }

    public get jwtToken(): string | undefined {
        return this._jwtToken;
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

    public get parameters(): { [key: string]: IParameter<unknown>; } {
        return this._parameters;
    }

    public get refreshJwtToken(): (() => Promise<string>) | undefined {
        return this._refreshJwtToken;
    }

    public set refreshJwtToken(value: (() => Promise<string>) | undefined) {
        this._refreshJwtToken = value;
    }

    public get settingsEngine(): SettingsEngine {
        return this._settingsEngine;
    }

    public get ticket(): string | undefined {
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

    // #endregion Public Accessors (25)

    // #region Public Methods (27)

    public applySettings(response: ShapeDiverResponseDto, sections?: ISettingsSections) {
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
            sections.viewport = { ar: false, scene: false, camera: false, light: false, environment: false, general: false, postprocessing: false };

        let config: object;
        if ((<ShapeDiverResponseDto>response).viewer !== undefined) {
            config = (<ShapeDiverResponseDto>response).viewer!.config;
        } else {
            throw new ShapeDiverViewerSettingsError('Session.applySettings: No config object available.');
        }

        try {
            validate(config);
        } catch (e) {
            throw new ShapeDiverViewerSettingsError('Session.applySettings: Was not able to validate config object.');
        }

        const settings = <ISettings>convert(config, latestVersion);

        const exportMappingUid: { [key: string]: string | undefined } = {};
        if (sections.session.export.displayname || sections.session.export.order || sections.session.export.hidden)
            if (response.exports)
                for (const exportId in response.exports)
                    if (response.exports[exportId].uid !== undefined)
                        exportMappingUid[response.exports[exportId].uid!] = exportId;

        const currentSettings = this._settingsEngine.settings;

        // apply parameter settings
        if (sections.session.parameter.displayname || sections.session.parameter.order || sections.session.parameter.hidden || sections.session.parameter.value) {
            for (const p in this.parameters) {
                if (settings.session[p]) {
                    if (sections.session.parameter.displayname) this.parameters[p].displayname = settings.session[p].displayname;
                    if (sections.session.parameter.order) this.parameters[p].order = settings.session[p].order;
                    if (sections.session.parameter.hidden) this.parameters[p].hidden = settings.session[p].hidden || false;
                }

                if (response.parameters && response.parameters[p] && !((this.parameters[p] instanceof FileParameter) || this.parameters[p].type.startsWith('s'))) {
                    if (sections.session.parameter.value) this.parameters[p].value = response.parameters[p].defval !== undefined ? response.parameters[p].defval : this.parameters[p].value;
                }
            }
        }

        // apply export settings
        if (sections.session.export.displayname || sections.session.export.order || sections.session.export.hidden) {
            for (const p in this.exports) {
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
            currentSettings.environmentGeometry.groundPlaneShadowColor = settings.environmentGeometry.groundPlaneShadowColor;
            currentSettings.environmentGeometry.groundPlaneShadowVisibility = settings.environmentGeometry.groundPlaneShadowVisibility;

            currentSettings.rendering.shadows = settings.rendering.shadows;
            currentSettings.rendering.softShadows = settings.rendering.softShadows;

            currentSettings.rendering.automaticColorAdjustment = settings.rendering.automaticColorAdjustment;
            currentSettings.rendering.textureEncoding = settings.rendering.textureEncoding;
            currentSettings.rendering.outputEncoding = settings.rendering.outputEncoding;
            currentSettings.rendering.physicallyCorrectLights = settings.rendering.physicallyCorrectLights;
            currentSettings.rendering.toneMapping = settings.rendering.toneMapping;
            currentSettings.rendering.toneMappingExposure = settings.rendering.toneMappingExposure;
        }

        if (sections.viewport.general) {
            currentSettings.general.defaultMaterialColor = settings.general.defaultMaterialColor;
            currentSettings.general.commitParameters = settings.general.commitParameters;
            currentSettings.general.pointSize = settings.general.pointSize;
        }

        // apply postprocessing settings
        if (sections.viewport.postprocessing)
            currentSettings.postprocessing = settings.postprocessing;

        // apply environment settings
        if (sections.viewport.environment) {
            currentSettings.environment.clearAlpha = settings.environment.clearAlpha;
            currentSettings.environment.clearColor = settings.environment.clearColor;
            currentSettings.environment.map = settings.environment.map;
            currentSettings.environment.mapAsBackground = settings.environment.mapAsBackground;
            currentSettings.environment.rotation = settings.environment.rotation;
            currentSettings.environment.blurriness = settings.environment.blurriness;
            currentSettings.environment.intensity = settings.environment.intensity;
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

    public cancelCustomization() {
        if (this.#customizationProcess)
            this.removeBusyMode(this.#customizationProcess);

        for (const busyId of this.#customizationBusyModes) {
            for (const r in this._stateEngine.renderingEngines) {
                if (this._stateEngine.renderingEngines[r].busy.includes(busyId))
                    this._stateEngine.renderingEngines[r].busy.splice(this._stateEngine.renderingEngines[r].busy.indexOf(busyId), 1);
            }
        }

        this.#customizationBusyModes = [];
        this.#customizationProcess = undefined;
    }

    public async close(retry = false): Promise<void> {
        this.checkAvailability('close');

        try {
            this._httpClient.removeDataLoading(this._sessionId!);
            await this._sdk.session.close(this._sessionId!);
            if (this._automaticSceneUpdate) this.removeFromSceneTree(this._node);

            this._closed = true;
        } catch (e) {
            await this.handleError(e, retry);
            return await this.close(true);
        }
    }

    /**
     * Customizes the session with updated parameters to get the updated scene graph node.
     * 
     * @param parameters the parameter set to update the session
     * @returns promise with a scene graph node
     */
    public async customize(force: boolean = false, waitForViewportUpdate: boolean = false): Promise<ITreeNode> {
        const eventId = this._uuidGenerator.create();
        const customizationId = this._uuidGenerator.create();
        try {
            // we check if something changed
            if (force === false) {
                let changes = false;
                for (const parameterId in this.parameters)
                    if (this.parameters[parameterId].sessionValue !== this.parameters[parameterId].value)
                        changes = true;
                if (changes === false)
                    return this.node;
            }

            const eventStart: ITaskEvent = { type: TASK_TYPE.SESSION_CUSTOMIZATION, id: eventId, progress: 0, data: { sessionId: this.id }, status: 'Customizing session' };
            this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_START, eventStart);

            const oldNode = this.node;
            this.#customizationProcess = customizationId;

            this._logger.debugLow(`Session(${this.id}).customize: Customizing session.`);

            this.addBusyMode(customizationId);

            const eventFileUpload: ITaskEvent = { type: TASK_TYPE.SESSION_CUSTOMIZATION, id: eventId, progress: 0.1, data: { sessionId: this.id }, status: 'Uploading file parameters' };
            this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_PROCESS, eventFileUpload);

            const fileParameterIds: { [key: string]: string } = {};
            // load file parameter first
            for (const parameterId in this.parameters) {
                if (this.parameters[parameterId] instanceof FileParameter) {
                    fileParameterIds[parameterId] = await (<IFileParameter>this.parameters[parameterId]).upload();

                    // OPTION TO SKIP - PART 1a
                    const cancelResult = this.cancelProcess(customizationId, eventId, TASK_TYPE.SESSION_CUSTOMIZATION, 1, { sessionId: this.id });
                    if (cancelResult) return cancelResult;
                }
            }

            // OPTION TO SKIP - PART 1b
            const cancelResult = this.cancelProcess(customizationId, eventId, TASK_TYPE.SESSION_CUSTOMIZATION, 1, { sessionId: this.id });
            if (cancelResult) return cancelResult;

            // assign the uploaded parameters
            for (const parameterId in fileParameterIds)
                this.parameters[parameterId].value = fileParameterIds[parameterId];

            const parameterSet: {
                [key: string]: {
                    value: unknown,
                    valueString: string
                }
            } = {};

            // create a set of the current validated parameter values
            for (const parameterId in this.parameters) {
                parameterSet[parameterId] = {
                    value: this.parameters[parameterId].value,
                    valueString: this.parameters[parameterId].stringify()
                };
            }

            // update the session engine parameter values if everything succeeded
            for (const parameterId in this.parameters)
                this.parameterValues[parameterId] = parameterSet[parameterId].valueString;
            this._logger.info(`Session(${this.id}).customize: Customizing session with parameters ${JSON.stringify(this.parameterValues)}.`);

            const eventRequest: ITaskEvent = { type: TASK_TYPE.SESSION_CUSTOMIZATION, id: eventId, progress: 0.1, data: { sessionId: this.id }, status: 'Sending customization request' };
            this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_PROCESS, eventRequest);

            const oldOutputVersions = this._outputLoader.getCurrentOutputVersions();

            const newNode = await this.customizeInternal(() => this.#customizationProcess !== customizationId, {
                eventId,
                type: TASK_TYPE.SESSION_CUSTOMIZATION,
                progressRange: {
                    min: 0.1,
                    max: 0.9
                },
                data: { sessionId: this.id }
            });

            // OPTION TO SKIP - PART 2
            const cancelResult2 = this.cancelProcess(customizationId, eventId, TASK_TYPE.SESSION_CUSTOMIZATION, 1, { sessionId: this.id });
            if (cancelResult2) return cancelResult2;

            const newOutputVersions = this._outputLoader.getCurrentOutputVersions();

            const eventSceneUpdate: ITaskEvent = { type: TASK_TYPE.SESSION_CUSTOMIZATION, id: eventId, progress: 0.9, data: { sessionId: this.id }, status: 'Updating scene' };
            this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_PROCESS, eventSceneUpdate);

            // call the update callbacks
            if (waitForViewportUpdate === false) {
                for (const outputId in this.outputs) {
                    if (oldOutputVersions[outputId] !== newOutputVersions[outputId]) {
                        this._eventEngine.emitEvent(EVENTTYPE.OUTPUT.OUTPUT_UPDATED, <IOutputEvent>{
                            outputId: outputId,
                            outputVersion: newOutputVersions[outputId],
                            newNode: newNode.children.find(c => c.name === outputId)!,
                            oldNode: oldNode.children.find(c => c.name === outputId)!
                        });
                    }
                }

                await this.waitForUpdateCallbacks(newOutputVersions, oldOutputVersions, newNode, oldNode);

                const cancelResult = this.cancelProcess(customizationId, eventId, TASK_TYPE.SESSION_CUSTOMIZATION, 1, { sessionId: this.id });
                if (cancelResult) return cancelResult;
            }

            // if this is not a call by the goBack or goForward functions, add the parameter values to the history and delete the forward history
            if (!this.#parameterHistoryCall) {
                this.#parameterHistory.push(parameterSet);
                this.#parameterHistoryForward = [];
            }

            if (this.automaticSceneUpdate) this.removeFromSceneTree(this.node);
            this._node = newNode;
            if (this.automaticSceneUpdate && this._closed === false) this.addToSceneTree(this.node);

            this._logger.debug(`Session(${this.id}).customize: Customization request finished, updating geometry.`);

            // set the session values to the current ones in all parameters
            for (const parameterId in this.parameters)
                (<unknown>this.parameters[parameterId].sessionValue) = parameterSet[parameterId].value;

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

            this.removeBusyMode(customizationId);

            this._logger.debug(`Session(${this.id}).customize: Session customized.`);

            this._eventEngine.emitEvent(EVENTTYPE.SESSION.SESSION_CUSTOMIZED, { sessionId: this.id });

            const eventEnd: ITaskEvent = { type: TASK_TYPE.SESSION_CUSTOMIZATION, id: eventId, progress: 1, data: { sessionId: this.id }, status: 'Session customized' };
            this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_END, eventEnd);

            // update the viewports
            if (waitForViewportUpdate) {
                for (const r in this._stateEngine.renderingEngines)
                    if (!this.excludeViewports.includes(this._stateEngine.renderingEngines[r].id))
                        this._stateEngine.renderingEngines[r].update(`SessionEngine(${this.id}).customize`);

                for (const outputId in this.outputs) {
                    if (oldOutputVersions[outputId] !== newOutputVersions[outputId]) {
                        this._eventEngine.emitEvent(EVENTTYPE.OUTPUT.OUTPUT_UPDATED, <IOutputEvent>{
                            outputId: outputId,
                            outputVersion: newOutputVersions[outputId],
                            newNode: newNode.children.find(c => c.name === outputId)!,
                            oldNode: oldNode.children.find(c => c.name === outputId)!
                        });
                    }
                }

                // call the update callbacks
                await this.waitForUpdateCallbacks(newOutputVersions, oldOutputVersions, newNode, oldNode);

                const cancelResult = this.cancelProcess(customizationId, eventId, TASK_TYPE.SESSION_CUSTOMIZATION, 1, { sessionId: this.id });
                if (cancelResult) return cancelResult;
            }

            if (!waitForViewportUpdate) {
                setTimeout(() => {
                    for (const r in this._stateEngine.renderingEngines)
                        if (!this.excludeViewports.includes(this._stateEngine.renderingEngines[r].id))
                            this._stateEngine.renderingEngines[r].update(`SessionEngine(${this.id}).customize`);
                }, 0);
            }

            return this.node;
        } catch (e) {
            const eventCancel: ITaskEvent = { type: TASK_TYPE.SESSION_CUSTOMIZATION, id: eventId, progress: 1, data: { sessionId: this.id }, status: 'Session customization failed' };
            this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_CANCEL, eventCancel);

            this.removeBusyMode(customizationId);

            throw this._httpClient.convertError(e);
        }
    }

    public async customizeParallel(parameterValues: { [key: string]: string }, loadOutputs = true): Promise<ISessionTreeNode | ShapeDiverResponseDto> {
        const eventId = this._uuidGenerator.create();

        const eventStart: ITaskEvent = { type: TASK_TYPE.SESSION_CUSTOMIZATION, id: eventId, progress: 0, data: { sessionId: this.id }, status: 'Customizing session' };
        this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_START, eventStart);

        const parameterSet: {
            [key: string]: string
        } = {};

        // create a set of the current validated parameter values
        for (const parameterId in this.parameters)
            parameterSet[parameterId] = parameterValues[parameterId] !== undefined ? (' ' + parameterValues[parameterId]).slice(1) : this.parameters[parameterId].stringify();

        const result = await this.customizeSession(parameterSet, () => false, {
            eventId,
            type: TASK_TYPE.SESSION_CUSTOMIZATION,
            progressRange: {
                min: 0.0,
                max: 1
            },
            data: { sessionId: this.id }
        }, true, loadOutputs);

        if (result instanceof SessionTreeNode)
            result.excludeViewports = JSON.parse(JSON.stringify(this._excludeViewports));

        const eventEnd: ITaskEvent = { type: TASK_TYPE.SESSION_CUSTOMIZATION, id: eventId, progress: 1, data: { sessionId: this.id }, status: 'Session customized' };
        this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_END, eventEnd);
        return result;
    }

    public async goBack(): Promise<ITreeNode> {
        if (!this.canGoBack()) {
            this._logger.debug(`Session(${this.id}).goBack: Cannot go further back.`);
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
            this._logger.debug(`Session(${this.id}).goForward: Cannot go further forward.`);
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
        if (this._initialized === true)
            throw new ShapeDiverViewerSessionError('Session.init: Session already initialized.');

        try {
            this._performanceEvaluator.startSection('sessionResponse');

            const parameterSet: { [key: string]: string } = {};
            // the slice here is done as a way for deep copying the string values
            for (const parameterNameOrId in parameterValues)
                parameterSet[parameterNameOrId] = (' ' + parameterValues[parameterNameOrId]).slice(1);

            if (this._ticket) {
                this._responseDto = await this._sdk.session.init(this._ticket, parameterSet);
            } else if (this._guid) {
                this._responseDto = await this._sdk.session.initForModel(this._guid, parameterSet);
            } else {
                // we should never get here
                throw new ShapeDiverViewerSessionError('Session.init: Initialization of session failed. Neither a ticket nor a guid are available.');
            }
            this._performanceEvaluator.endSection('sessionResponse');

            this._viewerSettings = this._responseDto.viewer?.config;
            this._viewerSettingsVersionBackend = this._responseDto.viewerSettingsVersion || latestVersion;
            this._sessionId = this._responseDto.sessionId;
            this._modelId = this._responseDto.model?.id;

            this._httpClient.addDataLoading(this._sessionId!, {
                getAsset: this._sdk.asset.getAsset.bind(this._sdk.asset),
                downloadTexture: this._sdk.asset.downloadImage.bind(this._sdk.asset),
            });

            this._settingsEngine.loadSettings(this._viewerSettings);

            if (!this._sessionId)
                throw new ShapeDiverViewerSessionError('Session.init: Initialization of session failed. ResponseDto did not have a sessionId.');
            if (!this._modelId)
                throw new ShapeDiverViewerSessionError('Session.init: Initialization of session failed. ResponseDto did not have a model.id.');

            this.updateResponseDto(this._responseDto, parameterSet);
            this._initialized = true;
        } catch (e) {
            await this.handleError(e, retry);
            return await this.init(parameterValues, true);
        }
    }

    public async loadCachedOutputsParallel(outputMapping: { [key: string]: string }, taskEventInfo?: OutputLoaderTaskEventInfo, retry = false): Promise<{ [key: string]: ITreeNode | undefined }> {
        this.checkAvailability();
        // if there is already task event info, use it
        // this happens after a retry
        const eventId = taskEventInfo ? taskEventInfo.eventId : this._uuidGenerator.create();
        const eventType = taskEventInfo ? taskEventInfo.type : TASK_TYPE.SESSION_OUTPUTS_LOADING;
        const eventData = taskEventInfo ? taskEventInfo.data : { sessionId: this.id };

        taskEventInfo = taskEventInfo ? taskEventInfo : {
            eventId,
            type: eventType,
            progressRange: {
                min: 0,
                max: 1
            },
            data: eventData
        };

        try {
            // send start event if this function was called initially
            if (!taskEventInfo) {
                const eventStart: ITaskEvent = { type: eventType, id: eventId, progress: 0, data: eventData, status: 'Loading cached outputs' };
                this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_START, eventStart);
            }

            // get the cached outputs
            const responseDto = await this._sdk.output.getCache(this._sessionId!, outputMapping);

            // create atomic output api objects for them
            const outputs: {
                [key: string]: IOutput;
            } = {};
            for (const outputId in responseDto.outputs) {
                responseDto.outputs[outputId].id = outputId;
                outputs[outputId] = new Output(<ShapeDiverResponseOutput>responseDto.outputs[outputId], this);
            }

            // process the output data
            const node = await this._outputLoader.loadOutputs(this._responseDto!.model?.name || 'model', outputs, {}, taskEventInfo, false);

            // send the end event once done
            const eventEnd: ITaskEvent = { type: eventType, id: eventId, progress: 1, data: eventData, status: 'Loaded cached outputs' };
            this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_END, eventEnd);

            // create a mapping with a dictionary for the id of the outputs
            const outputNodeMapping: { [key: string]: ITreeNode | undefined } = {};
            for (const outputId in outputMapping)
                outputNodeMapping[outputId] = node.children.find(n => n.name === outputId);

            return outputNodeMapping;
        }
        catch (e) {
            await this.handleError(e, retry);
            return await this.loadCachedOutputsParallel(outputMapping, taskEventInfo, true);
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
    public async loadOutputs(cancelRequest: () => boolean = () => false, taskEventInfo: OutputLoaderTaskEventInfo, retry = false): Promise<ISessionTreeNode> {
        this.checkAvailability();

        const o = Object.assign({}, this._outputs);
        const of = Object.assign({}, this._outputsFreeze);
        try {
            const node = await this._outputLoader.loadOutputs(this._responseDto!.model?.name || 'model', o, of, taskEventInfo);
            node.data.push(new SessionData(this._responseDto!));
            if (cancelRequest()) return node;
            node.excludeViewports = JSON.parse(JSON.stringify(this._excludeViewports));
            return node;
        }
        catch (e) {
            if (e instanceof OutputDelayException) {
                await this.timeout(e.delay);
            } else {
                await this.handleError(e, retry);
                if (cancelRequest()) return new SessionTreeNode();
                return await this.loadOutputs(cancelRequest, taskEventInfo, true);
            }

            if (cancelRequest()) return new SessionTreeNode();
            const outputMapping: { [key: string]: string } = {};
            for (const output in o)
                outputMapping[output] = o[output].version;

            try {
                const responseDto = await this._sdk.output.getCache(this._sessionId!, outputMapping);
                if (cancelRequest()) return new SessionTreeNode();
                this.updateResponseDto(responseDto);
                return await this.loadOutputs(cancelRequest, taskEventInfo);
            } catch (e) {
                await this.handleError(e, retry);
                if (cancelRequest()) return new SessionTreeNode();
                return await this.loadOutputs(cancelRequest, taskEventInfo, true);
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
    public async loadOutputsParallel(responseDto: ShapeDiverResponseDto, cancelRequest: () => boolean = () => false, taskEventInfo: OutputLoaderTaskEventInfo, retry = false): Promise<ISessionTreeNode> {
        this.checkAvailability();

        const outputs: {
            [key: string]: IOutput;
        } = {};
        const outputsFreeze: {
            [key: string]: boolean;
        } = {};

        for (const outputId in responseDto.outputs) {
            responseDto.outputs[outputId].id = outputId;
            if (this.outputsFreeze[outputId] === undefined) outputsFreeze[outputId] = false;
            outputs[outputId] = new Output(<ShapeDiverResponseOutput>responseDto.outputs[outputId], this);
        }

        try {
            const node = await this._outputLoader.loadOutputs(this._responseDto!.model?.name || 'model', outputs, outputsFreeze, taskEventInfo);
            node.data.push(new SessionData(responseDto));
            return node;
        }
        catch (e) {
            if (e instanceof OutputDelayException) {
                await this.timeout(e.delay);
            } else {
                await this.handleError(e, retry);
                if (cancelRequest()) return new SessionTreeNode();
                return await this.loadOutputsParallel(responseDto, cancelRequest, taskEventInfo, true);
            }

            if (cancelRequest()) return new SessionTreeNode();
            const outputMapping: { [key: string]: string } = {};
            for (const output in outputs)
                outputMapping[output] = outputs[output].version;

            try {
                const responseDto = await this._sdk.output.getCache(this._sessionId!, outputMapping);
                if (cancelRequest()) return new SessionTreeNode();
                this.updateResponseDto(responseDto);
                return await this.loadOutputsParallel(responseDto, cancelRequest, taskEventInfo);
            } catch (e) {
                await this.handleError(e, retry);
                if (cancelRequest()) return new SessionTreeNode();
                return await this.loadOutputsParallel(responseDto, cancelRequest, taskEventInfo, true);
            }
        }
    }

    public async requestExport(exportId: string, parameters: { [key: string]: string }, maxWaitTime: number, retry = false): Promise<ShapeDiverResponseExport> {
        this.checkAvailability('export');
        try {
            const requestParameterSet = this.cleanExportParameters(parameters);
            const responseDto = await this._sdk.utils.submitAndWaitForExport(this._sdk, this._sessionId!, { exports: { id: exportId }, parameters: requestParameterSet }, maxWaitTime);
            this.updateResponseDto(responseDto);
            return this.exports[exportId];
        } catch (e) {
            await this.handleError(e, retry);
            return await this.requestExport(exportId, parameters, maxWaitTime, true);
        }
    }

    public async requestExports(body: ShapeDiverRequestExport, maxWaitMsec?: number, retry = false): Promise<ShapeDiverResponseDto> {
        this.checkAvailability('export');
        try {
            const requestParameterSet = this.cleanExportParameters(body.parameters);
            const responseDto = await this._sdk.utils.submitAndWaitForExport(this._sdk, this._sessionId!, { exports: body.exports, parameters: requestParameterSet, outputs: body.outputs, max_wait_time: body.max_wait_time }, maxWaitMsec);
            this.updateResponseDto(responseDto);
            return responseDto;
        } catch (e) {
            await this.handleError(e, retry);
            return await this.requestExports(body, maxWaitMsec, true);
        }
    }

    public resetSettings(sections?: ISettingsSections): void {
        if (!this._responseDto)
            throw new ShapeDiverViewerSessionError('Session.resetSettings: responseDto not available.');

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
            sections.viewport = { ar: true, scene: true, camera: true, light: true, environment: true, general: true, postprocessing: true };

        return this.applySettings(this._responseDto, sections);
    }

    public async saveDefaultParameterValues(): Promise<boolean> {
        this._logger.debugLow(`Session(${this.id}).saveDefaultParameters: Saving default parameters.`);
        const response = await this.saveDefaultParameters();
        if (response) {
            this._logger.debug(`Session(${this.id}).saveDefaultParameters: Saved default parameters.`);
        } else {
            throw new ShapeDiverViewerSessionError(`Session(${this.id}).saveDefaultParameters: Could not save default parameters.`);
        }
        return response;
    }

    public async saveDefaultParameters(retry = false): Promise<boolean> {
        this.checkAvailability('defaultparam', true);
        try {
            await this._sdk.model.setDefaultParams(this._modelId!, this._parameterValues);
            return true;
        } catch (e) {
            await this.handleError(e, retry);
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
            await this.handleError(e, retry);
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
            await this.handleError(e, retry);
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
            await this.handleError(e, retry);
            return await this.saveParameterProperties(parameters, true);
        }
    }

    public async saveSettings(json: unknown, retry = false): Promise<boolean> {
        this.checkAvailability('configure', true);

        try {
            validate(json, <versions>this._viewerSettingsVersion);

            // if viewer settings version is higher than backend settings version
            // convert to backend settings version
            if (+this._viewerSettingsVersion > +this._viewerSettingsVersionBackend)
                json = convert(json, <versions>this._viewerSettingsVersionBackend);
        } catch (e) {
            throw new ShapeDiverViewerSettingsError('Session.saveSettings: Settings could not be validated. ' + (<Error>e).message, <Error>e);
        }

        try {
            await this._sdk.model.updateConfig(this._modelId!, json as ShapeDiverRequestConfigure);
            return true;
        } catch (e) {
            await this.handleError(e, retry);
            return await this.saveSettings(json, true);
        }
    }

    public async saveUiProperties(saveInSettings: boolean = true): Promise<boolean> {
        this._logger.debugLow(`Session(${this.id}).saveSessionProperties: Saving session properties.`);

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
        for (const p in this.parameters) {
            properties[p] = {
                displayname: this.parameters[p].displayname !== undefined ? this.parameters[p].displayname! : '',
                hidden: this.parameters[p].hidden !== undefined ? this.parameters[p].hidden : false,
                order: this.parameters[p].order !== undefined ? this.parameters[p].order! : 0,
                tooltip: this.parameters[p].tooltip !== undefined ? this.parameters[p].tooltip! : '',
            };
        }
        const responseP = Object.values(properties).length !== 0 ? await this.saveParameterProperties(properties) : true;

        properties = {};
        for (const e in this.exports) {
            properties[e] = {
                displayname: this.exports[e].displayname !== undefined ? this.exports[e].displayname! : '',
                hidden: this.exports[e].hidden !== undefined ? this.exports[e].hidden : false,
                order: this.exports[e].order !== undefined ? this.exports[e].order! : 0,
                tooltip: this.exports[e].tooltip !== undefined ? this.exports[e].tooltip! : '',
            };
        }
        const responseE = Object.values(properties).length !== 0 ? await this.saveExportProperties(properties) : true;

        properties = {};
        for (const o in this.outputs) {
            properties[o] = {
                displayname: this.outputs[o].displayname !== undefined ? this.outputs[o].displayname! : '',
                hidden: this.outputs[o].hidden !== undefined ? this.outputs[o].hidden : false,
                order: this.outputs[o].order !== undefined ? this.outputs[o].order! : 0,
                tooltip: this.outputs[o].tooltip !== undefined ? this.outputs[o].tooltip! : '',
            };
        }
        const responseO = Object.values(properties).length !== 0 ? await this.saveOutputProperties(properties) : true;

        // save partial settings
        const response = saveInSettings ? await this.saveSettings(this._settingsEngine.settings) : true;

        if (response && responseP && responseO && responseE) {
            this._logger.debug(`Session(${this.id}).saveSessionProperties: Saved session properties.`);
        } else {
            this._logger.warn(`Session(${this.id}).saveSessionProperties: Could not save session properties.`);
        }
        return response && responseP && responseO && responseE;
    }

    public async setJwtToken(value: string) {
        this.checkAvailability();

        this._jwtToken = value;
        try {
            this._sdk.setConfigurationValue(ShapeDiverSdkConfigType.JWT_TOKEN, value);
            const responseDto = await this._sdk.session.default(this._sessionId!);
            if (this._responseDto) this._responseDto.actions = responseDto.actions;
        } catch (e) {
            throw this._httpClient.convertError(e);
        }
    }

    public async updateOutputs(taskEventInfo?: OutputLoaderTaskEventInfo, waitForViewportUpdate: boolean = false): Promise<ITreeNode> {
        const eventId = taskEventInfo ? taskEventInfo.eventId : this._uuidGenerator.create();
        const eventType = taskEventInfo ? taskEventInfo.type : TASK_TYPE.SESSION_OUTPUTS_UPDATE;
        const eventData = taskEventInfo ? taskEventInfo.data : { sessionId: this.id };

        if (!taskEventInfo) {
            const eventStart: ITaskEvent = { type: eventType, id: eventId, progress: 0, data: eventData, status: 'Updating outputs' };
            this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_START, eventStart);
        }

        const customizationId = this._uuidGenerator.create();
        const oldNode = this.node;
        this.#customizationProcess = customizationId;

        this._logger.debugLow(`Session(${this.id}).updateOutputs: Updating Outputs.`);

        this.addBusyMode(customizationId);

        const eventRequest: ITaskEvent = { type: eventType, id: eventId, progress: taskEventInfo ? (taskEventInfo.progressRange.max - taskEventInfo.progressRange.min) * 0.1 + taskEventInfo.progressRange.min : 0.1, data: eventData, status: 'Loading outputs' };
        this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_PROCESS, eventRequest);

        const oldOutputVersions = this._outputLoader.getCurrentOutputVersions();

        const newNode = await this.loadOutputs(() => this.#customizationProcess !== customizationId, {
            eventId,
            type: eventType,
            progressRange: {
                min: taskEventInfo ? (taskEventInfo.progressRange.max - taskEventInfo.progressRange.min) * 0.1 + taskEventInfo.progressRange.min : 0.1,
                max: taskEventInfo ? (taskEventInfo.progressRange.max - taskEventInfo.progressRange.min) * 0.9 + taskEventInfo.progressRange.min : 0.9
            },
            data: eventData
        });

        const newOutputVersions = this._outputLoader.getCurrentOutputVersions();

        const eventSceneUpdate: ITaskEvent = { type: eventType, id: eventId, progress: taskEventInfo ? (taskEventInfo.progressRange.max - taskEventInfo.progressRange.min) * 0.9 + taskEventInfo.progressRange.min : 0.9, data: eventData, status: 'Updating scene' };
        this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_PROCESS, eventSceneUpdate);

        // OPTION TO SKIP - PART 1
        const cancelResult = this.cancelProcess(customizationId, eventId, eventType, taskEventInfo ? (taskEventInfo.progressRange.max - taskEventInfo.progressRange.min) * 1 + taskEventInfo.progressRange.min : 1, eventData, newNode);
        if (cancelResult) return cancelResult;

        // call the update callbacks
        if (waitForViewportUpdate === false) {
            for (const outputId in this.outputs) {
                if (oldOutputVersions[outputId] !== newOutputVersions[outputId]) {
                    this._eventEngine.emitEvent(EVENTTYPE.OUTPUT.OUTPUT_UPDATED, {
                        outputId: outputId,
                        outputVersion: newOutputVersions[outputId],
                        newNode: newNode.children.find(c => c.name === outputId)!,
                        oldNode: oldNode.children.find(c => c.name === outputId)!
                    });
                }
            }

            await this.waitForUpdateCallbacks(newOutputVersions, oldOutputVersions, newNode, oldNode);

            // OPTION TO SKIP - PART 2
            const cancelResult = this.cancelProcess(customizationId, eventId, eventType, taskEventInfo ? (taskEventInfo.progressRange.max - taskEventInfo.progressRange.min) * 1 + taskEventInfo.progressRange.min : 1, eventData, newNode);
            if (cancelResult) return cancelResult;
        }

        if (this.automaticSceneUpdate) this.removeFromSceneTree(this.node);
        this._node = newNode;
        if (this.automaticSceneUpdate && this._closed === false) this.addToSceneTree(this.node);

        this._logger.debug(`Session(${this.id}).updateOutputs: Updating outputs finished, updating geometry.`);

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

        this.removeBusyMode(customizationId);

        this._logger.debug(`Session(${this.id}).updateOutputs: Updated outputs.`);

        if (!taskEventInfo) {
            const eventEnd: ITaskEvent = { type: eventType, id: eventId, progress: 1, data: eventData, status: 'Outputs updated' };
            this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_END, eventEnd);
        }

        // update the viewports
        if (waitForViewportUpdate) {
            for (const r in this._stateEngine.renderingEngines)
                if (!this.excludeViewports.includes(this._stateEngine.renderingEngines[r].id))
                    this._stateEngine.renderingEngines[r].update(`SessionEngine(${this.id}).updateOutputs`);

            for (const outputId in this.outputs) {
                if (oldOutputVersions[outputId] !== newOutputVersions[outputId]) {
                    this._eventEngine.emitEvent(EVENTTYPE.OUTPUT.OUTPUT_UPDATED, {
                        outputId: outputId,
                        outputVersion: newOutputVersions[outputId],
                        newNode: newNode.children.find(c => c.name === outputId)!,
                        oldNode: oldNode.children.find(c => c.name === outputId)!
                    });
                }
            }

            await this.waitForUpdateCallbacks(newOutputVersions, oldOutputVersions, newNode, oldNode);

            // OPTION TO SKIP - PART 3
            const cancelResult = this.cancelProcess(customizationId, eventId, eventType, taskEventInfo ? (taskEventInfo.progressRange.max - taskEventInfo.progressRange.min) * 1 + taskEventInfo.progressRange.min : 1, eventData, newNode);
            if (cancelResult) return cancelResult;
        }

        return this.node;
    }

    public async uploadFile(parameterId: string, data: File, type: string, retry = false): Promise<string> {
        this.checkAvailability('file-upload');
        try {
            const responseDto = await this._sdk.file.requestUpload(this._sessionId!, {
                [parameterId]: { size: data.size, format: type }
            });

            if (responseDto && responseDto.asset && responseDto.asset.file && responseDto.asset.file[parameterId]) {
                const fileAsset = responseDto.asset.file[parameterId];
                await this._sdk.utils.upload(fileAsset.href, await data.arrayBuffer(), type);
                return fileAsset.id;
            } else {
                throw new ShapeDiverViewerSessionError('Session.uploadFile: Upload reply has not the required format.');
            }
        } catch (e) {
            await this.handleError(e, retry);
            return await this.uploadFile(parameterId, data, type, true);
        }
    }

    public async uploadGLTF(blob: Blob, conversion: ShapeDiverRequestGltfUploadQueryConversion = ShapeDiverRequestGltfUploadQueryConversion.NONE, retry = false): Promise<ShapeDiverResponseDto> {
        this.checkAvailability('gltf-upload');
        try {
            const responseDto = await this._sdk.gltf.upload(this._sessionId!, await blob.arrayBuffer(), 'model/gltf-binary', conversion);
            if (!responseDto || !responseDto.gltf || !responseDto.gltf.href)
                throw new ShapeDiverViewerSessionError('Session.uploadGLTF: Upload reply has not the required format.');
            return responseDto;
        } catch (e) {
            await this.handleError(e, retry);
            return await this.uploadGLTF(blob, conversion, true);
        }
    }

    // #endregion Public Methods (27)

    // #region Private Methods (15)

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
        for (const p in parameters) {
            sessionProperties[p] = {
                order: parameters[p].order || 0,
                displayname: parameters[p].displayname || '',
                hidden: parameters[p].hidden
            };
        }
        for (const e in exports) {
            sessionProperties[e] = {
                order: exports[e].order || 0,
                displayname: exports[e].displayname || '',
                hidden: exports[e].hidden
            };
        }
        this._settingsEngine.session = sessionProperties;
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
                this._logger.warn(`\nOutput(${outputId}):${warning}`);
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
                this._logger.warn(`\nExport(${exportId}):${warning}`);
        }
    }

    private addBusyMode(busyId: string) {
        for (const r in this._stateEngine.renderingEngines) {
            if (!this.excludeViewports.includes(r)) {
                this._stateEngine.renderingEngines[r].busy.push(busyId);
                this.#customizationBusyModes.push(busyId);
            }
        }
    }

    private addToSceneTree(node: ITreeNode) {
        this._sceneTree.addNode(node);
        this._sceneTree.root.updateVersion();
    }

    private cancelProcess(customizationId: string, eventId: string, eventType: TASK_TYPE, eventProgress: number, eventData: unknown, newNode: ITreeNode = new SessionTreeNode()): ITreeNode | undefined {
        if (this.#customizationProcess !== customizationId) {
            this.removeBusyMode(customizationId);

            const eventCancel: ITaskEvent = {
                type: eventType,
                id: eventId,
                progress: eventProgress,
                data: eventData,
                status: 'The request was exceeded by another customization request'
            };
            this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_CANCEL, eventCancel);
            this._logger.debug(`Session(${this.id}).cancelProcess: The request was was exceeded by another request.`);
            return newNode;
        } else if ((this._closed as boolean) === true) {
            this.removeBusyMode(customizationId);

            this._logger.debug(`Session(${this.id}).cancelProcess: The session was closed during the request.`);

            const eventCancel: ITaskEvent = { type: TASK_TYPE.SESSION_CUSTOMIZATION, id: eventId, progress: 1, data: { sessionId: this.id }, status: 'The session was closed during the request.' };
            this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_CANCEL, eventCancel);
            return new SessionTreeNode();
        }
    }

    private checkAvailability(action?: string, checkForModelId = false) {
        if (!this._responseDto)
            throw new ShapeDiverViewerSessionError('Session.checkAvailability: responseDto not available.');

        if (!this._sessionId)
            throw new ShapeDiverViewerSessionError('Session.checkAvailability: sessionId not available.');

        if (checkForModelId && !this._modelId)
            throw new ShapeDiverViewerSessionError('Session.checkAvailability: modelId not available.');

        if (action && !this._responseDto.actions)
            throw new ShapeDiverViewerSessionError('Session.checkAvailability: actions not available.');

        const responseDtoAction = this._responseDto.actions?.find(a => a.name === action);
        if (action && !responseDtoAction)
            throw new ShapeDiverViewerSessionError(`Session.checkAvailability: action ${action} not available.`);
    }

    private cleanExportParameters(parameters: ShapeDiverRequestCustomization): ShapeDiverRequestCustomization {
        const requestParameterSet: ShapeDiverRequestCustomization = {};

        // first step, we convert all our names and displaynames to ids
        for (const parameterIdOrName in parameters) {
            // we prioritize id, then name and then displayname
            // if there are two parameters with the same name or displayname, we take the one that is found first (no way for us to evaluate which one the user meant)
            const parameterObject = Object.values(this._parameters).find(p => p.id === parameterIdOrName || p.name === parameterIdOrName || p.displayname === parameterIdOrName);

            // in case the key of the key value pair was neither the id, name or displayname, skip
            if (!parameterObject) continue;

            // copy into new dictionary
            requestParameterSet[parameterObject.id] = parameters[parameterIdOrName];
        }

        // seconds step, fill all other parameter values that are currently not set
        const currentParameters = this.parameterValues;
        for (const parameterId in currentParameters) {
            // if already set by input values, skip
            if (requestParameterSet[parameterId] !== undefined) continue;

            // deep copy into new dictionary
            requestParameterSet[parameterId] = (' ' + currentParameters[parameterId]).slice(1);
        }

        return requestParameterSet;
    }

    private async customizeInternal(cancelRequest: () => boolean, taskEventInfo: OutputLoaderTaskEventInfo): Promise<ISessionTreeNode> {
        return this.customizeSession(this._parameterValues, cancelRequest, taskEventInfo) as Promise<ISessionTreeNode>;
    }

    private async customizeSession(parameters: { [key: string]: string }, cancelRequest: () => boolean, taskEventInfo: OutputLoaderTaskEventInfo, parallel = false, loadOutputs = true, retry = false): Promise<ISessionTreeNode | ShapeDiverResponseDto> {
        this.checkAvailability('customize');
        try {
            this._performanceEvaluator.startSection('sessionResponse');
            const responseDto = await this._sdk.utils.submitAndWaitForCustomization(this._sdk, this._sessionId!, parameters);
            this._performanceEvaluator.endSection('sessionResponse');
            if (loadOutputs === true) {
                if (cancelRequest()) return new SessionTreeNode();
                if (parallel === true) {
                    // special case, we load the outputs put don't add them to the scene
                    return this.loadOutputsParallel(responseDto, cancelRequest, taskEventInfo);
                } else {
                    // default case, we load the outputs and return the nodes
                    this.updateResponseDto(responseDto);
                    return this.loadOutputs(cancelRequest, taskEventInfo);
                }
            } else {
                // special case, we don't load the outputs and only return the responseDto
                return responseDto;
            }
        } catch (e) {
            await this.handleError(e, retry);
            if (cancelRequest()) return new SessionTreeNode();
            return await this.customizeSession(parameters, cancelRequest, taskEventInfo, parallel, loadOutputs, true);
        }
    }

    private async handleError(e: ShapeDiverBackendError | ShapeDiverViewerError | Error | unknown, retry = false) {
        if (isGBResponseError(e)) {
            if (e.error === ShapeDiverResponseErrorType.SESSION_GONE_ERROR) {
                // case 1: the session is no longer available
                // we try to re-initialize the session 3 times, if that does not work, we close it

                this._logger.warn('The session has been closed, trying to re-initialize.');
                if (this._sessionId) this._httpClient.removeDataLoading(this._sessionId);

                if (this._retryCounter < 3) {
                    // we retry this 3 times, the `retry` option in the init function is set to true and passed on 
                    this._retryCounter = retry ? this._retryCounter + 1 : 1;
                    this._initialized = false;
                    await this.init(this.parameterValues, true);
                } else {
                    // the retries were exceeded, we close the session
                    this._logger.warn('Tried to retry the connect multiple times, bearer token still not valid. Closing Session.');
                    // eslint-disable-next-line no-empty
                    try { await this._closeOnFailure(); } catch (e) { }
                    throw this._httpClient.convertError(e);
                }
            } else if (e.error === ShapeDiverResponseErrorType.JWT_VALIDATION_ERROR) {
                // if any of the above errors occur, we try to get a new bearer token
                // if we get a new one, we retry 3 times (by requiring new bearer tokens every time)
                if (this._retryCounter < 3) {
                    if (this._refreshJwtToken) {
                        await this.setJwtToken(await this._refreshJwtToken());
                        this._retryCounter = retry ? this._retryCounter + 1 : 1;
                        this._logger.warn('Re-trying with new bearer token.');
                    } else {
                        // no bearer tokens are supplied, we close the session
                        this._logger.warn('No retry possible, no new bearer token was supplied. Closing Session.');
                        // eslint-disable-next-line no-empty
                        try { await this._closeOnFailure(); } catch (e) { }
                        throw this._httpClient.convertError(e);
                    }
                } else {
                    // the retries were exceeded, we close the session
                    this._logger.warn('Tried to retry the connect multiple times, bearer token still not valid. Closing Session.');
                    // eslint-disable-next-line no-empty
                    try { await this._closeOnFailure(); } catch (e) { }
                    throw this._httpClient.convertError(e);
                }
            } else {
                throw this._httpClient.convertError(e);
            }
        } else {
            throw this._httpClient.convertError(e);
        }
    }

    private removeBusyMode(busyId: string) {
        for (const r in this._stateEngine.renderingEngines) {
            if (this._stateEngine.renderingEngines[r].busy.includes(busyId))
                this._stateEngine.renderingEngines[r].busy.splice(this._stateEngine.renderingEngines[r].busy.indexOf(busyId), 1);

            if (this.#customizationBusyModes.includes(busyId))
                this.#customizationBusyModes.splice(this.#customizationBusyModes.indexOf(busyId), 1);
        }
    }

    private removeFromSceneTree(node: ITreeNode) {
        this._sceneTree.removeNode(node);
        this._sceneTree.root.updateVersion();
    }

    /**
     * Returns a promise that resolves after the amount of milliseconds provided.
     * 
     * @param ms the milliseconds
     * @returns promise that resolve after specified milliseconds
     */
    private async timeout(ms: number): Promise<unknown> {
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
            for (const parameterId in responseDto.parameters) {
                this._responseDto.parameters = this._responseDto.parameters || {};
                this._responseDto.parameters[parameterId] = this._responseDto.parameters[parameterId] || responseDto.parameters[parameterId];
            }
        }

        // convert outputs
        if (responseDto.outputs) {
            for (const outputId in responseDto.outputs) {
                this._responseDto.outputs = this._responseDto.outputs || {};
                if ('version' in responseDto.outputs[outputId] || !(this._responseDto.outputs[outputId] && 'version' in this._responseDto.outputs[outputId]))
                    this._responseDto.outputs[outputId] = responseDto.outputs[outputId];
            }
        }

        // convert exports
        if (responseDto.exports) {
            for (const exportId in responseDto.exports) {
                this._responseDto.exports = this._responseDto.exports || {};
                if ('version' in responseDto.exports[exportId] || !(this._responseDto.exports[exportId] && 'version' in this._responseDto.exports[exportId]))
                    this._responseDto.exports[exportId] = responseDto.exports[exportId];
            }
        }

        const parameterSet: {
            [key: string]: {
                value: unknown,
                valueString: string
            }
        } = {};

        for (const parameterId in this._responseDto.parameters) {
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

            // we don't have to do larger restrictions for this as the backend would have already thrown an error if the values were not correct
            if (initialParameters) {
                // check if the id is within the initial parameters
                if (initialParameters[parameterId] !== undefined) {
                    this.parameters[parameterId].value = initialParameters[parameterId];
                }
                // check if the name is within the initial parameters
                else if (initialParameters[this.parameters[parameterId].name] !== undefined) {
                    this.parameters[parameterId].value = initialParameters[this.parameters[parameterId].name];
                }
                // NOTE: At some point the checking may also be done with the displayname, this is the code for it
                // // check if the displayname is within the initial parameters
                // else if(this.parameters[parameterId].displayname && initialParameters[this.parameters[parameterId].displayname!] !== undefined) {
                //     this.parameters[parameterId].value = initialParameters[this.parameters[parameterId].displayname!];
                // }
            }

            parameterSet[parameterId] = {
                value: this.parameters[parameterId].value,
                valueString: this.parameters[parameterId].stringify()
            };

            if (!this.initialized)
                this.parameterValues[parameterId] = parameterSet[parameterId].valueString;
        }

        // store the initialization as the first parameter set in the history
        if (!this.initialized)
            this.#parameterHistory.push(parameterSet);

        for (const exportId in this._responseDto.exports) {
            if (this._responseDto.exports[exportId].type === ShapeDiverResponseExportDefinitionType.EMAIL || this._responseDto.exports[exportId].type === ShapeDiverResponseExportDefinitionType.DOWNLOAD) {
                if (!this.exports[exportId]) {
                    this._responseDto.exports[exportId].id = exportId;
                    this.exports[exportId] = new Export(this._responseDto.exports[exportId], this);
                } else {
                    this.exports[exportId].updateExportDefinition(this._responseDto.exports[exportId]);
                }
            }
        }

        for (const outputId in this._responseDto.outputs) {
            if (!this.outputs[outputId]) {
                this._responseDto.outputs[outputId].id = outputId;
                if (this.outputsFreeze[outputId] === undefined) this.outputsFreeze[outputId] = false;
                this.outputs[outputId] = new Output(<ShapeDiverResponseOutput>this._responseDto.outputs[outputId], this);
            } else {
                this.outputs[outputId].updateOutputDefinition(<ShapeDiverResponseOutput>this._responseDto.outputs[outputId]);
            }
        }
    }

    private async waitForUpdateCallbacks(newOutputVersions: { [key: string]: string }, oldOutputVersions: { [key: string]: string }, newNode: ITreeNode, oldNode: ITreeNode) {
        // call the update callback function on the session
        if (this._updateCallback) await Promise.resolve(this._updateCallback(newNode, oldNode));

        const promises = [];
        // call the update callback functions on the outputs
        for (const outputId in this.outputs) {
            if (oldOutputVersions[outputId] !== newOutputVersions[outputId]) {
                promises.push(
                    this.outputs[outputId].triggerUpdateCallback(
                        newNode.children.find(c => c.name === outputId)!,
                        oldNode.children.find(c => c.name === outputId)!
                    )
                );
            }
        }
        await Promise.all(promises);
    }

    // #endregion Private Methods (15)
}