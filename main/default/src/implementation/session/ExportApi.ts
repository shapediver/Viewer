import { ShapeDiverResponseExport, ShapeDiverResponseExportContent, ShapeDiverResponseExportResult, ShapeDiverResponseModelComputationStatus, ShapeDiverResponseExportDefinitionType, ShapeDiverResponseParameterGroup } from "@shapediver/api.geometry-api-dto-v2";
import { InputValidator, Logger, LOGGING_TOPIC, ShapeDiverBackendError, ShapeDiverViewerError } from "@shapediver/viewer.shared.services";
import { container } from "tsyringe";
import { IExport } from "@shapediver/viewer.session-engine.session-engine";
import { IExportApi } from "../../interfaces/session/IExportApi";

export class ExportApi implements IExportApi {

    // #region Properties (3)

    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #export: IExport;

    // #endregion Properties (3)

    // #region Constructors (1)

    constructor(exportD: IExport) {
        this.#export = exportD;
    }

    // #region Public Accessors (21)

    public get content(): ShapeDiverResponseExportContent[] | undefined {
        return this.#export.content;
    }

    public get delay(): number | undefined {
        return this.#export.delay;
    }

    public get dependency(): string[] {
        return this.#export.dependency;
    }

    public get displayname(): string | undefined {
        return this.#export.displayname;
    }

    public set displayname(value: string | undefined) {
        try {
            this.#logger.debugLow(LOGGING_TOPIC.EXPORT, `Export(${this.#export.id}).displayname: Updating DisplayName to ${value}.`);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.EXPORT, `Export(${this.#export.id}).displayname`, value, 'string', false);
            this.#export.displayname = value;
            this.#logger.debug(LOGGING_TOPIC.EXPORT, `Export(${this.#export.id}).displayname: DisplayName was updated to ${this.#export.displayname}.`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.EXPORT, `Export(${this.#export.id}).displayname`, e);
        }
    }

    public get filename(): string | undefined {
        return this.#export.filename;
    }

    public get group(): ShapeDiverResponseParameterGroup | undefined {
        return this.#export.group;
    }

    public get hidden(): boolean {
        return this.#export.hidden;
    }

    public set hidden(value: boolean) {
        try {
            this.#logger.debugLow(LOGGING_TOPIC.EXPORT, `Export(${this.#export.id}).hidden: Updating Hidden to ${value}.`);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.EXPORT, `Export(${this.#export.id}).hidden`, value, 'boolean');
            this.#export.hidden = value;
            this.#logger.debug(LOGGING_TOPIC.EXPORT, `Export(${this.#export.id}).hidden: Hidden was updated to ${this.#export.hidden}.`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.EXPORT, `Export(${this.#export.id}).hidden`, e);
        }
    }

    public get id(): string {
        return this.#export.id;
    }

    public get maxWaitTime(): number {
        return this.#export.maxWaitTime;
    }

    public set maxWaitTime(value: number) {
        try {
            this.#logger.debugLow(LOGGING_TOPIC.EXPORT, `Export(${this.#export.id}).maxWaitTime: Updating maxWaitTime to ${value}.`);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.EXPORT, `Export(${this.#export.id}).maxWaitTime`, value, 'number');
            this.#export.maxWaitTime = value;
            this.#logger.debug(LOGGING_TOPIC.EXPORT, `Export(${this.#export.id}).maxWaitTime: maxWaitTime was updated to ${this.#export.maxWaitTime}.`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.EXPORT, `Export(${this.#export.id}).maxWaitTime`, e);
        }
    }

    public get msg(): string | undefined {
        return this.#export.msg;
    }

    public get name(): string {
        return this.#export.name;
    }

    public get order(): number | undefined {
        return this.#export.order;
    }

    public set order(value: number | undefined) {
        try {
            this.#logger.debugLow(LOGGING_TOPIC.EXPORT, `Export(${this.#export.id}).order: Updating Order to ${value}.`);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.EXPORT, `Export(${this.#export.id}).order`, value, 'number', false);
            this.#export.order = value;
            this.#logger.debug(LOGGING_TOPIC.EXPORT, `Export(${this.#export.id}).order: Order was updated to ${this.#export.order}.`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.EXPORT, `Export(${this.#export.id}).order`, e);
        }
    }

    public get result(): ShapeDiverResponseExportResult | undefined {
        return this.#export.result;
    }

    public get status_collect(): ShapeDiverResponseModelComputationStatus | undefined {
        return this.#export.status_collect;
    }

    public get status_computation(): ShapeDiverResponseModelComputationStatus | undefined {
        return this.#export.status_computation;
    }

    public get tooltip(): string | undefined {
        return this.#export.tooltip;
    }

    public set tooltip(value: string | undefined) {
        try {
            this.#logger.debugLow(LOGGING_TOPIC.EXPORT, `Export(${this.#export.id}).tooltip: Updating tooltip to ${value}.`);
            this.#inputValidator.validateAndError(LOGGING_TOPIC.EXPORT, `Export(${this.#export.id}).tooltip`, value, 'string', false);
            this.#export.tooltip = value;
            this.#logger.debug(LOGGING_TOPIC.EXPORT, `Export(${this.#export.id}).tooltip: tooltip was updated to ${this.#export.tooltip}.`);
        } catch (e) {
            if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
            throw this.#logger.handleError(LOGGING_TOPIC.EXPORT, `Export(${this.#export.id}).tooltip`, e);
        }
    }

    public get type(): ShapeDiverResponseExportDefinitionType {
        return this.#export.type;
    }

    public get uid(): string | undefined {
        return this.#export.uid;
    }

    public get version(): string | undefined {
        return this.#export.version;
    }

    // #endregion Public Accessors (21)

    // #region Public Methods (2)

    public async request(parameters: { [key: string]: string } = {}): Promise<ShapeDiverResponseExport> {
        return this.#export.request(parameters);
    }

    public updateExport() {
        this.#export.updateExport();
    }

}