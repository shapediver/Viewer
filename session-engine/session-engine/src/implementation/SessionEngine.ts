import { SessionJson, Session, SessionOutput, SessionData, SessionOutputContent, SessionParameter, SessionExport } from '@shapediver/viewer.shared.types';

import { ISessionEngine } from '../interfaces/ISessionEngine';
import { OutputDelayException } from './OutputDelayException';
import { OutputLoader } from './OutputLoader';
import { SessionTreeNode } from './SessionTreeNode';

import httpClient from '@shapediver/viewer.utils.http-client'

export class SessionEngine implements ISessionEngine {
    // #region Properties (2)

    private readonly _outputLoader: OutputLoader;

    private _session: Session = new Session();

    // #endregion Properties (2)

    // #region Constructors (1)

    /**
     * Can be use to initialize a session with the ticket and modelViewUrl and returns a scene graph node with the result.
     * Can be use to customize the session with updated parameters to get the updated scene graph node.
     * 
     * @param ticket the model ticket
     * @param modelViewUrl the model view url
     */
    constructor(
        private readonly ticket: string,
        private readonly modelViewUrl: string
    ) {
        this._outputLoader = new OutputLoader(this._session);
    }

    // #endregion Constructors (1)

    // #region Public Accessors (1)

    public get parameters(): { [key: string]: SessionParameter } {
        return this._session.parameters;
    }

    public get exports(): { [key: string]: SessionExport } {
        return this._session.exports;
    }

    public get outputs(): { [key: string]: SessionOutput } {
        return this._session.outputs;
    }

    // #endregion Public Accessors (1)

    // #region Public Methods (3)

    /**
     * Customizes the session with updated parameters to get the updated scene graph node.
     * 
     * @param parameters the parameter set to update the session
     * @returns promise with a scene graph node
     */
    public async customize(): Promise<SessionTreeNode> {
        const parameters: { [key: string]: string } = {};
        for (let parameter in this._session.parameters)
            parameters[parameter] = this._session.parameters[parameter].value;
        return this.customizeSession(parameters);
    }

    private async customizeSession(parameters: { [key: string]: string }): Promise<SessionTreeNode> {
        try {
            const responseCustomize = <SessionJson>(await httpClient.post(
                this._session.actions['customize'].href!,
                null,
                {
                    data: parameters,
                    headers: {
                        "Content-Type": "application/json",
                        "X-ShapeDiver-Origin": "http://127.0.0.1:8080",
                    }
                }
            )).data;
            this._session.adaptSession(responseCustomize);
            return this.loadOutputs(parameters, this._session.outputs);
        } catch (e) {
            return new SessionTreeNode();
        }
    }


    /**
     * Initializes the session with the ticket and modelViewUrl.
     * 
     * @returns promise with a scene graph node
     */
    public async init(): Promise<SessionTreeNode> {
        try {
            const sessionResponse = <SessionJson>(await httpClient.post(
                this.modelViewUrl + "/ticket/" + this.ticket,
                null,
                {
                    headers: {
                        "X-ShapeDiver-Origin": window.location.origin + '',
                    }
                }
            )).data;

            this._session.adaptSession(sessionResponse);
                
            const parameters: { [key: string]: string } = {};
            for (let parameter in this._session.parameters)
                parameters[parameter] = this._session.parameters[parameter].value;
            return this.loadOutputs(parameters, this._session.outputs);
        } catch (e) {
            return new SessionTreeNode();
        }
    }

    public async loadCustomContent(content: SessionOutputContent): Promise<SessionTreeNode> {
        return await this._outputLoader.loadContent('custom', content);
    }

    // #endregion Public Methods (3)

    // #region Private Methods (2)

    /**
     * Load the outputs and return the scene graph node of the result.
     * In case the outputs have a delay property, another customization request with the parameter set is sent.
     * 
     * @param parameters the parameter set to update the session 
     * @param outputs the outputs to load
     * @returns promise with a scene graph node
     */
    private async loadOutputs(parameters: { [key: string]: string }, outputs: { [key: string]: SessionOutput; }): Promise<SessionTreeNode> {
        try {
            const node = await this._outputLoader.loadOutputs(outputs);
            node.data.push(new SessionData(this._session));
            return node;
        }
        catch (e) {
            if (e instanceof OutputDelayException) {
                await this.timeout(e.delay);
            }
            return this.customizeSession(parameters);
        }
    }

    /**
     * Returns a promise that resolves after the amount of milliseconds provided.
     * 
     * @param ms the milliseconds
     * @returns promise that resolve after specified milliseconds
     */
    private async timeout(ms: number): Promise<any> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private parametersAsStringDictionary(): {[key: string]: string} {
        const mapping: { [key: string]: string } = {};
        for(let parameterId in this._session.parameters)
            mapping[parameterId] = this._session.parameters[parameterId].value;
        return mapping;
    }

    // #endregion Private Methods (2)
}