import { Logger } from "@shapediver/viewer.shared.monitoring";
import { HttpClient } from "@shapediver/viewer.shared.utils";
import { container } from "tsyringe";
import { IExport } from "../interfaces/IExport";
import { ISessionExport } from "../interfaces/session/ISessionExport";
import { Session } from "./Session";

export class Export implements IExport {
  // #region Properties (2)

  private _name?: string;
  private _type?: string;
  private readonly _httpClient: HttpClient = <HttpClient>container.resolve(HttpClient);
  private readonly _logger: Logger = <Logger>container.resolve(Logger);

  // #endregion Properties (2)

  // #region Constructors (1)

  constructor(
    private readonly _mySession: Session,
    private readonly _id: string,
    private readonly _exportDefinition: ISessionExport
  ) {
    this._name = this._exportDefinition.name;
    this._type = this._exportDefinition.type;
  }

  // #endregion Constructors (1)

  // #region Public Accessors (3)

  /**
   * Getter id
   * @return {string}
   */
  public get id(): string {
    return this._id;
  }

  /**
   * Getter name
   * @return {string | undefined}
   */
  public get name(): string | undefined {
    return this._name;
  }

  /**
   * Getter type
   * @return {string | undefined}
   */
  public get type(): string | undefined {
    return this._type;
  }

  // #endregion Public Accessors (3)

  public async request(parameters: { [key: string]: string } = {}): Promise<{ href: string, format: string, size: number } | null> {

    const currentParameters = this._mySession.getParametersAsString();
    const exportParameters: { [key: string]: string } = {}

    for (let parameter in currentParameters)
      exportParameters[parameter] = parameters[parameter] || currentParameters[parameter];
    try {
      let exportReply = (await this._mySession.sessionCommunication(this._mySession.sessionResponse.actions['export'].href!, this._mySession.sessionResponse.actions['export'].method!.toLowerCase(), { exports: { id: this.id }, parameters }, 'application/json')).data;
      let exportResult = exportReply.exports[this.id];
      this._mySession.sessionResponse.adaptSession({actions: exportReply.actions});
      if (exportResult.hasOwnProperty('delay')) {
        await this.timeout(exportResult.delay);
        exportResult = await this.cacheRequest(exportResult.version);
      }
      return exportResult.content[0];
    } catch (e) {
      this._logger.error('Export request failed.', e, e.response && e.response.status ? e.response.status : null);
      return null;
    }
  }

  private async cacheRequest(version: string): Promise<{ href: string, format: string, size: number } | null> { 
    try {
      let exportCacheReply = (await this._mySession.sessionCommunication(this._mySession.sessionResponse.actions['export-cache'].href!, this._mySession.sessionResponse.actions['export-cache'].method!.toLowerCase(), {[this.id]: version}, 'application/json')).data;
      let exportCacheResult = exportCacheReply.exports[this.id];
      if (exportCacheResult.hasOwnProperty('delay')) {
        await this.timeout(exportCacheResult.delay);
        exportCacheResult = await this.cacheRequest(version);
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

}