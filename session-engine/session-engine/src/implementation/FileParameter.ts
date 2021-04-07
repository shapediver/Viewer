import { Logger } from "@shapediver/viewer.shared.monitoring";
import { ISessionParameter } from "@shapediver/viewer.shared.types";
import { container } from "tsyringe";
import { AbstractParameter } from "./AbstractParameter";
import { Session } from "./Session";
import { HttpClient } from '@shapediver/viewer.shared.utils';

export class FileParameter extends AbstractParameter<File | Blob | string> {
  private readonly _logger: Logger = <Logger>container.resolve(Logger);
  private readonly _httpClient: HttpClient = <HttpClient>container.resolve(HttpClient);

  // #region Constructors (1)

  constructor(mySession: Session, id: string, parameterDefinition: ISessionParameter) {
    super(mySession, id, parameterDefinition);
    this._value = parameterDefinition.value;
  }

  // #endregion Constructors (1)

  // #region Public Accessors (13)

  /**
   * Getter value
   * @return {File | Blob | string}
   */
  public get value(): File | Blob | string {
    return this._value;
  }

  /**
   * Setter value
   * @param {File | Blob | string} value
   */
  public set value(value: File | Blob | string) {
    this._value = value;
  }

  public async upload() {
    if(!this.value) return;
    const data = typeof this.value === 'string' ? new Blob([this.value], { type: 'text/plain' }) : this.value;
    if(data.size === 0) {
      this._logger.error('Error uploading parameter ' + this.id + ': file size is 0.');
      return;
    }

    try {
      let uploadReply = (await this._mySession.sessionCommunication(this._mySession.sessionResponse.actions['upload'].href!, this._mySession.sessionResponse.actions['upload'].method!.toLowerCase(), { [this.id]: { size: data.size, format: this.format![0] }}, 'application/json')).data;
      await this._httpClient.put(uploadReply[this.id].href, data, { headers: {'Content-Type': this.format![0] }});
      return uploadReply[this.id].id;
    } catch(e) {
      this._logger.error('Upload request failed.', e, e.response && e.response.status ? e.response.status : null);
    }
  }

  // #endregion Public Accessors (13)
}