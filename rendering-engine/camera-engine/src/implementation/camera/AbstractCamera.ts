import * as detectIt from 'detect-it'
import { vec2, vec3 } from 'gl-matrix'
import {
    EventEngine,
    EVENTTYPE,
    IEvent,
    SettingsEngine,
    StateEngine,
} from '@shapediver/viewer.shared.services'
import { container } from 'tsyringe'
import { Box, IBox } from '@shapediver/viewer.shared.math'
import { AbstractTreeNodeData, ITreeNode } from '@shapediver/viewer.shared.node-tree'

import { ICameraControls } from '../../interfaces/controls/ICameraControls'
import { ICamera, ICameraOptions } from '../../interfaces/camera/ICamera'
import { CAMERA_TYPE } from '../../interfaces/ICameraEngine'

export abstract class AbstractCamera extends AbstractTreeNodeData implements ICamera {
    // #region Properties (23)

    #active: boolean = false;
    #autoAdjust: boolean = false;
    #cameraMovementDuration: number = 800;
    #defaultPosition: vec3 = vec3.create();
    #defaultTarget: vec3 = vec3.create();
    #enableCameraControls: boolean = true;
    #far: number = 1000;
    #name?: string;
    #near: number = 1;
    #node?: ITreeNode;
    #useNodeData: boolean = false;
    #order?: number;
    #revertAtMouseUp: boolean = false;
    #revertAtMouseUpDuration: number = 800;
    #zoomExtentsFactor: number = 1;

