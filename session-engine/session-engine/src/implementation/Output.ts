import { ShapeDiverResponseOutput, ShapeDiverResponseOutputChunk, ShapeDiverResponseOutputDefinition, ShapeDiverResponseOutputPart } from "@shapediver/api.geometry-api-dto-v1";
import { IOutput } from "../interfaces/IOutput";
import { Session } from "./Session";

export class Output implements IOutput, ShapeDiverResponseOutput {
  // #region Properties (2)

  private _content?: ShapeDiverResponseOutputPart[];
  private _version: string;

  // #endregion Properties (2)

  // #region Constructors (1)

  constructor(
    private readonly _mySession: Session,
    private readonly _id: string,
    private _outputDefinition: ShapeDiverResponseOutput | ShapeDiverResponseOutputDefinition
  ) {
    this._content = (<ShapeDiverResponseOutput>this._outputDefinition).content;
    this._version = (<ShapeDiverResponseOutput>this._outputDefinition).version;
  }

  // #endregion Constructors (1)

  // #region Public Accessors (14)

  /**
   * Getter bbmax
   * @return {number[] | undefined}
   */
  public get bbmax(): number[] | undefined {
    return (<ShapeDiverResponseOutput>this._outputDefinition).bbmax;
  }

  /**
   * Getter bbmin
   * @return {number[] | undefined}
   */
  public get bbmin(): number[] | undefined {
    return (<ShapeDiverResponseOutput>this._outputDefinition).bbmin;
  }

  /**
   * Getter chunks
   * @return {ShapeDiverResponseOutputChunk[] | undefined}
   */
  public get chunks(): ShapeDiverResponseOutputChunk[] | undefined {
    return this._outputDefinition.chunks;
  }

  /**
   * Getter content
   * @return {ShapeDiverResponseOutputPart[] | undefined}
   */
  public get content(): ShapeDiverResponseOutputPart[] | undefined {
    return this._content;
  }

  /**
  * Setter content
  * @param {ShapeDiverResponseOutputPart[] | undefined} value
  */
  public set content(value: ShapeDiverResponseOutputPart[] | undefined) {
    this._content = value;
  }

  /**
   * Getter delay
   * @return {number | undefined}
   */
  public get delay(): number | undefined {
    return (<ShapeDiverResponseOutput>this._outputDefinition).delay;
  }

  /**
   * Getter dependency
   * @return {string[]}
   */
  public get dependency(): string[] {
    return this._outputDefinition.dependency;
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
    return this._outputDefinition.material;
  }

  /**
   * Getter msg
   * @return {string | undefined}
   */
  public get msg(): string | undefined {
    return (<ShapeDiverResponseOutput>this._outputDefinition).msg;
  }

  /**
   * Getter name
   * @return {string}
   */
  public get name(): string {
    return this._outputDefinition.name;
  }

  /**
   * Getter uid
   * @return {string | undefined}
   */
  public get uid(): string | undefined {
    return this._outputDefinition.uid;
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

  // #endregion Public Accessors (14)

  // #region Public Methods (1)

  public update(value: ShapeDiverResponseOutput | ShapeDiverResponseOutputDefinition): void {
    this._outputDefinition = value;
    if('version' in value) this.version = value.version;
    if('content' in value) this.content = value.content;
  }

  // #endregion Public Methods (1)
}