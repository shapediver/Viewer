import { ShapeDiverResponseDto } from "@shapediver/api.geometry-api-dto-v2";
import { FileParameter, IParameter, SessionEngine } from "@shapediver/viewer.session-engine.session-engine";
import { container } from "tsyringe";
import { ITreeNode } from "@shapediver/viewer.shared.node-tree";
import { ICreationControlCenter, CreationControlCenter } from "@shapediver/viewer.main.creation-control-center";
import { IExportApi } from "../../interfaces/session/IExportApi";
import { IOutputApi } from "../../interfaces/session/IOutputApi";
import { IParameterApi } from "../../interfaces/session/IParameterApi";
import { ISessionApi } from "../../interfaces/session/ISessionApi";
import { InputValidator, Logger, LOGGING_TOPIC, ShapeDiverBackendError, ShapeDiverViewerError } from "@shapediver/viewer.shared.services";
import { OutputApi } from "./OutputApi";
import { ExportApi } from "./ExportApi";
import { ParameterApi } from "./ParameterApi";
import { FileParameterApi } from "./FileParameterApi";

export class SessionApi implements ISessionApi {
    // #region Properties (2)

    readonly #creationControlCenter: ICreationControlCenter = <ICreationControlCenter>container.resolve(CreationControlCenter);
    readonly #sessionEngine: SessionEngine;
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);

    readonly #outputs: { [key: string]: IOutputApi; } = {};
    readonly #parameters: { [key: string]: IParameterApi<any>; } = {};
    readonly #exports: { [key: string]: IExportApi; } = {};

    // #endregion Properties (2)

    // #region Constructors (1)

    constructor(sessionEngine: SessionEngine) {
        this.#sessionEngine = sessionEngine;
        if(!this.#sessionEngine.initialized) throw new Error();

        for(let o in this.#sessionEngine.outputs)
            this.#outputs[o] = new OutputApi(this.#sessionEngine.outputs[o]);

        for(let e in this.#sessionEngine.exports)
            this.#exports[e] = new ExportApi(this.#sessionEngine.exports[e]);
        
        for(let p in this.#sessionEngine.parameters) {
            if(this.#sessionEngine.parameters[p] instanceof FileParameter) {
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
        try {
            this.#logger.debug(LOGGING_TOPIC.SESSION, `Session(${this.id}).automaticSceneUpdate: Updating to ${value}.`);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.SESSION, `Session(${this.id}).automaticSceneUpdate`, value, 'boolean');
            this.#sessionEngine.automaticSceneUpdate = value;
            this.#logger.debug(LOGGING_TOPIC.SESSION, `Session(${this.id}).automaticSceneUpdate: was set to ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.SESSION, `Session(${this.id}).automaticSceneUpdate`, e);
        }
    }

    public get commitParameters(): boolean {
        return this.#sessionEngine.settingsEngine.general.commitParameters;
    }

    public set commitParameters(value: boolean) {
        try {
            this.#logger.debug(LOGGING_TOPIC.SESSION, `Session(${this.id}).commitParameters: Updating to ${value}.`);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.SESSION, `Session(${this.id}).commitParameters`, value, 'boolean');
            this.#sessionEngine.settingsEngine.general.commitParameters = value;
            this.#logger.debug(LOGGING_TOPIC.SESSION, `Session(${this.id}).commitParameters: was set to ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.SESSION, `Session(${this.id}).commitParameters`, e);
        }
    }

    public get commitSettings(): boolean {
        return this.#sessionEngine.settingsEngine.general.commitSettings;
    }

    public set commitSettings(value: boolean) {
        try {
            this.#logger.debug(LOGGING_TOPIC.SESSION, `Session(${this.id}).commitSettings: Updating to ${value}.`);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.SESSION, `Session(${this.id}).commitSettings`, value, 'boolean');
            this.#sessionEngine.settingsEngine.general.commitSettings = value;
            this.#logger.debug(LOGGING_TOPIC.SESSION, `Session(${this.id}).commitSettings: was set to ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.SESSION, `Session(${this.id}).commitSettings`, e);
        }
    }

    public get customizeOnParameterChange(): boolean {
        return this.#sessionEngine.customizeOnParameterChange;
    }

    public set customizeOnParameterChange(value: boolean) {
        try {
            this.#logger.debug(LOGGING_TOPIC.SESSION, `Session(${this.id}).customizeOnParameterChange: Updating to ${value}.`);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.SESSION, `Session(${this.id}).customizeOnParameterChange`, value, 'boolean');
            this.#sessionEngine.customizeOnParameterChange = value;
            this.#logger.debug(LOGGING_TOPIC.SESSION, `Session(${this.id}).customizeOnParameterChange: was set to ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.SESSION, `Session(${this.id}).customizeOnParameterChange`, e);
        }
    }

    public get excludeViewports(): string[] {
        return this.#sessionEngine.excludeViewports;
    }

    public set excludeViewports(value: string[]) {
        try {
            this.#logger.debug(LOGGING_TOPIC.SESSION, `Session(${this.id}).excludeViewports: Updating to ${value}.`);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.SESSION, `Session(${this.id}).excludeViewports`, value, 'stringArray');
            this.#sessionEngine.excludeViewports = value;
            this.#logger.debug(LOGGING_TOPIC.SESSION, `Session(${this.id}).excludeViewports: was set to ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.SESSION, `Session(${this.id}).excludeViewports`, e);
        }
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
        try {
            this.#logger.debug(LOGGING_TOPIC.SESSION, `Session(${this.id}).bearerToken: Updating to ${value}.`);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.SESSION, `Session(${this.id}).bearerToken`, value, 'string', false);
            this.#sessionEngine.bearerToken = value;
            this.#logger.debug(LOGGING_TOPIC.SESSION, `Session(${this.id}).bearerToken: was set to ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.SESSION, `Session(${this.id}).bearerToken`, e);
        }
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

    public get refreshJwtToken(): (() => Promise<string>) | undefined {
        return this.#sessionEngine.refreshBearerToken;
    }

    public set refreshJwtToken(value: (() => Promise<string>) | undefined) {
        try {
            this.#logger.debug(LOGGING_TOPIC.SESSION, `Session(${this.id}).refreshJwtToken: Updating to ${value}.`);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.SESSION, `Session(${this.id}).refreshJwtToken`, value, 'function', false);
            this.#sessionEngine.refreshBearerToken = value;
            this.#logger.debug(LOGGING_TOPIC.SESSION, `Session(${this.id}).refreshJwtToken: was set to ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.SESSION, `Session(${this.id}).refreshJwtToken`, e);
        }
    }

    public get ticket(): string {
        return this.#sessionEngine.ticket;
    }

    // #endregion Public Accessors (26)

    // #region Public Methods (21)

    public applySettings(response: ShapeDiverResponseDto, sections?: { session?: { parameter?: { displayname?: boolean | undefined; order?: boolean | undefined; hidden?: boolean | undefined; value?: boolean | undefined; } | undefined; export?: { displayname?: boolean | undefined; order?: boolean | undefined; hidden?: boolean | undefined; } | undefined; } | undefined; viewport?: { ar?: boolean | undefined; scene?: boolean | undefined; camera?: boolean | undefined; light?: boolean | undefined; environment?: boolean | undefined; general?: boolean | undefined; } | undefined; }): Promise<void> {
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

    public customize(): Promise<ITreeNode> {
        return this.#sessionEngine.customize();
    }

    public customizeParallel(parameterValues: { [key: string]: string; }): Promise<ITreeNode> {
        return this.#sessionEngine.customizeParallel(parameterValues);
    }

    public getExportById(id: string): IExportApi | null {
        return this.#exports[id];
    }

    public getExportByName(name: string): IExportApi[] {
        return Object.values(this.#exports).filter(e => e.name === name);
    }

    public getExportByType(type: string): IExportApi[] {
        return Object.values(this.#exports).filter(e => e.type === type);
    }

    public getOutputByFormat(format: string): IOutputApi[] {
        return Object.values(this.#outputs).filter(o => o.format.includes(format));
    }

    public getOutputById(id: string): IOutputApi | null {
        return this.#outputs[id];
    }

    public getOutputByName(name: string): IOutputApi[] {
        return Object.values(this.#outputs).filter(o => o.name === name);
    }

    public getParameterById(id: string): IParameterApi<any> | null {
        return this.#parameters[id];
    }

    public getParameterByName(name: string): IParameterApi<any>[] {
        return Object.values(this.#parameters).filter(p => p.name === name);
    }

    public getParameterByType(type: string): IParameterApi<any>[] {
        return Object.values(this.#parameters).filter(p => p.type === type);
    }

    public goBack(): Promise<ITreeNode> {
        return this.#sessionEngine.goBack();
    }

    public goForward(): Promise<ITreeNode> {
        return this.#sessionEngine.goForward();
    }

    public saveDefaultParameterValues(): Promise<boolean> {
        return this.#sessionEngine.saveDefaultParameterValues();
    }

    public saveSettings(viewportId?: string): Promise<boolean> {
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