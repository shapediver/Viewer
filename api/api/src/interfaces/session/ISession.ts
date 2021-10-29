import { TreeNode } from '@shapediver/viewer.shared.node-tree'

import { IExport } from './IExport'
import { IOutput } from './IOutput'
import { IParameter } from './IParameter'

export interface ISession {
    // #region Properties (16)

    readonly authorTicket: boolean | undefined;
    readonly canUploadGLTF: boolean;
    readonly exports: { [key: string]: IExport; };
    readonly id: string;
    readonly initialized: boolean;
    readonly modelViewUrl: string;
    readonly node: TreeNode;
    readonly outputs: { [key: string]: IOutput; };
    readonly parameters: { [key: string]: IParameter<any>; };
    readonly primarySession: boolean;
    readonly primarySessionRequest: boolean;
    readonly ticket: string;

    automaticUpdate: boolean;
    bearerToken: string | undefined;
    commitParameters: boolean;
    commitSettings: boolean;
    refreshBearerToken: () => string;

    // #endregion Properties (16)

    // #region Public Methods (18)

    /**
     * If the session history allows to go back to the last customization call.
     * 
     * @returns 
     */
    canGoBack(): boolean;
    /**
     * If the session history allows to go forward to the next customization call.
     * 
     * @returns 
     */
    canGoForward(): boolean;
    /**
     * Customize the session.
     * All parameter changes will be sent to the server.
     * The server computes the results, sends the results back.
     * THe results are put into the scene tree and the viewers are updated.
     * 
     * @returns 
     */
    customize(): Promise<TreeNode>;
    /**
     * Return the export with the specified id.
     * 
     * @param id the id of the export
     * @returns 
     */
    getExportById(id: string): IExport | null;
    /**
     * Return the exports with the specified name.
     * 
     * @param name the name of the exports
     * @returns 
     */
    getExportByName(name: string): IExport[];
    /**
     * Return the exports with the specified type.
     * 
     * @param type the type of the exports
     * @returns 
     */
    getExportByType(type: string): IExport[];
    /**
     * Return the output with the specified id.
     * 
     * @param id the id of the output
     * @returns 
     */
    getOutputById(id: string): IOutput | null;
    /**
     * Return the outputs with the specified name.
     * 
     * @param name the name of the outputs
     * @returns 
     */
    getOutputByName(name: string): IOutput[];
    /**
     * Return the parameter with the specified id.
     * 
     * @param id the id of the parameter
     * @returns 
     */
    getParameterById(id: string): IParameter<any> | null;
    /**
     * Return the parameters with the specified name.
     * 
     * @param name the name of the parameters
     * @returns 
     */
    getParameterByName(name: string): IParameter<any>[];
    /**
     * Return the parameters with the specified type.
     * 
     * @param type the type of the parameters
     * @returns 
     */
    getParameterByType(type: string): IParameter<any>[];
    /**
     * Go back to the last customization call.
     * 
     * @returns 
     */
    goBack(): Promise<TreeNode>;
    /**
     * Go forward to the next customization call.
     * 
     * @returns 
     */
    goForward(): Promise<TreeNode>;
    /**
     * Initialize the session.
     * Normally, there is no need to call this function.
     * The initialization is done on creation via the api.
     * 
     * @param waitForOutputs resolve the promise only when all outputs are loaded
     */
    init(waitForOutputs?: boolean): Promise<void>;
    /**
     * Save the parameters that are currently used for this session as default parameters.
     * This only works when this session was created with an author ticket.
     * 
     * @returns 
     */
    saveDefaultParameters(): Promise<boolean>;
    /**
     * Save the session properties (displayname, order, hidden and tooltip properties for parameters, exports and outputs).
     * This only works when this session was created with an author ticket.
     * 
     * @returns 
     */
    saveSessionProperties(): Promise<boolean>;
    /**
     * Save the settings that are currently used for this session.
     * If there is multiple viewers, the first one will be used for the settings.
     * This only works when this session was created with an author ticket.
     *
     * @param viewerId the optional viewer id
     */
    saveSettings(viewerId?: string): Promise<boolean>;
    /**
     * Creates a gltf from the current scene and uploads it to the server.
     * Returns the href to the gltf.
     * 
     * @returns 
     */
    uploadGLTF(responseType: 'gltf' | 'usdz'): Promise<string>;

    // #endregion Public Methods (18)
}