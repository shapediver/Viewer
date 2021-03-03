export interface IDomEventListener {
    onKeyDown(event: KeyboardEvent): void;
    onMouseDown(event: MouseEvent): void;
    onMouseMove(event: MouseEvent): void;
    onMouseUp(event: MouseEvent): void;
    onMouseWheel(event: WheelEvent): void;
    onTouchEnd(event: TouchEvent): void;
    onTouchMove(event: TouchEvent): void;
    onTouchStart(event: TouchEvent): void;
}