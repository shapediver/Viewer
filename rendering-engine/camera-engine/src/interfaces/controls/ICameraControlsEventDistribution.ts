import { IDomEventListener } from '@shapediver/viewer.shared.services';

export interface ICameraControlsEventDistribution extends IDomEventListener {
    // #region Public Methods (3)

    activateCameraEvents(): void;
    deactivateCameraEvents(): void;
    reset(): void;

    // #endregion Public Methods (3)
}