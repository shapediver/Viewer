import { IRestrictionBase } from './IRestrictionBase';
import { RestrictionMetaData } from './IRestriction';
import { vec3 } from 'gl-matrix';

// #region Type aliases (1)

export type SnapRestrictionProperties = {
    /**
     * If the restriction should be enabled by default.
     */
    enabled?: boolean;
    /**
     * If the enabling or disabling of the restriction is allowed to the end user.
     * If it is not editable, the default value for enabling or disabling the restriction is used.
     */
    enabledEditable?: boolean;
    /**
     * Priority of the restriction.
     * The higher the priority, the sooner the restriction is applied.
     * If the priority is the same, the result that is closer to the original point is chosen.
     */
    priority?: number;
    /**
     * The activation key of the restriction.
     * If the key is not provided, no key is assigned.
     * If the key is provided, the restriction is only active when the key is pressed.
     */
    activationKey?: string;
};

// #endregion Type aliases (1)

// #region Interfaces (1)

export interface ISnapRestriction extends IRestrictionBase {
    // #region Properties (2)

    /**
     * If the enabling or disabling of the restriction is allowed to the end user.
     * If it is not editable, the default value for enabling or disabling the restriction is used.
     */
    enabledEditable: boolean;

    /**
     * If the restriction is actively being used at the moment.
     */
    active: boolean;

    /**
     * The priority of the restriction.
     */
    priority: number;

    // #endregion Properties (2)

    // #region Public Methods (1)

    /**
     * Restrict the position of a point.
     * 
     * @param point The position of the point.
     * @param metaData The meta data of the point.
     * @returns The restricted position of the point.
     */
    snap(point: vec3, metaData?: RestrictionMetaData): vec3 | undefined;

    // #endregion Public Methods (1)
}

// #endregion Interfaces (1)
