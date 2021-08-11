import * as detectIt from 'detect-it'
import { mat4, quat, vec2, vec3 } from 'gl-matrix'
import { EventEngine, EVENTTYPE, IEvent, IViewerEvent, SettingsEngine, StateEngine } from '@shapediver/viewer.shared.services'
import { container } from 'tsyringe'
import { Box } from '@shapediver/viewer.shared.math'

import { ICameraControls } from '../../interfaces/controls/ICameraControls'
import { ICamera } from '../../interfaces/camera/ICamera'
import { CAMERATYPE } from '../../interfaces/ICameraEngine'
import { AbstractCameraControls } from '../controls/AbstractCameraControls'

export abstract class AbstractCamera implements ICamera {
    // #region Properties (17)

    private _autoAdjust: boolean = false;
    private _cameraMovementDuration: number = 800;
    private _defaultPosition: vec3 = vec3.create();
    private _defaultTarget: vec3 = vec3.create();
    private _enableCameraControls: boolean = true;
    private _far: number = 1000;
    private _near: number = 1;
    private _order?: number;
    private _revertAtMouseUp: boolean = false;
    private _revertAtMouseUpDuration: number = 800;
    private _zoomExtentsFactor: number = 1;

    protected readonly _eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);
    protected readonly _settingsEngine: SettingsEngine = <SettingsEngine>container.resolve(SettingsEngine);
    protected readonly _stateEngine: StateEngine = <StateEngine>container.resolve(StateEngine);

    protected _boundingBox: Box = new Box();
    protected _controls!: AbstractCameraControls;
    protected _position: vec3 = vec3.create();
    protected _target: vec3 = vec3.create();
    protected _updateCBs: (() => void)[] = [];

    // #endregion Properties (17)

    // #region Constructors (1)

    constructor(private readonly _viewerId: string, private readonly _id: string, private readonly _canvas: HTMLCanvasElement, private readonly _type: CAMERATYPE) {
        this._eventEngine.addListener(EVENTTYPE.SESSION.SESSION_CUSTOMIZED, (e: IEvent) => {
            const viewerEvent = <IViewerEvent>e;
            if (viewerEvent.viewerId === this._viewerId) 
                if (this._autoAdjust === true) 
                    this.zoomTo();
        });
        const revert = () => {
            if (this._revertAtMouseUp === true)
                this.reset({ duration: this._revertAtMouseUpDuration });
        };
        this._canvas.addEventListener("mouseup", () => revert(), detectIt.supportsPassiveEvents ? { capture: false, passive: true } : false);
        this._canvas.addEventListener("mouseout", () => revert(), detectIt.supportsPassiveEvents ? { capture: false, passive: true } : false);
        this._canvas.addEventListener("touchend", () => revert(), detectIt.supportsPassiveEvents ? { capture: false, passive: true } : false);

        let zoomResizeTimeout: NodeJS.Timeout;
        let mouseWheelEvent = /Firefox/i.test(navigator.userAgent) ? "DOMMouseScroll" : "mousewheel"; //FF doesn't recognize mousewheel as of FF3.x
        this._canvas.addEventListener(mouseWheelEvent,
            () => {
                clearTimeout(zoomResizeTimeout);
                zoomResizeTimeout = setTimeout(revert, 300);
            }, detectIt.supportsPassiveEvents ? { capture: false, passive: true } : false);
    }

    // #endregion Constructors (1)

    // #region Public Accessors (27)

    /**
     * Getter autoAdjust
     * @return {boolean}
     */
    public get autoAdjust(): boolean {
        return this._autoAdjust;
    }

    /**
     * Setter autoAdjust
     * @param {boolean} value
     */
    public set autoAdjust(value: boolean) {
        this._autoAdjust = value;
        this._updateCBs.forEach(v => v());
    }

    /**
     * Setter boundingBox
     * @param {Box} value
     */
    public set boundingBox(value: Box) {
        this._boundingBox = value;
        this._updateCBs.forEach(v => v());
    }

    /**
     * Getter cameraMovementDuration
     * @return {number}
     */
    public get cameraMovementDuration(): number {
        return this._cameraMovementDuration;
    }

    /**
     * Setter cameraMovementDuration
     * @param {number} value
     */
    public set cameraMovementDuration(value: number) {
        this._cameraMovementDuration = value;
        this._updateCBs.forEach(v => v());
    }

    /**
     * Getter controls
     * @return {ICameraControls}
     */
    public get controls(): ICameraControls {
        return this._controls;
    }

    /**
     * Getter defaultPosition
     * @return {vec3}
     */
    public get defaultPosition(): vec3 {
        return this._defaultPosition;
    }

    /**
     * Setter defaultPosition
     * @param {vec3} value
     */
    public set defaultPosition(value: vec3) {
        this._defaultPosition = value;
        this._updateCBs.forEach(v => v());
    }

    /**
     * Getter defaultTarget
     * @return {vec3}
     */
    public get defaultTarget(): vec3 {
        return this._defaultTarget;
    }

    /**
     * Setter defaultTarget
     * @param {vec3} value
     */
    public set defaultTarget(value: vec3) {
        this._defaultTarget = value;
        this._updateCBs.forEach(v => v());
    }

    /**
     * Getter enableCameraControls
     * @return {boolean}
     */
    public get enableCameraControls(): boolean {
        return this._enableCameraControls;
    }

    /**
     * Setter enableCameraControls
     * @param {boolean} value
     */
    public set enableCameraControls(value: boolean) {
        this._enableCameraControls = value;
        this._updateCBs.forEach(v => v());
    }

    /**
     * Getter far
     * @return {number }
     */
    public get far(): number {
        return this._far;
    }

    /**
     * Setter far
     * @param {number } value
     */
    public set far(value: number) {
        this._far = value;
        this._updateCBs.forEach(v => v());
    }

    /**
       * Getter id
       * @return {string}
       */
    public get id(): string {
        return this._id;
    }

    /**
     * Getter near
     * @return {number }
     */
    public get near(): number {
        return this._near;
    }

    /**
     * Setter near
     * @param {number } value
     */
    public set near(value: number) {
        this._near = value;
        this._updateCBs.forEach(v => v());
    }

    /**
     * Getter order
     * @return {number | undefined}
     */
    public get order(): number | undefined {
        return this._order;
    }

    /**
     * Setter order
     * @param {number | undefined} value
     */
    public set order(value: number | undefined) {
        this._order = value;
        this._updateCBs.forEach(v => v());
    }

    /**
     * Getter position
     * @return {vec3}
     */
    public get position(): vec3 {
        return this._position;
    }

    /**
     * Setter position
     * @param {vec3} value
     */
    public set position(value: vec3) {
        this._position = value;
        this._controls.position = value;
        this._updateCBs.forEach(v => v());
    }

    /**
     * Getter revertAtMouseUp
     * @return {boolean}
     */
    public get revertAtMouseUp(): boolean {
        return this._revertAtMouseUp;
    }

    /**
     * Setter revertAtMouseUp
     * @param {boolean} value
     */
    public set revertAtMouseUp(value: boolean) {
        this._revertAtMouseUp = value;
        this._updateCBs.forEach(v => v());
    }

    /**
     * Getter revertAtMouseUpDuration
     * @return {number}
     */
    public get revertAtMouseUpDuration(): number {
        return this._revertAtMouseUpDuration;
    }

    /**
     * Setter revertAtMouseUpDuration
     * @param {number} value
     */
    public set revertAtMouseUpDuration(value: number) {
        this._revertAtMouseUpDuration = value;
        this._updateCBs.forEach(v => v());
    }

    /**
     * Getter target
     * @return {vec3}
     */
    public get target(): vec3 {
        return this._target;
    }

    /**
     * Setter target
     * @param {vec3} value
     */
    public set target(value: vec3) {
        this._target = value;
        this._controls.target = value;
        this._updateCBs.forEach(v => v());
    }

    /**
     * Getter type
     * @return {CAMERATYPE}
     */
    public get type(): CAMERATYPE {
        return this._type;
    }

    /**
     * Getter zoomExtentsFactor
     * @return {number}
     */
    public get zoomExtentsFactor(): number {
        return this._zoomExtentsFactor;
    }

    /**
     * Setter zoomExtentsFactor
     * @param {number} value
     */
    public set zoomExtentsFactor(value: number) {
        this._zoomExtentsFactor = value;
        this._updateCBs.forEach(v => v());
    }

    // #endregion Public Accessors (27)

    // #region Public Methods (5)

    public async animate(path: { position: vec3; target: vec3; }[], options?: { easing?: string | Function | undefined; duration?: number | undefined; default?: boolean | undefined; coordinates?: string | undefined; interpolation?: string | Function | undefined; }): Promise<boolean> {
        if (path.length === 0) return Promise.resolve(false);

        if (!this._controls.isWithinRestrictions(path[path.length - 1].position, path[path.length - 1].target))
            return Promise.resolve(false);

        if (!options) options = {};
        options.duration = options.duration! >= 0 ? options.duration : this.cameraMovementDuration;

        const res = await this._controls.animate(path, options);
        if (res) {
            this._position = this._controls.position;
            this._target = this._controls.target;
        }
        return res;
    }

    public reset(options?: { easing?: string | Function | undefined; duration?: number | undefined; default?: boolean | undefined; coordinates?: string | undefined; interpolation?: string | Function | undefined; }): Promise<boolean> {
        if ((this.defaultPosition[0] === 0 && this.defaultPosition[1] === 0 && this.defaultPosition[2] === 0) && (this.defaultTarget[0] === 0 && this.defaultTarget[1] === 0 && this.defaultTarget[2] === 0)) {
            return this.zoomTo([], options);
        } else {
            return this.set(vec3.clone(this.defaultPosition), vec3.clone(this.defaultTarget), options);
        }
    }

    public async set(position: vec3, target: vec3, options?: { easing?: string | Function | undefined; duration?: number | undefined; default?: boolean | undefined; coordinates?: string | undefined; interpolation?: string | Function | undefined; }): Promise<boolean> {
        if (!this._controls.isWithinRestrictions(position, target))
            return Promise.resolve(false);

        if (!options) options = {};
        options.duration = options.duration! >= 0 ? options.duration : this.cameraMovementDuration;

        const res = await this._controls.animate([
            { position: vec3.clone(this.position), target: vec3.clone(this.target) },
            { position, target }], options);
        if (res) {
            this._position = this._controls.position;
            this._target = this._controls.target;
        }
        return res;
    }

    public update(time: number): {
        position: vec3,
        target: vec3
    } {
        const { position, target } = this._controls.update(time);
        this.position = vec3.clone(position);
        this.target = vec3.clone(target);
        return { position, target };
    }

    public zoomTo(zoomTarget?: string[] | Box, options?: { easing?: string | Function | undefined; duration?: number | undefined; default?: boolean | undefined; coordinates?: string | undefined; interpolation?: string | Function | undefined; }): Promise<boolean> {
        const { position, target } = this.getZoomPositionAndTarget(zoomTarget)
        return this.set(position, target, options);
    }

    // #endregion Public Methods (5)

    // #region Public Abstract Methods (2)

    abstract getZoomPositionAndTarget(zoomTarget?: string[] | Box): { position: vec3; target: vec3; };
    abstract project(p: vec3): vec2;
    abstract applySettings(): void;


    public addUpdateCB(value: () => void) {
        this._updateCBs.push(value)
    }

    // #endregion Public Abstract Methods (2)
}