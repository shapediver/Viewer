import { Tree, TreeNode } from '@shapediver/viewer.shared.node-tree'
import { Session as SessionEngine } from '@shapediver/viewer.session-engine.session-engine'
import { container, injectable } from 'tsyringe'
import {
  EventEngine,
  EVENTTYPE,
  HttpClient,
  InputValidator,
  Logger,
  LOGGINGTOPIC,
  PerformanceEvaluator,
  SettingsEngine,
  ShapeDiverBackendError,
  ShapeDiverViewerError,
  ShapeDiverViewerSessionError,
  StateEngine,
  UuidGenerator,
} from '@shapediver/viewer.shared.services'
import { build_data } from '@shapediver/viewer.shared.build-data'
import { vec3 } from 'gl-matrix'
import { RenderingEngine } from '@shapediver/viewer.rendering-engine-threejs.standard'
import { ISettingsEvent, ITaskEvent, TASKTYPE } from '@shapediver/viewer.shared.types'
import {
  ShapeDiverRequestGltfUploadQueryConversion,
  ShapeDiverResponseModelComputationStatus,
} from '@shapediver/sdk.geometry-api-sdk-v2'

import { Parameter, PARAMETERTYPE } from './Parameter'
import { ISession } from '../../interfaces/session/ISession'
import { Api } from '../Api'
import { IExport } from '../../interfaces/session/IExport'
import { IOutput } from '../../interfaces/session/IOutput'
import { IParameter } from '../../interfaces/session/IParameter'
import { IFileParameter } from '../../interfaces/session/IFileParameter'
import { FileParameter } from './FileParameter'
import { Export } from './Export'
import { Output } from './Output'

@injectable()
export class Session implements ISession {
    // #region Properties (29)

    readonly #api: Api = <Api>container.resolve(Api);
    readonly #eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);
    readonly #exports: { [key: string]: IExport; } = {};
    readonly #httpClient: HttpClient = <HttpClient>container.resolve(HttpClient);
    readonly #id: string;
    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #modelViewUrl: string;
    readonly #outputs: { [key: string]: IOutput; } = {};
    readonly #parameters: { [key: string]: IParameter<any> } = {};
    readonly #performanceEvaluator: PerformanceEvaluator = <PerformanceEvaluator>container.resolve(PerformanceEvaluator);
    readonly #primarySessionRequest: boolean = false;
    readonly #sceneTree: Tree = <Tree>container.resolve(Tree);
    readonly #sessionEngine: SessionEngine;
    readonly #settingsEngine: SettingsEngine = <SettingsEngine>container.resolve(SettingsEngine);
    readonly #stateEngine: StateEngine = <StateEngine>container.resolve(StateEngine);
    readonly #ticket: string;
    readonly #uuidGenerator: UuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);

    #automaticUpdate: boolean = false;
    #commitParameters: boolean = false;
    #commitSettings: boolean = false;
    #customizationProcess!: string;
    #excludeViewers: string[] = [];
    #node: TreeNode;
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
    #primarySession: boolean = false;
    #useSessionSettings: boolean = true;

    // #endregion Properties (29)

    // #region Constructors (1)

    /**
       * @ignore
       */
    constructor(properties: { id: string, ticket: string, modelViewUrl: string, bearerToken?: string, primarySession?: boolean, excludeViewers?: string[] }) {
        try {
            this.#node = new TreeNode(properties.id);
            this.#sessionEngine = new SessionEngine(Object.assign({
                buildDate: build_data.build_date,
                buildVersion: build_data.build_version,
                closeOnFailure: async () => {
                    // this function closes the Session if an error occurred that cannot be solved
                    // case 1: the bearer token is invalid and no new valid bearer token was supplied
                    // case 2: session init failed multiple times
                    this.bearerToken = '';
                    try { await this.#api.closeSession(this.#id, true); } catch (e) { }
                }
            }, properties));

            this.#id = this.#sessionEngine.id;
            this.#ticket = this.#sessionEngine.ticket;
            this.#modelViewUrl = this.#sessionEngine.modelViewUrl;
            this.#excludeViewers = properties.excludeViewers || [];

