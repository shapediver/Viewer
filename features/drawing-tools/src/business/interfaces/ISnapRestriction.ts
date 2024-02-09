import { IRestriction } from './IRestriction';
import { vec3 } from 'gl-matrix';

export interface ISnapRestriction extends IRestriction {
    // #region Public Methods (1)

    restrictPointPosition(point: vec3, index?: number): vec3;

    // #endregion Public Methods (1)
}
