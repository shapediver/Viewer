import { IRestrictionApi } from './IRestrictionApi';

export interface ISnapRestrictionApi extends IRestrictionApi {
    // #region Properties (2)

    /**
     * If the restriction is available.
     * It can still be enabled or disabled if is available.
     * If it is not available, it cannot be enabled.
     */
    readonly available: boolean;

    /**
     * The priority of the restriction.
     */
    priority: number;

    // #endregion Properties (2)
}