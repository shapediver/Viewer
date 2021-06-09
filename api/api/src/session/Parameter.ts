import { ShapeDiverResponseParameterStructure, ShapeDiverResponseParameterGroup, ShapeDiverResponseParameter } from "@shapediver/api.geometry-api-dto-v1";
import { Session } from "@shapediver/viewer.session-engine.session-engine";
import { Logger } from "@shapediver/viewer.shared.monitoring";
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
        this.#sessionEngine = sessionEngine;

        this.id = paramDef.id;
        this.defval = paramDef.defval;
        this.name = paramDef.name;
        this.type = <PARAMETERTYPE>paramDef.type;
        if(paramDef.choices) this.choices = paramDef.choices;
        if(paramDef.decimalplaces) this.decimalplaces = +paramDef.decimalplaces;
        if(paramDef.expression) this.expression = paramDef.expression;
        if(paramDef.format) this.format = paramDef.format;
        if(paramDef.min) this.min = +paramDef.min;
        if(paramDef.max) this.max = +paramDef.max;
        if(paramDef.visualization) this.visualization = <PARAMETERVISUALIZATION>paramDef.visualization;
        if(paramDef.structure) this.structure = paramDef.structure;
        if(paramDef.group) this.group = paramDef.group;
        if(paramDef.tooltip) this.tooltip = paramDef.tooltip;

        this.displayName = undefined;
        this.order = undefined;
        this.hidden = false;

        if(this.type === PARAMETERTYPE.BOOL || this.type === PARAMETERTYPE.SBOOL) {
            this.#defaultValue = <T><unknown>(this.defval === 'true');
        } else if(this.type === PARAMETERTYPE.EVEN || this.type === PARAMETERTYPE.FLOAT || this.type === PARAMETERTYPE.INT || this.type === PARAMETERTYPE.ODD || this.type === PARAMETERTYPE.SINTEGER || this.type === PARAMETERTYPE.SNUMBER) {
            this.#defaultValue = <T><unknown>+this.defval;
        } else {
            this.#defaultValue = this.defval;
        }
        
        this.value = this.#defaultValue;
        this.sessionValue = this.value;
        this.lastValidatedValue = this.value;
    }

    // #endregion Constructors (1)

    // #region Public Methods (8)

    /**
     * Evaluates if a given value is valid for this parameter.
     * 
     * @param value 
     * @returns 
     */
    public isValid(value: any): boolean {
        try {
            switch(true) {
                case this.type === PARAMETERTYPE.BOOL || this.type === PARAMETERTYPE.SBOOL:
                    if(typeof value === 'string') {
                        if(!(value === 'true' || value === 'false'))
                            throw new Error(`The value ${value} is a string that is neither true or false.`);
                    } else {
                        this.#inputValidator.validate(value, 'boolean');
                    }
                    break;
                case this.type === PARAMETERTYPE.COLOR || this.type === PARAMETERTYPE.SCOLOR:
                    this.#inputValidator.validate(value, 'color');
                    break;
                case this.type === PARAMETERTYPE.FILE:
                    this.#inputValidator.validate(value, 'file');
                    break;
                case this.type === PARAMETERTYPE.EVEN || this.type === PARAMETERTYPE.FLOAT || this.type === PARAMETERTYPE.INT || this.type === PARAMETERTYPE.ODD || this.type === PARAMETERTYPE.SINTEGER || this.type === PARAMETERTYPE.SNUMBER:
                    let temp: number = value;    
                    if(typeof value === 'string') 
                        temp = +value;
                    this.#inputValidator.validate(temp, 'number');
                    if(this.type === PARAMETERTYPE.EVEN) {
                        if(temp % 2 !== 0) throw new Error(`The value ${value} is not even.`);
                    } else if(this.type === PARAMETERTYPE.ODD) {
                        if(temp % 2 === 0) throw new Error(`The value ${value} is not odd.`);
                    } else if(this.type === PARAMETERTYPE.INT || this.type === PARAMETERTYPE.SINTEGER) {
                        if(!Number.isInteger(temp)) throw new Error(`The value ${value} is not an integer.`);
                    }
                    if(this.min || this.min === 0) 
                        if(temp < this.min) throw new Error(`The value ${value} is smaller than the minimum ${this.min}.`);
                    
                    if(this.max || this.max === 0) 
                        if(temp > this.max) throw new Error(`The value ${value} is larger than the maximum ${this.max}.`);
                    
                    if(this.decimalplaces || this.decimalplaces === 0) {
                        const numStr = temp+'';
                        let decimalplaces = 0;
                        if (numStr.includes('.')) 
                            decimalplaces = numStr.split('.')[1].length;
                        if(this.decimalplaces !== decimalplaces)
                            throw new Error(`The value ${value} has not the correct number of decimalplaces (${this.decimalplaces}).`);
                    }
                    
                    break;
                case this.type === PARAMETERTYPE.STRINGLIST:
                    this.#inputValidator.validate(value, 'string');
                    const choicesChecker = (v: string) => {
                        // has to be a single value that is
                        // 1. convertible to number
                        // 2. between 0 and choices.length -1
                        const temp = +v;
                        this.#inputValidator.validate(temp, 'number');
                        if(temp < 0 || temp > this.choices!.length-1)
                            throw new Error(`The value ${v} is not within the range of the defined number choices.`);
                    }

                    if(this.visualization === PARAMETERVISUALIZATION.CHECKLIST) {
                        // comma separated numbers
                        if(value.includes(',')) {
                            const values: string[] = value.split(',');
                            for(let i = 0; i < values.length; i++) {
                                if(values.filter(item => item === values[i]).length !== 1)
                                    throw new Error(`The value ${values[i]} exists multiple times, but should only exist once.`);
                                choicesChecker(values[i]);
                            }
                        } else {
                            choicesChecker(value);
                        }
                    } else {
                        choicesChecker(value);
                    }
                    break;
                default:
                    this.#inputValidator.validate(value, 'string');
                    break;
            }
        } catch (e) {
            this.#logger.info((<Error>e).message);
            return false;
        }
        return true;
    }

    /**
     * Resets the value to the default value.
     */
    public resetToDefaultValue() {
        (<any>this.value) = this.#defaultValue;
    }

    /**
     * Resets the value to the value currently used in the computed session.
     */
    public resetToSessionValue() {
        (<any>this.value) = this.sessionValue;
    }

    /**
     * Returns the current value as a string
     * @returns 
     */
    public stringify(): string {
        switch(true) {
            case this.type === PARAMETERTYPE.BOOL || this.type === PARAMETERTYPE.SBOOL:
                return typeof this.value === 'string' ? this.value : (<boolean><unknown>this.value)+'';
            case this.type === PARAMETERTYPE.COLOR || this.type === PARAMETERTYPE.SCOLOR:
                return typeof this.value === 'string' ? this.value : this.#converter.toColor(this.value);
            case this.type === PARAMETERTYPE.FILE:
                if(typeof this.value !== 'string') {
                    this.#logger.error(`Parameter (${this.id}): Error in stringify. Cannot stringify FileParameter that has not been uploaded yet.`);
                    throw new Error(`Parameter (${this.id}): Error in stringify. Cannot stringify FileParameter that has not been uploaded yet.`);
                }
                return <string>this.value;
            case this.type === PARAMETERTYPE.EVEN || this.type === PARAMETERTYPE.FLOAT || this.type === PARAMETERTYPE.INT || this.type === PARAMETERTYPE.ODD || this.type === PARAMETERTYPE.SINTEGER || this.type === PARAMETERTYPE.SNUMBER:
                return typeof this.value === 'string' ? this.value : (<number><unknown>this.value)+'';
            default:
                return <string>this.value;
        }
    }

    public updateDisplayName(value: string | undefined) {
        this.#inputValidator.validate(value, 'string', false);                
        (<any>this.displayName) = value;
    }

    public updateHidden(value: boolean) {
        this.#inputValidator.validate(value, 'boolean');
        (<any>this.hidden) = value;
    }

    public updateOrder(value: number | undefined) {
        this.#inputValidator.validate(value, 'number', false);
        (<any>this.order) = value;
    }

    public updateValue(value: T | string) {
        if(this.isValid(value)) {
            (<any>this.value) = value;
            (<any>this.lastValidatedValue) = this.value;
        } else {
            throw new Error(`Parameter (${this.id}): Could not validate value.`);
        }
    }

    // #endregion Public Methods (8)
}