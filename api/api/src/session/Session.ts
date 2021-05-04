import { Tree, TreeNode } from "@shapediver/viewer.shared.node-tree";
import { IParameter, ISession, PARAMETERTYPE, Session as SessionEngine } from "@shapediver/viewer.session-engine.session-engine";
import { Export } from "./Export";
import { Output } from "./Output";
import { AbstractParameter } from "./parameters/objects/AbstractParameter";
import { container, injectable } from "tsyringe";
import { Viewer } from "../viewer/Viewer";
import { Logger } from "@shapediver/viewer.shared.monitoring";
import { EventEngine, EVENTTYPE, SettingsEngine, StateEngine } from "@shapediver/viewer.shared.services";
import { InputValidator } from "@shapediver/viewer.shared.utils";
import { RenderingEngine } from "@shapediver/viewer.rendering-engine-threejs.rendering-engine";
import { build_data } from "../build_data";
import { BooleanParameter } from "./parameters/objects/BooleanParameter";
import { BooleanParameterDTO } from "./parameters/dtos/BooleanParameterDTO";
import { BooleanParameter as BooleanParameterLogic } from "@shapediver/viewer.session-engine.session-engine";
import { ColorParameter as ColorParameterLogic } from "@shapediver/viewer.session-engine.session-engine";
import { EvenParameter as EvenParameterLogic } from "@shapediver/viewer.session-engine.session-engine";
import { FileParameter as FileParameterLogic } from "@shapediver/viewer.session-engine.session-engine";
import { FloatParameter as FloatParameterLogic } from "@shapediver/viewer.session-engine.session-engine";
import { IntParameter as IntParameterLogic } from "@shapediver/viewer.session-engine.session-engine";
import { OddParameter as OddParameterLogic } from "@shapediver/viewer.session-engine.session-engine";
import { StringListParameter as StringListParameterLogic } from "@shapediver/viewer.session-engine.session-engine";
import { StringParameter as StringParameterLogic } from "@shapediver/viewer.session-engine.session-engine";
import { TimeParameter as TimeParameterLogic } from "@shapediver/viewer.session-engine.session-engine";
import { SBitmapParameter as SBitmapParameterLogic } from "@shapediver/viewer.session-engine.session-engine";
import { SCurveParameter as SCurveParameterLogic } from "@shapediver/viewer.session-engine.session-engine";
import { SIntegerParameter as SIntegerParameterLogic } from "@shapediver/viewer.session-engine.session-engine";
import { SNumberParameter as SNumberParameterLogic } from "@shapediver/viewer.session-engine.session-engine";
import { SStringParameter as SStringParameterLogic } from "@shapediver/viewer.session-engine.session-engine";
import { SParameter as SParameterLogic } from "@shapediver/viewer.session-engine.session-engine";
import { ColorParameterDTO } from "./parameters/dtos/ColorParameterDTO";
import { EvenParameterDTO } from "./parameters/dtos/EvenParameterDTO";
import { FileParameterDTO } from "./parameters/dtos/FileParameterDTO";
import { FloatParameterDTO } from "./parameters/dtos/FloatParameterDTO";
import { IntParameterDTO } from "./parameters/dtos/IntParameterDTO";
import { OddParameterDTO } from "./parameters/dtos/OddParameterDTO";
import { StringListParameterDTO } from "./parameters/dtos/StringListParameterDTO";
import { StringParameterDTO } from "./parameters/dtos/StringParameterDTO";
import { TimeParameterDTO } from "./parameters/dtos/TimeParameterDTO";
import { ColorParameter } from "./parameters/objects/ColorParameter";
import { EvenParameter } from "./parameters/objects/EvenParameter";
import { FileParameter } from "./parameters/objects/FileParameter";
import { FloatParameter } from "./parameters/objects/FloatParameter";
import { IntParameter } from "./parameters/objects/IntParameter";
import { OddParameter } from "./parameters/objects/OddParameter";
import { StringListParameter } from "./parameters/objects/StringListParameter";
import { TimeParameter } from "./parameters/objects/TimeParameter";
import { StringParameter } from "./parameters/objects/StringParameter";
import { SBitmapParameter } from "./parameters/objects/SBitmapParameter";
import { SBitmapParameterDTO } from "./parameters/dtos/SBitmapParameterDTO";
import { SCurveParameter } from "./parameters/objects/SCurveParameter";
import { SCurveParameterDTO } from "./parameters/dtos/SCurveParameterDTO";
import { SIntegerParameter } from "./parameters/objects/SIntegerParameter";
import { SIntegerParameterDTO } from "./parameters/dtos/SIntegerParameterDTO";
import { SNumberParameter } from "./parameters/objects/SNumberParameter";
import { SNumberParameterDTO } from "./parameters/dtos/SNumberParameterDTO";
import { SStringParameter } from "./parameters/objects/SStringParameter";
import { SStringParameterDTO } from "./parameters/dtos/SStringParameterDTO";
import { SParameter } from "./parameters/objects/SParameter";
import { SParameterDTO } from "./parameters/dtos/SParameterDTO";
import { Api } from "../Api";

