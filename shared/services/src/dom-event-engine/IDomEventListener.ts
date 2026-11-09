export interface IDomEventListener {
	// #region Public Methods (8)

	onKeyDown(event: KeyboardEvent, pointerInCanvas: boolean): void;
	onKeyUp(event: KeyboardEvent, pointerInCanvas: boolean): void;
	onMouseWheel(event: WheelEvent): void;
	/**
	 * The browser cancelled the gesture of a pointer (pointercancel, e.g. a
	 * touch taken over by the browser). A pointerout usually follows.
	 */
	onPointerCancel?(event: PointerEvent): void;
	onPointerDown(event: PointerEvent): void;
	onPointerEnd(event: PointerEvent): void;
	onPointerMove(event: PointerEvent): void;
	onPointerOut(event: PointerEvent): void;
	onPointerUp(event: PointerEvent): void;

	// #endregion Public Methods (8)
}
