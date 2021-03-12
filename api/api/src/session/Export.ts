import { IExport, Export as ExportLogic } from "@shapediver/viewer.session-engine.session-engine";

export class Export implements IExport {

    readonly #export: ExportLogic;

    constructor(e: ExportLogic) {
        this.#export = e;
    }

    /**
     * Getter id
     * @return {string}
     */
     public get id(): string {
		return this.#export.id;
    }

    /**
     * Getter name
     * @return {string | undefined}
     */
    public get name(): string | undefined {
		return this.#export.name;
    }

    /**
     * Getter type
     * @return {string | undefined}
     */
    public get type(): string | undefined {
		return this.#export.type;
	}
}