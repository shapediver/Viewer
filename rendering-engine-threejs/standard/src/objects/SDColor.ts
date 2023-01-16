import * as THREE from 'three'

export class SDColor extends THREE.Color {
    // #region Properties (3)

    private readonly _convertedColor: string;
    private readonly _originalColor: any;

    private _colorCorrected: boolean = false;

    // #endregion Properties (3)

    // #region Constructors (1)

    constructor(originalColor: any, convertedColor: string) {
        super(convertedColor);

        this._originalColor = originalColor;
        this._convertedColor = convertedColor;
    }

    // #endregion Constructors (1)

    // #region Public Methods (1)

    public automaticColorAdjustment(toggle: boolean) {
        if(toggle === this._colorCorrected) return;

        if ((typeof this._originalColor === "string" && this._originalColor.startsWith('#')) ||
            (typeof this._originalColor === "string" && this._originalColor.startsWith('0x')) ||
            (typeof this._originalColor === "string" && !this._originalColor.startsWith('rgb'))) {

        }

        this._colorCorrected = toggle;
    }

    // #endregion Public Methods (1)
}