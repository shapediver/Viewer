import { IDomEventListener } from '@shapediver/viewer.shared.services';
import { IManager } from '../interfaces/IManager';
import { IRay, IViewportApi } from '@shapediver/viewer.features.interaction';

// #region Type aliases (1)

type Callbacks = {
    onDown: (event: MouseEvent | TouchEvent, ray: IRay) => void,
    onMove: (event: MouseEvent | TouchEvent, ray: IRay) => void,
    onEnd: (event: MouseEvent | TouchEvent, ray: IRay) => void,
    onKeyDown: (event: KeyboardEvent) => void,
    onKeyUp: (event: KeyboardEvent) => void
}

// #endregion Type aliases (1)

// #region Classes (1)

export class EventManager implements IDomEventListener, IManager {
    // #region Properties (3)

    readonly #callbacks: Callbacks;
    readonly #canvasEventListenerToken: string;
    readonly #viewport: IViewportApi;

    // #endregion Properties (3)

    // #region Constructors (1)

    constructor(viewport: IViewportApi, callbacks: Callbacks) {
        this.#viewport = viewport;
        this.#callbacks = callbacks;
        this.#canvasEventListenerToken = this.#viewport.addCanvasEventListener(this);
    }

    // #endregion Constructors (1)

    // #region Public Methods (14)

    public close(): void {
        this.#viewport.removeCanvasEventListener(this.#canvasEventListenerToken);
    }

    public onKeyDown(event: KeyboardEvent): void {
        this.#callbacks.onKeyDown(event);
    }

    public onKeyUp(event: KeyboardEvent): void {
        this.#callbacks.onKeyUp(event);
    }

    public onMouseDown(event: MouseEvent): void {
        const ray = this.#viewport.mouseEventToRay(event);
        this.#callbacks.onDown(event, ray);
    }

    public onMouseEnd(event: MouseEvent): void {
        const ray = this.#viewport.mouseEventToRay(event);
        this.#callbacks.onEnd(event, ray);
    }

    public onMouseMove(event: MouseEvent): void {
        const ray = this.#viewport.mouseEventToRay(event);
        this.#callbacks.onMove(event, ray);
    }

    public onMouseOut(): void {
        // const ray = this.#viewport.mouseEventToRay(event);
        // this.#callbacks.onEnd(event, ray);
    }

    public onMouseUp(): void {
        // const ray = this.#viewport.mouseEventToRay(event);
        // this.#callbacks.onEnd(event, ray);
    }

    public onMouseWheel(): void { }

    public onTouchCancel(event: TouchEvent): void {
        if (event.touches.length > 1) return;
        const touch = event.changedTouches[0];

        const ray = this.#viewport.touchToRay(touch);
        this.#callbacks.onEnd(event, ray);
    }

    public onTouchEnd(event: TouchEvent): void {
        if (event.touches.length > 1) return;
        const touch = event.changedTouches[0];

        const ray = this.#viewport.touchToRay(touch);
        this.#callbacks.onEnd(event, ray);
    }

    public onTouchMove(event: TouchEvent): void {
        if (event.touches.length > 1) return;
        const touch = event.changedTouches[0];

        const ray = this.#viewport.touchToRay(touch);
        this.#callbacks.onMove(event, ray);
    }

    public onTouchStart(event: TouchEvent): void {
        if (event.touches.length > 1) return;
        const touch = event.changedTouches[0];

        const ray = this.#viewport.touchToRay(touch);
        this.#callbacks.onDown(event, ray);
    }

    public onTouchUp(event: TouchEvent): void {
        if (event.touches.length > 1) return;
        const touch = event.changedTouches[0];

        const ray = this.#viewport.touchToRay(touch);
        this.#callbacks.onEnd(event, ray);
    }

    // #endregion Public Methods (14)
}

// #endregion Classes (1)
