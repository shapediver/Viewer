import { ShapeDiverResponseBase, ShapeDiverResponseExport, ShapeDiverResponseExportDefinition, ShapeDiverResponseExportDefinitionType, ShapeDiverResponseExportPart, ShapeDiverResponseExportResult as ExportResult } from "@shapediver/api.geometry-api-dto-v1";
import { Session } from "@shapediver/viewer.session-engine.session-engine";
import { Logger } from "@shapediver/viewer.shared.monitoring";
import { InputValidator } from "@shapediver/viewer.shared.utils";
import { container } from "tsyringe";

export class Export implements ShapeDiverResponseExport {
  // #region Properties (17)

  readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
  readonly #logger: Logger = <Logger>container.resolve(Logger);
  readonly #sessionEngine: Session;

  readonly dependency: string[];
  readonly id: string;
  readonly name: string;
  readonly type: ShapeDiverResponseExportDefinitionType;
  readonly uid?: string;
  readonly content?: ShapeDiverResponseExportPart[];
  readonly delay?: number;
  readonly filename?: string;
  readonly msg?: string;
  readonly result?: ExportResult;
  readonly version?: string;

  displayName?: string;
  hidden: boolean;
  order?: number;

  // #endregion Properties (17)

  // #region Constructors (1)

  constructor(sessionEngine: Session, exportDef: ShapeDiverResponseExport, callbacks: any) {
    this.#sessionEngine = sessionEngine;

    this.dependency = exportDef.dependency;
    this.id = exportDef.uid || exportDef.id;
    this.name = exportDef.name;
    this.type = exportDef.type;

    if (exportDef.uid) this.uid = exportDef.uid;

    this.displayName = undefined;
    this.order = undefined;
    this.hidden = false;
  }

  // #endregion Constructors (1)


  // #region Public Methods (2)

  /**
   * Request the export with an optional additional parameter set.
   * 
   * @param parameters 
   * @returns 
   */
  public async request(parameters: { [key: string]: string } = {}): Promise<ShapeDiverResponseExport> {
    const currentParameters = this.#sessionEngine.parameterValues;
    const exportParameters: { [key: string]: string } = {}

    for (let parameter in currentParameters)
      exportParameters[parameter] = parameters[parameter] || currentParameters[parameter];
    try {
      let exportReply = <ShapeDiverResponseBase>(await this.#sessionEngine.sessionCommunication(this.#sessionEngine.sessionResponse.actions?.filter(v => v.name === 'export')[0].href!, this.#sessionEngine.sessionResponse.actions?.filter(v => v.name === 'export')[0].method!.toLowerCase()!, { exports: { id: this.id }, parameters: exportParameters }, 'application/json')).data;
      let exportResult = <ShapeDiverResponseExport>exportReply.exports![this.id];
      this.#sessionEngine.mergeResponses(this.#sessionEngine.sessionResponse, { version: this.#sessionEngine.sessionResponse.version, actions: exportReply.actions });
      if ('delay' in exportResult) {
        await this.timeout(exportResult.delay!);
        exportResult = (await this.cacheRequest(exportResult.version!))!;
      }
      (<any>this.version) = exportResult.version;
      (<any>this.delay) = exportResult.delay;
      (<any>this.content) = exportResult.content;
      (<any>this.msg) = exportResult.msg;
      (<any>this.filename) = exportResult.filename;
      (<any>this.result) = exportResult.result;
      return exportResult;
    } catch (e) {
      this.#logger.error('Export request failed.', e, e.response && e.response.status ? e.response.status : null);
      throw new Error(`Requesting the export with id ${this.id} failed.`);
    }
  }

  /**
   * Validates all public properties.
   */
  public validate() {
    this.#inputValidator.validate(this.displayName, 'string', false);
    this.#inputValidator.validate(this.hidden, 'boolean');
    this.#inputValidator.validate(this.order, 'number', false);
  }

  // #endregion Public Methods (2)

  // #region Private Methods (2)

  /**
   * Internal cache request for the export request.
   * 
   * @param version 
   * @returns 
   */
  private async cacheRequest(version: string): Promise<ShapeDiverResponseExport> {
    try {
      let exportCacheReply = <ShapeDiverResponseBase>(await this.#sessionEngine.sessionCommunication(this.#sessionEngine.sessionResponse.actions?.filter(v => v.name === 'export-cache')[0].href!, this.#sessionEngine.sessionResponse.actions?.filter(v => v.name === 'export-cache')[0].method!.toLowerCase()!, { [this.id]: version }, 'application/json')).data;
      let exportCacheResult = <ShapeDiverResponseExport>exportCacheReply.exports![this.id];
      if ('delay' in exportCacheResult) {
        await this.timeout(exportCacheResult.delay!);
        exportCacheResult = (await this.cacheRequest(version))!;
      }
      return exportCacheResult;
    } catch (e) {
      this.#logger.error('Export cache request failed.', e, e.response && e.response.status ? e.response.status : null);
      throw new Error(`Requesting the export with id ${this.id} failed.`);
    }
  }

  /**
   * Returns a promise that resolves after the amount of milliseconds provided.
   * 
   * @param ms the milliseconds
   * @returns promise that resolve after specified milliseconds
   */
  private async timeout(ms: number): Promise<any> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // #endregion Private Methods (2)
}