import {
	ReqExport,
	ResAssetDefinition,
	ResBase,
	ResGetModelState,
	ResModelState,
} from "@shapediver/sdk.geometry-api-sdk-v2";
import {ITreeNode} from "@shapediver/viewer.shared.node-tree";
import {ISettingsSections} from "@shapediver/viewer.shared.types";
import {IExportApi} from "./IExportApi";
import {IOutputApi} from "./IOutputApi";
import {IParameterApi} from "./parameter/IParameterApi";

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
 * and create an updated scene tree.
 *
 * A model may define {@link exports}, whose data is not reflected in the scene tree, but can
 * be requested by functionality of the session.
 */
export interface ISessionApi {
	// #region Properties (20)

	/**
	 * The [exports]{@link IExportApi} defined by the model.
	 * This object maps export ids to export definitions.
	 */
	readonly exports: {[key: string]: IExportApi};
	/**
	 * The geometry backend model id (guid).
	 * This identifies the model on the Geometry Backend. A {@link jwtToken} is needed for authentication.
	 */
	readonly guid?: string;
	/**
	 * Flag to indicate if the session has stored settings.
	 * This is true if at some points settings were stored for the session.
	 */
	readonly hasStoredSettings: boolean;
	/**
	 * The unique identifier of the session that was specified
	 * or automatically chosen on creation of the session.
	 */
	readonly id: string;
	/**
	 * The JWT used for authorizing API calls to the Geometry Backend.
	 *
	 * @see setJwtToken
	 */
	readonly jwtToken: string | undefined;
	/**
	 * The model state of the session.
	 * This object contains information about the model state.
	 * It is only available if a model state id was provided on session creation.
	 */
	readonly modelState?: ResModelState;
	/**
	 * The modelViewUrl of the
	 * {@link https://help.shapediver.com/doc/Geometry-Backend.1863942173.html|ShapeDiver Geometry Backend}
	 * hosting the model.
	 */
	readonly modelViewUrl: string;
	/**
	 * The node of the session in the [scene tree]{@link ITree}.
	 */
	readonly node: ITreeNode;
	/**
	 * The [outputs]{@link IOutputApi} defined by the model.
	 * This object maps output ids to output definitions.
	 */
	readonly outputs: {[key: string]: IOutputApi};
	/**
	 * The parameter values that are the defaults of the session.
	 * Changing these values does not have any affect. The values in this dictionary only reflect the _defval_ of the [parameters]{@link IParameterApi}.
	 */
	readonly parameterDefaultValues: {[key: string]: unknown};
	/**
	 * The parameter values that were used in the last successful session customization.
	 * These values may not reflect the current state in the [parameters]{@link IParameterApi} if there was a change in parameters after the last customization call.
	 * Changing these values does not have any affect. The values in this dictionary only reflect the _sessionValue_ of the [parameters]{@link IParameterApi}.
	 */
	readonly parameterSessionValues: {[key: string]: unknown};
	/**
	 * The parameter values that are currently set in the API.
	 * These values may not reflect the current state in the scene if there was a change in parameters after the last customization call.
	 * Changing these values does not have any affect. The values in this dictionary only reflect the _value_ of the [parameters]{@link IParameterApi}.
	 */
	readonly parameterValues: {[key: string]: unknown};
	/**
	 * The [parameters]{@link IParameterApi} defined by the model.
	 * This object maps parameter ids to parameter definitions.
	 */
	readonly parameters: {[key: string]: IParameterApi<unknown>};
	/**
	 * The ticket for direct embedding of the model represented by the session.
	 * This identifies the model on the Geometry Backend.
	 */
	readonly ticket?: string;

