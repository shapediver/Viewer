import { DrawingToolsManager } from './DrawingToolsManager';
import { IIntersectionRestriction } from '../interfaces/IIntersectionRestriction';
import { IManager } from '../interfaces/IManager';
import { IRay } from '@shapediver/viewer.features.interaction';
import { IRestriction, RestrictionType } from '../interfaces/IRestriction';
import { ISnapRestriction } from '../interfaces/ISnapRestriction';
import { vec3 } from 'gl-matrix';

export class RestrictionManager implements IManager {
    // #region Properties (4)

    readonly #drawingToolsManager: DrawingToolsManager;
    readonly #intersectionRestrictions: { [token: string]: IIntersectionRestriction } = {};
    readonly #snapRestrictions: { [token: string]: ISnapRestriction } = {};

    private _showRestrictionVisualization: boolean = false;

    // #endregion Properties (4)

    // #region Constructors (1)

    constructor(drawToolsManager: DrawingToolsManager) {
        this.#drawingToolsManager = drawToolsManager;
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (5)

    public get intersectionRestrictions(): { [token: string]: IIntersectionRestriction } {
        return this.#intersectionRestrictions;
    }

    public get restrictions(): { [token: string]: IRestriction } {
        return { ...this.#intersectionRestrictions, ...this.#snapRestrictions };
    }

    public get showRestrictionVisualization(): boolean {
        return this._showRestrictionVisualization;
    }

    public set showRestrictionVisualization(value: boolean) {
        this._showRestrictionVisualization = value;
        for (const restriction of Object.values(this.#snapRestrictions)) {
            restriction.showVisualization = value;
        }
        for (const restriction of Object.values(this.#intersectionRestrictions)) {
            restriction.showVisualization = value;
        }
    }

    public get snapRestrictions(): { [token: string]: ISnapRestriction } {
        return this.#snapRestrictions;
    }

    // #endregion Public Getters And Setters (5)

    // #region Public Methods (5)

    public addRestriction(restriction: IRestriction, token: string): void {
        if (restriction.restrictionType === RestrictionType.SNAP) {
            this.#snapRestrictions[token] = restriction as ISnapRestriction;
        } else {
            this.#intersectionRestrictions[token] = restriction as IIntersectionRestriction;
        }
    }

    public close(): void {
        for (const restriction of Object.values(this.#snapRestrictions)) {
            restriction.removeVisualization();
        }
        for (const restriction of Object.values(this.#intersectionRestrictions)) {
            restriction.removeVisualization();
        }
    }

    public rayTrace(ray: IRay, index?: number): vec3 {
        // ray trace through all restrictions and return the closest hit
        let result = vec3.create();
        let distance = Number.MAX_VALUE;
        for (const restriction of Object.values(this.#intersectionRestrictions)) {
            const hit = restriction.rayTrace(ray);
            if (vec3.length(hit) < distance) {
                result = hit;
                distance = vec3.length(hit);
            }
        }
        return this.restrictPoint(result, index);
    }

    public removeRestriction(token: string): void {
        if (this.#snapRestrictions[token]) {
            this.#snapRestrictions[token].removeVisualization();
            delete this.#snapRestrictions[token];
        }

        if (this.#intersectionRestrictions[token]) {
            this.#intersectionRestrictions[token].removeVisualization();
            delete this.#intersectionRestrictions[token];
        }
    }

    public restrictPoint(point: vec3, index?: number): vec3 {
        let result = vec3.clone(point);
        for (const restriction of Object.values(this.#snapRestrictions)) {
            result = restriction.restrictPointPosition(result, index);
        }
        return result;
    }

    // #endregion Public Methods (5)
}