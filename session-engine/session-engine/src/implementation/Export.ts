import { ShapeDiverResponseBase, ShapeDiverResponseExport, ShapeDiverResponseExportDefinition, ShapeDiverResponseExportDefinitionType, ShapeDiverResponseExportPart, ShapeDiverResponseExportResult } from "@shapediver/api.geometry-api-dto-v1";
import { Logger } from "@shapediver/viewer.shared.monitoring";
import { HttpClient } from "@shapediver/viewer.shared.utils";
import { container } from "tsyringe";
import { IExport } from "../interfaces/IExport";
import { Session } from "./Session";

export class Export implements IExport, ShapeDiverResponseExport {
  // #region Properties (2)

  private readonly _httpClient: HttpClient = <HttpClient>container.resolve(HttpClient);
  private readonly _logger: Logger = <Logger>container.resolve(Logger);

  private _displayName?: string;
  private _hidden: boolean;
  private _order?: number;

  // #endregion Properties (2)

  // #region Constructors (1)

  constructor(
    private readonly _mySession: Session,
    private readonly _id: string,
    private _exportDefinition: ShapeDiverResponseExport | ShapeDiverResponseExportDefinition
  ) {    
    this._hidden = false;
  }

  // #endregion Constructors (1)

  // #region Public Accessors (11)

  /**
   * Getter result
   * @return {ShapeDiverResponseExportPart[] | undefined}
   */
  public get content(): ShapeDiverResponseExportPart[] | undefined {
    return (<ShapeDiverResponseExport>this._exportDefinition).content;
  }

  /**
   * Getter delay
   * @return {number | undefined}
   */
  public get delay(): number | undefined {
    return (<ShapeDiverResponseExport>this._exportDefinition).delay;
  }

  /**
   * Getter dependency
   * @return {string[]}
   */
  public get dependency(): string[] {
    return this._exportDefinition.dependency;
  }

  /**
   * Getter displayName
   * @return {string | undefined}
   */
  public get displayName(): string | undefined {
    return this._displayName;
  }

  /**
   * Setter displayName
   * @param {string | undefined} value
   */
  public set displayName(value: string | undefined) {
    this._displayName = value;
  }

  /**
   * Getter filename
   * @return {string | undefined}
   */
  public get filename(): string | undefined {
    return (<ShapeDiverResponseExport>this._exportDefinition).filename;
  }

  /**
   * Getter hidden
   * @return {boolean}
   */
  public get hidden(): boolean {
    return this._hidden;
  }

  /**
   * Setter hidden
   * @param {boolean} value
   */
  public set hidden(value: boolean) {
    this._hidden = value;
  }

  /**
   * Getter id
   * @return {string}
   */
  public get id(): string {
    return this._id;
  }

  /**
   * Getter msg
   * @return {string | undefined}
   */
  public get msg(): string | undefined {
    return (<ShapeDiverResponseExport>this._exportDefinition).msg;
  }

  /**
   * Getter name
   * @return {string}
   */
  public get name(): string {
    return this._exportDefinition.name;
  }

  /**
   * Getter order
   * @return {number | undefined}
   */
  public get order(): number | undefined {
    return this._order;
  }

  /**
   * Setter order
   * @param {number | undefined} value
   */
  public set order(value: number | undefined) {
    this._order = value;
  }
  
  /**
   * Getter result
   * @return {ShapeDiverResponseExportResult | undefined}
   */
  public get result(): ShapeDiverResponseExportResult | undefined {
    return (<ShapeDiverResponseExport>this._exportDefinition).result;
  }

  /**
   * Getter type
   * @return {ShapeDiverResponseExportDefinitionType}
   */
  public get type(): ShapeDiverResponseExportDefinitionType {
    return this._exportDefinition.type;
  }

  /**
   * Getter uid
   * @return {string | undefined}
   */
  public get uid(): string | undefined {
    return this._exportDefinition.uid;
  }

  /**
   * Getter version
   * @return {string | undefined}
   */
  public get version(): string | undefined {
    return (<ShapeDiverResponseExport>this._exportDefinition).version;
  }

  // #endregion Public Accessors (11)

  // #region Public Methods (2)

  public async request(parameters: { [key: string]: string } = {}): Promise<ShapeDiverResponseExport | ShapeDiverResponseExportDefinition | null> {
    const currentParameters = this._mySession.getParametersAsString();
    const exportParameters: { [key: string]: string } = {}

    for (let parameter in currentParameters)
      exportParameters[parameter] = parameters[parameter] || currentParameters[parameter];
    try {
      let exportReply = <ShapeDiverResponseBase>(await this._mySession.sessionCommunication(this._mySession.sessionResponse.actions?.filter(v => v.name === 'export')[0].href!, this._mySession.sessionResponse.actions?.filter(v => v.name === 'export')[0].method!.toLowerCase()!, { exports: { id: this.id }, parameters: exportParameters }, 'application/json')).data;
      let exportResult = <ShapeDiverResponseExport | ShapeDiverResponseExportDefinition>exportReply.exports![this.id];
      this._mySession.mergeResponses(this._mySession.sessionResponse, { version: this._mySession.sessionResponse.version, actions: exportReply.actions });
      if ('delay' in exportResult) {
        await this.timeout(exportResult.delay!);
        exportResult = (await this.cacheRequest(exportResult.version!))!;
      }
      return exportResult;
    } catch (e) {
      this._logger.error('Export request failed.', e, e.response && e.response.status ? e.response.status : null);
      return null;
    }
  }

  public update(value: ShapeDiverResponseExport | ShapeDiverResponseExportDefinition): void {
    this._exportDefinition = value;
  }

  // #endregion Public Methods (2)

  // #region Private Methods (2)

  private async cacheRequest(version: string): Promise<ShapeDiverResponseExport | ShapeDiverResponseExportDefinition | null> {
    try {
      let exportCacheReply = <ShapeDiverResponseBase>(await this._mySession.sessionCommunication(this._mySession.sessionResponse.actions?.filter(v => v.name === 'export-cache')[0].href!, this._mySession.sessionResponse.actions?.filter(v => v.name === 'export-cache')[0].method!.toLowerCase()!, { [this.id]: version }, 'application/json')).data;
      let exportCacheResult = <ShapeDiverResponseExport>exportCacheReply.exports![this.id];
      if ('delay' in exportCacheResult) {
        await this.timeout(exportCacheResult.delay!);
        exportCacheResult = (await this.cacheRequest(version))!;
      }
      return exportCacheResult;
    } catch (e) {
      this._logger.error('Export cache request failed.', e, e.response && e.response.status ? e.response.status : null);
      return null;
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