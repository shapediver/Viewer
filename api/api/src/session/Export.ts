import { ShapeDiverResponseBase, ShapeDiverResponseExport, ShapeDiverResponseExportDefinition, ShapeDiverResponseExportDefinitionType, ShapeDiverResponseExportPart, ShapeDiverResponseExportResult as ExportResult } from "@shapediver/api.geometry-api-dto-v1";
import { Session } from "@shapediver/viewer.session-engine.session-engine";
import { Logger, LOGGINGTOPIC, SDError } from "@shapediver/viewer.shared.utils";
import { InputValidator } from "@shapediver/viewer.shared.utils";
import { container } from "tsyringe";

export class Export implements ShapeDiverResponseExportDefinition {
  // #region Properties (17)

  readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
  readonly #logger: Logger = <Logger>container.resolve(Logger);
  readonly #sessionEngine: Session;

  readonly dependency!: string[];
  readonly displayName?: string;
  readonly hidden: boolean;
  readonly id: string;
  readonly name: string;
  readonly order?: number;
  readonly type: ShapeDiverResponseExportDefinitionType;
  readonly uid?: string;

  // #endregion Properties (17)

  // #region Constructors (1)

  constructor(sessionEngine: Session, exportDef: ShapeDiverResponseExport) {
    try {
      this.#sessionEngine = sessionEngine;

      if (exportDef.dependency) this.dependency = exportDef.dependency;
      this.id = exportDef.uid || exportDef.id;
      this.name = exportDef.name;
      this.type = exportDef.type;

      if (exportDef.uid) this.uid = exportDef.uid;

      this.displayName = undefined;
      this.order = undefined;
      this.hidden = false;
      this.#logger.debugLow(LOGGINGTOPIC.EXPORT, `Export(${this.id}).constructor: Initialized export ${JSON.stringify(exportDef)}.`);
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.EXPORT, new SDError(e.message, e), `Export(${exportDef.uid || exportDef.id}).constructor: Something unexpected happened.`, true)
    }
  }

  // #endregion Constructors (1)

  // #region Public Methods (5)

  /**
   * Request the export with an optional additional parameter set.
   * 
   * @param parameters 
   * @returns 
   */
  public async request(parameters: { [key: string]: string } = {}): Promise<ShapeDiverResponseExport> {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.EXPORT, `Export(${this.id}).request: Sending export request.`);
      const currentParameters = this.#sessionEngine.parameterValues;
      const exportParameters: { [key: string]: string } = {}

      for (let parameter in currentParameters)
        exportParameters[parameter] = parameters[parameter] || parameters[parameter] === '' ? parameters[parameter] : currentParameters[parameter];

      this.#logger.info(LOGGINGTOPIC.EXPORT, `Export(${this.id}).request: Sending export request with parameters ${JSON.stringify(exportParameters)}.`);
      try {
        let exportReply = <ShapeDiverResponseBase>(await this.#sessionEngine.sessionCommunication(this.#sessionEngine.sessionResponse.actions?.filter(v => v.name === 'export')[0].href!, this.#sessionEngine.sessionResponse.actions?.filter(v => v.name === 'export')[0].method!.toLowerCase()!, { exports: { id: this.id }, parameters: exportParameters }, 'application/json')).data;
        this.#logger.debugLow(LOGGINGTOPIC.EXPORT, `Export(${this.id}).request: Received export reply ${JSON.stringify(exportReply)}.`);
        let exportResult = <ShapeDiverResponseExport>exportReply.exports![this.id];
        this.#sessionEngine.mergeResponses(this.#sessionEngine.sessionResponse, { version: this.#sessionEngine.sessionResponse.version, actions: exportReply.actions });
        if ('delay' in exportResult) {
          await new Promise(resolve => setTimeout(resolve, exportResult.delay!));
          exportResult = (await this.cacheRequest(exportResult.version!))!;
        }
        return exportResult;
      } catch (e) {
        if (e.response && e.response.status) {
          throw this.#logger.httpError(LOGGINGTOPIC.EXPORT, new SDError(e.message, e), `Export(${this.id}).request: Request failed.`, e.response.status, true);
        } else {
          throw this.#logger.error(LOGGINGTOPIC.EXPORT, new SDError(e.message, e), `Export(${this.id}).request: Request failed.`, true);
        }
      }
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.EXPORT, new SDError(e.message, e), `Export(${this.id}).request: Something unexpected happened.`, true)
    }
  }

  public updateDisplayName(value: string | undefined) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.EXPORT, `Export(${this.id}).updateDisplayName: Updating DisplayName to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.EXPORT, `Export(${this.id}).updateDisplayName`, value, 'string', false);
      (<any>this.displayName) = value;
      this.#logger.info(LOGGINGTOPIC.EXPORT, `Export(${this.id}).updateDisplayName: DisplayName was updated to ${this.displayName}.`);
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.EXPORT, new SDError(e.message, e), `Export(${this.id}).updateDisplayName: Something unexpected happened.`, true)
    }
  }

  public updateHidden(value: boolean) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.EXPORT, `Export(${this.id}).updateHidden: Updating Hidden to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.EXPORT, `Export(${this.id}).updateHidden`, value, 'boolean');
      (<any>this.hidden) = value;
      this.#logger.info(LOGGINGTOPIC.EXPORT, `Export(${this.id}).updateHidden: Hidden was updated to ${this.hidden}.`);
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.EXPORT, new SDError(e.message, e), `Export(${this.id}).updateHidden: Something unexpected happened.`, true)
    }
  }

  public updateOrder(value: number | undefined) {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.EXPORT, `Export(${this.id}).updateOrder: Updating Order to ${value}.`);
      this.#inputValidator.validateAndError(LOGGINGTOPIC.EXPORT, `Export(${this.id}).updateOrder`, value, 'number', false);
      (<any>this.order) = value;
      this.#logger.info(LOGGINGTOPIC.EXPORT, `Export(${this.id}).updateOrder: Order was updated to ${this.order}.`);
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.EXPORT, new SDError(e.message, e), `Export(${this.id}).updateOrder: Something unexpected happened.`, true)
    }
  }

  // #endregion Public Methods (5)

  // #region Private Methods (2)

  /**
   * Internal cache request for the export request.
   * 
   * @param version 
   * @returns 
   */
  private async cacheRequest(version: string): Promise<ShapeDiverResponseExport> {
    try {
      this.#logger.debugLow(LOGGINGTOPIC.EXPORT, `Export(${this.id}).cacheRequest: Sending cache request.`);
      try {
        let exportCacheReply = <ShapeDiverResponseBase>(await this.#sessionEngine.sessionCommunication(this.#sessionEngine.sessionResponse.actions?.filter(v => v.name === 'export-cache')[0].href!, this.#sessionEngine.sessionResponse.actions?.filter(v => v.name === 'export-cache')[0].method!.toLowerCase()!, { [this.id]: version }, 'application/json')).data;
        this.#logger.debugLow(LOGGINGTOPIC.EXPORT, `Export(${this.id}).cacheRequest: Received export cache reply ${JSON.stringify(exportCacheReply)}.`);
        let exportCacheResult = <ShapeDiverResponseExport>exportCacheReply.exports![this.id];
        if ('delay' in exportCacheResult) {
          await new Promise(resolve => setTimeout(resolve, exportCacheResult.delay!));
          exportCacheResult = (await this.cacheRequest(version))!;
        }
        return exportCacheResult;
      } catch (e) {
        if (e.response && e.response.status) {
          throw this.#logger.httpError(LOGGINGTOPIC.EXPORT, e, `Export(${this.id}).cacheRequest: Cache request failed.`, e.response.status, true);
        } else {
          throw this.#logger.error(LOGGINGTOPIC.EXPORT, e, `Export(${this.id}).cacheRequest: Cache request failed.`, true);
        }
      }
    } catch (e) {
      if (e instanceof SDError) throw e;
      throw this.#logger.error(LOGGINGTOPIC.EXPORT, new SDError(e.message, e), `Export(${this.id}).cacheRequest: Something unexpected happened.`, true)
    }
  }

  // #endregion Private Methods (2)
}