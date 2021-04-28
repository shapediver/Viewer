import { Logger } from "@shapediver/viewer.shared.monitoring";
import { container } from "tsyringe";
import { AbstractParameter } from "../AbstractParameter";
import { Session } from "../Session";
import { HttpClient } from '@shapediver/viewer.shared.utils';
import { PARAMETERTYPE, PARAMETERVISUALIZATION } from "../..";
import { ISessionParameter } from "../../interfaces/session/ISessionParameter";

export class FileParameter extends AbstractParameter<File | Blob | string> {
  // #region Properties (4)

  private readonly _format: string[];
  private readonly _httpClient: HttpClient = <HttpClient>container.resolve(HttpClient);
  private readonly _logger: Logger = <Logger>container.resolve(Logger);
  private readonly _max: number;

  // #endregion Properties (4)

  // #region Constructors (1)

  constructor(mySession: Session, id: string, parameterDefinition: ISessionParameter) {
    super(mySession, id, parameterDefinition, parameterDefinition.defval);
    this._format = parameterDefinition.format!;
    this._max = +parameterDefinition.max!;
  }

  // #endregion Constructors (1)

  // #region Public Accessors (4)

  /**
   * Getter format
   * @return {string[]}
   */
  public get format(): string[] {
    return this._format;
  }

  /**
   * Getter max
   * @return {number}
   */
  public get max(): number {
    return this._max;
  }

  /**
   * Getter type
   * @return {PARAMETERTYPE}
   */
  public get type(): PARAMETERTYPE.FILE {
    return <PARAMETERTYPE.FILE>this._type;
  }

  /**
   * Getter visualization
   * @return {PARAMETERVISUALIZATION}
   */
  public get visualization(): PARAMETERVISUALIZATION.BUTTON {
    return <PARAMETERVISUALIZATION.BUTTON>this._visualization;
  }

  // #endregion Public Accessors (4)

  // #region Public Methods (2)

  /**
     * Convert the current value to string
     * @return {string}
     */
  public toString(): string {
    return '';
  }

  public async upload() {
    if (!this.value) return;
    const data = new File([typeof this.value === 'string' ? new Blob([this.value], { type: 'text/plain' }) : this.value], 'airboat.obj');
    if (data.size === 0) {
      this._logger.error('Error uploading parameter ' + this.id + ': file size is 0.');
      return;
    }

    try {
      let uploadReply = (await this._mySession.sessionCommunication(this._mySession.sessionResponse.actions['upload'].href!, this._mySession.sessionResponse.actions['upload'].method!.toLowerCase(), { [this.id]: { size: data.size, format: this.format![0] } }, 'application/json')).data;
      await this._httpClient.put(uploadReply[this.id].href, { data, headers: { 'Content-Type': this.format![0] }, });
      return uploadReply[this.id].id;
    } catch (e) {
      this._logger.error('Upload request failed.', e, e.response && e.response.status ? e.response.status : null);
    }
  }

  // #endregion Public Methods (2)
}