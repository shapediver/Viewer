import { IRestrictionBase, RestrictionBaseProperties } from './IRestrictionBase';
import { RestrictionMetaData } from './IRestriction';
import { vec3 } from 'gl-matrix';

// #region Type aliases (1)

export type SnapRestrictionProperties = {
    /**
     * Priority of the restriction
     */
    priority: number;
} & RestrictionBaseProperties;

// #endregion Type aliases (1)

// #region Interfaces (1)

export interface ISnapRestriction extends IRestrictionBase {
    // #region Properties (2)

    /**
     * If the restriction is active.
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
