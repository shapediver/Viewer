import { ISessionParameter } from "@shapediver/viewer.shared.types";
import { IParameter, PARAMETERTYPE, PARAMETERVISUALIZATION } from "../interfaces/IParameter";
import { Session } from "./Session";

export class AbstractParameter<T> implements IParameter<T> {
    // #region Properties (11)

    private readonly _choices?: string[];
    private readonly _decimalplaces?: string;
    private readonly _defval: string;
    private readonly _format?: string[];
    private readonly _max?: string;
    private readonly _min?: string;
    private readonly _name?: string;
    private readonly _note?: string;
    private readonly _type: PARAMETERTYPE;
    private readonly _visualization?: PARAMETERVISUALIZATION;

    protected _value!: T;

    // #endregion Properties (11)

    // #region Constructors (1)

    constructor(
        protected readonly _mySession: Session,
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
        this._type = <PARAMETERTYPE>this._parameterDefinition.type;
        this._visualization = <PARAMETERVISUALIZATION | undefined> this._parameterDefinition.visualization;
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
     * @return {PARAMETERTYPE}
     */
    public get type(): PARAMETERTYPE {
		return this._type;
    }

    /**
     * Getter value
     * @return {T}
     */
    public get value(): T {
		return this._value;
	}

    /**
     * Setter value
     * @param {T} value
     */
    public set value(value: T) {
        this._value = value;
	  }

    /**
     * Getter visualization
     * @return {PARAMETERVISUALIZATION | undefined}
     */
    public get visualization(): PARAMETERVISUALIZATION | undefined {
		return this._visualization;
    }

    // #endregion Public Accessors (13)
}