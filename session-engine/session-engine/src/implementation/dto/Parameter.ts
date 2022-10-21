import { ShapeDiverResponseParameterStructure, ShapeDiverResponseParameterGroup, ShapeDiverResponseParameter } from "@shapediver/api.geometry-api-dto-v2";
import { Converter, InputValidator, Logger, LOGGING_TOPIC, ShapeDiverBackendError, ShapeDiverViewerError, ShapeDiverViewerSessionError } from "@shapediver/viewer.shared.services";
import { container } from "tsyringe";
import { IParameter } from "../../interfaces/dto/IParameter";
import { ISessionEngine, PARAMETER_TYPE, PARAMETER_VISUALIZATION } from "../../interfaces/ISessionEngine";
import * as MimeTypeUtils from "@shapediver/viewer.utils.mime-type"
import { SessionEngine } from "../SessionEngine";

export class Parameter<T> implements IParameter<T> {
    // #region Properties (24)

    readonly #choices?: string[];
    readonly #converter: Converter = <Converter>container.resolve(Converter);
    readonly #decimalplaces?: number;
    readonly #defaultValue: T | string;
    readonly #defval: string;
    readonly #expression?: string;
    readonly #format?: string[];
    readonly #group?: ShapeDiverResponseParameterGroup;
    readonly #id: string;
    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #max?: number;
    readonly #min?: number;
    readonly #name: string;
    readonly #sessionEngine: SessionEngine;
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

    // #endregion Properties (24)

    // #region Constructors (1)

