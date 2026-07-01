import {UuidGenerator} from "../uuid-generator/UuidGenerator";
import {type IDomEventListener} from "./IDomEventListener";

export class DomEventEngine {
	// #region Properties (15)

	private readonly _domEventListeners: {
		[key: string]: IDomEventListener;
	} = {};
	private readonly _uuidGenerator: UuidGenerator = UuidGenerator.instance;

	private _allowListeners = {
		mousewheel: true,
		pointerdown: true,
		pointermove: true,
		pointerup: true,
		pointerout: true,
		keydown: true,
		keyup: true,
		contextmenu: true,
	};
	private _canvas: HTMLCanvasElement;
	private _currentPointerPosition: {x: number; y: number} = {x: 0, y: 0};
	private _onContextMenu: (event: MouseEvent) => void;
	private _onKeyDown: (event: KeyboardEvent) => void;
	private _onKeyDownPointerPositionHelper: (event: PointerEvent) => void;
	private _onKeyUp: (event: KeyboardEvent) => void;
	private _onMouseWheel: (event: Event) => void;
	private _onPointerDown: (event: PointerEvent) => void;
	private _onPointerMove: (event: PointerEvent) => void;
	private _onPointerOut: (event: PointerEvent) => void;
	private _onPointerUp: (event: PointerEvent) => void;
	private _restrictedListenerTokens: string[] = [];

	// #endregion Properties (15)

	// #region Constructors (1)

	constructor(canvas: HTMLCanvasElement) {
		this._canvas = canvas;
		this._onMouseWheel = this.onMouseWheel.bind(this);
		this._onPointerDown = this.onPointerDown.bind(this);
		this._onPointerMove = this.onPointerMove.bind(this);
		this._onKeyDownPointerPositionHelper =
			this.onKeyDownPointerPositionHelper.bind(this);
		this._onPointerUp = this.onPointerUp.bind(this);
		this._onPointerOut = this.onPointerOut.bind(this);
		this._onKeyDown = this.onKeyDown.bind(this);
		this._onKeyUp = this.onKeyUp.bind(this);
		this._onContextMenu = this.onContextMenu.bind(this);

		this.addEventListeners();
	}

	// #endregion Constructors (1)

	// #region Public Methods (7)

	public addDomEventListener(listener: IDomEventListener): string {
		const id = this._uuidGenerator.create();
		this._domEventListeners[id] = listener;
		return id;
	}

	public addRestrictedListenerToken(token: string): void {
		if (this._restrictedListenerTokens.includes(token)) return;
		this._restrictedListenerTokens.push(token);
	}

