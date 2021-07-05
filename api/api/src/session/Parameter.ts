import { ShapeDiverResponseParameterStructure, ShapeDiverResponseParameterGroup, ShapeDiverResponseParameter } from "@shapediver/api.geometry-api-dto-v1";
import { Session } from "@shapediver/viewer.session-engine.session-engine";
import { SDError } from "@shapediver/viewer.shared.utils";
import { Logger, LOGGINGTOPIC } from "@shapediver/viewer.shared.utils";
import { Converter, InputValidator } from "@shapediver/viewer.shared.utils";
import { container } from "tsyringe";

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

    readonly #converter: Converter = <Converter>container.resolve(Converter);
    readonly #defaultValue: T | string;
    readonly #inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    readonly #logger: Logger = <Logger>container.resolve(Logger);
    readonly #sessionEngine: Session;

    readonly choices?: string[];
    readonly decimalplaces?: number;
    readonly defval: string;
    readonly displayName?: string;
    readonly expression?: string;
    readonly format?: string[];
    readonly group?: ShapeDiverResponseParameterGroup;
    readonly hidden: boolean;
    readonly id: string;
    readonly lastValidatedValue: T | string;
    readonly max?: number;
    readonly min?: number;
    readonly name: string;
    readonly order?: number;
    readonly sessionValue: T | string;
    readonly structure?: ShapeDiverResponseParameterStructure;
    readonly tooltip?: string;
    readonly type: PARAMETERTYPE;
    readonly value: T | string;
    readonly visualization?: PARAMETERVISUALIZATION;

    // #endregion Properties (25)

    // #region Constructors (1)

    constructor(sessionEngine: Session, paramDef: ShapeDiverResponseParameter) {
        try {
            this.#sessionEngine = sessionEngine;

            this.id = paramDef.id;
            this.defval = paramDef.defval;
            this.name = paramDef.name;
            this.type = <PARAMETERTYPE>paramDef.type;
            if (paramDef.choices !== undefined) this.choices = paramDef.choices;
            if (paramDef.decimalplaces !== undefined) this.decimalplaces = +paramDef.decimalplaces;
            if (paramDef.expression !== undefined) this.expression = paramDef.expression;
            if (paramDef.format !== undefined) this.format = paramDef.format;
            if (paramDef.min !== undefined) this.min = +paramDef.min;
            if (paramDef.max !== undefined) this.max = +paramDef.max;
            if (paramDef.visualization !== undefined) this.visualization = <PARAMETERVISUALIZATION>paramDef.visualization;
            if (paramDef.structure !== undefined) this.structure = paramDef.structure;
            if (paramDef.group !== undefined) this.group = paramDef.group;
            if (paramDef.tooltip !== undefined) this.tooltip = paramDef.tooltip;

            this.displayName = undefined;
            this.order = undefined;
            this.hidden = false;

            if (this.type === PARAMETERTYPE.BOOL || this.type === PARAMETERTYPE.SBOOL) {
                this.#defaultValue = <T><unknown>(this.defval === 'true');
            } else if (this.type === PARAMETERTYPE.EVEN || this.type === PARAMETERTYPE.FLOAT || this.type === PARAMETERTYPE.INT || this.type === PARAMETERTYPE.ODD || this.type === PARAMETERTYPE.SINTEGER || this.type === PARAMETERTYPE.SNUMBER) {
                this.#defaultValue = <T><unknown>+this.defval;
            } else {
                this.#defaultValue = this.defval;
            }

            this.value = this.#defaultValue;
            this.sessionValue = this.value;
            this.lastValidatedValue = this.value;
            this.#logger.debugLow(LOGGINGTOPIC.PARAMETER, `Parameter(${this.id}).constructor: Initialized parameter ${JSON.stringify(paramDef)}.`);
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.PARAMETER, new SDError(e.message, e), `Parameter(${paramDef.id}).constructor: Something unexpected happened.`, true)
        }
    }

    // #endregion Constructors (1)

    // #region Public Methods (8)

    /**
     * Evaluates if a given value is valid for this parameter.
     * 
     * @param value 
     * @returns 
     */
    public isValid(value: any, throwError = false): boolean {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.PARAMETER, `Parameter(${this.id}).isValid: Checking value ${value}.`);
            try {
                switch (true) {
                    case this.type === PARAMETERTYPE.BOOL || this.type === PARAMETERTYPE.SBOOL:
                        if (typeof value === 'string') {
                            if (!(value === 'true' || value === 'false'))
                                this.#logger.error(LOGGINGTOPIC.PARAMETER, new SDError(`Parameter(${this.id}).isValid: The value ${value} is a string that is neither true or false.`), '', true);
                        } else {
                            this.#inputValidator.validateAndError(LOGGINGTOPIC.PARAMETER, `Parameter(${this.id}).isValid`, value, 'boolean');
                        }
                        break;
                    case this.type === PARAMETERTYPE.COLOR || this.type === PARAMETERTYPE.SCOLOR:
                        this.#inputValidator.validateAndError(LOGGINGTOPIC.PARAMETER, `Parameter(${this.id}).isValid`, value, 'color');
                        break;
                    case this.type === PARAMETERTYPE.FILE:
                        this.#inputValidator.validateAndError(LOGGINGTOPIC.PARAMETER, `Parameter(${this.id}).isValid`, value, 'file');
                        break;
                    case this.type === PARAMETERTYPE.EVEN || this.type === PARAMETERTYPE.FLOAT || this.type === PARAMETERTYPE.INT || this.type === PARAMETERTYPE.ODD || this.type === PARAMETERTYPE.SINTEGER || this.type === PARAMETERTYPE.SNUMBER:
                        let temp: number = value;
                        if (typeof value === 'string')
                            temp = +value;
                        this.#inputValidator.validateAndError(LOGGINGTOPIC.PARAMETER, `Parameter(${this.id}).isValid`, temp, 'number');
                        if (this.type === PARAMETERTYPE.EVEN) {
                            if (temp % 2 !== 0) this.#logger.error(LOGGINGTOPIC.PARAMETER, new SDError(`Parameter(${this.id}).isValid: The value ${value} is not even.`), '', true);
                        } else if (this.type === PARAMETERTYPE.ODD) {
                            if (temp % 2 === 0) this.#logger.error(LOGGINGTOPIC.PARAMETER, new SDError(`Parameter(${this.id}).isValid: The value ${value} is not odd.`), '', true);
                        } else if (this.type === PARAMETERTYPE.INT || this.type === PARAMETERTYPE.SINTEGER) {
                            if (!Number.isInteger(temp)) this.#logger.error(LOGGINGTOPIC.PARAMETER, new SDError(`Parameter(${this.id}).isValid: The value ${value} is not an integer.`), '', true);
                        }
                        if (this.min || this.min === 0)
                            if (temp < this.min) this.#logger.error(LOGGINGTOPIC.PARAMETER, new SDError(`Parameter(${this.id}).isValid: The value ${value} is smaller than the minimum ${this.min}.`), '', true);

                        if (this.max || this.max === 0)
                            if (temp > this.max) this.#logger.error(LOGGINGTOPIC.PARAMETER, new SDError(`Parameter(${this.id}).isValid: The value ${value} is larger than the maximum ${this.max}.`), '', true);

                        if (this.decimalplaces || this.decimalplaces === 0) {
                            const numStr = temp + '';
                            let decimalplaces = 0;
                            if (numStr.includes('.'))
                                decimalplaces = numStr.split('.')[1].length;
                            if (this.decimalplaces < decimalplaces)
                                this.#logger.error(LOGGINGTOPIC.PARAMETER, new SDError(`Parameter(${this.id}).isValid: The value ${value} has not the correct number of decimalplaces (${this.decimalplaces}).`), '', true);
                        }

                        break;
                    case this.type === PARAMETERTYPE.STRINGLIST:
                        this.#inputValidator.validateAndError(LOGGINGTOPIC.PARAMETER, `Parameter(${this.id}).isValid`, value, 'string');
                        const choicesChecker = (v: string) => {
                            // has to be a single value that is
                            // 1. convertible to number
                            // 2. between 0 and choices.length -1
                            const temp = +v;
                            this.#inputValidator.validateAndError(LOGGINGTOPIC.PARAMETER, `Parameter(${this.id}).isValid`, temp, 'number');
                            if (temp < 0 || temp > this.choices!.length - 1)
                                this.#logger.error(LOGGINGTOPIC.PARAMETER, new SDError(`Parameter(${this.id}).isValid: The value ${v} is not within the range of the defined number choices.`), '', true);
                        }

                        if (this.visualization === PARAMETERVISUALIZATION.CHECKLIST) {
                            // comma separated numbers
                            if (value.includes(',')) {
                                const values: string[] = value.split(',');
                                for (let i = 0; i < values.length; i++) {
                                    if (values.filter(item => item === values[i]).length !== 1)
                                        this.#logger.error(LOGGINGTOPIC.PARAMETER, new SDError(`Parameter(${this.id}).isValid: The value ${values[i]} exists multiple times, but should only exist once.`), '', true);
                                    choicesChecker(values[i]);
                                }
                            } else {
                                // to number
                                let temp: number = value;
                                if (typeof value === 'string')
                                    temp = +value;
                                this.#inputValidator.validateAndError(LOGGINGTOPIC.PARAMETER, `Parameter(${this.id}).isValid`, temp, 'number');
                                choicesChecker(value);
                            }
                        } else {
                            // to number
                            let temp: number = value;
                            if (typeof value === 'string')
                                temp = +value;
                            this.#inputValidator.validateAndError(LOGGINGTOPIC.PARAMETER, `Parameter(${this.id}).isValid`, temp, 'number');
                            choicesChecker(value);
                        }
                        break;
                    default:
                        this.#inputValidator.validateAndError(LOGGINGTOPIC.PARAMETER, `Parameter(${this.id}).isValid`, value, 'string');
                        break;
                }
            } catch (e) {
                if (throwError) throw new SDError(e.message, e);
                return false;
            }
            return true;
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.PARAMETER, new SDError(e.message, e), `Parameter(${this.id}).isValid: Something unexpected happened.`, true)
        }
    }

    /**
     * Resets the value to the default value.
     */
    public resetToDefaultValue() {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.PARAMETER, `Parameter(${this.id}).resetToDefaultValue: Resetting value ${this.value} to default value ${this.#defaultValue}.`);
            (<any>this.value) = this.#defaultValue;
            this.#logger.info(LOGGINGTOPIC.PARAMETER, `Parameter(${this.id}).resetToDefaultValue: value was set to default value ${this.#defaultValue}.`);
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.PARAMETER, new SDError(e.message, e), `Parameter(${this.id}).resetToDefaultValue: Something unexpected happened.`, true)
        }
    }

    /**
     * Resets the value to the value currently used in the computed session.
     */
    public resetToSessionValue() {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.PARAMETER, `Parameter(${this.id}).resetToSessionValue: Resetting value ${this.value} to last session value ${this.sessionValue}.`);
            (<any>this.value) = this.sessionValue;
            this.#logger.info(LOGGINGTOPIC.PARAMETER, `Parameter(${this.id}).resetToSessionValue: value was set to last session value ${this.sessionValue}.`);
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.PARAMETER, new SDError(e.message, e), `Parameter(${this.id}).resetToSessionValue: Something unexpected happened.`, true)
        }
    }

    /**
     * Returns the current value as a string
     * @returns 
     */
    public stringify(): string {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.PARAMETER, `Parameter(${this.id}).stringify: Stringifying value.`);
            switch (true) {
                case this.type === PARAMETERTYPE.BOOL || this.type === PARAMETERTYPE.SBOOL:
                    return typeof this.value === 'string' ? this.value : (<boolean><unknown>this.value) + '';
                case this.type === PARAMETERTYPE.COLOR || this.type === PARAMETERTYPE.SCOLOR:
                    return this.#converter.toHex8Color(this.value);
                case this.type === PARAMETERTYPE.FILE:
                    if (typeof this.value !== 'string')
                        this.#logger.error(LOGGINGTOPIC.PARAMETER, new SDError(`Parameter(${this.id}).stringify: Error in stringify. Cannot stringify FileParameter that has not been uploaded yet.`), '', true);
                    return <string>this.value;
                case this.type === PARAMETERTYPE.EVEN || this.type === PARAMETERTYPE.FLOAT || this.type === PARAMETERTYPE.INT || this.type === PARAMETERTYPE.ODD || this.type === PARAMETERTYPE.SINTEGER || this.type === PARAMETERTYPE.SNUMBER:
                    return typeof this.value === 'string' ? this.value : (<number><unknown>this.value) + '';
                default:
                    return <string>this.value;
            }
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.PARAMETER, new SDError(e.message, e), `Parameter(${this.id}).stringify: Something unexpected happened.`, true)
        }
    }

    public updateDisplayName(value: string | undefined) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.PARAMETER, `Parameter(${this.id}).updateDisplayName: Updating DisplayName to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.PARAMETER, `Parameter(${this.id}).updateDisplayName`, value, 'string', false);
            (<any>this.displayName) = value;
            this.#logger.info(LOGGINGTOPIC.PARAMETER, `Parameter(${this.id}).updateDisplayName: DisplayName was updated to ${this.displayName}.`);
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.PARAMETER, new SDError(e.message, e), `Parameter(${this.id}).updateDisplayName: Something unexpected happened.`, true)
        }
    }

    public updateHidden(value: boolean) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.PARAMETER, `Parameter(${this.id}).updateHidden: Updating Hidden to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.PARAMETER, `Parameter(${this.id}).updateHidden`, value, 'boolean');
            (<any>this.hidden) = value;
            this.#logger.info(LOGGINGTOPIC.PARAMETER, `Parameter(${this.id}).updateHidden: Hidden was updated to ${this.hidden}.`);
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.PARAMETER, new SDError(e.message, e), `Parameter(${this.id}).updateHidden: Something unexpected happened.`, true)
        }
    }

    public updateOrder(value: number | undefined) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.PARAMETER, `Parameter(${this.id}).updateOrder: Updating Order to ${value}.`);
            this.#inputValidator.validateAndError(LOGGINGTOPIC.PARAMETER, `Parameter(${this.id}).updateOrder`, value, 'number', false);
            (<any>this.order) = value;
            this.#logger.info(LOGGINGTOPIC.PARAMETER, `Parameter(${this.id}).updateOrder: Order was updated to ${this.order}.`);
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.PARAMETER, new SDError(e.message, e), `Parameter(${this.id}).updateOrder: Something unexpected happened.`, true)
        }
    }

    public updateValue(value: T | string) {
        try {
            this.#logger.debugLow(LOGGINGTOPIC.PARAMETER, `Parameter(${this.id}).updateValue: Updating Value to ${value}.`);
            if (this.isValid(value, true)) {
                (<any>this.value) = value;
                (<any>this.lastValidatedValue) = this.value;
                this.#logger.info(LOGGINGTOPIC.PARAMETER, `Parameter(${this.id}).updateValue: Value was updated to ${this.value}.`);
            } else {
                this.#logger.error(LOGGINGTOPIC.PARAMETER, new SDError(`Parameter(${this.id}).updateValue: Could not validate value.`));
            }
        } catch (e) {
            if (e instanceof SDError) throw e;
            throw this.#logger.error(LOGGINGTOPIC.PARAMETER, new SDError(e.message, e), `Parameter(${this.id}).updateValue: Something unexpected happened.`, true)
        }
    }

    // #endregion Public Methods (8)
}