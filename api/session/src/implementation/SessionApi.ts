import {
	ReqExport,
	ResAssetDefinition,
	ResBase,
	ResGetModelState,
	ResModelState,
} from "@shapediver/sdk.geometry-api-sdk-v2";
import {
	CreationControlCenterSession,
	ICreationControlCenterSession,
} from "@shapediver/viewer.creation-control-center.session";
import {GLTFConverter} from "@shapediver/viewer.data-engine.gltf-converter";
import {
	DraggingParameter,
	DrawingParameter,
	FileParameter,
	GumballTransformParameter,
	RectangleTransformParameter,
	SelectionParameter,
	SessionEngine,
} from "@shapediver/viewer.session-engine.session-engine";
import {ITreeNode} from "@shapediver/viewer.shared.node-tree";
import {
	InputValidator,
	Logger,
	ShapeDiverViewerSessionError,
	StateEngine,
} from "@shapediver/viewer.shared.services";
import {ISettingsSections} from "@shapediver/viewer.shared.types";
import {IExportApi} from "../interfaces/IExportApi";
import {IOutputApi} from "../interfaces/IOutputApi";
import {ISessionApi} from "../interfaces/ISessionApi";
import {IParameterApi} from "../interfaces/parameter/IParameterApi";
import {SessionApiData} from "./data/SessionApiData";
import {ExportApi} from "./ExportApi";
import {OutputApi} from "./OutputApi";
import {DraggingParameterApi} from "./parameter/DraggingParameterApi";
import {DrawingParameterApi} from "./parameter/DrawingParameterApi";
import {FileParameterApi} from "./parameter/FileParameterApi";
import {GumballTransformParameterApi} from "./parameter/GumballTransformParameterApi";
import {ParameterApi} from "./parameter/ParameterApi";
import {RectangleTransformParameterApi} from "./parameter/RectangleTransformParameterApi";
import {SelectionParameterApi} from "./parameter/SelectionParameterApi";

export class SessionApi implements ISessionApi {
	// #region Properties (9)

	readonly #creationControlCenterSession: ICreationControlCenterSession =
		CreationControlCenterSession.instance;
	readonly #exports: {[key: string]: IExportApi} = {};
	readonly #gltfConverter: GLTFConverter = GLTFConverter.instance;
	readonly #inputValidator: InputValidator = InputValidator.instance;
	readonly #logger: Logger = Logger.instance;
	readonly #outputs: {[key: string]: IOutputApi} = {};
	readonly #parameters: {[key: string]: IParameterApi<unknown>} = {};
	readonly #sessionEngine: SessionEngine;
	readonly #stateEngine: StateEngine = StateEngine.instance;

	// #endregion Properties (9)

	// #region Constructors (1)

