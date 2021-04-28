import { IOutput, Output as OutputLogic } from "@shapediver/viewer.session-engine.session-engine";
import { container } from "tsyringe";
import { InputValidator } from "@shapediver/viewer.shared.utils";
import { Logger } from "@shapediver/viewer.shared.monitoring";
import { ShapeDiverResponseOutputPart } from "@shapediver/api.geometry-api-dto-v1";

export class Output implements IOutput {

  readonly #output: OutputLogic;
  readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
  readonly #logger: Logger = <Logger>container.resolve(Logger);

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
   * @return {ShapeDiverResponseOutputPart[] | undefined}
   */
  public get content(): ShapeDiverResponseOutputPart[] | undefined {
    return this.#output.content;
  }

  /**
  * Items of this asset - the geometries and materials to be added to the scene
  * @param {ShapeDiverResponseOutputPart[] | undefined} value
  */
  public set content(value: ShapeDiverResponseOutputPart[] | undefined) {
    // TODO input validation
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