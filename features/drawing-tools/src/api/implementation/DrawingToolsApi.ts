import { AngularRestriction, AngularRestrictionProperties } from '../../business/implementation/restrictions/snap/AngularRestriction';
import { AngularRestrictionApi } from './restrictions/snap/AngularRestrictionApi';
import { CustomizationProperties, DrawingToolsManager } from '../../business/implementation/DrawingToolsManager';
import { GridRestriction, GridRestrictionProperties } from '../../business/implementation/restrictions/snap/GridRestriction';
import { GridRestrictionApi } from './restrictions/snap/GridRestrictionApi';
import { IDrawingToolsApi } from '../interfaces/IDrawingToolsApi';
import { IGeometryData, IViewportApi } from '@shapediver/viewer';
import { IRestrictionApi } from '../interfaces/IRestrictionApi';
import { PlaneRestriction, PlaneRestrictionProperties } from '../../business/implementation/restrictions/intersection/PlaneRestriction';
import { PlaneRestrictionApi } from './restrictions/intersection/PlaneRestrictionApi';
import { vec3 } from 'gl-matrix';

export class DrawingToolsApi implements IDrawingToolsApi {
    // #region Properties (2)

    readonly #drawingToolsManager: DrawingToolsManager;
    readonly #restrictions: { [key: string]: IRestrictionApi; } = {};

    // #endregion Properties (2)

    // #region Constructors (1)

    constructor(viewport: IViewportApi, callback: (geometryData: IGeometryData) => void, properties: CustomizationProperties) {
        this.#drawingToolsManager = new DrawingToolsManager(viewport, callback, properties);

        for(const token in this.#drawingToolsManager.restrictionManager.restrictions) {
            if(this.#drawingToolsManager.restrictionManager.restrictions[token] instanceof AngularRestriction)
                this.#restrictions[token] = new AngularRestrictionApi(this.#drawingToolsManager.restrictionManager.restrictions[token] as AngularRestriction);
            else if(this.#drawingToolsManager.restrictionManager.restrictions[token] instanceof GridRestriction)
                this.#restrictions[token] = new GridRestrictionApi(this.#drawingToolsManager.restrictionManager.restrictions[token] as GridRestriction);
            else if(this.#drawingToolsManager.restrictionManager.restrictions[token] instanceof PlaneRestriction)
                this.#restrictions[token] = new PlaneRestrictionApi(this.#drawingToolsManager.restrictionManager.restrictions[token] as PlaneRestriction);
        }
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (3)

    public get closed(): boolean {
        return this.#drawingToolsManager.closed;
    }

    public get geometryData(): IGeometryData {
        return this.#drawingToolsManager.geometryManager.geometryData;
    }

    public get restrictions(): { [key: string]: IRestrictionApi; } {
        return this.#restrictions;
    }

    // #endregion Public Getters And Setters (3)

    // #region Public Methods (7)

    public addAngularSnappingRestriction(angularProperties: AngularRestrictionProperties): AngularRestrictionApi {
        const token = this.#drawingToolsManager.addAngularSnappingRestriction(angularProperties);
        this.#restrictions[token] = new AngularRestrictionApi(this.#drawingToolsManager.restrictionManager.restrictions[token] as AngularRestriction);
        return this.#restrictions[token] as AngularRestrictionApi;
    }

    public addGridSnappingRestriction(gridProperties: GridRestrictionProperties): GridRestrictionApi {
        const token = this.#drawingToolsManager.addGridSnappingRestriction(gridProperties);
        this.#restrictions[token] = new GridRestrictionApi(this.#drawingToolsManager.restrictionManager.restrictions[token] as GridRestriction);
        return this.#restrictions[token] as GridRestrictionApi;
    }

    public addPlaneIntersectionRestriction(planeProperties: PlaneRestrictionProperties): PlaneRestrictionApi {
        const token = this.#drawingToolsManager.addPlaneIntersectionRestriction(planeProperties);
        this.#restrictions[token] = new PlaneRestrictionApi(this.#drawingToolsManager.restrictionManager.restrictions[token] as PlaneRestriction);
        return this.#restrictions[token] as PlaneRestrictionApi;
    }

    public addPoint(index: number, position?: vec3 | undefined): void {
        this.#drawingToolsManager.addPoint(index, position);
    }

    public close(): void {
        this.#drawingToolsManager.close();
    }

    public removePoint(index: number): void {
        this.#drawingToolsManager.removePoint(index);
    }

    public removeRestriction(token: string): void {
        this.#drawingToolsManager.removeRestriction(token);
        delete this.#restrictions[token];
    }

    // #endregion Public Methods (7)
}