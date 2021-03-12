import { ICameraControls } from '../../controls/interface/ICameraControls';
import { CAMERATYPE, ICameraDefinition } from './ICameraEngine';

export interface ICamera {
    // #region Properties (11)

    readonly controls: ICameraControls;
    readonly id: string;
    readonly type: CAMERATYPE;

    autoAdjust: boolean;
    cameraDefinition: ICameraDefinition;
    cameraMovementDuration: number;
    default: ICameraDefinition;
    enableCameraControls: boolean;
    revertAtMouseUp: boolean;
    revertAtMouseUpDuration: number;
    zoomExtentsFactor: number;

    // #endregion Properties (11)

    // #region Public Methods (1)

    update(time: number): ICameraDefinition;

    // #endregion Public Methods (1)
}