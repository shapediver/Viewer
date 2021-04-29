import { ShapeDiverResponseParameterGroup, ShapeDiverResponseParameterStructure } from "@shapediver/api.geometry-api-dto-v1";

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
export interface IParameter<T> {
    // #region Properties (12)

    readonly choices?: string[];
    readonly decimalplaces?: number;
    readonly defval: T;
    readonly format?: string[];
    readonly group?: ShapeDiverResponseParameterGroup;
    readonly id: string;
    readonly max?: number;
    readonly min?: number;
    readonly name: string;
    readonly note?: string;
    readonly structure?: ShapeDiverResponseParameterStructure;
    readonly tooltip?: string;
    readonly type: PARAMETERTYPE;
    readonly visualization: PARAMETERVISUALIZATION;

    hidden: boolean;
    displayName?: string;
    order?: number;

    value: T;

    // #endregion Properties (12)
}