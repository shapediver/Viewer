import { IOutput, Output as OutputLogic } from "@shapediver/viewer.session-engine.session-engine";
import { container } from "tsyringe";
import { InputValidator } from "@shapediver/viewer.shared.utils";
import { Logger } from "@shapediver/viewer.shared.monitoring";
import { ShapeDiverResponseOutputPart as OutputPart, ShapeDiverResponseOutputChunk as OutputChunk } from "@shapediver/api.geometry-api-dto-v1";

export class Output implements IOutput {

  readonly #output: OutputLogic;
  readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
  readonly #logger: Logger = <Logger>container.resolve(Logger);

  // #region Public Accessors (16)
  constructor(o: OutputLogic) {
    this.#output = o;
  }

  /**
   * The chunks of the output.
   * 
   * @return {OutputChunk[] | undefined}
   */
   public get chunks(): OutputChunk[] | undefined {
    return this.#output.chunks;
  }

  /**
   * The dependency of the output.
   * 
   * @return {string[]}
   */
   public get dependency(): string[] {
    return this.#output.dependency;
  }

  /**
   * The msg of the output.
   * 
   * @return {string | undefined}
   */
  public get msg(): string | undefined {
    return this.#output.msg;
  }

  /**
   * The uid of the output.
   * 
   * @return {string | undefined}
   */
  public get uid(): string | undefined {
    return this.#output.uid;
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
   * @return {OutputPart[] | undefined}
   */
  public get content(): OutputPart[] | undefined {
    return this.#output.content;
  }

  /**
  * Items of this asset - the geometries and materials to be added to the scene
  * @param {OutputPart[] | undefined} value
  */
  public set content(value: OutputPart[] | undefined) {
    // https://shapediver.atlassian.net/browse/SS-2942
    this.#output.content = value;
    this.#logger.info(`Output (${this.id}): content was set to: ${value}`);
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
    this.#inputValidator.validate(value, 'string');
    this.#output.version = value;
    this.#logger.info(`Output (${this.id}): version was set to: ${value}`);
  }

  // #endregion Public Accessors (16)
}