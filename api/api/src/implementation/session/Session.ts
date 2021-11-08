import { Tree, TreeNode } from '@shapediver/viewer.shared.node-tree'
import { Session as SessionEngine } from '@shapediver/viewer.session-engine.session-engine'
import { container, injectable } from 'tsyringe'
import {
  EventEngine,
  EVENTTYPE,
  InputValidator,
  Logger,
  LOGGINGTOPIC,
  PerformanceEvaluator,
  SDError,
  SettingsEngine,
  StateEngine,
  UuidGenerator,
} from '@shapediver/viewer.shared.services'
import { build_data } from '@shapediver/viewer.shared.build-data'
import { vec3 } from 'gl-matrix'
import { RenderingEngine } from '@shapediver/viewer.rendering-engine-threejs.standard'

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
import { ISettingsEvent } from '@shapediver/viewer.shared.types'

@injectable()
export class Session implements ISession {
    // #region Properties (28)

    readonly #api: Api = <Api>container.resolve(Api);
    readonly #eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);
    readonly #exports: { [key: string]: IExport; } = {};
    readonly #id: string;
    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #modelViewUrl: string;
    readonly #outputs: { [key: string]: IOutput; } = {};
    readonly #parameters: { [key: string]: IParameter<any> } = {};
    readonly #performanceEvaluator: PerformanceEvaluator = <PerformanceEvaluator>container.resolve(PerformanceEvaluator);
    readonly #primarySessionRequest: boolean = false;
    readonly #saveSessionSettings = () => {
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

    readonly #sceneTree: Tree = <Tree>container.resolve(Tree);
    readonly #sessionEngine: SessionEngine;
    readonly #settingsEngine: SettingsEngine = <SettingsEngine>container.resolve(SettingsEngine);
    readonly #stateEngine: StateEngine = <StateEngine>container.resolve(StateEngine);
    readonly #ticket: string;
    readonly #uuidGenerator: UuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);

    #automaticUpdate: boolean = false;
    #canUploadGLTF: boolean = false;
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

    // #endregion Properties (28)

    // #region Constructors (1)

    /**
     * @ignore
     */
    constructor(properties: { id: string, ticket: string, modelViewUrl: string, bearerToken?: string, primarySession?: boolean, excludeViewers?: string[] }, callbacks: any) {
        try {
            this.#node = new TreeNode(properties.id);
            this.#sessionEngine = new SessionEngine(Object.assign({ buildDate: build_data.build_date, buildVersion: build_data.build_version }, properties));
            this.#id = this.#sessionEngine.id;
            this.#ticket = this.#sessionEngine.ticket;
            this.#modelViewUrl = this.#sessionEngine.modelViewUrl;
            this.#stateEngine.createCustomState(this.id + '_settings_registered');
            this.#excludeViewers = properties.excludeViewers || [];

            this.#primarySessionRequest = properties.primarySession !== false;
            if (this.primarySessionRequest === true) {
                if (this.#stateEngine.primarySessionLoaded.resolved === false) {
                    this.#primarySession = true;
                    this.#logger.info(LOGGINGTOPIC.SESSION, `Session(${this.id}): This is now the primary session.`);
                }

                this.#stateEngine.getCustomState(this.id + '_settings_registered').then(() => {
                    this.#commitParameters = this.#settingsEngine.general.commitParameters;
                    this.#commitSettings = this.#settingsEngine.general.commitSettings;

                    // only update the display names, order and hidden properties if the parameters / exports / outputs don't have these properties defined
                    if (this.#useSessionSettings === true) {
                        for (let s in this.#settingsEngine.session) {
                            const temp = this.#settingsEngine.session[s];
                            if (this.parameters[s]) {
                                if(temp.displayname !== undefined) this.parameters[s]!.displayname = temp.displayname;
                                if(temp.order !== undefined) this.parameters[s]!.order = temp.order;
                                if(temp.hidden !== undefined) this.parameters[s]!.hidden = temp.hidden;
                            }
                            if (this.exports[s]) {
                                if(temp.displayname !== undefined) this.exports[s]!.displayname = temp.displayname;
                                if(temp.order !== undefined) this.exports[s]!.order = temp.order;
                                if(temp.hidden !== undefined) this.exports[s]!.hidden = temp.hidden;
                            }
                        }
                    }
                })
            }