    protected readonly _eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);
    protected readonly _stateEngine: StateEngine = <StateEngine>container.resolve(StateEngine);

    protected _boundingBox: IBox = new Box();
    protected _position: vec3 = vec3.create();
    protected _target: vec3 = vec3.create();
    protected _viewportId?: string;

    protected abstract _controls: ICameraControls;

    // #endregion Properties (23)

    // #region Constructors (1)

    constructor(private readonly _id: string, private readonly _type: CAMERA_TYPE) {
        super(_id);
    }

    // #endregion Constructors (1)

    // #region Public Accessors (39)

    public get active(): boolean {
        return this.#active;
    }

    public set active(value: boolean) {
        this.#active = value;
    }

    public get autoAdjust(): boolean {
        return this.#autoAdjust;
    }

    public set autoAdjust(value: boolean) {
        this.#autoAdjust = value;
    }

    public set boundingBox(value: IBox) {
        this._boundingBox = value;
    }

    public get cameraMovementDuration(): number {
        return this.#cameraMovementDuration;
    }

    public set cameraMovementDuration(value: number) {
        this.#cameraMovementDuration = value;
    }

    public get controls(): ICameraControls {
        return this._controls;
    }

    public get defaultPosition(): vec3 {
        return this.#defaultPosition;
    }

    public set defaultPosition(value: vec3) {
        this.#defaultPosition = value;
    }

    public get defaultTarget(): vec3 {
        return this.#defaultTarget;
    }

    public set defaultTarget(value: vec3) {
        this.#defaultTarget = value;
    }

    public get enableCameraControls(): boolean {
        return this.#enableCameraControls;
    }

    public set enableCameraControls(value: boolean) {
        this.#enableCameraControls = value;
    }

    public get far(): number {
        return this.#far;
    }

    public set far(value: number) {
        this.#far = value;
    }

    public get id(): string {
        return this._id;
    }

    public get name(): string | undefined {
        return this.#name;
    }

    public set name(value: string | undefined) {
        this.#name = value;
    }

    public get near(): number {
        return this.#near;
    }

    public set near(value: number) {
        this.#near = value;
    }

    public get node(): ITreeNode | undefined {
        return this.#node;
    }

    public set node(value: ITreeNode | undefined) {
        this.#node = value;
    }

    public get useNodeData(): boolean {
        return this.#useNodeData;
    }

    public set useNodeData(value: boolean) {
        this.#useNodeData = value;
    }

    public get order(): number | undefined {
        return this.#order;
    }

    public set order(value: number | undefined) {
        this.#order = value;
    }

    public get position(): vec3 {
        return this._position;
    }

    public set position(value: vec3) {
        this._position = value;
        this._controls.position = value;
    }

    public get revertAtMouseUp(): boolean {
        return this.#revertAtMouseUp;
    }

    public set revertAtMouseUp(value: boolean) {
        this.#revertAtMouseUp = value;
    }

    public get revertAtMouseUpDuration(): number {
        return this.#revertAtMouseUpDuration;
    }

    public set revertAtMouseUpDuration(value: number) {
        this.#revertAtMouseUpDuration = value;
    }

    public get target(): vec3 {
        return this._target;
    }

    public set target(value: vec3) {
        this._target = value;
        this._controls.target = value;
    }

    public get type(): CAMERA_TYPE {
        return this._type;
    }

    public get viewportId(): string | undefined {
        return this._viewportId;
    }

    public get zoomExtentsFactor(): number {
        return this.#zoomExtentsFactor;
    }

    public set zoomExtentsFactor(value: number) {
        this.#zoomExtentsFactor = value;
    }

    // #endregion Public Accessors (39)

    // #region Public Methods (5)

    public async animate(path: { position: vec3; target: vec3; }[], options?: ICameraOptions): Promise<boolean> {
        if (path.length === 0) return Promise.resolve(false);

        if (!options) options = {};
        options.duration = options.duration! >= 0 ? options.duration : this.cameraMovementDuration;

        const res = await this._controls.animate(path, options);
        if (res) {
            this._position = this._controls.position;
            this._target = this._controls.target;
        }
        return res;
    }

    public reset(options?: ICameraOptions): Promise<boolean> {
        if ((this.defaultPosition[0] === 0 && this.defaultPosition[1] === 0 && this.defaultPosition[2] === 0) && (this.defaultTarget[0] === 0 && this.defaultTarget[1] === 0 && this.defaultTarget[2] === 0)) {
            return this.zoomTo(undefined, options);
        } else {
            return this.set(vec3.clone(this.defaultPosition), vec3.clone(this.defaultTarget), options);
        }
    }

    public async set(position: vec3, target: vec3, options?: ICameraOptions): Promise<boolean> {
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

    public update(time: number): boolean {
        if(this.useNodeData && this.node && this._viewportId) {
            return true;
        } else {
            const { position, target } = this._controls.update(time);
            let changed = true;
            if (vec3.equals(position, this.position) && vec3.equals(target, this.target)) 
                changed = false;
            
            this.position = vec3.clone(position);
            this.target = vec3.clone(target);
            return changed;
        }
    }

    public zoomTo(zoomTarget?: Box, options?: ICameraOptions): Promise<boolean> {
        const { position, target } = this.calculateZoomTo(zoomTarget)
        return this.set(position, target, options);
    }

    // #endregion Public Methods (5)

    // #region Public Abstract Methods (5)

    abstract applySettings(settingsEngine?: SettingsEngine): void;
    abstract assignViewer(viewportId: string): void;
    abstract calculateZoomTo(zoomTarget?: Box, startingPosition?: vec3, startingTarget?: vec3): { position: vec3; target: vec3; };
    abstract project(p: vec3): vec2;
    abstract unproject(p: vec3): vec3;

    // #endregion Public Abstract Methods (5)

    // #region Protected Methods (1)

    protected assignViewerInternal(viewportId: string, canvas: HTMLCanvasElement) {
        this._viewportId = viewportId;
        this._eventEngine.addListener(EVENTTYPE.SESSION.SESSION_CUSTOMIZED, (e: IEvent) => {
            if (this.#autoAdjust === true)
                this.zoomTo();
        });
        const revert = () => {
            if (this.#revertAtMouseUp === true)
                this.reset({ duration: this.#revertAtMouseUpDuration });
        };
        canvas.addEventListener("mouseup", () => revert(), detectIt.supportsPassiveEvents ? { capture: false, passive: true } : false);
        canvas.addEventListener("mouseout", () => revert(), detectIt.supportsPassiveEvents ? { capture: false, passive: true } : false);
        canvas.addEventListener("touchend", () => revert(), detectIt.supportsPassiveEvents ? { capture: false, passive: true } : false);

        let zoomResizeTimeout: NodeJS.Timeout;
        let mouseWheelEvent = /Firefox/i.test(navigator.userAgent) ? "DOMMouseScroll" : "mousewheel"; //FF doesn't recognize mousewheel as of FF3.x
        canvas.addEventListener(mouseWheelEvent,
            () => {
                clearTimeout(zoomResizeTimeout);
                zoomResizeTimeout = setTimeout(revert, 300);
            }, detectIt.supportsPassiveEvents ? { capture: false, passive: true } : false);
    }

    // #endregion Protected Methods (1)
}