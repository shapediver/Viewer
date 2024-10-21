import { IIntersection, IRay } from '@shapediver/viewer.rendering-engine.intersection-engine';
import {
    IRestriction,
    RayTraceResult,
    RestrictionMetaData,
    RestrictionProperties
} from './IRestriction';
import { ITreeNode } from '@shapediver/viewer.shared.node-tree';
import { mat4, vec3 } from 'gl-matrix';

export interface IRestrictionManager {
    // #region Properties (2)

    readonly restrictions: { [token: string]: IRestriction };

    showRestrictionVisualization: boolean;

    // #endregion Properties (2)

    // #region Public Methods (6)

    addRestriction(properties: RestrictionProperties, token?: string): string | undefined;
    close(): void;
    getRestriction(token: string): IRestriction | undefined;
    rayTrace(ray: IRay, metaData?: RestrictionMetaData): RayTraceResult | undefined;
    removeRestriction(token: string): boolean;
    setup(node: ITreeNode, ray: IRay, intersection: IIntersection, previousDragMatrix: mat4, dragOrigin?: vec3): RayTraceResult | undefined;

    // #endregion Public Methods (6)
}