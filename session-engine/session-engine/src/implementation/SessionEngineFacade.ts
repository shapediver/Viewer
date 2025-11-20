import {
	QueryGltfConversion,
	ReqCustomization,
	ReqExport,
	ResAssetDefinition,
	ResBase,
	ResExport,
	ResGetModelState,
	ResModelState,
} from "@shapediver/sdk.geometry-api-sdk-v2";
import {ITreeNode} from "@shapediver/viewer.shared.node-tree";
import {SettingsEngine} from "@shapediver/viewer.shared.services";
import {
	ISettingsSections,
	ITaskEventDescription,
} from "@shapediver/viewer.shared.types";

import {IExport} from "../interfaces/dto/IExport";
import {IOutput} from "../interfaces/dto/IOutput";
import {IParameter} from "../interfaces/dto/IParameter";
import {
	ISessionEngine,
	ISessionEngineCreationDefinition,
} from "../interfaces/ISessionEngine";
import {CustomizationManager} from "./managers/CustomizationManager";
import {ExportManager} from "./managers/ExportManager";
import {FileUploadManager} from "./managers/FileUploadManager";
import {ModelStateManager} from "./managers/ModelStateManager";
import {OutputManager} from "./managers/OutputManager";
import {ParameterManager} from "./managers/ParameterManager";
import {SettingsManager} from "./managers/SettingsManager";
import {SessionEngineCore} from "./SessionEngineCore";

/**
 * Facade that implements the ISessionEngine interface and exposes
 * the functionality of the Session Engine.
 *
 * The facade creates and holds references to all managers
 * and the core of the Session Engine.
 */
export class SessionEngineFacade implements ISessionEngine {
	private readonly _customizationManager: CustomizationManager;
	private readonly _exportManager: ExportManager;
	private readonly _fileUploadManager: FileUploadManager;
	private readonly _modelStateManager: ModelStateManager;
	private readonly _outputManager: OutputManager;
	private readonly _parameterManager: ParameterManager;
	private readonly _sessionEngineCore: SessionEngineCore;
	private readonly _settingsManager: SettingsManager;

	constructor(properties: ISessionEngineCreationDefinition) {
		this._sessionEngineCore = new SessionEngineCore(properties);
		this._settingsManager = this._sessionEngineCore.settingsManager;
		this._outputManager = this._sessionEngineCore.outputManager;
		this._exportManager = this._sessionEngineCore.exportManager;
		this._customizationManager =
			this._sessionEngineCore.customizationManager;
		this._parameterManager = this._sessionEngineCore.parameterManager;
		this._fileUploadManager = this._sessionEngineCore.fileUploadManager;
		this._modelStateManager = this._sessionEngineCore.modelStateManager;
	}

	public get automaticSceneUpdate(): boolean {
		return this._sessionEngineCore.automaticSceneUpdate;
	}

	public set automaticSceneUpdate(value: boolean) {
		this._sessionEngineCore.automaticSceneUpdate = value;
	}

	public get canUploadGLTF(): boolean {
		return this._fileUploadManager.canUploadGLTF;
	}

	public get customizeOnParameterChange(): boolean {
		return this._customizationManager.customizeOnParameterChange;
	}

	public set customizeOnParameterChange(value: boolean) {
		this._customizationManager.customizeOnParameterChange = value;
	}

	public get excludeViewports(): string[] {
		return this._sessionEngineCore.excludeViewports;
	}

	public set excludeViewports(value: string[]) {
		this._sessionEngineCore.excludeViewports = value;
	}

	public get exports(): {[key: string]: IExport} {
		return this._exportManager.exports;
	}

	public get guid(): string | undefined {
		return this._sessionEngineCore.guid;
	}

	public get hasStoredSettings(): boolean {
		return this._settingsManager.hasStoredSettings;
	}

	public get id(): string {
		return this._sessionEngineCore.id;
	}

	public get initialized(): boolean {
		return this._sessionEngineCore.initialized;
	}

	public get jwtToken(): string | undefined {
		return this._sessionEngineCore.jwtToken;
	}

	public get loadSdtf(): boolean {
		return this._sessionEngineCore.loadSdtf;
	}

	public set loadSdtf(value: boolean) {
		this._sessionEngineCore.loadSdtf = value;
	}

	public get modelState(): ResModelState | undefined {
		return this._modelStateManager.modelState;
	}

	public get modelViewUrl(): string {
		return this._sessionEngineCore.modelViewUrl;
	}

	public get node(): ITreeNode {
		return this._sessionEngineCore.node;
	}

	public get outputs(): {[key: string]: IOutput} {
		return this._outputManager.outputs;
	}

	public get outputsFreeze(): {[key: string]: boolean} {
		return this._outputManager.outputsFreeze;
	}

	public get parameterValues(): {[key: string]: string} {
		return this._parameterManager.parameterValues;
	}

	public get parameters(): {[key: string]: IParameter<unknown>} {
		return this._parameterManager.parameters;
	}

	public get refreshJwtToken(): (() => Promise<string>) | undefined {
		return this._sessionEngineCore.refreshJwtToken;
	}

