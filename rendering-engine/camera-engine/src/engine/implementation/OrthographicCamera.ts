import { SettingsEngine, StateEngine } from "@shapediver/viewer.shared.services";
import { Converter } from "@shapediver/viewer.shared.utils";
import { container } from "tsyringe";
import { CAMERATYPE } from "../interface/ICameraEngine";
import { AbstractCamera } from "./AbstractCamera";
import { vec3 } from "gl-matrix";
import { OrthographicCameraControls } from "../../controls/implementation/OrthographicCameraControls";

export class OrthographicCamera extends AbstractCamera {
    // #region Properties (7)

    private readonly _converter: Converter = <Converter>container.resolve(Converter);

    private _bottom: number = 100;
    private _left: number = 100;
    private _right: number = 100;
    private _top: number = 100;

    // #endregion Properties (7)

    // #region Constructors (1)

    constructor(id: string, _canvas: HTMLCanvasElement) {
        super(id, CAMERATYPE.ORTHOGRAPHIC);
        this._controls = new OrthographicCameraControls(this, _canvas, true);
        const applySettings = () => {
            let position = this._converter.toVec3(this._settingsEngine.camera.cameraTypes.orthographic.default.value.position);
            let target = this._converter.toVec3(this._settingsEngine.camera.cameraTypes.orthographic.default.value.target);
            if (vec3.equals(position, target)) {
                position = vec3.fromValues(0, 1, 0);
                target = vec3.create();
            }
            this.position = position;
            this.target = target;
        };
        this._stateEngine.firstSettingsRegistered.then(() => applySettings());
    }

    // #endregion Constructors (1)

    // #region Public Accessors (8)

    /**
     * Getter bottom
     * @return {number }
     */
    public get bottom(): number {
        return this._bottom;
    }

    /**
     * Setter bottom
     * @param {number } value
     */
    public set bottom(value: number) {
        this._bottom = value;
    }

    /**
     * Getter left
     * @return {number }
     */
    public get left(): number {
        return this._left;
    }

    /**
     * Setter left
     * @param {number } value
     */
    public set left(value: number) {
        this._left = value;
    }

    /**
     * Getter right
     * @return {number }
     */
    public get right(): number {
        return this._right;
    }

    /**
     * Setter right
     * @param {number } value
     */
    public set right(value: number) {
        this._right = value;
    }

    /**
     * Getter top
     * @return {number }
     */
    public get top(): number {
        return this._top;
    }

    /**
     * Setter top
     * @param {number } value
     */
    public set top(value: number) {
        this._top = value;
    }

    // #endregion Public Accessors (8)
}