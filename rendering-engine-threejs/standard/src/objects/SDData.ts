import { SDObject } from './SDObject';

export enum SD_DATA_TYPE {
    GEOMETRY = 'geometry',
    MATERIAL = 'material',
    THREEJS = 'threejs',
    LIGHT = 'light',
    CAMERA = 'camera',
    ANIMATION = 'animation',
    INTERACTION = 'interaction',
    HTML_ELEMENT_ANCHOR = 'html_element_anchor',
    CUSTOM = 'custom'
}

export class SDData extends SDObject {
    // #region Properties (1)

    #SDtype: SD_DATA_TYPE = SD_DATA_TYPE.CUSTOM;

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(
        SDid: string,
        SDversion: string
    ) {
        super(SDid, SDversion);
    }

    // #endregion Constructors (1)

    // #region Public Accessors (2)

    public get SDtype(): SD_DATA_TYPE {
        return this.#SDtype;
    }

    public set SDtype(value: SD_DATA_TYPE) {
        this.#SDtype = value;
    }

    // #endregion Public Accessors (2)
}