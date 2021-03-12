import { Tree, TreeNode } from "@shapediver/viewer.shared.node-tree";
import { ISession, Session as SessionEngine } from "@shapediver/viewer.session-engine.session-engine";
import { Export } from "@shapediver/viewer.session-engine.session-engine/dist/implementation/Export";
import { Output } from "@shapediver/viewer.session-engine.session-engine/dist/implementation/Output";
import { Parameter } from "@shapediver/viewer.session-engine.session-engine/dist/implementation/Parameter";
import { container, injectable } from "tsyringe";
import { Viewer } from "../viewer/Viewer";

@injectable()
export class Session implements ISession {
    // #region Properties (6)

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
        return this.#sessionEngine.createOutput(id);
    }

    public async customize(): Promise<TreeNode> {
        (container.resolve(Tree)).removeNode(this.#node);
        this.#node = await this.#sessionEngine.customize();
        (container.resolve(Tree)).addNode(this.#node);
        if(container.isRegistered('viewer')) (<Viewer[]>container.resolveAll('viewer')).forEach(v => v.update());
        return this.#node;
    }

    public getExport(id: string): Export {
        return this.#sessionEngine.getExport(id);
    }

    public getExportById(id: string): Export {
        return this.#sessionEngine.getExportById(id);
    }

    public getExportByName(name: string): Export[] {
        return this.#sessionEngine.getExportByName(name);
    }

    public getExportByType(type: string): Export[] {
        return this.#sessionEngine.getExportByType(type);
    }

    public getExports(): { [key: string]: Export; } {
        return this.#sessionEngine.getExports();
    }

    public getOutput(id: string): Output {
        return this.#sessionEngine.getOutput(id);
    }

    public getOutputById(id: string): Output {
        return this.#sessionEngine.getOutputById(id);
    }

    public getOutputByName(name: string): Output[] {
        return this.#sessionEngine.getOutputByName(name);
    }

    public getOutputs(): { [key: string]: Output; } {
        return this.#sessionEngine.getOutputs();
    }

    public getParameter(id: string): Parameter {
        return this.#sessionEngine.getParameter(id);
    }

    public getParameterById(id: string): Parameter {
        return this.#sessionEngine.getParameterById(id);
    }

    public getParameterByName(name: string): Parameter[] {
        return this.#sessionEngine.getParameterByName(name);
    }

    public getParameterByType(type: string): Parameter[] {
        return this.#sessionEngine.getParameterByType(type);
    }

    public getParameters(): { [key: string]: Parameter; } {
        return this.#sessionEngine.getParameters();
    }

    public async init(): Promise<TreeNode>  {
        this.#node = await this.#sessionEngine.init();
        (container.resolve(Tree)).addNode(this.#node);
        if(container.isRegistered('viewer')) (<Viewer[]>container.resolveAll('viewer')).forEach(v => v.update());
        return this.#node;
    }

    // #endregion Public Methods (17)
}
