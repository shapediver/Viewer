export interface ICameraInterpolation {
    // #region Public Methods (3)

    onComplete(value: { delta: number }): void;
    onStop(value: { delta: number }): void;
    onUpdate(value: { delta: number }): void;

    // #endregion Public Methods (3)
}