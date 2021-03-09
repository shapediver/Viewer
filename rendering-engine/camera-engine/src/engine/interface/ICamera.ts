import { ICameraControls } from '../../controls/interface/ICameraControls';
import { CAMERATYPE, ICameraDefinition } from './ICameraEngine';

export interface ICamera {
    // #region Properties (3)

    readonly controls: ICameraControls;
    readonly type: CAMERATYPE;
    readonly id: string;

    cameraDefinition: ICameraDefinition;

    // #endregion Properties (3)

    // #region Public Methods (1)

    update(time: number): ICameraDefinition;

    // #endregion Public Methods (1)
}