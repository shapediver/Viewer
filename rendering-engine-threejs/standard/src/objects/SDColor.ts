import * as THREE from 'three'

export class SDColor extends THREE.Color {
    // #region Properties (3)

    private _colorSpace: 'srgb' | 'srgb-linear' = 'srgb';

    // #endregion Properties (3)

    // #region Constructors (1)

    constructor(hexColor: string) {
        super(hexColor);
    }

    // #endregion Constructors (1)

    // #region Public Methods (1)

    /**
     * Depending on the current state and provided value, this function converts the color to a different color space.
     * 
     * If the color is in 'srgb' space and active is set to true, it will be converted to 'srgb-linear' space.
     * If the color is in 'srgb-linear' space and active is set to false, it will be converted to 'srgb' space.
     * 
     * @param active 
     */
    public colorCorrection(active: boolean) {
        if(this._colorSpace === 'srgb' && active === true) {
            // we assume all colors provided are in 'srgb' color space
            // therefore we need to correct those colors to 'srgb-linear' if the color conversion is active
            this.convertSRGBToLinear();
            this._colorSpace = 'srgb-linear';
        } else if(this._colorSpace === 'srgb-linear' && active === false) {
            // if the color space is already 'srgb-linear', the color was already converted
            // therefore we need to convert it back if the color conversion was deactivted
            this.convertLinearToSRGB();
            this._colorSpace = 'srgb';
        }
    }

    // #endregion Public Methods (1)
}