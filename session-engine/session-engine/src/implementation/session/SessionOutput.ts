
import { ISessionOutput } from "../../interfaces/session/ISessionOutput";
import { SessionOutputContent } from "./SessionOutputContent";

export class SessionOutput implements ISessionOutput {
  // #region Constructors (1)

  constructor(
    private _id: string,
    private _version: string,
    private _bbmax?: number[],
    private _bbmin?: number[],
    private _content: SessionOutputContent[] = [],
    private _delay?: number,
    private _material?: string,
    private _name?: string,
  ) {
  }

  // #endregion Constructors (1)

  // #region Public Accessors (16)

  /**
   * Getter bbmax
   * @return {number[] | undefined}
   */
  public get bbmax(): number[] | undefined {
    return this._bbmax;
  }

  /**
   * Setter bbmax
   * @param {number[] | undefined} value
   */
  public set bbmax(value: number[] | undefined) {
    this._bbmax = value;
  }

  /**
   * Getter bbmin
   * @return {number[] | undefined}
   */
  public get bbmin(): number[] | undefined {
    return this._bbmin;
  }

  /**
   * Setter bbmin
   * @param {number[] | undefined} value
   */
  public set bbmin(value: number[] | undefined) {
    this._bbmin = value;
  }

  /**
   * Getter content
   * @return {SessionOutputContent[]}
   */
  public get content(): SessionOutputContent[] {
    return this._content;
  }

  /**
   * Setter content
   * @param {SessionOutputContent[]} value
   */
  public set content(value: SessionOutputContent[]) {
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
   * Setter delay
   * @param {number | undefined} value
   */
  public set delay(value: number | undefined) {
    this._delay = value;
  }

  /**
   * Getter id
   * @return {string}
   */
  public get id(): string {
    return this._id;
  }

  /**
   * Setter id
   * @param {string} value
   */
  public set id(value: string) {
    this._id = value;
  }

  /**
   * Getter material
   * @return {string | undefined}
   */
  public get material(): string | undefined {
    return this._material;
  }

  /**
   * Setter material
   * @param {string | undefined} value
   */
  public set material(value: string | undefined) {
    this._material = value;
  }

  /**
   * Getter name
   * @return {string | undefined}
   */
  public get name(): string | undefined {
    return this._name;
  }

  /**
   * Setter name
   * @param {string | undefined} value
   */
  public set name(value: string | undefined) {
    this._name = value;
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

  // #endregion Public Accessors (16)
}