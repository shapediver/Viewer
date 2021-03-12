import { Tree, TreeNode } from "@shapediver/viewer.shared.node-tree";
import { ISession, Session as SessionEngine } from "@shapediver/viewer.session-engine.session-engine";
import { Export } from "./Export";
import { Output } from "./Output";
import { Parameter } from "./Parameter";
import { container, injectable } from "tsyringe";
import { Viewer } from "../viewer/Viewer";

@injectable()
export class Session implements ISession {
    // #region Properties (6)

    readonly #exports: { [key: string]: Export; } = {};
    readonly #outputs: { [key: string]: Output; } = {};
    readonly #parameters: { [key: string]: Parameter; } = {};

    readonly #sessionEngine: SessionEngine;
    readonly #ticket: string; 
    readonly #modelViewUrl: string;

    #commitParameters: boolean = false;
    #node: TreeNode;
    #parameterControlNames: string[] = [];
    #parameterControlOrder: string[] = [];
    #parameterHidden: string[] = [];

    // #endregion Properties (6)

    // #region Constructors (1)

    constructor( id: string, ticket: string, modelViewUrl: string ) {
        this.#ticket = ticket;
        this.#modelViewUrl = modelViewUrl;
        this.#node = new TreeNode(this.ticket)
        this.#sessionEngine = new SessionEngine(id, this.#ticket, this.#modelViewUrl);
    }

    // #endregion Constructors (1)

    // #region Public Accessors (12)

    /**
     * Getter commitParameters
     * @return {boolean}
     */
    public get commitParameters(): boolean {
        return this.#commitParameters;
    }

    /**
     * Setter commitParameters
     * @param {boolean} value
     */
    public set commitParameters(value: boolean) {
        this.#commitParameters = value;
    }

    /**
   * Getter id
   * @return {string}
   */
    public get id(): string {
        return this.#sessionEngine.id;
    }

    /**
     * Getter modelViewUrl
     * @return {string}
     */
    public get modelViewUrl(): string {
        return this.#modelViewUrl;
    }

    /**
     * Getter node
     * @return {TreeNode}
     */
    public get node(): TreeNode {
        return this.#node;
    }

    /**
     * Getter parameterControlNames
     * @return {string[]}
     */
    public get parameterControlNames(): string[] {
        return this.#parameterControlNames;
    }

    /**
     * Setter parameterControlNames
     * @param {string[]} value
     */
    public set parameterControlNames(value: string[]) {
        this.#parameterControlNames = value;
    }

    /**
     * Getter parameterControlOrder
     * @return {string[]}
     */
    public get parameterControlOrder(): string[] {
        return this.#parameterControlOrder;
    }

    /**
     * Setter parameterControlOrder
     * @param {string[]} value
     */
    public set parameterControlOrder(value: string[]) {
        this.#parameterControlOrder = value;
    }

    /**
     * Getter parameterHidden
     * @return {string[]}
     */
    public get parameterHidden(): string[] {
        return this.#parameterHidden;
    }

    /**
     * Setter parameterHidden
     * @param {string[]} value
     */
    public set parameterHidden(value: string[]) {
        this.#parameterHidden = value;
    }

    /**
     * Getter ticket
     * @return {string}
     */
    public get ticket(): string {
        return this.#ticket;
    }

    // #endregion Public Accessors (12)

    // #region Public Methods (17)

