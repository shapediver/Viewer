import { IExport, Export as ExportLogic } from "@shapediver/viewer.session-engine.session-engine";

export class Export implements IExport {

  readonly #export: ExportLogic;

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
  public async request(): Promise<any> {
    return this.#export.request();
  }
}