import { Tree, TreeNode } from "@shapediver/viewer.shared.node-tree";
import { ISession, PARAMETERTYPE, Session as SessionEngine } from "@shapediver/viewer.session-engine.session-engine";
import { Export } from "./Export";
import { Output } from "./Output";
import { AbstractParameter } from "./parameters/objects/AbstractParameter";
import { container, injectable } from "tsyringe";
import { Viewer } from "../viewer/Viewer";
import { Logger } from "@shapediver/viewer.shared.monitoring";
import { EventEngine, EVENTTYPE, SettingsEngine, StateEngine } from "@shapediver/viewer.shared.services";
import { InputValidator } from "@shapediver/viewer.shared.utils";
import { Parameter as ParameterLogic, FileParameter as FileParameterLogic } from "@shapediver/viewer.session-engine.session-engine";
import { FileParameter } from "./parameters/objects/FileParameter";
import { BooleanParameter } from "./parameters/objects/BooleanParameter";
import { NumberParameter } from "./parameters/objects/NumberParameter";
import { StringParameter } from "./parameters/objects/StringParameter";
import { RenderingEngine } from "@shapediver/viewer.rendering-engine-threejs.rendering-engine";
import { build_data } from "../build_data";
import { ColorParameter } from "./parameters/objects/ColorParameter";

@injectable()
export class Session implements ISession {
    // #region Properties (16)