    public createOutput(id: string): Output {
        return new Output(this.#sessionEngine.createOutput(id));
    }

    public async customize(): Promise<TreeNode> {
        (container.resolve(Tree)).removeNode(this.#node);
        this.#node = await this.#sessionEngine.customize();
        (container.resolve(Tree)).addNode(this.#node);
        if(container.isRegistered('viewer')) (<Viewer[]>container.resolveAll('viewer')).forEach(v => v.update());
        return this.#node;
    }

    public getExport(id: string): Export {
        const exportLogic = this.#sessionEngine.getExport(id);
        if(!this.#exports[id]) this.#exports[id] = new Export(exportLogic);
        return this.#exports[id];
    }

    public getExportById(id: string): Export {
        const exportLogic = this.#sessionEngine.getExportById(id);
        if(!this.#exports[id]) this.#exports[id] = new Export(exportLogic);
        return this.#exports[id];
    }

    public getExportByName(name: string): Export[] {
        const exportLogic = this.#sessionEngine.getExportByName(name);
        const exports: Export[] = [];
        for(let i = 0; i < exportLogic.length; i++) {
            if(!this.#exports[exportLogic[i].id]) this.#exports[exportLogic[i].id] = new Export(exportLogic[i]);
            exports.push(this.#exports[exportLogic[i].id]);
        }
        return exports;
    }

    public getExportByType(type: string): Export[] {
        const exportLogic = this.#sessionEngine.getExportByType(type);
        const exports: Export[] = [];
        for(let i = 0; i < exportLogic.length; i++){
            if(!this.#exports[exportLogic[i].id]) this.#exports[exportLogic[i].id] = new Export(exportLogic[i]);
            exports.push(this.#exports[exportLogic[i].id]);
        }
        return exports;
    }

    public getExports(): { [key: string]: Export; } {        
        const exportLogic = this.#sessionEngine.getExports();
        const exports: { [key: string]: Export; } = {};
        for(let e in exportLogic) {
            if(!this.#exports[exportLogic[e].id]) this.#exports[exportLogic[e].id] = new Export(exportLogic[e]);
            exports[e] = this.#exports[exportLogic[e].id];
        }
        return exports;
    }

    public getOutput(id: string): Output {
        const outputLogic = this.#sessionEngine.getOutput(id);
        if(!this.#outputs[id]) this.#outputs[id] = new Output(outputLogic);
        return this.#outputs[id];
    }

    public getOutputById(id: string): Output {
        const outputLogic = this.#sessionEngine.getOutputById(id);
        if(!this.#outputs[id]) this.#outputs[id] = new Output(outputLogic);
        return this.#outputs[id];
    }

    public getOutputByName(name: string): Output[] {
        const outputLogic = this.#sessionEngine.getOutputByName(name);
        const outputs: Output[] = [];
        for(let i = 0; i < outputLogic.length; i++) {
            if(!this.#outputs[outputLogic[i].id]) this.#outputs[outputLogic[i].id] = new Output(outputLogic[i]);
            outputs.push(this.#outputs[outputLogic[i].id]);
        }
        return outputs;
    }

    public getOutputs(): { [key: string]: Output; } {       
        const outputLogic = this.#sessionEngine.getOutputs();
        const outputs: { [key: string]: Output; } = {};
        for(let e in outputLogic){
            if(!this.#outputs[outputLogic[e].id]) this.#outputs[outputLogic[e].id] = new Output(outputLogic[e]);
            outputs[e] = this.#outputs[outputLogic[e].id];
        }
        return outputs;
    }

    public getParameter(id: string): Parameter {
        const parameterLogic = this.#sessionEngine.getParameter(id);
        if(!this.#parameters[id]) this.#parameters[id] = new Parameter(parameterLogic);
        return this.#parameters[id];
    }

    public getParameterById(id: string): Parameter {
        const parameterLogic = this.#sessionEngine.getParameterById(id);
        if(!this.#parameters[id]) this.#parameters[id] = new Parameter(parameterLogic);
        return this.#parameters[id];
    }

    public getParameterByName(name: string): Parameter[] {
        const parameterLogic = this.#sessionEngine.getParameterByName(name);
        const parameters: Parameter[] = [];
        for(let i = 0; i < parameterLogic.length; i++){
            if(!this.#parameters[parameterLogic[i].id]) this.#parameters[parameterLogic[i].id] = new Parameter(parameterLogic[i]);
            parameters.push(this.#parameters[parameterLogic[i].id]);
        }
        return parameters;
    }

    public getParameterByType(type: string): Parameter[] {
        const parameterLogic = this.#sessionEngine.getParameterByType(type);
        const parameters: Parameter[] = [];
        for(let i = 0; i < parameterLogic.length; i++){
            if(!this.#parameters[parameterLogic[i].id]) this.#parameters[parameterLogic[i].id] = new Parameter(parameterLogic[i]);
            parameters.push(this.#parameters[parameterLogic[i].id]);
        }
        return parameters;
    }

    public getParameters(): { [key: string]: Parameter; } {    
        const parameterLogic = this.#sessionEngine.getParameters();
        const parameters: { [key: string]: Parameter; } = {};
        for(let e in parameterLogic){
            if(!this.#parameters[parameterLogic[e].id]) this.#parameters[parameterLogic[e].id] = new Parameter(parameterLogic[e]);
            parameters[e] = this.#parameters[parameterLogic[e].id];
        }
        return parameters;
    }

    public async init(): Promise<TreeNode>  {
        this.#node = await this.#sessionEngine.init();
        (container.resolve(Tree)).addNode(this.#node);
        if(container.isRegistered('viewer')) (<Viewer[]>container.resolveAll('viewer')).forEach(v => v.update());
        return this.#node;
    }

    // #endregion Public Methods (17)
}
