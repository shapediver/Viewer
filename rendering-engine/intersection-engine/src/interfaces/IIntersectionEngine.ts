import { IIntersection } from './IIntersection';
import { IIntersectionFilter } from './IIntersectionFilter';
import { IRay } from './IRay';

export interface IIntersectionEngine {
    // #region Public Methods (1)

    intersect(ray: IRay, viewportId: string, filterCriteria?: IIntersectionFilter[]): IIntersection[];

    // #endregion Public Methods (1)
}