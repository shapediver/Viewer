import { IRestrictionApi } from './IRestrictionApi';

export interface ISnapRestrictionApi extends IRestrictionApi {
    // #region Properties (2)

    /**
     * If the enabling or disabling of the restriction is allowed to the end user.
     * If it is not editable, the default value for enabling or disabling the restriction is used.
     */
    readonly enabledEditable: boolean;

    /**
     * The priority of the restriction.
     */
    priority: number;

    // #endregion Properties (2)
}