import { POSTPROCESSINGTYPE } from "../IPostProcessingPass";
import { AbstractPass } from "./AbstractPass";

export class SAOPass extends AbstractPass {
    // #region Properties (9)

    private _bias: number = 0.5;
    private _blur: boolean = true;
    private _blurRadius: number = 8;
    private _blurRadiusCutoff: number = 0.01;
    private _blurRadiusStdDev: number = 4;
    private _intensity: number = 0.18;
    private _kernelRadius: number = 100;
    private _minResolution: number = 0;
    private _scale: number = 1;

    // #endregion Properties (9)

    // #region Constructors (1)

    constructor() {
        super(POSTPROCESSINGTYPE.SAO);
    }

    // #endregion Constructors (1)

    // #region Public Accessors (18)

    /**
     * Getter bias
     * @return {number}
     */
    public get bias(): number {
		return this._bias;
	}

    /**
     * Setter bias
     * @param {number} value
     */
    public set bias(value: number) {
		this._bias = value;
	}

    /**
     * Getter blur
     * @return {boolean}
     */
    public get blur(): boolean {
		return this._blur;
	}

    /**
     * Setter blur
     * @param {boolean} value
     */
    public set blur(value: boolean) {
		this._blur = value;
	}

    /**
     * Getter blurRadius
     * @return {number}
     */
    public get blurRadius(): number {
		return this._blurRadius;
	}

    /**
     * Setter blurRadius
     * @param {number} value
     */
    public set blurRadius(value: number) {
		this._blurRadius = value;
	}

    /**
     * Getter blurRadiusCutoff
     * @return {number}
     */
    public get blurRadiusCutoff(): number {
		return this._blurRadiusCutoff;
	}

    /**
     * Setter blurRadiusCutoff
     * @param {number} value
     */
    public set blurRadiusCutoff(value: number) {
		this._blurRadiusCutoff = value;
	}

    /**
     * Getter blurRadiusStdDev
     * @return {number}
     */
    public get blurRadiusStdDev(): number {
		return this._blurRadiusStdDev;
	}

    /**
     * Setter blurRadiusStdDev
     * @param {number} value
     */
    public set blurRadiusStdDev(value: number) {
		this._blurRadiusStdDev = value;
	}

    /**
     * Getter intensity
     * @return {number}
     */
    public get intensity(): number {
		return this._intensity;
	}

    /**
     * Setter intensity
     * @param {number} value
     */
    public set intensity(value: number) {
		this._intensity = value;
	}

    /**
     * Getter kernelRadius
     * @return {number}
     */
    public get kernelRadius(): number {
		return this._kernelRadius;
	}

    /**
     * Setter kernelRadius
     * @param {number} value
     */
    public set kernelRadius(value: number) {
		this._kernelRadius = value;
	}

    /**
     * Getter minResolution
     * @return {number}
     */
    public get minResolution(): number {
		return this._minResolution;
	}

    /**
     * Setter minResolution
     * @param {number} value
     */
    public set minResolution(value: number) {
		this._minResolution = value;
	}

    /**
     * Getter scale
     * @return {number}
     */
    public get scale(): number {
		return this._scale;
	}

    /**
     * Setter scale
     * @param {number} value
     */
    public set scale(value: number) {
		this._scale = value;
	}

    // #endregion Public Accessors (18)
}