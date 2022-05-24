import { ShapeDiverRequestGltfUploadQueryConversion, ShapeDiverResponseDto } from '@shapediver/sdk.geometry-api-sdk-v2'
import { ITreeNode } from '@shapediver/viewer.shared.node-tree'

import { IExportApi } from './IExportApi'
import { IOutputApi } from './IOutputApi'
import { IParameterApi } from './IParameterApi'

/**
 * The api for a session.
 * A session can be started by calling the {@link createSession} method.
 * 
 * Inside a session are the corresponding [parameters]{@link IParameterApi}, [outputs]{@link IOutputApi} and [exports]{@link IExportApi}.
 */
export interface ISessionApi {
    // #region Properties (13)

    /**
     * The [exports]{@link IExportApi} of the session.
     */
    readonly exports: { [key: string]: IExportApi; };
    
    /**
     * The [outputs]{@link IOutputApi} of the session.
     */
     readonly outputs: { [key: string]: IOutputApi; };
     
    /**
     * The [parameters]{@link IParameterApi} of the session.
     */
    readonly parameters: { [key: string]: IParameterApi<any>; };


    /**
     * The id of the session that is created on initialization.
     */
    readonly id: string;
    
    /**
     * The modelViewUrl that is used for the communication with the server.
     */
     readonly modelViewUrl: string;
     
    /**
     * The model ticket that is used for the communication with the server.
     */
    readonly ticket: string;


    /**
     * Determines if the session was already initialized.
     */
    readonly initialized: boolean;

    /**
     * The node of the session in the [scene tree]{@link ITree}.
     */
    readonly node: ITreeNode;


    /**
     * (Platform specific) Option to enable commit-mode for parameters.
     */
    commitParameters: boolean;

    /**
     * (Platform specific) Option to enable commit-mode for settings.
     */
    commitSettings: boolean;

    /**
     * Option to automatically update the scene tree node whenever there is a customization request.
     */
    automaticSceneUpdate: boolean;

    /**
     * Option to customize the scene whenever a parameter is changed.
     */
    customizeOnParameterChange: boolean;

    /**
     * The ids of the viewports in which the session should not be shown.
     */
    excludeViewports: string[];

    /**
     * The JWT token that is used for the communication with the server.
     */
    jwtToken: string | undefined;

    /**
     * A callback that refreshes the JWT token once it expires.
     */
    refreshJwtToken: (() => Promise<string>) | undefined;

    // #endregion Properties (13)

    // #region Public Methods (21)

    /**
     * Update all or some settings of the primary session and the viewports via a ShapeDiverResponseDto of another model.
     * 
     * @param response the ShapeDiverResponseDto of the other model
     */
    applySettings(response: ShapeDiverResponseDto, sections?: {
        session?: {
            parameter?: { 
                /** Option to update the displayname of the parameters (default: false) */
                displayname?: boolean, 
                /** Option to update the order of the parameters (default: false) */
                order?: boolean, 
                /** Option to update the hidden state of the parameters (default: false) */
                hidden?: boolean, 
                /** Option to update the value of the parameters (default: false) */
                value?: boolean 
            },
            export?: { 
                /** Option to update the displayname of the exports (default: false) */
                displayname?: boolean, 
                /** Option to update the order of the exports (default: false) */
                order?: boolean, 
                /** Option to update the hidden state of the exports (default: false) */
                hidden?: boolean 
            }
        },
        viewport?: { 
            /** Option to update the scene settings (default: false) */
            scene?: boolean, 
            /** Option to update the camera settings (default: false) */
            camera?: boolean, 
            /** Option to update the light settings (default: false) */
            light?: boolean, 
            /** Option to update the environment settings (default: false) */
            environment?: boolean 
        }
    }): Promise<void>;

    /**
     * If the session history allows to go back to the last customization call.
     * 
     * @see {@link canGoBack}
     * @see {@link canGoForward}
     * @see {@link goBack}
     * @see {@link goForward}
     */
    canGoBack(): boolean;

    /**
     * If the session history allows to go forward to the next customization call.
     * 
     * @see {@link canGoBack}
     * @see {@link canGoForward}
     * @see {@link goBack}
     * @see {@link goForward}
     */
    canGoForward(): boolean;

    /**
     * Closes the session.
     */
    close(): Promise<void>;

    /**
     * Customize the session.
     * All parameter changes will be sent to the server.
     * The server computes the results, sends the results back.
     * The results are put into the scene tree and the viewports are updated.
     */
    customize(): Promise<ITreeNode>;

    /**
     * Return the export with the specified id.
     * 
     * @param id The id of the export.
     */
    getExportById(id: string): IExportApi | null;

    /**
     * Return the exports with the specified name.
     * 
     * @param name The name of the exports.
     */
    getExportByName(name: string): IExportApi[];

    /**
     * Return the exports with the specified type.
     * 
     * @param type The type of the exports.
     */
    getExportByType(type: string): IExportApi[];

    /**
     * Return the outputs with the specified format.
     * 
     * @param format The format of the output.
     */
    getOutputByFormat(format: string): IOutputApi[];

    /**
     * Return the output with the specified id.
     * 
     * @param id The id of the output.
     */
    getOutputById(id: string): IOutputApi | null;

    /**
     * Return the outputs with the specified name.
     * 
     * @param name The name of the outputs.
     */
    getOutputByName(name: string): IOutputApi[];

    /**
     * Return the parameter with the specified id.
     * 
     * @param id The id of the parameter.
     */
    getParameterById(id: string): IParameterApi<any> | null;

    /**
     * Return the parameters with the specified name.
     * 
     * @param name The name of the parameters.
     */
    getParameterByName(name: string): IParameterApi<any>[];

    /**
     * Return the parameters with the specified type.
     * 
     * @param type The type of the parameters.
     */
    getParameterByType(type: string): IParameterApi<any>[];

    /**
     * Go back to the last customization call.
     * 
     * @see {@link canGoBack}
     * @see {@link canGoForward}
     * @see {@link goBack}
     * @see {@link goForward}
     */
    goBack(): Promise<ITreeNode>;

    /**
     * Go forward to the next customization call.
     * 
     * @see {@link canGoBack}
     * @see {@link canGoForward}
     * @see {@link goBack}
     * @see {@link goForward}
     */
    goForward(): Promise<ITreeNode>;

    /**
     * Save the parameters that are currently used for this session as default parameters.
     * This only works when this session was created with an author ticket.
     */
    saveDefaultParameters(): Promise<boolean>;
    
    /**
     * Save the session properties (displayname, order, hidden and tooltip properties for parameters, exports and outputs).
     * This only works when this session was created with an author ticket.
     */
    saveSessionProperties(): Promise<boolean>;
    
    /**
     * Save the settings that are currently used for this session.
     * If there is multiple viewports, the first one will be used for the settings.
     * This only works when this session was created with an author ticket.
     *
     * @param viewportId The optional viewport id.
     */
    saveSettings(viewportId?: string): Promise<boolean>;
    
    /**
     * Update the current available outputs.
     * Calling this function makes sense if you have updated the outputs manually.
     */
    updateOutputs(): Promise<ITreeNode>;

    // #endregion Public Methods (21)
}