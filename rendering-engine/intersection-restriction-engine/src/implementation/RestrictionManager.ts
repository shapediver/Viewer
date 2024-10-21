import { GeometryMathManager } from './GeometryMathManager';
import { GeometryRestriction, GeometryRestrictionProperties } from './restrictions/geometry/GeometryRestriction';
import { IRay } from '@shapediver/viewer.rendering-engine.intersection-engine';
import {
    IRestriction,
    RESTRICTION_TYPE,
    RestrictionMetaData,
    RestrictionProperties
} from '../interfaces/IRestriction';
import { IRestrictionManager } from '../interfaces/IRestrictionManager';
import { ITreeNode } from '@shapediver/viewer.shared.node-tree';
import { IViewportApi } from '@shapediver/viewer';
import { IVisualizationSettings } from '../interfaces/IVisualizationSettings';
import { PlaneRestriction, PlaneRestrictionProperties } from './restrictions/plane/PlaneRestriction';
import { UuidGenerator } from '@shapediver/viewer.shared.services';
import { vec3 } from 'gl-matrix';

export class RestrictionManager implements IRestrictionManager {
    // #region Properties (7)

    readonly #geometryMathManager: GeometryMathManager;
    readonly #parentNode: ITreeNode;
    readonly #restrictions: { [token: string]: IRestriction } = {};
    readonly #settings: IVisualizationSettings;
    readonly #uuidGenerator = UuidGenerator.instance;
    readonly #viewport: IViewportApi;

    #showRestrictionVisualization: boolean = false;

    // #endregion Properties (7)

    // #region Constructors (1)

    constructor(
        viewport: IViewportApi,
        geometryMathManager: GeometryMathManager,
        parentNode: ITreeNode,
        restrictions: { [token: string]: RestrictionProperties },
        settings: IVisualizationSettings
    ) {
        this.#viewport = viewport;
        this.#geometryMathManager = geometryMathManager;
        this.#parentNode = parentNode;
        this.#settings = settings;

        for (const restrictionToken in restrictions) {
            this.addRestriction(restrictions[restrictionToken], restrictionToken);
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
            restriction = new PlaneRestriction(
                this.#viewport,
                this.#geometryMathManager,
                this.#parentNode,
                token,
                this.#settings,
                properties as PlaneRestrictionProperties
            );
        } else if (properties.type === RESTRICTION_TYPE.GEOMETRY) {
            restriction = new GeometryRestriction(
                this.#viewport,
                this.#geometryMathManager,
                this.#parentNode,
                token,
                this.#settings,
                properties as GeometryRestrictionProperties
            );
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

    public getRestriction(token: string): IRestriction | undefined {
        return this.#restrictions[token];
    }

    public rayTrace(ray: IRay, metaData?: RestrictionMetaData): vec3 | undefined {
        let rayTracingResult: {
            result: vec3 | undefined;
            distance: number;
            restriction: IRestriction;
        } | undefined = undefined;

        // create an array of arrays with the restrictions sorted by priority
        const restrictionsSorted = Object.values(this.#restrictions).sort((a, b) => (b.priority || 0) - (a.priority || 0));

        for (const restriction of restrictionsSorted) {
            if (rayTracingResult && rayTracingResult.restriction.priority > restriction.priority) break;

            const hit = restriction.rayTrace(ray, metaData);

            if (!hit) continue;
            const distance = vec3.squaredDistance(ray.origin, hit);
            if (distance < (rayTracingResult ? rayTracingResult.distance : Infinity)) {
                rayTracingResult = {
                    result: hit,
                    distance: distance,
                    restriction: restriction
                };
            }
        }

        // deactivate the visualization of all restrictions that are not hit
        for (const restriction of Object.values(this.#restrictions)) {
            if (rayTracingResult && restriction !== rayTracingResult.restriction) {
                for (const snapRestriction of Object.values(restriction.snapRestrictions)) {
                    snapRestriction.active = false;
                }
            }
        }
        return rayTracingResult?.result;
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