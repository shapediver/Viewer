import { IContent } from "@shapediver/viewer.shared.types";
import { IOutput } from "../interfaces/IOutput";
import { ISessionOutput } from "../interfaces/session/ISessionOutput";
import { Session } from "./Session";

export class Output implements IOutput {
  // #region Properties (7)

  private readonly _bbmax?: number[];
  private readonly _bbmin?: number[];
  private readonly _delay?: number;
  private readonly _material?: string;
  private readonly _name?: string;

  private _content?: IContent[];
  private _version: string;

  // #endregion Properties (7)

  // #region Constructors (1)

  constructor(
    private readonly _mySession: Session,
    private readonly _id: string,
    private readonly _outputDefinition: ISessionOutput
  ) {
    this._bbmax = this._outputDefinition.bbmax;
    this._bbmin = this._outputDefinition.bbmin;
    this._delay = this._outputDefinition.delay;
    this._material = this._outputDefinition.material;
    this._name = this._outputDefinition.name;
    this._content = this._outputDefinition.content;
    this._version = this._outputDefinition.version;
  }

  // #endregion Constructors (1)

  // #region Public Accessors (10)

  /**
   * Getter bbmax
   * @return {number[] | undefined}
   */
  public get bbmax(): number[] | undefined {
    return this._bbmax;
  }

  /**
   * Getter bbmin
   * @return {number[] | undefined}
   */
  public get bbmin(): number[] | undefined {
    return this._bbmin;
  }

  /**
   * Getter content
   * @return {IContent[] | undefined}
   */
  public get content(): IContent[] | undefined {
    return this._content;
  }

  /**
  * Setter content
  * @param {IContent[] | undefined} value
  */
  public set content(value: IContent[] | undefined) {
    this._content = value;
  }

  /**
   * Getter delay
   * @return {number | undefined}
   */
  public get delay(): number | undefined {
    return this._delay;
  }

  /**
   * Getter id
   * @return {string}
   */
  public get id(): string {
    return this._id;
  }

  /**
   * Getter material
   * @return {string | undefined}
   */
  public get material(): string | undefined {
    return this._material;
  }

  /**
   * Getter name
   * @return {string | undefined}
   */
  public get name(): string | undefined {
    return this._name;
  }

  /**
   * Getter version
   * @return {string}
   */
  public get version(): string {
    return this._version;
  }

  /**
  * Setter version
  * @param {string} value
  */
  public set version(value: string) {
    this._version = value;
  }

  // #endregion Public Accessors (10)
}