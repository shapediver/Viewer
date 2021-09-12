import {
  ShapeDiverResponseBase,
  ShapeDiverResponseExport,
  ShapeDiverResponseExportDefinitionType,
} from '@shapediver/api.geometry-api-dto-v1'
import { Session } from '@shapediver/viewer.session-engine.session-engine'
import { InputValidator, Logger, LOGGINGTOPIC, SDError } from '@shapediver/viewer.shared.services'
import { container } from 'tsyringe'

import { IExport } from '../../interfaces/session/IExport'

export class Export implements IExport {
  // #region Properties (11)

  readonly #dependency!: string[];
  readonly #id: string;
  readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
  readonly #logger: Logger = <Logger>container.resolve(Logger);
  readonly #name: string;
  readonly #sessionEngine: Session;
  readonly #type: ShapeDiverResponseExportDefinitionType;
  readonly #uid?: string;

  #displayname?: string;
  #hidden: boolean = false;
  #order?: number;

  // #endregion Properties (11)

  // #region Constructors (1)

  constructor(sessionEngine: Session, exportDef: ShapeDiverResponseExport) {
    try {
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
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.EXPORT, e, `Export(${exportDef.id}).constructor: Something unexpected happened.`, true)
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
      this.#logger.info(LOGGINGTOPIC.EXPORT, `Export(${this.#id}).displayname: DisplayName was updated to ${this.displayname}.`);
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.EXPORT, e, `Export(${this.#id}).displayname: Something unexpected happened.`, true)
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
      this.#logger.info(LOGGINGTOPIC.EXPORT, `Export(${this.#id}).hidden: Hidden was updated to ${this.hidden}.`);
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.EXPORT, e, `Export(${this.#id}).hidden: Something unexpected happened.`, true)
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
      this.#logger.info(LOGGINGTOPIC.EXPORT, `Export(${this.#id}).order: Order was updated to ${this.order}.`);
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.EXPORT, e, `Export(${this.#id}).order: Something unexpected happened.`, true)
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
      try {
        let exportReply = <ShapeDiverResponseBase>(await this.#sessionEngine.sessionCommunication(this.#sessionEngine.sessionResponse.actions?.filter(v => v.name === 'export')[0].href!, this.#sessionEngine.sessionResponse.actions?.filter(v => v.name === 'export')[0].method!.toLowerCase()!, { exports: { id: this.#id }, parameters: exportParameters }, 'application/json')).data;
        this.#logger.debugLow(LOGGINGTOPIC.EXPORT, `Export(${this.#id}).request: Received export reply ${JSON.stringify(exportReply)}.`);
        let exportResult = <ShapeDiverResponseExport>exportReply.exports![this.#id];
        this.#sessionEngine.mergeResponses(this.#sessionEngine.sessionResponse, { version: this.#sessionEngine.sessionResponse.version, actions: exportReply.actions });
        if ('delay' in exportResult) {
          await new Promise(resolve => setTimeout(resolve, exportResult.delay!));
          exportResult = (await this.cacheRequest(exportResult.version!))!;
        }
        return exportResult;
      } catch (e) {
        if (e.response && e.response.status) {
          throw this.#logger.httpError(LOGGINGTOPIC.EXPORT, e, `Export(${this.#id}).request: Request failed.`, e.response.status, true);
        } else {
          throw this.#logger.error(LOGGINGTOPIC.EXPORT, e, `Export(${this.#id}).request: Request failed.`, true);
        }
      }
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.EXPORT, e, `Export(${this.#id}).request: Something unexpected happened.`, true)
    }
  }

  // #endregion Public Methods (1)

  // #region Private Methods (1)

  /**
   * Internal cache request for the export request.
   * 
   * @param version 
   * @returns 
   */
  private async cacheRequest(version: string): Promise<ShapeDiverResponseExport> {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.EXPORT, `Export(${this.#id}).cacheRequest: Sending cache request.`);
      try {
        let exportCacheReply = <ShapeDiverResponseBase>(await this.#sessionEngine.sessionCommunication(this.#sessionEngine.sessionResponse.actions?.filter(v => v.name === 'export-cache')[0].href!, this.#sessionEngine.sessionResponse.actions?.filter(v => v.name === 'export-cache')[0].method!.toLowerCase()!, { [this.#id]: version }, 'application/json')).data;
        this.#logger.debugLow(LOGGINGTOPIC.EXPORT, `Export(${this.#id}).cacheRequest: Received export cache reply ${JSON.stringify(exportCacheReply)}.`);
        let exportCacheResult = <ShapeDiverResponseExport>exportCacheReply.exports![this.#id];
        if ('delay' in exportCacheResult) {
          await new Promise(resolve => setTimeout(resolve, exportCacheResult.delay!));
          exportCacheResult = (await this.cacheRequest(version))!;
        }
        return exportCacheResult;
      } catch (e) {
        if (e.response && e.response.status) {
          throw this.#logger.httpError(LOGGINGTOPIC.EXPORT, e, `Export(${this.#id}).cacheRequest: Cache request failed.`, e.response.status, true);
        } else {
          throw this.#logger.error(LOGGINGTOPIC.EXPORT, e, `Export(${this.#id}).cacheRequest: Cache request failed.`, true);
        }
      }
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.EXPORT, e, `Export(${this.#id}).cacheRequest: Something unexpected happened.`, true)
    }
  }

  // #endregion Private Methods (1)
}