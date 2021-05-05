import { ShapeDiverResponseExport, ShapeDiverResponseExportDefinition, ShapeDiverResponseExportPart, ShapeDiverResponseExportResult as ExportResult } from "@shapediver/api.geometry-api-dto-v1";
import { IExport, Export as ExportLogic, EXPORTTYPE } from "@shapediver/viewer.session-engine.session-engine";
import { Logger } from "@shapediver/viewer.shared.monitoring";
import { InputValidator } from "@shapediver/viewer.shared.utils";
import { container } from "tsyringe";

export class Export implements IExport {
  // #region Properties (2)

  readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
  readonly #export: ExportLogic;
  readonly #logger: Logger = <Logger>container.resolve(Logger);

  // #endregion Properties (2)

  // #region Constructors (1)

  constructor(e: ExportLogic) {
    this.#export = e;
  }

  // #endregion Constructors (1)

  // #region Public Accessors (11)

  /**
   * The content of the export.
   * 
   * @return {ShapeDiverResponseExportPart[] | undefined}
   */
  public get content(): ShapeDiverResponseExportPart[] | undefined {
    return this.#export.content;
  }

  /**
   * The delay of the export.
   * 
   * @return {number | undefined}
   */
  public get delay(): number | undefined {
    return this.#export.delay;
  }

  /**
   * The dependency of the export.
   * 
   * @return {string[]}
   */
  public get dependency(): string[] {
    return this.#export.dependency;
  }

  /**
   * Getter displayName
   * @return {string | undefined}
   */
   public get displayName(): string | undefined {
		return this.#export.displayName;
	}

  /**
   * Setter displayName
   * @param {string | undefined} value
   */
  public set displayName(value: string | undefined) {
    this.#inputValidator.validate(value, 'string', false);
    this.#export.displayName = value;
    this.#logger.info(`Parameter (${this.id}) displayName was set to: ${value}`);
	}

  /**
   * The filename of the export.
   * 
   * @return {string | undefined}
   */
  public get filename(): string | undefined {
    return this.#export.filename;
  }

  /**
   * Getter hidden
   * @return {boolean}
   */
  public get hidden(): boolean {
		return this.#export.hidden;
	}

  /**
     * Setter hidden
     * @param {boolean} value
     */
  public set hidden(value: boolean) {
    this.#inputValidator.validate(value, 'boolean');
    this.#export.hidden = value;
    this.#logger.info(`Parameter (${this.id}) hidden was set to: ${value}`);
	}

  /**
   * The id of the export.
   * 
   * @return {string}
   */
  public get id(): string {
    return this.#export.id;
  }

  /**
   * The msg of the export.
   * 
   * @return {string | undefined}
   */
  public get msg(): string | undefined {
    return this.#export.msg;
  }

  /**
   * The name of the export.
   * 
   * @return {string | undefined}
   */
  public get name(): string | undefined {
    return this.#export.name;
  }

  /**
     * Getter order
     * @return {number | undefined}
     */
  public get order(): number | undefined {
		return this.#export.order;
	}

  /**
     * Setter order
     * @param {number | undefined} value
     */
  public set order(value: number | undefined) {
    this.#inputValidator.validate(value, 'number', false);
    this.#export.order = value;
    this.#logger.info(`Parameter (${this.id}) order was set to: ${value}`);
	}

  /**
   * The result of the export.
   * 
   * @return {ExportResult | undefined}
   */
  public get result(): ExportResult | undefined {
    return this.#export.result;
  }

  /**
   * The type of the export.
   * 
   * @return {EXPORTTYPE}
   */
  public get type(): EXPORTTYPE {
    return <EXPORTTYPE><unknown>this.#export.type;
  }

  /**
   * The uid of the export.
   * 
   * @return {string | undefined}
   */
  public get uid(): string | undefined {
    return this.#export.uid;
  }

  /**
   * The version of the export.
   * 
   * @return {string | undefined}
   */
  public get version(): string | undefined {
    return this.#export.version;
  }

  // #endregion Public Accessors (11)

  // #region Public Methods (1)

  /**
   * Request the export.
   * 
   * @returns 
   */
  public async request(parameters?: { [key: string]: string }): Promise<ShapeDiverResponseExport | ShapeDiverResponseExportDefinition | null> {
    this.#logger.info(`Export (${this.id}) requested.`);
    return await this.#export.request(parameters);
  }

  // #endregion Public Methods (1)
}