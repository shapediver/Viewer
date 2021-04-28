import { ISessionResponse } from '../../interfaces/session/ISessionResponse';
import { ISessionAction } from '../../interfaces/session/ISessionAction';
import { ISessionExport } from '../../interfaces/session/ISessionExport';
import { ISessionOutput } from '../../interfaces/session/ISessionOutput';
import { ISessionParameter } from '../../interfaces/session/ISessionParameter';
import { SessionAction } from './SessionAction';
import { SessionExport } from './SessionExport';
import { SessionOutput } from './SessionOutput';
import { SessionOutputContent } from './SessionOutputContent';
import { SessionParameter } from './SessionParameter';

export class SessionResponse implements ISessionResponse {
    // #region Properties (8)

    private _actions: {
        [key: string]: ISessionAction
    } = {};
    private _config: {
        [key: string]: any
    } = {};
    private _exports: {
        [key: string]: ISessionExport
    } = {};
    private _msg: string = '';
    private _name: string = '';
    private _outputs: {
        [key: string]: ISessionOutput
    } = {};
    private _parameters: {
        [key: string]: ISessionParameter
    } = {};
    private _version: string = '';

    // #endregion Properties (8)

    // #region Public Accessors (16)

    /**
     * Getter actions
     * @return {{ [key: string]: ISessionAction }}
     */
    public get actions(): {
        [key: string]: ISessionAction
    } {
        return this._actions;
    }

    /**
     * Setter actions
     * @param {{ [key: string]: ISessionAction }} value
     */
    public set actions(value: {
        [key: string]: ISessionAction
    }) {
        this._actions = value;
    }

    /**
     * Getter config
     * @return {{ [key: string]: any }}
     */
    public get config(): {
        [key: string]: any
    } {
        return this._config;
    }

    /**
     * Setter config
     * @param {{ [key: string]: any }} value
     */
    public set config(value: {
        [key: string]: any
    }) {
        this._config = value;
    }

    /**
     * Getter exports
     * @return {{ [key: string]: ISessionExport }}
     */
    public get exports(): {
        [key: string]: ISessionExport
    } {
        return this._exports;
    }

    /**
     * Setter exports
     * @param {{ [key: string]: ISessionExport }} value
     */
    public set exports(value: {
        [key: string]: ISessionExport
    }) {
        this._exports = value;
    }

    /**
     * Getter msg
     * @return {string}
     */
    public get msg(): string {
        return this._msg;
    }

    /**
     * Setter msg
     * @param {string} value
     */
    public set msg(value: string) {
        this._msg = value;
    }

    /**
     * Getter name
     * @return {string}
     */
    public get name(): string {
        return this._name;
    }

    /**
     * Setter name
     * @param {string} value
     */
    public set name(value: string) {
        this._name = value;
    }

    /**
     * Getter outputs
     * @return {{ [key: string]: ISessionOutput }}
     */
    public get outputs(): {
        [key: string]: ISessionOutput
    } {
        return this._outputs;
    }

    /**
     * Setter outputs
     * @param {{ [key: string]: ISessionOutput }} value
     */
    public set outputs(value: {
        [key: string]: ISessionOutput
    }) {
        this._outputs = value;
    }

    /**
     * Getter parameters
     * @return {{ [key: string]: ISessionParameter }}
     */
    public get parameters(): {
        [key: string]: ISessionParameter
    } {
        return this._parameters;
    }

    /**
     * Setter parameters
     * @param {{ [key: string]: ISessionParameter }} value
     */
    public set parameters(value: {
        [key: string]: ISessionParameter
    }) {
        this._parameters = value;
    }

    /**
     * Getter version
     * @return {string}
     */
    public get version(): string {
        return this._version;
    }

    /**
     * Setter version
     * @param {string} value
     */
    public set version(value: string) {
        this._version = value;
    }

    // #endregion Public Accessors (16)

    // #region Public Methods (1)

    public adaptSession(sessionDefinition: ISessionResponse) {
        // convert actions
        if(sessionDefinition.actions) {
            for (let i = 0, len = sessionDefinition.actions.length; i < len; i++) {
                const action = (<ISessionAction[]>sessionDefinition.actions)[i];
                if(action.name)
                    this.actions[action.name] = new SessionAction(action.href, action.method, action.name, action.template, action.title);
            }
        }
        
        // convert config
        if(sessionDefinition.config) {
            for(let configId in sessionDefinition.config) {
                this.config[configId] = sessionDefinition.config[configId];
            }
        }

        // convert exports
        if(sessionDefinition.exports) {
            for(let exportId in sessionDefinition.exports) {
                const exportDef = sessionDefinition.exports[exportId];
                this.exports[exportId] = new SessionExport(exportId, exportDef.name, exportDef.type);
            }
        }
        
        // convert msg
        if(sessionDefinition.msg && !this.msg) {
            this.msg = sessionDefinition.msg;
        }
        
        // convert name
        if(sessionDefinition.name && !this.name) {
            this.name = sessionDefinition.name;
        }

        // convert outputs
        if(sessionDefinition.outputs) {
            for(let outputId in sessionDefinition.outputs) {
                const outputDef = sessionDefinition.outputs[outputId];
                const content = [];
                if(outputDef.content) {
                    for (let i = 0, len = outputDef.content.length; i < len; i++) {
                        const contentDef = outputDef.content[i];
                        content.push(new SessionOutputContent(contentDef.converted, contentDef.data, contentDef.format, contentDef.href, contentDef.size));
                    }
                }
                this.outputs[outputId] = new SessionOutput(outputId, outputDef.version, outputDef.bbmax, outputDef.bbmin, content, outputDef.delay, outputDef.material, outputDef.name);
            }
        }

        // convert parameters
        if(sessionDefinition.parameters) {
            for(let parameterId in sessionDefinition.parameters) {
                const parameterDef = sessionDefinition.parameters[parameterId];
                this.parameters[parameterId] = new SessionParameter(parameterId, parameterDef.type, parameterDef.defval, parameterDef.choices, parameterDef.decimalplaces, parameterDef.format, parameterDef.max, parameterDef.min, parameterDef.name, parameterDef.note, parameterDef.visualization);
            }
        }

        // convert version
        if(sessionDefinition.version && !this.version) {
            this.version = sessionDefinition.version;
        }
    }

    // #endregion Public Methods (1)
}