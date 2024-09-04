import { CreationControlCenterSession, ICreationControlCenterSession } from '@shapediver/viewer.creation-control-center.session';
import { ExportApi } from './ExportApi';
import {
    FileParameter,
    GumballParameter,
    SelectionParameter,
    SessionEngine
} from '@shapediver/viewer.session-engine.session-engine';
import { FileParameterApi } from './parameter/FileParameterApi';
import { GLTFConverter } from '@shapediver/viewer.data-engine.gltf-converter';
import { GumballParameterApi } from './parameter/GumballParameterApi';
import { IExportApi } from '../interfaces/IExportApi';
import {
    InputValidator,
    Logger,
    ShapeDiverViewerSessionError,
    StateEngine
} from '@shapediver/viewer.shared.services';
import { IOutputApi } from '../interfaces/IOutputApi';
import { IParameterApi } from '../interfaces/parameter/IParameterApi';
import { ISessionApi } from '../interfaces/ISessionApi';
import { ISettingsSections } from '@shapediver/viewer.shared.types';
import { ITreeNode } from '@shapediver/viewer.shared.node-tree';
import { OutputApi } from './OutputApi';
import { ParameterApi } from './parameter/ParameterApi';
import { SelectionParameterApi } from './parameter/SelectionParameterApi';
import { SessionApiData } from './data/SessionApiData';
import { ShapeDiverRequestExport, ShapeDiverResponseDto, ShapeDiverResponseModelState } from '@shapediver/sdk.geometry-api-sdk-v2';

export class SessionApi implements ISessionApi {
    // #region Properties (9)

    readonly #creationControlCenterSession: ICreationControlCenterSession = CreationControlCenterSession.instance;
    readonly #exports: { [key: string]: IExportApi; } = {};
    readonly #gltfConverter: GLTFConverter = GLTFConverter.instance;
    readonly #inputValidator: InputValidator = InputValidator.instance;
    readonly #logger: Logger = Logger.instance;
    readonly #outputs: { [key: string]: IOutputApi; } = {};
    readonly #parameters: { [key: string]: IParameterApi<unknown>; } = {};
    readonly #sessionEngine: SessionEngine;
    readonly #stateEngine: StateEngine = StateEngine.instance;

    // #endregion Properties (9)

    // #region Constructors (1)

