
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
    FILE = 'File'
}

export enum PARAMETERVISUALIZATION {
    SLIDER = 'slider',
    SEQUENCE = 'sequence',
    CYCLE = 'cycle',
    DROPDOWN = 'dropdown',
    CHECKLIST = 'checklist',
    CLOCK = 'color',
    CALENDAR = 'calendar' 
}
export interface IParameter<T> {
    // #region Properties (12)

    readonly choices?: string[];
    readonly decimalplaces?: string;
    readonly defval: string;
    readonly format?: string[];
    readonly id: string;
    readonly max?: string;
    readonly min?: string;
    readonly name?: string;
    readonly note?: string;
    readonly type: PARAMETERTYPE;
    readonly visualization?: PARAMETERVISUALIZATION;

    value: T;

    // #endregion Properties (12)
}