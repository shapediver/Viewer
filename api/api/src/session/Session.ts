import { Tree, TreeNode } from "@shapediver/viewer.shared.node-tree";
import { ISession, Session as SessionEngine } from "@shapediver/viewer.session-engine.session-engine";
import { Export } from "./Export";
import { Output } from "./Output";
import { container, injectable } from "tsyringe";
import { Viewer } from "../viewer/Viewer";
import { Logger } from "@shapediver/viewer.shared.monitoring";
import { EventEngine, EVENTTYPE, SettingsEngine, StateEngine } from "@shapediver/viewer.shared.services";
import { InputValidator } from "@shapediver/viewer.shared.utils";
import { RenderingEngine } from "@shapediver/viewer.rendering-engine-threejs.rendering-engine";
import { build_data } from "../build_data";
import { Api } from "../Api";
import { Parameter, PARAMETERTYPE } from "./Parameter";
import { FileParameter } from "./FileParameter";
import { vec3 } from "gl-matrix";

@injectable()
export class Session {
    // #region Properties (17)

    readonly #api: Api = <Api>container.resolve(Api);
    readonly #eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);
    readonly #exportCallbacks: { [key: string]: { [key: string]: (value: any) => any } } = {};
    readonly #exports: { [key: string]: Export; } = {};
    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #outputCallbacks: { [key: string]: { [key: string]: (value: any) => any } } = {};
    readonly #outputs: { [key: string]: Output; } = {};
    readonly #parameterCallbacks: { [key: string]: { [key: string]: (value: any) => any } } = {};
    readonly #parameters: { [key: string]: Parameter<any> } = {};
    readonly #sessionEngine: SessionEngine;
    readonly #settingsEngine: SettingsEngine = <SettingsEngine>container.resolve(SettingsEngine);
    readonly #stateEngine: StateEngine = <StateEngine>container.resolve(StateEngine);

    #commitParameters: boolean = false;
    #commitSettings: boolean = false;
    #excludeViewers: string[] = [];
    #node: TreeNode;
    #primarySession: boolean = false;
    #primarySessionRequest: boolean = false;

    // #endregion Properties (17)

    // #region Constructors (1)

