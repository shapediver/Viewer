import { Tree, TreeNode } from "@shapediver/viewer.shared.node-tree";
import { SessionEngine } from "@shapediver/viewer.session-engine.session-engine";
import { IExport } from "../interfaces/IExport";
import { IOutput } from "../interfaces/IOutput";
import { IParameter } from "../interfaces/IParameter";
import { ISession } from "../interfaces/ISession";
import { Export } from "./Export";
import { Output } from "./Output";
import { Parameter } from "./Parameter";

export class Session implements ISession {
    // #region Properties (11)

    private readonly _exports: { [key: string]: IExport; } = {};
    private readonly _outputs: { [key: string]: IOutput; } = {};
    private readonly _outputsCreated: { [key: string]: IOutput; } = {};
    private readonly _parameters: { [key: string]: IParameter; } = {};
    private readonly _sessionEngine: SessionEngine;

    private _commitParameters: boolean= false;
    private _initialized: boolean = false;
    private _node: TreeNode;
    private _parameterControlNames: string[]= [];
    private _parameterControlOrder: string[]= [];
    private _parameterHidden: string[]= [];

    // #endregion Properties (11)

    // #region Constructors (1)

    constructor(
        private readonly _sceneTree: Tree,
        private readonly _onUpdate: () => void,
        private readonly _ticket: string,
        private readonly _modelViewUrl: string
    ) {
        this._node = new TreeNode(this.ticket)
        this._sessionEngine = new SessionEngine(this._ticket, this._modelViewUrl);
    }

    // #endregion Constructors (1)

    // #region Public Accessors (14)

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
     * Getter exports
     * @return {{ [key: string]: IExport; }}
     */
    public get exports(): { [key: string]: IExport; } {
        return this._exports;
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
     * Getter outputs
     * @return {{ [key: string]: IOutput; }}
     */
    public get outputs(): { [key: string]: IOutput; } {
        return this._outputs;
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
     * Getter parameters
     * @return {{ [key: string]: IParameter; }}
     */
    public get parameters(): { [key: string]: IParameter; } {
        return this._parameters;
    }

    /**
     * Getter ticket
     * @return {string}
     */
    public get ticket(): string {
        return this._ticket;
    }

    // #endregion Public Accessors (14)

    // #region Public Methods (13)

    public createOutput(id: string): IOutput {
        if(this._outputs[id] || this._outputsCreated[id]) 
            throw Error('Output with this id already exists.')
            
        this._outputsCreated[id] = new Output(id, { version: '1.0' });
        this._outputs[id] = this._outputsCreated[id];
        return this._outputs[id];
    }

    public async customize(): Promise<TreeNode> {
        this._sceneTree.removeNode(this._node);
        for(let parameterId in this.parameters) 
            this._sessionEngine.parameters[parameterId].value = this.parameters[parameterId].value;
        for(let outputId in this._outputsCreated)
            this._sessionEngine.outputs[outputId] = this._outputsCreated[outputId];
        
        this._node = await this._sessionEngine.customize();

        this._sceneTree.addNode(this._node);
        this._onUpdate();
        return this._node;
    }

    public getExportById(id: string): IExport[] {
        const exports: IExport[] = [];
        for(let exportId in this.exports) {
            if(exportId === id)
                exports.push(this.exports[exportId])
        }
        return exports;
    }

    public getExportByName(name: string): IExport[] {
        const exports: IExport[] = [];
        for(let exportId in this.exports) {
            if(name === this.exports[exportId].name)
                exports.push(this.exports[exportId])
        }
        return exports;    
    }

    public getExportByType(type: string): IExport[] {
        const exports: IExport[] = [];
        for(let exportId in this.exports) {
            if(type === this.exports[exportId].type)
                exports.push(this.exports[exportId])
        }
        return exports;    
    }

    public getOutputById(id: string): IOutput[] {
        const outputs: IOutput[] = [];
        for(let outputId in this.outputs) {
            if(outputId === id)
                outputs.push(this.outputs[outputId])
        }
        return outputs;
    }

    public getOutputByName(name: string): IOutput[] {
        const outputs: IOutput[] = [];
        for(let outputId in this.outputs) {
            if(name === this.outputs[outputId].name)
                outputs.push(this.outputs[outputId])
        }
        return outputs; 
    }

    public getParameterById(id: string): IParameter[] {
        const parameters: IParameter[] = [];
        for(let parameterId in this.parameters) {
            if(parameterId === id)
                parameters.push(this.parameters[parameterId])
        }
        return parameters;
    }

    public getParameterByName(name: string): IParameter[] {
        const parameters: IParameter[] = [];
        for(let parameterId in this.parameters) {
            if(name === this.parameters[parameterId].name)
                parameters.push(this.parameters[parameterId])
        }
        return parameters; 
    }

    public getParameterByType(type: string): IParameter[] {
        const parameters: IParameter[] = [];
        for(let parameterId in this.parameters) {
            if(type === this.parameters[parameterId].type)
                parameters.push(this.parameters[parameterId])
        }
        return parameters; 
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

    // #endregion Public Methods (13)
}
