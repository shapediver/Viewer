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

import {IExport} from "./dto/IExport";
import {IOutput} from "./dto/IOutput";
import {IParameter} from "./dto/IParameter";

/**
 * Interface defining the Session Engine functionality.
 *
 * This interface is only used internally.
 * For the session API definition, please refer to the {@link ISessionAPI}.
 */
export interface ISessionEngine {
	readonly hasStoredSettings: boolean;
	readonly jwtToken?: string;

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

	applySettings(response: ResBase, sections?: ISettingsSections): void;
	canGoBack(): boolean;
	canGoForward(): boolean;
	cancelCustomization(): void;
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
		force?: boolean,
		waitForViewportUpdate?: boolean,
	): Promise<ITreeNode | ResBase>;
	customizeParallel(
		parameterValues: {[key: string]: unknown},
		loadOutputs?: boolean,
	): Promise<ITreeNode | ResBase>;
	customizeWithModelState(modelState: string | ResBase): Promise<ITreeNode>;
	getModelState(modelStateId?: string): Promise<ResGetModelState>;
	goBack(): Promise<ITreeNode>;
	goForward(): Promise<ITreeNode>;
	init(parameterValues?: {[key: string]: string}): Promise<void>;
	loadCachedOutputsParallel(
		outputMapping: {[key: string]: string},
		taskEventInfo?: ITaskEventDescription,
		retry?: boolean,
	): Promise<{[key: string]: ITreeNode | undefined}>;
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
	saveSettings(json?: unknown): Promise<boolean>;
	saveUiProperties(saveInSettings?: boolean): Promise<boolean>;
	setJwtToken(token: string): Promise<void>;
	updateOutputs(
		taskEventInfo?: ITaskEventDescription,
		waitForViewportUpdate?: boolean,
	): Promise<ITreeNode>;
	uploadFile(parameterId: string, data: File, type: string): Promise<string>;
	uploadFileParameters(parameterValues?: {
		[key: string]: string | File | Blob;
	}): Promise<{[key: string]: string}>;
	uploadGLTF(blob: Blob, conversion?: QueryGltfConversion): Promise<ResBase>;
	uploadSDTF(arrayBuffers: ArrayBuffer[]): Promise<ResAssetDefinition[]>;
}

/**
 * Definition used to create a Session Engine.
 *
 * This is only used internally.
 * For the definition of the session creation object, please refer to the {@link SessionCreationDefinition}.
 */
export type ISessionEngineCreationDefinition = {
	allowOutputLoading: boolean;
	buildDate: string;
	buildVersion: string;
	excludeViewports?: string[];
	guid?: string;
	id: string;
	ignoreUnknownParams?: boolean;
	jwtToken?: string;
	loadSdtf: boolean;
	modelStateId?: string;
	modelStateValidationMode?: boolean;
	modelViewUrl: string;
	throwOnCustomizationError?: boolean;
	ticket?: string;
};
