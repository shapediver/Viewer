import { IDomEventListener } from '@shapediver/viewer.shared.services';
import { IManager } from '../../../interfaces/IManager';
import { IRay, IViewportApi } from '@shapediver/viewer.features.interaction';

// #region Type aliases (1)

type Callbacks = {
    onDown: (event: PointerEvent, ray: IRay) => void,
    onMove: (event: PointerEvent, ray: IRay) => void,
    onUp: (event: PointerEvent, ray: IRay) => void,
    onOut: (event: PointerEvent, ray: IRay) => void,
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

    // #region Public Methods (9)

    public close(): void {
        this.#viewport.removeCanvasEventListener(this.#canvasEventListenerToken);
    }

    public onKeyDown(event: KeyboardEvent): void {
        this.#callbacks.onKeyDown(event);
    }

    public onKeyUp(event: KeyboardEvent): void {
        this.#callbacks.onKeyUp(event);
    }

    public onMouseWheel(): void { }

    public onPointerDown(event: PointerEvent): void {
        const ray = this.#viewport.pointerEventToRay(event);
        this.#callbacks.onDown(event, ray);
    }

    public onPointerEnd(): void { }

    public onPointerMove(event: PointerEvent): void {
        const ray = this.#viewport.pointerEventToRay(event);
        this.#callbacks.onMove(event, ray);
    }

    public onPointerOut(event: PointerEvent): void {
        const ray = this.#viewport.pointerEventToRay(event);
        this.#callbacks.onOut(event, ray);
    }

    public onPointerUp(event: PointerEvent): void {
        const ray = this.#viewport.pointerEventToRay(event);
        this.#callbacks.onUp(event, ray);
    }

    // #endregion Public Methods (9)
}

// #endregion Classes (1)