    /**
     * @ignore
     */
    constructor(properties: { id: string, ticket: string, modelViewUrl: string, bearerToken?: string, primarySession?: boolean, excludeViewers?: string[] }, callbacks: any) {
        this.#node = new TreeNode(properties.id)
        this.#sessionEngine = new SessionEngine(Object.assign({ buildDate: build_data.build_date, buildVersion: build_data.build_version }, properties));
        this.#stateEngine.createCustomState(this.id + '_settings_registered');
        this.#excludeViewers = properties.excludeViewers || [];

        this.#primarySessionRequest = properties.primarySession !== false;
        if (this.#primarySessionRequest === true) {
            if (this.#stateEngine.primarySessionLoaded.resolved === false) {
                this.#primarySession = true;
            }

            this.#stateEngine.getCustomState(this.id + '_settings_registered').then(() => {
                this.#commitParameters = this.#settingsEngine.general.viewer.commitParameters.value;
                this.#commitSettings = this.#settingsEngine.general.viewer.commitSettings.value;

                const controlNames = this.#settingsEngine.general.parameters.controlNames.value;
                for (let k in controlNames) {
                    if (this.#parameters[k])
                        this.#parameters[k]!.displayName = controlNames[k];
                    if (this.#exports[k])
                        this.#exports[k]!.displayName = controlNames[k];
                }

                const controlOrder = this.#settingsEngine.general.parameters.controlOrder.value;
                for (let i = 0; i < controlOrder.length; i++) {
                    if (this.#parameters[controlOrder[i]])
                        this.#parameters[controlOrder[i]]!.order = i;
                    if (this.#exports[controlOrder[i]])
                        this.#exports[controlOrder[i]]!.order = i;
                }

                const parametersHidden = this.#settingsEngine.general.parameters.parametersHidden.value;
                for (let i = 0; i < parametersHidden.length; i++) {
                    if (this.#parameters[parametersHidden[i]])
                        this.#parameters[parametersHidden[i]]!.hidden = true;
                    if (this.#exports[parametersHidden[i]])
                        this.#exports[parametersHidden[i]]!.hidden = true;
                }
            })
        }

        callbacks.setAsPrimary = async () => {
            this.#primarySession = true;
            this.#eventEngine.emitEvent(EVENTTYPE.SESSION.SESSION_INITIALIZED, { session: this });
            this.#settingsEngine.fromJson(this.#sessionEngine.settingsConfig, this.id, this.#primarySession);
            await new Promise<void>((resolve) => this.#stateEngine.getCustomState(this.id + '_settings_registered').then(() => { resolve(); }));
            this.#eventEngine.emitEvent(EVENTTYPE.SESSION.SESSION_LOADED, { session: this });
            this.#api.update();
        }

        callbacks.close = async (): Promise<boolean> => {
            const closeResult = await this.#sessionEngine.close();
            (<Tree>container.resolve(Tree)).removeNode(this.#node);
            this.#api.update();

            if (this.#primarySession) {
                this.#stateEngine.primarySessionLoaded.reset();
                this.#stateEngine.primarySettingsRegistered.reset();
                this.#settingsEngine.reset();
                this.#stateEngine.primarySettingsRegistered.reset();
            }

            this.#eventEngine.emitEvent(EVENTTYPE.SESSION.SESSION_CLOSED, {});

            if (!closeResult) this.#logger.warn(`Session (${this.id}): Was not able to close session completely, please disregard this session.`);
            return closeResult;
        }
    }

    // #endregion Constructors (1)

    // #region Public Accessors (18)

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
     * Return the exports of the session as a key-value pair.
     * The id of the export is the key.
     * 
     * @returns 
     */
    public get exports(): { [key: string]: Export; } {
        return this.#exports;
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
     * Return the outputs of the session as a key-value pair.
     * The id of the output is the key.
     * 
     * @returns 
     */
    public get outputs(): { [key: string]: Output; } {
        return this.#outputs;
    }

    /**
     * Return the parameters of the session as a key-value pair.
     * The id of the parameter is the key.
     * 
     * @returns 
     */
    public get parameters(): { [key: string]: Parameter<any>; } {
        return this.#parameters;
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

    // #endregion Public Accessors (18)

    // #region Public Methods (15)

    /**
     * Create a new output with the specified id.
     * 
     * @param id the id of the output
     * @returns 
     */
    public createOutput(id: string): Output {
        // https://shapediver.atlassian.net/browse/SS-3090
        throw new Error();
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

        // load file parameter first
        for (const parameterId in this.#parameters) {
            if (this.#parameters[parameterId] instanceof FileParameter) {
                const id = await (<FileParameter>this.#parameters[parameterId]).upload();
                this.#parameters[parameterId] = id;
            }
        }
        const parameterSet: {
            [key: string]: {
                value: any,
                valueString: string
            }
        } = {};

        // create a set of the current validated parameter values
        for (const parameterId in this.#parameters) {
            this.#parameters[parameterId].validate();
            parameterSet[parameterId] = {
                value: this.#parameters[parameterId].value,
                valueString: this.#parameters[parameterId].stringify()
            }
        }

        // update the session engine parameter values if everything succeeded
        for (const parameterId in this.#parameters)
            this.#sessionEngine.parameterValues[parameterId] = parameterSet[parameterId].valueString;

        this.#node = await this.#sessionEngine.customize();

        for (let o in this.#sessionEngine.outputs) {
            // will be filled by the exports
            this.#outputCallbacks[o] = {};
            this.#outputs[o] = new Output(this.#sessionEngine, this.#sessionEngine.outputs[o], this.#outputCallbacks[o]);
        }

        // set the session values to the current ones in all parameters
        for (const parameterId in this.#parameters)
            this.#parameterCallbacks[parameterId].updateSessionValue(parameterSet[parameterId].value);

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
    public getExportById(id: string): Export | null {
        this.#inputValidator.validate(id, 'string');
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
        const exports: Export[] = [];
        for (let exportId in this.#exports) {
            if (name === this.#exports[exportId].name)
                exports.push(this.#exports[exportId])
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
        const exports: Export[] = [];
        for (let exportId in this.#exports) {
            if (type === this.#exports[exportId].type)
                exports.push(this.#exports[exportId])
        }
        return exports;
    }

    /**
     * Return the output with the specified id.
     * 
     * @param id the id of the output
     * @returns 
     */
    public getOutputById(id: string): Output | null {
        this.#inputValidator.validate(id, 'string');
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
        const outputs: Output[] = [];
        for (let outputId in this.#outputs) {
            if (name === this.#outputs[outputId].name)
                outputs.push(this.#outputs[outputId])
        }
        return outputs;
    }

    /**
     * Return the parameter with the specified id.
     * 
     * @param id the id of the parameter
     * @returns 
     */
    public getParameterById(id: string): Parameter<any> | null {
        this.#inputValidator.validate(id, 'string');
        return this.#parameters[id];
    }

    /**
     * Return the parameters with the specified name.
     * 
     * @param name the name of the parameters
     * @returns 
     */
    public getParameterByName(name: string): Parameter<any>[] {
        this.#inputValidator.validate(name, 'string');
        const parameters: Parameter<any>[] = [];
        for (let parameterId in this.#parameters) {
            if (name === this.#parameters[parameterId].name)
                parameters.push(this.#parameters[parameterId])
        }
        return parameters;
    }

    /**
     * Return the parameters with the specified type.
     * 
     * @param type the type of the parameters
     * @returns 
     */
    public getParameterByType(type: string): Parameter<any>[] {
        this.#inputValidator.validate(type, 'string');
        const parameters: Parameter<any>[] = [];
        for (let parameterId in this.#parameters) {
            if (type === this.#parameters[parameterId].type)
                parameters.push(this.#parameters[parameterId])
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
        for (let p in this.#sessionEngine.parameters) {
            const param = this.#sessionEngine.parameters[p];

            // will be filled by the parameters
            this.#parameterCallbacks[p] = {};
            switch (true) {
                case param.type === PARAMETERTYPE.BOOL || param.type === PARAMETERTYPE.SBOOL:
                    this.#parameters[p] = new Parameter<boolean>(this.#sessionEngine, this.#sessionEngine.parameters[p], this.#parameterCallbacks[p]);
                    break;
                case param.type === PARAMETERTYPE.COLOR || param.type === PARAMETERTYPE.SCOLOR:
                    this.#parameters[p] = new Parameter<number | vec3>(this.#sessionEngine, this.#sessionEngine.parameters[p], this.#parameterCallbacks[p]);
                    break;
                case param.type === PARAMETERTYPE.FILE:
                    this.#parameters[p] = new FileParameter(this.#sessionEngine, this.#sessionEngine.parameters[p], this.#parameterCallbacks[p]);
                    break;
                case param.type === PARAMETERTYPE.EVEN || param.type === PARAMETERTYPE.FLOAT || param.type === PARAMETERTYPE.INT || param.type === PARAMETERTYPE.ODD || param.type === PARAMETERTYPE.SINTEGER || param.type === PARAMETERTYPE.SNUMBER:
                    this.#parameters[p] = new Parameter<number>(this.#sessionEngine, this.#sessionEngine.parameters[p], this.#parameterCallbacks[p]);
                    break;
                default:
                    this.#parameters[p] = new Parameter<string>(this.#sessionEngine, this.#sessionEngine.parameters[p], this.#parameterCallbacks[p]);
                    break;
            }
        }

        for (let e in this.#sessionEngine.exports) {
            // will be filled by the exports
            this.#exportCallbacks[e] = {};
            this.#exports[e] = new Export(this.#sessionEngine, this.#sessionEngine.exports[e], this.#exportCallbacks[e]);
        }
        
        for (let o in this.#sessionEngine.outputs) {
            // will be filled by the exports
            this.#outputCallbacks[o] = {};
            this.#outputs[o] = new Output(this.#sessionEngine, this.#sessionEngine.outputs[o], this.#outputCallbacks[o]);
        }

        (<Tree>container.resolve(Tree)).addNode(this.#node);
        this.#node.excludeViewers = this.#excludeViewers;
        this.#logger.info(`Session (${this.id}): Session initialized.`);
        this.#eventEngine.emitEvent(EVENTTYPE.SESSION.SESSION_INITIALIZED, { session: this });

        this.#settingsEngine.fromJson(this.#sessionEngine.settingsConfig, this.id, this.#primarySession);
        await new Promise<void>((resolve) => this.#stateEngine.getCustomState(this.id + '_settings_registered').then(() => { resolve(); }));

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

        const parameters = this.#parameters;
        for (let p in parameters) parameters[p].validate();

        const exports = this.#exports;
        for (let e in exports) exports[e].validate();

        const displayNames: { [key: string]: string } = {};
        for (let p in parameters)
            if (parameters[p].displayName)
                displayNames[p] = parameters[p].displayName!;
        for (let e in exports)
            if (exports[e].displayName)
                displayNames[e] = exports[e].displayName!;
        this.#settingsEngine.general.parameters.controlNames.value = displayNames;

        let ordered: (Parameter<any> | Export)[] = [];
        for (let p in parameters) ordered.push(parameters[p]);
        for (let e in exports) ordered.push(exports[e]);
        ordered.sort((a, b) => ((a.order || Infinity) - (b.order || Infinity)));
        let zeros = ordered.filter(x => x.order === 0);
        ordered = ordered.filter((el) => { return !zeros.includes(el); });
        ordered = zeros.concat(ordered);
        this.#settingsEngine.general.parameters.controlOrder.value = ordered.map((value) => { return value.id; });

        const hidden: string[] = [];
        for (let p in parameters)
            if (parameters[p].hidden) hidden.push(p);
        for (let e in exports)
            if (exports[e].hidden) hidden.push(e);
        this.#settingsEngine.general.parameters.parametersHidden.value = hidden;

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

    // #endregion Public Methods (15)
}
