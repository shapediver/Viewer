import { ShapeDiverResponseExport, ShapeDiverResponseExportContent, ShapeDiverResponseExportDefinitionType, ShapeDiverResponseExportResult, ShapeDiverResponseModelComputationStatus, ShapeDiverResponseParameterGroup } from "@shapediver/sdk.geometry-api-sdk-v2";
import { container } from "tsyringe";
import { EventEngine, EVENTTYPE, InputValidator, Logger, LOGGING_TOPIC, ShapeDiverBackendError, ShapeDiverViewerError, UuidGenerator } from "@shapediver/viewer.shared.services";
import { ITaskEvent, TASK_TYPE } from "@shapediver/viewer.shared.types";
import { IExport } from "../../interfaces/dto/IExport";
import { SessionEngine } from "../SessionEngine";

export class Export implements IExport {
  // #region Properties (24)

  readonly #eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);
  readonly #id: string;
  readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
  readonly #logger: Logger = <Logger>container.resolve(Logger);
  readonly #name: string;
  readonly #sessionEngine: SessionEngine;
  readonly #type: ShapeDiverResponseExportDefinitionType;
  readonly #uuidGenerator: UuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);

  #content?: ShapeDiverResponseExportContent[];
  #delay?: number;
  #dependency!: string[];
  #displayname?: string;
  #filename?: string;
  #group?: ShapeDiverResponseParameterGroup;
  #hidden: boolean = false;
  #maxWaitTime: number = 300000;
  #msg?: string
  #order?: number;
  #result?: ShapeDiverResponseExportResult
  #status_collect?: ShapeDiverResponseModelComputationStatus;
  #status_computation?: ShapeDiverResponseModelComputationStatus;
  #tooltip?: string;
  #uid?: string;
  #version?: string;

  // #endregion Properties (24)

  // #region Constructors (1)

  constructor(exportDef: ShapeDiverResponseExport, sessionEngine: SessionEngine) {
    this.#sessionEngine = sessionEngine;
    this.#id = exportDef.id;
    this.#name = exportDef.name;
    this.#type = exportDef.type;

    this.updateExportDefinition(exportDef);
  }

  // #endregion Constructors (1)

  // #region Public Accessors (24)

  public get content(): ShapeDiverResponseExportContent[] | undefined {
    return this.#content;
  }

  public get delay(): number | undefined {
    return this.#delay;
  }

  public get dependency(): string[] {
    return this.#dependency;
  }

  public get displayname(): string | undefined {
    return this.#displayname;
  }

  public set displayname(value: string | undefined) {
    this.#displayname = value;
  }

  public get filename(): string | undefined {
    return this.#filename;
  }

  public get group(): ShapeDiverResponseParameterGroup | undefined {
    return this.#group;
  }

  public get hidden(): boolean {
    return this.#hidden;
  }

  public set hidden(value: boolean) {
    this.#hidden = value;
  }

  public get id(): string {
    return this.#id;
  }

  public get maxWaitTime(): number {
    return this.#maxWaitTime;
  }

  public set maxWaitTime(value: number) {
    this.#maxWaitTime = value;
  }

  public get msg(): string | undefined {
    return this.#msg;
  }

  public get name(): string {
    return this.#name;
  }

  public get order(): number | undefined {
    return this.#order;
  }

  public set order(value: number | undefined) {
    this.#order = value;
  }

  public get result(): ShapeDiverResponseExportResult | undefined {
    return this.#result;
  }

  public get status_collect(): ShapeDiverResponseModelComputationStatus | undefined {
    return this.#status_collect;
  }

  public get status_computation(): ShapeDiverResponseModelComputationStatus | undefined {
    return this.#status_computation;
  }

  public get tooltip(): string | undefined {
    return this.#tooltip;
  }

  public set tooltip(value: string | undefined) {
    this.#tooltip = value;
  }

  public get type(): ShapeDiverResponseExportDefinitionType {
    return this.#type;
  }

  public get uid(): string | undefined {
    return this.#uid;
  }

  public get version(): string | undefined {
    return this.#version;
  }

  // #endregion Public Accessors (24)

  // #region Public Methods (3)

  public async request(parameters: { [key: string]: string } = {}): Promise<ShapeDiverResponseExport> {
    const eventId = this.#uuidGenerator.create();
    try {
      const event: ITaskEvent = { type: TASK_TYPE.EXPORT_REQUEST, id: eventId, progress: 0, status: 'Requesting export' };
      this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_START, event);

      this.#logger.debugLow(LOGGING_TOPIC.EXPORT, `Export(${this.#id}).request: Sending export request.`);
      const currentParameters = this.#sessionEngine.parameterValues;
      const exportParameters: { [key: string]: string } = {}

      for (let parameter in currentParameters)
        exportParameters[parameter] = parameters[parameter] || parameters[parameter] === '' ? parameters[parameter] : currentParameters[parameter];

      this.#logger.info(LOGGING_TOPIC.EXPORT, `Export(${this.#id}).request: Sending export request with parameters ${JSON.stringify(exportParameters)}.`);

      const exportDef = await this.#sessionEngine.requestExport(this.id, exportParameters, this.#maxWaitTime);
      this.updateExportDefinition(exportDef);

      const eventEnd: ITaskEvent = { type: TASK_TYPE.EXPORT_REQUEST, id: eventId, progress: 1, status: 'Returning export' };
      this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_END, eventEnd);

      return exportDef;
    } catch (e) {
      const eventEnd: ITaskEvent = { type: TASK_TYPE.EXPORT_REQUEST, id: eventId, progress: 1, status: 'Export request failed' };
      this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_CANCEL, eventEnd);

      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGING_TOPIC.EXPORT, `Export(${this.#id}).request`, e);
    }
  }

  public updateExport() {
    const exportDef = this.#sessionEngine.exports[this.id];
    this.#dependency = exportDef.dependency;
    this.#uid = exportDef.uid;
    this.#displayname = exportDef.displayname;
    this.#order = exportDef.order;
    this.#hidden = exportDef.hidden;
    this.#tooltip = exportDef.tooltip;
    this.#version = exportDef.version;
    this.#delay = exportDef.delay;
    this.#content = exportDef.content;
    this.#msg = exportDef.msg;
    this.#filename = exportDef.filename;
    this.#result = exportDef.result;
    this.#status_computation = exportDef.status_computation;
    this.#status_collect = exportDef.status_collect;
    this.#group = exportDef.group;
  }

  public updateExportDefinition(exportDef: ShapeDiverResponseExport) {
    this.#dependency = exportDef.dependency;
    this.#uid = exportDef.uid;
    this.#displayname = exportDef.displayname;
    this.#order = exportDef.order;
    this.#hidden = exportDef.hidden;
    this.#tooltip = exportDef.tooltip;
    this.#version = exportDef.version;
    this.#delay = exportDef.delay;
    this.#content = exportDef.content;
    this.#msg = exportDef.msg;
    this.#filename = exportDef.filename;
    this.#result = exportDef.result;
    this.#status_computation = exportDef.status_computation;
    this.#status_collect = exportDef.status_collect;
    this.#group = exportDef.group;
  }

  // #endregion Public Methods (3)
}