	/**
	 * Allow / disallow events.
	 * This can be used to disable events for a specific viewer.
	 *
	 * Example use case: If you don't want to allow mouse wheel events for a specific viewer so that users can scroll past the viewer.
	 *
	 * Be aware that this might cause some issues with the the camera controls if the pointer events are disabled only partially.
	 *
	 * @param allowedListeners
	 */
	public allowEventListeners(allowedListeners: {
		mousewheel?: boolean;
		pointerdown?: boolean;
		pointermove?: boolean;
		pointerup?: boolean;
		pointerout?: boolean;
		keydown?: boolean;
		keyup?: boolean;
		contextmenu?: boolean;
	}): void {
		if (typeof window === undefined) return;

		if (
			allowedListeners.mousewheel !== undefined &&
			this._allowListeners.mousewheel !== allowedListeners.mousewheel
		) {
			if (allowedListeners.mousewheel) {
				this._canvas.addEventListener("mousewheel", this._onMouseWheel);
				this._canvas.addEventListener(
					"MozMousePixelScroll",
					this._onMouseWheel,
				); // firefox
			} else {
				this._canvas.removeEventListener(
					"mousewheel",
					this._onMouseWheel,
				);
				this._canvas.removeEventListener(
					"MozMousePixelScroll",
					this._onMouseWheel,
				); // firefox
			}
			this._allowListeners.mousewheel = allowedListeners.mousewheel;
		}

		if (
			allowedListeners.pointerdown !== undefined &&
			this._allowListeners.pointerdown !== allowedListeners.pointerdown
		) {
			if (allowedListeners.pointerdown) {
				this._canvas.addEventListener(
					"pointerdown",
					this._onPointerDown,
				);
			} else {
				this._canvas.removeEventListener(
					"pointerdown",
					this._onPointerDown,
				);
			}
			this._allowListeners.pointerdown = allowedListeners.pointerdown;
		}

		if (
			allowedListeners.pointermove !== undefined &&
			this._allowListeners.pointermove !== allowedListeners.pointermove
		) {
			if (allowedListeners.pointermove) {
				this._canvas.addEventListener(
					"pointermove",
					this._onPointerMove,
				);
				window.addEventListener(
					"pointermove",
					this._onKeyDownPointerPositionHelper,
				);
			} else {
				this._canvas.removeEventListener(
					"pointermove",
					this._onPointerMove,
				);
				window.removeEventListener(
					"pointermove",
					this._onKeyDownPointerPositionHelper,
				);
			}
			this._allowListeners.pointermove = allowedListeners.pointermove;
		}

		if (
			allowedListeners.pointerup !== undefined &&
			this._allowListeners.pointerup !== allowedListeners.pointerup
		) {
			if (allowedListeners.pointerup) {
				this._canvas.addEventListener("pointerup", this._onPointerUp);
			} else {
				this._canvas.removeEventListener(
					"pointerup",
					this._onPointerUp,
				);
			}
			this._allowListeners.pointerup = allowedListeners.pointerup;
		}

		if (
			allowedListeners.pointerout !== undefined &&
			this._allowListeners.pointerout !== allowedListeners.pointerout
		) {
			if (allowedListeners.pointerout) {
				this._canvas.addEventListener("pointerout", this._onPointerOut);
			} else {
				this._canvas.removeEventListener(
					"pointerout",
					this._onPointerOut,
				);
			}
			this._allowListeners.pointerout = allowedListeners.pointerout;
		}

		if (
			allowedListeners.keydown !== undefined &&
			this._allowListeners.keydown !== allowedListeners.keydown
		) {
			if (allowedListeners.keydown) {
				window.addEventListener("keydown", this._onKeyDown);
			} else {
				window.removeEventListener("keydown", this._onKeyDown);
			}
			this._allowListeners.keydown = allowedListeners.keydown;
		}

		if (
			allowedListeners.keyup !== undefined &&
			this._allowListeners.keyup !== allowedListeners.keyup
		) {
			if (allowedListeners.keyup) {
				window.addEventListener("keyup", this._onKeyUp);
			} else {
				window.removeEventListener("keyup", this._onKeyUp);
			}
			this._allowListeners.keyup = allowedListeners.keyup;
		}

		if (
			allowedListeners.contextmenu !== undefined &&
			this._allowListeners.contextmenu !== allowedListeners.contextmenu
		) {
			if (allowedListeners.contextmenu) {
				this._canvas.addEventListener(
					"contextmenu",
					this._onContextMenu,
				);
			} else {
				this._canvas.removeEventListener(
					"contextmenu",
					this._onContextMenu,
				);
			}
			this._allowListeners.contextmenu = allowedListeners.contextmenu;
		}
	}

	public dispose() {
		this.removeEventListeners();
	}

	public removeAllDomEventListener(): void {
		for (const id in this._domEventListeners)
			delete this._domEventListeners[id];

		this._restrictedListenerTokens = [];
	}

	public removeDomEventListener(id: string): boolean {
		if (this._domEventListeners[id]) {
			delete this._domEventListeners[id];
			this._restrictedListenerTokens =
				this._restrictedListenerTokens.filter((t) => t !== id);
			return true;
		}
		return false;
	}

	public removeRestrictedListenerToken(token: string): void {
		const index = this._restrictedListenerTokens.indexOf(token);
		if (index !== -1) this._restrictedListenerTokens.splice(index, 1);
	}

	// #endregion Public Methods (7)

	// #region Private Methods (11)

	private addEventListeners() {
		if (typeof window === undefined) return;

		this._canvas.addEventListener("mousewheel", this._onMouseWheel);
		this._canvas.addEventListener(
			"MozMousePixelScroll",
			this._onMouseWheel,
		); // firefox

		this._canvas.addEventListener("pointerdown", this._onPointerDown);
		this._canvas.addEventListener("pointermove", this._onPointerMove);
		this._canvas.addEventListener("pointerup", this._onPointerUp);
		this._canvas.addEventListener("pointerout", this._onPointerOut);

		window.addEventListener("keyup", this._onKeyUp);
		window.addEventListener("keydown", this._onKeyDown);
		window.addEventListener(
			"pointermove",
			this._onKeyDownPointerPositionHelper,
		);

		// just prevent right click menu
		this._canvas.addEventListener("contextmenu", this._onContextMenu);
	}

