import {
	QueryGltfConversion,
	ReqCustomization,
	ReqExport,
	ResBase,
	ResExport,
	ResFileInfo,
	ResModelState,
} from "@shapediver/sdk.geometry-api-sdk-v2";
import {ITreeNode} from "@shapediver/viewer.shared.node-tree";
import {SettingsEngine} from "@shapediver/viewer.shared.services";
import {ISettingsSections} from "@shapediver/viewer.shared.types";
import {OutputLoaderTaskEventInfo} from "../implementation/OutputLoader";
import {IExport} from "./dto/IExport";
import {IOutput} from "./dto/IOutput";
import {IParameter} from "./dto/IParameter";

export interface ISessionEngine {
	// #region Properties (15)

	readonly jwtToken?: string;
	readonly hasStoredSettings: boolean;

	canUploadGLTF: boolean;
	exports: {[key: string]: IExport};
	guid?: string;
	id: string;
	initialized: boolean;
	loadSdtf: boolean;
	modelState?: ResModelState;
	modelViewUrl: string;
	outputs: {[key: string]: IOutput};
	parameters: {[key: string]: IParameter<unknown>};
	refreshJwtToken: (() => Promise<string>) | undefined;
	settingsEngine: SettingsEngine;
	ticket?: string;
	updateCallback: ((newNode?: ITreeNode, oldNode?: ITreeNode) => void) | null;

	// #endregion Properties (15)

	// #region Public Methods (26)

	applySettings(response: ResBase, sections?: ISettingsSections): void;
	canGoBack(): boolean;
	canGoForward(): boolean;
	close(): Promise<void>;
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
	customize(
		force: boolean,
		waitForViewportUpdate?: boolean,
	): Promise<ITreeNode | ResBase>;
	customizeParallel(
		parameterValues: {[key: string]: string},
		loadOutputs: boolean,
	): Promise<ITreeNode | ResBase>;
	customizeWithModelState(modelState: string | ResBase): Promise<ITreeNode>;
	getFileInfo(parameterId: string, fileId: string): Promise<ResFileInfo>;
	goBack(): Promise<ITreeNode>;
	goForward(): Promise<ITreeNode>;
	init(parameterValues?: {[key: string]: string}): Promise<void>;
	loadCachedOutputsParallel(
		outputMapping: {[key: string]: string},
		taskEventInfo?: OutputLoaderTaskEventInfo,
		retry?: boolean,
	): Promise<{[key: string]: ITreeNode | undefined}>;
	loadOutputs(
		cancelRequest: () => boolean,
		taskEventInfo: OutputLoaderTaskEventInfo,
	): Promise<ITreeNode>;
	loadOutputsParallel(
		responseDto: ResBase,
		cancelRequest: () => boolean,
		taskEventInfo: OutputLoaderTaskEventInfo,
	): Promise<ITreeNode>;
	requestExport(
		exportId: string,
		parameters: ReqCustomization,
		maxWaitTime: number,
	): Promise<ResExport>;
	requestExports(
		body: ReqExport,
		loadOutputs?: boolean,
		maxWaitMsec?: number,
	): Promise<ResBase>;
	resetSettings(sections?: ISettingsSections): void;
	saveDefaultParameterValues(): Promise<boolean>;
	saveSettings(viewportId?: string): Promise<boolean>;
	saveUiProperties(): Promise<boolean>;
	setJwtToken(token: string): Promise<void>;
	updateOutputs(
		taskEventInfo?: OutputLoaderTaskEventInfo,
		waitForViewportUpdate?: boolean,
	): Promise<ITreeNode>;
	uploadFile(parameterId: string, data: File, type: string): Promise<string>;
	uploadFileParameters(parameterValues?: {
		[key: string]: string | File | Blob;
	}): Promise<{[key: string]: string}>;
	uploadGLTF(blob: Blob, conversion?: QueryGltfConversion): Promise<ResBase>;

	// #endregion Public Methods (26)
}