@injectable()
export class Session implements ISession {
    // #region Properties (14)

    readonly #api: Api = <Api>container.resolve(Api);
    readonly #eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);
    readonly #exports: { [key: string]: Export; } = {};
    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #outputs: { [key: string]: Output; } = {};
    readonly #parameterCreation = (parameterLogic: IParameter<any>): {
        object: AbstractParameter<any>,
        dto: IParameter<any>
    } => {
        switch (parameterLogic.type) {
            case PARAMETERTYPE.BOOL:
                return {
                    object: new BooleanParameter(<BooleanParameterLogic>parameterLogic),
                    dto: new BooleanParameterDTO(<BooleanParameterLogic>parameterLogic)
                };
            case PARAMETERTYPE.COLOR:
                return {
                    object: new ColorParameter(<ColorParameterLogic>parameterLogic),
                    dto: new ColorParameterDTO(<ColorParameterLogic>parameterLogic)
                };
            case PARAMETERTYPE.EVEN:
                return {
                    object: new EvenParameter(<EvenParameterLogic>parameterLogic),
                    dto: new EvenParameterDTO(<EvenParameterLogic>parameterLogic)
                };
            case PARAMETERTYPE.FILE:
                return {
                    object: new FileParameter(<FileParameterLogic>parameterLogic),
                    dto: new FileParameterDTO(<FileParameterLogic>parameterLogic)
                };
            case PARAMETERTYPE.FLOAT:
                return {
                    object: new FloatParameter(<FloatParameterLogic>parameterLogic),
                    dto: new FloatParameterDTO(<FloatParameterLogic>parameterLogic)
                };
            case PARAMETERTYPE.INT:
                return {
                    object: new IntParameter(<IntParameterLogic>parameterLogic),
                    dto: new IntParameterDTO(<IntParameterLogic>parameterLogic)
                };
            case PARAMETERTYPE.ODD:
                return {
                    object: new OddParameter(<OddParameterLogic>parameterLogic),
                    dto: new OddParameterDTO(<OddParameterLogic>parameterLogic)
                };

            case PARAMETERTYPE.STRINGLIST:
                return {
                    object: new StringListParameter(<StringListParameterLogic>parameterLogic),
                    dto: new StringListParameterDTO(<StringListParameterLogic>parameterLogic)
                };
            case PARAMETERTYPE.TIME:
                return {
                    object: new TimeParameter(<TimeParameterLogic>parameterLogic),
                    dto: new TimeParameterDTO(<TimeParameterLogic>parameterLogic)
                };
            case PARAMETERTYPE.SBITMAP:
                return {
                    object: new SBitmapParameter(<SBitmapParameterLogic>parameterLogic),
                    dto: new SBitmapParameterDTO(<SBitmapParameterLogic>parameterLogic)
                };
                break;
            case PARAMETERTYPE.SCURVE:
                return {
                    object: new SCurveParameter(<SCurveParameterLogic>parameterLogic),
                    dto: new SCurveParameterDTO(<SCurveParameterLogic>parameterLogic)
                };
                break;
            case PARAMETERTYPE.SINTEGER:
                return {
                    object: new SIntegerParameter(<SIntegerParameterLogic>parameterLogic),
                    dto: new SIntegerParameterDTO(<SIntegerParameterLogic>parameterLogic)
                };
                break;
            case PARAMETERTYPE.SNUMBER:
                return {
                    object: new SNumberParameter(<SNumberParameterLogic>parameterLogic),
                    dto: new SNumberParameterDTO(<SNumberParameterLogic>parameterLogic)
                };
                break;
            case PARAMETERTYPE.SSTRING:
                return {
                    object: new SStringParameter(<SStringParameterLogic>parameterLogic),
                    dto: new SStringParameterDTO(<SStringParameterLogic>parameterLogic)
                };
                break;
            case PARAMETERTYPE.SBOOL || PARAMETERTYPE.SBOX || PARAMETERTYPE.SBREP || PARAMETERTYPE.SCIRCLE || PARAMETERTYPE.SCOLOR || PARAMETERTYPE.SDOMAIN || PARAMETERTYPE.SDOMAIN2D || PARAMETERTYPE.SLINE || PARAMETERTYPE.SMESH || PARAMETERTYPE.SPLANE || PARAMETERTYPE.SPOINT || PARAMETERTYPE.SRECTANGLE || PARAMETERTYPE.SSUBDIV || PARAMETERTYPE.SSURFACE || PARAMETERTYPE.STIME || PARAMETERTYPE.SVECTOR:
                return {
                    object: new SParameter(<SParameterLogic>parameterLogic),
                    dto: new SParameterDTO(<SParameterLogic>parameterLogic)
                };
                break;
            default:
                return {
                    object: new StringParameter(<StringParameterLogic>parameterLogic),
                    dto: new StringParameterDTO(<StringParameterLogic>parameterLogic)
                };
        }
    }

    readonly #parameters: {
        [key: string]: {
            object: AbstractParameter<any>,
            dto: IParameter<any>
        }
    } = {};
    readonly #sessionEngine: SessionEngine;
    readonly #settingsEngine: SettingsEngine = <SettingsEngine>container.resolve(SettingsEngine);
    readonly #stateEngine: StateEngine = <StateEngine>container.resolve(StateEngine);

    #commitParameters: boolean = false;
    #commitSettings: boolean = false;
    #node: TreeNode;
    #returnDTOs: boolean = false;
    #primarySession: boolean = false;
    #primarySessionRequest: boolean = false;
    #excludeViewers: string[] = [];

    // #endregion Properties (14)

    // #region Constructors (1)

    /**
     * @ignore
     */
    constructor(properties: { id: string, ticket: string, modelViewUrl: string, bearerToken?: string, primarySession?: boolean, returnDTOs?: boolean, excludeViewers?: string[] }, callbacks: any) {
        this.#node = new TreeNode(properties.id)
        this.#sessionEngine = new SessionEngine(Object.assign({ buildDate: build_data.build_date, buildVersion: build_data.build_version }, properties));
        this.#stateEngine.createCustomState(this.id + '_settings_registered');
        this.#returnDTOs = properties.returnDTOs || false;
        this.#excludeViewers = properties.excludeViewers || [];

        this.#primarySessionRequest = properties.primarySession !== false;
        if (this.#primarySessionRequest === true) {
            if(this.#stateEngine.primarySessionLoaded.resolved === false) {
                this.#primarySession = true;
            }

            this.#stateEngine.getCustomState(this.id + '_settings_registered').then(() => {
                this.#commitParameters = this.#settingsEngine.general.viewer.commitParameters.value;
                this.#commitSettings = this.#settingsEngine.general.viewer.commitSettings.value;

                // https://shapediver.atlassian.net/browse/SS-2943
                const controlNames = this.#settingsEngine.general.parameters.controlNames.value;
                for (let k in controlNames)
                    if(this.getParameters()[k])
                        this.getParameter(k)!.displayName = controlNames[k];

                const controlOrder = this.#settingsEngine.general.parameters.controlOrder.value;
                for (let i = 0; i < controlOrder.length; i++)
                    if(this.getParameters()[controlOrder[i]])
                        this.getParameter(controlOrder[i])!.order = i;

                const parametersHidden = this.#settingsEngine.general.parameters.parametersHidden.value;
                for (let i = 0; i < parametersHidden.length; i++)
                    if(this.getParameters()[parametersHidden[i]])
                        this.getParameter(parametersHidden[i])!.hidden = true;
            })
        }
        
        callbacks.setAsPrimary = async () => {
            this.#primarySession = true;
            this.#eventEngine.emitEvent(EVENTTYPE.SESSION.SESSION_INITIALIZED, { session: this });
            this.#settingsEngine.fromJson(this.#sessionEngine.settingsConfig, this.id, this.#primarySession);
            await new Promise<void>((resolve) => this.#stateEngine.getCustomState(this.id + '_settings_registered').then(() => { resolve();}));
            this.#eventEngine.emitEvent(EVENTTYPE.SESSION.SESSION_LOADED, { session: this });
            this.#api.update();
        }

        callbacks.close = async (): Promise<boolean> => {
            const closeResult = await this.#sessionEngine.close();
            (<Tree>container.resolve(Tree)).removeNode(this.#node);
            this.#api.update();
            
            if(this.#primarySession) {
                this.#stateEngine.primarySessionLoaded.reset();
                this.#stateEngine.primarySettingsRegistered.reset();
                this.#settingsEngine.reset();
                this.#stateEngine.primarySettingsRegistered.reset();
            }
    
            this.#eventEngine.emitEvent(EVENTTYPE.SESSION.SESSION_CLOSED, {});
    
            if(!closeResult) this.#logger.warn(`Session (${this.id}): Was not able to close session completely, please disregard this session.`);
            return closeResult;
        }   
    }

    // #endregion Constructors (1)

    // #region Public Accessors (14)

    /**
     * If the session has an author ticket.
     */
    public get authorTicket(): boolean | undefined {
        return this.#sessionEngine.authorTicket;
    }

    /**
     * If the session has an author ticket.
     */
    public set authorTicket(value: boolean | undefined) {
        this.#inputValidator.validate(value, 'boolean', false);
        this.#sessionEngine.authorTicket = value;
        this.#logger.info(`Session (${this.id}): authorTicket was set to: ${value}`);
    }

    /**
     * The bearerToken of the session.
     */
    public get bearerToken(): string | undefined {
        return this.#sessionEngine.bearerToken;
    }

    /**
     * The bearerToken of the session.
     */
    public set bearerToken(value: string | undefined) {
        this.#inputValidator.validate(value, 'string', false);
        this.#sessionEngine.bearerToken = value;
        this.#logger.info(`Session (${this.id}): bearerToken was set to: ${value}`);
    }

    /**
     * The commitParameters setting of the session.
     * @return {boolean}
     */
    public get commitParameters(): boolean {
        return this.#commitParameters;
    }

    /**
     * The commitParameters setting of the session.
     * @param {boolean} value
     */
    public set commitParameters(value: boolean) {
        this.#inputValidator.validate(value, 'boolean');
        this.#commitParameters = value;
        this.#logger.info(`Session (${this.id}): commitParameters was set to: ${value}`);
    }

    /**
     * The commitSettings setting of the session.
     * @return {boolean}
     */
    public get commitSettings(): boolean {
        return this.#commitSettings;
    }

    /**
     * The commitSettings setting of the session.
     * @param {boolean} value
     */
    public set commitSettings(value: boolean) {
        this.#inputValidator.validate(value, 'boolean');
        this.#commitSettings = value;
        this.#logger.info(`Session (${this.id}): commitSettings was set to: ${value}`);
    }

    /**
     * The id of the session.
     * @return {string}
     */
    public get id(): string {
        return this.#sessionEngine.id;
    }

    /**
     * If the session was already initialized.
     * @return {boolean}
     */
    public get initialized(): boolean {
        return this.#sessionEngine.initialized;
    }

    /**
     * If the session is the primary session.
     * @return {boolean}
     */
    public get primarySession(): boolean {
        return this.#primarySession;
    }

    /**
     * If the session requests to be the primary session.
     * @return {boolean}
     */
    public get primarySessionRequest(): boolean {
        return this.#primarySessionRequest;
    }

    /**
     * The modelViewUrl of the session.
     * @return {string}
     */
    public get modelViewUrl(): string {
        return this.#sessionEngine.modelViewUrl;
    }

    /**
     * The tree node in the scene tree.
     * @return {TreeNode}
     */
    public get node(): TreeNode {
        return this.#node;
    }

    /**
     * The callback to refresh the bearer token.
     * This callback will be executed, 
     * once a session request fails due to an invalid bearer token.
     */
    public set refreshBearerToken(value: () => string) {
        this.#inputValidator.validate(value, 'function');
        this.#sessionEngine.refreshBearerToken = value;
        this.#logger.info(`Session (${this.id}): refreshBearerToken was set to: ${value}`);
    }

    /**
     * The ticket of the session.
     * @return {string}
     */
    public get ticket(): string {
        return this.#sessionEngine.ticket;
    }

    // #endregion Public Accessors (14)

    // #region Public Methods (24)

    /**
     * Create a new output with the specified id.
     * 
     * @param id the id of the output
     * @returns 
     */
    public createOutput(id: string): Output {
        this.#inputValidator.validate(id, 'string');
        this.#logger.info(`Session (${this.id}): New output created with id ${id}.`);
        return new Output(this.#sessionEngine.createOutput(id));
    }

    /**
     * Customize the session.
     * All parameter changes will be sent to the server.
     * The server computes the results, sends the results back.
     * THe results are put into the scene tree and the viewers are updated.
     * 
     * @returns 
     */
    public async customize(): Promise<TreeNode> {
        (<Tree>container.resolve(Tree)).removeNode(this.#node);
        this.#node = await this.#sessionEngine.customize();
        (<Tree>container.resolve(Tree)).addNode(this.#node);
        this.#node.excludeViewers = this.#excludeViewers;
        this.#eventEngine.emitEvent(EVENTTYPE.SESSION.SESSION_CUSTOMIZED, { session: this });
        this.#api.update();
        this.#logger.info(`Session (${this.id}): Session customized.`);
        return this.#node;
    }

    /**
     * Return the export with the specified id.
     * 
     * @param id the id of the export
     * @returns 
     */
    public getExport(id: string): Export | null {
        this.#inputValidator.validate(id, 'string');
        const exportLogic = this.#sessionEngine.getExport(id);
        if (!exportLogic) return null;
        if (!this.#exports[id]) this.#exports[id] = new Export(exportLogic);
        return this.#exports[id];
    }

    /**
     * Return the export with the specified id.
     * 
     * @param id the id of the export
     * @returns 
     */
    public getExportById(id: string): Export | null {
        this.#inputValidator.validate(id, 'string');
        const exportLogic = this.#sessionEngine.getExportById(id);
        if (!exportLogic) return null;
        if (!this.#exports[id]) this.#exports[id] = new Export(exportLogic);
        return this.#exports[id];
    }

    /**
     * Return the exports with the specified name.
     * 
     * @param name the name of the exports
     * @returns 
     */
    public getExportByName(name: string): Export[] {
        this.#inputValidator.validate(name, 'string');
        const exportLogic = this.#sessionEngine.getExportByName(name);
        const exports: Export[] = [];
        for (let i = 0; i < exportLogic.length; i++) {
            if (!this.#exports[exportLogic[i].id]) this.#exports[exportLogic[i].id] = new Export(exportLogic[i]);
            exports.push(this.#exports[exportLogic[i].id]);
        }
        return exports;
    }

    /**
     * Return the exports with the specified type.
     * 
     * @param type the type of the exports
     * @returns 
     */
    public getExportByType(type: string): Export[] {
        this.#inputValidator.validate(type, 'string');
        const exportLogic = this.#sessionEngine.getExportByType(type);
        const exports: Export[] = [];
        for (let i = 0; i < exportLogic.length; i++) {
            if (!this.#exports[exportLogic[i].id]) this.#exports[exportLogic[i].id] = new Export(exportLogic[i]);
            exports.push(this.#exports[exportLogic[i].id]);
        }
        return exports;
    }

    /**
     * Return the exports of the session as a key-value pair.
     * The id of the export is the key.
     * 
     * @returns 
     */
    public getExports(): { [key: string]: Export; } {
        const exportLogic = this.#sessionEngine.getExports();
        const exports: { [key: string]: Export; } = {};
        for (let e in exportLogic) {
            if (!this.#exports[exportLogic[e].id]) this.#exports[exportLogic[e].id] = new Export(exportLogic[e]);
            exports[e] = this.#exports[exportLogic[e].id];
        }
        return exports;
    }

    /**
     * Return the output with the specified id.
     * 
     * @param id the id of the output
     * @returns 
     */
    public getOutput(id: string): Output | null {
        this.#inputValidator.validate(id, 'string');
        const outputLogic = this.#sessionEngine.getOutput(id);
        if (!outputLogic) return null;
        if (!this.#outputs[id]) this.#outputs[id] = new Output(outputLogic);
        return this.#outputs[id];
    }

    /**
     * Return the output with the specified id.
     * 
     * @param id the id of the output
     * @returns 
     */
    public getOutputById(id: string): Output | null {
        this.#inputValidator.validate(id, 'string');
        const outputLogic = this.#sessionEngine.getOutputById(id);
        if (!outputLogic) return null;
        if (!this.#outputs[id]) this.#outputs[id] = new Output(outputLogic);
        return this.#outputs[id];
    }

    /**
     * Return the outputs with the specified name.
     * 
     * @param name the name of the outputs
     * @returns 
     */
    public getOutputByName(name: string): Output[] {
        this.#inputValidator.validate(name, 'string');
        const outputLogic = this.#sessionEngine.getOutputByName(name);
        const outputs: Output[] = [];
        for (let i = 0; i < outputLogic.length; i++) {
            if (!this.#outputs[outputLogic[i].id]) this.#outputs[outputLogic[i].id] = new Output(outputLogic[i]);
            outputs.push(this.#outputs[outputLogic[i].id]);
        }
        return outputs;
    }

    /**
     * Return the outputs of the session as a key-value pair.
     * The id of the output is the key.
     * 
     * @returns 
     */
    public getOutputs(): { [key: string]: Output; } {
        const outputLogic = this.#sessionEngine.getOutputs();
        const outputs: { [key: string]: Output; } = {};
        for (let e in outputLogic) {
            if (!this.#outputs[outputLogic[e].id]) this.#outputs[outputLogic[e].id] = new Output(outputLogic[e]);
            outputs[e] = this.#outputs[outputLogic[e].id];
        }
        return outputs;
    }

    /**
     * Return the parameter with the specified id.
     * 
     * @param id the id of the parameter
     * @returns 
     */
    public getParameter(id: string): IParameter<any> | null {
        this.#inputValidator.validate(id, 'string');
        const parameterLogic = this.#sessionEngine.getParameter(id);
        if (!parameterLogic) return null;
        if (!this.#parameters[id]) this.#parameters[id] = this.#parameterCreation(parameterLogic);
        return this.#returnDTOs ? this.#parameters[id].dto : this.#parameters[id].object;
    }

    /**
     * Return the parameter with the specified id.
     * 
     * @param id the id of the parameter
     * @returns 
     */
    public getParameterById(id: string): IParameter<any> | null {
        this.#inputValidator.validate(id, 'string');
        const parameterLogic = this.#sessionEngine.getParameterById(id);
        if (!parameterLogic) return null;
        if (!this.#parameters[id]) this.#parameters[id] = this.#parameterCreation(parameterLogic);
        return this.#returnDTOs ? this.#parameters[id].dto : this.#parameters[id].object;
    }

    /**
     * Return the parameters with the specified name.
     * 
     * @param name the name of the parameters
     * @returns 
     */
    public getParameterByName(name: string): IParameter<any>[] {
        this.#inputValidator.validate(name, 'string');
        const parameterLogic = this.#sessionEngine.getParameterByName(name);
        const parameters: IParameter<any>[] = [];
        for (let i = 0; i < parameterLogic.length; i++) {
            if (!this.#parameters[parameterLogic[i].id]) this.#parameters[parameterLogic[i].id] = this.#parameterCreation(parameterLogic[i]);
            parameters.push(this.#returnDTOs ? this.#parameters[parameterLogic[i].id].dto : this.#parameters[parameterLogic[i].id].object);
        }
        return parameters;
    }

    /**
     * Return the parameters with the specified type.
     * 
     * @param type the type of the parameters
     * @returns 
     */
    public getParameterByType(type: string): IParameter<any>[] {
        this.#inputValidator.validate(type, 'string');
        const parameterLogic = this.#sessionEngine.getParameterByType(type);
        const parameters: IParameter<any>[] = [];
        for (let i = 0; i < parameterLogic.length; i++) {
            if (!this.#parameters[parameterLogic[i].id]) this.#parameters[parameterLogic[i].id] = this.#parameterCreation(parameterLogic[i]);
            parameters.push(this.#returnDTOs ? this.#parameters[parameterLogic[i].id].dto : this.#parameters[parameterLogic[i].id].object);
        }
        return parameters;
    }

    /**
     * Return the parameters of the session as a key-value pair.
     * The id of the parameter is the key.
     * 
     * @returns 
     */
    public getParameters(): { [key: string]: IParameter<any>; } {
        const parameterLogic = this.#sessionEngine.getParameters();
        const parameters: { [key: string]: IParameter<any>; } = {};
        for (let e in parameterLogic) {
            if (!this.#parameters[parameterLogic[e].id]) this.#parameters[parameterLogic[e].id] = this.#parameterCreation(parameterLogic[e]);
            parameters[e] = this.#returnDTOs ? this.#parameters[parameterLogic[e].id].dto : this.#parameters[parameterLogic[e].id].object;
        }
        return parameters;
    }

    /**
     * Initialize the session.
     * Normally, there is no need to call this function.
     * The initialization is done on creation via the api.
     * 
     * @returns 
     */
    public async init(): Promise<TreeNode> {
        this.#node = await this.#sessionEngine.init();
        (<Tree>container.resolve(Tree)).addNode(this.#node);
        this.#node.excludeViewers = this.#excludeViewers;
        this.#logger.info(`Session (${this.id}): Session initialized.`);
        this.#eventEngine.emitEvent(EVENTTYPE.SESSION.SESSION_INITIALIZED, { session: this });

        this.#settingsEngine.fromJson(this.#sessionEngine.settingsConfig, this.id, this.#primarySession);
        await new Promise<void>((resolve) => this.#stateEngine.getCustomState(this.id + '_settings_registered').then(() => { resolve();}));

        this.#eventEngine.emitEvent(EVENTTYPE.SESSION.SESSION_LOADED, { session: this });
        this.#api.update();
        return this.#node;
    }

    /**
     * Save the parameters that are currently used for this session as default parameters.
     * This only works when this session was created with an author ticket.
     * 
     * @returns 
     */
    public async saveDefaultParameters() {
        const response = await this.#sessionEngine.saveDefaultParameters();
        this.#logger.info(`Session (${this.id}): ${response ? 'Saved default parameters.' : 'Could not save default parameters.'}`);
        return response;
    }

    /**
     * Save the settings that are currently used for this session.
     * If there is multiple viewers, the first one will be used for the settings.
     * This only works when this session was created with an author ticket.
     *
     * @param viewerId the optional viewer id
     */
    public async saveSettings(viewerId?: string): Promise<boolean> {
        this.#settingsEngine.general.viewer.commitParameters.value = this.#commitParameters;
        this.#settingsEngine.general.viewer.commitSettings.value = this.#commitSettings;

        // https://shapediver.atlassian.net/browse/SS-2943
        const parameters = this.getParameters();

        const controlNames: { [key: string]: string } = {};
        for (let p in parameters)
            if (parameters[p].displayName)
                controlNames[p] = parameters[p].displayName!;
        this.#settingsEngine.general.parameters.controlNames.value = controlNames;

        const parametersOrdered: IParameter<any>[] = [];
        for (let p in parameters) parametersOrdered.push(parameters[p]);
        parametersOrdered.sort((a, b) => ((a.order || Infinity) - (b.order || Infinity)));
        this.#settingsEngine.general.parameters.controlOrder.value = parametersOrdered.map((value) => { return value.id; });

        const parametersHidden: string[] = [];
        for (let p in parameters)
            if (parameters[p].hidden) parametersHidden.push(p);
        this.#settingsEngine.general.parameters.parametersHidden.value = parametersHidden;

        this.#settingsEngine.general.build_version.value = build_data.build_version;
        this.#settingsEngine.general.build_date.value = build_data.build_date;
        this.#settingsEngine.general.settings_version.value = '2.0';

        if (Object.values(this.#api.getViewers()).length !== 0) {
            let viewer = viewerId ? this.#api.getViewers()[viewerId] : null;
            if (!viewer)
                viewer = Object.values(this.#api.getViewers())[0];

            const renderingEngines = (<RenderingEngine[]>container.resolveAll('renderingEngine'));
            let renderingEngine: RenderingEngine;
            for (let i = 0; i < renderingEngines.length; i++)
                if (renderingEngines[i].id === viewer.id)
                    renderingEngine = renderingEngines[i];

            renderingEngine!.saveSettings();

            const json = this.#settingsEngine.toJson();
            const response = await this.#sessionEngine.saveSettings(json);
            this.#logger.info(`Session (${this.id}): ${response ? 'Saved settings.' : 'Could not save settings.'}`);
            return response;
        }

        this.#logger.warn(`Session (${this.id}): Could not save settings, no viewer initialized.`);
        return false;
    }

    /**
     * Changes the value property of the parameter with the specified id.
     * 
     * @param id the id of the parameter
     * @param value the value property of the parameter
     * @returns 
     */
    public updateParameter(id: string, value: any): boolean {
        this.#inputValidator.validate(id, 'string');
        const parameterLogic = this.#sessionEngine.getParameterById(id);
        if (!parameterLogic) return false;
        if (!this.#parameters[id]) this.#parameters[id] = this.#parameterCreation(parameterLogic);
        this.#parameters[id].object.value = value;
        this.#parameters[id].dto.value = value;
        return true;
    }

    /**
     * Changes the displayName property of the parameter with the specified id.
     * 
     * @param id the id of the parameter
     * @param displayName the displayName property of the parameter
     * @returns 
     */
    public updateParameterDisplayName(id: string, displayName: string): boolean {
        this.#inputValidator.validate(id, 'string');
        this.#inputValidator.validate(displayName, 'string');
        const parameterLogic = this.#sessionEngine.getParameterById(id);
        if (!parameterLogic) return false;
        if (!this.#parameters[id]) this.#parameters[id] = this.#parameterCreation(parameterLogic);
        this.#parameters[id].object.displayName = displayName;
        this.#parameters[id].dto.displayName = displayName;
        return true;
    }

    /**
     * Changes the hidden property of the parameter with the specified id.
     * 
     * @param id the id of the parameter
     * @param hidden the hidden property of the parameter
     * @returns 
     */
    public updateParameterHidden(id: string, hidden: boolean): boolean {
        this.#inputValidator.validate(id, 'string');
        this.#inputValidator.validate(hidden, 'boolean');
        const parameterLogic = this.#sessionEngine.getParameterById(id);
        if (!parameterLogic) return false;
        if (!this.#parameters[id]) this.#parameters[id] = this.#parameterCreation(parameterLogic);
        this.#parameters[id].object.hidden = hidden;
        this.#parameters[id].dto.hidden = hidden;
        return true;
    }

    /**
     * Changes the order property of the parameter with the specified id.
     * 
     * @param id the id of the parameter
     * @param order the order property of the parameter
     * @returns 
     */
    public updateParameterOrder(id: string, order: number): boolean {
        this.#inputValidator.validate(id, 'string');
        this.#inputValidator.validate(order, 'number');
        const parameterLogic = this.#sessionEngine.getParameterById(id);
        if (!parameterLogic) return false;
        if (!this.#parameters[id]) this.#parameters[id] = this.#parameterCreation(parameterLogic);
        this.#parameters[id].object.order = order;
        this.#parameters[id].dto.order = order;
        return true;
    }

    // #endregion Public Methods (24)
}
