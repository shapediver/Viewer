import { ShapeDiverRequestGltfUploadQueryConversion, ShapeDiverResponseDto } from '@shapediver/sdk.geometry-api-sdk-v2'
import { ITreeNode } from '@shapediver/viewer.shared.node-tree'

import { IExportApi } from './IExportApi'
import { IOutputApi } from './IOutputApi'
import { IParameterApi } from './IParameterApi'

/**
 * The api for sessions.
 * 
 * A session represents an instance of a model hosted on a 
 * {@link https://help.shapediver.com/doc/Geometry-Backend.1863942173.html|ShapeDiver Geometry Backend}. 
 * 
 * Sessions are created by calling {@link createSession}.
 * 
 * The session contains representations of the model's {@link parameters}, {@link outputs} and {@link exports}.
 * Each session corresponds to a {@link node} in the scene tree, which reflects the status of the outputs 
 * for the current parameter values. 
 * 
 * On change of parameter values (aka _customizations_), the session makes the necessary calls to the Geometry Backend
 * to trigger a computation of the model (if required), wait for its completion, download the resulting assets, 
 * and update the session's scene tree node.
 * 
 * A model may define {@link exports}, whose data is not reflected in the scene tree, but can
 * be requested by functionality of the session.
 */
export interface ISessionApi {
    // #region Properties (13)

    /**
     * The [exports]{@link IExportApi} defined by the model.
     * This object maps export ids to export definitions. 
     */
    readonly exports: { [key: string]: IExportApi; };
    
    /**
     * The [outputs]{@link IOutputApi} defined by the model.
     * This object maps output ids to output definitions.
     */
     readonly outputs: { [key: string]: IOutputApi; };
     
    /**
     * The [parameters]{@link IParameterApi} defined by the model.
     * This object maps parameter ids to parameter definitions.
     */
    readonly parameters: { [key: string]: IParameterApi<any>; };


    /**
     * The unique identifier of the session that was specified
     * or automatically chosen on creation of the session.
     */
    readonly id: string;
    
    /**
     * The modelViewUrl of the 
     * {@link https://help.shapediver.com/doc/Geometry-Backend.1863942173.html|ShapeDiver Geometry Backend} 
     * hosting the model.
     */
    readonly modelViewUrl: string;
     
    /**
     * The ticket for direct embedding of the model represented by the session. 
     * This identifies the model on the Geometry Backend.
     */
    readonly ticket: string;


    /**
     * Determines if the session was already initialized.
     * ATOM: What does this mean precisely?
     */
    readonly initialized: boolean;

    /**
     * The node of the session in the [scene tree]{@link ITree}.
     */
    readonly node: ITreeNode;


    /**
     * (Platform specific) Option to enable commit-mode for parameters.
     * ATOM: Which precise effect does this have on the behavior of the session?
     */
    commitParameters: boolean;

    /**
     * (Platform specific) Option to enable commit-mode for settings.
     * ATOM: Which precise effect does this have on the behavior of the session?
     */
    commitSettings: boolean;

    /**
     * Option to automatically update the scene tree node whenever a customization finishes.
     */
    automaticSceneUpdate: boolean;

    /**
     * Option to trigger a customization whenever a parameter value is changed.
     * Use this with care as this might max out the rate limit for your model on the Geometry Backend.
     * ATOM: Did we have this option so far?
     */
    customizeOnParameterChange: boolean;

    /**
     * The ids of the viewports in which the session's scene tree {@link node} should not be shown.
     */
    excludeViewports: string[];

    /**
     * The JWT used for authorizing API calls to the Geometry Backend.
     */
    jwtToken: string | undefined;

    /**
     * Optional callback which can be specified for refreshing the JWT. 
     * This will be called by the session once the JWT expires. 
     * The callback is required to provide a fresh JWT.
     */
    refreshJwtToken: (() => Promise<string>) | undefined;

    // #endregion Properties (13)

    // #region Public Methods (21)

    /**
     * Update all or some settings of the current session and the viewports based on the Geometry Backend
     * response object of another model. 
     * ATOM: please explain how {@link SESSION_SETTINGS_MODE} of the viewports influences this.
     * 
     * @param response the ShapeDiverResponseDto of the model whose settings shall be applied
     * @param sections ATOM: please explain
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
     * Check if the session's history allows to go back to a previous state of parameter values.
     * 
     * @see {@link canGoBack}
     * @see {@link canGoForward}
     * @see {@link goBack}
     * @see {@link goForward}
     */
    canGoBack(): boolean;

    /**
     * Check if the session's history allows to go forward to a next state of parameter values.
     * 
     * @see {@link canGoBack}
     * @see {@link canGoForward}
     * @see {@link goBack}
     * @see {@link goForward}
     */
    canGoForward(): boolean;

    /**
     * Close the session. 
     * This removes the {@link node} from the scene tree and closes the session
     * with the Geometry Backend.
     */
    close(): Promise<boolean>;