	public set refreshJwtToken(value: (() => Promise<string>) | undefined) {
		this._sessionEngineCore.refreshJwtToken = value;
	}

	public get settingsEngine(): SettingsEngine {
		return this._settingsManager.settingsEngine;
	}

	public get ticket(): string | undefined {
		return this._sessionEngineCore.ticket;
	}

	public get updateCallback():
		| ((newNode?: ITreeNode, oldNode?: ITreeNode) => void)
		| null {
		return this._sessionEngineCore.updateCallback;
	}

	public set updateCallback(
		value: ((newNode?: ITreeNode, oldNode?: ITreeNode) => void) | null,
	) {
		this._sessionEngineCore.updateCallback = value;
	}

	public get viewerSettings(): object | undefined {
		return this._settingsManager.viewerSettings;
	}

	public applySettings(
		response: ResBase,
		sections?: ISettingsSections,
	): void {
		return this._settingsManager.applySettings(response, sections);
	}

	public canGoBack(): boolean {
		return this._parameterManager.canGoBack();
	}

	public canGoForward(): boolean {
		return this._parameterManager.canGoForward();
	}

	public cancelCustomization(): void {
		return this._customizationManager.cancelCustomization();
	}

	public close(): Promise<void> {
		return this._sessionEngineCore.close();
	}

	public createModelState(
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
		return this._modelStateManager.createModelState(
			parameterValues,
			omitSessionParameterValues,
			image,
			data,
			arScene,
		);
	}

	public customize(
		force?: boolean,
		waitForViewportUpdate?: boolean,
	): Promise<ITreeNode | ResBase> {
		return this._customizationManager.customize(
			force,
			waitForViewportUpdate,
		);
	}

	public customizeParallel(
		parameterValues: {[key: string]: unknown},
		loadOutputs?: boolean,
	): Promise<ITreeNode | ResBase> {
		return this._customizationManager.customizeParallel(
			parameterValues,
			loadOutputs,
		);
	}

	public customizeWithModelState(
		modelState: string | ResBase,
	): Promise<ITreeNode> {
		return this._modelStateManager.customizeWithModelState(
			modelState as string | ResGetModelState,
		);
	}

	public getModelState(modelStateId?: string): Promise<ResGetModelState> {
		return this._modelStateManager.getModelState(modelStateId);
	}

	public goBack(): Promise<ITreeNode> {
		return this._parameterManager.goBack();
	}

	public goForward(): Promise<ITreeNode> {
		return this._parameterManager.goForward();
	}

	public init(parameterValues?: {[key: string]: string}): Promise<void> {
		return this._sessionEngineCore.init(parameterValues);
	}

	public loadCachedOutputsParallel(
		outputMapping: {[key: string]: string},
		taskEventInfo?: ITaskEventDescription,
		retry?: boolean,
	): Promise<{[key: string]: ITreeNode | undefined}> {
		return this._outputManager.loadCachedOutputsParallel(
			outputMapping,
			taskEventInfo,
			retry,
		);
	}

	public requestExport(
		exportId: string,
		parameters: ReqCustomization,
		maxWaitTime: number,
	): Promise<ResExport> {
		return this._exportManager.requestExport(
			exportId,
			parameters,
			maxWaitTime,
		);
	}

	public requestExports(
		body: ReqExport,
		loadOutputs?: boolean,
		maxWaitMsec?: number,
	): Promise<ResBase> {
		return this._exportManager.requestExports(
			body,
			loadOutputs,
			maxWaitMsec,
		);
	}

	public resetSettings(sections?: ISettingsSections): void {
		return this._settingsManager.resetSettings(sections);
	}

	public saveDefaultParameterValues(): Promise<boolean> {
		return this._settingsManager.saveDefaultParameterValues();
	}

	public saveSettings(json: unknown): Promise<boolean> {
		return this._settingsManager.saveSettings(json);
	}

	public saveUiProperties(saveInSettings?: boolean): Promise<boolean> {
		return this._settingsManager.saveUiProperties(saveInSettings);
	}

	public setJwtToken(token: string): Promise<void> {
		return this._sessionEngineCore.setJwtToken(token);
	}

	public updateOutputs(
		taskEventInfo?: ITaskEventDescription,
		waitForViewportUpdate?: boolean,
	): Promise<ITreeNode> {
		return this._outputManager.updateOutputs(
			taskEventInfo,
			waitForViewportUpdate,
		);
	}

	public uploadFile(
		parameterId: string,
		data: File,
		type: string,
	): Promise<string> {
		return this._fileUploadManager.uploadFile(parameterId, data, type);
	}

	public uploadFileParameters(parameterValues?: {
		[key: string]: string | File | Blob;
	}): Promise<{[key: string]: string}> {
		return this._fileUploadManager.uploadFileParameters(parameterValues);
	}

	public uploadGLTF(
		blob: Blob,
		conversion?: QueryGltfConversion,
	): Promise<ResBase> {
		return this._fileUploadManager.uploadGLTF(blob, conversion);
	}

	public uploadSDTF(
		arrayBuffers: ArrayBuffer[],
	): Promise<ResAssetDefinition[]> {
		return this._fileUploadManager.uploadSDTF(arrayBuffers);
	}
}