            callbacks.setAsPrimary = async () => {
                try {
                    this.#primarySession = true;
                    this.#eventEngine.emitEvent(EVENTTYPE.SESSION.SESSION_INITIALIZED, { sessionId: this.id });
                    this.#settingsEngine.loadSettings(this.#sessionEngine.settingsConfig, this.id, this.primarySession);
                    await new Promise<void>((resolve) => this.#stateEngine.getCustomState(this.id + '_settings_registered').then(() => { resolve(); }));
                    this.#eventEngine.emitEvent(EVENTTYPE.SESSION.SESSION_LOADED, { sessionId: this.id });
                    this.#api.update();
                    this.#logger.info(LOGGINGTOPIC.SESSION, `Session(${this.id}).setAsPrimary: This is now the primary session.`);
                } catch (e) {
                    if (e instanceof SDError) throw e;
                    throw this.#logger.error(LOGGINGTOPIC.SESSION, e, `Session(${this.id}).setAsPrimary: Something unexpected happened.`, true)
                }
            }

            callbacks.close = async (): Promise<boolean> => {
                try {
                    const closeResult = await this.#sessionEngine.close();
                    if (this.#api.automaticUpdate) this.#sceneTree.removeNode(this.node);
                    this.#api.update();

                    this.#settingsEngine.reset();
                    this.#stateEngine.primarySettingsRegistered.reset();
                    this.#eventEngine.emitEvent(EVENTTYPE.SESSION.SESSION_CLOSED, { sessionId: this.id });

                    if (!closeResult) this.#logger.warn(LOGGINGTOPIC.SESSION, `Session(${this.id}).close: Was not able to close session completely, please disregard this session.`);
                    return closeResult;
                } catch (e) {
                    if (e instanceof SDError) throw e;
                    throw this.#logger.error(LOGGINGTOPIC.SESSION, e, `Session(${this.id}).close: Something unexpected happened.`, true)
                }
            }

            this.#eventEngine.addListener(EVENTTYPE.SETTINGS.SETTINGS_REGISTERED, (e) => { 
                const sessionEvent = <ISettingsEvent>e;
                if(sessionEvent.sessionId) this.#stateEngine.getCustomState(sessionEvent.sessionId + '_settings_registered').resolve(true);
            })