	/**
	 * Option to automatically update the session's scene tree node whenever a customization finishes. (default: true)
	 *
	 * In case this is set to false, the session's scene tree {@link node} will not be automatically replaced
	 * by the node returned from {@link customize}. This can be used to plug the result of {@link customize}
	 * into other parts of the scene tree.
	 */
	automaticSceneUpdate: boolean;
	/**
	 * Configuration Settings for the model.
	 * This settings is not used within the viewer, but is passed through for usage in the platform or App Builder.
	 * If you want to change this setting, please do so on the model edit page of the ShapeDiver platform.
	 */
	parametersCommit?: boolean;
	/**
	 * Configuration Settings for the model.
	 * This settings is not used within the viewer, but is passed through for usage in the platform or App Builder.
	 * If you want to change this setting, please do so on the model edit page of the ShapeDiver platform.
	 */
	parametersDisable?: boolean;
	/**
	 * Configuration Settings for the model.
	 * This settings is not used within the viewer, but is passed through for usage in the platform or App Builder.
	 * If you want to change this setting, please do so on the model edit page of the ShapeDiver platform.
	 */
	hideDataOutputs?: boolean;
	/**
	 * Configuration Settings for the model.
	 * This settings is not used within the viewer, but is passed through for usage in the platform or App Builder.
	 * If you want to change this setting, please do so on the model edit page of the ShapeDiver platform.
	 */
	hideDataOutputsIframe?: boolean;
	/**
	 * Configuration Settings for the model.
	 * This settings is not used within the viewer, but is passed through for usage in the platform or App Builder.
	 * If you want to change this setting, please do so on the model edit page of the ShapeDiver platform.
	 */
	hideDesktopClients?: boolean;
	/**
	 * Configuration Settings for the model.
	 * This settings is not used within the viewer, but is passed through for usage in the platform or App Builder.
	 * If you want to change this setting, please do so on the model edit page of the ShapeDiver platform.
	 */
	hideExports?: boolean;
	/**
	 * Configuration Settings for the model.
	 * This settings is not used within the viewer, but is passed through for usage in the platform or App Builder.
	 * If you want to change this setting, please do so on the model edit page of the ShapeDiver platform.
	 */
	hideExportsIframe?: boolean;
	/**
	 * Configuration Settings for the model.
	 * This settings is not used within the viewer, but is passed through for usage in the platform or App Builder.
	 * If you want to change this setting, please do so on the model edit page of the ShapeDiver platform.
	 */
	hideSavedStates?: boolean;
	/**
	 * Configuration Settings for the model.
	 * This settings is not used within the viewer, but is passed through for usage in the platform or App Builder.
	 * If you want to change this setting, please do so on the model edit page of the ShapeDiver platform.
	 */
	hideSavedStatesIframe?: boolean;
	/**
	 * Configuration Settings for the model.
	 * This settings is not used within the viewer, but is passed through for usage in the platform or App Builder.
	 * If you want to change this setting, please do so on the model edit page of the ShapeDiver platform.
	 */
	hideAttributeVisualization?: boolean;
	/**
	 * Configuration Settings for the model.
	 * This settings is not used within the viewer, but is passed through for usage in the platform or App Builder.
	 * If you want to change this setting, please do so on the model edit page of the ShapeDiver platform.
	 */
	hideAttributeVisualizationIframe?: boolean;
	/**
	 * Configuration Settings for the model.
	 * This settings is not used within the viewer, but is passed through for usage in the platform or App Builder.
	 * If you want to change this setting, please do so on the model edit page of the ShapeDiver platform.
	 */
	hideJsonMenu?: boolean;
	/**
	 * Configuration Settings for the model.
	 * This settings is not used within the viewer, but is passed through for usage in the platform or App Builder.
	 * If you want to change this setting, please do so on the model edit page of the ShapeDiver platform.
	 */
	hideJsonMenuIframe?: boolean;
	/**
	 * Option to trigger a call to {@link customize} whenever a parameter value is changed.
	 *
	 * Use this with care as this might max out the rate limit for your model on the Geometry Backend.
	 */
	customizeOnParameterChange: boolean;
	/**
	 * The ids of the viewports in which the session's scene tree {@link node} should not be shown.
	 */
	excludeViewports: string[];
	/**
	 * Option to load the SDTF data. The data is not loaded by default as it can be quite large. (default: false)
	 */
	loadSdtf: boolean;
	/**
	 * Optional callback which can be specified for refreshing the JWT.
	 * This will be called by the session once the JWT expires.
	 * The callback is required to provide a fresh JWT.
	 */
	refreshJwtToken: (() => Promise<string>) | undefined;
	/**
	 * A callback that is executed whenever a session's {@link node} is to be replaced
	 * due to an update of the session's content.
	 * Provides the new scene tree node and the old one, so that data can be carried over.
	 * If the callback is a promise it will be awaited in the execution chain.
	 */
	updateCallback:
		| ((newNode?: ITreeNode, oldNode?: ITreeNode) => void | Promise<void>)
		| null;

