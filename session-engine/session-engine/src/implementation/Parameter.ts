import { ISessionParameter } from "@shapediver/viewer.shared.types";
import { IParameter } from "../interfaces/IParameter";

export class Parameter implements IParameter {
    // #region Properties (11)

    private readonly _choices?: string[];
    private readonly _decimalplaces?: string;
    private readonly _defval: string;
    private readonly _format?: string[];
    private readonly _max?: string;
    private readonly _min?: string;
    private readonly _name?: string;
    private readonly _note?: string;
    private readonly _type: string;
    private readonly _visualization?: string;

    private _value: string;

    // #endregion Properties (11)

    // #region Constructors (1)

    constructor(
        private readonly _id: string, 
        private readonly _parameterDefinition: ISessionParameter
        )
    {
        this._choices = this._parameterDefinition.choices;
        this._decimalplaces = this._parameterDefinition.decimalplaces;
        this._defval = this._parameterDefinition.defval;
        this._format = this._parameterDefinition.format;
        this._max = this._parameterDefinition.max;
        this._min = this._parameterDefinition.min;
        this._name = this._parameterDefinition.name;
        this._note = this._parameterDefinition.note;
        this._type = this._parameterDefinition.type;
        this._visualization = this._parameterDefinition.visualization;
        this._value = this._parameterDefinition.value;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (13)

    /**
     * Getter choices
     * @return {string[] | undefined}
     */
    public get choices(): string[] | undefined {
		return this._choices;
    }

    /**
     * Getter decimalplaces
     * @return {string | undefined}
     */
    public get decimalplaces(): string | undefined {
		return this._decimalplaces;
    }

    /**
     * Getter defval
     * @return {string}
     */
    public get defval(): string {
		return this._defval;
    }

    /**
     * Getter format
     * @return {string[] | undefined}
     */
    public get format(): string[] | undefined {
		return this._format;
    }

    /**
     * Getter id
     * @return {string}
     */
    public get id(): string {
		return this._id;
    }

    /**
     * Getter max
     * @return {string | undefined}
     */
    public get max(): string | undefined {
		return this._max;
    }

    /**
     * Getter min
     * @return {string | undefined}
     */
    public get min(): string | undefined {
		return this._min;
    }

    /**
     * Getter name
     * @return {string | undefined}
     */
    public get name(): string | undefined {
		return this._name;
    }

    /**
     * Getter note
     * @return {string | undefined}
     */
    public get note(): string | undefined {
		return this._note;
    }

    /**
     * Getter type
     * @return {string}
     */
    public get type(): string {
		return this._type;
    }

    /**
     * Getter value
     * @return {string}
     */
    public get value(): string {
		return this._value;
	}

    /**
     * Setter value
     * @param {string} value
     */
    public set value(value: string) {
        this._value = value;
	}

    /**
     * Getter visualization
     * @return {string | undefined}
     */
    public get visualization(): string | undefined {
		return this._visualization;
    }

    // #endregion Public Accessors (13)
}