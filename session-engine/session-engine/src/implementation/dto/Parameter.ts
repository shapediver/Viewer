import {
	ShapeDiverResponseParameter,
	ShapeDiverResponseParameterGroup,
	ShapeDiverResponseParameterStructure,
} from "@shapediver/sdk.geometry-api-sdk-v2";
import {
	Converter,
	EventEngine,
	EVENTTYPE_PARAMETER,
	InputValidator,
	isValid,
	Logger,
	stringify,
} from "@shapediver/viewer.shared.services";
import {
	ISessionEvent,
	PARAMETER_TYPE,
	PARAMETER_VISUALIZATION,
} from "@shapediver/viewer.shared.types";
import * as MimeTypeUtils from "@shapediver/viewer.utils.mime-type";
import {IParameter} from "../../interfaces/dto/IParameter";
import {SessionEngine} from "../SessionEngine";

export class Parameter<T> implements IParameter<T> {
	// #region Properties (28)

	readonly #choices?: string[];
	readonly #converter: Converter = Converter.instance;
	readonly #decimalplaces?: number;
	readonly #defaultValue: T | string;
	readonly #defval: string;
	readonly #eventEngine = EventEngine.instance;
	readonly #expression?: string;
	readonly #format?: string[];
	readonly #group?: ShapeDiverResponseParameterGroup;
	readonly #id: string;
	readonly #inputValidator: InputValidator = InputValidator.instance;
	readonly #logger: Logger = Logger.instance;
	readonly #max?: number;
	readonly #min?: number;
	readonly #name: string;
	readonly #paramDef: ShapeDiverResponseParameter;
	readonly #sessionEngine: SessionEngine;
	readonly #settings?: Record<string, unknown>;
	readonly #structure?: ShapeDiverResponseParameterStructure;
	readonly #type: PARAMETER_TYPE;
	readonly #visualization?: PARAMETER_VISUALIZATION;

	#displayname?: string;
	#hidden: boolean = false;
	#lastValidatedValue: T | string;
	#order?: number;
	#sessionValue: T | string;
	#tooltip?: string;
	#value: T | string;

	// #endregion Properties (28)

	// #region Constructors (1)

	constructor(
		paramDef: ShapeDiverResponseParameter,
		sessionEngine: SessionEngine,
	) {
		this.#sessionEngine = sessionEngine;
		this.#paramDef = paramDef;

		this.#id = paramDef.id;
		this.#defval = paramDef.defval;
		this.#name = paramDef.name;
		this.#type = <PARAMETER_TYPE>paramDef.type;
		if (paramDef.choices !== undefined) this.#choices = paramDef.choices;
		if (paramDef.decimalplaces !== undefined)
			this.#decimalplaces = +paramDef.decimalplaces;
		if (paramDef.expression !== undefined)
			this.#expression = paramDef.expression;

		if (paramDef.format !== undefined)
			this.#format = MimeTypeUtils.extendMimeTypes(paramDef.format);

		if (paramDef.min !== undefined) this.#min = +paramDef.min;
		if (paramDef.max !== undefined) this.#max = +paramDef.max;
		if (paramDef.visualization !== undefined)
			this.#visualization = <PARAMETER_VISUALIZATION>(
				paramDef.visualization
			);
		if (paramDef.structure !== undefined)
			this.#structure = paramDef.structure;
		if (paramDef.group !== undefined) this.#group = paramDef.group;
		if (paramDef.settings !== undefined) this.#settings = paramDef.settings;
		if (paramDef.tooltip !== undefined) this.#tooltip = paramDef.tooltip;

		if (paramDef.displayname !== undefined)
			this.#displayname = paramDef.displayname;
		if (paramDef.order !== undefined) this.#order = paramDef.order;
		if (paramDef.hidden !== undefined) this.#hidden = paramDef.hidden;