    readonly #eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);
    readonly #exports: { [key: string]: Export; } = {};
    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #outputs: { [key: string]: Output; } = {};
    readonly #parameterCreation = (parameterLogic: ParameterLogic | FileParameterLogic): AbstractParameter<any> => {
        switch (true) {
            case parameterLogic.type === PARAMETERTYPE.FILE:
                return new FileParameter(<FileParameterLogic>parameterLogic);
            case parameterLogic.type === PARAMETERTYPE.BOOL:
                return new BooleanParameter(<ParameterLogic>parameterLogic);
            case parameterLogic.type === PARAMETERTYPE.COLOR:
                return new ColorParameter(<ParameterLogic>parameterLogic);
            case parameterLogic.type === PARAMETERTYPE.FLOAT || parameterLogic.type === PARAMETERTYPE.EVEN || parameterLogic.type === PARAMETERTYPE.ODD || parameterLogic.type === PARAMETERTYPE.INT:
                return new NumberParameter(<ParameterLogic>parameterLogic);
            default:
                return new StringParameter(<ParameterLogic>parameterLogic);
        }
    }

    readonly #parameters: { [key: string]: AbstractParameter<any>; } = {};
    readonly #sessionEngine: SessionEngine;
    readonly #settingsEngine: SettingsEngine = <SettingsEngine>container.resolve(SettingsEngine);
    readonly #stateEngine: StateEngine = <StateEngine>container.resolve(StateEngine);

    #commitParameters: boolean = false;
    #commitSettings: boolean = false;
    #node: TreeNode;
    #returnDTOs: boolean = false;

    // #endregion Properties (16)

    // #region Constructors (1)

    /**
     * @ignore
     */
    constructor(properties: { id: string, ticket: string, modelViewUrl: string, bearerToken?: string, loadDefaultSettings?: boolean, returnDTOs?: boolean }) {
        this.#node = new TreeNode(properties.id)
        this.#sessionEngine = new SessionEngine(Object.assign({ buildDate: build_data.build_date, buildVersion: build_data.build_version }, properties));
        this.#stateEngine.createCustomState(this.id + '_settings_registered');
        this.#returnDTOs = properties.returnDTOs || false;

        if (properties.loadDefaultSettings !== false)
            this.#stateEngine.getCustomState(this.id + '_settings_registered').then(() => {
                this.#commitParameters = this.#settingsEngine.general.viewer.commitParameters.value;
                this.#commitSettings = this.#settingsEngine.general.viewer.commitSettings.value;
                
                // TODO also exports
                const controlNames = this.#settingsEngine.general.parameters.controlNames.value;
                for(let k in controlNames)
                    this.getParameter(k)!.displayName = controlNames[k];

                const controlOrder = this.#settingsEngine.general.parameters.controlOrder.value;
                for(let i = 0; i < controlOrder.length; i++)
                    this.getParameter(controlOrder[i])!.order = i;

                
                const parametersHidden = this.#settingsEngine.general.parameters.parametersHidden.value;
                for(let i = 0; i < parametersHidden.length; i++)
                    this.getParameter(parametersHidden[i])!.hidden = true;
            })
    }

    // #endregion Constructors (1)

    // #region Public Accessors (20)

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

    // #endregion Public Accessors (20)

    // #region Public Methods (19)

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
        this.#eventEngine.emitEvent(EVENTTYPE.SESSION.SESSION_CUSTOMIZED, { session: this });
        if (container.isRegistered('viewer')) (<Viewer[]>container.resolveAll('viewer')).forEach(v => v.update());
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
    public getParameter(id: string): AbstractParameter<any> | null {
        this.#inputValidator.validate(id, 'string');
        const parameterLogic = this.#sessionEngine.getParameter(id);
        if (!parameterLogic) return null;
        if (!this.#parameters[id]) this.#parameters[id] = this.#parameterCreation(parameterLogic);
        return this.#parameters[id];
    }

    /**
     * Return the parameter with the specified id.
     * 
     * @param id the id of the parameter
     * @returns 
     */
    public getParameterById(id: string): AbstractParameter<any> | null {
        this.#inputValidator.validate(id, 'string');
        const parameterLogic = this.#sessionEngine.getParameterById(id);
        if (!parameterLogic) return null;
        if (!this.#parameters[id]) this.#parameters[id] = this.#parameterCreation(parameterLogic);
        return this.#parameters[id];
    }

    /**
     * Return the parameters with the specified name.
     * 
     * @param name the name of the parameters
     * @returns 
     */
    public getParameterByName(name: string): AbstractParameter<any>[] {
        this.#inputValidator.validate(name, 'string');
        const parameterLogic = this.#sessionEngine.getParameterByName(name);
        const parameters: AbstractParameter<any>[] = [];
        for (let i = 0; i < parameterLogic.length; i++) {
            if (!this.#parameters[parameterLogic[i].id]) this.#parameters[parameterLogic[i].id] = this.#parameterCreation(parameterLogic[i]);
            parameters.push(this.#parameters[parameterLogic[i].id]);
        }
        return parameters;
    }

    /**
     * Return the parameters with the specified type.
     * 
     * @param type the type of the parameters
     * @returns 
     */
    public getParameterByType(type: string): AbstractParameter<any>[] {
        this.#inputValidator.validate(type, 'string');
        const parameterLogic = this.#sessionEngine.getParameterByType(type);
        const parameters: AbstractParameter<any>[] = [];
        for (let i = 0; i < parameterLogic.length; i++) {
            if (!this.#parameters[parameterLogic[i].id]) this.#parameters[parameterLogic[i].id] = this.#parameterCreation(parameterLogic[i]);
            parameters.push(this.#parameters[parameterLogic[i].id]);
        }
        return parameters;
    }

    /**
     * Return the parameters of the session as a key-value pair.
     * The id of the parameter is the key.
     * 
     * @returns 
     */
    public getParameters(): { [key: string]: AbstractParameter<any>; } {
        const parameterLogic = this.#sessionEngine.getParameters();
        const parameters: { [key: string]: AbstractParameter<any>; } = {};
        for (let e in parameterLogic) {
            if (!this.#parameters[parameterLogic[e].id]) this.#parameters[parameterLogic[e].id] = this.#parameterCreation(parameterLogic[e]);
            parameters[e] = this.#parameters[parameterLogic[e].id];
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
    public async init(loadDefaultSettings: boolean = true): Promise<TreeNode> {
        this.#node = await this.#sessionEngine.init();
        (<Tree>container.resolve(Tree)).addNode(this.#node);
        if (container.isRegistered('viewer')) (<Viewer[]>container.resolveAll('viewer')).forEach(v => v.update());
        this.#logger.info(`Session (${this.id}): Session initialized.`);
        this.#eventEngine.emitEvent(EVENTTYPE.SESSION.SESSION_INITIALIZED, { session: this });

        // await the settings loading of this session before resolving
        if (loadDefaultSettings !== false && this.#stateEngine.getCustomState(this.id + '_settings_registered').resolved === false)
            await new Promise<void>((resolve) => this.#stateEngine.getCustomState(this.id + '_settings_registered').then(() => resolve));
            
        this.#eventEngine.emitEvent(EVENTTYPE.SESSION.SESSION_LOADED, { session: this });

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

        // TODO also exports
        const parameters = this.getParameters();

        const controlNames: {[key: string]: string} = {};
        for(let p in parameters)
            if(parameters[p].displayName)
                controlNames[p] = parameters[p].displayName!;
        this.#settingsEngine.general.parameters.controlNames.value = controlNames;

        const parametersOrdered: AbstractParameter<any>[] = [];
        for(let p in parameters) parametersOrdered.push(parameters[p]);
        parametersOrdered.sort((a, b) => ((a.order || -1) - (b.order || -1)));
        this.#settingsEngine.general.parameters.controlOrder.value = parametersOrdered.map((value) => { return value.id; });

        const parametersHidden: string[] = [];
        for(let p in parameters)
            if(parameters[p].hidden) parametersHidden.push(p);
        this.#settingsEngine.general.parameters.parametersHidden.value = parametersHidden;

        this.#settingsEngine.general.build_version.value = build_data.build_version;
        this.#settingsEngine.general.build_date.value = build_data.build_date;
        this.#settingsEngine.general.settings_version.value = '2.0';

        if (container.isRegistered('viewer')) {
            const viewers = (<Viewer[]>container.resolveAll('viewer'));
            let viewer;
            for (let i = 0; i < viewers.length; i++)
                if (viewers[i].id === viewerId)
                    viewer = viewers[i];
            if (!viewer)
                viewer = viewers[0];

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

    // #endregion Public Methods (19)
}
