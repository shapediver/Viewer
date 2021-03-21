import { IOutput, Output as OutputLogic } from "@shapediver/viewer.session-engine.session-engine";
import { ISessionOutputContent } from "@shapediver/viewer.shared.types";

export class Output implements IOutput {

  readonly #output: OutputLogic;

  // #region Public Accessors (16)
  constructor(o: OutputLogic) {
    this.#output = o;
  }

  /**
   * Maximum coordinates of the axis-aligned bounding box of the geometry in this asset.
   * @return {number[] | undefined}
   */
  public get bbmax(): number[] | undefined {
    return this.#output.bbmax;
  }

  /**
   * Minimum coordinates of the axis-aligned bounding box of the geometry in this asset.
   * @return {number[] | undefined}
   */
  public get bbmin(): number[] | undefined {
    return this.#output.bbmin;
  }

  /**
   * Items of this asset - the geometries and materials to be added to the scene.
   * @return {ISessionOutputContent[] | undefined}
   */
  public get content(): ISessionOutputContent[] | undefined {
    return this.#output.content;
  }

  /**
  * Items of this asset - the geometries and materials to be added to the scene
  * @param {ISessionOutputContent[] | undefined} value
  */
  public set content(value: ISessionOutputContent[] | undefined) {
    this.#output.content = value;
  }

  /**
   * @ignore
   * @return {number | undefined}
   */
  public get delay(): number | undefined {
    return this.#output.delay;
  }

  /**
   * The id of the output.
   * @return {string}
   */
  public get id(): string {
    return this.#output.id;
  }

  /**
   * The id of the material for the output.
   * @return {string | undefined}
   */
  public get material(): string | undefined {
    return this.#output.material;
  }

  /**
   * The name of the output.
   * @return {string | undefined}
   */
  public get name(): string | undefined {
    return this.#output.name;
  }

  /**
   * The version of the output.
   * @return {string}
   */
  public get version(): string {
    return this.#output.version;
  }

  /**
  * The version of the output.
  * @param {string} value
  */
  public set version(value: string) {
    this.#output.version = value;
  }

  // #endregion Public Accessors (16)
}