		if (this.#type === PARAMETER_TYPE.BOOL) {
			this.#defaultValue = <T>(<unknown>(this.#defval === "true"));
		} else if (
			this.#type === PARAMETER_TYPE.EVEN ||
			this.#type === PARAMETER_TYPE.FLOAT ||
			this.#type === PARAMETER_TYPE.INT ||
			this.#type === PARAMETER_TYPE.ODD
		) {
			this.#defaultValue = <T>(<unknown>+this.#defval);
		} else {
			this.#defaultValue = this.#defval;
		}

		if (this.#type === PARAMETER_TYPE.COLOR) {
			(
				this as unknown as {convertColor: (color: unknown) => string}
			).convertColor = (color: unknown): string => {
				return this.#converter.toHexColor(color);
			};
		}

		this.#value = this.#defaultValue;
		this.#sessionValue = this.#value;
		this.#lastValidatedValue = this.#value;
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (27)

	public get choices(): string[] | undefined {
		return this.#choices;
	}

	public get decimalplaces(): number | undefined {
		return this.#decimalplaces;
	}

	public get defval(): string {
		return this.#defval;
	}

	public get displayname(): string | undefined {
		return this.#displayname;
	}

	public set displayname(value: string | undefined) {
		this.#displayname = value;
	}

	public get expression(): string | undefined {
		return this.#expression;
	}

	public get format(): string[] | undefined {
		return this.#format;
	}

	public get group(): ShapeDiverResponseParameterGroup | undefined {
		return this.#group;
	}

	public get hidden(): boolean {
		return this.#hidden;
	}

	public set hidden(value: boolean) {
		this.#hidden = value;
	}

	public get id(): string {
		return this.#id;
	}

	public get lastValidatedValue(): T | string {
		return this.#lastValidatedValue;
	}

	public get max(): number | undefined {
		return this.#max;
	}

	public get min(): number | undefined {
		return this.#min;
	}

	public get name(): string {
		return this.#name;
	}

	public get order(): number | undefined {
		return this.#order;
	}

	public set order(value: number | undefined) {
		this.#order = value;
	}

	public get sessionValue(): T | string {
		return this.#sessionValue;
	}

	public set sessionValue(value: T | string) {
		this.#sessionValue = value;

		// emit event
		this.#eventEngine.emitEvent(
			EVENTTYPE_PARAMETER.PARAMETER_SESSION_VALUE_CHANGED,
			<ISessionEvent>{
				sessionId: this.#sessionEngine.id,
				parameterId: this.#id,
				value: value,
			},
		);
	}

	public get settings(): Record<string, unknown> | undefined {
		return this.#settings;
	}

	public get structure(): ShapeDiverResponseParameterStructure | undefined {
		return this.#structure;
	}

	public get tooltip(): string | undefined {
		return this.#tooltip;
	}

	public set tooltip(value: string | undefined) {
		this.#tooltip = value;
	}

	public get type(): PARAMETER_TYPE {
		return this.#type;
	}

	public get value(): T | string {
		return this.#value;
	}

	public set value(value: T | string) {
		this.#value = value;

		// emit event
		this.#eventEngine.emitEvent(
			EVENTTYPE_PARAMETER.PARAMETER_VALUE_CHANGED,
			<ISessionEvent>{
				sessionId: this.#sessionEngine.id,
				parameterId: this.#id,
				value: value,
			},
		);

		// if customizeOnParameterChange is true, customize the session
		if (this.#sessionEngine.customizeOnParameterChange)
			this.#sessionEngine.customize();
	}

	public get visualization(): PARAMETER_VISUALIZATION | undefined {
		return this.#visualization;
	}

	// #endregion Public Getters And Setters (27)

	// #region Public Methods (4)

	public isValid(value: unknown, throwError?: boolean): boolean {
		return isValid(this.#paramDef, value, throwError);
	}

	public resetToDefaultValue() {
		this.#value = this.#defaultValue;
	}

	public resetToSessionValue() {
		this.#value = this.sessionValue;
	}

	public stringify(val?: unknown): string {
		const value = val !== undefined ? val : this.value;
		return stringify(this.#paramDef, value);
	}

	// #endregion Public Methods (4)
}
