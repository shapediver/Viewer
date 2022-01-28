
export enum JUSTIFICATION {
    TOP_LEFT = 'TL',
    TOP_CENTER = 'TC',
    TOP_RIGHT = 'TR',
    MIDDLE_LEFT = 'ML',
    MIDDLE_CENTER = 'MC',
    MIDDLE_RIGHT = 'MR',
    BOTTOM_LEFT = 'BL',
    BOTTOM_CENTER = 'BC',
    BOTTOM_RIGHT = 'BR'
}

export interface ITag3D {
    // #region Properties (6)

    color: string,
    justification: JUSTIFICATION,
    location: {
        normal: { X: number, Y: number, Z: number },
        yAxis: { X: number, Y: number, Z: number },
        xAxis: { X: number, Y: number, Z: number },
        origin: { X: number, Y: number, Z: number }
    },
    size?: number,
    text?: string,
    version: string

    // #endregion Properties (6)
}

export interface ITag2D {
    // #region Properties (4)

    color: any,
    location: { X: number, Y: number, Z: number }

    text: string,
    version: string,

    // #endregion Properties (4)
}

export interface IAnchorDataImage {
    // #region Properties (6)

    alt: string,
    height: number | string,
    hidden?: boolean,
    position?: {
        horizontal?: string,
        vertical?: string
    }

    src: string,
    width: number | string,

    // #endregion Properties (6)
}

export interface IAnchorDataText {
    // #region Properties (5)

    color?: any,
    hidden?: boolean,
    position?: {
        horizontal?: string,
        vertical?: string
    },
    text: string,
    textAlign?: string

    // #endregion Properties (5)
}

export interface IAnchor {
    // #region Properties (7)

    data?: IAnchorDataImage | IAnchorDataText,
    format?: 'text' | 'image',
    hideable?: boolean,
    intersectionTarget?: { min: { x: number, y: number, z: number }, max: { x: number, y: number, z: number } } | string | string[]
    location: { x: number, y: number, z: number },
    version: string,
    viewports?: [],

    // #endregion Properties (7)
}
