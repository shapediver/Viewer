import { DrawingToolsManager, Settings } from '../../DrawingToolsManager';
import { IManager } from '../../../interfaces/IManager';
import { IRay } from '@shapediver/viewer.features.interaction';
import {
    IRestriction,
    RESTRICTION_TYPE,
    RestrictionMetaData,
    RestrictionProperties
} from '../../../interfaces/IRestriction';
import { PlaneRestriction, PlaneRestrictionProperties } from './restrictions/plane/PlaneRestriction';
import { GeometryRestriction, GeometryRestrictionProperties } from './restrictions/geometry/GeometryRestriction';
import { UuidGenerator } from '@shapediver/viewer.shared.services';
import { vec3 } from 'gl-matrix';

export class RestrictionManager implements IManager {
    // #region Properties (5)

    readonly #drawingToolsManager: DrawingToolsManager;
    readonly #restrictions: { [token: string]: IRestriction } = {};
    readonly #settings: Settings;
    readonly #uuidGenerator = UuidGenerator.instance;

    #showRestrictionVisualization: boolean = false;

    // #endregion Properties (5)

    // #region Constructors (1)

    constructor(drawingToolsManager: DrawingToolsManager) {
        this.#drawingToolsManager = drawingToolsManager;
        this.#settings = drawingToolsManager.settings;

        for (const restrictionToken in this.#settings.restrictions) {
            this.addRestriction(this.#settings.restrictions[restrictionToken], restrictionToken);
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
        if (properties.type === RESTRICTION_TYPE.PLANE) {
            restriction = new PlaneRestriction(this.#drawingToolsManager, token, properties as PlaneRestrictionProperties);
        } else if (properties.type === RESTRICTION_TYPE.GEOMETRY) {
            restriction = new GeometryRestriction(this.#drawingToolsManager, token, properties as GeometryRestrictionProperties);
        }

        if (restriction) {
            this.#restrictions[token] = restriction;
            return token;
        }
        return;
    }

    public close(): void {
        Object.keys(this.#restrictions).forEach(key => this.removeRestriction(key));
    }

    public rayTrace(ray: IRay, metaData?: RestrictionMetaData): vec3 | undefined {
        const rayTracingResult: {
            result: vec3 | undefined;
            distance: number;
            restriction: IRestriction | undefined;
        } = {
            result: undefined,
            distance: Number.MAX_VALUE,
            restriction: undefined
        };
        for (const restriction of Object.values(this.#restrictions)) {
            const hit = restriction.rayTrace(ray, metaData);
            if (hit && vec3.squaredLength(hit) < rayTracingResult.distance) {
                rayTracingResult.result = hit;
                rayTracingResult.distance = vec3.squaredLength(hit);
                rayTracingResult.restriction = restriction;
            }
        }

        // deactivate the visualization of all restrictions that are not hit
        for (const restriction of Object.values(this.#restrictions)) {
            if (restriction !== rayTracingResult.restriction) {
                for (const snapRestriction of Object.values(restriction.snapRestrictions)) {
                    snapRestriction.active = false;
                }
            }
        }
        return rayTracingResult.result;
    }

    public removeRestriction(token: string): void {
        if (this.#restrictions[token]) {
            Object.values(this.#restrictions[token].snapRestrictions).forEach(r => r.removeVisualization());
            this.#restrictions[token].removeVisualization();
            delete this.#restrictions[token];
        }
    }

    // #endregion Public Methods (5)
}