export interface ICameraInterpolation {
    onUpdate(value: { delta: number }): void;
    onStop(value: { delta: number }): void;
    onComplete(value: { delta: number }): void;
}