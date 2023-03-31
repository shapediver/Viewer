import { ShapeDiverResponseDto } from "@shapediver/api.geometry-api-dto-v2";
import { FileParameter, IParameter, ISettingsSections, SessionEngine } from "@shapediver/viewer.session-engine.session-engine";
import { ITreeNode } from "@shapediver/viewer.shared.node-tree";
import { ICreationControlCenter, CreationControlCenter } from "@shapediver/viewer.main.creation-control-center";
import { IExportApi } from "../../interfaces/session/IExportApi";
import { IOutputApi } from "../../interfaces/session/IOutputApi";
import { IParameterApi } from "../../interfaces/session/IParameterApi";
import { ISessionApi } from "../../interfaces/session/ISessionApi";
import { InputValidator, Logger, ShapeDiverBackendError, ShapeDiverViewerError, ShapeDiverViewerSessionError } from "@shapediver/viewer.shared.services";
import { OutputApi } from "./OutputApi";
import { ExportApi } from "./ExportApi";
import { ParameterApi } from "./ParameterApi";
import { FileParameterApi } from "./FileParameterApi";
import { GLTFConverter } from "@shapediver/viewer.data-engine.gltf-converter";
import { SessionApiData } from "./data/SessionApiData";

export class SessionApi implements ISessionApi {
    // #region Properties (2)

    readonly #creationControlCenter: ICreationControlCenter = CreationControlCenter.instance;
    readonly #sessionEngine: SessionEngine;
    readonly #logger: Logger = Logger.instance;
    readonly #inputValidator: InputValidator = InputValidator.instance;
    readonly #gltfConverter: GLTFConverter = GLTFConverter.instance;

    readonly #outputs: { [key: string]: IOutputApi; } = {};
    readonly #parameters: { [key: string]: IParameterApi<any>; } = {};
    readonly #exports: { [key: string]: IExportApi; } = {};

    // #endregion Properties (2)

    // #region Constructors (1)