    constructor(paramDef: ShapeDiverResponseParameter, sessionEngine: SessionEngine) {
        this.#sessionEngine = sessionEngine;

        this.#id = paramDef.id;
        this.#defval = paramDef.defval;
        this.#name = paramDef.name;
        this.#type = <PARAMETER_TYPE>paramDef.type;
        if (paramDef.choices !== undefined) this.#choices = paramDef.choices;
        if (paramDef.decimalplaces !== undefined) this.#decimalplaces = +paramDef.decimalplaces;
        if (paramDef.expression !== undefined) this.#expression = paramDef.expression;

        if (paramDef.format !== undefined)
            this.#format = MimeTypeUtils.extendMimeTypes(paramDef.format);

        if (paramDef.min !== undefined) this.#min = +paramDef.min;
        if (paramDef.max !== undefined) this.#max = +paramDef.max;
        if (paramDef.visualization !== undefined) this.#visualization = <PARAMETER_VISUALIZATION>paramDef.visualization;
        if (paramDef.structure !== undefined) this.#structure = paramDef.structure;
        if (paramDef.group !== undefined) this.#group = paramDef.group;
        if (paramDef.tooltip !== undefined) this.#tooltip = paramDef.tooltip;

        if (paramDef.displayname !== undefined) this.#displayname = paramDef.displayname;
        if (paramDef.order !== undefined) this.#order = paramDef.order;
        if (paramDef.hidden !== undefined) this.#hidden = paramDef.hidden;

        if (this.#type === PARAMETER_TYPE.BOOL) {
            this.#defaultValue = <T><unknown>(this.#defval === 'true');
        } else if (this.#type === PARAMETER_TYPE.EVEN || this.#type === PARAMETER_TYPE.FLOAT || this.#type === PARAMETER_TYPE.INT || this.#type === PARAMETER_TYPE.ODD) {
            this.#defaultValue = <T><unknown>+this.#defval;
        } else {
            this.#defaultValue = this.#defval;
        }

        if (this.#type === PARAMETER_TYPE.COLOR) {
            (<any>this).convertColor = (color: any): string => {
                return this.#converter.toColor(color);
            }
        }

        this.#value = this.#defaultValue;
        this.#sessionValue = this.#value;
        this.#lastValidatedValue = this.#value;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (26)

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
        if(this.#sessionEngine.customizeOnParameterChange) this.#sessionEngine.customize();
    }

    public get visualization(): PARAMETER_VISUALIZATION | undefined {
        return this.#visualization;
    }

    // #endregion Public Accessors (26)

    // #region Public Methods (4)

    public isValid(value: any): boolean {
        switch (true) {
            case this.type === PARAMETER_TYPE.BOOL:
                if (typeof value === 'string') {
                    if (!(value === 'true' || value === 'false')) {
                        const error = new ShapeDiverViewerSessionError(`Parameter(${this.#id}).isValid: The value ${value} is a string that is neither true or false.`);
                        throw this.#logger.handleError(LOGGING_TOPIC.PARAMETER, `Parameter(${this.id}).value`, error, false);
                    }
                } else {
                    this.#inputValidator.validateAndError(LOGGING_TOPIC.PARAMETER, `Parameter(${this.#id}).isValid`, value, 'boolean');
                }
                break;
            case this.type === PARAMETER_TYPE.COLOR:
                this.#inputValidator.validateAndError(LOGGING_TOPIC.PARAMETER, `Parameter(${this.#id}).isValid`, value, 'color');
                break;
            case this.type === PARAMETER_TYPE.FILE:
                this.#inputValidator.validateAndError(LOGGING_TOPIC.PARAMETER, `Parameter(${this.#id}).isValid`, value, 'file');
                break;
            case this.type === PARAMETER_TYPE.EVEN || this.type === PARAMETER_TYPE.FLOAT || this.type === PARAMETER_TYPE.INT || this.type === PARAMETER_TYPE.ODD:
                let temp: number = value;
                if (typeof value === 'string')
                    temp = +value;
                this.#inputValidator.validateAndError(LOGGING_TOPIC.PARAMETER, `Parameter(${this.#id}).isValid`, temp, 'number');
                if (this.type === PARAMETER_TYPE.EVEN) {
                    if (temp % 2 !== 0) {
                        const error = new ShapeDiverViewerSessionError(`Parameter(${this.#id}).isValid: The value ${value} is not even.`);
                        throw this.#logger.handleError(LOGGING_TOPIC.PARAMETER, `Parameter(${this.id}).value`, error, false);
                    }
                } else if (this.type === PARAMETER_TYPE.ODD) {
                    if (temp % 2 === 0) {
                        const error = new ShapeDiverViewerSessionError(`Parameter(${this.#id}).isValid: The value ${value} is not odd.`);
                        throw this.#logger.handleError(LOGGING_TOPIC.PARAMETER, `Parameter(${this.id}).value`, error, false);
                    }
                } else if (this.type === PARAMETER_TYPE.INT) {
                    if (!Number.isInteger(temp)) {
                        const error = new ShapeDiverViewerSessionError(`Parameter(${this.#id}).isValid: The value ${value} is not an integer.`);
                        throw this.#logger.handleError(LOGGING_TOPIC.PARAMETER, `Parameter(${this.id}).value`, error, false);
                    }
                }
                if (this.min || this.min === 0)
                    if (temp < this.min) {
                        const error = new ShapeDiverViewerSessionError(`Parameter(${this.#id}).isValid: The value ${value} is smaller than the minimum ${this.min}.`);
                        throw this.#logger.handleError(LOGGING_TOPIC.PARAMETER, `Parameter(${this.id}).value`, error, false);
                    }

                if (this.max || this.max === 0)
                    if (temp > this.max) {
                        const error = new ShapeDiverViewerSessionError(`Parameter(${this.#id}).isValid: The value ${value} is larger than the maximum ${this.max}.`);
                        throw this.#logger.handleError(LOGGING_TOPIC.PARAMETER, `Parameter(${this.id}).value`, error, false);
                    }

                if (this.decimalplaces || this.decimalplaces === 0) {
                    const numStr = temp + '';
                    let decimalplaces = 0;
                    if (numStr.includes('.'))
                        decimalplaces = numStr.split('.')[1].length;
                    if (this.decimalplaces < decimalplaces) {
                        const error = new ShapeDiverViewerSessionError(`Parameter(${this.#id}).isValid: The value ${value} has not the correct number of decimalplaces (${this.decimalplaces}).`);
                        throw this.#logger.handleError(LOGGING_TOPIC.PARAMETER, `Parameter(${this.id}).value`, error, false);
                    }
                }

                break;
            case this.type === PARAMETER_TYPE.STRINGLIST:
                this.#inputValidator.validateAndError(LOGGING_TOPIC.PARAMETER, `Parameter(${this.#id}).isValid`, value, 'string');
                const choicesChecker = (v: string) => {
                    // has to be a single value that is
                    // 1. convertible to number
                    // 2. between 0 and choices.length -1
                    const temp = +v;
                    this.#inputValidator.validateAndError(LOGGING_TOPIC.PARAMETER, `Parameter(${this.#id}).isValid`, temp, 'number');
                    if (temp < 0 || temp > this.choices!.length - 1) {
                        const error = new ShapeDiverViewerSessionError(`Parameter(${this.#id}).isValid: The value ${v} is not within the range of the defined number choices.`);
                        throw this.#logger.handleError(LOGGING_TOPIC.PARAMETER, `Parameter(${this.id}).value`, error, false);
                    }
                }

                if (this.visualization === PARAMETER_VISUALIZATION.CHECKLIST) {
                    // comma separated numbers
                    if (value.includes(',')) {
                        const values: string[] = value.split(',');
                        for (let i = 0; i < values.length; i++) {
                            if (values.filter(item => item === values[i]).length !== 1) {
                                const error = new ShapeDiverViewerSessionError(`Parameter(${this.#id}).isValid: The value ${values[i]} exists multiple times, but should only exist once.`);
                                throw this.#logger.handleError(LOGGING_TOPIC.PARAMETER, `Parameter(${this.id}).value`, error, false);
                            }
                            choicesChecker(values[i]);
                        }
                    } else {
                        // to number
                        let temp: number = value;
                        if (typeof value === 'string')
                            temp = +value;
                        this.#inputValidator.validateAndError(LOGGING_TOPIC.PARAMETER, `Parameter(${this.#id}).isValid`, temp, 'number');
                        choicesChecker(value);
                    }
                } else {
                    // to number
                    let temp: number = value;
                    if (typeof value === 'string')
                        temp = +value;
                    this.#inputValidator.validateAndError(LOGGING_TOPIC.PARAMETER, `Parameter(${this.#id}).isValid`, temp, 'number');
                    choicesChecker(value);
                }
                break;
            default:
                this.#inputValidator.validateAndError(LOGGING_TOPIC.PARAMETER, `Parameter(${this.#id}).isValid`, value, 'string');
                break;
        }
        return true;
    }

    public resetToDefaultValue() {
        this.#value = this.#defaultValue;
    }

    public resetToSessionValue() {
        this.#value = this.sessionValue;
    }

    public stringify(): string {
        switch (true) {
            case this.type === PARAMETER_TYPE.BOOL:
                return typeof this.value === 'string' ? this.value : (<boolean><unknown>this.value) + '';
            case this.type === PARAMETER_TYPE.COLOR:
                return this.#converter.toHex8Color(this.value);
            case this.type === PARAMETER_TYPE.FILE:
                if (typeof this.value !== 'string') {
                    const error = new ShapeDiverViewerSessionError(`Parameter(${this.#id}).stringify: Error in stringify. Cannot stringify FileParameter that has not been uploaded yet.`);
                    throw this.#logger.handleError(LOGGING_TOPIC.PARAMETER, `Parameter(${this.id}).value`, error);
                }
                return <string>this.value;
            case this.type === PARAMETER_TYPE.EVEN || this.type === PARAMETER_TYPE.FLOAT || this.type === PARAMETER_TYPE.INT || this.type === PARAMETER_TYPE.ODD:
                if(typeof this.value === 'string') {
                    // cast to number and round to decimalplaces if they exist
                    if (this.decimalplaces || this.decimalplaces === 0) {
                        const number = +this.value;
                        return number.toFixed(this.#decimalplaces);
                    } else {
                        return this.value;
                    }
                } else {
                    // round to decimalplaces if they exist
                    if (this.decimalplaces || this.decimalplaces === 0) {
                        return (<number><unknown>this.value).toFixed(this.#decimalplaces);
                    } else {
                        return (<number><unknown>this.value) + '';
                    }
                }
            default:
                return <string>this.value;
        }
    }

    // #endregion Public Methods (4)
}