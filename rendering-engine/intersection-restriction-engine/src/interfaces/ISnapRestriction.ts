import { IRay } from '@shapediver/viewer.rendering-engine.intersection-engine';
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

export interface ISnapRestriction {
    // #region Properties (6)

    /**
     * The unique identifier of the restriction.
     */
    readonly id: string;

    /**
     * If the restriction is actively being used at the moment.
     */
    active: boolean;
    /**
     * Whether the restriction is enabled or not.
     */
    enabled: boolean;
    /**
     * If the enabling or disabling of the restriction is allowed to the end user.
     * If it is not editable, the default value for enabling or disabling the restriction is used.
     */
    enabledEditable: boolean;
    /**
     * The priority of the restriction.
     */
    priority: number;
    /**
     * Whether the visualization of the restriction is shown or not (if there is one).
     */
    showVisualization: boolean;

    // #endregion Properties (6)

    // #region Public Methods (2)

    /**
     * Remove the visualization of the restriction.
     */
    removeVisualization(): void;
    /**
     * Restrict the position of a point.
     * 
     * @param ray The ray that is used for the restriction.
     * @param point The position of the point.
     * @param metaData The meta data of the point.
     * @returns The restricted position of the point.
     */
    snap(ray: IRay, point: vec3, metaData?: RestrictionMetaData): vec3 | undefined;

    // #endregion Public Methods (2)
}

// #endregion Interfaces (1)
