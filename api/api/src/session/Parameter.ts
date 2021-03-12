import { IParameter, Parameter as ParameterLogic } from "@shapediver/viewer.session-engine.session-engine";

export class Parameter implements IParameter {

    readonly #parameter: ParameterLogic;

    constructor(p: ParameterLogic) {
        this.#parameter = p;
    }
    
    /**
     * Getter choices
     * @return {string[] | undefined}
     */
     public get choices(): string[] | undefined {
		return this.#parameter.choices;
    }

    /**
     * Getter decimalplaces
     * @return {string | undefined}
     */
    public get decimalplaces(): string | undefined {
		return this.#parameter.decimalplaces;
    }

    /**
     * Getter defval
     * @return {string}
     */
    public get defval(): string {
		return this.#parameter.defval;
    }

    /**
     * Getter format
     * @return {string[] | undefined}
     */
    public get format(): string[] | undefined {
		return this.#parameter.format;
    }

    /**
     * Getter id
     * @return {string}
     */
    public get id(): string {
		return this.#parameter.id;
    }

    /**
     * Getter max
     * @return {string | undefined}
     */
    public get max(): string | undefined {
		return this.#parameter.max;
    }

    /**
     * Getter min
     * @return {string | undefined}
     */
    public get min(): string | undefined {
		return this.#parameter.min;
    }

    /**
     * Getter name
     * @return {string | undefined}
     */
    public get name(): string | undefined {
		return this.#parameter.name;
    }

    /**
     * Getter note
     * @return {string | undefined}
     */
    public get note(): string | undefined {
		return this.#parameter.note;
    }

    /**
     * Getter type
     * @return {string}
     */
    public get type(): string {
		return this.#parameter.type;
    }

    /**
     * Getter value
     * @return {string}
     */
    public get value(): string {
		return this.#parameter.value;
	}

    /**
     * Setter value
     * @param {string} value
     */
    public set value(value: string) {
        this.#parameter.value = value;
	}

    /**
     * Getter visualization
     * @return {string | undefined}
     */
    public get visualization(): string | undefined {
		return this.#parameter.visualization;
    }
}
