import { ICameraDefinition } from './ICameraEngine';

export interface ICameraControlsManager {
    // #region Public Methods (12)

    isWithinRestrictions(definition: ICameraDefinition): boolean;
    onKeyDown(event: KeyboardEvent): void;
    onMouseDown(event: MouseEvent): void;
    onMouseMove(event: MouseEvent): void;
    onMouseUp(event: MouseEvent): void;
    onMouseWheel(event: WheelEvent): void;
    onTouchEnd(event: TouchEvent): void;
    onTouchMove(event: TouchEvent): void;
    onTouchStart(event: TouchEvent): void;
    reset(): void;
    restrict(definition: ICameraDefinition): ICameraDefinition;
    update(time: number, manualInteraction: boolean): void;

    // #endregion Public Methods (12)
}