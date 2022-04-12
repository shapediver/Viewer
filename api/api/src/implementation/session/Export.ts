import { ShapeDiverResponseExport, ShapeDiverResponseExportContent, ShapeDiverResponseExportDefinitionType, ShapeDiverResponseExportResult, ShapeDiverResponseModelComputationStatus, ShapeDiverResponseParameterGroup } from '@shapediver/sdk.geometry-api-sdk-v2'
import { Session } from '@shapediver/viewer.session-engine.session-engine'
import { EventEngine, EVENTTYPE, InputValidator, Logger, LOGGINGTOPIC, ShapeDiverBackendError, ShapeDiverViewerError, UuidGenerator } from '@shapediver/viewer.shared.services'
import { container } from 'tsyringe'
import { ITaskEvent, TASKTYPE } from '@shapediver/viewer.shared.types'

import { IExport } from '../../interfaces/session/IExport'
import { ISession } from '../../interfaces/session/ISession'

export class Export implements IExport {
  // #region Properties (21)

  readonly #eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);
  readonly #id: string;
  readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
  readonly #logger: Logger = <Logger>container.resolve(Logger);
  readonly #name: string;
  readonly #session: ISession;
  readonly #sessionEngine: Session;
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

  // #endregion Properties (21)

  // #region Constructors (1)

  constructor(session: ISession, sessionEngine: Session, exportDef: ShapeDiverResponseExport) {
    try {
      this.#session = session;
      this.#sessionEngine = sessionEngine;
      this.#id = exportDef.id;
      this.#name = exportDef.name;
      this.#type = exportDef.type;

      this.updateExportDefinition(exportDef);

      this.#logger.debugLow(LOGGINGTOPIC.EXPORT, `Export(${this.#id}).constructor: Initialized export ${JSON.stringify(exportDef)}.`);
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.EXPORT, `Export(${exportDef.id}).constructor`, e);
    }
  }

  // #endregion Constructors (1)

  // #region Public Accessors (21)

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
    try {
      this.#logger.debugLow(LOGGINGTOPIC.EXPORT, `Export(${this.#id}).displayname: Updating DisplayName to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.EXPORT, `Export(${this.#id}).displayname`, value, 'string', false);
      this.#displayname = value;
      this.#logger.debug(LOGGINGTOPIC.EXPORT, `Export(${this.#id}).displayname: DisplayName was updated to ${this.displayname}.`);
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.EXPORT, `Export(${this.#id}).displayname`, e);
    }
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
    try {
      this.#logger.debugLow(LOGGINGTOPIC.EXPORT, `Export(${this.#id}).hidden: Updating Hidden to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.EXPORT, `Export(${this.#id}).hidden`, value, 'boolean');
      this.#hidden = value;
      this.#logger.debug(LOGGINGTOPIC.EXPORT, `Export(${this.#id}).hidden: Hidden was updated to ${this.hidden}.`);
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.EXPORT, `Export(${this.#id}).hidden`, e);
    }
  }

  public get id(): string {
    return this.#id;
  }

  public get maxWaitTime(): number {
    return this.#maxWaitTime;
  }

  public set maxWaitTime(value: number) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.EXPORT, `Export(${this.#id}).maxWaitTime: Updating maxWaitTime to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.EXPORT, `Export(${this.#id}).maxWaitTime`, value, 'number');
      this.#maxWaitTime = value;
      this.#logger.debug(LOGGINGTOPIC.EXPORT, `Export(${this.#id}).maxWaitTime: maxWaitTime was updated to ${this.maxWaitTime}.`);
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.EXPORT, `Export(${this.#id}).maxWaitTime`, e);
    }
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
    try {
      this.#logger.debugLow(LOGGINGTOPIC.EXPORT, `Export(${this.#id}).order: Updating Order to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.EXPORT, `Export(${this.#id}).order`, value, 'number', false);
      this.#order = value;
      this.#logger.debug(LOGGINGTOPIC.EXPORT, `Export(${this.#id}).order: Order was updated to ${this.order}.`);
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.EXPORT, `Export(${this.#id}).order`, e);
    }
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
    try {
      this.#logger.debugLow(LOGGINGTOPIC.EXPORT, `Export(${this.#id}).tooltip: Updating tooltip to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.EXPORT, `Export(${this.#id}).tooltip`, value, 'string', false);
      this.#tooltip = value;
      this.#logger.debug(LOGGINGTOPIC.EXPORT, `Export(${this.#id}).tooltip: tooltip was updated to ${this.tooltip}.`);
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.EXPORT, `Export(${this.#id}).tooltip`, e);
    }
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

  // #endregion Public Accessors (21)

  // #region Public Methods (2)

  public async request(parameters: { [key: string]: string } = {}): Promise<ShapeDiverResponseExport> {
    const eventId = this.#uuidGenerator.create();
    try {
      const event: ITaskEvent = { type: TASKTYPE.EXPORT_REQUEST, id: eventId, progress: 0, status: 'Requesting export' };
      this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_START, event);

      this.#logger.debugLow(LOGGINGTOPIC.EXPORT, `Export(${this.#id}).request: Sending export request.`);
      const currentParameters = this.#sessionEngine.parameterValues;
      const exportParameters: { [key: string]: string } = {}

      for (let parameter in currentParameters)
        exportParameters[parameter] = parameters[parameter] || parameters[parameter] === '' ? parameters[parameter] : currentParameters[parameter];

      this.#logger.info(LOGGINGTOPIC.EXPORT, `Export(${this.#id}).request: Sending export request with parameters ${JSON.stringify(exportParameters)}.`);

      const exportDef = await this.#sessionEngine.requestExport(this.id, exportParameters, this.#maxWaitTime);
      this.updateExportDefinition(exportDef);

      const eventEnd: ITaskEvent = { type: TASKTYPE.EXPORT_REQUEST, id: eventId, progress: 1, status: 'Returning export' };
      this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_END, eventEnd);

      return exportDef;
    } catch (e) {
      const eventEnd: ITaskEvent = { type: TASKTYPE.EXPORT_REQUEST, id: eventId, progress: 1, status: 'Export request failed' };
      this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_CANCEL, eventEnd);

      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.EXPORT, `Export(${this.#id}).request`, e);
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

  // #endregion Public Methods (2)

  // #region Private Methods (1)

  private updateExportDefinition(exportDef: ShapeDiverResponseExport) {
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

  // #endregion Private Methods (1)
}