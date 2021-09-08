import {
    ShapeDiverResponseParameter,
    ShapeDiverResponseParameterGroup,
    ShapeDiverResponseParameterStructure,
} from '@shapediver/api.geometry-api-dto-v1'
import { Session } from '@shapediver/viewer.session-engine.session-engine'
import { SDError, Logger, LOGGINGTOPIC, Converter, InputValidator } from '@shapediver/viewer.shared.services'
import { container } from 'tsyringe'

export enum PARAMETERTYPE {
    FLOAT = 'Float',
    INT = 'Int',
    EVEN = 'Even',
    ODD = 'Odd',
    STRING = 'String',
    COLOR = 'Color',
    STRINGLIST = 'StringList',
    BOOL = 'Bool',
    TIME = 'Time',
    FILE = 'File',
    SNUMBER = 'sNumber',
    SINTEGER = 'sInteger',
    SSTRING = 'sString',
    SCOLOR = 'sColor',
    SBOOL = 'sBool',
    STIME = 'sTime',
    SBITMAP = 'sBitmap',
    SDOMAIN = 'sDomain',
    SDOMAIN2D = 'sDomain2D',
    SPOINT = 'sPoint',
    SLINE = 'sLine',
    SVECTOR = 'sVector',
    SBOX = 'sBox',
    SPLANE = 'sPlane',
    SRECTANGLE = 'sRectangle',
    SCURVE = 'sCurve',
    SCIRCLE = 'sCircle',
    SMESH = 'sMesh',
    SSURFACE = 'sSurface',
    SBREP = 'sBrep',
    SSUBDIV = 'sSubdiv'
}

export enum PARAMETERVISUALIZATION {
    SLIDER = 'slider',
    SEQUENCE = 'sequence',
    CYCLE = 'cycle',
    DROPDOWN = 'dropdown',
    CHECKLIST = 'checklist',
    CLOCK = 'color',
    CALENDAR = 'calendar',
    TOGGLE = 'toggle',
    SWATCH = 'swatch',
    BUTTON = 'button',
    DIAL = 'dial',
    TEXT = 'text'
}

export class Parameter<T> implements ShapeDiverResponseParameter {
    // #region Properties (25)

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
    readonly #sessionEngine: Session;
    readonly #structure?: ShapeDiverResponseParameterStructure;
    readonly #tooltip?: string;
    readonly #type: PARAMETERTYPE;
    readonly #visualization?: PARAMETERVISUALIZATION;

    #displayName?: string;
    #hidden: boolean = false;
    #lastValidatedValue: T | string;
    #order?: number;
    #sessionValue: T | string;
    #value: T | string;

    // #endregion Properties (25)

    // #region Constructors (1)