	private onContextMenu(event: MouseEvent): void {
		event.preventDefault();
	}

	private onKeyDown(event: KeyboardEvent): void {
		const pointerInCanvas =
			this._canvas ===
			document.elementFromPoint(
				this._currentPointerPosition.x,
				this._currentPointerPosition.y,
			);

		Object.entries(this._domEventListeners).forEach(([key, listener]) => {
			if (
				this._restrictedListenerTokens.length === 0 ||
				this._restrictedListenerTokens.includes(key)
			) {
				listener.onKeyDown(event, pointerInCanvas);
			}
		});
	}

	private onKeyDownPointerPositionHelper(event: PointerEvent): void {
		this._currentPointerPosition = {x: event.pageX, y: event.pageY};
	}

	private onKeyUp(event: KeyboardEvent): void {
		const pointerInCanvas =
			this._canvas ===
			document.elementFromPoint(
				this._currentPointerPosition.x,
				this._currentPointerPosition.y,
			);
		Object.entries(this._domEventListeners).forEach(([key, listener]) => {
			if (
				this._restrictedListenerTokens.length === 0 ||
				this._restrictedListenerTokens.includes(key)
			) {
				listener.onKeyUp(event, pointerInCanvas);
			}
		});
	}

	private onMouseWheel(event: Event): void {
		event.preventDefault();
		event.stopPropagation();
		Object.entries(this._domEventListeners).forEach(([key, listener]) => {
			if (
				this._restrictedListenerTokens.length === 0 ||
				this._restrictedListenerTokens.includes(key)
			) {
				listener.onMouseWheel(<WheelEvent>event);
			}
		});
	}

	private onPointerDown(event: PointerEvent): void {
		event.preventDefault();
		Object.entries(this._domEventListeners).forEach(([key, listener]) => {
			if (
				this._restrictedListenerTokens.length === 0 ||
				this._restrictedListenerTokens.includes(key)
			) {
				listener.onPointerDown(event);
			}
		});
	}

	private onPointerMove(event: PointerEvent): void {
		event.preventDefault();
		Object.entries(this._domEventListeners).forEach(([key, listener]) => {
			if (
				this._restrictedListenerTokens.length === 0 ||
				this._restrictedListenerTokens.includes(key)
			) {
				listener.onPointerMove(event);
			}
		});
	}

	private onPointerOut(event: PointerEvent): void {
		event.preventDefault();
		Object.entries(this._domEventListeners).forEach(([key, listener]) => {
			if (
				this._restrictedListenerTokens.length === 0 ||
				this._restrictedListenerTokens.includes(key)
			) {
				listener.onPointerOut(event);
				listener.onPointerEnd(event);
			}
		});
	}

	private onPointerUp(event: PointerEvent): void {
		event.preventDefault();
		Object.entries(this._domEventListeners).forEach(([key, listener]) => {
			if (
				this._restrictedListenerTokens.length === 0 ||
				this._restrictedListenerTokens.includes(key)
			) {
				listener.onPointerUp(event);
				listener.onPointerEnd(event);
			}
		});
	}

	private removeEventListeners() {
		if (typeof window === undefined) return;

		this._canvas.removeEventListener("mousewheel", this._onMouseWheel);
		this._canvas.removeEventListener(
			"MozMousePixelScroll",
			this._onMouseWheel,
		); // firefox

		this._canvas.removeEventListener("pointerdown", this._onPointerDown);
		this._canvas.removeEventListener("pointermove", this._onPointerMove);
		this._canvas.removeEventListener("pointerup", this._onPointerUp);
		this._canvas.removeEventListener("pointerout", this._onPointerOut);

		window.removeEventListener("keydown", this._onKeyDown);
		window.removeEventListener("keyup", this._onKeyUp);
		window.removeEventListener(
			"pointermove",
			this._onKeyDownPointerPositionHelper,
		);
		this._canvas.removeEventListener("contextmenu", this._onContextMenu);
	}

	// #endregion Private Methods (11)
}
