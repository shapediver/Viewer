import { container } from 'tsyringe'
import { UuidGenerator } from '../uuid-generator/UuidGenerator';

import { IDomEventListener } from './IDomEventListener'

export class DomEventEngine {
    // #region Properties (3)

    private readonly _uuidGenerator: UuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);
    private readonly _domEventListeners: {
        [key: string]: IDomEventListener
    } = {};
    private _canvas: HTMLCanvasElement;
    private _currentMousePosition: { x: number, y: number } = { x: 0, y: 0 };

    // #endregion Properties (3)

    // #region Constructors (1)

    constructor(private readonly _viewerId: string, canvas: HTMLCanvasElement) {
        this._canvas = canvas;
        this.addEventListeners();
    }

    // #endregion Constructors (1)

    // #region Public Accessors (1)

    public addDomEventListener(listener: IDomEventListener): string {
        const id = this._uuidGenerator.create();
        this._domEventListeners[id] = listener;
        return id;
    }

    public removeDomEventListener(id: string): boolean {
        if(this._domEventListeners[id]) {
            delete this._domEventListeners[id];
            return true;
        }
        return false;
    }

    public removeAllDomEventListener(): void {
        for(let id in this._domEventListeners)
            delete this._domEventListeners[id];
    }

    // #endregion Public Accessors (1)

    // #region Public Methods (1)

    public dispose() {
        this.removeEventListeners();
    }

    // #endregion Public Methods (1)

    // #region Private Methods (12)

    private addEventListeners() {
        this._canvas.addEventListener("mousewheel", this.onMouseWheel.bind(this));
        this._canvas.addEventListener("MozMousePixelScroll", this.onMouseWheel.bind(this)); // firefox

        this._canvas.addEventListener("mousedown", this.onMouseDown.bind(this), { passive: false });
        this._canvas.addEventListener("mousemove", this.onMouseMove.bind(this), { passive: false });
        this._canvas.addEventListener("mouseup", this.onMouseUp.bind(this), { passive: false });
        this._canvas.addEventListener("mouseout", this.onMouseUp.bind(this), { passive: false });

        window.addEventListener("touchstart", this.onTouchStart.bind(this), { passive: false });
        window.addEventListener("touchmove", this.onTouchMove.bind(this), { passive: false });
        window.addEventListener("touchend", this.onTouchEnd.bind(this), { passive: false });
        window.addEventListener("touchcancel", this.onTouchEnd.bind(this), { passive: false });

        window.addEventListener("keydown", this.onKeyDown.bind(this), { passive: false });
        window.addEventListener("mousemove", this.onKeyDownMousePositionHelper.bind(this), { passive: false });

        // just prevent right click menu
        this._canvas.addEventListener("contextmenu", this.onContextMenu.bind(this), { passive: false });
    }

    private onContextMenu(event: MouseEvent): void {
        event.preventDefault();
    }

    private onKeyDown(event: KeyboardEvent): void {
        if (this._canvas === document.elementFromPoint(this._currentMousePosition.x, this._currentMousePosition.y))
            Object.values(this._domEventListeners).forEach(e => e.onKeyDown(event));
    }

    private onKeyDownMousePositionHelper(event: MouseEvent): void {
        this._currentMousePosition = { x: event.pageX, y: event.pageY };
    }

    private onMouseDown(event: MouseEvent): void {
        event.preventDefault();
        Object.values(this._domEventListeners).forEach(e => e.onMouseDown(event));
    }

    private onMouseMove(event: MouseEvent): void {
        event.preventDefault();
        Object.values(this._domEventListeners).forEach(e => e.onMouseMove(event));
    }

    private onMouseUp(event: MouseEvent): void {
        event.preventDefault();
        Object.values(this._domEventListeners).forEach(e => e.onMouseUp(event));
    }

    private onMouseWheel(event: Event): void {
        event.preventDefault();
        event.stopPropagation();
        Object.values(this._domEventListeners).forEach(e => e.onMouseWheel(<WheelEvent>event));
    }

    private onTouchEnd(event: TouchEvent): void {
        if (this._canvas === document.elementFromPoint(this._currentMousePosition.x, this._currentMousePosition.y)) {
            event.preventDefault();
            Object.values(this._domEventListeners).forEach(e => e.onTouchEnd(event));
        }
    }

    private onTouchMove(event: TouchEvent): void {
        if (this._canvas === document.elementFromPoint(this._currentMousePosition.x, this._currentMousePosition.y)) {
            event.preventDefault();
            Object.values(this._domEventListeners).forEach(e => e.onTouchMove(event))
        }
    }

    private onTouchStart(event: TouchEvent): void {
        if (event.composedPath().includes(this._canvas)) {
            event.preventDefault();
            Object.values(this._domEventListeners).forEach(e => e.onTouchStart(event));
        }
    }

    private removeEventListeners() {
        this._canvas.removeEventListener("mousewheel", this.onMouseWheel.bind(this), false);
        this._canvas.removeEventListener("MozMousePixelScroll", this.onMouseWheel.bind(this), false); // firefox

        this._canvas.removeEventListener("mousedown", this.onMouseDown.bind(this), false);
        this._canvas.removeEventListener("mousemove", this.onMouseMove.bind(this), false);
        this._canvas.removeEventListener("mouseup", this.onMouseUp.bind(this), false);
        this._canvas.removeEventListener("mouseout", this.onMouseUp.bind(this), false);

        this._canvas.removeEventListener("touchstart", this.onTouchStart.bind(this), false);
        this._canvas.removeEventListener("touchmove", this.onTouchMove.bind(this), false);
        this._canvas.removeEventListener("touchend", this.onTouchEnd.bind(this), false);

        window.removeEventListener("keydown", this.onKeyDown.bind(this), false);
        window.removeEventListener("mousemove", this.onKeyDownMousePositionHelper.bind(this), false);
        this._canvas.removeEventListener("contextmenu", this.onContextMenu.bind(this), false);
    }

    // #endregion Private Methods (12)
}