    constructor(sessionEngine: Session, paramDef: ShapeDiverResponseParameter) {
        try {
            this.#sessionEngine = sessionEngine;

            this.#id = paramDef.id;
            this.#defval = paramDef.defval;
            this.#name = paramDef.name;
            this.#type = <PARAMETERTYPE>paramDef.type;
            if (paramDef.choices !== undefined) this.#choices = paramDef.choices;
            if (paramDef.decimalplaces !== undefined) this.#decimalplaces = +paramDef.decimalplaces;
            if (paramDef.expression !== undefined) this.#expression = paramDef.expression;
            if (paramDef.format !== undefined) this.#format = paramDef.format;
            if (paramDef.min !== undefined) this.#min = +paramDef.min;
            if (paramDef.max !== undefined) this.#max = +paramDef.max;
            if (paramDef.visualization !== undefined) this.#visualization = <PARAMETERVISUALIZATION>paramDef.visualization;
            if (paramDef.structure !== undefined) this.#structure = paramDef.structure;
            if (paramDef.group !== undefined) this.#group = paramDef.group;
            if (paramDef.tooltip !== undefined) this.#tooltip = paramDef.tooltip;

            if (paramDef.displayname !== undefined) this.#displayName = paramDef.displayname;
            if (paramDef.order !== undefined) this.#order = paramDef.order;
            if (paramDef.hidden !== undefined) this.#hidden = paramDef.hidden;

            if (this.#type === PARAMETERTYPE.BOOL || this.#type === PARAMETERTYPE.SBOOL) {
                this.#defaultValue = <T><unknown>(this.#defval === 'true');
            } else if (this.#type === PARAMETERTYPE.EVEN || this.#type === PARAMETERTYPE.FLOAT || this.#type === PARAMETERTYPE.INT || this.#type === PARAMETERTYPE.ODD || this.#type === PARAMETERTYPE.SINTEGER || this.#type === PARAMETERTYPE.SNUMBER) {
                this.#defaultValue = <T><unknown>+this.#defval;
            } else {
                this.#defaultValue = this.#defval;
            }

            if (this.#type === PARAMETERTYPE.COLOR) {
                (<any>this).convertColor = (color: any): string => {
                    return this.#converter.toColor(color);
                }
            }

            this.#value = this.#defaultValue;
            this.#sessionValue = this.#value;
            this.#lastValidatedValue = this.#value;
            this.#logger.debugLow(LOGGINGTOPIC.PARAMETER, `Parameter(${this.#id}).constructor: Initialized parameter ${JSON.stringify(paramDef)}.`);
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.PARAMETER, e, `Parameter(${paramDef.id}).constructor: Something unexpected happened.`, true)
        }
    }

    // #endregion Constructors (1)

    // #region Public Accessors (23)

    /**
     * Getter choices
     */
    public get choices(): string[] | undefined {
        return this.#choices;
    }

    /**
     * Getter decimalplaces
     */
    public get decimalplaces(): number | undefined {
        return this.#decimalplaces;
    }

    /**
     * Getter defval
     */
    public get defval(): string {
        return this.#defval;
    }

    /**
     * Getter displayName
     */
    public get displayName(): string | undefined {
        return this.#displayName;
    }

    /**
     * Setter displayName
     */
    public set displayName(value: string | undefined) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.PARAMETER, `Parameter(${this.#id}).displayName: Updating DisplayName to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.PARAMETER, `Parameter(${this.#id}).displayName`, value, 'string', false);
            this.#displayName = value;
            this.#logger.info(LOGGINGTOPIC.PARAMETER, `Parameter(${this.#id}).displayName: DisplayName was updated to ${this.displayName}.`);
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.PARAMETER, e, `Parameter(${this.#id}).displayName: Something unexpected happened.`, true)
        }
    }

    /**
     * Getter expression
     */
    public get expression(): string | undefined {
        return this.#expression;
    }

    /**
     * Getter format
     */
    public get format(): string[] | undefined {
        return this.#format;
    }

    /**
     * Getter group
     */
    public get group(): ShapeDiverResponseParameterGroup | undefined {
        return this.#group;
    }

    /**
     * Getter hidden
     */
    public get hidden(): boolean {
        return this.#hidden;
    }

    /**
     * Setter hidden
     */
    public set hidden(value: boolean) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.PARAMETER, `Parameter(${this.#id}).hidden: Updating Hidden to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.PARAMETER, `Parameter(${this.#id}).hidden`, value, 'boolean');
            this.#hidden = value;
            this.#logger.info(LOGGINGTOPIC.PARAMETER, `Parameter(${this.#id}).hidden: Hidden was updated to ${this.hidden}.`);
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.PARAMETER, e, `Parameter(${this.#id}).hidden: Something unexpected happened.`, true)
        }
    }

    /**
     * Getter id
     */
    public get id(): string {
        return this.#id;
    }

    /**
     * Getter lastValidatedValue
     */
    public get lastValidatedValue(): T | string {
        return this.#lastValidatedValue;
    }

    /**
     * Getter max
     */
    public get max(): number | undefined {
        return this.#max;
    }

    /**
     * Getter min
     */
    public get min(): number | undefined {
        return this.#min;
    }

    /**
     * Getter name
     */
    public get name(): string {
        return this.#name;
    }

    /**
     * Getter order
     */
    public get order(): number | undefined {
        return this.#order;
    }

    /**
     * Setter order
     */
    public set order(value: number | undefined) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.PARAMETER, `Parameter(${this.#id}).order: Updating Order to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.PARAMETER, `Parameter(${this.#id}).order`, value, 'number', false);
            this.#order = value;
            this.#logger.info(LOGGINGTOPIC.PARAMETER, `Parameter(${this.#id}).order: Order was updated to ${this.order}.`);
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.PARAMETER, e, `Parameter(${this.#id}).order: Something unexpected happened.`, true)
        }
    }

    /**
     * Getter sessionValue
     */
    public get sessionValue(): T | string {
        return this.#sessionValue;
    }

    /**
     * Setter sessionValue
     */ 
    public set sessionValue(value: T | string) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.PARAMETER, `Parameter(${this.#id}).sessionValue: Updating SessionValue to ${value}.`);
            if (this.isValid(value, true)) {
                this.#sessionValue = value;
                this.#logger.info(LOGGINGTOPIC.PARAMETER, `Parameter(${this.#id}).sessionValue: SessionValue was updated to ${this.value}.`);
            } else {
                const error = new SDError(`Parameter(${this.#id}).sessionValue: Could not validate value.`);
                this.#logger.warn(LOGGINGTOPIC.PARAMETER, error.message);
                throw error;
            }
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.PARAMETER, e, `Parameter(${this.#id}).sessionValue: Something unexpected happened.`, true)
        }
    }

    /**
     * Getter structure
     */
    public get structure(): ShapeDiverResponseParameterStructure | undefined {
        return this.#structure;
    }

    /**
     * Getter tooltip
     */
    public get tooltip(): string | undefined {
        return this.#tooltip;
    }

    /**
     * Getter type
     */
    public get type(): PARAMETERTYPE {
        return this.#type;
    }

    /**
     * Getter value
     */
    public get value(): T | string {
        return this.#value;
    }

    /**
     * Setter value
     */
    public set value(value: T | string) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.PARAMETER, `Parameter(${this.#id}).value: Updating Value to ${value}.`);
            if (this.isValid(value, true)) {
                this.#value = value;
                this.#lastValidatedValue = this.value;
                this.#logger.info(LOGGINGTOPIC.PARAMETER, `Parameter(${this.#id}).value: Value was updated to ${this.value}.`);
            } else {
                const error = new SDError(`Parameter(${this.#id}).value: Could not validate value.`);
                this.#logger.warn(LOGGINGTOPIC.PARAMETER, error.message);
                throw error;
            }
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.PARAMETER, e, `Parameter(${this.#id}).value: Something unexpected happened.`, true)
        }
    }

    /**
     * Getter visualization
     */
    public get visualization(): PARAMETERVISUALIZATION | undefined {
        return this.#visualization;
    }

    // #endregion Public Accessors (23)

    // #region Public Methods (4)

    /**
     * Evaluates if a given value is valid for this parameter.
     * 
     * @param value 
     * @returns 
     */
    public isValid(value: any, throwError = false): boolean {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.PARAMETER, `Parameter(${this.#id}).isValid: Checking value ${value}.`);
            try {
                switch (true) {
                    case this.type === PARAMETERTYPE.BOOL || this.type === PARAMETERTYPE.SBOOL:
                        if (typeof value === 'string') {
                            if (!(value === 'true' || value === 'false')) {
                                const error = new SDError(`Parameter(${this.#id}).isValid: The value ${value} is a string that is neither true or false.`);
                                this.#logger.warn(LOGGINGTOPIC.PARAMETER, error.message);
                                throw error;
                            }
                        } else {
                            this.#inputValidator.validateAndError(LOGGINGTOPIC.PARAMETER, `Parameter(${this.#id}).isValid`, value, 'boolean');
                        }
                        break;
                    case this.type === PARAMETERTYPE.COLOR || this.type === PARAMETERTYPE.SCOLOR:
                        this.#inputValidator.validateAndError(LOGGINGTOPIC.PARAMETER, `Parameter(${this.#id}).isValid`, value, 'color');
                        break;
                    case this.type === PARAMETERTYPE.FILE:
                        this.#inputValidator.validateAndError(LOGGINGTOPIC.PARAMETER, `Parameter(${this.#id}).isValid`, value, 'file');
                        break;
                    case this.type === PARAMETERTYPE.EVEN || this.type === PARAMETERTYPE.FLOAT || this.type === PARAMETERTYPE.INT || this.type === PARAMETERTYPE.ODD || this.type === PARAMETERTYPE.SINTEGER || this.type === PARAMETERTYPE.SNUMBER:
                        let temp: number = value;
                        if (typeof value === 'string')
                            temp = +value;
                        this.#inputValidator.validateAndError(LOGGINGTOPIC.PARAMETER, `Parameter(${this.#id}).isValid`, temp, 'number');
                        if (this.type === PARAMETERTYPE.EVEN) {
                            if (temp % 2 !== 0) {
                                const error = new SDError(`Parameter(${this.#id}).isValid: The value ${value} is not even.`);
                                this.#logger.warn(LOGGINGTOPIC.PARAMETER, error.message);
                                throw error;
                            }
                        } else if (this.type === PARAMETERTYPE.ODD) {
                            if (temp % 2 === 0) {
                                const error = new SDError(`Parameter(${this.#id}).isValid: The value ${value} is not odd.`);
                                this.#logger.warn(LOGGINGTOPIC.PARAMETER, error.message);
                                throw error;
                            }
                        } else if (this.type === PARAMETERTYPE.INT || this.type === PARAMETERTYPE.SINTEGER) {
                            if (!Number.isInteger(temp)) {
                                const error = new SDError(`Parameter(${this.#id}).isValid: The value ${value} is not an integer.`);
                                this.#logger.warn(LOGGINGTOPIC.PARAMETER, error.message);
                                throw error;
                            }
                        }
                        if (this.min || this.min === 0)
                            if (temp < this.min) {
                                const error = new SDError(`Parameter(${this.#id}).isValid: The value ${value} is smaller than the minimum ${this.min}.`);
                                this.#logger.warn(LOGGINGTOPIC.PARAMETER, error.message);
                                throw error;
                            }

                        if (this.max || this.max === 0)
                            if (temp > this.max) {
                                const error = new SDError(`Parameter(${this.#id}).isValid: The value ${value} is larger than the maximum ${this.max}.`);
                                this.#logger.warn(LOGGINGTOPIC.PARAMETER, error.message);
                                throw error;
                            }

                        if (this.decimalplaces || this.decimalplaces === 0) {
                            const numStr = temp + '';
                            let decimalplaces = 0;
                            if (numStr.includes('.'))
                                decimalplaces = numStr.split('.')[1].length;
                            if (this.decimalplaces < decimalplaces) {
                                const error = new SDError(`Parameter(${this.#id}).isValid: The value ${value} has not the correct number of decimalplaces (${this.decimalplaces}).`);
                                this.#logger.warn(LOGGINGTOPIC.PARAMETER, error.message);
                                throw error;
                            }
                        }

                        break;
                    case this.type === PARAMETERTYPE.STRINGLIST:
                        this.#inputValidator.validateAndError(LOGGINGTOPIC.PARAMETER, `Parameter(${this.#id}).isValid`, value, 'string');
                        const choicesChecker = (v: string) => {
                            // has to be a single value that is
                            // 1. convertible to number
                            // 2. between 0 and choices.length -1
                            const temp = +v;
                            this.#inputValidator.validateAndError(LOGGINGTOPIC.PARAMETER, `Parameter(${this.#id}).isValid`, temp, 'number');
                            if (temp < 0 || temp > this.choices!.length - 1) {
                                const error = new SDError(`Parameter(${this.#id}).isValid: The value ${v} is not within the range of the defined number choices.`);
                                this.#logger.warn(LOGGINGTOPIC.PARAMETER, error.message);
                                throw error;
                            }
                        }

                        if (this.visualization === PARAMETERVISUALIZATION.CHECKLIST) {
                            // comma separated numbers
                            if (value.includes(',')) {
                                const values: string[] = value.split(',');
                                for (let i = 0; i < values.length; i++) {
                                    if (values.filter(item => item === values[i]).length !== 1) {
                                        const error = new SDError(`Parameter(${this.#id}).isValid: The value ${values[i]} exists multiple times, but should only exist once.`);
                                        this.#logger.warn(LOGGINGTOPIC.PARAMETER, error.message);
                                        throw error;
                                    }
                                    choicesChecker(values[i]);
                                }
                            } else {
                                // to number
                                let temp: number = value;
                                if (typeof value === 'string')
                                    temp = +value;
                                this.#inputValidator.validateAndError(LOGGINGTOPIC.PARAMETER, `Parameter(${this.#id}).isValid`, temp, 'number');
                                choicesChecker(value);
                            }
                        } else {
                            // to number
                            let temp: number = value;
                            if (typeof value === 'string')
                                temp = +value;
                            this.#inputValidator.validateAndError(LOGGINGTOPIC.PARAMETER, `Parameter(${this.#id}).isValid`, temp, 'number');
                            choicesChecker(value);
                        }
                        break;
                    default:
                        this.#inputValidator.validateAndError(LOGGINGTOPIC.PARAMETER, `Parameter(${this.#id}).isValid`, value, 'string');
                        break;
                }
            } catch (e) {
                if (throwError) throw e;
                return false;
            }
            return true;
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.PARAMETER, e, `Parameter(${this.#id}).isValid: Something unexpected happened.`, true)
        }
    }

    /**
     * Resets the value to the default value.
     */
    public resetToDefaultValue() {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.PARAMETER, `Parameter(${this.#id}).resetToDefaultValue: Resetting value ${this.value} to default value ${this.#defaultValue}.`);
            this.#value = this.#defaultValue;
            this.#logger.info(LOGGINGTOPIC.PARAMETER, `Parameter(${this.#id}).resetToDefaultValue: value was set to default value ${this.#defaultValue}.`);
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.PARAMETER, e, `Parameter(${this.#id}).resetToDefaultValue: Something unexpected happened.`, true)
        }
    }

    /**
     * Resets the value to the value currently used in the computed session.
     */
    public resetToSessionValue() {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.PARAMETER, `Parameter(${this.#id}).resetToSessionValue: Resetting value ${this.value} to last session value ${this.sessionValue}.`);
            this.#value = this.sessionValue;
            this.#logger.info(LOGGINGTOPIC.PARAMETER, `Parameter(${this.#id}).resetToSessionValue: value was set to last session value ${this.sessionValue}.`);
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.PARAMETER, e, `Parameter(${this.#id}).resetToSessionValue: Something unexpected happened.`, true)
        }
    }

    /**
     * Returns the current value as a string
     * @returns 
     */
    public stringify(): string {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.PARAMETER, `Parameter(${this.#id}).stringify: Stringifying value.`);
            switch (true) {
                case this.type === PARAMETERTYPE.BOOL || this.type === PARAMETERTYPE.SBOOL:
                    return typeof this.value === 'string' ? this.value : (<boolean><unknown>this.value) + '';
                case this.type === PARAMETERTYPE.COLOR || this.type === PARAMETERTYPE.SCOLOR:
                    return this.#converter.toHex8Color(this.value);
                case this.type === PARAMETERTYPE.FILE:
                    if (typeof this.value !== 'string') {
                        const error = new SDError(`Parameter(${this.#id}).stringify: Error in stringify. Cannot stringify FileParameter that has not been uploaded yet.`);
                        this.#logger.warn(LOGGINGTOPIC.PARAMETER, error.message);
                        throw error;
                    }
                    return <string>this.value;
                case this.type === PARAMETERTYPE.EVEN || this.type === PARAMETERTYPE.FLOAT || this.type === PARAMETERTYPE.INT || this.type === PARAMETERTYPE.ODD || this.type === PARAMETERTYPE.SINTEGER || this.type === PARAMETERTYPE.SNUMBER:
                    return typeof this.value === 'string' ? this.value : (<number><unknown>this.value) + '';
                default:
                    return <string>this.value;
            }
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.PARAMETER, e, `Parameter(${this.#id}).stringify: Something unexpected happened.`, true)
        }
    }

    // #endregion Public Methods (4)
}