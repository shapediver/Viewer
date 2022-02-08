import { ShapeDiverResponseExport, ShapeDiverResponseExportDefinitionType } from '@shapediver/sdk.geometry-api-sdk-v2'
import { Session } from '@shapediver/viewer.session-engine.session-engine'
import { InputValidator, Logger, LOGGINGTOPIC, ShapeDiverBackendError, ShapeDiverViewerError } from '@shapediver/viewer.shared.services'
import { container } from 'tsyringe'

import { IExport } from '../../interfaces/session/IExport'
import { ISession } from '../../interfaces/session/ISession'

export class Export implements IExport {
  // #region Properties (11)

  readonly #dependency!: string[];
  readonly #id: string;
  readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
  readonly #logger: Logger = <Logger>container.resolve(Logger);
  readonly #name: string;
  readonly #session: ISession;
  readonly #sessionEngine: Session;
  readonly #type: ShapeDiverResponseExportDefinitionType;
  readonly #uid?: string;

  #displayname?: string;
  #hidden: boolean = false;
  #order?: number;
  #tooltip?: string;

  // #endregion Properties (11)

  // #region Constructors (1)

  constructor(session: ISession, sessionEngine: Session, exportDef: ShapeDiverResponseExport) {
    try {
      this.#session = session;
      this.#sessionEngine = sessionEngine;

      if (exportDef.dependency) this.#dependency = exportDef.dependency;
      this.#id = exportDef.id;
      this.#name = exportDef.name;
      this.#type = exportDef.type;

      if (exportDef.uid !== undefined) this.#uid = exportDef.uid;

      if (exportDef.displayname !== undefined) this.#displayname = exportDef.displayname;
      if (exportDef.order !== undefined) this.#order = exportDef.order;
      if (exportDef.hidden !== undefined) this.#hidden = exportDef.hidden;

      this.#logger.debugLow(LOGGINGTOPIC.EXPORT, `Export(${this.#id}).constructor: Initialized export ${JSON.stringify(exportDef)}.`);
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.EXPORT, `Export(${exportDef.id}).constructor`, e);
    }
  }

  // #endregion Constructors (1)

  // #region Public Accessors (11)

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

  // #endregion Public Accessors (11)

  // #region Public Methods (1)

  public async request(parameters: { [key: string]: string } = {}): Promise<ShapeDiverResponseExport> {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.EXPORT, `Export(${this.#id}).request: Sending export request.`);
      const currentParameters = this.#sessionEngine.parameterValues;
      const exportParameters: { [key: string]: string } = {}

      for (let parameter in currentParameters)
        exportParameters[parameter] = parameters[parameter] || parameters[parameter] === '' ? parameters[parameter] : currentParameters[parameter];

      this.#logger.info(LOGGINGTOPIC.EXPORT, `Export(${this.#id}).request: Sending export request with parameters ${JSON.stringify(exportParameters)}.`);
      return await this.#sessionEngine.requestExport(this.id, exportParameters);
    } catch (e) {
      if (e instanceof ShapeDiverViewerError || e instanceof ShapeDiverBackendError) throw e;
      throw this.#logger.handleError(LOGGINGTOPIC.EXPORT, `Export(${this.#id}).request`, e);
    }
  }

  // #endregion Public Methods (1)
}