	// #endregion Properties (20)

	// #region Public Methods (31)

	/**
	 * Update all or some settings of the current session and the viewports based on the Geometry Backend
	 * response object of another model.
	 *
	 * @see {@link IViewportApi.sessionSettingsMode}
	 * @see {@link IViewportApi.sessionSettingsId}
	 *
	 * @param response the ResBase of the model whose settings shall be applied
	 * @param sections specify true for those parts of the settings that should be applied
	 *
	 * @throws {@link ShapeDiverViewerError}
	 */
	applySettings(
		response: ResBase,
		sections?: ISettingsSections,
	): Promise<void>;
	/**
	 * Check if the session's history allows to go back to a previous state of parameter values.
	 * The session history is recorded whenever {@link customize} is called.
	 *
	 * A further state of parameter values is recorded whenever a successful _customization_ happens.
	 *
	 * @see {@link customize}
	 * @see {@link canGoBack}
	 * @see {@link canGoForward}
	 * @see {@link goBack}
	 * @see {@link goForward}
	 */
	canGoBack(): boolean;
	/**
	 * Check if the session's history allows to go forward to a next state of parameter values.
	 * The session history is recorded whenever {@link customize} is called.
	 *
	 * A further state of parameter values is recorded whenever a successful _customization_ happens.
	 *
	 * @see {@link customize}
	 * @see {@link canGoBack}
	 * @see {@link canGoForward}
	 * @see {@link goBack}
	 * @see {@link goForward}
	 */
	canGoForward(): boolean;
	/**
	 * Cancel the current customization if there is one in progress.
	 * Requests that were already sent will still be received, but not further processed.
	 */
	cancelCustomization(): void;
	/**
	 * Close the session.
	 * This removes the {@link node} from the scene tree and closes the session
	 * with the Geometry Backend.
	 *
	 * @throws {@type ShapeDiverViewerError}
	 */
	close(): Promise<void>;
	/**
	 * Convert the session into a glTF file.
	 *
	 * The ground plane and grid will not be included, as well as additionally added data that was added to the scene other than through a {@link GeometryData} property.
	 *
	 * @param convertForAR Option to convert the scene for AR. In this case some specific use cases are target to ensure the best AR performance. (default: false)
	 *
	 * @throws {@type ShapeDiverViewerError}
	 */
	convertToGlTF(convertForAR?: boolean): Promise<Blob>;
	/**
	 * Create a new model state.
	 * This function creates a new model state on the Geometry Backend.
	 *
	 * For each parameter, the current state of the parameter in the session is used if no parameter value is provided. The omitSessionParameterValues flag can be used to store the model state without the current parameter values of the session.
	 * For the image property, a function that returns a data URL (`() => string`), a data URL (`string`), a Blob (`Blob`) or a File (`File`) can be provided. (Example: `() => viewport.getScreenShot()`)
	 * The data property can be used to provide additional data for the model state. An example for this would be a UI state object of a web application.
	 * The arScene property can be used to provide a glTF representing an AR scene of the model state. The glTF can be provided as an ArrayBuffer ('ArrayBuffer'), a function that returns an ArrayBuffer (`() => ArrayBuffer`), a Blob (`Blob`), a function that returns an Blob (`() => Blob`), or a File (`File`). (Example: `() => viewport.convertToGlTF()`)
	 *
	 * @param parameterValues The set of parameter values to use. Map from parameter id to parameter value. The current value will be used for any parameter not specified.
	 * @param omitSessionParameterValues If omitSessionParameterValues is set to true, the current parameter values of the session will not be stored with the model state, if no parameter value is provided. (Default: false)
	 * @param image The image to use for the model state. Can be a function that returns a data URL (`() => string`), a function of a promise of a data URL (`() => Promise<string>`), a data URL (`string`), a promise of a data URL (`Promise<string>`), a Blob (`Blob`) or a File (`File`).
	 * @param data The additional data for the model state.
	 * @param arScene The AR scene for the model state. Can be a function that returns an ArrayBuffer ('ArrayBuffer'), a function that returns an ArrayBuffer (`() => ArrayBuffer`), a Blob (`Blob`), a function that returns an Blob (`() => Blob`), or a File (`File`).
	 *
	 * @returns The id of the created model state.
	 */
	createModelState(
		parameterValues?: {[key: string]: unknown},
		omitSessionParameterValues?: boolean,
		image?:
			| (() => string)
			| (() => Promise<string>)
			| string
			| Promise<string>
			| Blob
			| File,
		data?: Record<string, any>,
		arScene?:
			| (() => Promise<ArrayBuffer>)
			| ArrayBuffer
			| (() => Promise<Blob>)
			| Blob
			| File,
	): Promise<string>;
	/**
	 * Customize the session.
	 *
	 * The current state of parameter values is used to request the outputs
	 * of the model from the Geometry Backend. The specific version of an
	 * output for a given set of parameter values is called _output version_.
	 * In case the Geometry Backend has already cached the requested output versions,
	 * it will reply immediately, otherwise a computation request for the missing
	 * output versions of the model will be triggered and awaited.
	 * Once the output versions are available, the resulting assets will be
	 * downloaded, extracted, and the resulting scene tree node will be created.
	 *
	 * Unless {@link automaticSceneUpdate} is set to false, the session's {@link node}
	 * will be updated and viewports will be rendered.
	 *
	 * Independent of {@link automaticSceneUpdate}, right before returning the following
	 * will happen:
	 *
	 *   * for each parameter {@link IParameterApi.sessionValue} will be updated.
	 *   * for each output affected by the customization, {@link IOutputApi.updateCallback}
	 *     will be invoked, and {@link IOutputApi.node} will be updated (outputs for which
	 *     {@link IOutputApi.freeze} is true will be skipped).
	 *
	 * @param parameterValues The set of parameter values to use. Map from parameter id to parameter value. The current value will be used for any parameter not specified.
	 * @param force If force is set to true, the customization call will even be called if no parameters have changed. (Default: false)
	 * @param waitForViewportUpdate If waitForViewportUpdate is set to true, the promise will only resolve when the geometry was processed by the viewport(s) and is visible in the scene. (Default: false)
	 *
	 * @throws {@type ShapeDiverViewerError}
	 */
	customize(
		parameterValues?: {[key: string]: unknown},
		force?: boolean,
		waitForViewportUpdate?: boolean,
	): Promise<ITreeNode>;
	/**
	 * Customize the session, parallel mode.
	 *
	 * Use this instead of {@link customize} in case you want to run several
	 * _customizations_ in parallel, or you do not want the customization to
	 * affect the current state of the {@link outputs} or {@link parameters}.
	 * The node resulting from this call has to be manually inserted into the scene.
	 *
	 * Calls to this function will not update the session's {@link node}
	 * nor the outputs' {@link IOutputApi.node|nodes}, and also not update
	 * {@link IParameterApi.sessionValue} of the parameters.
	 * Note that {@link IOutputApi.updateCallback} will not be called, and
	 * {@link IOutputApi.freeze} will be ignored.
	 *
	 * @param parameterValues The set of parameter values to use. Map from parameter id to parameter value. The current value will be used for any parameter not specified.
	 *
	 * @throws {@type ShapeDiverViewerError}
	 */
	customizeParallel(parameterValues: {
		[key: string]: unknown;
	}): Promise<ITreeNode>;
	/**
	 * Customize the session and only receive the result of the customization call.
	 *
	 * Use this instead of {@link customize} in case you want to run
	 * _customizations_ and only work with the data of the customization result
	 *
	 * Calls to this function will not update the session's {@link node}
	 * nor the outputs' {@link IOutputApi.node|nodes}, and also not update
	 * {@link IParameterApi.sessionValue} of the parameters.
	 * Note that {@link IOutputApi.updateCallback} will not be called, and
	 * {@link IOutputApi.freeze} will be ignored.
	 *
	 * @param parameterValues The set of parameter values to use. Map from parameter id to parameter value. The current value will be used for any parameter not specified.
	 *
	 * @throws {@type ShapeDiverViewerError}
	 */
	customizeResult(parameterValues: {
		[key: string]: unknown;
	}): Promise<ResBase>;
	/**
	 * Customize the session with a given model state.
	 * This function creates uses the parameter values of the given model state to customize the session.
	 *
	 * @param modelState The model state to use. This can be a model state id or a ResBase.
	 *
	 * @throws {@type ShapeDiverViewerError}
	 */
	customizeWithModelState(modelState: string | ResBase): Promise<ITreeNode>;
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
	 * Get the model state of the provided model state id.
	 *
	 * @param modelStateId The id of the model state to get. If not provided, the current model state will be returned.
	 */
	getModelState(modelStateId?: string): Promise<ResGetModelState>;
	/**
	 * Get output definitions by format of the output's current content.
	 *
	 * This function filters output definitions by the format of the output's
	 * current content, which depends on the current state of the output's {@link IOutputApi.node}.
	 * The results of this function may vary depending on this state.
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
	getParameterById(id: string): IParameterApi<unknown> | null;
	/**
	 * Get parameter definitions by name.
	 * Note that a model may define multiple parameters for a given name.
	 *
	 * @param name The name of the parameters.
	 */
	getParameterByName(name: string): IParameterApi<unknown>[];
	/**
	 * Get parameter definitions by type.
	 * Note that a model may define multiple parameters for a given type.
	 *
	 * @param type The type of the parameters.
	 */
	getParameterByType(type: string): IParameterApi<unknown>[];
	/**
	 * Go back to the previous recorded state of parameter values.
	 * The session history is recorded whenever {@link customize} is called.
	 *
	 * @see {@link customize}
	 * @see {@link canGoBack}
	 * @see {@link canGoForward}
	 * @see {@link goBack}
	 * @see {@link goForward}
	 *
	 * @throws {@type ShapeDiverViewerError}
	 */
	goBack(): Promise<ITreeNode>;
	/**
	 * Go forward to the next recorded state of parameter values.
	 * The session history is recorded whenever {@link customize} is called.
	 *
	 * @see {@link customize}
	 * @see {@link canGoBack}
	 * @see {@link canGoForward}
	 * @see {@link goBack}
	 * @see {@link goForward}
	 *
	 * @throws {@type ShapeDiverViewerError}
	 */
	goForward(): Promise<ITreeNode>;
	/**
	 * Load cached outputs to be able to insert them into the scene manually.
	 *
	 * Only outputs that are cached on the backend are loaded.
	 * If an output is not cached, undefined is returned instead.
	 *
	 * @param outputs The set of outputs. Map from output id to output version.
	 *
	 * @throws {@type ShapeDiverViewerError}
	 */
	loadCachedOutputs(outputs: {
		[key: string]: string;
	}): Promise<{[key: string]: ITreeNode | undefined}>;
	/**
	 * Request one or multiple exports.
	 *
	 * @param body The body of the export request.
	 * @param body.parameters Parameter values to be used for this export request. Map from parameter id to parameter value. The current value will be used for any parameter not specified.
	 * @param body.exports The ids of the exports to request.
	 * @param body.outputs The ids of the outputs to request.
	 * @param body.max_wait_time Maximum amount of milliseconds to wait for completion of export request before responding.
	 * @param loadOutputs If loadOutputs is set to true, if result of the export request contains outputs, they will be loaded into the session. (Default: false)
	 * @param maxWaitTime Maximum amount of milliseconds to wait for completion of the complete request.
	 *
	 * @throws {@type ShapeDiverViewerError}
	 */
	requestExports(
		body: ReqExport,
		loadOutputs?: boolean,
		maxWaitMsec?: number,
	): Promise<ResBase>;
	/**
	 * Reset the parameters to their stored default values and customize the scene.
	 *
	 * @param force If force is set to true, the customization call will even be called if no parameters have changed. (Default: false)
	 *
	 * @throws {@type ShapeDiverViewerError}
	 */
	resetParameterValues(force?: boolean): Promise<ITreeNode>;
	/**
	 * Reset all or some settings of the current session and the viewports.
	 *
	 * @param sections specify false for those parts of the settings that should not be applied
	 *
	 * @throws {@type ShapeDiverViewerError}
	 */
	resetSettings(sections?: ISettingsSections): Promise<void>;
	/**
	 * Save the current state of parameter values of this session as the default parameter values of the model.
	 *
	 * This call will throw an exception if the ticket and JWT do not grant the required permission to
	 * save parameter default values for the model.
	 *
	 * @throws {@type ShapeDiverViewerError}
	 */
	saveDefaultParameterValues(): Promise<boolean>;
	/**
	 * Save the 3D viewport related settings of this session to the model hosted on the Geometry Backend.
	 *
	 * If a viewportId is provided, the settings of that viewport will be used for saving.
	 *
	 * This call will throw an exception if the ticket and JWT do not grant the required permission to
	 * save viewport settings for the model.
	 *
	 * @param viewportId The optional viewport id.
	 *
	 * @throws {@type ShapeDiverViewerError}
	 */
	saveSettings(viewportId?: string): Promise<boolean>;
	/**
	 * Save UI-related properties of parameter, output, and export definitions (displayname, order, hidden and tooltip, etc).
	 *
	 * This call will throw an exception if the ticket and JWT do not grant the required permissions for the model.
	 *
	 * @throws {@type ShapeDiverViewerError}
	 */
	saveUiProperties(): Promise<boolean>;
	/**
	 * Set a new JWT used for authorizing API calls to the Geometry Backend.
	 * If a change of the JWT would result in different parameters / exports / outputs of the model,
	 * please create a new session with that token instead.
	 *
	 * @see jwtToken
	 * @param token
	 */
	setJwtToken(token: string): Promise<void>;
	/**
	 * Update the current available outputs.
	 * Calling this function makes sense if you have updated one of
	 * the outputs manually by calling {@link IOutputApi.updateOutputContent}.
	 *
	 * @param waitForViewportUpdate If waitForViewportUpdate is set to true, the promise will only resolve when the geometry was processed by the viewport(s) and is visible in the scene. (Default: false)
	 *
	 * @throws {@type ShapeDiverViewerError}
	 */
	updateOutputs(waitForViewportUpdate?: boolean): Promise<ITreeNode>;
	/**
     * Upload the files that are specified in the provided values.
     * If a file parameter is not specified in the values, the current value will be used. 
     * The ids of the uploaded files are returned in a map from parameter id to file id.
     * 
     * Note: The currently set file parameters will be uploaded automatically by {@link customize}, {@link customizeParallel}, {@link requestExports}, and {@link requestExport}.

    * @param values The set of file parameters to upload. If a parameter is not a file parameter, the current value will be used.
     */
	uploadFileParameters(values: {
		[key: string]: string | File | Blob;
	}): Promise<{[key: string]: string}>;

	/**
	 * Upload the provided array buffers as sdTF files.
	 * The uploaded files will be processed and their definitions returned.
	 *
	 * @param arrayBuffers
	 */
	uploadSDTF(arrayBuffers: ArrayBuffer[]): Promise<ResAssetDefinition[]>;

	// #endregion Public Methods (31)
}
