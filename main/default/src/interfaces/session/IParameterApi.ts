import { ShapeDiverResponseParameter } from "@shapediver/sdk.geometry-api-sdk-v2";

/**
 * The type of the parameter.
 * ATOM: I suggest we add this enum to the Geometry Backend SDK and export it from there, the enum is already used in the backend.
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
 * Type of visualization which should be used for UI elements representing the parameter.
 * ATOM: I suggest we add this enum to the Geometry Backend SDK and export it from there, the enum is already used in the backend.
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
 * The api for a parameter of a corresponding [session]{@link ISessionApi}.
 * 
 * Parameters represent the channels through which data can be input into the model
 * represented by a session. 
 * 
 * The current value can be changed by setting the {@link value} property.
 */
export interface IParameterApi<T> extends ShapeDiverResponseParameter {
    // #region Properties (3)

    /**
     * The value that corresponds to the latest successful call to {@link ISessionApi.customize}.
     * This property will be updated immediately before {@link ISessionApi.customize} returns.
     */
    sessionValue: T | string;

    /**
     * The current value.
     * 
     * Validation happens immediately when setting this property. An error will be thrown in case
     * validation fails. Use {@link isValid} to test whether a value passes validation.
     * 
     * In case {@link ISessionApi.automaticSceneUpdate} is true, setting the value will immediately 
     * trigger a customization (see {@link ISessionApi.customize}).
     */
    value: T | string;

    // #endregion Properties (3)

    // #region Public Methods (4)

    /**
     * Evaluates if a given value is valid for this parameter.
     * 
     * @param value the value to evaluate
     * @param throwError if true, an error is thrown if validation does not pass (default: false)
     */
    isValid(value: any, throwError?: boolean): boolean;

    /**
     * Resets the value to the default value.
     */
    resetToDefaultValue(): void;

    /**
     * Resets the value to {@link sessionValue}.
     */
    resetToSessionValue(): void;
    
    /**
     * Returns the current value as a string
     */
    stringify(): string;

    // #endregion Public Methods (4)
}