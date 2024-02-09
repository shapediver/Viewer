import { IRay } from '@shapediver/viewer.features.interaction';
import { IRestriction } from './IRestriction';
import { vec3 } from 'gl-matrix';

export interface IIntersectionRestriction extends IRestriction {
    // #region Public Methods (1)

    rayTrace(ray: IRay): vec3;

    // #endregion Public Methods (1)
}
