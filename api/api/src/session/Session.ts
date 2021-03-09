import { Tree, TreeNode } from "@shapediver/viewer.shared.node-tree";
import { ISession, Session as SessionEngine } from "@shapediver/viewer.session-engine.session-engine";
import { Export } from "@shapediver/viewer.session-engine.session-engine/dist/implementation/Export";
import { Output } from "@shapediver/viewer.session-engine.session-engine/dist/implementation/Output";
import { Parameter } from "@shapediver/viewer.session-engine.session-engine/dist/implementation/Parameter";

export class Session implements ISession {
    // #region Properties (6)

    private readonly _sessionEngine: SessionEngine;

    private _commitParameters: boolean = false;
    private _node: TreeNode;
    private _parameterControlNames: string[] = [];
    private _parameterControlOrder: string[] = [];
    private _parameterHidden: string[] = [];

    // #endregion Properties (6)

    // #region Constructors (1)

    constructor(
        private readonly _id: string,
        private readonly _sceneTree: Tree,
        private readonly _onUpdate: () => void,
        private readonly _ticket: string,
        private readonly _modelViewUrl: string
    ) {
        this._node = new TreeNode(this.ticket)
        this._sessionEngine = new SessionEngine(this._ticket, this._modelViewUrl);
    }

    // #endregion Constructors (1)

    // #region Public Accessors (12)

    /**
     * Getter commitParameters
     * @return {boolean}
     */
    public get commitParameters(): boolean {
        return this._commitParameters;
    }

    /**
     * Setter commitParameters
     * @param {boolean} value
     */
    public set commitParameters(value: boolean) {
        this._commitParameters = value;
    }

    /**
   * Getter id
   * @return {string}
   */
    public get id(): string {
        return this._id;
    }

    /**
     * Getter modelViewUrl
     * @return {string}
     */
    public get modelViewUrl(): string {
        return this._modelViewUrl;
    }

    /**
     * Getter node
     * @return {TreeNode}
     */
    public get node(): TreeNode {
        return this._node;
    }

    /**
     * Getter parameterControlNames
     * @return {string[]}
     */
    public get parameterControlNames(): string[] {
        return this._parameterControlNames;
    }

    /**
     * Setter parameterControlNames
     * @param {string[]} value
     */
    public set parameterControlNames(value: string[]) {
        this._parameterControlNames = value;
    }

    /**
     * Getter parameterControlOrder
     * @return {string[]}
     */
    public get parameterControlOrder(): string[] {
        return this._parameterControlOrder;
    }

    /**
     * Setter parameterControlOrder
     * @param {string[]} value
     */
    public set parameterControlOrder(value: string[]) {
        this._parameterControlOrder = value;
    }

    /**
     * Getter parameterHidden
     * @return {string[]}
     */
    public get parameterHidden(): string[] {
        return this._parameterHidden;
    }

    /**
     * Setter parameterHidden
     * @param {string[]} value
     */
    public set parameterHidden(value: string[]) {
        this._parameterHidden = value;
    }

    /**
     * Getter ticket
     * @return {string}
     */
    public get ticket(): string {
        return this._ticket;
    }

    // #endregion Public Accessors (12)

    // #region Public Methods (17)

    public createOutput(id: string): Output {
        return this._sessionEngine.createOutput(id);
    }

    public async customize(): Promise<TreeNode> {
        this._sceneTree.removeNode(this._node);
        this._node = await this._sessionEngine.customize();
        this._sceneTree.addNode(this._node);
        this._onUpdate();
        return this._node;
    }

    public getExport(id: string): Export {
        return this._sessionEngine.getExport(id);
    }

    public getExportById(id: string): Export {
        return this._sessionEngine.getExportById(id);
    }

    public getExportByName(name: string): Export[] {
        return this._sessionEngine.getExportByName(name);
    }

    public getExportByType(type: string): Export[] {
        return this._sessionEngine.getExportByType(type);
    }

    public getExports(): { [key: string]: Export; } {
        return this._sessionEngine.getExports();
    }

    public getOutput(id: string): Output {
        return this._sessionEngine.getOutput(id);
    }

    public getOutputById(id: string): Output {
        return this._sessionEngine.getOutputById(id);
    }

    public getOutputByName(name: string): Output[] {
        return this._sessionEngine.getOutputByName(name);
    }

    public getOutputs(): { [key: string]: Output; } {
        return this._sessionEngine.getOutputs();
    }

    public getParameter(id: string): Parameter {
        return this._sessionEngine.getParameter(id);
    }

    public getParameterById(id: string): Parameter {
        return this._sessionEngine.getParameterById(id);
    }

    public getParameterByName(name: string): Parameter[] {
        return this._sessionEngine.getParameterByName(name);
    }

    public getParameterByType(type: string): Parameter[] {
        return this._sessionEngine.getParameterByType(type);
    }

    public getParameters(): { [key: string]: Parameter; } {
        return this._sessionEngine.getParameters();
    }

    public async init(): Promise<TreeNode>  {
        this._node = await this._sessionEngine.init();
        this._sceneTree.addNode(this._node);
        this._onUpdate();
        return this._node;
    }

    // #endregion Public Methods (17)
}
