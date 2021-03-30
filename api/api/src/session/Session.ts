import { Tree, TreeNode } from "@shapediver/viewer.shared.node-tree";
import { ISession, Session as SessionEngine } from "@shapediver/viewer.session-engine.session-engine";
import { Export } from "./Export";
import { Output } from "./Output";
import { Parameter } from "./Parameter";
import { container, injectable } from "tsyringe";
import { Viewer } from "../viewer/Viewer";
import { Logger } from "@shapediver/viewer.shared.monitoring";
import { EventEngine, EVENTTYPE } from "@shapediver/viewer.shared.services";
import { InputValidator } from "@shapediver/viewer.shared.utils";

@injectable()
export class Session implements ISession {
    // #region Properties (9)

    readonly #exports: { [key: string]: Export; } = {};
    readonly #outputs: { [key: string]: Output; } = {};
    readonly #parameters: { [key: string]: Parameter; } = {};
    readonly #sessionEngine: SessionEngine;
    readonly #eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);
    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    #commitParameters: boolean = false;
    #node: TreeNode;
    #parameterControlNames: string[] = [];
    #parameterControlOrder: string[] = [];
    #parameterHidden: string[] = [];

    // #endregion Properties (9)

    // #region Constructors (1)

    /**
     * @ignore
     */
    constructor(properties: { id: string, ticket: string, modelViewUrl: string, bearerToken?: string, loadDefaultSettings?: boolean }) {
        this.#node = new TreeNode(properties.id)
        this.#sessionEngine = new SessionEngine(properties);
    }

    // #endregion Constructors (1)

    // #region Public Accessors (8)

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

    // /**
    //  * Getter commitParameters
    //  * @return {boolean}
    //  */
    // public get commitParameters(): boolean {
    //     return this.#commitParameters;
    // }

    // /**
    //  * Setter commitParameters
    //  * @param {boolean} value
    //  */
    // public set commitParameters(value: boolean) {
    //     this.#commitParameters = value;
    // }

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

    // /**
    //  * Getter parameterControlNames
    //  * @return {string[]}
    //  */
    // public get parameterControlNames(): string[] {
    //     return this.#parameterControlNames;
    // }

    // /**
    //  * Setter parameterControlNames
    //  * @param {string[]} value
    //  */
    // public set parameterControlNames(value: string[]) {
    //     this.#parameterControlNames = value;
    // }

    // /**
    //  * Getter parameterControlOrder
    //  * @return {string[]}
    //  */
    // public get parameterControlOrder(): string[] {
    //     return this.#parameterControlOrder;
    // }

    // /**
    //  * Setter parameterControlOrder
    //  * @param {string[]} value
    //  */
    // public set parameterControlOrder(value: string[]) {
    //     this.#parameterControlOrder = value;
    // }

    // /**
    //  * Getter parameterHidden
    //  * @return {string[]}
    //  */
    // public get parameterHidden(): string[] {
    //     return this.#parameterHidden;
    // }

    // /**
    //  * Setter parameterHidden
    //  * @param {string[]} value
    //  */
    // public set parameterHidden(value: string[]) {
    //     this.#parameterHidden = value;
    // }

    /**
     * The ticket of the session.
     * @return {string}
     */
    public get ticket(): string {
        return this.#sessionEngine.ticket;
    }

    // #endregion Public Accessors (8)

    // #region Public Methods (17)

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
        if(container.isRegistered('viewer')) (<Viewer[]>container.resolveAll('viewer')).forEach(v => v.update());
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
        if(!exportLogic) return null;
        if(!this.#exports[id]) this.#exports[id] = new Export(exportLogic);
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
        if(!exportLogic) return null;
        if(!this.#exports[id]) this.#exports[id] = new Export(exportLogic);
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
        for(let i = 0; i < exportLogic.length; i++) {
            if(!this.#exports[exportLogic[i].id]) this.#exports[exportLogic[i].id] = new Export(exportLogic[i]);
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
        for(let i = 0; i < exportLogic.length; i++){
            if(!this.#exports[exportLogic[i].id]) this.#exports[exportLogic[i].id] = new Export(exportLogic[i]);
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
        for(let e in exportLogic) {
            if(!this.#exports[exportLogic[e].id]) this.#exports[exportLogic[e].id] = new Export(exportLogic[e]);
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
        if(!outputLogic) return null;
        if(!this.#outputs[id]) this.#outputs[id] = new Output(outputLogic);
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
        if(!outputLogic) return null;
        if(!this.#outputs[id]) this.#outputs[id] = new Output(outputLogic);
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
        for(let i = 0; i < outputLogic.length; i++) {
            if(!this.#outputs[outputLogic[i].id]) this.#outputs[outputLogic[i].id] = new Output(outputLogic[i]);
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
        for(let e in outputLogic){
            if(!this.#outputs[outputLogic[e].id]) this.#outputs[outputLogic[e].id] = new Output(outputLogic[e]);
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
    public getParameter(id: string): Parameter | null {
        this.#inputValidator.validate(id, 'string');
        const parameterLogic = this.#sessionEngine.getParameter(id);
        if(!parameterLogic) return null;
        if(!this.#parameters[id]) this.#parameters[id] = new Parameter(parameterLogic);
        return this.#parameters[id];
    }

    /**
     * Return the parameter with the specified id.
     * 
     * @param id the id of the parameter
     * @returns 
     */
    public getParameterById(id: string): Parameter | null {
        this.#inputValidator.validate(id, 'string');
        const parameterLogic = this.#sessionEngine.getParameterById(id);
        if(!parameterLogic) return null;
        if(!this.#parameters[id]) this.#parameters[id] = new Parameter(parameterLogic);
        return this.#parameters[id];
    }

    /**
     * Return the parameters with the specified name.
     * 
     * @param name the name of the parameters
     * @returns 
     */
    public getParameterByName(name: string): Parameter[] {
        this.#inputValidator.validate(name, 'string');
        const parameterLogic = this.#sessionEngine.getParameterByName(name);
        const parameters: Parameter[] = [];
        for(let i = 0; i < parameterLogic.length; i++){
            if(!this.#parameters[parameterLogic[i].id]) this.#parameters[parameterLogic[i].id] = new Parameter(parameterLogic[i]);
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
    public getParameterByType(type: string): Parameter[] {
        this.#inputValidator.validate(type, 'string');
        const parameterLogic = this.#sessionEngine.getParameterByType(type);
        const parameters: Parameter[] = [];
        for(let i = 0; i < parameterLogic.length; i++){
            if(!this.#parameters[parameterLogic[i].id]) this.#parameters[parameterLogic[i].id] = new Parameter(parameterLogic[i]);
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
    public getParameters(): { [key: string]: Parameter; } {    
        const parameterLogic = this.#sessionEngine.getParameters();
        const parameters: { [key: string]: Parameter; } = {};
        for(let e in parameterLogic){
            if(!this.#parameters[parameterLogic[e].id]) this.#parameters[parameterLogic[e].id] = new Parameter(parameterLogic[e]);
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
    public async init(): Promise<TreeNode>  {
        this.#node = await this.#sessionEngine.init();
        (<Tree>container.resolve(Tree)).addNode(this.#node);
        if(container.isRegistered('viewer')) (<Viewer[]>container.resolveAll('viewer')).forEach(v => v.update());
        this.#logger.info(`Session (${this.id}): Session initialized.`);
        return this.#node;
    }

    // #endregion Public Methods (17)
}
