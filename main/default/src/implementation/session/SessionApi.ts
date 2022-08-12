import { ShapeDiverResponseDto } from "@shapediver/api.geometry-api-dto-v2";
import { FileParameter, IParameter, ISettingsSections, SessionEngine } from "@shapediver/viewer.session-engine.session-engine";
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
import { GLTFConverter } from "@shapediver/viewer.data-engine.gltf-converter";
import { SessionApiData } from "./data/SessionApiData";

export class SessionApi implements ISessionApi {
    // #region Properties (2)

    readonly #creationControlCenter: ICreationControlCenter = <ICreationControlCenter>container.resolve(CreationControlCenter);
    readonly #sessionEngine: SessionEngine;
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #gltfConverter: GLTFConverter = <GLTFConverter>container.resolve(GLTFConverter);

    readonly #outputs: { [key: string]: IOutputApi; } = {};
    readonly #parameters: { [key: string]: IParameterApi<any>; } = {};
    readonly #exports: { [key: string]: IExportApi; } = {};

    // #endregion Properties (2)

    // #region Constructors (1)

    constructor(sessionEngine: SessionEngine) {
        this.#sessionEngine = sessionEngine;
        if(!this.#sessionEngine.initialized)
            this.#logger.error(LOGGING_TOPIC.SESSION, new Error('Session could not be initialized.'), undefined, true, true);
        

        this.#sessionEngine.updateCallback = (newNode: ITreeNode, oldNode: ITreeNode) => {
            if(newNode.data.findIndex(d => d instanceof SessionApiData) === -1)
                newNode.addData(new SessionApiData(this));
        };
        this.#sessionEngine.updateCallback(this.node, this.node)

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
        const scope = 'automaticSceneUpdate';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, value, 'boolean');
            this.#sessionEngine.automaticSceneUpdate = value;
            this.#logger.debug(LOGGING_TOPIC.SESSION, `SessionApi.${scope}: ${scope} was set to ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, e);
        }
    }

    public get commitParameters(): boolean {
        return this.#sessionEngine.settingsEngine.general.commitParameters;
    }

    public set commitParameters(value: boolean) {
        const scope = 'commitParameters';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, value, 'boolean');
            this.#sessionEngine.settingsEngine.general.commitParameters = value;
            this.#logger.debug(LOGGING_TOPIC.SESSION, `SessionApi.${scope}: ${scope} was set to ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, e);
        }
    }

    public get commitSettings(): boolean {
        return this.#sessionEngine.settingsEngine.general.commitSettings;
    }

    public set commitSettings(value: boolean) {
        const scope = 'commitSettings';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, value, 'boolean');
            this.#sessionEngine.settingsEngine.general.commitSettings = value;
            this.#logger.debug(LOGGING_TOPIC.SESSION, `SessionApi.${scope}: ${scope} was set to ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, e);
        }
    }

    public get customizeOnParameterChange(): boolean {
        return this.#sessionEngine.customizeOnParameterChange;
    }

    public set customizeOnParameterChange(value: boolean) {
        const scope = 'customizeOnParameterChange';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, value, 'boolean');
            this.#sessionEngine.customizeOnParameterChange = value;
            this.#logger.debug(LOGGING_TOPIC.SESSION, `SessionApi.${scope}: ${scope} was set to ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, e);
        }
    }

    public get excludeViewports(): string[] {
        return this.#sessionEngine.excludeViewports;
    }

    public set excludeViewports(value: string[]) {
        const scope = 'excludeViewports';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, value, 'stringArray');
            this.#sessionEngine.excludeViewports = value;
            this.#logger.debug(LOGGING_TOPIC.SESSION, `SessionApi.${scope}: ${scope} was set to ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, e);
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
        const scope = 'jwtToken';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, value, 'string', false);
            this.#sessionEngine.bearerToken = value;
            this.#logger.debug(LOGGING_TOPIC.SESSION, `SessionApi.${scope}: ${scope} was set to ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, e);
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

    public get updateCallback(): ((newNode: ITreeNode, oldNode: ITreeNode) => void) | null {
        return this.#sessionEngine.updateCallback;
    }

    public set updateCallback(value: ((newNode: ITreeNode, oldNode: ITreeNode) => void) | null) {
        const scope = 'updateCallback';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.OUTPUT, `SessionApi.${scope}`, value, 'function', false);
            this.#sessionEngine.updateCallback = (newNode: ITreeNode, oldNode: ITreeNode) => {
                if(newNode.data.findIndex(d => d instanceof SessionApiData) === -1)
                    newNode.addData(new SessionApiData(this));
                if(value) value(newNode, oldNode);
            };
            this.#logger.debug(LOGGING_TOPIC.OUTPUT, `SessionApi.${scope}: ${scope} was updated to ${value}.`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.OUTPUT, `SessionApi.${scope}`, e);
        }
    }

    public get refreshJwtToken(): (() => Promise<string>) | undefined {
        return this.#sessionEngine.refreshBearerToken;
    }

    public set refreshJwtToken(value: (() => Promise<string>) | undefined) {
        const scope = 'refreshJwtToken';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, value, 'function', false);
            this.#sessionEngine.refreshBearerToken = value;
            this.#logger.debug(LOGGING_TOPIC.SESSION, `SessionApi.${scope}: ${scope} was set to ${value}`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, e);
        }
    }

    public get ticket(): string {
        return this.#sessionEngine.ticket;
    }

    // #endregion Public Accessors (26)

    // #region Public Methods (21)

    public applySettings(response: ShapeDiverResponseDto, sections?: ISettingsSections): Promise<void> {
        const scope = 'applySettings';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, response, 'object');
            this.#inputValidator.validateAndError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, sections, 'object', false);
            return this.#creationControlCenter.applySettings(this.id, response, sections);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, e);
        }
    }

    public canGoBack(): boolean {
        const scope = 'canGoBack';
        try {
            return this.#sessionEngine.canGoBack();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, e);
        }
    }

    public canGoForward(): boolean {
        const scope = 'canGoForward';
        try {
            return this.#sessionEngine.canGoForward();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, e);
        }
    }

    public async close(): Promise<void> {
        const scope = 'close';
        try {
            return await this.#creationControlCenter.closeSessionEngine(this.id);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, e);
        }
    }

    public async convertToGlTF(): Promise<Blob> {
        const scope = 'convertToGlTF';
        try {
            for(let r in this.#creationControlCenter.renderingEngines)
                this.#creationControlCenter.renderingEngines[r].update('SessionApi.convertToGlTF');
            
            const result = await this.#gltfConverter.convert(this.node, false);
            return new Blob([result], { type: 'application/octet-stream' });
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, e);
        }
    }

    public customize(force: boolean = false): Promise<ITreeNode> {
        const scope = 'customize';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, force, 'boolean', false);
            return this.#sessionEngine.customize(force);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, e);
        }
    }

    public customizeParallel(parameterValues: { [key: string]: string; }): Promise<ITreeNode> {
        const scope = 'customizeParallel';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, parameterValues, 'object');
            for(let p in parameterValues)
                this.#inputValidator.validateAndError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, parameterValues[p], 'string');

            return this.#sessionEngine.customizeParallel(parameterValues);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, e);
        }
    }

    public getExportById(id: string): IExportApi | null {
        const scope = 'getExportById';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, id, 'string');
            return this.#exports[id];
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, e);
        }
    }

    public getExportByName(name: string): IExportApi[] {
        const scope = 'getExportByName';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, name, 'string');
            return Object.values(this.#exports).filter(e => e.name === name);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, e);
        }
    }

    public getExportByType(type: string): IExportApi[] {
        const scope = 'getExportByType';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, type, 'string');
            return Object.values(this.#exports).filter(e => e.type === type);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, e);
        }
    }

    public getOutputByFormat(format: string): IOutputApi[] {
        const scope = 'getOutputByFormat';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, format, 'string');
            return Object.values(this.#outputs).filter(o => o.format.includes(format));
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, e);
        }
    }

    public getOutputById(id: string): IOutputApi | null {
        const scope = 'getOutputById';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, id, 'string');
            return this.#outputs[id];
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, e);
        }
    }

    public getOutputByName(name: string): IOutputApi[] {
        const scope = 'getOutputByName';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, name, 'string');
            return Object.values(this.#outputs).filter(o => o.name === name);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, e);
        }
    }

    public getParameterById(id: string): IParameterApi<any> | null {
        const scope = 'getParameterById';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, id, 'string');
            return this.#parameters[id];
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, e);
        }
    }

    public getParameterByName(name: string): IParameterApi<any>[] {
        const scope = 'getParameterByName';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, name, 'string');
            return Object.values(this.#parameters).filter(p => p.name === name);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, e);
        }
    }

    public getParameterByType(type: string): IParameterApi<any>[] {
        const scope = 'getParameterByType';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, type, 'string');
            return Object.values(this.#parameters).filter(p => p.type === type);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, e);
        }
    }

    public goBack(): Promise<ITreeNode> {
        const scope = 'goBack';
        try {
            return this.#sessionEngine.goBack();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, e);
        }
    }

    public goForward(): Promise<ITreeNode> {
        const scope = 'goForward';
        try {
            return this.#sessionEngine.goForward();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, e);
        }
    }
    
    public resetParameterValues(force: boolean = false): Promise<ITreeNode> {
        const scope = 'resetParameterValues';
        try {
            for(let p in this.parameters)
                this.parameters[p].value = this.parameters[p].defval;
            this.#inputValidator.validateAndError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, force, 'boolean', false);
            return this.#sessionEngine.customize(force);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, e);
        }
    }

    public resetSettings(sections?: ISettingsSections): Promise<void> {
        const scope = 'applySettings';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, sections, 'object', false);
            return this.#creationControlCenter.resetSettings(this.id, sections);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, e);
        }
    }

    public saveDefaultParameterValues(): Promise<boolean> {
        const scope = 'saveDefaultParameterValues';
        try {
            return this.#sessionEngine.saveDefaultParameterValues();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, e);
        }
    }

    public saveSettings(viewportId?: string): Promise<boolean> {
        const scope = 'saveDefaultParameterValues';
        try {
            this.#inputValidator.validateAndError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, viewportId, 'string', false);
            return this.#creationControlCenter.saveSettings(this.id, viewportId);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, e);
        }
    }

    public saveUiProperties(): Promise<boolean> {
        const scope = 'saveUiProperties';
        try {
            return this.#sessionEngine.saveUiProperties();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, e);
        }
    }

    public updateOutputs(): Promise<ITreeNode> {
        const scope = 'updateOutputs';
        try {
            return this.#sessionEngine.updateOutputs();
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.SESSION, `SessionApi.${scope}`, e);
        }
    }

    // #endregion Public Methods (21)
}