    constructor(sessionEngine: SessionEngine) {
        this.#sessionEngine = sessionEngine;
        if (!this.#sessionEngine.initialized)
            throw new ShapeDiverViewerSessionError('Session could not be initialized.');

        this.#sessionEngine.updateCallback = (newNode?: ITreeNode) => {
            if (!newNode) return;

            if (newNode.data.findIndex(d => d instanceof SessionApiData) === -1)
                newNode.addData(new SessionApiData(this));
        };
        this.#sessionEngine.updateCallback(this.node, this.node);

        for (const o in this.#sessionEngine.outputs)
            this.#outputs[o] = new OutputApi(this.#sessionEngine.outputs[o]);

        for (const e in this.#sessionEngine.exports)
            this.#exports[e] = new ExportApi(this.#sessionEngine.exports[e]);

        for (const p in this.#sessionEngine.parameters) {
            if (this.#sessionEngine.parameters[p] instanceof FileParameter) {
                this.#parameters[p] = new FileParameterApi(<FileParameter>this.#sessionEngine.parameters[p]);
            } else if (this.#sessionEngine.parameters[p] instanceof SelectionParameter) {
                this.#parameters[p] = new SelectionParameterApi(<SelectionParameter>this.#sessionEngine.parameters[p]);
            } else if (this.#sessionEngine.parameters[p] instanceof GumballParameter) {
                this.#parameters[p] = new GumballParameterApi(<GumballParameter>this.#sessionEngine.parameters[p]);
            } else {
                this.#parameters[p] = new ParameterApi(this.#sessionEngine.parameters[p]);
            }
        }
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (29)

    public get automaticSceneUpdate(): boolean {
        return this.#sessionEngine.automaticSceneUpdate;
    }

    public set automaticSceneUpdate(value: boolean) {
        const scope = 'automaticSceneUpdate';
        this.#inputValidator.validateAndError(`SessionApi.${scope}`, value, 'boolean');
        this.#sessionEngine.automaticSceneUpdate = value;
        this.#logger.debug(`SessionApi.${scope}: ${scope} was set to ${value}`);
    }

    public get commitParameters(): boolean {
        return this.#sessionEngine.settingsEngine.general.commitParameters;
    }

    public set commitParameters(value: boolean) {
        const scope = 'commitParameters';
        this.#inputValidator.validateAndError(`SessionApi.${scope}`, value, 'boolean');
        this.#sessionEngine.settingsEngine.general.commitParameters = value;
        this.#logger.debug(`SessionApi.${scope}: ${scope} was set to ${value}`);
    }

    public get commitSettings(): boolean {
        return this.#sessionEngine.settingsEngine.general.commitSettings;
    }

    public set commitSettings(value: boolean) {
        const scope = 'commitSettings';
        this.#inputValidator.validateAndError(`SessionApi.${scope}`, value, 'boolean');
        this.#sessionEngine.settingsEngine.general.commitSettings = value;
        this.#logger.debug(`SessionApi.${scope}: ${scope} was set to ${value}`);
    }

    public get customizeOnParameterChange(): boolean {
        return this.#sessionEngine.customizeOnParameterChange;
    }

    public set customizeOnParameterChange(value: boolean) {
        const scope = 'customizeOnParameterChange';
        this.#inputValidator.validateAndError(`SessionApi.${scope}`, value, 'boolean');
        this.#sessionEngine.customizeOnParameterChange = value;
        this.#logger.debug(`SessionApi.${scope}: ${scope} was set to ${value}`);
    }

    public get excludeViewports(): string[] {
        return this.#sessionEngine.excludeViewports;
    }

    public set excludeViewports(value: string[]) {
        const scope = 'excludeViewports';
        this.#inputValidator.validateAndError(`SessionApi.${scope}`, value, 'stringArray');
        this.#sessionEngine.excludeViewports = value;
        this.#logger.debug(`SessionApi.${scope}: ${scope} was set to ${value}`);
    }

    public get exports(): { [key: string]: IExportApi; } {
        return this.#exports;
    }

    public get guid(): string | undefined {
        return this.#sessionEngine.guid;
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
        const scope = 'loadSdtf';
        this.#inputValidator.validateAndError(`SessionApi.${scope}`, value, 'boolean');
        this.#sessionEngine.loadSdtf = value;
        this.#logger.debug(`SessionApi.${scope}: ${scope} was set to ${value}`);
    }

    public get modelState(): ShapeDiverResponseModelState | undefined {
        return this.#sessionEngine.modelState;
    }

    public get modelViewUrl(): string {
        return this.#sessionEngine.modelViewUrl;
    }

    public get node(): ITreeNode {
        return this.#sessionEngine.node;
    }

    public get outputs(): { [key: string]: IOutputApi; } {
        return this.#outputs;
    }

    public get parameterDefaultValues(): { [key: string]: unknown; } {
        const parameterDefaultValues: { [key: string]: unknown; } = {};
        for (const key in this.parameters)
            parameterDefaultValues[key] = this.parameters[key].defval;
        return parameterDefaultValues;
    }

    public get parameterSessionValues(): { [key: string]: unknown; } {
        const parameterSessionValues: { [key: string]: unknown; } = {};
        for (const key in this.parameters)
            parameterSessionValues[key] = this.parameters[key].sessionValue;
        return parameterSessionValues;
    }

    public get parameterValues(): { [key: string]: unknown; } {
        const parameterValues: { [key: string]: unknown; } = {};
        for (const key in this.parameters)
            parameterValues[key] = this.parameters[key].value;
        return parameterValues;
    }

    public get parameters(): { [key: string]: IParameterApi<unknown>; } {
        return this.#parameters;
    }

    public get refreshJwtToken(): (() => Promise<string>) | undefined {
        return this.#sessionEngine.refreshJwtToken;
    }

    public set refreshJwtToken(value: (() => Promise<string>) | undefined) {
        const scope = 'refreshJwtToken';
        this.#inputValidator.validateAndError(`SessionApi.${scope}`, value, 'function', false);
        this.#sessionEngine.refreshJwtToken = value;
        this.#logger.debug(`SessionApi.${scope}: ${scope} was set to ${value}`);
    }

    public get ticket(): string | undefined {
        return this.#sessionEngine.ticket;
    }

    public get updateCallback(): ((newNode: ITreeNode, oldNode: ITreeNode) => void | Promise<void>) | null {
        return this.#sessionEngine.updateCallback;
    }

    public set updateCallback(value: ((newNode: ITreeNode, oldNode: ITreeNode) => void | Promise<void>) | null) {
        const scope = 'updateCallback';
        if (value) this.#inputValidator.validateAndError(`SessionApi.${scope}`, value, 'function', false);
        this.#sessionEngine.updateCallback = async (newNode: ITreeNode, oldNode: ITreeNode) => {
            if (newNode.data.findIndex(d => d instanceof SessionApiData) === -1)
                newNode.addData(new SessionApiData(this));
            if (value) await Promise.resolve(value(newNode, oldNode));
        };
        this.#logger.debug(`SessionApi.${scope}: ${scope} was updated to ${value}.`);
    }

    // #endregion Public Getters And Setters (29)

    // #region Public Methods (30)

    public applySettings(response: ShapeDiverResponseDto, sections?: ISettingsSections): Promise<void> {
        const scope = 'applySettings';
        this.#inputValidator.validateAndError(`SessionApi.${scope}`, response, 'object');
        this.#inputValidator.validateAndError(`SessionApi.${scope}`, sections, 'object', false);
        return this.#creationControlCenterSession.applySettings(this.id, response, sections);
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
        return await this.#creationControlCenterSession.closeSessionEngine(this.id);
    }

    public async convertToGlTF(convertForAr: boolean = false): Promise<Blob> {
        for (const r in this.#stateEngine.viewportEngines)
            this.#stateEngine.viewportEngines[r]?.update('SessionApi.convertToGlTF');

        const result = await this.#gltfConverter.convert(this.node, convertForAr);
        return new Blob([result], { type: 'application/octet-stream' });
    }

    public async createModelState(parameterValues: { [key: string]: unknown; } = {}, image?: (() => string) | string | Blob | File, data?: Record<string, any>, arScene?: (() => Promise<ArrayBuffer>) | ArrayBuffer | (() => Promise<Blob>) | Blob | File): Promise<string> {        const scope = 'createModelState';
        this.#inputValidator.validateAndError(`SessionApi.${scope}`, parameterValues, 'object', false);
        return await this.#sessionEngine.createModelState(parameterValues, image, data, arScene);
    }

    public customize(parameterValues?: { [key: string]: unknown; }, force: boolean = false, waitForViewportUpdate: boolean = false): Promise<ITreeNode> {
        const scope = 'customize';
        this.#inputValidator.validateAndError(`SessionApi.${scope}`, parameterValues, 'object', false);

        // if there are parameter values specified, we set them directly
        // the validation happens in the setter of the ParameterApi
        if (parameterValues)
            for (const p in parameterValues)
                this.parameters[p].value = parameterValues[p];

        this.#inputValidator.validateAndError(`SessionApi.${scope}`, force, 'boolean', false);
        this.#inputValidator.validateAndError(`SessionApi.${scope}`, waitForViewportUpdate, 'boolean', false);
        return this.#sessionEngine.customize(force, waitForViewportUpdate);
    }

    public customizeParallel(parameterValues: { [key: string]: unknown; }): Promise<ITreeNode> {
        const scope = 'customizeParallel';
        this.#inputValidator.validateAndError(`SessionApi.${scope}`, parameterValues, 'object');
        return this.#sessionEngine.customizeParallel(parameterValues) as Promise<ITreeNode>;
    }

    public customizeResult(parameterValues: { [key: string]: unknown; }): Promise<ShapeDiverResponseDto> {
        const scope = 'customizeResult';
        this.#inputValidator.validateAndError(`SessionApi.${scope}`, parameterValues, 'object');
        return this.#sessionEngine.customizeParallel(parameterValues, false) as Promise<ShapeDiverResponseDto>;
    }

    public getExportById(id: string): IExportApi | null {
        const scope = 'getExportById';
        this.#inputValidator.validateAndError(`SessionApi.${scope}`, id, 'string');
        return this.#exports[id];
    }

    public getExportByName(name: string): IExportApi[] {
        const scope = 'getExportByName';
        this.#inputValidator.validateAndError(`SessionApi.${scope}`, name, 'string');
        return Object.values(this.#exports).filter(e => e.name === name);
    }

    public getExportByType(type: string): IExportApi[] {
        const scope = 'getExportByType';
        this.#inputValidator.validateAndError(`SessionApi.${scope}`, type, 'string');
        return Object.values(this.#exports).filter(e => e.type === type);
    }

    public getOutputByFormat(format: string): IOutputApi[] {
        const scope = 'getOutputByFormat';
        this.#inputValidator.validateAndError(`SessionApi.${scope}`, format, 'string');
        return Object.values(this.#outputs).filter(o => o.format.includes(format));
    }

    public getOutputById(id: string): IOutputApi | null {
        const scope = 'getOutputById';
        this.#inputValidator.validateAndError(`SessionApi.${scope}`, id, 'string');
        return this.#outputs[id];
    }

    public getOutputByName(name: string): IOutputApi[] {
        const scope = 'getOutputByName';
        this.#inputValidator.validateAndError(`SessionApi.${scope}`, name, 'string');
        return Object.values(this.#outputs).filter(o => o.name === name);
    }

    public getParameterById(id: string): IParameterApi<unknown> | null {
        const scope = 'getParameterById';
        this.#inputValidator.validateAndError(`SessionApi.${scope}`, id, 'string');
        return this.#parameters[id];
    }

    public getParameterByName(name: string): IParameterApi<unknown>[] {
        const scope = 'getParameterByName';
        this.#inputValidator.validateAndError(`SessionApi.${scope}`, name, 'string');
        return Object.values(this.#parameters).filter(p => p.name === name);
    }

    public getParameterByType(type: string): IParameterApi<unknown>[] {
        const scope = 'getParameterByType';
        this.#inputValidator.validateAndError(`SessionApi.${scope}`, type, 'string');
        return Object.values(this.#parameters).filter(p => p.type === type);
    }

    public goBack(): Promise<ITreeNode> {
        return this.#sessionEngine.goBack();
    }

    public goForward(): Promise<ITreeNode> {
        return this.#sessionEngine.goForward();
    }

    public async loadCachedOutputs(outputs: { [key: string]: string; }): Promise<{ [key: string]: ITreeNode | undefined }> {
        return await this.#sessionEngine.loadCachedOutputsParallel(outputs);
    }

    public async requestExports(body: ShapeDiverRequestExport, loadOutputs?: boolean, maxWaitMsec?: number): Promise<ShapeDiverResponseDto> {
        const scope = 'requestExports';
        this.#inputValidator.validateAndError(`SessionApi.${scope}`, body, 'object');
        this.#inputValidator.validateAndError(`SessionApi.${scope}`, loadOutputs, 'boolean', false);
        this.#inputValidator.validateAndError(`SessionApi.${scope}`, maxWaitMsec, 'number', false);
        return this.#sessionEngine.requestExports(body, loadOutputs, maxWaitMsec);
    }

    public resetParameterValues(force: boolean = false, waitForViewportUpdate: boolean = false): Promise<ITreeNode> {
        const scope = 'resetParameterValues';
        for (const p in this.parameters)
            this.parameters[p].value = this.parameters[p].defval;
        this.#inputValidator.validateAndError(`SessionApi.${scope}`, force, 'boolean', false);
        return this.#sessionEngine.customize(force, waitForViewportUpdate);
    }

    public resetSettings(sections?: ISettingsSections): Promise<void> {
        const scope = 'applySettings';
        this.#inputValidator.validateAndError(`SessionApi.${scope}`, sections, 'object', false);
        return this.#creationControlCenterSession.resetSettings(this.id, sections);
    }

    public saveDefaultParameterValues(): Promise<boolean> {
        return this.#sessionEngine.saveDefaultParameterValues();
    }

    public saveSettings(viewportId?: string): Promise<boolean> {
        const scope = 'saveDefaultParameterValues';
        this.#inputValidator.validateAndError(`SessionApi.${scope}`, viewportId, 'string', false);
        return this.#creationControlCenterSession.saveSettings(this.id, viewportId);
    }

    public saveUiProperties(): Promise<boolean> {
        return this.#sessionEngine.saveUiProperties();
    }

    public async setJwtToken(value: string): Promise<void> {
        const scope = 'setJwtToken';
        this.#inputValidator.validateAndError(`SessionApi.${scope}`, value, 'string', false);
        await this.#sessionEngine.setJwtToken(value);
        this.#logger.debug(`SessionApi.${scope}: ${scope} was set to ${value}`);
        return;
    }

    public updateOutputs(waitForViewportUpdate: boolean = false): Promise<ITreeNode> {
        return this.#sessionEngine.updateOutputs(undefined, waitForViewportUpdate);
    }

    public async uploadFileParameters(values: { [key: string]: string | File | Blob }): Promise<{ [key: string]: string }> {
        const fileParameters: { [key: string]: string | File | Blob } = values || {};
        const fileParameterIds = await this.#sessionEngine.uploadFileParameters(fileParameters);
        return fileParameterIds;
    }

    // #endregion Public Methods (30)
}