            this.#logger.debugLow(LOGGINGTOPIC.SESSION, `Session(${this.id}).constructor: Session api created.`);
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.SESSION, e, `Session.constructor: Something unexpected happened.`, true)
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
            this.#logger.info(LOGGINGTOPIC.SESSION, `Session(${this.id}).automaticUpdate: automaticUpdate was set to: ${value}`);
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.SESSION, e, `Session(${this.id}).automaticUpdate: Something unexpected happened.`, true)
        }
    }

    public get authorTicket(): boolean | undefined {
        return this.#sessionEngine.authorTicket;
    }

    public get bearerToken(): string | undefined {
        return this.#sessionEngine.bearerToken;
    }

    public set bearerToken(value: string | undefined) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.SESSION, `Session(${this.id}).bearerToken: Updating BearerToken to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.SESSION, `Session(${this.id}).bearerToken`, value, 'string', false);
            this.#sessionEngine.bearerToken = value;
            this.#logger.info(LOGGINGTOPIC.SESSION, `Session(${this.id}).bearerToken: bearerToken was set to: ${value}`);
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.SESSION, e, `Session(${this.id}).bearerToken: Something unexpected happened.`, true)
        }
    }

    public get canUploadGLTF(): boolean {
        return this.#canUploadGLTF;
    }

    public get commitParameters(): boolean {
        return this.#commitParameters;
    }

    public set commitParameters(value: boolean) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.SESSION, `Session(${this.id}).commitParameters: Updating CommitParameters to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.SESSION, `Session(${this.id}).commitParameters`, value, 'boolean');
            this.#commitParameters = value;
            this.#logger.info(LOGGINGTOPIC.SESSION, `Session(${this.id}).commitParameters: commitParameters was set to: ${value}`);
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.SESSION, e, `Session(${this.id}).commitParameters: Something unexpected happened.`, true)
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
            this.#logger.info(LOGGINGTOPIC.SESSION, `Session(${this.id}).commitSettings: commitSettings was set to: ${value}`);
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.SESSION, e, `Session(${this.id}).commitSettings: Something unexpected happened.`, true)
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

    public get refreshBearerToken(): () => string {
        return this.#sessionEngine.refreshBearerToken;
    }

    public set refreshBearerToken(value: () => string) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.SESSION, `Session(${this.id}).refreshBearerToken: Updating RefreshBearerToken to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.SESSION, `Session(${this.id}).refreshBearerToken`, value, 'function');
            this.#sessionEngine.refreshBearerToken = value;
            this.#logger.info(LOGGINGTOPIC.SESSION, `Session(${this.id}).refreshBearerToken: refreshBearerToken was set to: ${value}`);
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.SESSION, e, `Session(${this.id}).refreshBearerToken: Something unexpected happened.`, true)
        }
    }

    public get ticket(): string {
        return this.#ticket;
    }

    // #endregion Public Accessors (21)

    // #region Public Methods (18)

    public canGoBack(): boolean {
        // the first entry is always the one from the init call
        // all additional entries can be undone
        return this.#parameterHistory.length > 1;
    }

    public canGoForward(): boolean {
        return this.#parameterHistoryForward.length > 0;
    }

    public async customize(): Promise<TreeNode> {
        try {
            const customizationID = this.#uuidGenerator.create();
            this.#customizationProcess = customizationID;

            this.#performanceEvaluator.start();
            this.#performanceEvaluator.startSection('init');

            this.#logger.debugLow(LOGGINGTOPIC.SESSION, `Session(${this.id}).customize: Customizing session.`);

            for (let viewerId in this.#api.viewers)
                if (this.#api.viewers[viewerId].blurSceneWhenBusy)
                    this.#api.viewers[viewerId].registerBusyMode(customizationID);

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
                        this.#logger.info(LOGGINGTOPIC.SESSION, `Session(${this.id}).customize: Session customization was exceeded by other customization request.`);
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
                this.#logger.info(LOGGINGTOPIC.SESSION, `Session(${this.id}).customize: Session customization was exceeded by other customization request.`);
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

            this.#performanceEvaluator.endSection('init');
            this.#performanceEvaluator.startSection('customize');
            const node = await this.#sessionEngine.customize(() => this.#customizationProcess !== customizationID);
            this.#performanceEvaluator.endSection('customize');

            // OPTION TO SKIP - PART 2
            if (this.#customizationProcess !== customizationID) {
                this.#performanceEvaluator.end();
                for (let viewerId in this.#api.viewers)
                    this.#api.viewers[viewerId].deregisterBusyMode(customizationID);
                this.#logger.info(LOGGINGTOPIC.SESSION, `Session(${this.id}).customize: Session customization was exceeded by other customization request.`);
                return node;
            }

            // if this is not a call by the goBack or goForward functions, add the parameter values to the history and delete the forward history
            if(!this.#parameterHistoryCall) {
                this.#parameterHistory.push(parameterSet);
                this.#parameterHistoryForward = [];
            }

            this.#performanceEvaluator.startSection('finish');
            if (this.#api.automaticUpdate) this.#sceneTree.removeNode(this.node);
            this.#node = node;
            if (this.#api.automaticUpdate) this.#sceneTree.addNode(this.node);

            this.#logger.info(LOGGINGTOPIC.SESSION, `Session(${this.id}).customize: Customization request finished, updating geometry.`);

            // set the session values to the current ones in all parameters
            for (const parameterId in this.parameters)
                (<any>this.parameters[parameterId].sessionValue) = parameterSet[parameterId].value;

            this.node.excludeViewers = this.#excludeViewers;

            for (let viewerId in this.#api.viewers)
                this.#api.viewers[viewerId].deregisterBusyMode(customizationID);

            this.#logger.info(LOGGINGTOPIC.SESSION, `Session(${this.id}).customize: Session customized.`);

            this.#performanceEvaluator.endSection('finish');
            this.#performanceEvaluator.end();

            this.#eventEngine.emitEvent(EVENTTYPE.SESSION.SESSION_CUSTOMIZED, { sessionId: this.id });
            return this.node;
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.SESSION, e, `Session(${this.id}).customize: Something unexpected happened.`, true)
        }
    }

    public getExportById(id: string): IExport | null {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.EXPORT, `Session(${this.id}).getExportById: Getting export with id ${id}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.EXPORT, `Session(${this.id}).getExportById`, id, 'string');
            return this.exports[id];
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.EXPORT, e, `Session(${this.id}).getExportById: Something unexpected happened.`, true)
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
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.EXPORT, e, `Session(${this.id}).getExportByName: Something unexpected happened.`, true)
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
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.EXPORT, e, `Session(${this.id}).getExportByType: Something unexpected happened.`, true)
        }
    }

    public getOutputById(id: string): IOutput | null {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.OUTPUT, `Session(${this.id}).getOutputById: Getting output with id ${id}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.OUTPUT, `Session(${this.id}).getOutputById`, id, 'string');
            return this.outputs[id];
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.OUTPUT, e, `Session(${this.id}).getOutputById: Something unexpected happened.`, true)
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
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.OUTPUT, e, `Session(${this.id}).getOutputByName: Something unexpected happened.`, true)
        }
    }

    public getParameterById(id: string): IParameter<any> | null {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.PARAMETER, `Session(${this.id}).getParameterById: Getting parameter with id ${id}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.PARAMETER, `Session(${this.id}).getParameterById`, id, 'string');
            return this.parameters[id];
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.PARAMETER, e, `Session(${this.id}).getParameterById: Something unexpected happened.`, true)
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
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.PARAMETER, e, `Session(${this.id}).getParameterByName: Something unexpected happened.`, true)
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
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.PARAMETER, e, `Session(${this.id}).getParameterByType: Something unexpected happened.`, true)
        }
    }

    public async goBack(): Promise<TreeNode> { 
        try {
            if(!this.canGoBack()) {
                this.#logger.info(LOGGINGTOPIC.SESSION, `Session(${this.id}).goBack: Cannot go further back.`);
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
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.SESSION, e, `Session(${this.id}).goBack: Something unexpected happened.`, true)
        }
    }

    public async goForward(): Promise<TreeNode> {
        try {
            if(!this.canGoForward()) {
                this.#logger.info(LOGGINGTOPIC.SESSION, `Session(${this.id}).goBack: Cannot go further forward.`);
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
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.SESSION, e, `Session(${this.id}).goForward: Something unexpected happened.`, true)
        }
    }

    public async init(waitForOutputs = true): Promise<void> {
        try {
            this.#performanceEvaluator.start();
            this.#performanceEvaluator.startSection('init');

            this.#logger.debugLow(LOGGINGTOPIC.SESSION, `Session(${this.id}).init: Initializing Session.`);
            this.#performanceEvaluator.endSection('init');
            this.#performanceEvaluator.startSection('customize');

            await this.#sessionEngine.init();
            if(waitForOutputs) {
                this.#node = await this.#sessionEngine.loadOutputs(this.#sessionEngine.parameterValues);
                if (this.#api.automaticUpdate) this.#sceneTree.addNode(this.node);
                this.node.excludeViewers = this.#excludeViewers;
                this.#eventEngine.emitEvent(EVENTTYPE.SESSION.SESSION_INITIAL_OUTPUTS_LOADED, { sessionId: this.id });
                this.#api.update();
            } else {
                this.#sessionEngine.loadOutputs(this.#sessionEngine.parameterValues).then(async node => {
                    this.#node = node;
                    if (this.#api.automaticUpdate) this.#sceneTree.addNode(this.node);
                    this.node.excludeViewers = this.#excludeViewers;
                    this.#eventEngine.emitEvent(EVENTTYPE.SESSION.SESSION_INITIAL_OUTPUTS_LOADED, { sessionId: this.id });
                    this.#api.update();
                })
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
                    case param.type === PARAMETERTYPE.BOOL || param.type === PARAMETERTYPE.SBOOL:
                        this.parameters[p] = new Parameter<boolean>(this, this.#sessionEngine, this.#sessionEngine.parameters[p]);
                        break;
                    case param.type === PARAMETERTYPE.COLOR || param.type === PARAMETERTYPE.SCOLOR:
                        this.parameters[p] = new Parameter<number | vec3>(this, this.#sessionEngine, this.#sessionEngine.parameters[p]);
                        break;
                    case param.type === PARAMETERTYPE.FILE:
                        this.parameters[p] = new FileParameter(this, this.#sessionEngine, this.#sessionEngine.parameters[p]);
                        break;
                    case param.type === PARAMETERTYPE.EVEN || param.type === PARAMETERTYPE.FLOAT || param.type === PARAMETERTYPE.INT || param.type === PARAMETERTYPE.ODD || param.type === PARAMETERTYPE.SINTEGER || param.type === PARAMETERTYPE.SNUMBER:
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
            }

            // store the initialization as the first parameter set in the history
            this.#parameterHistory.push(parameterSet);

            for (let e in this.#sessionEngine.exports) {
                if (this.#sessionEngine.exports[e].displayname !== undefined || this.#sessionEngine.exports[e].order !== undefined)
                    this.#useSessionSettings = false;
                this.exports[e] = new Export(this, this.#sessionEngine, this.#sessionEngine.exports[e]);
            }

            for (let o in this.#sessionEngine.outputs) {
                if (this.#sessionEngine.outputs[o].displayname !== undefined || this.#sessionEngine.outputs[o].order !== undefined)
                    this.#useSessionSettings = false;
                this.outputs[o] = new Output(this, this.#sessionEngine, this.#sessionEngine.outputs[o]);
            }

            this.#canUploadGLTF = this.#sessionEngine.sessionResponse.actions?.filter(v => v.name === 'gltf-upload').length !== 0;

            this.#eventEngine.emitEvent(EVENTTYPE.SESSION.SESSION_INITIALIZED, { sessionId: this.id });

            const viewerPromises = [];
            const viewerIds = Object.keys(this.#api.viewers);
            for (let i = 0; i < viewerIds.length; i++)
                viewerPromises.push(new Promise<void>(resolve => { const state = this.#stateEngine.getCustomState(this.#api.viewers[viewerIds[i]].id + '_settings_loaded'); state.resolved === true ? resolve() : state.then(() => resolve()) }));

            this.#settingsEngine.loadSettings(this.#sessionEngine.settingsConfig, this.id, this.primarySession);
            await new Promise<void>((resolve) => this.#stateEngine.getCustomState(this.id + '_settings_registered').then(() => { resolve(); }));

            if (this.primarySession !== false) await Promise.all(viewerPromises);

            this.#eventEngine.emitEvent(EVENTTYPE.SESSION.SESSION_LOADED, { sessionId: this.id });
            this.#api.update();
            this.#logger.info(LOGGINGTOPIC.SESSION, `Session(${this.id}).init: Session initialized.`);

            this.#performanceEvaluator.endSection('finish');
            this.#performanceEvaluator.end();
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.SESSION, e, `Session(${this.id}).init: Something unexpected happened.`, true)
        }
    }

    public async saveDefaultParameters(): Promise<boolean> {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.SESSION, `Session(${this.id}).saveDefaultParameters: Saving default parameters.`);
            const response = await this.#sessionEngine.saveDefaultParameters();
            if (response) {
                this.#logger.info(LOGGINGTOPIC.SESSION, `Session(${this.id}).saveDefaultParameters: Saved default parameters.`);
            } else {
                this.#logger.error(LOGGINGTOPIC.SESSION, new SDError(`Session(${this.id}).saveDefaultParameters: Could not save default parameters.`));
            }
            return response;
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.SESSION, e, `Session(${this.id}).saveDefaultParameters: Something unexpected happened.`, true)
        }
    }

    public async saveSessionProperties(saveInSettings: boolean = true): Promise<boolean> {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.SESSION, `Session(${this.id}).saveSessionProperties: Saving session properties.`);

            // settings saving 
            this.#saveSessionSettings();

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
                this.#logger.info(LOGGINGTOPIC.SESSION, `Session(${this.id}).saveSessionProperties: Saved session properties.`);
            } else {
                this.#logger.warn(LOGGINGTOPIC.SESSION, `Session(${this.id}).saveSessionProperties: Could not save session properties.`);
            }
            return response && responseP && responseO && responseE;
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.SESSION, e, `Session(${this.id}).saveSessionProperties: Something unexpected happened.`, true)
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
            this.#settingsEngine.settings.settings_version = '3.0';

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
                    this.#logger.info(LOGGINGTOPIC.SESSION, `Session(${this.id}).saveSettings: Saved settings.`);
                } else {
                    this.#logger.error(LOGGINGTOPIC.SESSION, new SDError(`Session(${this.id}).saveSettings: Could not save settings.`));
                }
                return response;
            }

            this.#logger.error(LOGGINGTOPIC.SESSION, new SDError(`Session(${this.id}).saveSettings: Could not save settings, no viewer initialized.`));
            return false;
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.SESSION, e, `Session(${this.id}).saveSettings: Something unexpected happened.`, true)
        }
    }

    public async uploadGLTF(responseType: 'gltf' | 'usdz' = 'gltf') {
        try {
            if(this.canUploadGLTF === false) {
                const error = new SDError(`Session(${this.id}).uploadGLTF: GLTF upload not available in this session.`);
                this.#logger.warn(LOGGINGTOPIC.SESSION, error.message);
                throw error;
            }

            const blob = await this.#api.convertSceneToGLTF(true);
            this.#logger.debugLow(LOGGINGTOPIC.SESSION, `Session(${this.id}).uploadGLTF: Uploading GLTF.`);
            const conversion = responseType === 'usdz' ? '?conversion=usdz' : '';
            const uploadReply = (await this.#sessionEngine.sessionCommunication(this.#sessionEngine.sessionResponse.actions?.filter(v => v.name === 'gltf-upload')[0].href! + conversion, this.#sessionEngine.sessionResponse.actions?.filter(v => v.name === 'gltf-upload')[0].method!.toLowerCase()!, blob, 'model/gltf-binary')).data;
            this.#logger.info(LOGGINGTOPIC.SESSION, `Session(${this.id}).uploadGLTF: Uploaded GLTF.`);
            return uploadReply.gltf.href;
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.SESSION, e, `Session(${this.id}).uploadGLTF: Something unexpected happened.`, true)
        }
    }

    // #endregion Public Methods (18)
}
