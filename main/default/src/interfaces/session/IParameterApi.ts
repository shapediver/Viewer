import { ShapeDiverResponseParameter } from "@shapediver/sdk.geometry-api-sdk-v2";

/**
 * The type of the parameter.
 */
export enum PARAMETER_TYPE {
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

/**
 * Different types of visualization for the parameter.
 * These types do not have to be used, but are specified in Grasshopper.
 */
export enum PARAMETER_VISUALIZATION {
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

/**
 * The api for a parameter of the corresponding [session]{@link ISessionApi}.
 * The current value can be changed by setting the {@link value} property.
 * Additional information of the parameter is provided, as well as values at different states.
 */
export interface IParameterApi<T> extends ShapeDiverResponseParameter {
    // #region Properties (3)

    /**
     * The last value that was successfully validated.
     */
    lastValidatedValue: T | string;

    /**
     * The value that is currently used in the session.
     */
    sessionValue: T | string;

    /**
     * The current value.
     */
    value: T | string;

    // #endregion Properties (3)

    // #region Public Methods (4)

    /**
     * Evaluates if a given value is valid for this parameter.
     * 
     * @param value the value to evaluate
     * @param throwError if true, an error is thrown if the value is not valid (default: false)
     */
    isValid(value: any, throwError?: boolean): boolean;

    /**
     * Resets the value to the default value.
     */
    resetToDefaultValue(): void;

    /**
     * Resets the value to the value currently used in the computed session.
     */
    resetToSessionValue(): void;
    
    /**
     * Returns the current value as a string
     */
    stringify(): string;

    // #endregion Public Methods (4)
}