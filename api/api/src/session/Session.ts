import { Tree, TreeNode } from "@shapediver/viewer.shared.node-tree";
import { SessionEngine } from "@shapediver/viewer.session-engine.session-engine";
import { Export } from "./Export";
import { Output } from "./Output";
import { Parameter } from "./Parameter";

export class Session {
    // #region Properties (11)

    private readonly _exports: { [key: string]: Export; } = {};
    private readonly _outputs: { [key: string]: Output; } = {};
    private readonly _outputsCreated: { [key: string]: Output; } = {};
    private readonly _parameters: { [key: string]: Parameter; } = {};
    private readonly _sessionEngine: SessionEngine;

    private _commitParameters: boolean = false;
    private _initialized: boolean = false;
    private _node: TreeNode;
    private _parameterControlNames: string[] = [];
    private _parameterControlOrder: string[] = [];
    private _parameterHidden: string[] = [];

    // #endregion Properties (11)

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

    // #region Public Methods (19)

    public createOutput(id: string): Output {
        if (this._outputs[id] || this._outputsCreated[id])
            throw Error('Output with this id already exists.')

        this._outputsCreated[id] = new Output(id, { version: '1.0' });
        this._outputs[id] = this._outputsCreated[id];
        return this._outputs[id];
    }

    public async customize(): Promise<TreeNode> {
        this._sceneTree.removeNode(this._node);
        for (let parameterId in this._parameters)
            this._sessionEngine.parameters[parameterId].value = this._parameters[parameterId].value;
        for (let outputId in this._outputsCreated)
            this._sessionEngine.outputs[outputId] = this._outputsCreated[outputId];

        this._node = await this._sessionEngine.customize();

        this._sceneTree.addNode(this._node);
        this._onUpdate();
        return this._node;
    }

    /**
     * Getter export
     * @return {Export}
     */
    public getExport(id: string): Export {
        const e = this._exports[id];
        if(!e) throw new Error('Export with this id does not exist.')
        return e;
    }

    public getExportById(id: string): Export {        
        return this.getExport(id);
    }

    public getExportByName(name: string): Export[] {
        const exports: Export[] = [];
        for (let exportId in this._exports) {
            if (name === this._exports[exportId].name)
                exports.push(this._exports[exportId])
        }
        return exports;
    }

    public getExportByType(type: string): Export[] {
        const exports: Export[] = [];
        for (let exportId in this._exports) {
            if (type === this._exports[exportId].type)
                exports.push(this._exports[exportId])
        }
        return exports;
    }

    /**
     * Getter exports
     * @return {{ [key: string]: Export; }}
     */
    public getExports(): { [key: string]: Export; } {
        const r: { [key: string]: Export } = {};
        for (let e in this._exports)
            r[e] = this._exports[e];
        return r;
    }

    /**
     * Getter output
     * @return {Output}
     */
    public getOutput(id: string): Output {
        const o = this._outputs[id];
        if(!o) throw new Error('Output with this id does not exist.')
        return o;
    }

    public getOutputById(id: string): Output {
        return this.getOutput(id);
    }

    public getOutputByName(name: string): Output[] {
        const outputs: Output[] = [];
        for (let outputId in this._outputs) {
            if (name === this._outputs[outputId].name)
                outputs.push(this._outputs[outputId])
        }
        return outputs;
    }

    /**
     * Getter outputs
     * @return {{ [key: string]: Output; }}
     */
    public getOutputs(): { [key: string]: Output; } {
        const r: { [key: string]: Output } = {};
        for (let o in this._outputs)
            r[o] = this._outputs[o];
        return r;
    }

    /**
     * Getter parameter
     * @return {Parameter}
     */
    public getParameter(id: string): Parameter {
        const p = this._parameters[id];
        if(!p) throw new Error('Parameter with this id does not exist.')
        return p;
    }

    public getParameterById(id: string): Parameter {
        return this.getParameter(id);
    }

    public getParameterByName(name: string): Parameter[] {
        const parameters: Parameter[] = [];
        for (let parameterId in this._parameters) {
            if (name === this._parameters[parameterId].name)
                parameters.push(this._parameters[parameterId])
        }
        return parameters;
    }

    public getParameterByType(type: string): Parameter[] {
        const parameters: Parameter[] = [];
        for (let parameterId in this._parameters) {
            if (type === this._parameters[parameterId].type)
                parameters.push(this._parameters[parameterId])
        }
        return parameters;
    }

    /**
     * Getter parameters
     * @return {{ [key: string]: Parameter; }}
     */
    public getParameters(): { [key: string]: Parameter; } {
        const r: { [key: string]: Parameter } = {};
        for (let p in this._parameters)
            r[p] = this._parameters[p];
        return r;
    }

    public async init() {
        if (this._initialized === true) return;
        this._node = await this._sessionEngine.init();
        this._sceneTree.addNode(this._node);

        for (let parameterId in this._sessionEngine.parameters)
            this._parameters[parameterId] = new Parameter(parameterId, this._sessionEngine.parameters[parameterId]);
        for (let exportId in this._sessionEngine.exports)
            this._exports[exportId] = new Export(exportId, this._sessionEngine.exports[exportId]);
        for (let outputId in this._sessionEngine.outputs)
            this._outputs[outputId] = new Output(outputId, this._sessionEngine.outputs[outputId]);

        this._initialized = true;
        this._onUpdate();
    }

    public redoParameterChange(): void {
        throw new Error("Method not implemented.");
    }

    public undoParameterChange(): void {
        throw new Error("Method not implemented.");
    }

    // #endregion Public Methods (19)
}