	constructor(sessionEngine: SessionEngine) {
		this.#sessionEngine = sessionEngine;
		if (!this.#sessionEngine.initialized)
			throw new ShapeDiverViewerSessionError(
				"Session could not be initialized.",
			);

		this.#sessionEngine.updateCallback = (newNode?: ITreeNode) => {
			if (!newNode) return;

			if (
				newNode.data.findIndex((d) => d instanceof SessionApiData) ===
				-1
			)
				newNode.addData(new SessionApiData(this));
		};
		this.#sessionEngine.updateCallback(this.node, this.node);

		for (const o in this.#sessionEngine.outputs)
			this.#outputs[o] = new OutputApi(this.#sessionEngine.outputs[o]);

		for (const e in this.#sessionEngine.exports)
			this.#exports[e] = new ExportApi(this.#sessionEngine.exports[e]);

		for (const p in this.#sessionEngine.parameters) {
			if (this.#sessionEngine.parameters[p] instanceof FileParameter) {
				this.#parameters[p] = new FileParameterApi(
					<FileParameter>this.#sessionEngine.parameters[p],
				);
			} else if (
				this.#sessionEngine.parameters[p] instanceof SelectionParameter
			) {
				this.#parameters[p] = new SelectionParameterApi(
					<SelectionParameter>this.#sessionEngine.parameters[p],
				);
			} else if (
				this.#sessionEngine.parameters[p] instanceof
				GumballTransformParameter
			) {
				this.#parameters[p] = new GumballTransformParameterApi(
					<GumballTransformParameter>(
						this.#sessionEngine.parameters[p]
					),
				);
			} else if (
				this.#sessionEngine.parameters[p] instanceof
				RectangleTransformParameter
			) {
				this.#parameters[p] = new RectangleTransformParameterApi(
					<RectangleTransformParameter>(
						this.#sessionEngine.parameters[p]
					),
				);
			} else if (
				this.#sessionEngine.parameters[p] instanceof DrawingParameter
			) {
				this.#parameters[p] = new DrawingParameterApi(
					<DrawingParameter>this.#sessionEngine.parameters[p],
				);
			} else if (
				this.#sessionEngine.parameters[p] instanceof DraggingParameter
			) {
				this.#parameters[p] = new DraggingParameterApi(
					<DraggingParameter>this.#sessionEngine.parameters[p],
				);
			} else {
				this.#parameters[p] = new ParameterApi(
					this.#sessionEngine.parameters[p],
				);
			}
		}
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (30)

	public get automaticSceneUpdate(): boolean {
		return this.#sessionEngine.automaticSceneUpdate;
	}

	public set automaticSceneUpdate(value: boolean) {
		const scope = "automaticSceneUpdate";
		this.#inputValidator.validateAndError(
			`SessionApi.${scope}`,
			value,
			"boolean",
		);
		this.#sessionEngine.automaticSceneUpdate = value;
		this.#logger.debug(`SessionApi.${scope}: ${scope} was set to ${value}`);
	}

	public get parametersCommit(): boolean | undefined {
		return this.#sessionEngine.settingsEngine.configuration
			?.parametersCommit;
	}

	public set parametersCommit(value: boolean | undefined) {
		const scope = "parametersCommit";
		this.#inputValidator.validateAndError(
			`SessionApi.${scope}`,
			value,
			"boolean",
		);
		if (!this.#sessionEngine.settingsEngine.configuration)
			this.#sessionEngine.settingsEngine.configuration = {};
		this.#sessionEngine.settingsEngine.configuration.parametersCommit =
			value;
		this.#logger.debug(`SessionApi.${scope}: ${scope} was set to ${value}`);
	}

	public get parametersDisable(): boolean | undefined {
		return this.#sessionEngine.settingsEngine.configuration
			?.parametersDisable;
	}

	public set parametersDisable(value: boolean | undefined) {
		const scope = "parametersDisable";
		this.#inputValidator.validateAndError(
			`SessionApi.${scope}`,
			value,
			"boolean",
		);
		if (!this.#sessionEngine.settingsEngine.configuration)
			this.#sessionEngine.settingsEngine.configuration = {};
		this.#sessionEngine.settingsEngine.configuration.parametersDisable =
			value;
		this.#logger.debug(`SessionApi.${scope}: ${scope} was set to ${value}`);
	}

	public get hideDataOutputs(): boolean | undefined {
		return this.#sessionEngine.settingsEngine.configuration
			?.hideDataOutputs;
	}

	public set hideDataOutputs(value: boolean | undefined) {
		const scope = "hideDataOutputs";
		this.#inputValidator.validateAndError(
			`SessionApi.${scope}`,
			value,
			"boolean",
		);
		if (!this.#sessionEngine.settingsEngine.configuration)
			this.#sessionEngine.settingsEngine.configuration = {};
		this.#sessionEngine.settingsEngine.configuration.hideDataOutputs =
			value;
		this.#logger.debug(`SessionApi.${scope}: ${scope} was set to ${value}`);
	}

	public get hideDataOutputsIframe(): boolean | undefined {
		return this.#sessionEngine.settingsEngine.configuration
			?.hideDataOutputsIframe;
	}

	public set hideDataOutputsIframe(value: boolean | undefined) {
		const scope = "hideDataOutputsIframe";
		this.#inputValidator.validateAndError(
			`SessionApi.${scope}`,
			value,
			"boolean",
		);
		if (!this.#sessionEngine.settingsEngine.configuration)
			this.#sessionEngine.settingsEngine.configuration = {};
		this.#sessionEngine.settingsEngine.configuration.hideDataOutputsIframe =
			value;
		this.#logger.debug(`SessionApi.${scope}: ${scope} was set to ${value}`);
	}

	public get hideDesktopClients(): boolean | undefined {
		return this.#sessionEngine.settingsEngine.configuration
			?.hideDesktopClients;
	}

	public set hideDesktopClients(value: boolean | undefined) {
		const scope = "hideDesktopClients";
		this.#inputValidator.validateAndError(
			`SessionApi.${scope}`,
			value,
			"boolean",
		);
		if (!this.#sessionEngine.settingsEngine.configuration)
			this.#sessionEngine.settingsEngine.configuration = {};
		this.#sessionEngine.settingsEngine.configuration.hideDesktopClients =
			value;
		this.#logger.debug(`SessionApi.${scope}: ${scope} was set to ${value}`);
	}

	public get hideExports(): boolean | undefined {
		return this.#sessionEngine.settingsEngine.configuration?.hideExports;
	}

	public set hideExports(value: boolean | undefined) {
		const scope = "hideExports";
		this.#inputValidator.validateAndError(
			`SessionApi.${scope}`,
			value,
			"boolean",
		);
		if (!this.#sessionEngine.settingsEngine.configuration)
			this.#sessionEngine.settingsEngine.configuration = {};
		this.#sessionEngine.settingsEngine.configuration.hideExports = value;
		this.#logger.debug(`SessionApi.${scope}: ${scope} was set to ${value}`);
	}

	public get hideExportsIframe(): boolean | undefined {
		return this.#sessionEngine.settingsEngine.configuration
			?.hideExportsIframe;
	}

	public set hideExportsIframe(value: boolean | undefined) {
		const scope = "hideExportsIframe";
		this.#inputValidator.validateAndError(
			`SessionApi.${scope}`,
			value,
			"boolean",
		);
		if (!this.#sessionEngine.settingsEngine.configuration)
			this.#sessionEngine.settingsEngine.configuration = {};
		this.#sessionEngine.settingsEngine.configuration.hideExportsIframe =
			value;
		this.#logger.debug(`SessionApi.${scope}: ${scope} was set to ${value}`);
	}

	public get hideSavedStates(): boolean | undefined {
		return this.#sessionEngine.settingsEngine.configuration
			?.hideSavedStates;
	}

	public set hideSavedStates(value: boolean | undefined) {
		const scope = "hideSavedStates";
		this.#inputValidator.validateAndError(
			`SessionApi.${scope}`,
			value,
			"boolean",
		);
		if (!this.#sessionEngine.settingsEngine.configuration)
			this.#sessionEngine.settingsEngine.configuration = {};
		this.#sessionEngine.settingsEngine.configuration.hideSavedStates =
			value;
		this.#logger.debug(`SessionApi.${scope}: ${scope} was set to ${value}`);
	}

	public get hideSavedStatesIframe(): boolean | undefined {
		return this.#sessionEngine.settingsEngine.configuration
			?.hideSavedStatesIframe;
	}

	public set hideSavedStatesIframe(value: boolean | undefined) {
		const scope = "hideSavedStatesIframe";
		this.#inputValidator.validateAndError(
			`SessionApi.${scope}`,
			value,
			"boolean",
		);
		if (!this.#sessionEngine.settingsEngine.configuration)
			this.#sessionEngine.settingsEngine.configuration = {};
		this.#sessionEngine.settingsEngine.configuration.hideSavedStatesIframe =
			value;
		this.#logger.debug(`SessionApi.${scope}: ${scope} was set to ${value}`);
	}

	public get hideAttributeVisualization(): boolean | undefined {
		return this.#sessionEngine.settingsEngine.configuration
			?.hideAttributeVisualization;
	}

	public set hideAttributeVisualization(value: boolean | undefined) {
		const scope = "hideAttributeVisualization";
		this.#inputValidator.validateAndError(
			`SessionApi.${scope}`,
			value,
			"boolean",
		);
		if (!this.#sessionEngine.settingsEngine.configuration)
			this.#sessionEngine.settingsEngine.configuration = {};
		this.#sessionEngine.settingsEngine.configuration.hideAttributeVisualization =
			value;
		this.#logger.debug(`SessionApi.${scope}: ${scope} was set to ${value}`);
	}

	public get hideAttributeVisualizationIframe(): boolean | undefined {
		return this.#sessionEngine.settingsEngine.configuration
			?.hideAttributeVisualizationIframe;
	}

	public set hideAttributeVisualizationIframe(value: boolean | undefined) {
		const scope = "hideAttributeVisualizationIframe";
		this.#inputValidator.validateAndError(
			`SessionApi.${scope}`,
			value,
			"boolean",
		);
		if (!this.#sessionEngine.settingsEngine.configuration)
			this.#sessionEngine.settingsEngine.configuration = {};
		this.#sessionEngine.settingsEngine.configuration.hideAttributeVisualizationIframe =
			value;
		this.#logger.debug(`SessionApi.${scope}: ${scope} was set to ${value}`);
	}

	public get hideJsonMenu(): boolean | undefined {
		return this.#sessionEngine.settingsEngine.configuration?.hideJsonMenu;
	}

	public set hideJsonMenu(value: boolean | undefined) {
		const scope = "hideJsonMenu";
		this.#inputValidator.validateAndError(
			`SessionApi.${scope}`,
			value,
			"boolean",
		);
		if (!this.#sessionEngine.settingsEngine.configuration)
			this.#sessionEngine.settingsEngine.configuration = {};
		this.#sessionEngine.settingsEngine.configuration.hideJsonMenu = value;
		this.#logger.debug(`SessionApi.${scope}: ${scope} was set to ${value}`);
	}

	public get hideJsonMenuIframe(): boolean | undefined {
		return this.#sessionEngine.settingsEngine.configuration
			?.hideJsonMenuIframe;
	}

	public set hideJsonMenuIframe(value: boolean | undefined) {
		const scope = "hideJsonMenuIframe";
		this.#inputValidator.validateAndError(
			`SessionApi.${scope}`,
			value,
			"boolean",
		);
		if (!this.#sessionEngine.settingsEngine.configuration)
			this.#sessionEngine.settingsEngine.configuration = {};
		this.#sessionEngine.settingsEngine.configuration.hideJsonMenuIframe =
			value;
		this.#logger.debug(`SessionApi.${scope}: ${scope} was set to ${value}`);
	}

	public get customizeOnParameterChange(): boolean {
		return this.#sessionEngine.customizeOnParameterChange;
	}

	public set customizeOnParameterChange(value: boolean) {
		const scope = "customizeOnParameterChange";
		this.#inputValidator.validateAndError(
			`SessionApi.${scope}`,
			value,
			"boolean",
		);
		this.#sessionEngine.customizeOnParameterChange = value;
		this.#logger.debug(`SessionApi.${scope}: ${scope} was set to ${value}`);
	}

	public get excludeViewports(): string[] {
		return this.#sessionEngine.excludeViewports;
	}

	public set excludeViewports(value: string[]) {
		const scope = "excludeViewports";
		this.#inputValidator.validateAndError(
			`SessionApi.${scope}`,
			value,
			"stringArray",
		);
		this.#sessionEngine.excludeViewports = value;
		this.#logger.debug(`SessionApi.${scope}: ${scope} was set to ${value}`);
	}

	public get exports(): {[key: string]: IExportApi} {
		return this.#exports;
	}

	public get guid(): string | undefined {
		return this.#sessionEngine.guid;
	}

	public get hasStoredSettings(): boolean {
		return this.#sessionEngine.hasStoredSettings;
	}

	public get id(): string {
		return this.#sessionEngine.id;
	}

	public get initialized(): boolean {
		return this.#sessionEngine.initialized;
	}

	public get jwtToken(): string | undefined {
		return this.#sessionEngine.jwtToken;
	}

	public get loadSdtf(): boolean {
		return this.#sessionEngine.loadSdtf;
	}

	public set loadSdtf(value: boolean) {
		const scope = "loadSdtf";
		this.#inputValidator.validateAndError(
			`SessionApi.${scope}`,
			value,
			"boolean",
		);
		this.#sessionEngine.loadSdtf = value;
		this.#logger.debug(`SessionApi.${scope}: ${scope} was set to ${value}`);
	}

	public get modelState(): ResModelState | undefined {
		return this.#sessionEngine.modelState;
	}

	public get modelViewUrl(): string {
		return this.#sessionEngine.modelViewUrl;
	}

	public get node(): ITreeNode {
		return this.#sessionEngine.node;
	}

	public get outputs(): {[key: string]: IOutputApi} {
		return this.#outputs;
	}

	public get parameterDefaultValues(): {[key: string]: unknown} {
		const parameterDefaultValues: {[key: string]: unknown} = {};
		for (const key in this.parameters)
			parameterDefaultValues[key] = this.parameters[key].defval;
		return parameterDefaultValues;
	}

	public get parameterSessionValues(): {[key: string]: unknown} {
		const parameterSessionValues: {[key: string]: unknown} = {};
		for (const key in this.parameters)
			parameterSessionValues[key] = this.parameters[key].sessionValue;
		return parameterSessionValues;
	}

	public get parameterValues(): {[key: string]: unknown} {
		const parameterValues: {[key: string]: unknown} = {};
		for (const key in this.parameters)
			parameterValues[key] = this.parameters[key].value;
		return parameterValues;
	}

	public get parameters(): {[key: string]: IParameterApi<unknown>} {
		return this.#parameters;
	}

	public get refreshJwtToken(): (() => Promise<string>) | undefined {
		return this.#sessionEngine.refreshJwtToken;
	}

	public set refreshJwtToken(value: (() => Promise<string>) | undefined) {
		const scope = "refreshJwtToken";
		this.#inputValidator.validateAndError(
			`SessionApi.${scope}`,
			value,
			"function",
			false,
		);
		this.#sessionEngine.refreshJwtToken = value;
		this.#logger.debug(`SessionApi.${scope}: ${scope} was set to ${value}`);
	}

	public get ticket(): string | undefined {
		return this.#sessionEngine.ticket;
	}

	public get updateCallback():
		| ((newNode?: ITreeNode, oldNode?: ITreeNode) => void | Promise<void>)
		| null {
		return this.#sessionEngine.updateCallback;
	}

	public set updateCallback(
		value:
			| ((
					newNode?: ITreeNode,
					oldNode?: ITreeNode,
			  ) => void | Promise<void>)
			| null,
	) {
		const scope = "updateCallback";
		if (value)
			this.#inputValidator.validateAndError(
				`SessionApi.${scope}`,
				value,
				"function",
				false,
			);
		this.#sessionEngine.updateCallback = async (
			newNode?: ITreeNode,
			oldNode?: ITreeNode,
		) => {
			if (
				newNode &&
				newNode.data.findIndex((d) => d instanceof SessionApiData) ===
					-1
			)
				newNode.addData(new SessionApiData(this));
			if (value) await Promise.resolve(value(newNode, oldNode));
		};
		this.#logger.debug(
			`SessionApi.${scope}: ${scope} was updated to ${value}.`,
		);
	}

	// #endregion Public Getters And Setters (30)

	// #region Public Methods (32)

	public applySettings(
		response: ResBase,
		sections?: ISettingsSections,
	): Promise<void> {
		const scope = "applySettings";
		this.#inputValidator.validateAndError(
			`SessionApi.${scope}`,
			response,
			"object",
		);
		this.#inputValidator.validateAndError(
			`SessionApi.${scope}`,
			sections,
			"object",
			false,
		);
		return this.#creationControlCenterSession.applySettings(
			this.id,
			response,
			sections,
		);
	}

	public canGoBack(): boolean {
		return this.#sessionEngine.canGoBack();
	}

	public canGoForward(): boolean {
		return this.#sessionEngine.canGoForward();
	}

	public cancelCustomization(): void {
		this.#sessionEngine.cancelCustomization();
	}

	public async close(): Promise<void> {
		return await this.#creationControlCenterSession.closeSessionEngine(
			this.id,
		);
	}

	public async convertToGlTF(convertForAr: boolean = false): Promise<Blob> {
		for (const r in this.#stateEngine.viewportEngines)
			this.#stateEngine.viewportEngines[r]?.update(
				"SessionApi.convertToGlTF",
			);

		const result = await this.#gltfConverter.convert(
			this.node,
			convertForAr,
		);
		return new Blob([result], {type: "application/octet-stream"});
	}

	public async createModelState(
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
	): Promise<string> {
		const scope = "createModelState";
		this.#inputValidator.validateAndError(
			`SessionApi.${scope}`,
			parameterValues,
			"object",
			false,
		);
		this.#inputValidator.validateAndError(
			`SessionApi.${scope}`,
			omitSessionParameterValues,
			"boolean",
			false,
		);
		return await this.#sessionEngine.createModelState(
			parameterValues,
			omitSessionParameterValues,
			image,
			data,
			arScene,
		);
	}

	public customize(
		parameterValues?: {[key: string]: unknown},
		force: boolean = false,
		waitForViewportUpdate: boolean = false,
	): Promise<ITreeNode> {
		const scope = "customize";
		this.#inputValidator.validateAndError(
			`SessionApi.${scope}`,
			parameterValues,
			"object",
			false,
		);

		// if there are parameter values specified, we set them directly
		// the validation happens in the setter of the ParameterApi
		if (parameterValues)
			for (const p in parameterValues)
				this.parameters[p].value = parameterValues[p];

		this.#inputValidator.validateAndError(
			`SessionApi.${scope}`,
			force,
			"boolean",
			false,
		);
		this.#inputValidator.validateAndError(
			`SessionApi.${scope}`,
			waitForViewportUpdate,
			"boolean",
			false,
		);
		return this.#sessionEngine.customize(
			force,
			waitForViewportUpdate,
		) as Promise<ITreeNode>;
	}

	public customizeParallel(parameterValues: {
		[key: string]: unknown;
	}): Promise<ITreeNode> {
		const scope = "customizeParallel";
		this.#inputValidator.validateAndError(
			`SessionApi.${scope}`,
			parameterValues,
			"object",
		);
		return this.#sessionEngine.customizeParallel(
			parameterValues,
		) as Promise<ITreeNode>;
	}

	public customizeResult(parameterValues: {
		[key: string]: unknown;
	}): Promise<ResBase> {
		const scope = "customizeResult";
		this.#inputValidator.validateAndError(
			`SessionApi.${scope}`,
			parameterValues,
			"object",
		);
		return this.#sessionEngine.customizeParallel(
			parameterValues,
			false,
		) as Promise<ResBase>;
	}

	public customizeWithModelState(
		modelState: string | ResGetModelState,
	): Promise<ITreeNode> {
		return this.#sessionEngine.customizeWithModelState(modelState);
	}

	public getExportById(id: string): IExportApi | null {
		const scope = "getExportById";
		this.#inputValidator.validateAndError(
			`SessionApi.${scope}`,
			id,
			"string",
		);
		return this.#exports[id];
	}

	public getExportByName(name: string): IExportApi[] {
		const scope = "getExportByName";
		this.#inputValidator.validateAndError(
			`SessionApi.${scope}`,
			name,
			"string",
		);
		return Object.values(this.#exports).filter((e) => e.name === name);
	}

	public getExportByType(type: string): IExportApi[] {
		const scope = "getExportByType";
		this.#inputValidator.validateAndError(
			`SessionApi.${scope}`,
			type,
			"string",
		);
		return Object.values(this.#exports).filter((e) => e.type === type);
	}

	public getModelState(modelStateId?: string): Promise<ResGetModelState> {
		const scope = "getModelState";
		this.#inputValidator.validateAndError(
			`SessionApi.${scope}`,
			modelStateId,
			"string",
			false,
		);
		return this.#sessionEngine.getModelState(modelStateId);
	}

	public getOutputByFormat(format: string): IOutputApi[] {
		const scope = "getOutputByFormat";
		this.#inputValidator.validateAndError(
			`SessionApi.${scope}`,
			format,
			"string",
		);
		return Object.values(this.#outputs).filter((o) =>
			o.format.includes(format),
		);
	}

	public getOutputById(id: string): IOutputApi | null {
		const scope = "getOutputById";
		this.#inputValidator.validateAndError(
			`SessionApi.${scope}`,
			id,
			"string",
		);
		return this.#outputs[id];
	}

	public getOutputByName(name: string): IOutputApi[] {
		const scope = "getOutputByName";
		this.#inputValidator.validateAndError(
			`SessionApi.${scope}`,
			name,
			"string",
		);
		return Object.values(this.#outputs).filter((o) => o.name === name);
	}

	public getParameterById(id: string): IParameterApi<unknown> | null {
		const scope = "getParameterById";
		this.#inputValidator.validateAndError(
			`SessionApi.${scope}`,
			id,
			"string",
		);
		return this.#parameters[id];
	}

	public getParameterByName(name: string): IParameterApi<unknown>[] {
		const scope = "getParameterByName";
		this.#inputValidator.validateAndError(
			`SessionApi.${scope}`,
			name,
			"string",
		);
		return Object.values(this.#parameters).filter((p) => p.name === name);
	}

	public getParameterByType(type: string): IParameterApi<unknown>[] {
		const scope = "getParameterByType";
		this.#inputValidator.validateAndError(
			`SessionApi.${scope}`,
			type,
			"string",
		);
		return Object.values(this.#parameters).filter((p) => p.type === type);
	}

	public goBack(): Promise<ITreeNode> {
		return this.#sessionEngine.goBack();
	}

	public goForward(): Promise<ITreeNode> {
		return this.#sessionEngine.goForward();
	}

	public async loadCachedOutputs(outputs: {
		[key: string]: string;
	}): Promise<{[key: string]: ITreeNode | undefined}> {
		return await this.#sessionEngine.loadCachedOutputsParallel(outputs);
	}

	public async requestExports(
		body: ReqExport,
		loadOutputs?: boolean,
		maxWaitMsec?: number,
	): Promise<ResBase> {
		const scope = "requestExports";
		this.#inputValidator.validateAndError(
			`SessionApi.${scope}`,
			body,
			"object",
		);
		this.#inputValidator.validateAndError(
			`SessionApi.${scope}`,
			loadOutputs,
			"boolean",
			false,
		);
		this.#inputValidator.validateAndError(
			`SessionApi.${scope}`,
			maxWaitMsec,
			"number",
			false,
		);
		return this.#sessionEngine.requestExports(
			body,
			loadOutputs,
			maxWaitMsec,
		);
	}

	public resetParameterValues(
		force: boolean = false,
		waitForViewportUpdate: boolean = false,
	): Promise<ITreeNode> {
		const scope = "resetParameterValues";
		for (const p in this.parameters)
			this.parameters[p].value = this.parameters[p].defval;
		this.#inputValidator.validateAndError(
			`SessionApi.${scope}`,
			force,
			"boolean",
			false,
		);
		return this.#sessionEngine.customize(
			force,
			waitForViewportUpdate,
		) as Promise<ITreeNode>;
	}

	public resetSettings(sections?: ISettingsSections): Promise<void> {
		const scope = "applySettings";
		this.#inputValidator.validateAndError(
			`SessionApi.${scope}`,
			sections,
			"object",
			false,
		);
		return this.#creationControlCenterSession.resetSettings(
			this.id,
			sections,
		);
	}

	public saveDefaultParameterValues(): Promise<boolean> {
		return this.#sessionEngine.saveDefaultParameterValues();
	}

	public saveSettings(viewportId?: string): Promise<boolean> {
		const scope = "saveDefaultParameterValues";
		this.#inputValidator.validateAndError(
			`SessionApi.${scope}`,
			viewportId,
			"string",
			false,
		);
		return this.#creationControlCenterSession.saveSettings(
			this.id,
			viewportId,
		);
	}

	public saveUiProperties(): Promise<boolean> {
		return this.#sessionEngine.saveUiProperties();
	}

	public async setJwtToken(value: string): Promise<void> {
		const scope = "setJwtToken";
		this.#inputValidator.validateAndError(
			`SessionApi.${scope}`,
			value,
			"string",
			false,
		);
		await this.#sessionEngine.setJwtToken(value);
		this.#logger.debug(`SessionApi.${scope}: ${scope} was set to ${value}`);
		return;
	}

	public updateOutputs(
		waitForViewportUpdate: boolean = false,
	): Promise<ITreeNode> {
		return this.#sessionEngine.updateOutputs(
			undefined,
			waitForViewportUpdate,
		);
	}

	public async uploadFileParameters(values: {
		[key: string]: string | File | Blob;
	}): Promise<{[key: string]: string}> {
		const fileParameters: {[key: string]: string | File | Blob} =
			values || {};
		const fileParameterIds =
			await this.#sessionEngine.uploadFileParameters(fileParameters);
		return fileParameterIds;
	}

	public async uploadSDTF(
		arrayBuffers: ArrayBuffer[],
	): Promise<ResAssetDefinition[]> {
		return this.#sessionEngine.uploadSDTF(arrayBuffers);
	}

	// #endregion Public Methods (32)
}

export const isSessionApi = (obj: unknown): obj is ISessionApi =>
	obj instanceof SessionApi;