            this.#primarySessionRequest = properties.primarySession !== false;
            if (this.#stateEngine.primarySession && this.#stateEngine.primarySession.id === this.id) {
                this.#primarySession = true;
                this.#httpClient.addDataLoading(this.#sessionEngine.loadData.bind(this.#sessionEngine))
                this.#logger.debug(LOGGINGTOPIC.SESSION, `Session(${this.id}): This is now the primary session.`);

                this.#stateEngine.sessions[this.id].settingsRegistered.then(() => {
                    this.#commitParameters = this.#settingsEngine.general.commitParameters;
                    this.#commitSettings = this.#settingsEngine.general.commitSettings;

                    // only update the display names, order and hidden properties if the parameters / exports / outputs don't have these properties defined
                    if (this.#useSessionSettings === true) {
                        for (let s in this.#settingsEngine.session) {
                            const temp = this.#settingsEngine.session[s];
                            if (this.parameters[s]) {
                                if (temp.displayname !== undefined) this.parameters[s]!.displayname = temp.displayname;
                                if (temp.order !== undefined) this.parameters[s]!.order = temp.order;
                                if (temp.hidden !== undefined) this.parameters[s]!.hidden = temp.hidden;
                            }
                            if (this.exports[s]) {
                                if (temp.displayname !== undefined) this.exports[s]!.displayname = temp.displayname;
                                if (temp.order !== undefined) this.exports[s]!.order = temp.order;
                                if (temp.hidden !== undefined) this.exports[s]!.hidden = temp.hidden;
                            }
                        }
                    }
                })
            }

            this.#logger.debugLow(LOGGINGTOPIC.SESSION, `Session(${this.id}).constructor: Session api created.`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGINGTOPIC.SESSION, `Session.constructor`, e);
        }
    }

    // #endregion Constructors (1)

    // #region Public Accessors (21)

    public get automaticUpdate(): boolean {
        return this.#automaticUpdate;
    }

    public set automaticUpdate(value: boolean) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.SESSION, `Session(${this.id}).automaticUpdate: Updating automaticUpdate to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.SESSION, `Session(${this.id}).automaticUpdate`, value, 'boolean');
            this.#automaticUpdate = value;
            this.#logger.debug(LOGGINGTOPIC.SESSION, `Session(${this.id}).automaticUpdate: automaticUpdate was set to: ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGINGTOPIC.SESSION, `Session(${this.id}).automaticUpdate`, e);
        }
    }

    public get bearerToken(): string | undefined {
        return this.#sessionEngine.bearerToken;
    }

    public set bearerToken(value: string | undefined) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.SESSION, `Session(${this.id}).bearerToken: Updating BearerToken to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.SESSION, `Session(${this.id}).bearerToken`, value, 'string', false);
            this.#sessionEngine.bearerToken = value;
            this.#logger.debug(LOGGINGTOPIC.SESSION, `Session(${this.id}).bearerToken: bearerToken was set to: ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGINGTOPIC.SESSION, `Session(${this.id}).bearerToken`, e);
        }
    }

    public get canUploadGLTF(): boolean {
        return this.#sessionEngine.canUploadGLTF;
    }

    public get commitParameters(): boolean {
        return this.#commitParameters;
    }

    public set commitParameters(value: boolean) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.SESSION, `Session(${this.id}).commitParameters: Updating CommitParameters to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.SESSION, `Session(${this.id}).commitParameters`, value, 'boolean');
            this.#commitParameters = value;
            this.#logger.debug(LOGGINGTOPIC.SESSION, `Session(${this.id}).commitParameters: commitParameters was set to: ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGINGTOPIC.SESSION, `Session(${this.id}).commitParameters`, e);
        }
    }

    public get commitSettings(): boolean {
        return this.#commitSettings;
    }

    public set commitSettings(value: boolean) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.SESSION, `Session(${this.id}).commitSettings: Updating CommitSettings to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.SESSION, `Session(${this.id}).commitSettings`, value, 'boolean');
            this.#commitSettings = value;
            this.#logger.debug(LOGGINGTOPIC.SESSION, `Session(${this.id}).commitSettings: commitSettings was set to: ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGINGTOPIC.SESSION, `Session(${this.id}).commitSettings`, e);
        }
    }

    public get exports(): { [key: string]: IExport; } {
        return this.#exports;
    }

    public get id(): string {
        return this.#id;
    }

    public get initialized(): boolean {
        return this.#sessionEngine.initialized;
    }

    public get modelViewUrl(): string {
        return this.#modelViewUrl;
    }

    public get node(): TreeNode {
        return this.#node;
    }

    public get outputs(): { [key: string]: IOutput; } {
        return this.#outputs;
    }

    public get parameters(): { [key: string]: IParameter<any>; } {
        return this.#parameters;
    }

    public get primarySession(): boolean {
        return this.#primarySession;
    }

    public get primarySessionRequest(): boolean {
        return this.#primarySessionRequest;
    }

    public get refreshBearerToken(): () => Promise<string> {
        return this.#sessionEngine.refreshBearerToken;
    }

    public set refreshBearerToken(value: () => Promise<string>) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.SESSION, `Session(${this.id}).refreshBearerToken: Updating RefreshBearerToken to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.SESSION, `Session(${this.id}).refreshBearerToken`, value, 'function');
            this.#sessionEngine.refreshBearerToken = value;
            this.#logger.debug(LOGGINGTOPIC.SESSION, `Session(${this.id}).refreshBearerToken: refreshBearerToken was set to: ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGINGTOPIC.SESSION, `Session(${this.id}).refreshBearerToken`, e);
        }
    }

    public get ticket(): string {
        return this.#ticket;
    }

    // #endregion Public Accessors (21)

    // #region Public Methods (21)

    public canGoBack(): boolean {
        // the first entry is always the one from the init call
        // all additional entries can be undone
        return this.#parameterHistory.length > 1;
    }

    public canGoForward(): boolean {
        return this.#parameterHistoryForward.length > 0;
    }

    public async close(): Promise<boolean> {
        try {
            const closeResult = await this.#sessionEngine.close();
            if (this.#api.automaticUpdate) this.#sceneTree.removeNode(this.node);
            this.#api.update();

            if (this.primarySession)
                this.#httpClient.removeDataLoading()

            this.#settingsEngine.reset();
            this.#eventEngine.emitEvent(EVENTTYPE.SESSION.SESSION_CLOSED, { sessionId: this.id });

            if (!closeResult) this.#logger.warn(LOGGINGTOPIC.SESSION, `Session(${this.id}).close: Was not able to close session completely, please disregard this session.`);
            return closeResult;
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGINGTOPIC.SESSION, `Session(${this.id}).close`, e);
        }
    }

    public async customize(): Promise<TreeNode> {
        const eventId = this.#uuidGenerator.create();
        const customizationID = this.#uuidGenerator.create();
        try {
            const eventStart: ITaskEvent = { type: TASKTYPE.SESSION_CUSTOMIZATION, id: eventId, progress: 0, data: { sessionId: this.id }, status: 'Customizing session' };
            this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_START, eventStart);

            const oldNode = this.#node.cloneInstance();
            this.#customizationProcess = customizationID;

            this.#performanceEvaluator.start();
            this.#performanceEvaluator.startSection('init');

            this.#logger.debugLow(LOGGINGTOPIC.SESSION, `Session(${this.id}).customize: Customizing session.`);

            for (let viewerId in this.#api.viewers)
                this.#api.viewers[viewerId].registerBusyMode(customizationID);

            const eventFileUpload: ITaskEvent = { type: TASKTYPE.SESSION_CUSTOMIZATION, id: eventId, progress: 0.1, data: { sessionId: this.id }, status: 'Uploading file parameters' };
            this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_PROCESS, eventFileUpload);

            const fileParameterIds: { [key: string]: string } = {}
            // load file parameter first
            for (const parameterId in this.parameters) {
                if (this.parameters[parameterId] instanceof FileParameter) {
                    fileParameterIds[parameterId] = await (<IFileParameter>this.parameters[parameterId]).upload();

                    // OPTION TO SKIP - PART 1a
                    if (this.#customizationProcess !== customizationID) {
                        this.#performanceEvaluator.endSection('init');
                        this.#performanceEvaluator.end();
                        for (let viewerId in this.#api.viewers)
                            this.#api.viewers[viewerId].deregisterBusyMode(customizationID);
                        this.#logger.debug(LOGGINGTOPIC.SESSION, `Session(${this.id}).customize: Session customization was exceeded by other customization request.`);

                        const eventCancel1a: ITaskEvent = { type: TASKTYPE.SESSION_CUSTOMIZATION, id: eventId, progress: 1, data: { sessionId: this.id }, status: 'Session customization was exceeded by other customization request' };
                        this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_CANCEL, eventCancel1a);
                        return new TreeNode();
                    }
                }
            }

            // OPTION TO SKIP - PART 1b
            if (this.#customizationProcess !== customizationID) {
                this.#performanceEvaluator.endSection('init');
                this.#performanceEvaluator.end();
                for (let viewerId in this.#api.viewers)
                    this.#api.viewers[viewerId].deregisterBusyMode(customizationID);

                const eventCancel1b: ITaskEvent = { type: TASKTYPE.SESSION_CUSTOMIZATION, id: eventId, progress: 1, data: { sessionId: this.id }, status: 'Session customization was exceeded by other customization request' };
                this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_CANCEL, eventCancel1b);
                this.#logger.debug(LOGGINGTOPIC.SESSION, `Session(${this.id}).customize: Session customization was exceeded by other customization request.`);
                return new TreeNode();
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
                this.#sessionEngine.parameterValues[parameterId] = parameterSet[parameterId].valueString;
            this.#logger.info(LOGGINGTOPIC.SESSION, `Session(${this.id}).customize: Customizing session with parameters ${JSON.stringify(this.#sessionEngine.parameterValues)}.`);

            const eventRequest: ITaskEvent = { type: TASKTYPE.SESSION_CUSTOMIZATION, id: eventId, progress: 0.25, data: { sessionId: this.id }, status: 'Sending customization request' };
            this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_PROCESS, eventRequest);

            this.#performanceEvaluator.endSection('init');
            this.#performanceEvaluator.startSection('customize');
            const newNode = await this.#sessionEngine.customize(() => this.#customizationProcess !== customizationID);
            this.#performanceEvaluator.endSection('customize');

            const eventSceneUpdate: ITaskEvent = { type: TASKTYPE.SESSION_CUSTOMIZATION, id: eventId, progress: 0.75, data: { sessionId: this.id }, status: 'Updating scene' };
            this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_PROCESS, eventSceneUpdate);

            // OPTION TO SKIP - PART 2
            if (this.#customizationProcess !== customizationID) {
                this.#performanceEvaluator.end();
                for (let viewerId in this.#api.viewers)
                    this.#api.viewers[viewerId].deregisterBusyMode(customizationID);

                const eventCancel2: ITaskEvent = { type: TASKTYPE.SESSION_CUSTOMIZATION, id: eventId, progress: 1, data: { sessionId: this.id }, status: 'Session customization was exceeded by other customization request' };
                this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_CANCEL, eventCancel2);
                this.#logger.debug(LOGGINGTOPIC.SESSION, `Session(${this.id}).customize: Session customization was exceeded by other customization request.`);
                return newNode;
            }

            // if this is not a call by the goBack or goForward functions, add the parameter values to the history and delete the forward history
            if (!this.#parameterHistoryCall) {
                this.#parameterHistory.push(parameterSet);
                this.#parameterHistoryForward = [];
            }

            this.#performanceEvaluator.startSection('finish');
            if (this.#api.automaticUpdate) this.#sceneTree.removeNode(this.node);
            this.#node = newNode;
            if (this.#api.automaticUpdate) this.#sceneTree.addNode(this.node);

            this.#logger.debug(LOGGINGTOPIC.SESSION, `Session(${this.id}).customize: Customization request finished, updating geometry.`);

            // set the session values to the current ones in all parameters
            for (const parameterId in this.parameters)
                (<any>this.parameters[parameterId].sessionValue) = parameterSet[parameterId].value;

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

            this.node.excludeViewers = this.#excludeViewers;

            for (let viewerId in this.#api.viewers)
                this.#api.viewers[viewerId].deregisterBusyMode(customizationID);

            this.#logger.debug(LOGGINGTOPIC.SESSION, `Session(${this.id}).customize: Session customized.`);

            this.#performanceEvaluator.endSection('finish');
            this.#performanceEvaluator.end();

            this.#eventEngine.emitEvent(EVENTTYPE.SESSION.SESSION_CUSTOMIZED, { sessionId: this.id });

            const eventEnd: ITaskEvent = { type: TASKTYPE.SESSION_CUSTOMIZATION, id: eventId, progress: 1, data: { sessionId: this.id }, status: 'Session customized' };
            this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_END, eventEnd);

            return this.node;
        } catch (e) {
            const eventCancel: ITaskEvent = { type: TASKTYPE.SESSION_CUSTOMIZATION, id: eventId, progress: 1, data: { sessionId: this.id }, status: 'Session customization failed' };
            this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_CANCEL, eventCancel);

            for (let viewerId in this.#api.viewers)
                this.#api.viewers[viewerId].deregisterBusyMode(customizationID);

            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGINGTOPIC.SESSION, `Session(${this.id}).customize`, e);
        }
    }

    public getExportById(id: string): IExport | null {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.EXPORT, `Session(${this.id}).getExportById: Getting export with id ${id}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.EXPORT, `Session(${this.id}).getExportById`, id, 'string');
            return this.exports[id];
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGINGTOPIC.EXPORT, `Session(${this.id}).getExportById`, e);
        }
    }

    public getExportByName(name: string): IExport[] {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.EXPORT, `Session(${this.id}).getExportByName: Getting export(s) with name ${name}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.EXPORT, `Session(${this.id}).getExportByName`, name, 'string');
            const exports: IExport[] = [];
            for (let exportId in this.exports) {
                if (name === this.exports[exportId].name)
                    exports.push(this.exports[exportId])
            }
            return exports;
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGINGTOPIC.EXPORT, `Session(${this.id}).getExportByName`, e);
        }
    }

    public getExportByType(type: string): IExport[] {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.EXPORT, `Session(${this.id}).getExportByType: Getting export(s) with type ${type}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.EXPORT, `Session(${this.id}).getExportByType`, type, 'string');
            const exports: IExport[] = [];
            for (let exportId in this.exports) {
                if (type === this.exports[exportId].type)
                    exports.push(this.exports[exportId])
            }
            return exports;
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGINGTOPIC.EXPORT, `Session(${this.id}).getExportByType`, e);
        }
    }

    public getOutputById(id: string): IOutput | null {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.OUTPUT, `Session(${this.id}).getOutputById: Getting output with id ${id}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.OUTPUT, `Session(${this.id}).getOutputById`, id, 'string');
            return this.outputs[id];
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGINGTOPIC.OUTPUT, `Session(${this.id}).getOutputById`, e);
        }
    }

    public getOutputByName(name: string): IOutput[] {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.OUTPUT, `Session(${this.id}).getOutputByName: Getting output(s) with name ${name}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.OUTPUT, `Session(${this.id}).getOutputByName`, name, 'string');
            const outputs: IOutput[] = [];
            for (let outputId in this.outputs) {
                if (name === this.outputs[outputId].name)
                    outputs.push(this.outputs[outputId])
            }
            return outputs;
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGINGTOPIC.OUTPUT, `Session(${this.id}).getOutputByName`, e);
        }
    }

    public getParameterById(id: string): IParameter<any> | null {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.PARAMETER, `Session(${this.id}).getParameterById: Getting parameter with id ${id}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.PARAMETER, `Session(${this.id}).getParameterById`, id, 'string');
            return this.parameters[id];
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGINGTOPIC.PARAMETER, `Session(${this.id}).getParameterById`, e);
        }
    }

    public getParameterByName(name: string): IParameter<any>[] {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.PARAMETER, `Session(${this.id}).getParameterByName: Getting parameter(s) with name ${name}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.PARAMETER, `Session(${this.id}).getParameterByName`, name, 'string');
            const parameters: IParameter<any>[] = [];
            for (let parameterId in this.parameters) {
                if (name === this.parameters[parameterId].name)
                    parameters.push(this.parameters[parameterId])
            }
            return parameters;
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGINGTOPIC.PARAMETER, `Session(${this.id}).getParameterByName`, e);
        }
    }

    public getParameterByType(type: string): IParameter<any>[] {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.PARAMETER, `Session(${this.id}).getParameterByType: Getting parameter(s) with type ${type}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.PARAMETER, `Session(${this.id}).getParameterByType`, type, 'string');
            const parameters: IParameter<any>[] = [];
            for (let parameterId in this.parameters) {
                if (type === this.parameters[parameterId].type)
                    parameters.push(this.parameters[parameterId])
            }
            return parameters;
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGINGTOPIC.PARAMETER, `Session(${this.id}).getParameterByType`, e);
        }
    }

    public async goBack(): Promise<TreeNode> {
        try {
            if (!this.canGoBack()) {
                this.#logger.debug(LOGGINGTOPIC.SESSION, `Session(${this.id}).goBack: Cannot go further back.`);
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
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGINGTOPIC.SESSION, `Session(${this.id}).goBack`, e);
        }
    }

    public async goForward(): Promise<TreeNode> {
        try {
            if (!this.canGoForward()) {
                this.#logger.debug(LOGGINGTOPIC.SESSION, `Session(${this.id}).goForward: Cannot go further forward.`);
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
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGINGTOPIC.SESSION, `Session(${this.id}).goForward`, e);
        }
    }

    public async init(waitForOutputs = true, loadOutputs = true, initialParameters?: { [key: string]: string }): Promise<void> {
        try {
            const eventId = this.#uuidGenerator.create();
            const event: ITaskEvent = { type: TASKTYPE.SESSION_INITIAL_OUTPUTS_LOADED, id: eventId, progress: 0, status: 'Initializing session' };
            this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_START, event);

            this.#performanceEvaluator.start();
            this.#performanceEvaluator.startSection('init');

            this.#logger.debugLow(LOGGINGTOPIC.SESSION, `Session(${this.id}).init: Initializing Session.`);
            this.#performanceEvaluator.endSection('init');
            this.#performanceEvaluator.startSection('customize');

            await this.#sessionEngine.init(initialParameters);

            const eventLoading: ITaskEvent = { type: TASKTYPE.SESSION_INITIAL_OUTPUTS_LOADED, id: eventId, progress: 0.5, status: 'Loading outputs' };
            this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_PROCESS, eventLoading);

            if (this.primarySession)
                this.#httpClient.addDataLoading(this.#sessionEngine.loadData.bind(this.#sessionEngine))

            if (loadOutputs) {
                if (waitForOutputs) {
                    this.#node = await this.#sessionEngine.loadOutputs();
                    if (this.#api.automaticUpdate) this.#sceneTree.addNode(this.node);
                    this.node.excludeViewers = this.#excludeViewers;
                    this.#api.update();
                    this.#eventEngine.emitEvent(EVENTTYPE.SESSION.SESSION_INITIAL_OUTPUTS_LOADED, { sessionId: this.id });

                    const eventEnd: ITaskEvent = { type: TASKTYPE.SESSION_INITIAL_OUTPUTS_LOADED, id: eventId, progress: 1, status: 'Initial outputs loaded' };
                    this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_END, eventEnd);
                } else {
                    this.#sessionEngine.loadOutputs().then(async node => {
                        this.#node = node;
                        if (this.#api.automaticUpdate) this.#sceneTree.addNode(this.node);
                        this.node.excludeViewers = this.#excludeViewers;
                        this.#api.update();
                        this.#eventEngine.emitEvent(EVENTTYPE.SESSION.SESSION_INITIAL_OUTPUTS_LOADED, { sessionId: this.id });

                        const eventEnd: ITaskEvent = { type: TASKTYPE.SESSION_INITIAL_OUTPUTS_LOADED, id: eventId, progress: 1, status: 'Initial outputs loaded' };
                        this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_END, eventEnd);
                    })
                }
            }

            this.#performanceEvaluator.endSection('customize');
            this.#performanceEvaluator.startSection('finish');

            const parameterSet: {
                [key: string]: {
                    value: any,
                    valueString: string
                }
            } = {};

            for (let p in this.#sessionEngine.parameters) {
                const param = this.#sessionEngine.parameters[p];
                if (param.displayname !== undefined || param.order !== undefined)
                    this.#useSessionSettings = false;
                switch (true) {
                    case param.type === PARAMETERTYPE.BOOL:
                        this.parameters[p] = new Parameter<boolean>(this, this.#sessionEngine, this.#sessionEngine.parameters[p]);
                        break;
                    case param.type === PARAMETERTYPE.COLOR:
                        this.parameters[p] = new Parameter<number | vec3>(this, this.#sessionEngine, this.#sessionEngine.parameters[p]);
                        break;
                    case param.type === PARAMETERTYPE.FILE:
                        this.parameters[p] = new FileParameter(this, this.#sessionEngine, this.#sessionEngine.parameters[p]);
                        break;
                    case param.type === PARAMETERTYPE.EVEN || param.type === PARAMETERTYPE.FLOAT || param.type === PARAMETERTYPE.INT || param.type === PARAMETERTYPE.ODD:
                        this.parameters[p] = new Parameter<number>(this, this.#sessionEngine, this.#sessionEngine.parameters[p]);
                        break;
                    default:
                        this.parameters[p] = new Parameter<string>(this, this.#sessionEngine, this.#sessionEngine.parameters[p]);
                        break;
                }

                parameterSet[p] = {
                    value: this.parameters[p].value,
                    valueString: this.parameters[p].stringify()
                }
                
                this.#sessionEngine.parameterValues[p] = parameterSet[p].valueString;
            }

            // store the initialization as the first parameter set in the history
            this.#parameterHistory.push(parameterSet);

            for (let exportId in this.#sessionEngine.exports) {
                if (this.#sessionEngine.exports[exportId].displayname !== undefined || this.#sessionEngine.exports[exportId].order !== undefined)
                    this.#useSessionSettings = false;
                this.exports[exportId] = new Export(this, this.#sessionEngine, this.#sessionEngine.exports[exportId]);
            }

            for (let outputId in this.#sessionEngine.outputs) {
                if (this.#sessionEngine.outputs[outputId].displayname !== undefined || this.#sessionEngine.outputs[outputId].order !== undefined)
                    this.#useSessionSettings = false;
                this.outputs[outputId] = new Output(this, this.#sessionEngine, this.#sessionEngine.outputs[outputId]);
            }

            this._warningCreator();

            const viewerPromises = [];
            const viewerIds = Object.keys(this.#api.viewers);
            for (let i = 0; i < viewerIds.length; i++)
                viewerPromises.push(new Promise<void>(resolve => { const state = this.#stateEngine.viewers[this.#api.viewers[viewerIds[i]].id].settingsLoaded; state.resolved === true ? resolve() : state.then(() => resolve()) }));

            this.#settingsEngine.loadSettings(this.#sessionEngine.viewerSettings, this.id, this.primarySession);
            this.#stateEngine.sessions[this.id].settingsRegistered.resolve(true);

            if (this.primarySession !== false) await Promise.all(viewerPromises);

            this.#api.update();
            this.#logger.debug(LOGGINGTOPIC.SESSION, `Session(${this.id}).init: Session initialized.`);

            this.#performanceEvaluator.endSection('finish');
            this.#performanceEvaluator.end();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGINGTOPIC.SESSION, `Session(${this.id}).init`, e);
        }
    }

    public async saveDefaultParameters(): Promise<boolean> {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.SESSION, `Session(${this.id}).saveDefaultParameters: Saving default parameters.`);
            const response = await this.#sessionEngine.saveDefaultParameters();
            if (response) {
                this.#logger.debug(LOGGINGTOPIC.SESSION, `Session(${this.id}).saveDefaultParameters: Saved default parameters.`);
            } else {
                const error = new ShapeDiverViewerSessionError(`Session(${this.id}).saveDefaultParameters: Could not save default parameters.`);
                throw this.#logger.handleError(LOGGINGTOPIC.SESSION, `Session(${this.id}).saveDefaultParameters`, error);
            }
            return response;
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGINGTOPIC.SESSION, `Session(${this.id}).saveDefaultParameters`, e);
        }
    }

    public async saveSessionProperties(saveInSettings: boolean = true): Promise<boolean> {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.SESSION, `Session(${this.id}).saveSessionProperties: Saving session properties.`);

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
            const responseP = Object.values(properties).length !== 0 ? await this.#sessionEngine.saveParameterProperties(properties) : true;

            properties = {};
            for (let e in this.exports) {
                properties[e] = {
                    displayname: this.exports[e].displayname !== undefined ? this.exports[e].displayname! : '',
                    hidden: this.exports[e].hidden !== undefined ? this.exports[e].hidden : false,
                    order: this.exports[e].order !== undefined ? this.exports[e].order! : 0,
                    tooltip: this.exports[e].tooltip !== undefined ? this.exports[e].tooltip! : '',
                };
            }
            const responseE = Object.values(properties).length !== 0 ? await this.#sessionEngine.saveExportProperties(properties) : true;

            properties = {};
            for (let o in this.outputs) {
                properties[o] = {
                    displayname: this.outputs[o].displayname !== undefined ? this.outputs[o].displayname! : '',
                    hidden: this.outputs[o].hidden !== undefined ? this.outputs[o].hidden : false,
                    order: this.outputs[o].order !== undefined ? this.outputs[o].order! : 0,
                    tooltip: this.outputs[o].tooltip !== undefined ? this.outputs[o].tooltip! : '',
                };
            }
            const responseO = Object.values(properties).length !== 0 ? await this.#sessionEngine.saveOutputProperties(properties) : true;

            // save partial settings
            const response = saveInSettings ? await this.#sessionEngine.saveSettings(this.#settingsEngine.convertToTargetVersion()) : true;

            if (response && responseP && responseO && responseE) {
                this.#logger.debug(LOGGINGTOPIC.SESSION, `Session(${this.id}).saveSessionProperties: Saved session properties.`);
            } else {
                this.#logger.warn(LOGGINGTOPIC.SESSION, `Session(${this.id}).saveSessionProperties: Could not save session properties.`);
            }
            return response && responseP && responseO && responseE;
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGINGTOPIC.SESSION, `Session(${this.id}).saveSessionProperties`, e);
        }
    }

    public async saveSettings(viewerId?: string): Promise<boolean> {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.SESSION, `Session(${this.id}).saveSettings: Saving settings.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.SESSION, `Session(${this.id}).saveSettings`, viewerId, 'boolean', false);
            this.#settingsEngine.general.commitParameters = this.commitParameters;
            this.#settingsEngine.general.commitSettings = this.commitSettings;

            await this.saveSessionProperties(false);

            this.#settingsEngine.settings.build_version = build_data.build_version;
            this.#settingsEngine.settings.build_date = build_data.build_date;
            this.#settingsEngine.settings.settings_version = '3.1';

            if (Object.values(this.#api.viewers).length !== 0) {
                let viewer = viewerId ? this.#api.viewers[viewerId] : null;
                if (!viewer)
                    viewer = Object.values(this.#api.viewers)[0];

                const renderingEngines = (<RenderingEngine[]>container.resolveAll('renderingEngine'));
                let renderingEngine: RenderingEngine;
                for (let i = 0; i < renderingEngines.length; i++)
                    if (renderingEngines[i].id === viewer.id)
                        renderingEngine = renderingEngines[i];

                renderingEngine!.saveSettings();
                const response = await this.#sessionEngine.saveSettings(this.#settingsEngine.convertToTargetVersion());
                if (response) {
                    this.#logger.debug(LOGGINGTOPIC.SESSION, `Session(${this.id}).saveSettings: Saved settings.`);
                } else {
                    const error = new ShapeDiverViewerSessionError(`Session(${this.id}).saveSettings: Could not save settings.`);
                    throw this.#logger.handleError(LOGGINGTOPIC.SESSION, `Session(${this.id}).saveSettings`, error);
                }
                return response;
            }
            return false;
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGINGTOPIC.SESSION, `Session(${this.id}).saveSettings`, e);
        }
    }

    public async setAsPrimary() {
        try {
            if (this.#stateEngine.sessions[this.id].initialized.resolved === false)
                await this.#stateEngine.sessions[this.id].initialized;

            this.#primarySession = true;
            this.#httpClient.addDataLoading(this.#sessionEngine.loadData.bind(this.#sessionEngine))
            this.#stateEngine.sessions[this.id].primary = true;
            this.#settingsEngine.loadSettings(this.#sessionEngine.viewerSettings, this.id, this.primarySession);
            await new Promise<void>((resolve) => this.#stateEngine.sessions[this.id].settingsRegistered.then(() => { resolve(); }));
            this.#api.update();
            this.#logger.debug(LOGGINGTOPIC.SESSION, `Session(${this.id}).setAsPrimary: This is now the primary session.`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGINGTOPIC.SESSION, `Session(${this.id}).setAsPrimary`, e);
        }
    }

    public async updateOutputs(): Promise<TreeNode> {
        const eventId = this.#uuidGenerator.create();
        const customizationID = this.#uuidGenerator.create();
        try {
            const eventStart: ITaskEvent = { type: TASKTYPE.SESSION_OUTPUTS_UPDATE, id: eventId, progress: 0, data: { sessionId: this.id }, status: 'Updating outputs' };
            this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_START, eventStart);

            const oldNode = this.#node.cloneInstance();
            this.#customizationProcess = customizationID;

            this.#performanceEvaluator.start();
            this.#performanceEvaluator.startSection('init');

            this.#logger.debugLow(LOGGINGTOPIC.SESSION, `Session(${this.id}).updateOutputs: Updating Outputs.`);

            for (let viewerId in this.#api.viewers)
                this.#api.viewers[viewerId].registerBusyMode(customizationID);

            const eventRequest: ITaskEvent = { type: TASKTYPE.SESSION_OUTPUTS_UPDATE, id: eventId, progress: 0.25, data: { sessionId: this.id }, status: 'Loading outputs' };
            this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_PROCESS, eventRequest);

            this.#performanceEvaluator.endSection('init');
            this.#performanceEvaluator.startSection('updateOutputs');
            const newNode = await this.#sessionEngine.loadOutputs(() => this.#customizationProcess !== customizationID);
            this.#performanceEvaluator.endSection('updateOutputs');

            const eventSceneUpdate: ITaskEvent = { type: TASKTYPE.SESSION_OUTPUTS_UPDATE, id: eventId, progress: 0.75, data: { sessionId: this.id }, status: 'Updating scene' };
            this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_PROCESS, eventSceneUpdate);

            // OPTION TO SKIP - PART 1
            if (this.#customizationProcess !== customizationID) {
                this.#performanceEvaluator.end();
                for (let viewerId in this.#api.viewers)
                    this.#api.viewers[viewerId].deregisterBusyMode(customizationID);
                const eventCancel1: ITaskEvent = { type: TASKTYPE.SESSION_OUTPUTS_UPDATE, id: eventId, progress: 1, data: { sessionId: this.id }, status: 'Output updating was exceeded by other customization request' };
                this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_CANCEL, eventCancel1);
                this.#logger.debug(LOGGINGTOPIC.SESSION, `Session(${this.id}).updateOutputs: Output updating was exceeded by other request.`);
                return newNode;
            }

            this.#performanceEvaluator.startSection('finish');
            if (this.#api.automaticUpdate) this.#sceneTree.removeNode(this.node);
            this.#node = newNode;
            if (this.#api.automaticUpdate) this.#sceneTree.addNode(this.node);

            this.#logger.debug(LOGGINGTOPIC.SESSION, `Session(${this.id}).updateOutputs: Updating outputs finished, updating geometry.`);

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
            this.node.excludeViewers = this.#excludeViewers;

            for (let viewerId in this.#api.viewers)
                this.#api.viewers[viewerId].deregisterBusyMode(customizationID);

            this.#logger.debug(LOGGINGTOPIC.SESSION, `Session(${this.id}).updateOutputs: Updated outputs.`);

            this.#performanceEvaluator.endSection('finish');
            this.#performanceEvaluator.end();

            const eventEnd: ITaskEvent = { type: TASKTYPE.SESSION_OUTPUTS_UPDATE, id: eventId, progress: 1, data: { sessionId: this.id }, status: 'Outputs updated' };
            this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_END, eventEnd);

            return this.node;
        } catch (e) {
            const eventCancel: ITaskEvent = { type: TASKTYPE.SESSION_OUTPUTS_UPDATE, id: eventId, progress: 1, data: { sessionId: this.id }, status: 'Output updating failed' };
            this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_CANCEL, eventCancel);

            for (let viewerId in this.#api.viewers)
                this.#api.viewers[viewerId].deregisterBusyMode(customizationID);

            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGINGTOPIC.SESSION, `Session(${this.id}).updateOutputs`, e);
        }
    }

    public async uploadGLTF(conversion: ShapeDiverRequestGltfUploadQueryConversion, eventId: string) {
        try {
            const event1: ITaskEvent = { type: TASKTYPE.AR_LOADING, id: eventId, progress: 0.25, status: 'Converting AR scene' };
            this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_PROCESS, event1);
            const blob = await this.#api.convertSceneToGLTF(true);
            const event2: ITaskEvent = { type: TASKTYPE.AR_LOADING, id: eventId, progress: 0.75, status: 'Uploading AR scene' };
            this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_PROCESS, event2);
            return await this.#sessionEngine.uploadGLTF(blob, conversion);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGINGTOPIC.SESSION, `Session(${this.id}).uploadGLTF`, e);
        }
    }

    // #endregion Public Methods (21)

    // #region Private Methods (2)

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
        this.#settingsEngine.session = sessionProperties;

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
                this.#logger.warn(LOGGINGTOPIC.SESSION, `\nOutput(${outputId}):${warning}`);
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
                this.#logger.warn(LOGGINGTOPIC.SESSION, `\nExport(${exportId}):${warning}`);
        }
    }

    // #endregion Private Methods (2)
}
