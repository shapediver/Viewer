import { IOutput, Output as OutputLogic } from "@shapediver/viewer.session-engine.session-engine";
import { ISessionOutputContent } from "@shapediver/viewer.shared.types";

export class Output implements IOutput {

    readonly #output: OutputLogic;

    // #region Public Accessors (16)
    constructor(o: OutputLogic) {
        this.#output = o;
    }

  /**
   * Getter bbmax
   * @return {number[] | undefined}
   */
   public get bbmax(): number[] | undefined {
    return this.#output.bbmax;
  }

  /**
   * Getter bbmin
   * @return {number[] | undefined}
   */
  public get bbmin(): number[] | undefined {
    return this.#output.bbmin;
  }

  /**
   * Getter content
   * @return {ISessionOutputContent[] | undefined}
   */
  public get content(): ISessionOutputContent[] | undefined {
    return this.#output.content;
  }

  /**
  * Setter content
  * @param {ISessionOutputContent[] | undefined} value
  */
  public set content(value: ISessionOutputContent[] | undefined) {
    this.#output.content = value;
  }

  /**
   * Getter delay
   * @return {number | undefined}
   */
  public get delay(): number | undefined {
    return this.#output.delay;
  }

  /**
   * Getter id
   * @return {string}
   */
  public get id(): string {
    return this.#output.id;
  }

  /**
   * Getter material
   * @return {string | undefined}
   */
  public get material(): string | undefined {
    return this.#output.material;
  }

  /**
   * Getter name
   * @return {string | undefined}
   */
  public get name(): string | undefined {
    return this.#output.name;
  }

  /**
   * Getter version
   * @return {string}
   */
  public get version(): string {
    return this.#output.version;
  }

  /**
  * Setter version
  * @param {string} value
  */
  public set version(value: string) {
    this.#output.version = value;
  }

    // #endregion Public Accessors (16)
}