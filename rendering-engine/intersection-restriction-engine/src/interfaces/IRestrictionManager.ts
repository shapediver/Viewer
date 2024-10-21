import { IRay } from '@shapediver/viewer.rendering-engine.intersection-engine';
import { IRestriction, RestrictionMetaData, RestrictionProperties } from './IRestriction';
import { vec3 } from 'gl-matrix';

export interface IRestrictionManager {
    // #region Properties (2)

    readonly restrictions: { [token: string]: IRestriction };

    showRestrictionVisualization: boolean;

    // #endregion Properties (2)

    // #region Public Methods (5)

    addRestriction(properties: RestrictionProperties, token?: string): string | undefined;
    close(): void;
    getRestriction(token: string): IRestriction | undefined;
    rayTrace(ray: IRay, metaData?: RestrictionMetaData): vec3 | undefined;
    removeRestriction(token: string): void;

    // #endregion Public Methods (5)
}