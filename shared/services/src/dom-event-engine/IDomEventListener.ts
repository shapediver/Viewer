export interface IDomEventListener {
	// #region Public Methods (8)

	onKeyDown(event: KeyboardEvent): void;
	onKeyUp(event: KeyboardEvent): void;
	onMouseWheel(event: WheelEvent): void;
	onPointerDown(event: PointerEvent): void;
	onPointerEnd(event: PointerEvent): void;
	onPointerMove(event: PointerEvent): void;
	onPointerOut(event: PointerEvent): void;
	onPointerUp(event: PointerEvent): void;

	// #endregion Public Methods (8)
}
