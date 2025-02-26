import * as THREE from 'three';
import { IIntersection, IIntersectionFilter, IRay } from '@shapediver/viewer.shared.types';

export interface IIntersectionEngine {
    // #region Public Methods (1)

    intersect(ray: IRay, viewportId: string, filterCriteria?: IIntersectionFilter[], rayCasterParams?: THREE.RaycasterParameters): IIntersection[];

    // #endregion Public Methods (1)
}