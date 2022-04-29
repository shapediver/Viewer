import { container } from 'tsyringe'
import { UuidGenerator } from '../uuid-generator/UuidGenerator';

import { IDomEventListener } from './IDomEventListener'

export class DomEventEngine {
    // #region Properties (5)

    private readonly _domEventListeners: {
        [key: string]: IDomEventListener
    } = {};
    private readonly _uuidGenerator: UuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);

    private _allowListeners = {
        mousewheel: true,
        mousedown: true,
        mousemove: true,
        mouseup: true,
        mouseout: true,
        touchstart: true,
        touchmove: true,
        touchend: true,
        touchcancel: true,
        keydown: true,
        contextmenu: true,
    };
    private _canvas: HTMLCanvasElement;
    private _currentMousePosition: { x: number, y: number } = { x: 0, y: 0 };
    private _onMouseWheel: (event: Event) => void;
    private _onMouseDown: (event: MouseEvent) => void;
    private _onMouseMove: (event: MouseEvent) => void;
    private _onKeyDownMousePositionHelper: (event: MouseEvent) => void;
    private _onMouseUp: (event: MouseEvent) => void;
    private _onTouchStart: (event: TouchEvent) => void;
    private _onTouchMove: (event: TouchEvent) => void;
    private _onTouchEnd: (event: TouchEvent) => void;
    private _onKeyDown: (event: KeyboardEvent) => void;
    private _onContextMenu: (event: MouseEvent) => void;

    // #endregion Properties (5)

    // #region Constructors (1)

    constructor(private readonly _viewerId: string, canvas: HTMLCanvasElement) {
        this._canvas = canvas;
        this._onMouseWheel = this.onMouseWheel.bind(this);
        this._onMouseDown = this.onMouseDown.bind(this);
        this._onMouseMove = this.onMouseMove.bind(this)
        this._onKeyDownMousePositionHelper = this.onKeyDownMousePositionHelper.bind(this)
        this._onMouseUp = this.onMouseUp.bind(this)
        this._onTouchStart = this.onTouchStart.bind(this)
        this._onTouchMove = this.onTouchMove.bind(this)
        this._onTouchEnd = this.onTouchEnd.bind(this)
        this._onKeyDown = this.onKeyDown.bind(this)
        this._onContextMenu = this.onContextMenu.bind(this)

        this.addEventListeners();
    }

    // #endregion Constructors (1)

    // #region Public Methods (5)

    public addDomEventListener(listener: IDomEventListener): string {
        const id = this._uuidGenerator.create();
        this._domEventListeners[id] = listener;
        return id;
    }

    /**
     * Allow / disallow events.
     * This can be used to disable events for a specific viewer.
     * 
     * Example use case: If you don't want to allow mouse wheel events for a specific viewer so that users can scroll past the viewer.
     * 
     * Be aware that this might cause some issues with the the camera controls if the mouse / touch events are disabled only partially.
     * 
     * @param allowedListeners 
     */
    public allowEventListeners(allowedListeners: {
        mousewheel?: boolean,
        mousedown?: boolean,
        mousemove?: boolean,
        mouseup?: boolean,
        mouseout?: boolean,
        touchstart?: boolean,
        touchmove?: boolean,
        touchend?: boolean,
        touchcancel?: boolean,
        keydown?: boolean,
        contextmenu?: boolean,
    }): void {
        if (allowedListeners.mousewheel !== undefined && this._allowListeners.mousewheel !== allowedListeners.mousewheel) {
            if (allowedListeners.mousewheel) {
                this._canvas.addEventListener("mousewheel", this._onMouseWheel, { passive: false });
                this._canvas.addEventListener("MozMousePixelScroll", this._onMouseWheel, { passive: false }); // firefox
            } else {
                this._canvas.removeEventListener("mousewheel", this._onMouseWheel, false);
                this._canvas.removeEventListener("MozMousePixelScroll", this._onMouseWheel, false); // firefox
            }
            this._allowListeners.mousewheel = allowedListeners.mousewheel;
        }

        if (allowedListeners.mousedown !== undefined && this._allowListeners.mousedown !== allowedListeners.mousedown) {
            if (allowedListeners.mousedown) {
                this._canvas.addEventListener("mousedown", this._onMouseDown, { passive: false });
            } else {
                this._canvas.removeEventListener("mousedown", this._onMouseDown, false);
            }
            this._allowListeners.mousedown = allowedListeners.mousedown;
        }

        if (allowedListeners.mousemove !== undefined && this._allowListeners.mousemove !== allowedListeners.mousemove) {
            if (allowedListeners.mousemove) {
                this._canvas.addEventListener("mousemove", this._onMouseMove, { passive: false });
                window.addEventListener("mousemove", this._onKeyDownMousePositionHelper, { passive: false });
            } else {
                this._canvas.removeEventListener("mousemove", this._onMouseMove, false);
                window.removeEventListener("mousemove", this._onKeyDownMousePositionHelper, false);
            }
            this._allowListeners.mousemove = allowedListeners.mousemove;
        }

        if (allowedListeners.mouseup !== undefined && this._allowListeners.mouseup !== allowedListeners.mouseup) {
            if (allowedListeners.mouseup) {
                this._canvas.addEventListener("mouseup", this._onMouseUp, { passive: false });
            } else {
                this._canvas.removeEventListener("mouseup", this._onMouseUp, false);
            }
            this._allowListeners.mouseup = allowedListeners.mouseup;
        }

        if (allowedListeners.mouseout !== undefined && this._allowListeners.mouseout !== allowedListeners.mouseout) {
            if (allowedListeners.mouseout) {
                this._canvas.addEventListener("mouseout", this._onMouseUp, { passive: false });
            } else {
                this._canvas.removeEventListener("mouseout", this._onMouseUp, false);
            }
            this._allowListeners.mouseout = allowedListeners.mouseout;
        }

        if (allowedListeners.touchstart !== undefined && this._allowListeners.touchstart !== allowedListeners.touchstart) {
            if (allowedListeners.touchstart) {
                window.addEventListener("touchstart", this._onTouchStart, { passive: false });
            } else {
                window.removeEventListener("touchstart", this._onTouchStart, false);
            }
            this._allowListeners.touchstart = allowedListeners.touchstart;
        }

        if (allowedListeners.touchmove !== undefined && this._allowListeners.touchmove !== allowedListeners.touchmove) {
            if (allowedListeners.touchmove) {
                window.addEventListener("touchmove", this._onTouchMove, { passive: false });
            } else {
                window.removeEventListener("touchmove", this._onTouchMove, false);
            }
            this._allowListeners.touchmove = allowedListeners.touchmove;
        }

        if (allowedListeners.touchend !== undefined && this._allowListeners.touchend !== allowedListeners.touchend) {
            if (allowedListeners.touchend) {
                window.addEventListener("touchend", this._onTouchEnd, { passive: false });
            } else {
                window.removeEventListener("touchend", this._onTouchEnd, false);
            }
            this._allowListeners.touchend = allowedListeners.touchend;
        }

        if (allowedListeners.touchcancel !== undefined && this._allowListeners.touchcancel !== allowedListeners.touchcancel) {
            if (allowedListeners.touchcancel) {
                window.addEventListener("touchcancel", this._onTouchEnd, { passive: false });
            } else {
                window.removeEventListener("touchcancel", this._onTouchEnd, false);
            }
            this._allowListeners.touchcancel = allowedListeners.touchcancel;
        }

        if (allowedListeners.keydown !== undefined && this._allowListeners.keydown !== allowedListeners.keydown) {
            if (allowedListeners.keydown) {
                window.addEventListener("keydown", this._onKeyDown, { passive: false });
            } else {
                window.removeEventListener("keydown", this._onKeyDown, false);
            }
            this._allowListeners.keydown = allowedListeners.keydown;
        }

        if (allowedListeners.contextmenu !== undefined && this._allowListeners.contextmenu !== allowedListeners.contextmenu) {
            if (allowedListeners.contextmenu) {
                this._canvas.addEventListener("contextmenu", this._onContextMenu, { passive: false });
            } else {
                this._canvas.removeEventListener("contextmenu", this._onContextMenu, false);
            }
            this._allowListeners.contextmenu = allowedListeners.contextmenu;
        }
    }

    public dispose() {
        this.removeEventListeners();
    }

    public removeAllDomEventListener(): void {
        for(let id in this._domEventListeners)
            delete this._domEventListeners[id];
    }

    public removeDomEventListener(id: string): boolean {
        if(this._domEventListeners[id]) {
            delete this._domEventListeners[id];
            return true;
        }
        return false;
    }

    // #endregion Public Methods (5)

    // #region Private Methods (12)

    private addEventListeners() {
        this._canvas.addEventListener("mousewheel", this._onMouseWheel, { passive: false });
        this._canvas.addEventListener("MozMousePixelScroll", this._onMouseWheel, { passive: false }); // firefox

        this._canvas.addEventListener("mousedown", this._onMouseDown, { passive: false });
        this._canvas.addEventListener("mousemove", this._onMouseMove, { passive: false });
        this._canvas.addEventListener("mouseup", this._onMouseUp, { passive: false });
        this._canvas.addEventListener("mouseout", this._onMouseUp, { passive: false });

        window.addEventListener("touchstart", this._onTouchStart, { passive: false });
        window.addEventListener("touchmove", this._onTouchMove, { passive: false });
        window.addEventListener("touchend", this._onTouchEnd, { passive: false });
        window.addEventListener("touchcancel", this._onTouchEnd, { passive: false });

        window.addEventListener("keydown", this._onKeyDown, { passive: false });
        window.addEventListener("mousemove", this._onKeyDownMousePositionHelper, { passive: false });

        // just prevent right click menu
        this._canvas.addEventListener("contextmenu", this._onContextMenu, { passive: false });
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
        if (event.composedPath().includes(this._canvas)) {
            event.preventDefault();
            Object.values(this._domEventListeners).forEach(e => e.onTouchEnd(event));
        }
    }

    private onTouchMove(event: TouchEvent): void {
        if (event.composedPath().includes(this._canvas)) {
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
        this._canvas.removeEventListener("mousewheel", this._onMouseWheel);
        this._canvas.removeEventListener("MozMousePixelScroll", this._onMouseWheel); // firefox

        this._canvas.removeEventListener("mousedown", this._onMouseDown, false);
        this._canvas.removeEventListener("mousemove", this._onMouseMove, false);
        this._canvas.removeEventListener("mouseup", this._onMouseUp, false);
        this._canvas.removeEventListener("mouseout", this._onMouseUp, false);

        window.removeEventListener("touchstart", this._onTouchStart, false);
        window.removeEventListener("touchmove", this._onTouchMove, false);
        window.removeEventListener("touchend", this._onTouchEnd, false);
        window.removeEventListener("touchcancel", this._onTouchEnd, false);

        window.removeEventListener("keydown", this._onKeyDown, false);
        window.removeEventListener("mousemove", this._onKeyDownMousePositionHelper, false);
        this._canvas.removeEventListener("contextmenu", this._onContextMenu, false);
    }

    // #endregion Private Methods (12)
}
