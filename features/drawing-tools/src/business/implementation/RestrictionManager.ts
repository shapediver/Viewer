import { DrawingToolsManager } from './DrawingToolsManager';
import { IManager } from '../interfaces/IManager';
import { IRay } from '@shapediver/viewer.features.interaction';
import { IRestriction, RESTRICTION_TYPE, RestrictionMetaData, RestrictionProperties } from '../interfaces/IRestriction';
import { vec3 } from 'gl-matrix';
import { UuidGenerator } from '@shapediver/viewer.shared.services';
import { PlaneRestriction, PlaneRestrictionProperties } from './restrictions/plane/PlaneRestriction';

export class RestrictionManager implements IManager {
    // #region Properties (3)

    readonly #drawingToolsManager: DrawingToolsManager;
    readonly #restrictions: { [token: string]: IRestriction } = {};
    readonly #uuidGenerator = UuidGenerator.instance;

    #showRestrictionVisualization: boolean = false;

    // #endregion Properties (3)

    // #region Constructors (1)

    constructor(drawToolsManager: DrawingToolsManager) {
        this.#drawingToolsManager = drawToolsManager;

        for(const restrictionToken in this.#drawingToolsManager.settings.restrictions) {
            this.addRestriction(this.#drawingToolsManager.settings.restrictions[restrictionToken], restrictionToken);
        }
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (3)

    public get restrictions(): { [token: string]: IRestriction } {
        return this.#restrictions;
    }

    public get showRestrictionVisualization(): boolean {
        return this.#showRestrictionVisualization;
    }

    public set showRestrictionVisualization(value: boolean) {
        this.#showRestrictionVisualization = value;
        for (const restriction of Object.values(this.#restrictions)) {
            restriction.showVisualization = value;
            for (const snapRestriction of Object.values(restriction.snapRestrictions)) {
                snapRestriction.showVisualization = value;
            }
        }
    }

    // #endregion Public Getters And Setters (3)

    // #region Public Methods (5)

    public addRestriction(properties: RestrictionProperties, token?: string): string | undefined {
        token = token || this.#uuidGenerator.create();

        let restriction: IRestriction | undefined;
        if(properties.type === RESTRICTION_TYPE.PLANE) {
            restriction = new PlaneRestriction(this.#drawingToolsManager, token, properties as PlaneRestrictionProperties);
        }

        if(restriction) {
            this.#restrictions[token] = restriction;
            return token;
        }
        return;
    }

    public close(): void {
        Object.keys(this.#restrictions).forEach(key => this.removeRestriction(key));
    }

    public rayTrace(ray: IRay, metaData?: RestrictionMetaData): vec3 | undefined {
        let result: vec3 | undefined;
        let distance = Number.MAX_VALUE;
        for (const restriction of Object.values(this.#restrictions)) {
            const hit = restriction.rayTrace(ray);
            if (hit && vec3.squaredLength(hit) < distance) {
                result = hit;
                distance = vec3.squaredLength(hit);
            }
        }
        return result ? this.snap(result, metaData) : result;
    }

    public removeRestriction(token: string): void {
        if (this.#restrictions[token]) {
            Object.values(this.#restrictions[token].snapRestrictions).forEach(r => r.removeVisualization());
        }
    }

    public snap(point: vec3, metaData?: RestrictionMetaData): vec3 | undefined {
        let result: vec3 | undefined;
        let distance = Number.MAX_VALUE;

        for (const restriction of Object.values(this.#restrictions)) {
            const snapped = restriction.snap(point, metaData);
            if (snapped && vec3.squaredLength(snapped) < distance) {
                result = snapped;
                distance = vec3.squaredLength(snapped);
            }
        }
        return result || point;
    }

    // #endregion Public Methods (5)
}