    constructor(sessionEngine: SessionEngine) {
        this.#sessionEngine = sessionEngine;
        if (!this.#sessionEngine.initialized)
            throw new ShapeDiverViewerSessionError('Session could not be initialized.');

        this.#sessionEngine.updateCallback = (newNode: ITreeNode, oldNode: ITreeNode) => {
            if (newNode.data.findIndex(d => d instanceof SessionApiData) === -1)
                newNode.addData(new SessionApiData(this));
        };
        this.#sessionEngine.updateCallback(this.node, this.node)

        for (let o in this.#sessionEngine.outputs)
            this.#outputs[o] = new OutputApi(this.#sessionEngine.outputs[o]);

        for (let e in this.#sessionEngine.exports)
            this.#exports[e] = new ExportApi(this.#sessionEngine.exports[e]);

        for (let p in this.#sessionEngine.parameters) {
            if (this.#sessionEngine.parameters[p] instanceof FileParameter) {
                this.#parameters[p] = new FileParameterApi(<FileParameter>this.#sessionEngine.parameters[p]);
            } else {
                this.#parameters[p] = new ParameterApi(this.#sessionEngine.parameters[p]);
            }
        }
    }
    // #endregion Constructors (1)

    // #region Public Accessors (26)

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

    public get id(): string {
        return this.#sessionEngine.id;
    }

    public get initialized(): boolean {
        return this.#sessionEngine.initialized;
    }

    public get jwtToken(): string | undefined {
        return this.#sessionEngine.bearerToken;
    }

    public set jwtToken(value: string | undefined) {
        const scope = 'jwtToken';
        this.#inputValidator.validateAndError(`SessionApi.${scope}`, value, 'string', false);
        this.#sessionEngine.bearerToken = value;
        this.#logger.debug(`SessionApi.${scope}: ${scope} was set to ${value}`);
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

    public get parameters(): { [key: string]: IParameterApi<any>; } {
        return this.#parameters;
    }

    public get updateCallback(): ((newNode: ITreeNode, oldNode: ITreeNode) => void) | null {
        return this.#sessionEngine.updateCallback;
    }

    public set updateCallback(value: ((newNode: ITreeNode, oldNode: ITreeNode) => void) | null) {
        const scope = 'updateCallback';
        this.#inputValidator.validateAndError(`SessionApi.${scope}`, value, 'function', false);
        this.#sessionEngine.updateCallback = (newNode: ITreeNode, oldNode: ITreeNode) => {
            if (newNode.data.findIndex(d => d instanceof SessionApiData) === -1)
                newNode.addData(new SessionApiData(this));
            if (value) value(newNode, oldNode);
        };
        this.#logger.debug(`SessionApi.${scope}: ${scope} was updated to ${value}.`);
    }

    public get refreshJwtToken(): (() => Promise<string>) | undefined {
        return this.#sessionEngine.refreshBearerToken;
    }

    public set refreshJwtToken(value: (() => Promise<string>) | undefined) {
        const scope = 'refreshJwtToken';
        this.#inputValidator.validateAndError(`SessionApi.${scope}`, value, 'function', false);
        this.#sessionEngine.refreshBearerToken = value;
        this.#logger.debug(`SessionApi.${scope}: ${scope} was set to ${value}`);
    }

    public get ticket(): string {
        return this.#sessionEngine.ticket;
    }

    // #endregion Public Accessors (26)

    // #region Public Methods (21)

    public applySettings(response: ShapeDiverResponseDto, sections?: ISettingsSections): Promise<void> {
        const scope = 'applySettings';
        this.#inputValidator.validateAndError(`SessionApi.${scope}`, response, 'object');
        this.#inputValidator.validateAndError(`SessionApi.${scope}`, sections, 'object', false);
        return this.#creationControlCenter.applySettings(this.id, response, sections);
    }

    public canGoBack(): boolean {
        return this.#sessionEngine.canGoBack();
    }

    public canGoForward(): boolean {
        return this.#sessionEngine.canGoForward();
    }

    public async close(): Promise<void> {
        return await this.#creationControlCenter.closeSessionEngine(this.id);
    }

    public async convertToGlTF(): Promise<Blob> {
        for (let r in this.#creationControlCenter.renderingEngines)
            this.#creationControlCenter.renderingEngines[r].update('SessionApi.convertToGlTF');

        const result = await this.#gltfConverter.convert(this.node, false);
        return new Blob([result], { type: 'application/octet-stream' });
    }

    public customize(force: boolean = false): Promise<ITreeNode> {
        const scope = 'customize';
        this.#inputValidator.validateAndError(`SessionApi.${scope}`, force, 'boolean', false);
        return this.#sessionEngine.customize(force);
    }

    public customizeParallel(parameterValues: { [key: string]: string; }): Promise<ITreeNode> {
        const scope = 'customizeParallel';
        this.#inputValidator.validateAndError(`SessionApi.${scope}`, parameterValues, 'object');
        for (let p in parameterValues)
            this.#inputValidator.validateAndError(`SessionApi.${scope}`, parameterValues[p], 'string');

        return this.#sessionEngine.customizeParallel(parameterValues);
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

    public getParameterById(id: string): IParameterApi<any> | null {
        const scope = 'getParameterById';
        this.#inputValidator.validateAndError(`SessionApi.${scope}`, id, 'string');
        return this.#parameters[id];
    }

    public getParameterByName(name: string): IParameterApi<any>[] {
        const scope = 'getParameterByName';
        this.#inputValidator.validateAndError(`SessionApi.${scope}`, name, 'string');
        return Object.values(this.#parameters).filter(p => p.name === name);
    }

    public getParameterByType(type: string): IParameterApi<any>[] {
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

    public resetParameterValues(force: boolean = false): Promise<ITreeNode> {
        const scope = 'resetParameterValues';
        for (let p in this.parameters)
            this.parameters[p].value = this.parameters[p].defval;
        this.#inputValidator.validateAndError(`SessionApi.${scope}`, force, 'boolean', false);
        return this.#sessionEngine.customize(force);
    }

    public resetSettings(sections?: ISettingsSections): Promise<void> {
        const scope = 'applySettings';
        this.#inputValidator.validateAndError(`SessionApi.${scope}`, sections, 'object', false);
        return this.#creationControlCenter.resetSettings(this.id, sections);
    }

    public saveDefaultParameterValues(): Promise<boolean> {
        return this.#sessionEngine.saveDefaultParameterValues();
    }

    public saveSettings(viewportId?: string): Promise<boolean> {
        const scope = 'saveDefaultParameterValues';
        this.#inputValidator.validateAndError(`SessionApi.${scope}`, viewportId, 'string', false);
        return this.#creationControlCenter.saveSettings(this.id, viewportId);
    }

    public saveUiProperties(): Promise<boolean> {
        return this.#sessionEngine.saveUiProperties();
    }

    public updateOutputs(): Promise<ITreeNode> {
        return this.#sessionEngine.updateOutputs();
    }

    // #endregion Public Methods (21)
}