    /**
     * Customize the session.
     * 
     * The current state of parameter values is used to request the outputs
     * of the model from the Geometry Backend. In case the Geometry Backend 
     * has the required output versions cached, it will reply immediately, 
     * otherwise a computation request for the model will be triggered and awaited. 
     * Once the output versions are available the resulting assets will be 
     * downloaded, extracted, and the resulting scene tree node will be returned.
     * 
     * Unless {@link automaticSceneUpdate} is set to false, the session's {@link node}
     * will be updated immediately and viewports will be rendered.
     */
    customize(): Promise<ITreeNode>;

    /**
     * Get an export definition by id.
     * 
     * @param id The id of the export.
     */
    getExportById(id: string): IExportApi | null;

    /**
     * Get export definitions by name. 
     * Please note that a model may define multiple exports for a given name.
     * 
     * @param name The name of the exports.
     */
    getExportByName(name: string): IExportApi[];

    /**
     * Get export definitions by type. 
     * Please note that a model may define multiple exports for a given type.
     * 
     * @param type The type of the exports.
     */
    getExportByType(type: string): IExportApi[];

    /**
     * Get output definitions by format of the output's current content.
     * 
     * This function filters output definitions by the format of the output's
     * current content, which depends on the current state of the {@link node}.
     * The results of this function may vary depending on this state.
     * 
     * ATOM to be clarified what the filter is based on exactly.
     * 
     * @param format The format of the output's content.
     */
    getOutputByFormat(format: string): IOutputApi[];

    /**
     * Get an output definition by id.
     * 
     * @param id The id of the output.
     */
    getOutputById(id: string): IOutputApi | null;

    /**
     * Get output definitions by name.
     * Please note that a model may define multiple outputs for a given name.
     * 
     * @param name The name of the outputs.
     */
    getOutputByName(name: string): IOutputApi[];

    /**
     * Get parameter definition by id.
     * 
     * @param id The id of the parameters.
     */
    getParameterById(id: string): IParameterApi<any> | null;

    /**
     * Get parameter definitions by name.
     * Note that a model may define multiple parameters for a given name.
     * 
     * @param name The name of the parameters.
     */
    getParameterByName(name: string): IParameterApi<any>[];

    /**
     * Get parameter definitions by type.
     * Note that a model may define multiple parameters for a given type.
     * 
     * @param type The type of the parameters.
     */
    getParameterByType(type: string): IParameterApi<any>[];

    /**
     * Go back to the previous recorded state of parameter values.
     * 
     * @see {@link canGoBack}
     * @see {@link canGoForward}
     * @see {@link goBack}
     * @see {@link goForward}
     */
    goBack(): Promise<ITreeNode>;

    /**
     * Go forward to the next recorded state of parameter values.
     * 
     * @see {@link canGoBack}
     * @see {@link canGoForward}
     * @see {@link goBack}
     * @see {@link goForward}
     */
    goForward(): Promise<ITreeNode>;

    /**
     * Initialize the session.
     * Normally, there is no need to call this function.
     * The initialization is done on creation via the api.
     * 
     * ATOM: Do we need to expose this function? To my understanding all of this is covered by createSession.
     * 
     * @param waitForOutputs Option to resolve the promise only when all outputs are loaded. (default: true)
     * @param loadOutputs Option to not load the outputs. (default: true)
     * @param initialParameters Optional initial parameter set.
     */
    init(waitForOutputs?: boolean, loadOutputs?: boolean, initialParameters?: { [key: string]: string }): Promise<void>;
    
    /**
     * Save the current state of parameter values of this session as the default parameter values of the model. 
     * 
     * This call will throw an exception if the ticket and JWT do not grant the required permission to 
     * save parameter default values for the model.
     */
    saveDefaultParameterValues(): Promise<boolean>;
    
    /**
     * Save UI-related properties of parameter, output, and export definitions (displayname, order, hidden and tooltip, etc).
     * 
     * This call will throw an exception if the ticket and JWT do not grant the required permissions for the model.
     * 
     * ATOM: If supported by the geometry backend let's split that call into separate ones for parameters, outputs, exports.
     */
    saveUiProperties(): Promise<boolean>;
    
    /**
     * Save the 3D viewer related settings of this session to the model hosted on the Geometry Backend.
     * 
     * ATOM: Is this correct?: If there are multiple viewports, the first one will be used for the settings.
     * ATOM: Let's extend this such that viewport and session settings can be saved individually or both at the same time. 
     * Probably this will require to fetch the current settings object from the backend, update only the viewport or session
     * settings part of it, and save again.
     * 
     * This call will throw an exception if the ticket and JWT do not grant the required permission to 
     * save viewer settings for the model.
     *
     * @param viewportId The optional viewport id.
     */
    saveSettings(viewportId?: string): Promise<boolean>;
    
    /**
     * Update the current available outputs.
     * Calling this function makes sense if you have updated the outputs manually.
     * 
     * ATOM: How does one update the outputs manually?
     */
    updateOutputs(): Promise<ITreeNode>;

    // #endregion Public Methods (21)
}