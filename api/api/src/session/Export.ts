import { ShapeDiverResponseExportPart } from "@shapediver/api.geometry-api-dto-v1";
import { IExport, Export as ExportLogic } from "@shapediver/viewer.session-engine.session-engine";
import { Logger } from "@shapediver/viewer.shared.monitoring";
import { container } from "tsyringe";

export class Export implements IExport {

  readonly #export: ExportLogic;
  readonly #logger: Logger = <Logger>container.resolve(Logger);

  constructor(e: ExportLogic) {
    this.#export = e;
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
   * The name of the export.
   * 
   * @return {string | undefined}
   */
  public get name(): string | undefined {
    return this.#export.name;
  }

  /**
   * The type of the export.
   * 
   * @return {string | undefined}
   */
  public get type(): string | undefined {
    return this.#export.type;
  }

  /**
   * Request the export.
   * 
   * @returns 
   */
  public async request(parameters?: { [key: string]: string }): Promise<ShapeDiverResponseExportPart | null> {
    this.#logger.info(`Export (${this.id}) requested.`);
    return await this.#export.request(parameters);
  }
}