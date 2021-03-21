import { ISessionExport } from "@shapediver/viewer.shared.types";
import { IExport } from "../interfaces/IExport";

export class Export implements IExport {
  // #region Properties (2)

  private _name?: string;
  private _type?: string;

  // #endregion Properties (2)

  // #region Constructors (1)

  constructor(
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
  
  public async request(): Promise<any> {
    throw new Error("Method not implemented.");
  }
}