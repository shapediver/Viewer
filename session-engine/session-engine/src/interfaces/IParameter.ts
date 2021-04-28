export enum PARAMETERTYPE {
    FLOAT = 'float',
    INT = 'int',
    EVEN = 'even',
    ODD = 'odd',
    STRING = 'string',
    COLOR = 'color',
    STRINGLIST = 'stringlist',
    BOOL = 'bool',
    TIME = 'time',
    FILE = 'file'
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
    readonly id: string;
    readonly max?: number;
    readonly min?: number;
    readonly name: string;
    readonly note?: string;
    readonly type: PARAMETERTYPE;
    readonly visualization: PARAMETERVISUALIZATION;

    hidden: boolean;
    displayName?: string;
    order?: number;

    value: T;

    // #endregion Properties (12)
}