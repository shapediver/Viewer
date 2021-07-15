import { Tree, TreeNode } from '@shapediver/viewer.shared.node-tree'
import { ISession, Session as SessionEngine } from '@shapediver/viewer.session-engine.session-engine'
import { container, injectable } from 'tsyringe'
import { Logger, LOGGINGTOPIC } from '@shapediver/viewer.shared.utils'
import { EventEngine, EVENTTYPE, SettingsEngine, StateEngine } from '@shapediver/viewer.shared.services'
import { InputValidator } from '@shapediver/viewer.shared.utils'
import { RenderingEngine } from '@shapediver/viewer.rendering-engine-threejs.rendering-engine'
import { build_data } from '@shapediver/viewer.shared.build-data'
import { vec3 } from 'gl-matrix'
import { SDError } from '@shapediver/viewer.shared.utils'

import { Export } from './Export'
import { Output } from './Output'
import { Viewer } from '../viewer/Viewer'
import { Api } from '../Api'
import { Parameter, PARAMETERTYPE } from './Parameter'
import { FileParameter } from './FileParameter'

@injectable()
export class Session {
    // #region Properties (23)

    readonly #api: Api = <Api>container.resolve(Api);
    readonly #eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);
    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #sessionEngine: SessionEngine;
    readonly #settingsEngine: SettingsEngine = <SettingsEngine>container.resolve(SettingsEngine);
    readonly #stateEngine: StateEngine = <StateEngine>container.resolve(StateEngine);
    readonly #updateCB = () => {
        (<any>this.authorTicket) = this.#sessionEngine.authorTicket;
        (<any>this.bearerToken) = this.#sessionEngine.bearerToken;
        (<any>this.initialized) = this.#sessionEngine.initialized;
    }

    readonly authorTicket: boolean | undefined;
    readonly bearerToken: string | undefined;
    readonly commitParameters: boolean = false;
    readonly commitSettings: boolean = false;
    readonly exports: { [key: string]: Export; } = {};
    readonly id: string;
    readonly initialized: boolean = false;
    readonly modelViewUrl: string;
    readonly node: TreeNode;
    readonly outputs: { [key: string]: Output; } = {};
    readonly parameters: { [key: string]: Parameter<any> } = {};
    readonly primarySession: boolean = false;
    readonly primarySessionRequest: boolean = false;
    readonly ticket: string;

    #excludeViewers: string[] = [];

    // #endregion Properties (23)

    // #region Constructors (1)

    /**
     * @ignore
     */
    constructor(properties: { id: string, ticket: string, modelViewUrl: string, bearerToken?: string, primarySession?: boolean, excludeViewers?: string[] }, callbacks: any) {
        try {
            this.node = new TreeNode(properties.id);
            this.#sessionEngine = new SessionEngine(Object.assign({ buildDate: build_data.build_date, buildVersion: build_data.build_version }, properties));
            this.id = this.#sessionEngine.id;
            this.ticket = this.#sessionEngine.ticket;
            this.modelViewUrl = this.#sessionEngine.modelViewUrl;
            this.#stateEngine.createCustomState(this.id + '_settings_registered');
            this.#excludeViewers = properties.excludeViewers || [];

            this.primarySessionRequest = properties.primarySession !== false;
            if (this.primarySessionRequest === true) {
                if (this.#stateEngine.primarySessionLoaded.resolved === false) {
                    this.primarySession = true;
                    this.#logger.info(LOGGINGTOPIC.SESSION, `Session(${this.id}): This is now the primary session.`);
                }

                this.#stateEngine.getCustomState(this.id + '_settings_registered').then(() => {
                    (<any>this.commitParameters) = this.#settingsEngine.general.viewer.commitParameters.value;
                    (<any>this.commitSettings) = this.#settingsEngine.general.viewer.commitSettings.value;

                    const controlNames = this.#settingsEngine.general.parameters.controlNames.value;
                    for (let k in controlNames) {
                        if (this.parameters[k])
                            this.parameters[k]!.updateDisplayName(controlNames[k]);
                        if (this.exports[k])
                            this.exports[k]!.updateDisplayName(controlNames[k]);
                    }

                    const controlOrder = this.#settingsEngine.general.parameters.controlOrder.value;
                    for (let i = 0; i < controlOrder.length; i++) {
                        if (this.parameters[controlOrder[i]])
                            this.parameters[controlOrder[i]]!.updateOrder(i);
                        if (this.exports[controlOrder[i]])
                            this.exports[controlOrder[i]]!.updateOrder(i);
                    }

                    const parametersHidden = this.#settingsEngine.general.parameters.parametersHidden.value;
                    for (let i = 0; i < parametersHidden.length; i++) {
                        if (this.parameters[parametersHidden[i]])
                            this.parameters[parametersHidden[i]]!.updateHidden(true);
                        if (this.exports[parametersHidden[i]])
                            this.exports[parametersHidden[i]]!.updateHidden(true);
                    }
                })
            }

            callbacks.setAsPrimary = async () => {
                try {
                    (<any>this.primarySession) = true;
                    this.#eventEngine.emitEvent(EVENTTYPE.SESSION.SESSION_INITIALIZED, { session: this });
                    this.#settingsEngine.fromJson(this.#sessionEngine.settingsConfig, this.id, this.primarySession);
                    await new Promise<void>((resolve) => this.#stateEngine.getCustomState(this.id + '_settings_registered').then(() => { resolve(); }));
                    this.#eventEngine.emitEvent(EVENTTYPE.SESSION.SESSION_LOADED, { session: this });
                    this.#api.update();
                    this.#logger.info(LOGGINGTOPIC.SESSION, `Session(${this.id}).setAsPrimary: This is now the primary session.`);
                } catch (e) {
                    if (e instanceof SDError) throw e;
                    throw this.#logger.error(LOGGINGTOPIC.SESSION, new SDError(e.message, e), `Session(${this.id}).setAsPrimary: Something unexpected happened.`, true)
                }
            }

            callbacks.close = async (): Promise<boolean> => {
                try {
                    const closeResult = await this.#sessionEngine.close();
                    (<Tree>container.resolve(Tree)).removeNode(this.node);
                    this.#api.update();

                    this.#settingsEngine.reset();
                    this.#stateEngine.primarySettingsRegistered.reset();
                    this.#eventEngine.emitEvent(EVENTTYPE.SESSION.SESSION_CLOSED, {});

                    if (!closeResult) this.#logger.warn(LOGGINGTOPIC.SESSION, `Session(${this.id}).close: Was not able to close session completely, please disregard this session.`);
                    return closeResult;
                } catch (e) {
                    if (e instanceof SDError) throw e;
                    throw this.#logger.error(LOGGINGTOPIC.SESSION, new SDError(e.message, e), `Session(${this.id}).close: Something unexpected happened.`, true)
                }
            }

            this.#sessionEngine.addUpdateCB(this.#updateCB);
            this.#updateCB();
            this.#logger.debugLow(LOGGINGTOPIC.SESSION, `Session(${this.id}).constructor: Session api created.`);
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.SESSION, new SDError(e.message, e), `Session.constructor: Something unexpected happened.`, true)
        }
    }

    // #endregion Constructors (1)

    // #region Public Methods (18)

    /**
     * Customize the session.
     * All parameter changes will be sent to the server.
     * The server computes the results, sends the results back.
     * THe results are put into the scene tree and the viewers are updated.
     * 
     * @returns 
     */
    public async customize(): Promise<TreeNode> {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.SESSION, `Session(${this.id}).customize: Customizing session.`);
            const blurValues: { [key: string]: boolean } = {};
            for (let viewerId in this.#api.viewers) {
                blurValues[viewerId] = this.#api.viewers[viewerId].blur;
                this.#api.viewers[viewerId].updateBlur(true);
            }

            (<Tree>container.resolve(Tree)).removeNode(this.node);

            // load file parameter first
            for (const parameterId in this.parameters) {
                if (this.parameters[parameterId] instanceof FileParameter) {
                    const id = await (<FileParameter>this.parameters[parameterId]).upload();
                    this.parameters[parameterId].updateValue(id);
                }
            }

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

            (<any>this.node) = await this.#sessionEngine.customize();

            this.#logger.info(LOGGINGTOPIC.SESSION, `Session(${this.id}).customize: Customization request finished, updating geometry.`);

            // set the session values to the current ones in all parameters
            for (const parameterId in this.parameters)
                (<any>this.parameters[parameterId].sessionValue) = parameterSet[parameterId].value;
            (<Tree>container.resolve(Tree)).addNode(this.node);
            this.node.excludeViewers = this.#excludeViewers;
            this.#eventEngine.emitEvent(EVENTTYPE.SESSION.SESSION_CUSTOMIZED, { session: this });
            for (let viewerId in this.#api.viewers)
                this.#api.viewers[viewerId].updateBlur(blurValues[viewerId]);
            this.#api.update();
            this.#logger.info(LOGGINGTOPIC.SESSION, `Session(${this.id}).customize: Session customized.`);
            return this.node;
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.SESSION, new SDError(e.message, e), `Session(${this.id}).customize: Something unexpected happened.`, true)
        }
    }

    /**
     * Return the export with the specified id.
     * 
     * @param id the id of the export
     * @returns 
     */
    public getExportById(id: string): Export | null {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.EXPORT, `Session(${this.id}).getExportById: Getting export with id ${id}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.EXPORT, `Session(${this.id}).getExportById`, id, 'string');
            return this.exports[id];
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.EXPORT, new SDError(e.message, e), `Session(${this.id}).getExportById: Something unexpected happened.`, true)
        }
    }

    /**
     * Return the exports with the specified name.
     * 
     * @param name the name of the exports
     * @returns 
     */
    public getExportByName(name: string): Export[] {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.EXPORT, `Session(${this.id}).getExportByName: Getting export(s) with name ${name}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.EXPORT, `Session(${this.id}).getExportByName`, name, 'string');
            const exports: Export[] = [];
            for (let exportId in this.exports) {
                if (name === this.exports[exportId].name)
                    exports.push(this.exports[exportId])
            }
            return exports;
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.EXPORT, new SDError(e.message, e), `Session(${this.id}).getExportByName: Something unexpected happened.`, true)
        }
    }

    /**
     * Return the exports with the specified type.
     * 
     * @param type the type of the exports
     * @returns 
     */
    public getExportByType(type: string): Export[] {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.EXPORT, `Session(${this.id}).getExportByType: Getting export(s) with type ${type}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.EXPORT, `Session(${this.id}).getExportByType`, type, 'string');
            const exports: Export[] = [];
            for (let exportId in this.exports) {
                if (type === this.exports[exportId].type)
                    exports.push(this.exports[exportId])
            }
            return exports;
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.EXPORT, new SDError(e.message, e), `Session(${this.id}).getExportByType: Something unexpected happened.`, true)
        }
    }

    /**
     * Return the output with the specified id.
     * 
     * @param id the id of the output
     * @returns 
     */
    public getOutputById(id: string): Output | null {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.OUTPUT, `Session(${this.id}).getOutputById: Getting output with id ${id}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.OUTPUT, `Session(${this.id}).getOutputById`, id, 'string');
            return this.outputs[id];
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.OUTPUT, new SDError(e.message, e), `Session(${this.id}).getOutputById: Something unexpected happened.`, true)
        }
    }

    /**
     * Return the outputs with the specified name.
     * 
     * @param name the name of the outputs
     * @returns 
     */
    public getOutputByName(name: string): Output[] {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.OUTPUT, `Session(${this.id}).getOutputByName: Getting output(s) with name ${name}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.OUTPUT, `Session(${this.id}).getOutputByName`, name, 'string');
            const outputs: Output[] = [];
            for (let outputId in this.outputs) {
                if (name === this.outputs[outputId].name)
                    outputs.push(this.outputs[outputId])
            }
            return outputs;
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.OUTPUT, new SDError(e.message, e), `Session(${this.id}).getOutputByName: Something unexpected happened.`, true)
        }
    }

    /**
     * Return the parameter with the specified id.
     * 
     * @param id the id of the parameter
     * @returns 
     */
    public getParameterById(id: string): Parameter<any> | null {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.PARAMETER, `Session(${this.id}).getParameterById: Getting paramter with id ${id}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.PARAMETER, `Session(${this.id}).getParameterById`, id, 'string');
            return this.parameters[id];
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.PARAMETER, new SDError(e.message, e), `Session(${this.id}).getParameterById: Something unexpected happened.`, true)
        }
    }

    /**
     * Return the parameters with the specified name.
     * 
     * @param name the name of the parameters
     * @returns 
     */
    public getParameterByName(name: string): Parameter<any>[] {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.PARAMETER, `Session(${this.id}).getParameterByName: Getting parameter(s) with name ${name}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.PARAMETER, `Session(${this.id}).getParameterByName`, name, 'string');
            const parameters: Parameter<any>[] = [];
            for (let parameterId in this.parameters) {
                if (name === this.parameters[parameterId].name)
                    parameters.push(this.parameters[parameterId])
            }
            return parameters;
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.PARAMETER, new SDError(e.message, e), `Session(${this.id}).getParameterByName: Something unexpected happened.`, true)
        }
    }

    /**
     * Return the parameters with the specified type.
     * 
     * @param type the type of the parameters
     * @returns 
     */
    public getParameterByType(type: string): Parameter<any>[] {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.PARAMETER, `Session(${this.id}).getParameterByType: Getting parameter(s) with type ${type}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.PARAMETER, `Session(${this.id}).getParameterByType`, type, 'string');
            const parameters: Parameter<any>[] = [];
            for (let parameterId in this.parameters) {
                if (type === this.parameters[parameterId].type)
                    parameters.push(this.parameters[parameterId])
            }
            return parameters;
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.PARAMETER, new SDError(e.message, e), `Session(${this.id}).getParameterByType: Something unexpected happened.`, true)
        }
    }

    /**
     * Initialize the session.
     * Normally, there is no need to call this function.
     * The initialization is done on creation via the api.
     * 
     * @returns 
     */
    public async init(): Promise<TreeNode> {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.SESSION, `Session(${this.id}).init: Initializing Session.`);
            (<any>this.node) = await this.#sessionEngine.init();
            for (let p in this.#sessionEngine.parameters) {
                const param = this.#sessionEngine.parameters[p];
                switch (true) {
                    case param.type === PARAMETERTYPE.BOOL || param.type === PARAMETERTYPE.SBOOL:
                        this.parameters[p] = new Parameter<boolean>(this.#sessionEngine, this.#sessionEngine.parameters[p]);
                        break;
                    case param.type === PARAMETERTYPE.COLOR || param.type === PARAMETERTYPE.SCOLOR:
                        this.parameters[p] = new Parameter<number | vec3>(this.#sessionEngine, this.#sessionEngine.parameters[p]);
                        break;
                    case param.type === PARAMETERTYPE.FILE:
                        this.parameters[p] = new FileParameter(this.#sessionEngine, this.#sessionEngine.parameters[p]);
                        break;
                    case param.type === PARAMETERTYPE.EVEN || param.type === PARAMETERTYPE.FLOAT || param.type === PARAMETERTYPE.INT || param.type === PARAMETERTYPE.ODD || param.type === PARAMETERTYPE.SINTEGER || param.type === PARAMETERTYPE.SNUMBER:
                        this.parameters[p] = new Parameter<number>(this.#sessionEngine, this.#sessionEngine.parameters[p]);
                        break;
                    default:
                        this.parameters[p] = new Parameter<string>(this.#sessionEngine, this.#sessionEngine.parameters[p]);
                        break;
                }
            }

            for (let e in this.#sessionEngine.exports)
                this.exports[e] = new Export(this.#sessionEngine, this.#sessionEngine.exports[e]);

            for (let o in this.#sessionEngine.outputs)
                this.outputs[o] = new Output(this.#sessionEngine, this.#sessionEngine.outputs[o]);

            (<Tree>container.resolve(Tree)).addNode(this.node);
            this.node.excludeViewers = this.#excludeViewers;
            this.#eventEngine.emitEvent(EVENTTYPE.SESSION.SESSION_INITIALIZED, { session: this });

            this.#settingsEngine.fromJson(this.#sessionEngine.settingsConfig, this.id, this.primarySession);
            await new Promise<void>((resolve) => this.#stateEngine.getCustomState(this.id + '_settings_registered').then(() => { resolve(); }));

            this.#eventEngine.emitEvent(EVENTTYPE.SESSION.SESSION_LOADED, { session: this });
            this.#api.update();
            this.#logger.info(LOGGINGTOPIC.SESSION, `Session(${this.id}).init: Session initialized.`);
            return this.node;
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.SESSION, new SDError(e.message, e), `Session(${this.id}).init: Something unexpected happened.`, true)
        }
    }

    /**
     * Save the parameters that are currently used for this session as default parameters.
     * This only works when this session was created with an author ticket.
     * 
     * @returns 
     */
    public async saveDefaultParameters() {
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
            throw this.#logger.error(LOGGINGTOPIC.SESSION, new SDError(e.message, e), `Session(${this.id}).saveDefaultParameters: Something unexpected happened.`, true)
        }
    }

    /**
     * Save the settings that are currently used for this session.
     * If there is multiple viewers, the first one will be used for the settings.
     * This only works when this session was created with an author ticket.
     *
     * @param viewerId the optional viewer id
     */
    public async saveSettings(viewerId?: string): Promise<boolean> {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.SESSION, `Session(${this.id}).saveSettings: Saving settings.`);
            this.#settingsEngine.general.viewer.commitParameters.value = this.commitParameters;
            this.#settingsEngine.general.viewer.commitSettings.value = this.commitSettings;

            const parameters = this.parameters;
            const exports = this.exports;
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

                const json = this.#settingsEngine.toJson();
                const response = await this.#sessionEngine.saveSettings(json);
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
            throw this.#logger.error(LOGGINGTOPIC.SESSION, new SDError(e.message, e), `Session(${this.id}).saveSettings: Something unexpected happened.`, true)
        }
    }

    /**
     * If the session has an author ticket.
     */
    public updateAuthorTicket(value: boolean | undefined) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.SESSION, `Session(${this.id}).updateAuthorTicket: Updating AuthorTicket to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.SESSION, `Session(${this.id}).updateAuthorTicket`, value, 'string', false);
            this.#sessionEngine.authorTicket = value;
            this.#logger.info(LOGGINGTOPIC.SESSION, `Session(${this.id}).updateAuthorTicket: authorTicket was set to: ${value}`);
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.SESSION, new SDError(e.message, e), `Session(${this.id}).updateAuthorTicket: Something unexpected happened.`, true)
        }
    }

    /**
     * The bearerToken of the session.
     */
    public updateBearerToken(value: string | undefined) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.SESSION, `Session(${this.id}).updateBearerToken: Updating BearerToken to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.SESSION, `Session(${this.id}).updateBearerToken`, value, 'string', false);
            this.#sessionEngine.bearerToken = value;
            this.#logger.info(LOGGINGTOPIC.SESSION, `Session(${this.id}).updateBearerToken: bearerToken was set to: ${value}`);
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.SESSION, new SDError(e.message, e), `Session(${this.id}).updateBearerToken: Something unexpected happened.`, true)
        }
    }

    /**
     * The commitParameters setting of the session.
     * @param {boolean} value
     */
    public updateCommitParameters(value: boolean) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.SESSION, `Session(${this.id}).updateCommitParameters: Updating CommitParameters to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.SESSION, `Session(${this.id}).updateCommitParameters`, value, 'boolean');
            (<any>this.commitParameters) = value;
            this.#logger.info(LOGGINGTOPIC.SESSION, `Session(${this.id}).updateCommitParameters: commitParameters was set to: ${value}`);
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.SESSION, new SDError(e.message, e), `Session(${this.id}).updateCommitParameters: Something unexpected happened.`, true)
        }
    }

    /**
     * The commitSettings setting of the session.
     * @param {boolean} value
     */
    public updateCommitSettings(value: boolean) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.SESSION, `Session(${this.id}).updateCommitSettings: Updating CommitSettings to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.SESSION, `Session(${this.id}).updateCommitSettings`, value, 'boolean');
            (<any>this.commitSettings) = value;
            this.#logger.info(LOGGINGTOPIC.SESSION, `Session(${this.id}).updateCommitSettings: commitSettings was set to: ${value}`);
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.SESSION, new SDError(e.message, e), `Session(${this.id}).updateCommitSettings: Something unexpected happened.`, true)
        }
    }

    /**
     * The callback to refresh the bearer token.
     * This callback will be executed, 
     * once a session request fails due to an invalid bearer token.
     */
    public updateRefreshBearerToken(value: () => string) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.SESSION, `Session(${this.id}).updateRefreshBearerToken: Updating RefreshBearerToken to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.SESSION, `Session(${this.id}).updateRefreshBearerToken`, value, 'function');
            this.#sessionEngine.refreshBearerToken = value;
            this.#logger.info(LOGGINGTOPIC.SESSION, `Session(${this.id}).updateRefreshBearerToken: refreshBearerToken was set to: ${value}`);
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.SESSION, new SDError(e.message, e), `Session(${this.id}).updateRefreshBearerToken: Something unexpected happened.`, true)
        }
    }

    // #endregion Public Methods (18)
}
